# ApexSignal — Jackpot Bot Subscription Platform

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
