"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Ticket } from "lucide-react";
import { SinzaLogo } from "@/components/site/Logo";
import { SocialIcon } from "@/components/site/Icons";
import { useScrollProgress } from "@/components/site/Motion";
import { t, languageNames, normaliseLang, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/format";

export type Social = { platform: string; label: string; url: string; icon?: string | null };

export function Nav({
  socials,
  lang = "en",
  allowModeSwitch = true,
  showStore = true,
  showNews = true,
}: {
  socials: Social[];
  lang?: string;
  allowModeSwitch?: boolean;
  showStore?: boolean;
  showNews?: boolean;
}) {
  const { scrolled } = useScrollProgress();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const locale = normaliseLang(lang);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sinza-mode");
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const toggleMode = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("sinza-mode", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
  };

  const setLang = (value: Lang) => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", value);
    window.location.href = url.toString();
  };

  const links = [
    { href: "/music", label: t(locale, "nav.music") },
    { href: "/videos", label: t(locale, "nav.videos") },
    { href: "/concerts", label: t(locale, "nav.concerts") },
    ...(showStore ? [{ href: "/store", label: t(locale, "nav.store") }] : []),
    ...(showNews ? [{ href: "/news", label: t(locale, "nav.news") }] : []),
    { href: "/about", label: t(locale, "nav.about") },
  ];

  const overlay = open;
  const solid = scrolled || overlay;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] transition-[background,backdrop-filter,border-color,padding] duration-500",
          solid ? "glass border-b border-line py-2" : "py-4",
        )}
      >
        <nav className="mx-auto flex max-w-[1600px] items-center gap-6 px-5 sm:px-8 lg:pl-24 lg:pr-10">
          <Link
            href="/"
            className={cn(
              "flex items-center transition-colors duration-500",
              solid ? "text-text" : "text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]",
            )}
            aria-label="Sinza Universal Company — home"
          >
            <SinzaLogo size={36} />
          </Link>

          <ul className="ml-auto hidden items-center gap-7 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "relative text-[0.82rem] font-medium tracking-[0.13em] uppercase transition-opacity duration-300 hover:opacity-100",
                    solid ? "text-text" : "text-white/90 drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)]",
                    pathname.startsWith(l.href) ? "opacity-100" : "opacity-70",
                  )}
                >
                  {l.label}
                  {pathname.startsWith(l.href) && (
                    <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div
            className={cn(
              "hidden items-center gap-2 xl:flex",
              solid ? "text-muted" : "text-white/75",
            )}
          >
            {socials.slice(0, 5).map((s) => (
              <a
                key={s.platform}
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.label}
                className="transition-transform duration-300 hover:-translate-y-0.5 hover:text-primary"
              >
                <SocialIcon platform={s.platform} size={16} />
              </a>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {allowModeSwitch && mounted && (
              <button
                onClick={toggleMode}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full border transition-colors duration-300",
                  solid
                    ? "border-line text-text hover:border-primary hover:text-primary"
                    : "border-white/35 text-white hover:bg-white/15",
                )}
              >
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            )}

            <select
              aria-label="Language"
              value={locale}
              onChange={(e) => setLang(e.target.value as Lang)}
              className={cn(
                "hidden h-10 rounded-full border bg-transparent px-3 text-[0.72rem] tracking-[0.14em] uppercase outline-none sm:block",
                solid ? "border-line text-muted" : "border-white/35 text-white bg-white/5",
              )}
            >
              {(Object.keys(languageNames) as Lang[]).map((l) => (
                <option key={l} value={l} className="bg-bg text-text">
                  {l.toUpperCase()}
                </option>
              ))}
            </select>

            <Link
              href="/concerts"
              className={cn("btn btn-primary hidden sm:inline-flex", !solid && "btn-bone")}
            >
              <Ticket size={16} />
              {t(locale, "nav.tickets")}
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t(locale, "nav.close") : t(locale, "nav.menu")}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full border lg:hidden",
                solid ? "border-line text-text" : "border-white/35 text-white",
              )}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* mobile / tablet overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[55] transition-[opacity,visibility] duration-400 lg:hidden",
          overlay ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="gradient-ink absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between px-6 pb-10 pt-28">
          <ul className="space-y-1">
            {[...links, { href: "/contact", label: t(locale, "nav.contact") }].map((l, i) => (
              <li key={l.href} style={{ transitionDelay: `${i * 55}ms` }}>
                <Link
                  href={l.href}
                  className="block border-b border-line/70 py-4 font-display text-[2.15rem] leading-none text-text transition-colors hover:text-primary"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div>
            <Link href="/concerts" className="btn btn-primary w-full">
              <Ticket size={16} />
              {t(locale, "nav.tickets")}
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-muted">
              {socials.map((s) => (
                <a
                  key={s.platform}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="transition-colors hover:text-primary"
                >
                  <SocialIcon platform={s.platform} size={19} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Desktop-only fixed spine rail: rotated wordmark, socials, read progress. */
export function Spine({ socials }: { socials: Social[] }) {
  const { progress } = useScrollProgress();
  return (
    <aside className="fixed left-0 top-0 z-[58] hidden h-full w-20 flex-col items-center justify-between border-r border-line/70 py-6 lg:flex">
      <div className="h-24 w-[3px] overflow-hidden rounded-full bg-line/70">
        <div
          className="w-full rounded-full bg-primary transition-[height] duration-150"
          style={{ height: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div className="flex flex-1 items-center">
        <span
          className="whitespace-nowrap text-[0.62rem] uppercase tracking-[0.42em] text-muted"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Sinza Universal Company — Kigali, Rwanda
        </span>
      </div>
      <div className="flex flex-col items-center gap-4 text-muted">
        {socials.slice(0, 5).map((s) => (
          <a
            key={s.platform}
            href={s.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={s.label}
            className="transition-colors hover:text-primary"
          >
            <SocialIcon platform={s.platform} size={15} />
          </a>
        ))}
      </div>
    </aside>
  );
}
