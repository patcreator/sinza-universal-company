"use client";

import { useEffect, useState } from "react";
import { Play, Globe } from "lucide-react";
import { SocialIcon } from "@/components/site/Icons";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { SocialPlayer } from "@/components/site/SocialPlayer";
import { cn } from "@/lib/format";
import type { SocialVideo } from "@/lib/socialVideos";

const FALLBACK = "/images/news-crowd.jpg";

const TABS: { key: string; label: string; platform?: string }[] = [
  { key: "all", label: "Everything" },
  { key: "youtube", label: "YouTube", platform: "youtube" },
  { key: "instagram", label: "Instagram", platform: "instagram" },
  { key: "facebook", label: "Facebook", platform: "facebook" },
  { key: "x", label: "X", platform: "x" },
];

export function VideosView({ videos }: { videos: SocialVideo[] }) {
  const [tab, setTab] = useState("all");
  const [active, setActive] = useState<SocialVideo | null>(null);

  // deep links: ?tab=instagram&v=ig_XXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t && TABS.some((x) => x.key === t)) setTab(t);
    const v = params.get("v");
    if (v) {
      const found = videos.find((x) => x.id === v);
      if (found) setActive(found);
    }
  }, [videos]);

  const changeTab = (key: string) => {
    setTab(key);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    window.history.replaceState({}, "", url.toString());
  };

  const open = (v: SocialVideo) => {
    setActive(v);
    const url = new URL(window.location.href);
    url.searchParams.set("v", v.id);
    window.history.replaceState({}, "", url.toString());
  };

  const close = () => {
    setActive(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("v");
    window.history.replaceState({}, "", url.toString());
  };

  const countOf = (key: string) =>
    key === "all" ? videos.length : videos.filter((v) => v.source.toLowerCase() === key).length;

  const filtered = videos.filter((v) => tab === "all" || v.source.toLowerCase() === tab);

  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-40">
        <div className="gradient-ink absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:pl-24 lg:pr-10">
          <Reveal>
            <Eyebrow>Videos</Eyebrow>
            <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
              Official music videos, live sessions and reels, synced automatically from YouTube,
              Instagram, Facebook and X. Every clip plays right here.
            </p>
          </Reveal>

          <Reveal delay={110}>
            <div className="mt-10 flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => changeTab(t.key)}
                  className={cn("chip", tab === t.key && "chip-active")}
                >
                  {t.platform ? <SocialIcon platform={t.platform} size={14} /> : <Globe size={14} />}
                  {t.label}
                  <span className="ml-1 opacity-60">{countOf(t.key)}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 lg:pl-24 lg:pr-10">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v, i) => (
            <Reveal key={v.id} delay={(i % 6) * 70}>
              <button
                onClick={() => open(v)}
                className="group block w-full overflow-hidden rounded-2xl border border-line bg-surface text-left transition-transform duration-500 hover:-translate-y-1.5"
              >
                <div className="relative aspect-video overflow-hidden">
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
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/12 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-white/25 px-3 py-1 text-[0.58rem] uppercase tracking-[0.22em] text-white/85">
                    {v.source}
                  </span>
                  <span className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full bg-primary text-white transition-transform duration-500 group-hover:scale-110">
                    <Play size={17} fill="currentColor" />
                  </span>
                </div>
                <div className="p-5">
                  <p className="line-clamp-2 font-display text-[1.12rem] leading-tight">{v.title}</p>
                  {v.publishedAt && (
                    <p className="mt-2 text-[0.78rem] uppercase tracking-[0.16em] text-muted">
                      {new Date(v.publishedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-20 text-center text-muted">Nothing synced for this source yet.</p>
        )}
      </section>

      <SocialPlayer video={active} onClose={close} />
    </>
  );
}