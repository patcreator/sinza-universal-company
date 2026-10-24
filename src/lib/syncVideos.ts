import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

export type Video = {
  id: string;
  title: string;
  thumbnailUrl: string;
  url: string;
  source: "YouTube" | "Instagram";
  publishedAt: string | null;
};

async function runActor(actorId: string, input: Record<string, unknown>) {
  const run = await client.actor(actorId).call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items as any[];
}

export async function fetchYouTube(): Promise<Video[]> {
  const items = await runActor("streamers/youtube-scraper", {
    startUrls: [{ url: process.env.YOUTUBE_CHANNEL_URL }],
    maxResults: 12,
    maxResultsShorts: 0,
    maxResultStreams: 0,
  });

  return items.map((v) => ({
    id: `yt_${v.id}`,
    title: v.title ?? "",
    thumbnailUrl: v.thumbnailUrl ?? "",
    url: v.url ?? `https://www.youtube.com/watch?v=${v.id}`,
    source: "YouTube" as const,
    publishedAt: v.date ?? null,
  }));
}

export async function fetchInstagram(): Promise<Video[]> {
  const items = await runActor("apify/instagram-scraper", {
    directUrls: [`https://www.instagram.com/${process.env.INSTAGRAM_USERNAME}/`],
    resultsType: "posts",
    resultsLimit: 12,
  });

  return items
    .filter((p) => p.type === "Video" || p.videoUrl)
    .map((p) => ({
      id: `ig_${p.id ?? p.shortCode}`,
      title: (p.caption ?? "Instagram video").split("\n")[0].slice(0, 90),
      thumbnailUrl: p.displayUrl ?? "",
      url: p.url ?? `https://www.instagram.com/p/${p.shortCode}/`,
      source: "Instagram" as const,
      publishedAt: p.timestamp ?? null,
    }));
}

export async function syncAllVideos(): Promise<Video[]> {
  const [yt, ig] = await Promise.allSettled([fetchYouTube(), fetchInstagram()]);
  const all = [
    ...(yt.status === "fulfilled" ? yt.value : []),
    ...(ig.status === "fulfilled" ? ig.value : []),
  ];
  return all.sort(
    (a, b) => +new Date(b.publishedAt ?? 0) - +new Date(a.publishedAt ?? 0)
  );
}