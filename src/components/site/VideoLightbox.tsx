"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ExternalLink, Play } from "lucide-react";

export type VideoItem = {
  id: number;
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  source: string;
  externalId?: string | null;
  externalUrl?: string | null;
  category?: string | null;
  publishedAt?: Date | string | null;
};

function youtubeIdFrom(item: VideoItem): string | null {
  if (item.externalId && /^[A-Za-z0-9_-]{6,20}$/.test(item.externalId)) return item.externalId;
  const match = item.url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{6,20})/);
  return match ? match[1] : null;
}

export function openVideo(idOrSlug: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("v", idOrSlug);
  window.history.pushState({}, "", url.toString());
  window.dispatchEvent(new CustomEvent("sinza:video", { detail: idOrSlug }));
}

export function closeVideo() {
  const url = new URL(window.location.href);
  url.searchParams.delete("v");
  window.history.pushState({}, "", url.toString());
  window.dispatchEvent(new CustomEvent("sinza:video", { detail: null }));
}

/** URL-driven lightbox: /videos?v=<id> — links are shareable. */
export function VideoLightbox({ videos }: { videos: VideoItem[] }) {
  const [current, setCurrent] = useState<VideoItem | null>(null);

  const resolve = useCallback(
    (key: string | null) => {
      if (!key) return null;
      return (
        videos.find((v) => String(v.id) === key) ??
        videos.find((v) => v.externalId === key) ??
        videos.find((v) => v.url.includes(key)) ??
        null
      );
    },
    [videos],
  );

  useEffect(() => {
    const sync = () => {
      const key = new URLSearchParams(window.location.search).get("v");
      setCurrent(resolve(key));
    };
    sync();
    const onEvent = (e: Event) => setCurrent(resolve((e as CustomEvent<string | null>).detail));
    window.addEventListener("popstate", sync);
    window.addEventListener("sinza:video", onEvent as EventListener);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("sinza:video", onEvent as EventListener);
    };
  }, [resolve]);

  useEffect(() => {
    document.body.style.overflow = current ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeVideo();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [current]);

  if (!current) return null;
  const yt = youtubeIdFrom(current);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8">
      <button
        aria-label="Close video"
        onClick={closeVideo}
        className="absolute inset-0 bg-black/82 backdrop-blur-md"
        tabIndex={-1}
      />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/12 bg-black shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/12 px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-white">{current.title}</p>
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/55">
              {current.source} sync
              {current.publishedAt
                ? ` · ${new Date(current.publishedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(current.externalUrl || current.url) && (
              <a
                href={current.externalUrl || current.url}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-bone h-9 px-4 text-[0.78rem]"
              >
                <ExternalLink size={14} /> Open
              </a>
            )}
            <button
              onClick={closeVideo}
              aria-label="Close"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/12"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative aspect-video w-full bg-black">
          {yt ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`}
              title={current.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0">
              {current.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-45" />
              )}
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <div>
                  <p className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary text-white">
                    <Play size={22} fill="currentColor" />
                  </p>
                  <p className="text-white/85">
                    This clip is synced from <strong className="capitalize">{current.source}</strong> and opens on the
                    platform.
                  </p>
                  <a
                    href={current.externalUrl || current.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-primary mt-5"
                  >
                    Watch on {current.source === "youtube" ? "YouTube" : current.source}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
