import { NextResponse } from 'next/server';

const HANDLE = 'jadosinza14';
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const API_KEY = process.env.YOUTUBE_API_KEY;

export const revalidate = 1800; // cache 30 min

/* Parse ISO 8601 duration (PT1M30S) → seconds */
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  return h * 3600 + min * 60 + s;
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'YOUTUBE_API_KEY missing in .env.local' },
      { status: 500 }
    );
  }

  try {
    /* -------- Step 1: Resolve channel → uploads playlist -------- */
    let channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${CHANNEL_ID}&key=${API_KEY}`;
    let channelRes = await fetch(channelUrl, { next: { revalidate: 1800 } });
    let channelData = await channelRes.json();

    if (!channelData.items?.length) {
      channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&forHandle=${HANDLE}&key=${API_KEY}`;
      channelRes = await fetch(channelUrl, { next: { revalidate: 1800 } });
      channelData = await channelRes.json();
    }

    if (!channelData.items?.length) {
      return NextResponse.json(
        { error: 'Channel not found by ID or handle' },
        { status: 404 }
      );
    }

    const uploadsPlaylistId =
      channelData.items[0].contentDetails.relatedPlaylists.uploads;

    /* -------- Step 2: Fetch latest 20 videos (playlistItems) -------- */
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=20&playlistId=${uploadsPlaylistId}&key=${API_KEY}`,
      { next: { revalidate: 1800 } }
    );
    const playlistData = await playlistRes.json();

    if (!playlistData.items?.length) {
      return NextResponse.json(
        { error: 'No videos in uploads playlist' },
        { status: 404 }
      );
    }

    /* -------- Step 3: Check embeddable + duration on each video -------- */
    const videoIds = playlistData.items
      .map((item: any) => item.snippet.resourceId.videoId)
      .join(',');

    const detailsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${videoIds}&key=${API_KEY}`,
      { next: { revalidate: 1800 } }
    );
    const detailsData = await detailsRes.json();

    // Build a map of videoId → { embeddable, duration }
    const detailsMap = new Map<string, { embeddable: boolean; seconds: number }>();
    for (const v of detailsData.items || []) {
      detailsMap.set(v.id, {
        embeddable: v.status?.embeddable === true,
        seconds: parseDuration(v.contentDetails?.duration || 'PT0S'),
      });
    }

    /* -------- Step 4: Filter + shape the final list -------- */
    const videos = playlistData.items
      .map((item: any) => {
        const vid = item.snippet.resourceId.videoId;
        const thumbs = item.snippet.thumbnails || {};
        const meta = detailsMap.get(vid);
        return {
          id: vid,
          title: item.snippet.title,
          artist: item.snippet.channelTitle || 'JADO SINZA & ESTHER',
          thumb:
            thumbs.maxres?.url ||
            thumbs.standard?.url ||
            thumbs.high?.url ||
            thumbs.medium?.url ||
            thumbs.default?.url ||
            `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          publishedAt: item.snippet.publishedAt,
          embeddable: meta?.embeddable ?? false,
          durationSeconds: meta?.seconds ?? 0,
        };
      })
      // Keep ONLY videos that are embeddable AND longer than 60s (no Shorts)
      .filter((v: any) => v.embeddable === true && v.durationSeconds > 60)
      // Take up to 12
      .slice(0, 12);

    return NextResponse.json({ videos, count: videos.length });
  } catch (err: any) {
    console.error('YouTube API error:', err);
    return NextResponse.json(
      { error: 'Fetch failed', message: err?.message },
      { status: 500 }
    );
  }
}