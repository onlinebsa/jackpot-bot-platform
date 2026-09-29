-- ============================================================================
-- Jackpot Bot / Jackpot Bot — Supabase schema
-- Run this once in Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES (extends auth.users with all the signup-form fields)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  email text not null,
  whatsapp_number text not null,
  calling_number text not null,
  tradingview_username text not null,
  heard_from text not null,
  referral_code text,
  trading_experience text not null,
  markets_traded text[] not null default '{}',
  profession text not null,
  role text not null default 'customer' check (role in ('customer','admin')),
  plan text check (plan in ('monthly','onetime')),
  status text not null default 'no_plan' check (status in ('active','expired','no_plan')),
  plan_expiry timestamptz,
  failed_login_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. PAYMENTS (gateway link + manual UTR submissions, pending admin review)
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('monthly','onetime')),
  amount numeric not null,
  promo_code text,
  utr text,
  screenshot_url text,
  method text not null default 'manual' check (method in ('manual','razorpay_link')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id)
);

-- ----------------------------------------------------------------------------
-- 3. PROMO CODES
-- ----------------------------------------------------------------------------
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_percent int not null check (discount_percent between 1 and 100),
  usage_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. SUPPORT TICKETS + REPLIES
-- ----------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender text not null check (sender in ('admin','customer')),
  message text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4b. EXPIRY REMINDER LOG (one row per "Send reminder" click from admin)
-- ----------------------------------------------------------------------------
create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sent_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. ADMIN SETTINGS (single row)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_settings (
  id int primary key default 1,
  whatsapp_number text,
  reminder_days int[] not null default '{1,3,5,7}',
  constraint single_row check (id = 1)
);
insert into public.admin_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- HELPER: is_admin() — used inside RLS policies
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- TRIGGER: create a profiles row automatically from auth.users metadata
-- (Signup form passes every extra field via supabase.auth.signUp({ options: { data: {...} } }))
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, username, full_name, email, whatsapp_number, calling_number,
    tradingview_username, heard_from, referral_code, trading_experience,
    markets_traded, profession
  ) values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'whatsapp_number',
    new.raw_user_meta_data->>'calling_number',
    new.raw_user_meta_data->>'tradingview_username',
    new.raw_user_meta_data->>'heard_from',
    new.raw_user_meta_data->>'referral_code',
    new.raw_user_meta_data->>'trading_experience',
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'markets_traded') as x),
      '{}'
    ),
    new.raw_user_meta_data->>'profession'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RPC: look up email by username (needed so "login by username" works,
-- without exposing the whole profiles table publicly)
-- ============================================================================
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select email from public.profiles where username = p_username limit 1;
$$;

-- ============================================================================
-- RPC: increment failed login count (called from the client on a failed attempt)
-- ============================================================================
create or replace function public.increment_failed_login(p_username text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set failed_login_count = failed_login_count + 1
  where username = p_username;
$$;

-- ============================================================================
-- RPC: validate + apply a promo code at checkout (returns discount % or null)
-- ============================================================================
create or replace function public.validate_promo_code(p_code text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_discount int;
begin
  select discount_percent into v_discount from public.promo_codes where code = p_code;
  if v_discount is not null then
    update public.promo_codes set usage_count = usage_count + 1 where code = p_code;
  end if;
  return v_discount;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.promo_codes enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_replies enable row level security;
alter table public.admin_settings enable row level security;
alter table public.reminder_logs enable row level security;

drop policy if exists "reminder_logs_admin_only" on public.reminder_logs;
create policy "reminder_logs_admin_only" on public.reminder_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- profiles: user sees/edits own row; admin sees/edits all
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- payments: user sees/inserts own; admin sees/updates all
drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin" on public.payments
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments
  for insert with check (auth.uid() = user_id);

drop policy if exists "payments_update_admin_only" on public.payments;
create policy "payments_update_admin_only" on public.payments
  for update using (public.is_admin());

-- promo codes: anyone signed in can read (to validate at checkout); admin writes
drop policy if exists "promo_select_all" on public.promo_codes;
create policy "promo_select_all" on public.promo_codes
  for select using (auth.uid() is not null);

drop policy if exists "promo_write_admin_only" on public.promo_codes;
create policy "promo_write_admin_only" on public.promo_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- support tickets: user sees/creates own; admin sees/updates all
drop policy if exists "tickets_select_own_or_admin" on public.support_tickets;
create policy "tickets_select_own_or_admin" on public.support_tickets
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "tickets_insert_own" on public.support_tickets;
create policy "tickets_insert_own" on public.support_tickets
  for insert with check (auth.uid() = user_id);

drop policy if exists "tickets_update_admin_only" on public.support_tickets;
create policy "tickets_update_admin_only" on public.support_tickets
  for update using (public.is_admin());

-- ticket replies: visible to the ticket owner + admin; either can insert on a ticket they can see
drop policy if exists "replies_select" on public.ticket_replies;
create policy "replies_select" on public.ticket_replies
  for select using (
    public.is_admin() or
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

drop policy if exists "replies_insert" on public.ticket_replies;
create policy "replies_insert" on public.ticket_replies
  for insert with check (
    public.is_admin() or
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

-- admin settings: admin only
drop policy if exists "settings_admin_only" on public.admin_settings;
create policy "settings_admin_only" on public.admin_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- STORAGE: bucket for payment screenshots
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('payment-screenshots', 'payment-screenshots', false)
on conflict (id) do nothing;

drop policy if exists "screenshot_upload_own" on storage.objects;
create policy "screenshot_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'payment-screenshots' and auth.uid() is not null
  );

drop policy if exists "screenshot_read_own_or_admin" on storage.objects;
create policy "screenshot_read_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'payment-screenshots' and
    (owner = auth.uid() or public.is_admin())
  );

-- ============================================================================
-- NOTE: The admin panel does NOT use the `role` column or `is_admin()` on this
-- app anymore — admin login is handled separately via ADMIN_USERNAME /
-- ADMIN_PASSWORD environment variables (see README.md, section 4). The
-- `role`/`is_admin()` pieces above are kept only because they're still
-- referenced by the RLS policies' "or public.is_admin()" clause; that clause
-- is simply unused unless you assign role='admin' to a profile yourself.
-- ============================================================================
