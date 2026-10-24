import type { Metadata } from "next";
import { VideosView } from "./VideosView";
import { readSocialVideos, maybeAutoSync } from "@/lib/socialVideos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Music videos, live sessions and reels from Jado Sinza & Esther, synced from YouTube, Instagram, Facebook and X.",
  alternates: { canonical: "/videos" },
};

export default async function VideosPage() {
  maybeAutoSync(); // refreshes in the background when data is older than 12h
  const videos = await readSocialVideos();
  return <VideosView videos={videos} />;
}