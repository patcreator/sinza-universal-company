import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, MapPin, ArrowLeft, Play, Users, Ticket } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { ShareButtons } from "@/components/site/ShareButtons";
import { TicketBooking } from "./TicketBooking";
import { getConcertBySlug, getSite, getMedia } from "@/lib/queries";
import { dayParts, countdown, cn } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getConcertBySlug(slug).catch(() => null);
  if (!data) return { title: "Concert not found" };
  const { concert } = data;
  return {
    title: `${concert.title} — ${dayParts(concert.startsAt).day} ${dayParts(concert.startsAt).month}`,
    description: concert.tagline || concert.description?.slice(0, 155),
    alternates: { canonical: `/concerts/${concert.slug}` },
    openGraph: {
      title: concert.title,
      description: concert.tagline ?? undefined,
      images: [{ url: concert.coverUrl || "/images/hero-stage.jpg" }],
      type: "website",
    },
  };
}

export default async function ConcertPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getConcertBySlug(slug).catch(() => null);
  if (!data) notFound();
  const { concert, tiers } = data;
  const site = await getSite().catch(() => ({ payments: { enabled: ["mtn", "airtel", "visa", "mastercard", "pesapal", "pawapay"] } }));
  const media = await getMedia().catch(() => []);
  const d = dayParts(concert.startsAt);
  const c = countdown(concert.startsAt);
  const gallery: string[] = Array.isArray(concert.gallery) ? concert.gallery : [];
  const videoIds: string[] = Array.isArray(concert.videos) ? concert.videos : [];
  const videos = media.filter((m) => m.type === "video" && (videoIds.includes(m.externalId || "") || videoIds.some((id) => m.url.includes(id))));

  return (
    <>
      {/* hero */}
      <section className="relative min-h-[74vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={concert.coverUrl || "/images/hero-stage.jpg"} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,8,0.82)_0%,rgba(10,8,8,0.35)_42%,rgba(10,8,8,0.92)_100%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto flex min-h-[74vh] max-w-[1600px] flex-col justify-end px-5 pb-14 pt-36 sm:px-8 lg:pl-24 lg:pr-10">
          <Link href="/concerts" className="mb-8 inline-flex items-center gap-2 text-white/75 transition-colors hover:text-white">
            <ArrowLeft size={16} /> All concerts
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn("tag", concert.status === "past" ? "bg-white/15 text-white/85" : "bg-primary text-white")}>
              {concert.status === "past" ? "Past event" : "Tickets on sale"}
            </span>
            <span className="text-[0.72rem] uppercase tracking-[0.22em] text-white/70">
              {d.weekday} · {d.day} {d.month} {d.year} · {d.time} CAT
            </span>
          </div>
          <h1 className="display-lg mt-6 max-w-4xl font-display text-white">{concert.title}</h1>
          {concert.tagline && <p className="mt-5 max-w-2xl text-[1.08rem] text-white/85">{concert.tagline}</p>}

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-white/85">
            <span className="flex items-center gap-2">
              <MapPin size={16} /> {concert.venue}, {concert.city}, {concert.country}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={16} /> {d.day} {d.month} {d.year}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} /> Doors {concert.doorsAt ? dayParts(concert.doorsAt).time : "17:00"}
            </span>
            {!c.done && concert.status !== "past" && (
              <span className="tnum flex items-center gap-2 rounded-full border border-white/25 px-4 py-1.5 text-[0.82rem]">
                <Users size={15} /> {c.days} days {c.hours}h away
              </span>
            )}
          </div>
        </div>
      </section>

      {/* body */}
      <section className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:pl-24 lg:pr-10">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Reveal>
              <Eyebrow>About the night</Eyebrow>
              <div className="prose-sinza mt-6">
                <p>{concert.description}</p>
              </div>
            </Reveal>

            {gallery.length > 0 && (
              <Reveal>
                <h2 className="mt-14 font-display text-[1.85rem] leading-tight">
                  From the <span className="italic-voice">archive</span>
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {gallery.map((g, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g} alt="" className="aspect-square w-full object-cover transition-transform duration-700 hover:scale-105" />
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {(videos.length > 0 || videoIds.length > 0) && (
              <Reveal>
                <h2 className="mt-14 font-display text-[1.85rem] leading-tight">
                  Watch the <span className="italic-voice">performances</span>
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {videos.map((v) => (
                    <a
                      key={v.id}
                      href={`/concerts/${concert.slug}?v=${v.id}`}
                      className="group relative aspect-video overflow-hidden rounded-2xl border border-line text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumbnailUrl || "/images/news-crowd.jpg"} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                        <span className="font-display text-[1.05rem] text-white">{v.title}</span>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white">
                          <Play size={16} fill="currentColor" />
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </Reveal>
            )}

            <Reveal>
              <div className="mt-14 rounded-[calc(var(--radius)*1.2)] border border-line bg-surface p-7">
                <h3 className="font-display text-[1.55rem] leading-tight">Share this event</h3>
                <p className="mt-2 text-[0.92rem] text-muted">
                  Send the link — it opens exactly this page.
                </p>
                <div className="mt-5">
                  <ShareButtons url={`/concerts/${concert.slug}`} title={`${concert.title} — ${concert.venue}`} />
                </div>
              </div>
            </Reveal>
          </div>

          {/* booking column */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            {concert.status === "past" ? (
              <div className="card p-8">
                <Ticket size={28} className="text-primary" />
                <h3 className="mt-5 font-display text-[1.85rem] leading-tight">This concert has ended.</h3>
                <p className="mt-3 text-muted">
                  Thank you to everyone who came. Photos and the full live recording are archived above,
                  and the next dates are already on sale.
                </p>
                <Link href="/concerts" className="btn btn-primary mt-6">
                  See upcoming dates
                </Link>
              </div>
            ) : (
              <TicketBooking
                concert={JSON.parse(JSON.stringify(concert))}
                tiers={JSON.parse(JSON.stringify(tiers))}
                paymentMethods={site.payments?.enabled ?? ["mtn", "airtel", "visa", "mastercard"]}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
