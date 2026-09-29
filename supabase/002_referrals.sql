-- ============================================================================
-- 002_referrals.sql — run ONCE in Supabase SQL Editor (after schema.sql).
-- Safe to re-run.
--
-- 1. Referral program
--      Friend joins with your code and buys MONTHLY plan  -> you earn Rs 500
--      Friend joins with your code and buys 2-YEAR plan   -> you earn Rs 3000
--      One reward per friend (on their first approved payment).
--      The reward unlocks on the 5th of the month AFTER the friend's payment is
--      approved. Once unlocked the customer can withdraw it. Admin pays by UPI,
--      enters the UTR and marks it paid; the customer sees the UTR in their dashboard.
-- 2. Duplicate UTR / transaction IDs are rejected (a UTR can be used only once).
-- 3. GST invoice numbers (ZT/2026-27/0001 ...), assigned when a payment is approved.
-- 4. Promo-code expiry.
-- 5. Security hardening (customers can no longer edit their own plan/status or
--    insert fake "approved" payments).
-- ============================================================================

-- 1. Columns ------------------------------------------------------------------
alter table public.profiles add column if not exists own_referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);
alter table public.profiles add column if not exists upi_id text;
alter table public.promo_codes add column if not exists expires_at timestamptz;
alter table public.payments add column if not exists invoice_number text;
alter table public.payments add column if not exists invoice_date date;

-- 2. Clean up any earlier experimental versions of this file ------------------
drop function if exists public.request_withdrawal(text);
drop function if exists public.get_my_credit();
drop function if exists public.submit_payment(text, text, boolean, text, text, text);
drop function if exists public.refund_payment_credit(uuid);
drop table if exists public.withdrawals;
drop table if exists public.commission_credit_uses;

-- 3. Referral code generator + backfill ---------------------------------------
create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare c text;
begin
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.profiles where own_referral_code = c);
  end loop;
  return c;
end;
$$;

update public.profiles set own_referral_code = public.generate_referral_code()
where own_referral_code is null;

update public.profiles p set referred_by = r.id
from public.profiles r
where p.referred_by is null
  and p.referral_code is not null
  and r.own_referral_code = upper(trim(p.referral_code))
  and r.id <> p.id;

-- New profiles: own code + link the referrer. A separate BEFORE INSERT trigger,
-- so your existing handle_new_user() and notification triggers stay untouched.
create or replace function public.set_referral_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.referral_code is not null then
    new.referral_code := nullif(upper(trim(new.referral_code)), '');
  end if;
  if new.own_referral_code is null then
    new.own_referral_code := public.generate_referral_code();
  end if;
  if new.referral_code is not null and new.referred_by is null then
    select id into new.referred_by from public.profiles
    where own_referral_code = new.referral_code limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_referral_fields on public.profiles;
create trigger profiles_set_referral_fields
  before insert on public.profiles
  for each row execute function public.set_referral_fields();

-- 4. Commissions ---------------------------------------------------------------
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null unique references public.profiles(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  amount numeric not null,
  created_at timestamptz not null default now()
);
alter table public.commissions alter column amount drop default;
alter table public.commissions add column if not exists plan text;
alter table public.commissions add column if not exists payable_on date;
alter table public.commissions add column if not exists status text not null default 'pending';
alter table public.commissions add column if not exists requested_at timestamptz;
alter table public.commissions add column if not exists payout_upi text;
alter table public.commissions add column if not exists payout_utr text;
alter table public.commissions add column if not exists paid_at timestamptz;
alter table public.commissions drop column if exists used_amount;

update public.commissions set status = 'pending' where status not in ('pending', 'requested', 'paid');
update public.commissions c
set plan = coalesce(c.plan, (select p.plan from public.payments p where p.id = c.payment_id), 'monthly'),
    payable_on = coalesce(c.payable_on, (date_trunc('month', c.created_at) + interval '1 month' + interval '4 days')::date)
where c.plan is null or c.payable_on is null;

alter table public.commissions alter column payable_on set not null;
alter table public.commissions drop constraint if exists commissions_status_check;
alter table public.commissions add constraint commissions_status_check
  check (status in ('pending', 'requested', 'paid'));
alter table public.commissions drop constraint if exists commissions_plan_check;
alter table public.commissions add constraint commissions_plan_check
  check (plan in ('monthly', 'onetime'));

alter table public.commissions enable row level security;
drop policy if exists "commissions_select_own" on public.commissions;
create policy "commissions_select_own" on public.commissions
  for select using (auth.uid() = referrer_id);

revoke all on public.commissions from anon, authenticated;
grant select on public.commissions to authenticated;

-- 5. RPC: my referred friends + rewards (first name only, for privacy) ---------
drop function if exists public.get_my_referrals();
create function public.get_my_referrals()
returns table (
  name text, joined_at timestamptz, plan text, amount numeric,
  payable_on date, status text, paid_at timestamptz, payout_utr text
)
language sql
security definer
set search_path = public
stable
as $$
  select split_part(p.full_name, ' ', 1), p.created_at, c.plan, c.amount,
         c.payable_on, c.status, c.paid_at, c.payout_utr
  from public.profiles p
  left join public.commissions c on c.referred_user_id = p.id
  where p.referred_by = auth.uid()
  order by p.created_at desc;
