# Jackpot Bot — Jackpot Bot Subscription Platform

Full-stack subscription platform for the Jackpot Bot TradingView indicator: signup, plans,
Razorpay Payment Link + manual UTR/screenshot approval, and a complete admin panel
(customers, payment approvals, promo codes, sales dashboard, support tickets, broadcast, settings).

Stack: **Next.js 16 (App Router)** + **Supabase** (Postgres, Auth, Storage) + **Razorpay Payment Links**.

> **Upgraded from Next.js 14 → 16** (Sept 2026): Next.js 14 reached end-of-life on
> October 26, 2025 and stopped receiving security patches. This project now runs on
> Next.js 16, which requires **Node.js 20+** and uses async `cookies()`/`params`/`searchParams`
> throughout — already handled in this codebase.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (free tier is enough to start:
   500 MB DB, 50k monthly active users).
2. Once it's created, open **Project Settings → API** and copy:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is `SUPABASE_SERVICE_ROLE_KEY` (**keep this secret** — never
     put it in client-side code or commit it to git; this repo only ever uses it inside
     `src/lib/supabase/admin.ts`, on the server).
3. Open **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`,
   and run it. This creates every table, RLS policy, trigger and RPC function the app needs,
   plus the `payment-screenshots` storage bucket.
4. Go to **Authentication → Providers** and make sure **Email** is enabled. Under
   **Authentication → URL Configuration**, set your Site URL (e.g. your Vercel domain once deployed)
   so password-reset emails link back to the right place.

## 2. Set your environment variables

Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_RAZORPAY_MONTHLY_LINK=https://razorpay.com/payment-link/plink_TgNw4A83X5wRWV
NEXT_PUBLIC_RAZORPAY_ONETIME_LINK=            # add once you create the one-time payment link in Razorpay
NEXT_PUBLIC_ADMIN_WHATSAPP=91XXXXXXXXXX       # your WhatsApp Business number, country code, no +/spaces
```

You already have Razorpay — the Monthly link from the spec is pre-filled. Create a second
Payment Link in your Razorpay dashboard for the One-time / Lifetime plan (₹60,000) and paste
it into `NEXT_PUBLIC_RAZORPAY_ONETIME_LINK`.

## 3. Run it locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 4. Set up the Admin Panel login (completely separate from customer accounts)

