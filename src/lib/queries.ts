import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { getAllSettings } from "@/lib/settings";

export async function getSite() {
  const [all, socials] = await Promise.all([getAllSettings(), db.select().from(s.socialLinks).orderBy(asc(s.socialLinks.sortOrder))]);
  return {
    site: { ...all.site },
    theme: { ...all.theme },
    seo: { ...all.seo },
    payments: { ...all.payments },
    schedule: { ...all.newsletterSchedule },
    socials: socials.filter((x) => x.enabled),
  };
}

export async function getTracks(limit = 50) {
  return db
    .select()
    .from(s.tracks)
    .where(eq(s.tracks.published, true))
    .orderBy(desc(s.tracks.year), asc(s.tracks.id))
    .limit(limit);
}

export async function getAlbums() {
  return db.select().from(s.albums).where(eq(s.albums.published, true)).orderBy(asc(s.albums.sortOrder));
}

export async function getConcerts(status?: "upcoming" | "past") {
  const rows = await db.select().from(s.concerts).where(eq(s.concerts.published, true)).orderBy(asc(s.concerts.startsAt));
  return status ? rows.filter((c) => c.status === status) : rows;
}

export async function getConcertBySlug(slug: string) {
  const rows = await db.select().from(s.concerts).where(eq(s.concerts.slug, slug)).limit(1);
  const concert = rows[0];
  if (!concert) return null;
  const tiers = await db.select().from(s.ticketTypes).where(eq(s.ticketTypes.concertId, concert.id)).orderBy(asc(s.ticketTypes.sortOrder));
  return { concert, tiers };
}

export async function getProducts() {
  return db.select().from(s.products).where(eq(s.products.published, true)).orderBy(asc(s.products.sortOrder));
}

export async function getPosts(limit = 30) {
  return db.select().from(s.posts).where(eq(s.posts.published, true)).orderBy(desc(s.posts.publishedAt)).limit(limit);
}

export async function getPostBySlug(slug: string) {
  const rows = await db.select().from(s.posts).where(eq(s.posts.slug, slug)).limit(1);
  const post = rows[0];
  if (!post) return null;
  const all = await db.select().from(s.comments).where(eq(s.comments.postId, post.id));
  const comments = all
    .filter((c) => c.status === "approved")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return { post, comments };
}

export async function getPage(slug: string) {
  const rows = await db.select().from(s.pages).where(eq(s.pages.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getMedia(source?: string) {
  const rows = await db.select().from(s.media).where(eq(s.media.published, true)).orderBy(desc(s.media.publishedAt));
  return source ? rows.filter((m) => m.source === source) : rows;
}

export async function getOrders() {
  return db.select().from(s.orders).orderBy(desc(s.orders.createdAt));
}