$$;

-- 6. RPC: withdraw everything that has unlocked (payable_on <= today, IST) -----
create or replace function public.request_payout(p_upi text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_total numeric;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_upi is null or trim(p_upi) !~ '^[A-Za-z0-9._-]{2,}@[A-Za-z0-9]{2,}$' then
    raise exception 'Enter a valid UPI ID (like name@bank)';
  end if;

  with moved as (
    update public.commissions
    set status = 'requested', requested_at = now(), payout_upi = trim(p_upi)
    where referrer_id = v_uid and status = 'pending' and payable_on <= v_today
    returning amount
  )
  select coalesce(sum(amount), 0) into v_total from moved;

  if v_total <= 0 then
    raise exception 'Nothing to withdraw yet. Rewards unlock on the 5th of the month after your friend''s payment.';
  end if;

  update public.profiles set upi_id = trim(p_upi) where id = v_uid;

  begin
    insert into public.notifications (audience, type, title, message, link)
    values ('admin', 'withdrawal', 'New referral withdrawal request',
            'Rs ' || v_total || ' to ' || trim(p_upi), '/admin/payouts');
  exception when others then
    null; -- never block a withdrawal because of the bell
  end;

  return v_total;
end;
$$;

-- 7. Duplicate UTR protection --------------------------------------------------
-- (marks older duplicates instead of deleting them, so the index can be created)
update public.payments p set utr = p.utr || '-DUP' || substr(p.id::text, 1, 4)
from (
  select id, row_number() over (
           partition by upper(regexp_replace(utr, '\s', '', 'g')) order by created_at, id) as rn
  from public.payments where utr is not null
) d
where p.id = d.id and d.rn > 1;

create unique index if not exists payments_utr_unique
  on public.payments (upper(regexp_replace(utr, '\s', '', 'g'))) where utr is not null;

create or replace function public.is_utr_used(p_utr text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.payments
    where utr is not null
      and upper(regexp_replace(utr, '\s', '', 'g')) = upper(regexp_replace(coalesce(p_utr, ''), '\s', '', 'g'))
  );
$$;

-- 8. GST invoice numbers: ZT/<financial year>/<running no>, e.g. ZT/2026-27/0001 --
create table if not exists public.invoice_counters (
  fy text primary key,
  last_no int not null default 0
);
alter table public.invoice_counters enable row level security;
revoke all on public.invoice_counters from anon, authenticated;

create unique index if not exists payments_invoice_number_unique
  on public.payments (invoice_number) where invoice_number is not null;

create or replace function public.assign_invoice_number(p_payment_id uuid, p_prefix text default 'ZT')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_existing text;
  v_ist date := (now() at time zone 'Asia/Kolkata')::date;
  v_start int;
  v_fy text;
  v_no int;
  v_number text;
begin
  select status, invoice_number into v_status, v_existing
  from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if v_existing is not null then return v_existing; end if;
  if v_status <> 'approved' then raise exception 'Invoice is available only for approved payments'; end if;

  v_start := case when extract(month from v_ist) >= 4
                  then extract(year from v_ist)::int else extract(year from v_ist)::int - 1 end;
  v_fy := v_start || '-' || lpad(((v_start + 1) % 100)::text, 2, '0');

  insert into public.invoice_counters (fy, last_no) values (v_fy, 1)
  on conflict (fy) do update set last_no = public.invoice_counters.last_no + 1
  returning last_no into v_no;

  v_number := p_prefix || '/' || v_fy || '/' || lpad(v_no::text, 4, '0');
  update public.payments set invoice_number = v_number, invoice_date = v_ist where id = p_payment_id;
  return v_number;
end;
$$;

-- 9. Promo codes: respect expiry, ignore letter case ---------------------------
create or replace function public.validate_promo_code(p_code text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_discount int;
begin
  select discount_percent into v_discount from public.promo_codes
  where code = upper(trim(p_code)) and (expires_at is null or expires_at > now());
  if v_discount is not null then
    update public.promo_codes set usage_count = usage_count + 1 where code = upper(trim(p_code));
  end if;
  return v_discount;
end;
$$;

-- 10. Function permissions ------------------------------------------------------
revoke execute on function public.get_my_referrals(), public.request_payout(text), public.is_utr_used(text)
  from public, anon;
grant execute on function public.get_my_referrals(), public.request_payout(text), public.is_utr_used(text)
  to authenticated;

revoke execute on function public.assign_invoice_number(uuid, text) from public, anon, authenticated;
grant execute on function public.assign_invoice_number(uuid, text) to service_role;

-- 11. SECURITY HARDENING -------------------------------------------------------
-- Customers may only change their UPI id; new payments must be 'pending' with no
-- invoice/approval fields; everything else is done by the admin panel.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (upi_id) on public.profiles to authenticated;

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments
  for insert with check (
    auth.uid() = user_id and status = 'pending'
    and approved_at is null and approved_by is null and invoice_number is null
  );
revoke update, delete on public.payments from anon, authenticated;
