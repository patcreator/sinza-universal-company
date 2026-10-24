"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, ArrowRight, X } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { t } from "@/lib/i18n";
import type { SocialVideo } from "@/lib/socialVideos";

const FALLBACK = "/images/news-crowd.jpg";
const TABS = ["YouTube", "Instagram"] as const;
type Tab = (typeof TABS)[number];
const SLOTS = 3;

export function SocialVideos({ lang }: { lang: string }) {
  const [videos, setVideos] = useState<SocialVideo[] | null>(null);
  const [tab, setTab] = useState<Tab>("YouTube");
  const [active, setActive] = useState<SocialVideo | null>(null);
  const [igFailed, setIgFailed] = useState(false);

  useEffect(() => {
    fetch("/api/social-videos", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setVideos(Array.isArray(d) ? d : []))
      .catch(() => setVideos([]));
  }, []);

  // close on Esc + lock page scroll while the modal is open
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  const loading = videos === null;
  const list = (videos ?? [])
    .filter((v) => v.source === tab && (v.source === "YouTube" || v.videoUrl))
    .slice(0, SLOTS);
  const placeholders = Array.from({
    length: loading ? SLOTS : Math.max(0, SLOTS - list.length),
  });
  const count = (s: Tab) =>
    (videos ?? []).filter((v) => v.source === s && (s === "YouTube" || v.videoUrl)).length;

  const openVideo = (v: SocialVideo) => {
    setIgFailed(false);
    setActive(v);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-surface-2 py-24">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:pl-24 lg:pr-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <Eyebrow>{t(lang, "section.videos")}</Eyebrow>
              <h2 className="display-lg mt-5 font-display">
                <span className="italic-voice">YouTube & Instagram</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <Link href="/videos" className="btn btn-ghost">
                All videos <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>

          {/* tabs */}
          <div className="mt-10 inline-flex rounded-full border border-line p-1">
            {TABS.map((name) => (
              <button
                key={name}
                onClick={() => setTab(name)}
                className={
                  "rounded-full px-6 py-2 text-[0.72rem] uppercase tracking-[0.22em] transition-colors " +
                  (tab === name ? "bg-primary text-white" : "text-white/70 hover:text-white")
                }
              >
                {name}
                {!loading && <span className="ml-2 opacity-60">{count(name)}</span>}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {list.map((v, i) => (
              <Reveal key={v.id} delay={i * 90}>
                <button
                  onClick={() => openVideo(v)}
                  className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-line text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.thumbnailUrl || FALLBACK}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK;
                    }}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full border border-white/25 px-3 py-1 text-[0.6rem] uppercase tracking-[0.22em] text-white/85">
                    {v.source}
                  </span>
                  <span className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                    <span className="line-clamp-2 font-display text-[1.12rem] leading-tight text-white">
                      {v.title}
                    </span>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white transition-transform duration-500 group-hover:scale-110">
                      <Play size={16} fill="currentColor" />
                    </span>
                  </span>
                </button>
              </Reveal>
            ))}

            {/* placeholders */}
            {placeholders.map((_, i) => (
              <div
                key={`ph-${i}`}
                className={
                  "relative grid aspect-video w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-line bg-white/5 " +
                  (loading ? "animate-pulse" : "")
                }
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-white/40">
                  <Play size={20} fill="currentColor" />
                </span>
                {!loading && (
                  <span className="absolute bottom-4 left-5 text-[0.62rem] uppercase tracking-[0.22em] text-white/40">
                    {tab} · coming soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- lightbox (plays in place) ---------- */}
      {active && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4"
          onClick={() => setActive(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={18} />
            </button>

            {active.source === "YouTube" ? (
              <div className="aspect-video w-[min(92vw,1000px)] overflow-hidden rounded-2xl bg-black">
                <iframe
                  src={active.embedUrl}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={active.title}
                />
              </div>
            ) : igFailed || !active.videoUrl ? (
              <div className="grid h-[40vh] w-[min(92vw,420px)] place-items-center rounded-2xl bg-white/10 p-6 text-center text-white/80">
                This video couldn't be loaded. Please run the sync again.
              </div>
            ) : (
              <video
                key={active.id}
                src={active.videoUrl}
                poster={active.thumbnailUrl || undefined}
                controls
                autoPlay
                playsInline
                onError={() => setIgFailed(true)}
                className="max-h-[82vh] w-auto max-w-[92vw] rounded-2xl bg-black"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}