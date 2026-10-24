import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { albums, tracks } from "@/db/schema";

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

  const rows = await db.select().from(tracks).where(eq(tracks.slug, slug)).limit(1);
  const track = rows[0];
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const album = track.albumId
    ? (await db.select().from(albums).where(eq(albums.id, track.albumId)).limit(1))[0]
    : null;

  return NextResponse.json({
    track: {
      id: track.id,
      title: track.title,
      slug: track.slug,
      artist: track.artist,
      coverUrl: track.coverUrl,
      audioUrl: track.audioUrl,
      youtubeId: track.youtubeId,
      durationSec: track.durationSec,
      albumTitle: album?.title ?? "Single",
    },
  });
}
