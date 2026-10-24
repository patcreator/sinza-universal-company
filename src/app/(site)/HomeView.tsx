"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Play, ArrowRight, Ticket, Calendar, MapPin, Disc3, ShoppingBag, Newspaper, Volume2 } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { Tilt, Parallax } from "@/components/site/Motion";
import { ShareButtons } from "@/components/site/ShareButtons";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { playTrack, type PlayerTrack } from "@/components/site/PlayerDock";
import { openVideo, type VideoItem } from "@/components/site/VideoLightbox";
import { formatRWF, dayParts, formatDuration, cn } from "@/lib/format";
import Hero3D  from "@/components/site/Hero3D";
import { t } from "@/lib/i18n";
import { SocialVideos } from "@/components/site/SocialVideos";

export function HomeView(props: {
  theme: Record<string, any>;
  site: Record<string, any>;
  tracks: any[];
  albums: any[];
  concerts: any[];
  products: any[];
  posts: any[];
  videos: VideoItem[];
  lang: string;
}) {
  const { theme, tracks, albums, concerts, products, posts, videos, lang } = props;
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroOffset, setHeroOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onScroll = () => setHeroOffset(Math.min(window.scrollY * 0.22, 260));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const featured = tracks.find((t2) => t2.featured) ?? tracks[0];
  const marquee: string[] = theme.marquee ?? tracks.slice(0, 6).map((t2) => t2.title.toUpperCase());
  const heroVideo = videos[0];

  return (
    <>
     
      <Hero3D theme={theme} t={t} lang={lang} heroOffset={heroOffset} />

      {/* ---------------- LATEST RELEASE ---------------- */}
      {featured && (
        <section className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:pl-24 lg:pr-10">
          <Reveal>
            <Eyebrow>{t(lang, "section.latest")}</Eyebrow>
          </Reveal>

          <div className="mt-10 grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <Reveal>
              <Tilt className="relative">
                <div className="relative overflow-hidden rounded-[calc(var(--radius)*1.4)] border border-line shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.coverUrl || "/images/album-inkuru.jpg"}
                    alt={featured.title}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                    <div>
                      <p className="text-[0.66rem] uppercase tracking-[0.24em] text-white/75">
                        {featured.year} · {formatDuration(featured.durationSec || 0)}
                      </p>
                      <p className="mt-1 font-display text-2xl text-white">{featured.title}</p>
                    </div>
                    <button
                      onClick={() =>
                        playTrack(
                          featured as PlayerTrack,
                          tracks.map((x) => x as PlayerTrack),
                        )
                      }
                      aria-label={`Play ${featured.title}`}
                      className="grid h-16 w-16 place-items-center rounded-full bg-primary text-white transition-transform duration-500 hover:scale-110"
                    >
                      <Play size={22} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </Tilt>
            </Reveal>

            <Reveal delay={120}>
              <h2 className="display-lg font-display">
                {featured.title}{" "}
                <span className="italic-voice">— {featured.artist || "Jado Sinza & Esther"}</span>
              </h2>
              <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
                {featured.credits}
              </p>
              {featured.lyrics && (
                <blockquote className="mt-8 border-l-[3px] border-primary pl-6 font-display text-[1.35rem] italic leading-snug">
                  {featured.lyrics.split("\n")[0]}
                </blockquote>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => playTrack(featured as PlayerTrack, tracks.map((x) => x as PlayerTrack))}
                  className="btn btn-primary"
                >
                  <Volume2 size={16} /> Play now
                </button>
                <Link href="/music" className="btn btn-ghost">
                  All music <ArrowRight size={16} />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ShareButtons url={`/music?play=${featured.slug}`} title={featured.title} compact />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------------- PARALLAX QUOTE BAND ---------------- */}
      <section className="relative h-[62vh] min-h-[420px] overflow-hidden">
        <Parallax className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/studio-choir.jpg" alt="" className="h-full w-full object-cover" />
        </Parallax>
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(193,18,31,0.82)_0%,rgba(20,16,15,0.72)_58%,rgba(20,16,15,0.35)_100%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto flex h-full max-w-[1600px] items-center px-5 sm:px-8 lg:pl-24 lg:pr-10">
          <Reveal>
            <p className="max-w-3xl font-display text-[clamp(1.85rem,4.2vw,3.4rem)] italic leading-[1.08] text-white">
              “We do not sing to be seen. We sing so that every person in the room meets Jesus —
              <span className="not-italic" style={{ color: "#F7DEDD" }}>
                {" "}
                one song, one night, one testimony at a time.
              </span>
              ”
            </p>
            <p className="mt-7 text-[0.72rem] uppercase tracking-[0.28em] text-white/75">
              Jado Sinza & Esther Umulisa — Sinza Universal Company
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------- CONCERT LEDGER ---------------- */}
      <section className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:pl-24 lg:pr-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Eyebrow>{t(lang, "section.schedule")}</Eyebrow>
            <h2 className="display-lg mt-5 font-display">
              Upcoming <span className="italic-voice">nights of worship</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <Link href="/concerts" className="btn btn-ghost">
              Full schedule <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>

        <div className="ledger mt-12">
          {concerts.slice(0, 5).map((c, i) => {
            const d = dayParts(c.startsAt);
            return (
              <Reveal key={c.id} delay={i * 70}>
                <Link href={`/concerts/${c.slug}`} className="ledger-row group">
                  <div className="ledger-cell">
                    <p className="tnum font-display text-[1.95rem] leading-none">{d.day}</p>
                    <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-primary">{d.month}</p>
                  </div>
                  <div className="ledger-cell">
                    <p className="font-display text-[1.32rem] leading-tight transition-colors group-hover:text-primary">
                      {c.title}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-[0.85rem] text-muted">
                      <MapPin size={13} /> {c.venue}, {c.city}
                    </p>
                  </div>
                  <div className="ledger-cell text-[0.88rem] text-muted">
                    <span className="tag">{c.status === "past" ? "Past event" : d.weekday}</span>
                  </div>
                  <div className="ledger-cell tnum text-[0.92rem] text-muted">{d.time}</div>
                  <div className="ledger-cell">
                    <span className="btn btn-primary h-10 px-5 text-[0.8rem]">
                      {c.status === "past" ? "View" : "Tickets"}
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------- VIDEOS ---------------- */}
      <SocialVideos lang={lang} />
      {/* ---------------- STORE ---------------- */}
      <section className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:pl-24 lg:pr-10 hidden">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Eyebrow>{t(lang, "section.store")}</Eyebrow>
            <h2 className="display-lg mt-5 font-display">
              Shop <span className="italic-voice">message</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <Link href="/store" className="btn btn-primary">
              <ShoppingBag size={16} /> Shop everything
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <Tilt className="h-full">
                <Link href="/store" className="card card-hover block h-full overflow-hidden">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl || "/images/merch-hoodie.jpg"}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.05]"
                    />
                    <span className="absolute left-4 top-4 tag">{p.category}</span>
                  </div>
                  <div className="p-5">
                    <p className="font-display text-[1.12rem] leading-tight">{p.title}</p>
                    <p className="mt-2 line-clamp-2 text-[0.85rem] text-muted">{p.description}</p>
                    <p className="tnum mt-4 text-[1.02rem] font-medium text-primary">
                      {formatRWF(p.price, p.currency)}
                    </p>
                  </div>
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- NEWS ---------------- */}
      <section className="relative overflow-hidden bg-surface-2 py-24">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:pl-24 lg:pr-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <Eyebrow>{t(lang, "section.news")}</Eyebrow>
              <h2 className="display-lg mt-5 font-display">
                News, notes & <span className="italic-voice">press</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <Link href="/news" className="btn btn-ghost">
                <Newspaper size={16} /> All articles
              </Link>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {posts.slice(0, 3).map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <Link
                  href={`/news/${p.slug}`}
                  className="card card-hover group block h-full overflow-hidden"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.coverUrl || "/images/news-crowd.jpg"}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    />
                    <span className="absolute left-4 top-4 tag">{p.category}</span>
                  </div>
                  <div className="p-6">
                    <p className="tnum text-[0.72rem] uppercase tracking-[0.18em] text-muted">
                      {new Date(p.publishedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {p.sourceName ? ` · Source: ${p.sourceName}` : ""}
                    </p>
                    <h3 className="mt-3 font-display text-[1.32rem] leading-snug transition-colors group-hover:text-primary">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">{p.excerpt}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[0.82rem] text-primary">
                      Read article <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- NEWSLETTER ---------------- */}
      <section className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:pl-24 lg:pr-10">
        <div className="gradient-band relative overflow-hidden rounded-[calc(var(--radius)*1.6)] px-7 py-16 sm:px-14">
          <div className="grain absolute inset-0" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="text-[0.68rem] uppercase tracking-[0.24em] text-white/75">
                {t(lang, "section.newsletter")}
              </span>
              <h2 className="display-md mt-5 font-display text-white">
                New music, tour dates and devotionals — straight from Kigali.
              </h2>
              <p className="mt-5 max-w-xl text-white/85">
                We send a few times a week — every Monday, Wednesday and Friday by default. Choose your
                frequency when you subscribe, and leave whenever you want.
              </p>
            </div>
            <div className="rounded-2xl bg-white/12 p-6 backdrop-blur-md">
              <NewsletterForm variant="panel" />
              <p className="mt-4 text-[0.76rem] text-white/70">
                By subscribing you accept our{" "}
                <Link href="/privacy" className="underline underline-offset-2">
                  privacy policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