The admin panel has its **own login**, totally independent of Supabase Auth / customer
accounts. Add these to your `.env.local` (and to Vercel's environment variables):

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-password
ADMIN_SESSION_SECRET=70714ab7789ca267987a0a1fade15d10251f86f339555da6553b03311bc09680
```

- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: whatever you want to log into `/admin/login` with.
- `ADMIN_SESSION_SECRET`: any long random string (the value above is a ready-to-use example —
  generate your own at https://generate-secret.vercel.app/32 for real production use). This
  marks a logged-in admin session internally; it's never shown to anyone.

Go to `/admin/login` (not the customer `/login`) to sign in as admin.

## 5. Deploy

Push this repo to GitHub, then import it into **Vercel** (or Netlify):

1. Add the same environment variables from `.env.local` in your hosting provider's
   dashboard (Project Settings → Environment Variables).
2. Deploy. Update the Supabase **Site URL** (Authentication → URL Configuration) to your
   live domain so password-reset links work correctly.

---

## Referral program, GST invoices & anti-fraud (run once before deploying this version)

Run `supabase/002_referrals.sql` once in the Supabase SQL Editor (after `schema.sql`). It's safe
to re-run if needed.

**Referral rewards**
- Every customer gets their own referral code + share link (`/signup?ref=CODE`) on their dashboard.
- When a referred friend's **first payment is approved**, the referrer earns a reward:
  ₹500 for the Monthly plan, ₹3000 for the 2-Year Plan (`COMMISSION_BY_PLAN` in `src/lib/referral.ts`).
  One reward per referred friend, ever.
- The reward **unlocks on the 5th of the month after** the friend's payment was approved — not before.
- Once unlocked, the customer enters their UPI ID and clicks "Withdraw" (RPC `request_payout`).
- Admin → **Referral Payouts** shows requested payouts with the customer's UPI ID. Pay by UPI, enter
  the UTR, click *Mark paid*. The customer then sees that UTR against their reward on their dashboard.

**GST invoices**
- Business details live in `src/lib/invoiceDetails.ts` (company name, GSTIN, product name, 18% tax
  shown as included in the price) — edit that file if any of these change.
- An invoice number (e.g. `ZT/2026-27/0001`, resetting each financial year) is assigned automatically
  the moment admin approves a payment (`assign_invoice_number` SQL function, service-role only).
- Customers see an "Invoice →" link next to each approved payment on their dashboard, opening
  `/dashboard/invoice/[paymentId]` — a printable page with a "Download / Print Invoice" button
  (uses the browser's Print → Save as PDF).

**Duplicate UTR protection**
- The same UTR/transaction number can never be submitted twice — enforced both in the UI (checked
  before upload) and at the database level (a unique index), so this can't be bypassed even by
  calling the API directly.

**Fraud warning for customers**
- The payment page shows a warning to only pay through the official Razorpay button or UPI ID on
  that page, verify the site URL first, and never pay someone contacting them directly claiming to
  be support — this is a disclaimer only, not a technical safeguard.

**Promo codes**
- Admin → **Promo Codes** has an optional expiry date; expired codes are rejected at checkout
  (case-insensitive matching).

**Security hardening**
- `002_referrals.sql` locks down customer write access: customers can only edit their own UPI ID,
  and can only insert a **pending** payment with no invoice number — so nobody can activate their
  own plan, forge a paid invoice, or edit someone else's data through the API.

## How the payment flow works (Phase 1 — as specced)

- Customer picks a plan and either:
  - **Pays via the Razorpay Payment Link** (opens in a new tab), then comes back and submits
    their UTR + screenshot so you can match it, **or**
  - **Pays manually via UPI** and submits UTR + screenshot directly.
- Either way, a row is created in `payments` with `status = 'pending'`.
- You approve it from **Admin → Payment Approvals**: this sets the customer's `profiles.status`
  to `active`, sets `plan`/`plan_expiry` (Monthly = +1 month, One-time = no expiry), and marks
  the payment `approved`.
- You then manually grant Jackpot Bot access to their TradingView username (or use
  TradingView's invite-only script feature) — this part stays manual for now per the spec.

There's no Razorpay webhook in this phase (matches your choice of "Payment Link + manual
approval"). If you later want payments to auto-verify, that's a Phase 2 addition: a webhook
route that verifies Razorpay's signature and auto-inserts an approved payment.

## What's manual vs. automated right now

| Feature | Status |
|---|---|
| Signup, login (username or email), forgot password | ✅ Automated |
| Plans, Razorpay Payment Link | ✅ Automated |
| Payment matching/approval | 🟡 Manual (admin clicks Approve) |
| Granting TradingView access | 🟡 Manual (per spec — via TradingView invite-only script) |
| WhatsApp messages (reminders, replies, broadcast) | 🟡 Manual — opens a pre-filled `wa.me` chat from your connected number in Settings |
| Email notifications | ⬜ Not built yet — Phase 2 (Resend/Brevo), see spec section 6 |
| Automated WhatsApp (no manual click) | ⬜ Not built yet — Phase 2 (AiSensy/Interakt), add once there's revenue to justify the cost |

## Project structure

```
src/app/                    customer-facing pages (/, /signup, /login, /dashboard, ...)
src/app/admin/               admin panel (protected by role check in admin/layout.tsx)
src/lib/supabase/           client.ts (browser), server.ts (server components), admin.ts (service role)
supabase/schema.sql          run once in Supabase SQL editor — tables, RLS, triggers, RPCs
```

## Notes / gotchas

- **Admin route protection** happens in `src/app/admin/(protected)/layout.tsx` — it checks a
  secure httpOnly cookie set by `/admin/login` (see `src/lib/adminAuth.ts`). This is completely
  separate from customer Supabase Auth accounts: admin credentials live only in the
  `ADMIN_USERNAME` / `ADMIN_PASSWORD` environment variables. All admin data reads/writes use the
  Supabase **service role** client (`src/lib/supabase/admin.ts`), bypassing RLS, since access is
  already gated by the admin login — so there's no `profiles.role` admin flag to manage anymore.
- **Password reset** uses Supabase's built-in email link flow (not a numeric OTP) — the
  customer clicks the emailed link, which lands on `/reset-password` to set a new password.
  If you specifically need a 6-digit OTP experience, Supabase also supports that; ask if you
  want it swapped in.
- **RLS is on for every table.** Customers can only ever see their own rows; admins can see
  everything, enforced by the `is_admin()` Postgres function used in every policy — this means
  even if someone found your anon key, they still couldn't read other customers' data.
