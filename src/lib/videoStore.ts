// lib/videoStore.ts
import { promises as fs } from "fs";
import path from "path";
import type { Video } from "@/lib/syncVideos";

const FILE = path.join(process.cwd(), "data", "videos.json");

export async function getVideos(): Promise<Video[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as Video[];
  } catch {
    return []; // file doesn't exist yet
  }
}

export async function saveVideos(videos: Video[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(videos, null, 2), "utf-8");
}