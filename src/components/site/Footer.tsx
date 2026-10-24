import Link from "next/link";
import { SinzaLogo } from "@/components/site/Logo";
import { SocialIcon, PaymentMark } from "@/components/site/Icons";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import type { Social } from "@/components/site/Nav";

export function Footer({
  site,
  socials,
  lang = "en",
}: {
  site: Record<string, any>;
  socials: Social[];
  lang?: string;
}) {
  const year = new Date().getFullYear();
  const columns = [
    {
      title: "Explore",
      links: [
        { href: "/music", label: "Music & albums" },
        { href: "/videos", label: "Videos" },
        { href: "/concerts", label: "Concert schedule" },
        { href: "/news", label: "News & press" },
      ],
    },
    {
      title: "Shop",
      links: [
        { href: "/store", label: "Merchandise" },
        { href: "/store?tab=music", label: "Buy an album" },
        { href: "/concerts", label: "Concert tickets" },
        { href: "/store?tab=prints", label: "Prints & posters" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About us" },
        { href: "/contact", label: "Contact us" },
        { href: "/news", label: "Press kit" },
        { href: "/contact", label: "Bookings & events" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/privacy", label: "Privacy policy" },
        { href: "/terms", label: "Terms & conditions" },
        { href: "/contact", label: "Refund policy" },
        { href: "/admin", label: "Admin portal" },
      ],
    },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line">
      <div className="gradient-ink absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-[1600px] px-5 pb-10 pt-16 sm:px-8 lg:pl-24 lg:pr-10">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_2fr]">
          <div>
            <SinzaLogo size={44} />
            <p className="mt-6 max-w-sm text-[0.98rem] leading-relaxed text-muted">
              {site.tagline ||
                "Official platform of Jado Sinza & Esther — music, videos, concerts, tickets and merchandise from Kigali, Rwanda."}
            </p>

            <div className="mt-7">
              <span className="label">Follow the ministry</span>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    title={s.label}
                    className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:text-primary"
                  >
                    <SocialIcon platform={s.platform} size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <span className="label">We accept</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {["mtn", "airtel", "visa", "mastercard", "pesapal", "pawapay"].map((m) => (
                  <PaymentMark key={m} method={m} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {columns.map((col) => (
                <div key={col.title}>
                  <h4 className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-primary">
                    {col.title}
                  </h4>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((l) => (
                      <li key={`${col.title}-${l.label}`}>
                        <Link
                          href={l.href}
                          className="text-[0.92rem] text-muted transition-colors duration-200 hover:text-primary"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-line bg-surface/70 p-6">
              <h4 className="font-display text-2xl leading-tight">
                Subscribe to <span className="italic-voice">Newsletter</span>
              </h4>
              <p className="mt-2 text-sm text-muted">
                New music, tour dates and devotionals — sent a few times a week, never sold.
              </p>
              <div className="mt-5">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-7 text-[0.82rem] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.footerNote || "All rights reserved."} |  
            <a className="hover:text-green-500 ms-2" href="https://www.patcreator.com">Created by Patcreator</a>
          </p>
          <p className="tnum">
            {site.address || "KG 7 Ave, Kigali, Rwanda"} ·{" "}
            <a href={`tel:${site.phone || ""}`} className="hover:text-primary">
              {site.phone}
            </a>{" "}
            ·{" "}
            <a href={`mailto:${site.email || ""}`} className="hover:text-primary">
              {site.email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
