import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
};

/* ------------------------------------------------------------------ */
/* Auth + settings                                                     */
/* ------------------------------------------------------------------ */

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  lastLoginAt: timestamp("last_login_at"),
  ...timestamps,
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 120 }).notNull().unique(),
  value: jsonb("value").notNull(),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Music                                                               */
/* ------------------------------------------------------------------ */

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 190 }).notNull(),
  slug: varchar("slug", { length: 190 }).notNull().unique(),
  year: integer("year"),
  coverUrl: text("cover_url"),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 8 }).notNull().default("RWF"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 190 }).notNull(),
  slug: varchar("slug", { length: 190 }).notNull().unique(),
  albumId: integer("album_id").references(() => albums.id, { onDelete: "set null" }),
  artist: varchar("artist", { length: 190 }).notNull().default("Jado Sinza & Esther"),
  year: integer("year"),
  durationSec: integer("duration_sec").default(0),
  coverUrl: text("cover_url"),
  audioUrl: text("audio_url"),
  youtubeId: varchar("youtube_id", { length: 40 }),
  instagramUrl: text("instagram_url"),
  lyrics: text("lyrics"),
  credits: text("credits"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  source: varchar("source", { length: 20 }).notNull().default("admin"),
  plays: integer("plays").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 190 }).notNull(),
  slug: varchar("slug", { length: 190 }).notNull().unique(),
  category: varchar("category", { length: 60 }).notNull().default("merch"),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 8 }).notNull().default("RWF"),
  imageUrl: text("image_url"),
  stock: integer("stock").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Concerts + tickets                                                  */
/* ------------------------------------------------------------------ */

export const concerts = pgTable("concerts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 190 }).notNull(),
  slug: varchar("slug", { length: 190 }).notNull().unique(),
  tagline: text("tagline"),
  description: text("description"),
  venue: varchar("venue", { length: 190 }).notNull(),
  city: varchar("city", { length: 120 }).notNull().default("Kigali"),
  country: varchar("country", { length: 120 }).notNull().default("Rwanda"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  doorsAt: timestamp("doors_at"),
  status: varchar("status", { length: 20 }).notNull().default("upcoming"),
  coverUrl: text("cover_url"),
  gallery: jsonb("gallery").notNull().default([]),
  videos: jsonb("videos").notNull().default([]),
  streamUrl: text("stream_url"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

export const ticketTypes = pgTable("ticket_types", {
  id: serial("id").primaryKey(),
  concertId: integer("concert_id")
    .notNull()
    .references(() => concerts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 8 }).notNull().default("RWF"),
  quantityTotal: integer("quantity_total").notNull().default(100),
  quantitySold: integer("quantity_sold").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  ref: varchar("ref", { length: 40 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull().default("ticket"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  customerName: varchar("customer_name", { length: 190 }).notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  phone: varchar("phone", { length: 60 }),
  items: jsonb("items").notNull().default([]),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  fees: numeric("fees", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 8 }).notNull().default("RWF"),
  paymentMethod: varchar("payment_method", { length: 40 }),
  paymentRef: varchar("payment_ref", { length: 120 }),
  notes: text("notes"),
  failureReason: text("failure_reason"),   // NEW
  userId: varchar("user_id", { length: 120 }),
  ...timestamps,
});
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  concertId: integer("concert_id")
    .notNull()
    .references(() => concerts.id, { onDelete: "cascade" }),
  ticketTypeId: integer("ticket_type_id").references(() => ticketTypes.id, {
    onDelete: "set null",
  }),
  tierName: varchar("tier_name", { length: 120 }).notNull(),
  holderName: varchar("holder_name", { length: 190 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("valid"), // valid | used | void
  checkedInAt: timestamp("checked_in_at"),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Content: news, pages, comments                                      */
/* ------------------------------------------------------------------ */

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 190 }).notNull(),
  slug: varchar("slug", { length: 190 }).notNull().unique(),
  category: varchar("category", { length: 60 }).notNull().default("news"),
  excerpt: text("excerpt"),
  content: text("content").notNull().default(""),
  coverUrl: text("cover_url"),
  sourceUrl: text("source_url"),
  sourceName: varchar("source_name", { length: 190 }),
  author: varchar("author", { length: 120 }).notNull().default("Sinza Universal"),
  tags: jsonb("tags").notNull().default([]),
  seoTitle: varchar("seo_title", { length: 190 }),
  seoDescription: text("seo_description"),
  views: integer("views").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  ...timestamps,
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  authorName: varchar("author_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 190 }),
  body: text("body").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("approved"),
  ...timestamps,
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 190 }).notNull(),
  content: text("content").notNull().default(""),
  seoTitle: varchar("seo_title", { length: 190 }),
  seoDescription: text("seo_description"),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 190 }).notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  subject: varchar("subject", { length: 190 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Media library + social sync                                         */
/* ------------------------------------------------------------------ */

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 190 }).notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  type: varchar("type", { length: 20 }).notNull().default("image"),
  category: varchar("category", { length: 60 }).notNull().default("general"),
  source: varchar("source", { length: 30 }).notNull().default("upload"),
  externalId: varchar("external_id", { length: 120 }),
  externalUrl: text("external_url"),
  sizeBytes: integer("size_bytes"),
  mimeType: varchar("mime_type", { length: 120 }),
  publishedAt: timestamp("published_at"),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

export const socialLinks = pgTable("social_links", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 40 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  url: text("url").notNull(),
  icon: varchar("icon", { length: 40 }),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  ...timestamps,
});

export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ok"),
  message: text("message"),
  itemsCount: integer("items_count").notNull().default(0),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Newsletter                                                          */
/* ------------------------------------------------------------------ */

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  name: varchar("name", { length: 120 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  source: varchar("source", { length: 40 }).notNull().default("site"),
  ...timestamps,
});

export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  subject: varchar("subject", { length: 190 }).notNull(),
  preheader: varchar("preheader", { length: 190 }),
  body: text("body").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  recipientsCount: integer("recipients_count").notNull().default(0),
  ...timestamps,
});

export const newsletterSends = pgTable("newsletter_sends", {
  id: serial("id").primaryKey(),
  newsletterId: integer("newsletter_id").references(() => newsletters.id, {
    onDelete: "cascade",
  }),
  subscriberId: integer("subscriber_id").references(() => subscribers.id, {
    onDelete: "cascade",
  }),
  email: varchar("email", { length: 190 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  ...timestamps,
});

export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  to: varchar("to", { length: 190 }).notNull(),
  subject: varchar("subject", { length: 190 }).notNull(),
  kind: varchar("kind", { length: 40 }).notNull().default("transactional"),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  providerId: varchar("provider_id", { length: 120 }),
  ...timestamps,
});
