"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, SkipBack, SkipForward, X, Share2, ExternalLink, Volume2 } from "lucide-react";
import { formatDuration } from "@/lib/format";

export type PlayerTrack = {
  id: number;
  title: string;
  slug: string;
  artist?: string | null;
  coverUrl?: string | null;
  audioUrl?: string | null;
  youtubeId?: string | null;
  durationSec?: number | null;
  albumTitle?: string | null;
};

declare global {
  interface WindowEventMap {
    "sinza:play": CustomEvent<{ track: PlayerTrack; queue?: PlayerTrack[] }>;
    "sinza:stop": CustomEvent;
  }
}

export function playTrack(track: PlayerTrack, queue?: PlayerTrack[]) {
  window.dispatchEvent(new CustomEvent("sinza:play", { detail: { track, queue } }));
}

export function PlayerDock() {
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const track = queue[index];

  const onPlay = useCallback((e: WindowEventMap["sinza:play"]) => {
    const { track, queue: q } = e.detail;
    const nextQueue = q && q.length ? q : [track];
    const idx = Math.max(0, nextQueue.findIndex((t) => t.id === track.id));
    setQueue(nextQueue);
    setIndex(idx === -1 ? 0 : idx);
    setOpen(true);
    setPlaying(true);
    if (!track.audioUrl) setExpanded(true);
    const url = new URL(window.location.href);
    url.searchParams.set("play", track.slug);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const stop = useCallback(() => {
    setOpen(false);
    setPlaying(false);
    setExpanded(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("play");
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    window.addEventListener("sinza:play", onPlay as EventListener);
    window.addEventListener("sinza:stop", stop as EventListener);
    return () => {
      window.removeEventListener("sinza:play", onPlay as EventListener);
      window.removeEventListener("sinza:stop", stop as EventListener);
    };
  }, [onPlay, stop]);

  // Restore a shared deep link: /music?play=slug
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("play");
    if (!slug) return;
    fetch(`/api/tracks?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.track) window.dispatchEvent(new CustomEvent("sinza:play", { detail: { track: json.track } }));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    if (playing) void el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, volume, track?.id]);

  const seek = (value: number) => {
    const el = audioRef.current;
    if (el && duration) {
      el.currentTime = value;
      setProgress(value);
    }
  };

  const step = (delta: number) => {
    if (!queue.length) return;
    const next = (index + delta + queue.length) % queue.length;
    setIndex(next);
    setPlaying(true);
    if (!queue[next].audioUrl) setExpanded(true);
    const url = new URL(window.location.href);
    url.searchParams.set("play", queue[next].slug);
    window.history.replaceState({}, "", url.toString());
  };

  const share = async () => {
    if (!track) return;
    const url = `${window.location.origin}/music?play=${track.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  if (!open || !track) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70]">
      {expanded && (track.youtubeId || track.audioUrl) && (
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-3 lg:pl-24 lg:pr-10">
          <div className="relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-black shadow-2xl">
            {track.youtubeId ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${track.youtubeId}?autoplay=1&rel=0`}
                title={track.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-white/70">
                Audio preview — use the controls below
              </div>
            )}
            <button
              onClick={() => setExpanded(false)}
              aria-label="Minimise player"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-primary"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="glass border-t border-line">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 lg:pl-24 lg:pr-10">
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line"
              aria-label="Toggle video panel"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={track.coverUrl || "/images/album-inkuru.jpg"} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                <Play size={15} fill="currentColor" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="truncate font-display text-[1.05rem] leading-tight">{track.title}</p>
              <p className="truncate text-[0.78rem] text-muted">
                {track.artist || "Jado Sinza & Esther"}
                {track.albumTitle ? ` · ${track.albumTitle}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => step(-1)} aria-label="Previous" className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:text-primary">
              <SkipBack size={18} />
            </button>
            <button
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? "Pause" : "Play"}
              className="grid h-12 w-12 place-items-center rounded-full bg-primary text-white transition-transform hover:scale-105"
            >
              {playing ? <Pause size={19} /> : <Play size={19} fill="currentColor" />}
            </button>
            <button onClick={() => step(1)} aria-label="Next" className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:text-primary">
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex min-w-[190px] flex-1 items-center gap-3">
            <span className="tnum text-[0.72rem] text-muted">{formatDuration(Math.floor(progress))}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="range flex-1"
              aria-label="Seek"
            />
            <span className="tnum text-[0.72rem] text-muted">
              {formatDuration(Math.floor(duration || track.durationSec || 0))}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 text-muted sm:flex">
              <Volume2 size={17} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="range w-20"
                aria-label="Volume"
              />
            </div>
            <button onClick={share} title="Copy link to this track" className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary">
              <Share2 size={16} />
            </button>
            <Link href="/store" className="btn btn-primary h-10 px-4 text-[0.8rem]">
              <ExternalLink size={14} /> Buy
            </Link>
            <button onClick={stop} aria-label="Close player" className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary">
              <X size={16} />
            </button>
          </div>
        </div>

        {track.audioUrl && (
          <audio
            ref={audioRef}
            src={track.audioUrl}
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => step(1)}
          />
        )}
      </div>

      {copied && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-primary px-5 py-2 text-sm text-white shadow-lg">
          Link copied — share it anywhere
        </div>
      )}
    </div>
  );
}
