/**
 * Sample data for SINZA UNIVERSAL COMPANY.
 * Idempotent: it only inserts when the matching table is empty.
 * Run manually with `npx tsx src/db/seed.ts` or let the app seed itself at boot.
 */
import { count, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./index";
import * as s from "./schema";

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

async function isEmpty(table: Parameters<typeof db.select>[0] extends never ? never : any) {
  const rows = await db.select({ value: count() }).from(table);
  return (rows[0]?.value ?? 0) === 0;
}

export async function seed() {
  /* ---------------- admins ---------------- */
  if (await isEmpty(s.admins)) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const email = process.env.ADMIN_EMAIL || "admin@sinzauniversal.com";
    const password = process.env.ADMIN_PASSWORD || "Sinza@2026";
    await db.insert(s.admins).values({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "superadmin",
    });
  }

  /* ---------------- settings ---------------- */
  if (await isEmpty(s.settings)) {
    await db.insert(s.settings).values([
      {
        key: "site",
        value: {
          siteName: "Sinza Universal Company",
          shortName: "SINZA",
          tagline: "Ubutumwa bwiza bw'Imana — praise & worship from Kigali to the world",
          description:
            "The official platform of Jado Sinza & Esther: music, videos, concerts, tickets, news and merchandise from Sinza Universal Company, Kigali, Rwanda.",
          email: "hello@sinzauniversal.com",
          phone: "+250 788 300 120",
          whatsapp: "+250 788 300 120",
          address: "KG 7 Ave, Kigali, Rwanda",
          languages: ["en", "rw", "fr"],
          defaultLanguage: "en",
          currency: "RWF",
          showMusic: true,
          showVideos: true,
          showConcerts: true,
          showStore: true,
          showNews: true,
          showNewsletter: true,
          footerNote: "© Sinza Universal Company. All rights reserved.",
        },
      },
      {
        key: "theme",
        value: {
          primary: "#C1121F",
          primaryDark: "#8E0D17",
          accent: "#C8912F",
          ink: "#14100F",
          bone: "#F3EDE7",
          stone: "#7C716B",
          radius: 18,
          defaultMode: "dark",
          allowModeSwitch: true,
          fontDisplay: "Fraunces",
          fontSans: "Space Grotesk",
          heroTitle: "The sound of\nsalvation",
          heroSubtitle:
            "Jado Sinza & Esther — five years of high-quality Rwandan praise and worship, recorded live and released to the world.",
          heroCtaPrimary: "Listen to the new single",
          heroCtaSecondary: "Get concert tickets",
          heroPoster: "/images/hero-stage.jpg",
          heroVideoUrl: "",
          heroYoutubeId: "Uy0blMiY4mU",
          marquee: ["YEGO NIYO", "YANKIJIJE BURUNDU", "IMBABAZI", "NI NZIZA", "ARAGUKUNDA", "UMWIZERA"],
        },
      },
      {
        key: "newsletterSchedule",
        value: { enabled: true, days: [1, 3, 5], hour: 9, timezone: "Africa/Kigali" },
      },
      {
        key: "payments",
        value: {
          enabled: ["mtn", "airtel", "visa", "mastercard", "pesapal", "pawapay"],
          currency: "RWF",
          bookingFeePercent: 3,
          demoMode: true,
        },
      },
      {
        key: "seo",
        value: {
          titleTemplate: "%s — Sinza Universal Company",
          defaultTitle: "Sinza Universal Company — Jado Sinza & Esther",
          defaultDescription:
            "Music, videos, concerts and tickets from Rwandan gospel minister Jado Sinza & Esther. Stream, buy albums and book your seat at the next worship night.",
          ogImage: "/images/hero-stage.jpg",
          twitterHandle: "@JadoSinza",
          keywords: [
            "Jado Sinza",
            "Esther Umulisa",
            "Rwandan gospel",
            "Kinyarwanda worship",
            "Sinza Universal Company",
            "Kigali concerts",
          ],
        },
      },
    ]);
  }

  /* ---------------- social links ---------------- */
  if (await isEmpty(s.socialLinks)) {
    await db.insert(s.socialLinks).values([
      { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/jadosinza/?hl=en", sortOrder: 1 },
      { platform: "youtube", label: "YouTube", url: "https://www.youtube.com/@jadosinza14", sortOrder: 2 },
      { platform: "facebook", label: "Facebook", url: "https://web.facebook.com/SinzaJado/", sortOrder: 3 },
      { platform: "x", label: "X (Twitter)", url: "https://x.com/JadoSinza", sortOrder: 4 },
      {
        platform: "apple",
        label: "Apple Music",
        url: "https://music.apple.com/ca/artist/jado-sinza/1667469711",
        sortOrder: 5,
      },
      {
        platform: "shazam",
        label: "Shazam",
        url: "https://www.shazam.com/song/1836745821/ni-nziza",
        sortOrder: 6,
      },
      {
        platform: "afrocharts",
        label: "Afrocharts",
        url: "https://www.afrocharts.com/artist?id=8040cf6eee",
        sortOrder: 7,
      },
    ]);
  }

  /* ---------------- albums ---------------- */
  let albumIds: number[] = [];
  if (await isEmpty(s.albums)) {
    const inserted = await db
      .insert(s.albums)
      .values([
        {
          title: "Inkuru y'Agakiza",
          slug: "inkuru-y-agakiza",
          year: 2025,
          coverUrl: "/images/album-inkuru.jpg",
          description:
            "The story of salvation told in eleven movements — recorded between Kigali and Kampala with the Sinza Universal worship team and featuring Esther Umulisa on lead vocals.",
          price: "15000",
          featured: true,
          sortOrder: 1,
        },
        {
          title: "Umwizera",
          slug: "umwizera",
          year: 2024,
          coverUrl: "/images/album-umwizera.jpg",
          description:
            "Faith. Recorded live during the Redemption Concert at Camp Kigali, with the full choir, brass section and an audience of six thousand worshippers.",
          price: "12000",
          featured: true,
          sortOrder: 2,
        },
        {
          title: "Agakiza / Umuragwa — Live in Redemption Concert",
          slug: "agakiza-umuragwa-live",
          year: 2024,
          coverUrl: "/images/concert-redemption.jpg",
          description:
            "The complete live EP from the Redemption Concert, mixed by Bolingo Paccy at UB Records. Includes the crowd-held-outro version of Umuragwa.",
          price: "10000",
          sortOrder: 3,
        },
        {
          title: "Golgotha (Halleluya) — The Early Singles",
          slug: "golgotha-halleluya",
          year: 2018,
          coverUrl: "/images/duo-stage.jpg",
          description:
            "Where the ministry started. The foundational 2018 single celebrating the resurrection of Christ, remastered for streaming in 2025.",
          price: "8000",
          sortOrder: 4,
        },
      ])
      .returning({ id: s.albums.id });
    albumIds = inserted.map((r) => r.id);
  } else {
    const existing = await db.select({ id: s.albums.id }).from(s.albums).orderBy(s.albums.sortOrder);
    albumIds = existing.map((r) => r.id);
  }

  /* ---------------- tracks ---------------- */
  if (await isEmpty(s.tracks)) {
    await db.insert(s.tracks).values([
      {
        title: "Yego Niyo",
        slug: "yego-niyo",
        albumId: albumIds[0],
        year: 2026,
        durationSec: 372,
        coverUrl: "/images/album-inkuru.jpg",
        audioUrl: "",
        youtubeId: "",
        instagramUrl: "https://www.instagram.com/jadosinza/?hl=en",
        lyrics:
          "Yego niyo, niwe wenyine wankijije…\n\n(Verse 1)\nMuri byose nabonye ubugingo\nNi wowe wankijije, yego niyo\n\n(Chorus)\nYego niyo, yego niyo\nYesu niwe wenyine ushoboye",
        credits: "Written by Jado Sinza & Esther Umulisa · Produced by Bolingo Paccy · Distributed by DistroKid",
        price: "1500",
        source: "admin",
        featured: true,
      },
      {
        title: "Yankijije Burundu",
        slug: "yankijije-burundu",
        albumId: albumIds[0],
        year: 2026,
        durationSec: 348,
        coverUrl: "/images/album-inkuru.jpg",
        audioUrl: "",
        youtubeId: "Q9Uqu-9s6D4",
        instagramUrl: "https://www.instagram.com/jadosinza/?hl=en",
        lyrics: "Yankijije burundu, yankijije burundu…\nUwikomeye mfite umutima uryamye",
        credits: "Jado Sinza & Esther · Acoustic arrangement with rich vocal harmonies · Released 17 July 2026",
        price: "1500",
        featured: true,
      },
      {
        title: "Yampinduye Mushya",
        slug: "yampinduye-mushya",
        albumId: albumIds[0],
        year: 2026,
        durationSec: 321,
        coverUrl: "/images/album-inkuru.jpg",
        audioUrl: "",
        youtubeId: "",
        lyrics: "Yampinduye mushya, yampinduye mushya…",
        credits: "Jado Sinza & Esther · 2026",
        price: "1500",
      },
      {
        title: "Ni Nziza",
        slug: "ni-nziza",
        albumId: albumIds[1],
        year: 2025,
        durationSec: 302,
        coverUrl: "/images/album-umwizera.jpg",
        audioUrl: "",
        youtubeId: "Uy0blMiY4mU",
        lyrics: "Ni nziza Imana, ni nziza cyane…",
        credits: "Published by 4883369 Records DK · Official video directed by Musinga",
        price: "1500",
        featured: true,
      },
      {
        title: "Imbabazi",
        slug: "imbabazi",
        albumId: albumIds[1],
        year: 2025,
        durationSec: 300,
        coverUrl: "/images/album-umwizera.jpg",
        audioUrl: "",
        youtubeId: "02eldff6nj0",
        lyrics: "Imbabazi zawe ziri hejuru yacu…\nNdashaka amahoro, ndashaka Yesu",
        credits: "Released 3 March 2025 · 4883369 Records DK · Jado Sinza & Esther (Bolingo)",
        price: "1500",
        featured: true,
      },
      {
        title: "Aragukunda",
        slug: "aragukunda",
        albumId: albumIds[1],
        year: 2025,
        durationSec: 289,
        coverUrl: "/images/album-umwizera.jpg",
        audioUrl: "",
        youtubeId: "tRvbsDcSd5w",
        lyrics: "Aragukunda, aragukunda…",
        credits: "Produced at UB Records by Bolingo Paccy · Bass: David · Video: Musinga / Eddie Cuts",
        price: "1500",
      },
      {
        title: "Umwizera (Live at Camp Kigali)",
        slug: "umwizera-live",
        albumId: albumIds[1],
        year: 2024,
        durationSec: 415,
        coverUrl: "/images/concert-redemption.jpg",
        audioUrl: "",
        lyrics: "Umwizera wanjye ntiwahinduka…",
        credits: "Recorded live during the Redemption Concert, Camp Kigali · 2024",
        price: "1500",
      },
      {
        title: "Agakiza / Umuragwa (Live)",
        slug: "agakiza-umuragwa",
        albumId: albumIds[2],
        year: 2024,
        durationSec: 456,
        coverUrl: "/images/concert-redemption.jpg",
        audioUrl: "",
        lyrics: "Agakiza k'Imana karaboneka…",
        credits: "Live EP · Sinza Universal worship team",
        price: "1500",
      },
      {
        title: "Forever",
        slug: "forever",
        albumId: albumIds[2],
        year: 2024,
        durationSec: 274,
        coverUrl: "/images/duo-stage.jpg",
        audioUrl: "",
        lyrics: "Forever, Lord, you are worthy…",
        credits: "Jado SINZA · 2024 single",
        price: "1500",
      },
      {
        title: "Bwana Nasubiri (feat. Zoravo)",
        slug: "bwana-nasubiri",
        albumId: albumIds[2],
        year: 2024,
        durationSec: 330,
        coverUrl: "/images/duo-stage.jpg",
        audioUrl: "",
        lyrics: "Bwana nasubira, Bwana ndategereza…",
        credits: "feat. Zoravo · 2024 EP",
        price: "1500",
      },
      {
        title: "Golgotha (Halleluya)",
        slug: "golgotha-halleluya",
        albumId: albumIds[3],
        year: 2018,
        durationSec: 268,
        coverUrl: "/images/duo-stage.jpg",
        audioUrl: "",
        lyrics: "Halleluya, halleluya…\nKu Golgotha arahagaze",
        credits: "The foundational 2018 single celebrating the resurrection of Christ · Remastered 2025",
        price: "1000",
      },
    ]);
  }

  /* ---------------- concerts + ticket tiers ---------------- */
  if (await isEmpty(s.concerts)) {
    const inserted = await db
      .insert(s.concerts)
      .values([
        {
          title: "Inkuru y'Agakiza — The Album Live",
          slug: "inkuru-y-agakiza-live",
          tagline: "The full album performed live, with choir, brass and a 40-voice mass choir.",
          description:
            "Sinza Universal Company presents the official album release concert for Inkuru y'Agakiza. One night, the complete record performed from top to bottom with special guest Esther Umulisa, the Sinza Universal worship team and a 40-voice mass choir. Doors open at 5:00 PM, worship begins at 6:30 PM sharp.",
          venue: "Kigali Convention Centre",
          city: "Kigali",
          country: "Rwanda",
          startsAt: new Date("2026-12-12T18:30:00+02:00"),
          endsAt: new Date("2026-12-12T22:30:00+02:00"),
          doorsAt: new Date("2026-12-12T17:00:00+02:00"),
          status: "upcoming",
          coverUrl: "/images/hero-stage.jpg",
          gallery: ["/images/news-crowd.jpg", "/images/duo-stage.jpg", "/images/concert-redemption.jpg"],
          videos: ["Uy0blMiY4mU", "Q9Uqu-9s6D4"],
          featured: true,
        },
        {
          title: "Umwizera Worship Night",
          slug: "umwizera-worship-night",
          tagline: "An evening of unplugged worship in the round.",
          description:
            "A stripped-back, candle-lit worship night built around the Umwizera record. Acoustic band, no screens, one microphone. Seats are strictly limited to 1,200 worshippers.",
          venue: "Kigali Arena",
          city: "Kigali",
          country: "Rwanda",
          startsAt: new Date("2026-11-21T18:00:00+02:00"),
          endsAt: new Date("2026-11-21T21:30:00+02:00"),
          doorsAt: new Date("2026-11-21T16:30:00+02:00"),
          status: "upcoming",
          coverUrl: "/images/concert-redemption.jpg",
          gallery: ["/images/hero-stage.jpg"],
          videos: ["02eldff6nj0"],
          featured: true,
        },
        {
          title: "Yego Niyo Tour — Praise Night",
          slug: "yego-niyo-tour-praise-night",
          tagline: "The Yego Niyo tour lands in Kigali for one huge night of thanksgiving.",
          description:
            "Join Jado Sinza & Esther for the Kigali leg of the Yego Niyo tour. Full band, live recording, choir, and a second half of spontaneous praise that has become the signature of the ministry.",
          venue: "Petit Stade",
          city: "Kigali",
          country: "Rwanda",
          startsAt: new Date("2027-02-14T17:00:00+02:00"),
          endsAt: new Date("2027-02-14T21:00:00+02:00"),
          status: "upcoming",
          coverUrl: "/images/news-crowd.jpg",
          gallery: ["/images/duo-stage.jpg"],
          videos: ["tRvbsDcSd5w"],
        },
        {
          title: "Gospel Sunrise — Musanze",
          slug: "gospel-sunrise-musanze",
          tagline: "Open-air praise in the north, free for all who come early.",
          description:
            "Sinza Universal travels to Musanze for an open-air morning of praise with local choirs, the province worship collective and a live recording session.",
          venue: "Musanze Open Grounds",
          city: "Musanze",
          country: "Rwanda",
          startsAt: new Date("2027-03-21T09:00:00+02:00"),
          status: "upcoming",
          coverUrl: "/images/studio-choir.jpg",
          gallery: [],
          videos: [],
        },
        {
          title: "Redemption Concert",
          slug: "redemption-concert",
          tagline: "The night Umwizera was recorded live.",
          description:
            "The historic Redemption Concert at Camp Kigali — six thousand worshippers, the Sinza Universal band, and the live recording that became the Umwizera album and the Agakiza / Umuragwa EP. Photos and full video are now archived here.",
          venue: "Camp Kigali",
          city: "Kigali",
          country: "Rwanda",
          startsAt: new Date("2024-08-24T18:00:00+02:00"),
          endsAt: new Date("2024-08-24T22:00:00+02:00"),
          status: "past",
          coverUrl: "/images/concert-redemption.jpg",
          gallery: ["/images/news-crowd.jpg", "/images/hero-stage.jpg", "/images/duo-stage.jpg"],
          videos: ["Uy0blMiY4mU"],
          featured: true,
        },
        {
          title: "Night of Worship — Nyamirambo",
          slug: "night-of-worship-nyamirambo",
          tagline: "A community night of worship and testimony.",
          description:
            "An intimate community night with Jado Sinza & Esther and guest choirs from Nyamirambo. The evening included the first live performance of Imbabazi.",
          venue: "Nyamirambo Stadium",
          city: "Kigali",
          country: "Rwanda",
          startsAt: new Date("2025-05-30T18:30:00+02:00"),
          status: "past",
          coverUrl: "/images/duo-stage.jpg",
          gallery: ["/images/studio-choir.jpg"],
          videos: ["02eldff6nj0"],
        },
      ])
      .returning({ id: s.concerts.id, slug: s.concerts.slug });

    const tierSet: Record<string, Array<[string, string, number, number, string]>> = {
      "inkuru-y-agakiza-live": [
        ["Early Bird", "5000", 200, 320, "First release — limited"],
        ["Regular", "10000", 800, 214, "Standing & upper seating"],
        ["VIP", "25000", 200, 41, "Front seating + welcome pack"],
        ["VVIP Table", "60000", 60, 8, "Table for 4, meet & greet"],
      ],
      "umwizera-worship-night": [
        ["Regular", "12000", 800, 118, "Candle-lit seating"],
        ["Couples", "20000", 200, 26, "Two seats together"],
        ["VIP", "35000", 200, 12, "Front rows + signed CD"],
      ],
      "yego-niyo-tour-praise-night": [
        ["Early Bird", "6000", 500, 77, "On sale until 1 Jan"],
        ["Regular", "12000", 2500, 9, "General admission"],
        ["VIP", "30000", 300, 0, "Seated + merchandise voucher"],
      ],
      "gospel-sunrise-musanze": [
        ["Free Entry", "0", 3000, 412, "First come, first served"],
        ["Supporter", "5000", 300, 21, "Funds the choir transport"],
      ],
      "redemption-concert": [["General", "8000", 6000, 6000, "Sold out"]],
      "night-of-worship-nyamirambo": [["General", "5000", 2000, 2000, "Sold out"]],
    };

    const tiers: (typeof s.ticketTypes.$inferInsert)[] = [];
    for (const c of inserted) {
      const set = tierSet[c.slug] ?? [];
      set.forEach((t, i) => {
        tiers.push({
          concertId: c.id,
          name: t[0],
          price: t[1],
          quantityTotal: t[2],
          quantitySold: t[3],
          description: t[4],
          sortOrder: i + 1,
        });
      });
    }
    if (tiers.length) await db.insert(s.ticketTypes).values(tiers);
  }

  /* ---------------- products ---------------- */
  if (await isEmpty(s.products)) {
    await db.insert(s.products).values([
      {
        title: "Sinza Universal Heavyweight Hoodie",
        slug: "heavyweight-hoodie",
        category: "apparel",
        description:
          "400gsm brushed cotton hoodie in bone cream with the signature crimson diagonal stripe. Embroidered brass pin included.",
        price: "45000",
        imageUrl: "/images/merch-hoodie.jpg",
        stock: 120,
        featured: true,
        sortOrder: 1,
      },
      {
        title: "Crimson Stripe T-Shirt",
        slug: "crimson-stripe-tshirt",
        category: "apparel",
        description: "240gsm cotton tee, screen printed in Kigali. Available in S – XXL.",
        price: "25000",
        imageUrl: "/images/merch-hoodie.jpg",
        stock: 240,
        featured: true,
        sortOrder: 2,
      },
      {
        title: "Sinza Universal Cap",
        slug: "sinza-universal-cap",
        category: "apparel",
        description: "Six-panel charcoal cap with brass aglets and an embroidered mark.",
        price: "18000",
        imageUrl: "/images/merch-hoodie.jpg",
        stock: 180,
        sortOrder: 3,
      },
      {
        title: "Inkuru y'Agakiza — CD",
        slug: "inkuru-cd",
        category: "music",
        description: "The physical album with a 16-page lyric booklet printed on cream stock.",
        price: "12000",
        imageUrl: "/images/album-inkuru.jpg",
        stock: 300,
        featured: true,
        sortOrder: 4,
      },
      {
        title: "Umwizera — Limited Vinyl",
        slug: "umwizera-vinyl",
        category: "music",
        description: "180g heavyweight vinyl, gatefold sleeve, limited to 500 numbered copies.",
        price: "55000",
        imageUrl: "/images/album-umwizera.jpg",
        stock: 60,
        featured: true,
        sortOrder: 5,
      },
      {
        title: "Redemption Concert Poster (A1)",
        slug: "redemption-concert-poster",
        category: "prints",
        description: "Museum-grade A1 print of the Redemption Concert artwork. Ships rolled in a tube.",
        price: "8000",
        imageUrl: "/images/concert-redemption.jpg",
        stock: 90,
        sortOrder: 6,
      },
      {
        title: "Worship Wristband (3-pack)",
        slug: "worship-wristband",
        category: "accessories",
        description: "Silicone wristbands in crimson, bone and charcoal with the ministry verse.",
        price: "5000",
        imageUrl: "/images/news-crowd.jpg",
        stock: 500,
        sortOrder: 7,
      },
      {
        title: "Canvas Tote — 'Yego Niyo'",
        slug: "canvas-tote-yego-niyo",
        category: "accessories",
        description: "Natural canvas tote with a crimson typographic print. Fits an A3 record sleeve.",
        price: "15000",
        imageUrl: "/images/merch-hoodie.jpg",
        stock: 150,
        sortOrder: 8,
      },
    ]);
  }

  /* ---------------- pages ---------------- */
  if (await isEmpty(s.pages)) {
    await db.insert(s.pages).values([
      {
        slug: "about",
        title: "About Sinza Universal Company",
        seoTitle: "About — Jado Sinza & Esther | Sinza Universal Company",
        seoDescription:
          "Jado Sinza is a Rwandan Christian gospel singer and songwriter with over five years of active music ministry. Learn about the ministry, the team and Sinza Universal Company.",
        content: `
<h2>The ministry</h2>
<p><strong>Jado Sinza</strong> is a prominent Rwandan Christian gospel singer and songwriter with over five years of active music ministry. He is widely recognised for spreading the message of Jesus Christ through standard and high-quality praise and worship music, sung primarily in Kinyarwanda and reaching listeners across East Africa and the diaspora.</p>
<p>He frequently collaborates with fellow gospel artist <strong>Esther (Esther Umulisa)</strong>. Together they have released several major hit records — including <em>Yego Niyo</em>, <em>Yankijije Burundu</em>, <em>Ni Nziza</em>, <em>Imbabazi</em> and <em>Aragukunda</em> — and officially tied the knot. Their music is hosted on the official Jado Sinza &amp; Esther YouTube channel.</p>
<h2>What we do</h2>
<ul>
  <li><strong>Music &amp; publishing</strong> — writing, recording, distribution through DistroKid and 4883369 Records DK.</li>
  <li><strong>Live events</strong> — from the Redemption Concert at Camp Kigali to arena worship nights across Rwanda.</li>
  <li><strong>Media</strong> — music videos, live sessions, photography and devotionals published weekly.</li>
  <li><strong>Merchandise</strong> — apparel and printed goods that fund the ministry's outreach work.</li>
</ul>
<h2>The team</h2>
<p>Sinza Universal Company is a Kigali-based team of musicians, engineers, designers and event producers. Music production is led by <strong>Bolingo Paccy</strong> at UB Records, with video direction by <strong>Musinga</strong> and editing by <strong>Eddie Cuts</strong>.</p>
<h2>Discography</h2>
<p>Albums include <em>Inkuru y'Agakiza</em> and <em>Umwizera</em>, alongside solo and collaborative singles <em>Golgotha (Halleluya)</em> (2018), <em>Umwizera</em> (2024), <em>Aragukunda</em> (2025), <em>Imbabazi</em> (2025), <em>Ni Nziza</em> (2025), <em>Yankijije Burundu</em> (2026) and <em>Yego Niyo</em> (2026).</p>
<p class="text-sm">Sources: <a href="https://music.apple.com/ca/artist/jado-sinza/1667469711">Apple Music</a>, <a href="https://www.citimuzik.com/2026/09/jado-sinza-x-esther-umulisa-yego-niyo-mp3-download.html">CitiMuzik</a>, <a href="https://www.afrocharts.com/artist?id=8040cf6eee">Afrocharts</a>.</p>`,
      },
      {
        slug: "privacy",
        title: "Privacy Policy",
        seoTitle: "Privacy Policy — Sinza Universal Company",
        seoDescription: "How Sinza Universal Company collects, uses and protects your personal data.",
        content: `
<p>Last updated: 12 October 2026. This policy explains how <strong>Sinza Universal Company</strong> ("we", "us") handles your data when you use this website, buy tickets or merchandise, or subscribe to our newsletter.</p>
<h2>1. What we collect</h2>
<ul>
  <li><strong>Booking &amp; order data</strong> — name, email, phone number, ticket and merchandise selections, payment reference. You do <em>not</em> need an account to buy a ticket.</li>
  <li><strong>Newsletter data</strong> — email address and, optionally, your name.</li>
  <li><strong>Comments</strong> — your display name, email (never published) and comment text.</li>
  <li><strong>Technical data</strong> — device, browser and pages viewed, used in aggregate to improve the site.</li>
</ul>
<h2>2. How we use it</h2>
<p>To process payments and issue tickets, to send transactional email (order confirmations, ticket reminders), to send our newsletter if you opted in, to moderate comments, and to comply with Rwandan law.</p>
<h2>3. Payments</h2>
<p>Payments are processed by <strong>Pesapal</strong>, <strong>PawaPay</strong>, and mobile money providers <strong>MTN MoMo</strong> and <strong>Airtel Money</strong>, plus card schemes <strong>Visa</strong> and <strong>Mastercard</strong>. We never store your card number or mobile money PIN.</p>
<h2>4. Email</h2>
<p>Transactional and marketing email is sent through <strong>Resend</strong>. Every newsletter carries a one-click unsubscribe link.</p>
<h2>5. Your rights</h2>
<p>You may request access, correction or deletion of your data at any time by writing to <a href="mailto:privacy@sinzauniversal.com">privacy@sinzauniversal.com</a>. We respond within 30 days.</p>
<h2>6. Retention</h2>
<p>Order records are kept for 7 years for accounting purposes. Newsletter data is kept until you unsubscribe. Comments are kept until you ask us to remove them.</p>`,
      },
      {
        slug: "terms",
        title: "Terms and Conditions",
        seoTitle: "Terms & Conditions — Sinza Universal Company",
        seoDescription: "Terms governing ticket sales, merchandise orders and use of this website.",
        content: `
<p>These terms govern your use of sinzauniversal.com and every purchase made through it.</p>
<h2>1. Tickets</h2>
<ul>
  <li>Tickets are sold per person and are valid only for the date and venue shown.</li>
  <li>A ticket reference is issued by email immediately after payment. No account is required.</li>
  <li>Tickets are non-refundable except where an event is cancelled. If an event is postponed, your ticket remains valid for the new date.</li>
  <li>Reselling a ticket above face value voids it.</li>
  <li>Children under 5 enter free with a paying adult unless stated otherwise.</li>
</ul>
<h2>2. Merchandise</h2>
<p>Physical goods are dispatched within 3 working days inside Rwanda and 7–14 days internationally. Sizes may vary slightly; exchanges are accepted within 14 days on unworn goods with proof of purchase.</p>
<h2>3. Digital content</h2>
<p>Album and track purchases are for personal use. Redistribution, resampling or commercial use requires written permission from Sinza Universal Company.</p>
<h2>4. Conduct</h2>
<p>We reserve the right to refuse entry or remove any attendee whose conduct endangers others or disrupts the event, without refund.</p>
<h2>5. Liability</h2>
<p>Our liability is limited to the amount you paid for the ticket or product. Nothing in these terms limits rights you have under Rwandan consumer law.</p>
<h2>6. Contact</h2>
<p>Questions: <a href="mailto:legal@sinzauniversal.com">legal@sinzauniversal.com</a>, KG 7 Ave, Kigali, Rwanda.</p>`,
      },
      {
        slug: "contact",
        title: "Contact Us",
        seoTitle: "Contact Us — Sinza Universal Company",
        seoDescription: "Booking, press, collaboration and support contacts for Sinza Universal Company in Kigali, Rwanda.",
        content: `
<p>We read everything. Choose the right desk below and we will get back to you within two working days.</p>
<h2>Departments</h2>
<ul>
  <li><strong>Bookings &amp; events</strong> — <a href="mailto:bookings@sinzauniversal.com">bookings@sinzauniversal.com</a></li>
  <li><strong>Press &amp; media</strong> — <a href="mailto:press@sinzauniversal.com">press@sinzauniversal.com</a></li>
  <li><strong>Music &amp; collaborations</strong> — <a href="mailto:music@sinzauniversal.com">music@sinzauniversal.com</a></li>
  <li><strong>Orders &amp; support</strong> — <a href="mailto:hello@sinzauniversal.com">hello@sinzauniversal.com</a></li>
</ul>
<h2>Studio</h2>
<p>KG 7 Ave, Kigali, Rwanda · +250 788 300 120 · Monday – Friday, 09:00 – 18:00 CAT.</p>`,
      },
    ]);
  }

  /* ---------------- posts ---------------- */
  if (await isEmpty(s.posts)) {
    const inserted = await db
      .insert(s.posts)
      .values([
        {
          title: "'Yego Niyo': Jado Sinza & Esther release a new song of thanksgiving",
          slug: "yego-niyo-new-song",
          category: "release",
          excerpt:
            "Released on 16 September 2026, 'Yego Niyo' — 'Yes, He Is' — is a worship record about God's faithfulness, distributed globally through DistroKid.",
          coverUrl: "/images/album-inkuru.jpg",
          sourceName: "CitiMuzik",
          sourceUrl: "https://www.citimuzik.com/2026/09/jado-sinza-x-esther-umulisa-yego-niyo-mp3-download.html",
          tags: ["release", "yego niyo", "esther"],
          featured: true,
          publishedAt: new Date("2026-09-16T09:00:00+02:00"),
          seoTitle: "'Yego Niyo' — new worship single from Jado Sinza & Esther",
          seoDescription:
            "Jado Sinza and Esther Umulisa release 'Yego Niyo', a Kinyarwanda worship song of thanksgiving distributed by DistroKid.",
          content: `
<p>Rwandan gospel couple <strong>Jado Sinza</strong> and his wife <strong>Esther Umulisa</strong> have joined voices on <em>Yego Niyo</em>, a Christian gospel and worship song released on <strong>16 September 2026</strong>. The title translates as <em>"Yes, He Is"</em> — a message of faith, gratitude and praise.</p>
<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/Uy0blMiY4mU" title="Ni Nziza — Jado Sinza &amp; Esther" allowfullscreen></iframe></div>
<p>The song centres on God's faithfulness and goodness, giving thanks for His work in the lives of believers and reaffirming that He fulfils His promises. Distributed globally through DistroKid, it adds another meaningful worship release to the ministry.</p>
<blockquote>"Through their heartfelt delivery and thanksgiving-focused message, <em>Yego Niyo</em> is a fitting song for personal worship and reflection."</blockquote>
<p><img src="/images/news-crowd.jpg" alt="Worshippers with raised hands at a Jado Sinza concert in Kigali" /></p>
<p>Stream it now on the <a href="https://www.youtube.com/@jadosinza14">official Jado Sinza &amp; Esther YouTube channel</a>, and catch it live at the <a href="/concerts/inkuru-y-agakiza-live">Inkuru y'Agakiza album concert</a>.</p>
<p class="text-sm">Source: CitiMuzik (2026). Related releases: <em>Yankijije Burundu</em>, <em>Yampinduye Mushya</em>, <em>Ni Nziza</em>.</p>`,
        },
        {
          title: "'Yankijije Burundu' — the couple's testimony of complete salvation",
          slug: "yankijije-burundu-testimony",
          category: "release",
          excerpt:
            "Officially released on 17 July 2026, the worship ballad translates as 'He Saved Me Completely'.",
          coverUrl: "/images/duo-stage.jpg",
          sourceName: "CitiMuzik",
          sourceUrl: "https://www.citimuzik.com/2026/07/jado-sinza-esther-yankijije-burundu-mp3-download.html",
          tags: ["release", "worship"],
          publishedAt: new Date("2026-07-17T10:00:00+02:00"),
          content: `
<p><em>Yankijije Burundu</em> is a heartfelt Kinyarwanda gospel song celebrating the saving grace and transforming power of Jesus Christ. The title translates as <em>"He Saved Me Completely"</em> — a testimony of complete salvation, redemption and gratitude.</p>
<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/Q9Uqu-9s6D4" title="Yankijije Burundu — Jado Sinza &amp; Esther" allowfullscreen></iframe></div>
<p>Musically the song blends gentle acoustic instrumentation with rich vocal harmonies, creating a peaceful worship atmosphere that encourages prayer, reflection and thanksgiving. It follows the well-received releases <em>Imbabazi</em> and <em>Yampinduye Mushya</em>.</p>`,
        },
        {
          title: "'Imbabazi': seeking peace, meeting Jesus, receiving endless mercy",
          slug: "imbabazi-endless-mercy",
          category: "release",
          excerpt:
            "Released 3 March 2025 through 4883369 Records DK, 'Imbabazi' remains one of the ministry's most-streamed records.",
          coverUrl: "/images/album-umwizera.jpg",
          sourceName: "Apple Music",
          sourceUrl: "https://music.apple.com/rw/album/imbabazi-jado-sinza-esther-single/1800122468",
          tags: ["release", "imbabazi"],
          publishedAt: new Date("2025-03-03T08:00:00+02:00"),
          content: `
<p>Written about seeking peace, meeting Jesus and receiving endless mercy, <em>Imbabazi</em> was released on 3 March 2025 as a single by Jado SINZA and Jado Sinza &amp; Esther (Bolingo), published by 4883369 Records DK.</p>
<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/02eldff6nj0" title="Imbabazi — Jado Sinza &amp; Esther" allowfullscreen></iframe></div>
<p>The record became a fixture of Sunday morning playlists across Rwanda and is now performed in churches in Kigali, Huye and Musanze.</p>`,
        },
        {
          title: "Inside the Redemption Concert live recording at Camp Kigali",
          slug: "redemption-concert-live-recording",
          category: "events",
          excerpt:
            "Six thousand worshippers, one night, and the live album that became 'Umwizera'.",
          coverUrl: "/images/concert-redemption.jpg",
          sourceName: "Sinza Universal Company",
          tags: ["concert", "live", "umwizera"],
          publishedAt: new Date("2024-08-28T12:00:00+02:00"),
          content: `
<p>The Redemption Concert at Camp Kigali was the largest gathering the ministry had hosted: a full band, a mass choir, brass, and six thousand worshippers singing every word back to the stage.</p>
<p><img src="/images/concert-redemption.jpg" alt="Redemption Concert at Camp Kigali" /></p>
<p>The live recording became the <em>Umwizera</em> album and the <em>Agakiza / Umuragwa</em> EP — both available now in the <a href="/store">Sinza Universal store</a>. Photos and the full concert video are archived on the <a href="/concerts/redemption-concert">event page</a>.</p>`,
        },
      ])
      .returning({ id: s.posts.id });

    const [first, second] = inserted;
    await db.insert(s.comments).values([
      {
        postId: first.id,
        authorName: "Diane Uwase",
        email: "diane@example.com",
        body: "This song has been on repeat in our house since Sunday. Murakoze cyane!",
        status: "approved",
      },
      {
        postId: first.id,
        parentId: undefined,
        authorName: "Eric Nshuti",
        email: "eric@example.com",
        body: "The harmonies in the second verse are incredible. Will there be a live version at the album concert?",
        status: "approved",
      },
      {
        postId: second.id,
        authorName: "Grace Mukamana",
        email: "grace@example.com",
        body: "Yankijije Burundu carried me through a very hard season. Thank you for your ministry.",
        status: "approved",
      },
    ]);
    const replies = await db.select({ id: s.comments.id }).from(s.comments).limit(1);
    if (replies[0]) {
      await db.insert(s.comments).values({
        postId: first.id,
        parentId: replies[0].id,
        authorName: "Sinza Universal",
        email: "hello@sinzauniversal.com",
        body: "Thank you Diane — pray with us that it reaches the people who need it. Amen!",
        status: "approved",
      });
    }
  }

  /* ---------------- media library ---------------- */
  if (await isEmpty(s.media)) {
    await db.insert(s.media).values([
      {
        title: "Hero — stage light",
        url: "/images/hero-stage.jpg",
        thumbnailUrl: "/images/hero-stage.jpg",
        type: "image",
        category: "hero",
        source: "upload",
        mimeType: "image/jpeg",
        publishedAt: new Date(),
      },
      {
        title: "Redemption Concert — Camp Kigali",
        url: "/images/concert-redemption.jpg",
        thumbnailUrl: "/images/concert-redemption.jpg",
        type: "image",
        category: "concerts",
        source: "upload",
        mimeType: "image/jpeg",
        publishedAt: new Date("2024-08-25"),
      },
      {
        title: "Inkuru y'Agakiza cover",
        url: "/images/album-inkuru.jpg",
        thumbnailUrl: "/images/album-inkuru.jpg",
        type: "image",
        category: "covers",
        source: "upload",
        mimeType: "image/jpeg",
        publishedAt: new Date("2025-06-01"),
      },
      {
        title: "Umwizera cover",
        url: "/images/album-umwizera.jpg",
        thumbnailUrl: "/images/album-umwizera.jpg",
        type: "image",
        category: "covers",
        source: "upload",
        mimeType: "image/jpeg",
        publishedAt: new Date("2024-04-01"),
      },
      {
        title: "Jado Sinza & Esther on stage",
        url: "/images/duo-stage.jpg",
        thumbnailUrl: "/images/duo-stage.jpg",
        type: "image",
        category: "press",
        source: "upload",
        mimeType: "image/jpeg",
        publishedAt: new Date("2025-05-30"),
      },
      {
        title: "Merch flat lay",
        url: "/images/merch-hoodie.jpg",
        thumbnailUrl: "/images/merch-hoodie.jpg",
        type: "image",
        category: "store",
        source: "upload",
        mimeType: "image/jpeg",
        publishedAt: new Date("2026-01-12"),
      },
      {
        title: "Studio session",
        url: "/images/studio-choir.jpg",
        thumbnailUrl: "/images/studio-choir.jpg",
        type: "image",
        category: "press",
        source: "upload",
        mimeType: "image/jpeg",
        publishedAt: new Date("2025-11-02"),
      },
      {
        title: "Worship crowd",
        url: "/images/news-crowd.jpg",
        thumbnailUrl: "/images/news-crowd.jpg",
        type: "image",
        category: "concerts",
        source: "upload",
        mimeType: "image/jpeg",
        publishedAt: new Date("2026-02-14"),
      },
      {
        title: "NI NZIZA (Official Music Video)",
        url: "https://www.youtube.com/watch?v=Uy0blMiY4mU",
        thumbnailUrl: "https://i.ytimg.com/vi/Uy0blMiY4mU/hqdefault.jpg",
        type: "video",
        category: "music videos",
        source: "youtube",
        externalId: "Uy0blMiY4mU",
        externalUrl: "https://www.youtube.com/watch?v=Uy0blMiY4mU",
        publishedAt: new Date("2025-09-07"),
      },
      {
        title: "YANKIJIJE BURUNDU — Jado Sinza & Esther",
        url: "https://www.youtube.com/watch?v=Q9Uqu-9s6D4",
        thumbnailUrl: "https://i.ytimg.com/vi/Q9Uqu-9s6D4/hqdefault.jpg",
        type: "video",
        category: "music videos",
        source: "youtube",
        externalId: "Q9Uqu-9s6D4",
        externalUrl: "https://www.youtube.com/watch?v=Q9Uqu-9s6D4",
        publishedAt: new Date("2026-07-17"),
      },
      {
        title: "Imbabazi — Jado Sinza & Esther",
        url: "https://www.youtube.com/watch?v=02eldff6nj0",
        thumbnailUrl: "https://i.ytimg.com/vi/02eldff6nj0/hqdefault.jpg",
        type: "video",
        category: "music videos",
        source: "youtube",
        externalId: "02eldff6nj0",
        externalUrl: "https://www.youtube.com/watch?v=02eldff6nj0",
        publishedAt: new Date("2025-03-04"),
      },
      {
        title: "ARAGUKUNDA — Jado Sinza & Esther",
        url: "https://www.youtube.com/watch?v=tRvbsDcSd5w",
        thumbnailUrl: "https://i.ytimg.com/vi/tRvbsDcSd5w/hqdefault.jpg",
        type: "video",
        category: "music videos",
        source: "youtube",
        externalId: "tRvbsDcSd5w",
        externalUrl: "https://www.youtube.com/watch?v=tRvbsDcSd5w",
        publishedAt: new Date("2025-05-26"),
      },
      {
        title: "@jadosinza on Instagram",
        url: "https://www.instagram.com/jadosinza/?hl=en",
        thumbnailUrl: "/images/news-crowd.jpg",
        type: "video",
        category: "reels",
        source: "instagram",
        externalId: "jadosinza",
        externalUrl: "https://www.instagram.com/jadosinza/?hl=en",
        publishedAt: new Date("2026-09-16"),
      },
      {
        title: "SinzaJado on Facebook",
        url: "https://web.facebook.com/SinzaJado/",
        thumbnailUrl: "/images/studio-choir.jpg",
        type: "video",
        category: "reels",
        source: "facebook",
        externalId: "SinzaJado",
        externalUrl: "https://web.facebook.com/SinzaJado/",
        publishedAt: new Date("2026-08-11"),
      },
      {
        title: "@JadoSinza on X",
        url: "https://x.com/JadoSinza",
        thumbnailUrl: "/images/duo-stage.jpg",
        type: "video",
        category: "clips",
        source: "x",
        externalId: "JadoSinza",
        externalUrl: "https://x.com/JadoSinza",
        publishedAt: new Date("2026-08-30"),
      },
    ]);
  }

  /* ---------------- subscribers + newsletter ---------------- */
  if (await isEmpty(s.subscribers)) {
    await db.insert(s.subscribers).values([
      { email: "diane.uwase@example.com", name: "Diane Uwase", source: "site" },
      { email: "eric.nshuti@example.com", name: "Eric Nshuti", source: "site" },
      { email: "grace.mukamana@example.com", name: "Grace Mukamana", source: "concert" },
      { email: "jean.baptiste@example.com", name: "Jean Baptiste", source: "site" },
      { email: "ariane.ingabire@example.com", name: "Ariane Ingabire", source: "instagram" },
      { email: "kevin.rukundo@example.com", name: "Kevin Rukundo", source: "site" },
    ]);
  }

  if (await isEmpty(s.newsletters)) {
    await db.insert(s.newsletters).values([
      {
        subject: "Yego Niyo is here — plus the album concert dates",
        preheader: "New single, new tour dates, and a first look at the merch.",
        status: "sent",
        sentAt: new Date("2026-09-18T09:00:00+02:00"),
        recipientsCount: 6,
        body: `<h2>Yego Niyo</h2><p>Our new single with Esther is out now — a song of thanksgiving for God's faithfulness.</p><p><a href="https://www.youtube.com/@jadosinza14">Watch the video</a> · <a href="/concerts">See the tour dates</a></p>`,
      },
      {
        subject: "Inkuru y'Agakiza Live — tickets now open",
        preheader: "12 December, Kigali Convention Centre.",
        status: "draft",
        body: `<h2>Tickets are open</h2><p>Join us on 12 December at the Kigali Convention Centre for the full album performed live.</p><p><a href="/concerts/inkuru-y-agakiza-live">Book your seat</a></p>`,
      },
    ]);
  }

  /* ---------------- sample orders ---------------- */
  if (await isEmpty(s.orders)) {
    await db.insert(s.orders).values([
      {
        ref: "SIN-2026-0001",
        type: "ticket",
        status: "paid",
        customerName: "Diane Uwase",
        email: "diane.uwase@example.com",
        phone: "+250 788 111 222",
        items: [{ label: "Inkuru y'Agakiza Live — VIP", qty: 2, price: 25000 }],
        subtotal: "50000",
        fees: "1500",
        total: "51500",
        paymentMethod: "mtn",
        paymentRef: "MTN260912.1432.A12345",
      },
      {
        ref: "SIN-2026-0002",
        type: "product",
        status: "paid",
        customerName: "Eric Nshuti",
        email: "eric.nshuti@example.com",
        phone: "+250 788 333 444",
        items: [{ label: "Sinza Universal Heavyweight Hoodie", qty: 1, price: 45000 }],
        subtotal: "45000",
        fees: "0",
        total: "45000",
        paymentMethod: "visa",
        paymentRef: "PES-9F2K1L",
      },
      {
        ref: "SIN-2026-0003",
        type: "ticket",
        status: "pending",
        customerName: "Grace Mukamana",
        email: "grace.mukamana@example.com",
        phone: "+250 788 555 666",
        items: [{ label: "Umwizera Worship Night — Couples", qty: 1, price: 20000 }],
        subtotal: "20000",
        fees: "600",
        total: "20600",
        paymentMethod: "airtel",
      },
    ]);
  }
}


