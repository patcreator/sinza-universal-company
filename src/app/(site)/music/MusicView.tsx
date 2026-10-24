"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Play, Search, X, Share2, ExternalLink, Disc3, ListMusic, Music2 } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { Tilt } from "@/components/site/Motion";
import { ShareButtons } from "@/components/site/ShareButtons";
import { playTrack, type PlayerTrack } from "@/components/site/PlayerDock";
import { formatDuration, formatRWF, cn } from "@/lib/format";

export function MusicView({ tracks, albums, socials }: { tracks: any[]; albums: any[]; socials: any[] }) {
  const [query, setQuery] = useState("");
  const [albumFilter, setAlbumFilter] = useState<string>("all");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setOpenSlug(new URLSearchParams(window.location.search).get("track"));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const open = (slug: string | null) => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("track", slug);
    else url.searchParams.delete("track");
    window.history.pushState({}, "", url.toString());
    setOpenSlug(slug);
  };

  const albumTitle = (id?: number | null) => albums.find((a) => a.id === id)?.title ?? "Single";

  const filtered = useMemo(() => {
    return tracks.filter((t) => {
      const matchesQuery =
        !query ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        (t.artist || "").toLowerCase().includes(query.toLowerCase());
      const matchesAlbum = albumFilter === "all" || String(t.albumId) === albumFilter;
      return matchesQuery && matchesAlbum;
    });
  }, [tracks, query, albumFilter]);

  const queue = filtered.map((t) => ({ ...t, albumTitle: albumTitle(t.albumId) })) as PlayerTrack[];
  const active = tracks.find((t) => t.slug === openSlug);

  return (
    <>
      {/* header */}
      <section className="relative overflow-hidden pb-16 pt-40">
        <div className="gradient-ink absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:pl-24 lg:pr-10">
          <Reveal>
            <Eyebrow>Songs and Musics</Eyebrow>
            <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
              Enjoy musics
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search songs, artists…"
                  aria-label="Search music"
                  className="field pl-11"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAlbumFilter("all")}
                  className={cn("chip", albumFilter === "all" && "chip-active")}
                >
                  All
                </button>
                {albums.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAlbumFilter(String(a.id))}
                    className={cn("chip", albumFilter === String(a.id) && "chip-active")}
                  >
                    {a.title}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* track ledger */}
      <section className="mx-auto max-w-[1600px] px-5 pb-8 sm:px-8 lg:pl-24 lg:pr-10">
        <div className="ledger">
          {filtered.map((track, i) => (
            <div
              key={track.id}
              className="ledger-row group cursor-pointer"
              onClick={() => open(track.slug)}
            >
              <div className="ledger-cell flex items-center gap-3">
                <span className="tnum text-[0.85rem] text-muted">{String(i + 1).padStart(2, "0")}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playTrack({ ...track, albumTitle: albumTitle(track.albumId) }, queue);
                  }}
                  aria-label={`Play ${track.title}`}
                  className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white"
                >
                  <Play size={15} fill="currentColor" />
                </button>
              </div>
              <div className="ledger-cell flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={track.coverUrl || "/images/album-inkuru.jpg"}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-[1.12rem] leading-tight transition-colors group-hover:text-primary">
                    {track.title}
                  </p>
                  <p className="truncate text-[0.82rem] text-muted">{track.artist}</p>
                </div>
              </div>
              <div className="ledger-cell text-[0.86rem] text-muted">{albumTitle(track.albumId)}</div>
              <div className="ledger-cell tnum text-[0.86rem] text-muted">
                {formatDuration(track.durationSec || 0)}
              </div>
              <div className="ledger-cell flex items-center gap-2">
                {track.youtubeId && <span className="tag">Video</span>}
                {track.audioUrl && <span className="tag">Audio</span>}
                <span className="btn btn-ghost h-9 px-4 text-[0.76rem]">Details</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-16 text-center text-muted">No tracks match your search.</p>
          )}
        </div>
      </section>

      {/* albums */}
      <section className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:pl-24 lg:pr-10">
        <Reveal>
          <Eyebrow>Albums & EPs</Eyebrow>
          <h2 className="display-lg mt-5 font-display">
            Own the <span className="italic-voice">physical</span> record
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {albums.map((album, i) => {
            const count = tracks.filter((t) => t.albumId === album.id).length;
            return (
              <Reveal key={album.id} delay={i * 80}>
                <Tilt className="h-full">
                  <article className="card card-hover h-full overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={album.coverUrl || "/images/album-inkuru.jpg"}
                        alt={album.title}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 tag tnum">{album.year}</span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-[1.18rem] leading-tight">{album.title}</h3>
                      <p className="mt-2 line-clamp-2 text-[0.85rem] text-muted">{album.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="tnum text-[1.02rem] font-medium text-primary">
                          {formatRWF(album.price, album.currency)}
                        </span>
                        <span className="tnum text-[0.76rem] text-muted">{count} tracks</span>
                      </div>
                      <Link href="/store" className="btn btn-primary mt-4 w-full">
                        Buy album
                      </Link>
                    </div>
                  </article>
                </Tilt>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* off-canvas track detail */}
      <div
        className={cn(
          "fixed inset-0 z-[85] transition-[opacity,visibility] duration-300",
          active ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close" onClick={() => open(null)} />
        <aside
          className={cn(
            "absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto border-l border-line bg-bg transition-transform duration-400",
            active ? "translate-x-0" : "translate-x-full",
          )}
        >
          {active && (
            <div className="p-7">
              <div className="flex items-center justify-between">
                <Eyebrow>Track</Eyebrow>
                <button
                  onClick={() => open(null)}
                  aria-label="Close"
                  className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted hover:border-primary hover:text-primary"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.coverUrl || "/images/album-inkuru.jpg"}
                  alt={active.title}
                  className="aspect-square w-full object-cover"
                />
              </div>

              <h2 className="mt-6 font-display text-[2rem] leading-tight">{active.title}</h2>
              <p className="mt-2 text-muted">
                {active.artist} · {albumTitle(active.albumId)} · {active.year}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    playTrack({ ...active, albumTitle: albumTitle(active.albumId) }, queue.length ? queue : undefined)
                  }
                  className="btn btn-primary"
                >
                  <Play size={16} fill="currentColor" /> Play
                </button>
                <Link href="/store" className="btn btn-ghost">
                  Buy <span className="tnum">{formatRWF(active.price, active.currency)}</span>
                </Link>
              </div>

              {active.credits && (
                <div className="mt-8">
                  <h3 className="label">Credits</h3>
                  <p className="text-[0.95rem] leading-relaxed text-muted">{active.credits}</p>
                </div>
              )}

              {active.lyrics && (
                <div className="mt-8">
                  <h3 className="label">Lyrics</h3>
                  <p className="whitespace-pre-line font-display text-[1.12rem] leading-relaxed">
                    {active.lyrics}
                  </p>
                </div>
              )}

              <div className="mt-8">
                <h3 className="label">Listen elsewhere</h3>
                <div className="flex flex-wrap gap-2">
                  {active.youtubeId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${active.youtubeId}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-ghost h-10 px-4 text-[0.8rem]"
                    >
                      <ExternalLink size={14} /> YouTube
                    </a>
                  )}
                  {socials
                    .filter((s2) => ["apple", "shazam", "afrocharts", "instagram"].includes(s2.platform))
                    .map((s2) => (
                      <a
                        key={s2.platform}
                        href={s2.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="btn btn-ghost h-10 px-4 text-[0.8rem] capitalize"
                      >
                        <ExternalLink size={14} /> {s2.platform}
                      </a>
                    ))}
                </div>
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <h3 className="label">Share this song</h3>
                <ShareButtons url={`/music?track=${active.slug}`} title={`${active.title} — Jado Sinza & Esther`} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
