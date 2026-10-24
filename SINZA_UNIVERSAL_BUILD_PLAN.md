# SINZA UNIVERSAL COMPANY — Build Plan
### Copy and paste this whole document into an AI coding assistant as the project brief.

---

## 0. Mission

Build **SINZA UNIVERSAL COMPANY**, the official web platform of Rwandan gospel minister
**Jado Sinza & Esther (Esther Umulisa)** — a Kigali-based music ministry. The site must sell music
and merchandise, sell concert tickets, publish the concert schedule, and present the ministry's
music, videos, photos and news. It must ship as a **public website + a private admin console + a
developer handover** (README.md and a sample `.env.local`).

Stack: **Next.js (App Router) · PostgreSQL · Drizzle ORM · Tailwind CSS**. Deployable to Vercel.

---

## 1. Artist facts to use as content (seed data)

- Jado Sinza is a prominent Rwandan Christian gospel singer and songwriter with **over five years**
  of active music ministry, spreading the message of Jesus Christ through high-quality praise and
  worship music.
- He frequently collaborates with gospel artist **Esther (Esther Umulisa)**; they have released major
  hit records together and are married. Their music lives on the official **Jado Sinza & Esther**
  YouTube channel.
- Albums/EPs: **Inkuru y'Agakiza**, **Umwizera**, **Agakiza / Umuragwa (Live in Redemption Concert)**,
  **Golgotha (Halleluya)**.
- Songs (with real metadata):
  - **YEGO NIYO** (2026, with Esther) — released 16 Sep 2026, distributed by DistroKid.
  - **YANKIJIJE BURUNDU** (2026) — released 17 Jul 2026.
  - **Yampinduye Mushya** (2026).
  - **Ni Nziza** (2025) — published by 4883369 Records DK.
  - **Imbabazi** (2025) — released 3 Mar 2025; about seeking peace, meeting Jesus, endless mercy.
  - **Aragukunda** (2025) — produced with UB Records (producer Bolingo Paccy, video Musinga / Eddie Cuts).
  - **Umwizera** (2024) — recorded live during the Redemption Concert at Camp Kigali.
  - **Forever** (2024), **Bwana Nasubiri (feat. Zoravo)** (2024), **Golgotha (Halleluya)** (2018).
- Socials (must appear in the nav, footer and share widgets):
  - Instagram `https://www.instagram.com/jadosinza/?hl=en`
  - YouTube `https://www.youtube.com/@jadosinza14`
  - Facebook `https://web.facebook.com/SinzaJado/`
  - X `https://x.com/JadoSinza`
  - Afrocharts `https://www.afrocharts.com/artist?id=8040cf6eee`
  - Shazam `https://www.shazam.com/song/1836745821/ni-nziza`
  - Apple Music `https://music.apple.com/ca/artist/jado-sinza/1667469711`
- Real YouTube IDs for the video player: `Uy0blMiY4mU` (Ni Nziza), `Q9Uqu-9s6D4` (Yankijije Burundu),
  `02eldff6nj0` (Imbabazi), `tRvbsDcSd5w` (Aragukunda).
- Any biographical or news content taken from the web must **credit the source** with a link.

---

## 2. Public website — required pages & behaviour

1. **Home** — full-viewport hero with a **background video** (admin-settable mp4; poster image
   fallback) + a **16:9 video card** that plays a synced YouTube video in a lightbox. Headline,
   sub-title, two CTA buttons. Scrolling reveals: marquee of song titles, latest release with a
   3D-tilt album card, a parallax quote band, the concert ledger, the video wall, merch, news and a
   newsletter band.
2. **/music** — click a song to play it in a persistent bottom dock (HTML5 audio when an audio file
   exists, otherwise the YouTube player). Detail drawer with cover, credits, lyrics, share buttons and
   buy links. Album cards below.
3. **/videos** — wall of videos with filters per source (YouTube sync, Instagram sync, Facebook sync,
   X sync, uploaded) and per category. Clicking opens a 16:9 lightbox.
4. **/concerts** — dense editorial **ledger** of dates (upcoming / past tabs in the URL), featured
   event hero, and `/concerts/[slug]` with description, photo archive, videos, share buttons and the
   **ticket booking form**.
5. **Ticket booking — no account required.** Pick tiers, enter name/email/phone, choose a payment
   method (MTN MoMo, Airtel Money, Visa, Mastercard, Pesapal, pawaPay), confirm → booking reference
   + confirmation email. Logged-in visitors (optional Clerk) can see their bookings.
6. **/store** — albums and merch with category filters, cart drawer and `/checkout` with the same
   payment methods and an order confirmation email.
7. **/news** + **/news/[slug]** — rich articles (images and video embeds), tags, **source
   attribution**, share buttons, SEO metadata, and **threaded comments with replies**.
8. **/about, /contact, /privacy, /terms** — content stored in the database; contact form emails the
   team and acknowledges the sender.
9. **Newsletter** — inline + panel signup, welcome email, and **automatic sending on chosen days**
   (e.g. Mon/Wed/Fri) with a configurable hour and timezone.

