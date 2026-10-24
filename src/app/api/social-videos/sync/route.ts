import { NextRequest, NextResponse } from "next/server";
import { syncSocialVideos } from "@/lib/socialVideos";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handle(req: NextRequest) {
  const secret =
    req.headers.get("x-sync-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await syncSocialVideos());
}

export const GET = handle;
export const POST = handle;