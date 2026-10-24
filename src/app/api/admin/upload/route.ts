import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db, ensureSeeded } from "@/db";
import { media } from "@/db/schema";
import { getAdmin } from "@/lib/auth";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "audio/mpeg", "audio/mp4", "video/mp4", "application/pdf"];

/**
 * Upload to Cloudflare R2 when R2_* env vars are set (S3-compatible),
 * otherwise to the local /public/uploads folder so the flow always works.
 */
export async function POST(req: NextRequest) {
  await ensureSeeded();
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });

  const file = form.get("file") as File | null;
  const category = String(form.get("category") || "general");
  const title = String(form.get("title") || file?.name || "Untitled");

  if (!file) return NextResponse.json({ error: "No file received" }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "File is larger than 25MB" }, { status: 400 });

  const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "document";

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60)}`;

  // Cloudflare R2 (S3-compatible) via presigned-less direct PUT when configured.
  const r2Url = process.env.R2_ENDPOINT;
  const r2Bucket = process.env.R2_BUCKET;
  const r2Public = process.env.R2_PUBLIC_URL;

  if (r2Url && r2Bucket) {
    try {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = new S3Client({
        region: "auto",
        endpoint: r2Url,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
      });
      await client.send(
        new PutObjectCommand({ Bucket: r2Bucket, Key: safeName, Body: bytes, ContentType: file.type }),
      );
      const url = `${r2Public || r2Url}/${safeName}`;
      const inserted = await db
        .insert(media)
        .values({
          title,
          url,
          thumbnailUrl: type === "image" ? url : null,
          type,
          category,
          source: "upload",
          mimeType: file.type,
          sizeBytes: file.size,
          publishedAt: new Date(),
        })
        .returning();
      return NextResponse.json({ row: inserted[0], storage: "r2" });
    } catch (error) {
      console.error("[r2]", (error as Error).message);
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), bytes);
  const url = `/uploads/${safeName}`;

  const inserted = await db
    .insert(media)
    .values({
      title,
      url,
      thumbnailUrl: type === "image" ? url : null,
      type,
      category,
      source: "upload",
      mimeType: file.type,
      sizeBytes: file.size,
      publishedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ row: inserted[0], storage: "local" });
}
