import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { ContactForm } from "@/components/site/ContactForm";
import { ShareButtons } from "@/components/site/ShareButtons";
import { getPage, getSite } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ALLOWED = ["about", "contact", "privacy", "terms", "team", "faq"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug).catch(() => null);
  if (!page) return { title: "Not found" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title: page.seoTitle || page.title, description: page.seoDescription || undefined },
  };
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!ALLOWED.includes(slug)) notFound();
  const page = await getPage(slug).catch(() => null);
  if (!page) notFound();
  const site = await getSite().catch(() => ({ site: {} as Record<string, any> }));

  return (
    <>
      <section className="relative overflow-hidden pb-14 pt-40">
        <div className="gradient-ink absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
          <Reveal>
            <Eyebrow>
              {slug === "about"
                ? "The ministry"
                : slug === "contact"
                  ? "Talk to us"
                  : slug === "privacy"
                    ? "Legal"
                    : slug === "terms"
                      ? "Legal"
                      : "Sinza Universal Company"}
            </Eyebrow>
            <h1 className="display-lg mt-7 font-display">{page.title}</h1>
            {page.seoDescription && (
              <p className="mt-6 max-w-2xl text-[1.08rem] leading-relaxed text-white/85">{page.seoDescription}</p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 pb-20 sm:px-8">
        {slug === "about" && (
          <Reveal>
            <div className="overflow-hidden rounded-[calc(var(--radius)*1.3)] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/duo-stage.jpg" alt="Jado Sinza & Esther on stage" className="w-full object-cover object-top" />
            </div>
          </Reveal>
        )}

        <article className="prose-sinza mt-10" dangerouslySetInnerHTML={{ __html: page.content }} />

        {slug === "contact" && (
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <ContactForm />
            <aside className="space-y-5">
              <div className="card p-7">
                <h3 className="font-display text-[1.45rem] leading-tight">Studio</h3>
                <p className="mt-3 text-muted">
                  {site.site?.address || "KG 7 Ave, Kigali, Rwanda"}
                  <br />
                  Monday – Friday, 09:00 – 18:00 CAT
                </p>
                <p className="mt-4 text-muted">
                  <a className="text-primary underline underline-offset-2" href={`tel:${site.site?.phone}`}>
                    {site.site?.phone}
                  </a>
                  <br />
                  <a className="text-primary underline underline-offset-2" href={`mailto:${site.site?.email}`}>
                    {site.site?.email}
                  </a>
                </p>
              </div>
              <div className="card p-7">
                <h3 className="font-display text-[1.45rem] leading-tight">Follow the ministry</h3>
                <div className="mt-4">
                  <ShareButtons url="/contact" title="Sinza Universal Company — Kigali, Rwanda" />
                </div>
              </div>
            </aside>
          </div>
        )}

        <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-line pt-8">
          <span className="text-[0.72rem] uppercase tracking-[0.2em] text-muted">Share this page</span>
          <ShareButtons url={`/${page.slug}`} title={page.title} compact />
        </div>
      </section>
    </>
  );
}
