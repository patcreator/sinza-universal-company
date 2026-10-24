import { NextRequest, NextResponse } from "next/server";
import { syncAllVideos } from "@/lib/syncVideos";
import { saveVideos } from "@/lib/videoStore"; // your storage, see below

export const maxDuration = 300; // actors can take a minute or two

export async function POST(req: NextRequest) {
  if (req.headers.get("x-sync-secret") !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const videos = await syncAllVideos();
  if (videos.length) await saveVideos(videos); // don't overwrite with empty
  return NextResponse.json({ count: videos.length });
}