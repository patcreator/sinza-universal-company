import { NextRequest } from "next/server";
import { promises as fs, createReadStream } from "fs";
import path from "path";
import { Readable } from "stream";
import { MEDIA_DIR } from "@/lib/socialVideos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!/^[\w-]+\.(mp4|jpg)$/.test(name)) return new Response("Not found", { status: 404 });

  const file = path.join(MEDIA_DIR, name);
  let size: number;
  try {
    size = (await fs.stat(file)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const type = TYPES[path.extname(name)];
  const base = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
  };

  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: {
        ...base,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...base, "Content-Length": String(size) } });
}