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

## Deploy (recommended: Vercel + Supabase, all on the owner's accounts)

1. **Supabase** → new project → *Connect* → copy the pooled URL (port 6543, add `?pgbouncer=true`) into `DATABASE_URL` and the direct URL (5432) into `DIRECT_URL`. Run `npm run db:push` once.
2. **Vercel** → import this GitHub repo → add all env vars → deploy → add the custom domain.
3. **Vercel Blob** → Storage → create Blob store → connect to project (sets `BLOB_READ_WRITE_TOKEN`). Needed for admin photo uploads.
4. The weekly cron (`vercel.json`) calls `/api/cron/social`. Set `CRON_SECRET`; Vercel sends it automatically.

### Google login
Google Cloud Console → APIs & Services → Credentials → *OAuth client ID* (Web). Authorised redirect URI: `https://<domain>/api/auth/callback/google`. Put ID/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. Publish the OAuth consent screen.

### Razorpay
Dashboard → Settings → API Keys → `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
Settings → Webhooks → URL `https://<domain>/api/razorpay/webhook`, events `payment.captured`, `order.paid`, `payment.failed`, secret → `RAZORPAY_WEBHOOK_SECRET`.
Until keys are added, paid ticket types show "Online booking opening soon" and free events still work.

### Email (Resend)
Create an API key → `RESEND_API_KEY`. Verify your domain (DNS records) so `EMAIL_FROM` can be e.g. `tickets@your-domain.com`. `NOTIFY_EMAIL` receives booking/enquiry alerts.

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
Vercel, Supabase, Resend and Vercel Blob free tiers are enough to launch. Razorpay charges its standard per-transaction fee only on paid tickets. The only fixed yearly cost is the domain.
