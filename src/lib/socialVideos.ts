import { ApifyClient } from "apify-client";
import { promises as fs } from "fs";
import path from "path";

export type Platform = "YouTube" | "Instagram" | "Facebook" | "X";

export type SocialVideo = {
  id: string;
  source: Platform;
  title: string;
  thumbnailUrl: string;
  url: string;       // original link
  embedUrl: string;  // iframe fallback (YouTube / Facebook / X)
  videoUrl: string;  // local mp4: /api/social-media/xxx.mp4
  publishedAt: string | null;
};

const ACTORS = {
  youtube: "streamers/youtube-scraper",
  instagram: "apify/instagram-reel-scraper",
  facebook: "apify/facebook-posts-scraper",
  x: "apidojo/tweet-scraper",
};

const LIMIT = 9; // per platform
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // auto-refresh when older than 12h
const RETRY_MS = 30 * 60 * 1000;

const DATA_FILE = path.join(process.cwd(), "data", "social-videos.json");
export const MEDIA_DIR = path.join(process.cwd(), "data", "media");

/* ---------- storage ---------- */
export async function readSocialVideos(): Promise<SocialVideo[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

async function writeSocialVideos(list: SocialVideo[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
}

/* ---------- helpers ---------- */
const client = () => new ApifyClient({ token: process.env.APIFY_TOKEN });

async function runActor(actorId: string, input: Record<string, unknown>) {
  const c = client();
  const run = await c.actor(actorId).call(input);
  const { items } = await c.dataset(run.defaultDatasetId).listItems();
  return items as any[];
}

const exists = (p: string) => fs.access(p).then(() => true, () => false);
const safeId = (s: unknown) => String(s).replace(/[^\w-]/g, "_").slice(0, 80);
const firstLine = (s: unknown, fallback: string) =>
  (String(s ?? "").replace(/https?:\/\/\S+/g, "").split("\n")[0].trim() || fallback).slice(0, 90);

// Social CDN links expire, so we keep a local copy. Returns "" on failure.
async function saveMedia(fileName: string, remoteUrl: string): Promise<string> {
  if (!remoteUrl) return "";
  const dest = path.join(MEDIA_DIR, fileName);
  const publicPath = `/api/social-media/${fileName}`;
  if (await exists(dest)) return publicPath;
  try {
    const res = await fetch(remoteUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fs.mkdir(MEDIA_DIR, { recursive: true });
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    return publicPath;
  } catch (e) {
    console.warn(`[social] download failed ${fileName}:`, e);
    return "";
  }
}

/* ---------- YouTube ---------- */
async function fetchYouTube(): Promise<SocialVideo[]> {
  const items = await runActor(ACTORS.youtube, {
    startUrls: [{ url: process.env.YOUTUBE_CHANNEL_URL }],
    maxResults: LIMIT,
    maxResultsShorts: 0,
    maxResultStreams: 0,
  });

  return items
    .filter((v) => v.id)
    .map((v) => ({
      id: `yt_${v.id}`,
      source: "YouTube" as const,
      title: v.title ?? "",
      thumbnailUrl: v.thumbnailUrl || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
      url: v.url ?? `https://www.youtube.com/watch?v=${v.id}`,
      embedUrl: `https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0`,
      videoUrl: "",
      publishedAt: v.date ?? null,
    }));
}

/* ---------- Instagram ---------- */
async function fetchInstagram(): Promise<SocialVideo[]> {
  const items = await runActor(ACTORS.instagram, {
    username: [process.env.INSTAGRAM_USERNAME],
    resultsLimit: LIMIT + 6,
  });

  const reels = items
    .filter((p) => p.shortCode && p.videoUrl)
    .sort((a, b) => +new Date(b.timestamp ?? 0) - +new Date(a.timestamp ?? 0))
    .slice(0, LIMIT);

  const out = await Promise.all(
    reels.map(async (p) => {
      const id = `ig_${safeId(p.shortCode)}`;
      const [thumb, video] = await Promise.all([
        saveMedia(`${id}.jpg`, p.displayUrl),
        saveMedia(`${id}.mp4`, p.videoUrl),
      ]);
      if (!video) return null;
      return {
        id,
        source: "Instagram" as const,
        title: firstLine(p.caption, "Instagram reel"),
        thumbnailUrl: thumb,
        url: p.url ?? `https://www.instagram.com/p/${p.shortCode}/`,
        embedUrl: "",
        videoUrl: video,
        publishedAt: p.timestamp ?? null,
      } as SocialVideo;
    }),
  );
  return out.filter((r): r is SocialVideo => r !== null);
}

/* ---------- Facebook ---------- */
async function fetchFacebook(): Promise<SocialVideo[]> {
  const pageUrl = (process.env.FACEBOOK_PAGE_URL || "https://www.facebook.com/jado.sinza").trim();

  const items = await runActor(ACTORS.facebook, {
    startUrls: [{ url: pageUrl }],
    resultsLimit: LIMIT * 3, // posts include photos, so ask for more
  });

  const found: { p: any; m: any; src: string }[] = [];
  for (const p of items) {
    const media: any[] = Array.isArray(p.media) ? p.media : [];
    const m = media.find((x) => x?.__typename === "Video");
    if (!m) continue;
    const d = m.videoDeliveryLegacyFields ?? {};
    const src = d.browser_native_hd_url || d.browser_native_sd_url || "";
    if (!src) continue;
    found.push({ p, m, src });
  }

  const out = await Promise.all(
    found.slice(0, LIMIT).map(async ({ p, m, src }) => {
      const id = `fb_${safeId(m.id ?? m.videoId)}`;
      const thumbRemote =
        m.thumbnail ?? m.thumbnailImage?.uri ?? m.preferred_thumbnail?.image?.uri ?? "";
      const [thumb, video] = await Promise.all([
        saveMedia(`${id}.jpg`, thumbRemote),
        saveMedia(`${id}.mp4`, src),
      ]);
      if (!video) return null;
      const url = m.url ?? p.url ?? pageUrl;
      return {
        id,
        source: "Facebook" as const,
        title: firstLine(String(p.text ?? "").replace(/\*/g, ""), "Facebook video"),
        thumbnailUrl: thumb,
        url,
        embedUrl: "",
        videoUrl: video,
        publishedAt: m.publish_time ? new Date(m.publish_time * 1000).toISOString() : null,
      } as SocialVideo;
    }),
  );

  return out.filter((r): r is SocialVideo => r !== null);
}

/* ---------- X (Twitter) ---------- */
function xVideo(p: any): { video: string; thumb: string } | null {
  const media: any[] = p.extendedEntities?.media ?? p.entities?.media ?? p.media ?? [];
  for (const m of media) {
    const variants: any[] = m?.video_info?.variants ?? m?.variants ?? [];
    const mp4 = variants
      .filter((v) => v?.url && (v.content_type ?? "video/mp4") === "video/mp4")
      .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];
    if (mp4) return { video: mp4.url, thumb: m.media_url_https ?? m.thumbnail ?? "" };
  }
  return null;
}

async function fetchX(): Promise<SocialVideo[]> {
  const handle = process.env.X_USERNAME!;
  const items = await runActor(ACTORS.x, {
    twitterHandles: [handle],
    maxItems: LIMIT * 4,
    sort: "Latest",
    onlyVideo: true,
  });

  const tweets = items
    .filter((p) => (p.id || p.id_str) && !p.isRetweet)
    .map((p) => ({ p, m: xVideo(p) }))
    .filter((x) => x.m)
    .slice(0, LIMIT);

  return Promise.all(
    tweets.map(async ({ p, m }) => {
      const tid = String(p.id ?? p.id_str);
      const id = `x_${safeId(tid)}`;
      const [t, v] = await Promise.all([
        saveMedia(`${id}.jpg`, m!.thumb),
        saveMedia(`${id}.mp4`, m!.video),
      ]);
      return {
        id,
        source: "X" as const,
        title: firstLine(p.text ?? p.fullText ?? p.full_text, "Video on X"),
        thumbnailUrl: t,
        url: p.url ?? p.twitterUrl ?? `https://x.com/${handle}/status/${tid}`,
        embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${tid}`,
        videoUrl: v,
        publishedAt: p.createdAt ?? p.created_at ?? null,
      } as SocialVideo;
    }),
  );
}

/* ---------- main ---------- */
const SOURCES: { name: Platform; run: () => Promise<SocialVideo[]> }[] = [
  { name: "YouTube", run: fetchYouTube },
  { name: "Instagram", run: fetchInstagram },
  { name: "Facebook", run: fetchFacebook },
  { name: "X", run: fetchX },
];

export async function syncSocialVideos() {
  const previous = await readSocialVideos();
  const results = await Promise.allSettled(SOURCES.map((s) => s.run()));

  const errors: string[] = [];
  const counts: Record<string, number> = {};
  const all: SocialVideo[] = [];

  results.forEach((r, i) => {
    const name = SOURCES[i].name;
    let list: SocialVideo[];
    if (r.status === "fulfilled" && r.value.length) {
      list = r.value;
    } else {
      if (r.status === "rejected") errors.push(`${name}: ${r.reason}`);
      // keep what we already had so one failing platform never empties its tab
      list = previous.filter((v) => v.source === name);
    }
    counts[name] = list.length;
    all.push(...list);
  });

  all.sort((a, b) => +new Date(b.publishedAt ?? 0) - +new Date(a.publishedAt ?? 0));
  if (all.length) await writeSocialVideos(all);
  return { count: all.length, ...counts, errors };
}

/* ---------- auto refresh (no manual runs) ---------- */
let syncing = false;
let lastAttempt = 0;

export async function maybeAutoSync() {
  let age = Infinity;
  try {
    age = Date.now() - (await fs.stat(DATA_FILE)).mtimeMs;
  } catch {}
  if (age > MAX_AGE_MS && !syncing && Date.now() - lastAttempt > RETRY_MS) {
    syncing = true;
    lastAttempt = Date.now();
    syncSocialVideos()
      .catch((e) => console.error("[social] auto-sync failed:", e))
      .finally(() => {
        syncing = false;
      });
  }
}