import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { getPosts } from "@/lib/queries";
import { cn } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News & Press",
  description:
    "Releases, tour announcements, devotionals and press coverage from Jado Sinza & Esther and Sinza Universal Company.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = (await searchParams) ?? {};
  const category = params.category ?? "all";
  const posts = await getPosts(40).catch(() => []);
  const categories = Array.from(new Set(posts.map((p) => p.category)));
  const filtered = category === "all" ? posts : posts.filter((p) => p.category === category);
  const [lead, ...rest] = filtered;

  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-40">
        <div className="gradient-ink absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:pl-24 lg:pr-10">
          <Reveal>
            <Eyebrow>News And Updates</Eyebrow>
            <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
              Release announcements, behind-the-scenes notes, devotionals and coverage — with sources
              credited wherever the story came from.
            </p>
          </Reveal>

          <Reveal delay={110}>
            <nav className="mt-10 flex flex-wrap gap-2">
              <Link href="/news" className={cn("chip", category === "all" && "chip-active")}>
                All
              </Link>
              {categories.map((c) => (
                <Link key={c} href={`/news?category=${encodeURIComponent(c)}`} className={cn("chip", category === c && "chip-active")}>
                  {c}
                </Link>
              ))}
            </nav>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 lg:pl-24 lg:pr-10">
        {lead && (
          <Reveal>
            <Link href={`/news/${lead.slug}`} className="group grid gap-10 rounded-[calc(var(--radius)*1.3)] border border-line bg-surface p-6 lg:grid-cols-2 lg:items-center">
              <div className="overflow-hidden rounded-[calc(var(--radius))]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lead.coverUrl || "/images/news-crowd.jpg"}
                  alt=""
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              </div>
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tag">{lead.category}</span>
                  <span className="tnum text-[0.72rem] uppercase tracking-[0.18em] text-muted">
                    {new Date(lead.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </div>
                <h2 className="mt-5 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] leading-[1.05] transition-colors group-hover:text-primary">
                  {lead.title}
                </h2>
                <p className="mt-5 text-[1.02rem] leading-relaxed text-muted">{lead.excerpt}</p>
                {lead.sourceName && (
                  <p className="mt-5 flex items-center gap-2 text-[0.82rem] text-muted">
                    <Tag size={13} /> Source: <span className="text-primary">{lead.sourceName}</span>
                  </p>
                )}
                <span className="btn btn-primary mt-7">
                  Read the article <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          </Reveal>
        )}

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80}>
              <Link href={`/news/${p.slug}`} className="card card-hover group flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.coverUrl || "/images/news-crowd.jpg"}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <span className="absolute left-4 top-4 tag">{p.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="tnum text-[0.72rem] uppercase tracking-[0.18em] text-muted">
                    {new Date(p.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <h3 className="mt-3 font-display text-[1.28rem] leading-snug transition-colors group-hover:text-primary">
                    {p.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-muted">{p.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[0.82rem] text-primary">
                    Read article <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 && <p className="py-20 text-center text-muted">No articles in this category yet.</p>}
      </section>
    </>
  );
}
