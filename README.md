# Kuber Maheshwari: Official Website

Website, event ticketing and gate check-in system for **कुबेर माहेश्वरी (Kuber Maheshwari)**, bhajan singer from Indore and owner of K M Audio Productions.

## What's inside

| Area | Features |
|---|---|
| Public site | Home, About, Services, Events, Event detail, Gallery (lightbox), Videos, Booking enquiry, Contact. Hindi + English, SEO (metadata, JSON-LD, sitemap), mobile-first |
| Design & motion | Framer Motion + Lenis smooth scroll: arch hero that opens on scroll, pinned horizontal services, scroll-lit text, parallax/clip reveals, custom cursor, full-screen menu, film grain. Self-hosted fonts (Cormorant Garamond, Tiro Devanagari Hindi, Manrope, Mukta). Respects `prefers-reduced-motion` |
| Social | **Instagram + Facebook feeds from the official Meta APIs, rendered in the site's own design: no widget, no third-party watermark.** Refreshed every 15 min; Instagram token auto-renewed weekly by cron |
| Ticketing | Google login → choose ticket type & quantity → Razorpay (UPI/cards) → QR e-tickets by email + on the site. Free events work without payment. Seat holds, capacity race protection, webhook backup so tickets are issued even if the buyer closes the browser |
| Gate check-in | `/admin/scan` on any phone: camera QR scan, green/amber/red full-screen result with sound + vibration. Signed QR codes (forgery-proof), atomic check-in (one entry per ticket even with several gates), manual code entry, wrong-event detection |
| Admin panel | `/admin`: dashboard, events & ticket types, attendees, manual check-in, CSV export, resend tickets, bookings search, enquiries (call/WhatsApp), gallery uploads, YouTube videos, social tokens |
| Notifications | Email via Resend: e-tickets to buyer, new-booking & new-enquiry alerts to owner, enquiry acknowledgement. WhatsApp click-to-chat everywhere |

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Prisma + PostgreSQL · NextAuth (Google) · Razorpay · Resend · Vercel Blob · Framer Motion · Lenis.

## Run locally

```bash
npm install
cp .env.example .env      # fill values (see below)
npm run db:push           # create tables
npm run db:seed           # optional: one DRAFT demo event
npm run dev
```

Sign in with a Google account listed in `ADMIN_EMAILS` to get the admin panel.

## Deploy on Vercel (all accounts in the owner's name)

1. **Database (Supabase)**: new project, region *Mumbai (ap-south-1)* → *Connect* → ORMs → Prisma.
   - `DATABASE_URL` = pooled URL (port **6543**) + `?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL` = direct/session URL (port **5432**)
   - Create the tables once from your computer: `DATABASE_URL=... DIRECT_URL=... npx prisma db push`
2. **Vercel**: *Add New → Project* → import `Kuber-Maheshwari` from GitHub. Framework is detected as Next.js; no build settings to change. Region: Settings → Functions → **Mumbai (bom1)** (keep it close to the database).
3. **Environment variables** (Settings → Environment Variables, *Production*): everything from `.env.example`. Minimum for the first working deploy: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`, `TICKET_SIGNING_SECRET`, `CRON_SECRET`. Razorpay, Resend and Meta keys can be added later; redeploy after adding.
4. **Blob storage**: Storage → Create → Blob → connect to the project (adds `BLOB_READ_WRITE_TOKEN`). Needed for admin photo/poster uploads.
5. **Domain**: Settings → Domains → add the domain and set the DNS records Vercel shows at your registrar. Then set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://<domain>`, add `https://<domain>/api/auth/callback/google` in Google Cloud, and redeploy.
6. **Cron**: `vercel.json` runs `/api/cron/social` every Monday; Vercel sends `CRON_SECRET` automatically.

Every push to `main` then deploys automatically; pull requests get a preview URL.

The build works even before the database is connected (pages fall back to the built-in photos), so the first deploy won't fail while you're still setting up accounts.

**Upload size:** Vercel limits a request to 4.5 MB, so the admin panel shrinks photos in the browser and uploads them one at a time before sending.

### Google login
Google Cloud Console → APIs & Services → Credentials → *OAuth client ID* (Web). Authorised redirect URI: `https://<domain>/api/auth/callback/google`. Put ID/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. Publish the OAuth consent screen.

### Razorpay
Dashboard → Settings → API Keys → `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
Settings → Webhooks → URL `https://<domain>/api/razorpay/webhook`, events `payment.captured`, `order.paid`, `payment.failed`, secret → `RAZORPAY_WEBHOOK_SECRET`.
Until keys are added, paid ticket types show "Online booking opening soon" and free events still work.

### Email (Resend)
1. resend.com → API Keys → create a key → add `RESEND_API_KEY` in Vercel → redeploy. That's all: ticket emails, booking/enquiry alerts, enquiry replies and next-day reminders switch on automatically.
2. Admin → **Email** shows the status, lets you send a test email, re-send tickets that weren't emailed, and trigger reminders.
3. **Until a domain is verified** Resend's testing sender only delivers to your own Resend account email, so customers won't get emails yet (their QR tickets are always under *My Tickets*). After verifying the domain in Resend → Domains, set `EMAIL_FROM="Kuber Maheshwari <tickets@your-domain.com>"` and redeploy.
4. `NOTIFY_EMAIL` (optional) gets owner alerts; defaults to the first `ADMIN_EMAILS` address. Reminders run daily at 10:00 IST via `/api/cron/reminders`.

### Instagram feed (no watermark)
1. Instagram account must be **Professional** (Creator or Business).
2. [developers.facebook.com](https://developers.facebook.com) → create app → add product **Instagram → API setup with Instagram login**.
3. Under *Generate access tokens* add the Instagram account and generate a token (long-lived, 60 days).
4. Paste it in **Admin → Social Feeds** (or `INSTAGRAM_ACCESS_TOKEN`). The weekly cron renews it, so it never expires as long as the site is running.

### Facebook Page feed
1. In the same Meta app, use Graph API Explorer: select the app, get a *User token* with `pages_show_list`, `pages_read_engagement`, then exchange it for a long-lived token.
2. Call `GET /me/accounts` with it. The `access_token` of the Page there is a Page token that does not expire. Copy the Page `id` too.
3. Paste both in **Admin → Social Feeds** (or `FACEBOOK_PAGE_ID` / `FACEBOOK_PAGE_TOKEN`).

Also set `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_YOUTUBE_URL` for the follow buttons.

## Event-day workflow
1. Admin → Events → create event, add ticket types (price ₹0 = free pass) → set **Published**.
2. Buyers get QR tickets by email and under *My Tickets*.
3. Add gate volunteers' Gmail IDs to `STAFF_EMAILS`. They sign in on their phone and open `/admin/scan` (they can only scan).
4. After the event: Admin → event → **Export CSV** for the attendee list with check-in times.

## Environment variables
See [`.env.example`](.env.example). Every secret stays on the server; nothing sensitive is exposed to the browser.

## Running costs
- **Vercel:** the free *Hobby* plan is for personal, non-commercial use only ([fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). A site that sells tickets and takes bookings is commercial, so production needs **Pro, $20/month** (includes $20 usage credit). Hobby is fine for a private preview/demo.
- **Supabase, Resend, Vercel Blob:** free tiers are enough to launch.
- **Razorpay:** standard per-transaction fee, only on paid tickets.
- **Domain:** yearly renewal.
