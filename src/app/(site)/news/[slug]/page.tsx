import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag, ExternalLink, Calendar } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { ShareButtons } from "@/components/site/ShareButtons";
import { Comments } from "./Comments";
import { getPostBySlug, getPosts } from "@/lib/queries";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPostBySlug(slug).catch(() => null);
  if (!data) return { title: "Article not found" };
  const { post } = data;
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      publishedTime: new Date(post.publishedAt).toISOString(),
      images: [{ url: post.coverUrl || "/images/news-crowd.jpg" }],
    },
    keywords: Array.isArray(post.tags) ? (post.tags as string[]) : undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPostBySlug(slug).catch(() => null);
  if (!data) notFound();
  const { post, comments } = data;

  try {
    await db.update(posts).set({ views: sql`${posts.views} + 1` }).where(eq(posts.id, post.id));
  } catch {
    /* view counting is best effort */
  }

  const related = (await getPosts(8).catch(() => []))
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden pb-14 pt-40">
        <div className="gradient-ink absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
          <Link href="/news" className="inline-flex items-center gap-2 text-white/75 transition-colors hover:text-white">
            <ArrowLeft size={16} /> All news
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="tag">{post.category}</span>
            <span className="flex items-center gap-2 text-[0.74rem] uppercase tracking-[0.18em] text-white/70">
              <Calendar size={13} />
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="text-[0.74rem] uppercase tracking-[0.18em] text-white/70">
              By {post.author}
            </span>
          </div>

          <h1 className="display-lg mt-7 font-display text-white">{post.title}</h1>
          {post.excerpt && <p className="mt-6 max-w-2xl text-[1.12rem] leading-relaxed text-white/85">{post.excerpt}</p>}

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <span className="text-[0.72rem] uppercase tracking-[0.2em] text-white/60">Share</span>
            <ShareButtons url={`/news/${post.slug}`} title={post.title} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 pb-8 sm:px-8">
        <Reveal>
          <div className="overflow-hidden rounded-[calc(var(--radius)*1.3)] border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverUrl || "/images/news-crowd.jpg"} alt="" className="aspect-[16/9] w-full object-cover" />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 pb-16 sm:px-8">
        <article className="prose-sinza" dangerouslySetInnerHTML={{ __html: post.content }} />

        {(post.sourceName || post.sourceUrl) && (
          <div className="mt-12 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-6">
            <Tag size={17} className="text-primary" />
            <p className="text-[0.95rem] text-muted">
              Source: <strong className="text-text">{post.sourceName}</strong>
              {post.sourceUrl && (
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ml-2 inline-flex items-center gap-1 text-primary underline underline-offset-2"
                >
                  read the original <ExternalLink size={13} />
                </a>
              )}
            </p>
          </div>
        )}

        {Array.isArray(post.tags) && (post.tags as string[]).length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {(post.tags as string[]).map((tag) => (
              <Link key={tag} href={`/news?category=${encodeURIComponent(post.category)}`} className="chip">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <Comments postId={post.id} comments={JSON.parse(JSON.stringify(comments))} />

        {related.length > 0 && (
          <div className="mt-20">
            <Eyebrow>Read next</Eyebrow>
            <div className="mt-7 grid gap-7 md:grid-cols-3">
              {related.map((p) => (
                <Link key={p.id} href={`/news/${p.slug}`} className="card card-hover group overflow-hidden">
                  <div className="aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.coverUrl || "/images/news-crowd.jpg"}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="tnum text-[0.72rem] uppercase tracking-[0.16em] text-muted">
                      {new Date(p.publishedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="mt-2.5 font-display text-[1.15rem] leading-snug transition-colors group-hover:text-primary">
                      {p.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
