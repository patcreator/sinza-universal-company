# SINZA UNIVERSAL COMPANY — Developer Guide

Official platform of **Jado Sinza & Esther** (Rwandan gospel ministry, Kigali).
Next.js (App Router) · PostgreSQL · Drizzle ORM · Tailwind CSS v4.

The project contains three parts:

1. **Public website** — music, videos, concerts & tickets, store, news, newsletter, about/contact/privacy/terms.
2. **Admin console** at `/admin` — CRUD over *everything*, file manager, social sync, newsletter composer and the theme editor.
3. **Developer tooling** — REST API under `/api`, seeding, cron endpoint, and this documentation.

---

## 1. Quick start

```bash
cp .env.local.example .env.local     # then fill in your values
npm install
npx drizzle-kit push                 # create the PostgreSQL tables
npm run dev                          # http://localhost:3000
```

Sample data (11 songs, 4 albums, 6 concerts, merch, news, comments, subscribers) is inserted
automatically the first time the app touches the database — no manual seed command needed.
If you ever want to re-seed manually:

```bash
npx tsx src/db/seed.ts
```

Health check: `GET /api/health` → `{ status: "ok", database: "up", seeded: true }`.

---

## 2. Default admin login

| Field | Value |
| --- | --- |
| URL | `/admin/login` |
| Username | `admin` (from `ADMIN_USERNAME`) |
| Password | `Sinza@2026` (from `ADMIN_PASSWORD`) |

> **Important:** the admin console uses a **username/email + password only** (bcrypt + signed
> HTTP-only cookie). It must **never** use Clerk or any social login. Clerk is only an optional
> sign-in for *visitors* who want to see their past bookings.

Change `ADMIN_PASSWORD` in `.env.local` before going to production. Additional staff users can be
created in **Admin → System → Admin Users**.

---

## 3. Environment variables (`.env.local`)

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string used by Drizzle |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | ✅ | Seed the default admin account |
| `SESSION_SECRET` | ✅ | HMAC key that signs the admin session cookie |
| `SITE_URL` | ✅ | Canonical URL used in metadata, emails and payment callbacks |
| `RESEND_API_KEY` | ✅ | Sends every email (tickets, orders, newsletter) |
| `EMAIL_FROM` | ✅ | Verified sender, e.g. `Sinza Universal <news@sinzauniversal.com>` |
| `APIFY_TOKEN` | ✅ | Social sync (YouTube, Instagram, Facebook, X) |
| `YOUTUBE_HANDLE`, `INSTAGRAM_HANDLE`, `FACEBOOK_PAGE`, `X_HANDLE` | | Channels to sync |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` | | Cloudflare R2 uploads. If unset, files go to `/public/uploads` |
| `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`, `PESAPAL_BASE_URL`, `PESAPAL_IPN_ID` | | Card + mobile-money payments |
| `PAWAPAY_API_TOKEN`, `PAWAPAY_BASE_URL` | | MTN MoMo / Airtel Money collections |
| `PAYMENTS_DEMO` | | `true` simulates payment instantly (default), `false` uses the live gateways |
| `CRON_SECRET` | ✅ | Protects `/api/cron/newsletter` |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | | Optional visitor accounts |

---

## 4. Project structure

```
src/
  app/
    (site)/                 public website
      page.tsx              homepage (hero video, parallax, ledger, store, news)
      music/                track list + persistent player + detail drawer
      videos/               video wall (YouTube / Instagram / Facebook / X filters)
      concerts/             schedule ledger + [slug] detail with ticket booking
      store/                merchandise + cart drawer
      checkout/             payment step
      news/                 articles + [slug] with threaded comments
      [slug]/               about · contact · privacy · terms (content from DB)
    admin/
      login/                username + password
      (panel)/              dashboard, resource lists, editors, appearance
    api/                    public + admin REST endpoints
  components/
    site/                   Nav, Spine, Footer, Logo (SVG), player, lightbox, forms
    admin/                  AdminShell, ResourceTable, ResourceForm, RichTextEditor
  db/
    schema.ts               all tables
    index.ts                Drizzle client + auto-seed
    seed.ts                 sample data
  lib/                      auth, mail, settings, payments, queries, i18n, resources
