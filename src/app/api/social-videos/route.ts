import { NextResponse } from "next/server";
import { readSocialVideos, maybeAutoSync } from "@/lib/socialVideos";

export const dynamic = "force-dynamic";

export async function GET() {
  maybeAutoSync(); // background refresh when data is old
  return NextResponse.json(await readSocialVideos());
}