**Global behaviour**
- Navigation is **completely transparent over the hero** and gains colour/blur after scrolling.
- **Dark and light mode** + fully responsive on mobile and desktop.
- **URL-oriented**: every tab, drawer, filter and lightbox writes to the query string
  (`?tab=`, `?track=`, `?play=`, `?v=`) so any view can be shared as a link.
- Heavy **parallax**, gradients, rounded corners, subtle **3D tilt** on cards, and scroll animations.
- Premium, editorial look. Share buttons and SEO/OpenGraph metadata everywhere.

---

## 3. Admin console (`/admin`)

- **Login with username/email + password ONLY. Admin must never use Clerk or social login.**
  Default account seeded from `.env.local` (`admin` / `Sinza@2026`). Session is a signed HTTP-only
  cookie with bcrypt-hashed passwords.
- **Full CRUD for every table**: songs, albums, products, concerts, ticket tiers, orders, articles,
  pages, comments, media, subscribers, newsletters, social links, contact messages, settings, admin
  users, sync logs, email logs.
- **Rich text editor** for articles/pages/newsletters with headings, lists, quotes, links,
  **images and video embeds**, and a raw HTML mode.
- **File manager**: upload files (Cloudflare R2 when configured, local otherwise), organise them by
  category and date, browse everything, and pick files from any image field.
- **Appearance panel**: change the entire website's colours (primary/accent/ink/bone), corner radius,
  default mode, hero copy and media, which sections are shown/hidden, languages, newsletter days and
  enabled payment methods — all stored in the database and applied instantly.
- **Social sync** through the **Apify** token for YouTube, Instagram, Facebook and X, with a sync log.
- **Newsletter composer** with a "send now" action and scheduled automatic sending.
- Dashboard with counts, revenue, latest bookings and comments.

---

## 4. Data model (PostgreSQL / Drizzle)

`admins`, `settings` (site, theme, newsletterSchedule, payments, seo),
`albums`, `tracks`, `products`, `concerts`, `ticketTypes`, `orders`,
`posts`, `comments`, `pages`, `contactMessages`, `media`, `socialLinks`, `syncLogs`,
`subscribers`, `newsletters`, `newsletterSends`, `emailLogs`.

Everything the site displays must come from the database so the admin can manipulate it.

---

## 5. Integrations

| Concern | Service |
| --- | --- |
| Email | **Resend** (tickets, orders, contact ack, newsletter + unsubscribe) |
| Hosting | **Vercel** (+ cron for the newsletter) |
| Payments | **Pesapal**, **pawaPay**, MTN MoMo, Airtel Money, Visa, Mastercard |
| File storage | **Cloudflare R2** (with local `/public/uploads` fallback) |
| Social sync | **Apify** (YouTube, Instagram, Facebook, X) |
| Visitor accounts | **Clerk** (optional, never for admins) |

---

## 6. Design direction

- **Real-world anchor:** a Rwandan gospel concert programme printed as a premium vinyl-boxset
  booklet — cream stock, deep ink rules, one hot red ink, stage-light photography.
- **Surfaces:** light = bone paper `#F3EDE7`; dark = warm stage-house charcoal `#131010`.
- **Colour:** Sinza red `#C1121F` (from the logo), dark red `#8E0D17`, brass accent `#C8912F`,
  ink `#14100F`, tinted stone neutrals (never pure grey).
- **Type:** Fraunces (display serif, italic used as a voice for Kinyarwanda titles) + Space Grotesk
  (UI, tabular figures for dates and prices). Scale ratio 1.333; display headlines to ~7.5rem.
  Tracked uppercase micro-caps eyebrows with a red rule.
- **Layout that breaks the default:** a fixed vertical **spine rail** on desktop (rotated wordmark +
  socials + reading progress); the concert schedule as a **ruled ledger table**, not cards; the hero
  headline overlapping the video plane.
- **Rejected:** purple/blue gradient hero, grids of identical rounded cards with emoji, Inter-only,
  three equal feature columns, neon-on-black.
- **Motion:** settle-in reveals (IntersectionObserver), scroll parallax on full-bleed bands,
  perspective 3D tilt on cards, nav morph transparent → ink. Honour `prefers-reduced-motion`.
- **Logo:** draw the SINZA monogram as **SVG** (rounded "S" with a crimson diagonal slash) so it
  scales and can be recoloured; accept the client's raster logos as assets.

---

## 7. Deliverables

1. Working Next.js + PostgreSQL + Drizzle application (site + admin + API).
2. **README.md** — setup, default admin credentials, every environment variable, folder map,
   feature reference, deployment steps.
3. **Sample `.env.local`** with every required key documented (DATABASE_URL, ADMIN_*, SESSION_SECRET,
   SITE_URL, RESEND_*, APIFY_TOKEN, R2_*, PESAPAL_*, PAWAPAY_*, CRON_SECRET, CLERK_*).
4. **Seed data** so every screen is full on first run: 11 songs, 4 albums, 6 concerts with ticket
   tiers, 8 products, 4 articles with comments, pages, media library, subscribers and sample orders.
5. Responsive, accessible, SEO-optimised output with share buttons and metadata throughout.