```

---

## 5. Features reference

### Public website
- **Hero**: background video (`heroVideoUrl`, falls back to a poster image), oversized headline,
  sub-title, two CTAs, a 16:9 video card that opens a lightbox, scroll parallax and grain.
- **Navigation**: fully transparent over the hero, then morphs to glass/ink on scroll. Shows a few
  primary links plus the social icons, language switcher (EN / RW / FR) and a dark–light toggle.
- **Spine rail** (desktop): rotated wordmark, socials and a live reading-progress bar.
- **Music**: click any song to play it in the persistent dock (HTML5 audio when `audioUrl` is set,
  otherwise the YouTube player). Detail drawer with credits, lyrics, share buttons and store link.
- **Videos**: filters per platform in the URL (`?tab=youtube`) and a shareable lightbox (`?v=<id>`).
- **Concerts**: ruled schedule ledger, featured event, past archive with photos and videos.
- **Tickets**: choose tiers, enter name/email/phone — **no account required** — pay with
  MTN MoMo, Airtel Money, Visa, Mastercard, Pesapal or pawaPay. Confirmation email is sent instantly.
- **Store**: albums, apparel, prints and accessories with a cart drawer and checkout.
- **News**: rich articles (images + video embeds), threaded comments with replies, share buttons,
  source attribution and per-article SEO metadata.
- **Newsletter**: inline and panel sign-up forms, welcome email, and automatic sending on the days
  you choose.
- **URL-oriented**: every tab, drawer and lightbox lives in the query string, so any view can be
  shared as a link.

### Admin console
- Dashboard with live counts, revenue, latest bookings and comments.
- **CRUD for every table**: tracks, albums, products, concerts, ticket tiers, orders, articles,
  pages, comments, media, subscribers, newsletters, social links, contact messages, settings,
  admins, sync and email logs.
- **Rich text editor** for articles, pages and newsletters: headings, lists, quotes, links,
  **images and YouTube video embeds**, plus a raw-HTML mode.
- **File manager**: upload images/audio/video (Cloudflare R2 when configured), organise by
  category and date, and pick files straight from any image field.
- **Appearance**: change the brand colours, radius, default mode, hero copy, section visibility,
  languages, newsletter days and payment methods — all written to the database and applied live.
- **Social sync**: one button pulls the latest from YouTube, Instagram, Facebook and X through
  Apify and records a sync log.

### Developer
- REST API with cookie auth for the admin, e.g. `GET /api/admin/tracks?q=imbabazi`.
- `POST /api/cron/newsletter` sends the scheduled newsletter (wire it to Vercel Cron).
- Payments callback at `/api/payments/callback` for Pesapal and pawaPay IPNs.

---

## 6. Deploying

### Vercel
1. Push the repository and import it into Vercel.
2. Add every variable from section 3 (use Vercel Postgres, Neon or any managed PostgreSQL).
3. Run `npx drizzle-kit push` once against the production database.
4. Add the cron job in `vercel.json` (already included):

```json
{ "crons": [{ "path": "/api/cron/newsletter?force=0", "schedule": "0 7 * * 1,3,5" }] }
```

### Database
`drizzle.config.json` points at `DATABASE_URL`. Any schema change in `src/db/schema.ts` is applied
with `npx drizzle-kit push`.

---

## 7. Email (Resend)

Every message goes through `src/lib/mail.ts`. Templates: ticket confirmation, order confirmation,
contact acknowledgement and the newsletter shell (which contains the `{{UNSUBSCRIBE_URL}}` token).
Verify your sending domain in Resend and set `EMAIL_FROM` accordingly.

---

## 8. Payments

`src/lib/payments.ts` is the single integration point:

- **Pesapal** — cards (Visa/Mastercard) and mobile money. Returns a redirect URL.
- **pawaPay** — direct MTN MoMo / Airtel Money collections using the customer's phone number.
- **Demo mode** (`PAYMENTS_DEMO=true`) — confirms instantly so the whole flow is testable.

---

## 9. Brand assets

`src/components/site/Logo.tsx` contains the **SINZA monogram drawn as SVG** (the "S" with the
crimson diagonal slash) so it scales, reverses to one colour and follows the admin theme.
To use the supplied raster logos, drop them in `/public/images/` and reference them in
**Admin → Appearance**, or replace the `<SinzaMark />` output with an `<img>`.

---

## 10. Licence & credits

Built for Sinza Universal Company, Kigali, Rwanda.
Discography and event data reference public sources (Apple Music, CitiMuzik, Afrocharts) which are
credited on the relevant articles.
#