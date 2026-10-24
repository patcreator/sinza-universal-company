import type { Metadata, Viewport } from "next";
import { getAllSettings, defaultTheme, defaultSite } from "@/lib/settings";
import { RevealObserver } from "@/components/site/Motion";
import "./globals.css";

export const dynamic = "force-dynamic";

async function loadTheme() {
  try {
    const all = await getAllSettings();
    return { theme: { ...defaultTheme, ...(all.theme ?? {}) }, site: { ...defaultSite, ...(all.site ?? {}) }, seo: all.seo ?? {} };
  } catch {
    return { theme: defaultTheme, site: defaultSite, seo: {} as Record<string, any> };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { seo, site } = await loadTheme();
  const title = seo.defaultTitle || `${site.siteName} — Jado Sinza & Esther`;
  return {
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    title: { default: title, template: seo.titleTemplate || "%s — Sinza Universal Company" },
    description: seo.defaultDescription || site.tagline,
    keywords: seo.keywords ?? ["Jado Sinza", "Rwandan gospel", "Sinza Universal Company"],
    authors: [{ name: site.siteName }],
    creator: site.siteName,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: site.siteName,
      title,
      description: seo.defaultDescription,
      images: [{ url: seo.ogImage || "/images/hero-stage.jpg", width: 1536, height: 1024, alt: site.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      site: seo.twitterHandle || "@JadoSinza",
      title,
      description: seo.defaultDescription,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#131010" },
    { media: "(prefers-color-scheme: light)", color: "#F3EDE7" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme, site } = await loadTheme();

  const vars = {
    "--primary": theme.primary,
    "--primary-dark": theme.primaryDark,
    "--accent": theme.accent,
    "--ink": theme.ink,
    "--bone": theme.bone,
    "--radius": `${theme.radius ?? 18}px`,
  } as React.CSSProperties;

  return (
    <html
      lang={site.defaultLanguage || "en"}
      className={theme.defaultMode === "light" ? "light" : "dark"}
      style={vars}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=localStorage.getItem('sinza-mode')||'${theme.defaultMode || "dark"}';document.documentElement.classList.add(m);document.documentElement.classList.remove(m==='dark'?'light':'dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        <RevealObserver />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: site.siteName,
              url: process.env.SITE_URL || "https://sinzauniversal.com",
              logo: "/images/album-inkuru.jpg",
              description: site.tagline,
              address: { "@type": "PostalAddress", addressLocality: "Kigali", addressCountry: "RW" },
              sameAs: [
                "https://www.instagram.com/jadosinza/?hl=en",
                "https://www.youtube.com/@jadosinza14",
                "https://web.facebook.com/SinzaJado/",
                "https://x.com/JadoSinza",
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
