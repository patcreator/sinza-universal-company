import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { media, syncLogs } from "@/db/schema";
import { getAdmin } from "@/lib/auth";

/**
 * Social sync through Apify actors (YouTube, Instagram, Facebook, X).
 * Set APIFY_TOKEN in .env.local — the run happens server-side only.
 */

type SyncResult = { items: any[]; message: string };

async function runApifyActor(actorId: string, input: Record<string, unknown>): Promise<any[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not configured");
  const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Apify actor ${actorId} returned ${res.status}`);
  return (await res.json()) as any[];
}

async function syncYouTube(): Promise<SyncResult> {
  const handle = process.env.YOUTUBE_HANDLE || "jadosinza14";
  const items = await runApifyActor("streamers~youtube-channel-scraper", {
    startUrls: [{ url: `https://www.youtube.com/@${handle}/videos` }],
    maxResults: 24,
  });

  let inserted = 0;
  for (const item of items) {
    const id = item.id || item.videoId;
    if (!id) continue;
    const exists = await db.select().from(media).where(eq(media.externalId, String(id))).limit(1);
    if (exists[0]) continue;
    await db.insert(media).values({
      title: item.title || "YouTube video",
      url: item.url || `https://www.youtube.com/watch?v=${id}`,
      thumbnailUrl: item.thumbnail?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      type: "video",
      category: "music videos",
      source: "youtube",
      externalId: String(id),
      externalUrl: item.url || `https://www.youtube.com/watch?v=${id}`,
      publishedAt: item.date ? new Date(item.date) : new Date(),
    });
    inserted += 1;
  }
  return { items, message: `YouTube: ${items.length} fetched, ${inserted} new.` };
}

async function syncInstagram(): Promise<SyncResult> {
  const handle = process.env.INSTAGRAM_HANDLE || "jadosinza";
  const items = await runApifyActor("apify~instagram-profile-scraper", {
    usernames: [handle],
    resultsLimit: 24,
  });

  let inserted = 0;
  for (const item of items) {
    const id = item.id || item.shortCode;
    if (!id) continue;
    const exists = await db.select().from(media).where(eq(media.externalId, String(id))).limit(1);
    if (exists[0]) continue;
    await db.insert(media).values({
      title: item.caption?.slice(0, 90) || "Instagram post",
      url: item.url || `https://www.instagram.com/${handle}/`,
      thumbnailUrl: item.imageUrl || item.displayUrl || "/images/news-crowd.jpg",
      type: item.videoUrl ? "video" : "image",
      category: "reels",
      source: "instagram",
      externalId: String(id),
      externalUrl: item.url || `https://www.instagram.com/${handle}/`,
      publishedAt: item.timestamp ? new Date(item.timestamp) : new Date(),
    });
    inserted += 1;
  }
  return { items, message: `Instagram: ${items.length} fetched, ${inserted} new.` };
}

async function syncFacebook(): Promise<SyncResult> {
  const page = process.env.FACEBOOK_PAGE || "SinzaJado";
  try {
    const items = await runApifyActor("apify~facebook-pages-scraper", { startUrls: [{ url: `https://web.facebook.com/${page}/` }], maxPosts: 12 });
    let inserted = 0;
    for (const item of items) {
      const id = item.id || item.url;
      if (!id) continue;
      const exists = await db.select().from(media).where(eq(media.externalId, String(id))).limit(1);
      if (exists[0]) continue;
      await db.insert(media).values({
        title: (item.message || item.text || "Facebook post").slice(0, 90),
        url: item.url || `https://web.facebook.com/${page}/`,
        thumbnailUrl: item.imageUrl || "/images/studio-choir.jpg",
        type: "video",
        category: "reels",
        source: "facebook",
        externalId: String(id),
        externalUrl: item.url,
        publishedAt: item.time ? new Date(item.time) : new Date(),
      });
      inserted += 1;
    }
    return { items, message: `Facebook: ${items.length} fetched, ${inserted} new.` };
  } catch (error) {
    return { items: [], message: `Facebook sync skipped: ${(error as Error).message}` };
  }
}

async function syncX(): Promise<SyncResult> {
  const user = process.env.X_HANDLE || "JadoSinza";
  try {
    const items = await runApifyActor("apify~twitter-scraper", { startUrls: [`https://x.com/${user}`], maxItems: 12 });
    let inserted = 0;
    for (const item of items) {
      const id = item.id || item.url;
      if (!id) continue;
      const exists = await db.select().from(media).where(eq(media.externalId, String(id))).limit(1);
      if (exists[0]) continue;
      await db.insert(media).values({
        title: (item.text || "Post on X").slice(0, 90),
        url: item.url || `https://x.com/${user}`,
        thumbnailUrl: item.extendedEntities?.media?.[0]?.media_url_https || "/images/duo-stage.jpg",
        type: "video",
        category: "clips",
        source: "x",
        externalId: String(id),
        externalUrl: item.url,
        publishedAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      });
      inserted += 1;
    }
    return { items, message: `X: ${items.length} fetched, ${inserted} new.` };
  } catch (error) {
    return { items: [], message: `X sync skipped: ${(error as Error).message}` };
  }
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const source = String(body.source || "all");
  const results: Array<{ source: string; message: string; count: number }> = [];

  const run = async (name: string, fn: () => Promise<SyncResult>) => {
    try {
      const result = await fn();
      await db.insert(syncLogs).values({ source: name, status: "ok", message: result.message, itemsCount: result.items.length });
      results.push({ source: name, message: result.message, count: result.items.length });
    } catch (error) {
      const message = (error as Error).message;
      await db.insert(syncLogs).values({ source: name, status: "failed", message, itemsCount: 0 });
      results.push({ source: name, message, count: 0 });
    }
  };

  if (source === "all" || source === "youtube") await run("youtube", syncYouTube);
  if (source === "all" || source === "instagram") await run("instagram", syncInstagram);
  if (source === "all" || source === "facebook") await run("facebook", syncFacebook);
  if (source === "all" || source === "x") await run("x", syncX);

  return NextResponse.json({ ok: true, results });
}

export async function GET() {
  await ensureSeeded();
  const logs = await db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(20);
  return NextResponse.json({ logs });
}
