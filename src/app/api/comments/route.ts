import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { comments, posts } from "@/db/schema";

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));
  const postId = Number(body.postId);
  const authorName = String(body.authorName || "").trim();
  const email = String(body.email || "").trim();
  const text = String(body.body || "").trim();
  const parentId = body.parentId ? Number(body.parentId) : null;

  if (!postId || !authorName || text.length < 2) {
    return NextResponse.json({ error: "Name and comment are required." }, { status: 400 });
  }

  const post = (await db.select().from(posts).where(eq(posts.id, postId)).limit(1))[0];
  if (!post) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const inserted = await db
    .insert(comments)
    .values({
      postId,
      parentId: parentId ?? null,
      authorName,
      email: email || null,
      body: text,
      status: "approved",
    })
    .returning();

  return NextResponse.json({ comment: inserted[0] });
}
