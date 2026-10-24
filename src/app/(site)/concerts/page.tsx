import Link from "next/link";
import { Calendar, MapPin, Ticket, ArrowRight, Clock } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { getConcerts, getSite } from "@/lib/queries";
import { dayParts, countdown, formatRWF, cn } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Concerts & Tickets",
  description:
    "Upcoming Jado Sinza & Esther worship nights across Rwanda — book tickets with MTN MoMo, Airtel Money, Visa or Mastercard. No account needed.",
  alternates: { canonical: "/concerts" },
};

export default async function ConcertsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const params = (await searchParams) ?? {};
  const tab = params.tab === "past" ? "past" : "upcoming";
  const [all, site] = await Promise.all([
    getConcerts().catch(() => []),
    getSite().catch(() => ({ payments: { enabled: [] as string[] } })),
  ]);
  const list = all.filter((c) => c.status === tab);
  const featured = all.find((c) => c.featured && c.status === "upcoming") ?? list[0];

  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-40">
        <div className="gradient-ink absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:pl-24 lg:pr-10">
          <Reveal>
            <Eyebrow>Concerts</Eyebrow>
            <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
              Book in under a minute, your
              tickets arrive by email instantly.
            </p>
          </Reveal>

          <Reveal delay={110}>
            <nav className="mt-10 flex flex-wrap gap-2">
              <Link href="/concerts?tab=upcoming" className={cn("chip", tab === "upcoming" && "chip-active")}>
                Upcoming
              </Link>
              <Link href="/concerts?tab=past" className={cn("chip", tab === "past" && "chip-active")}>
                Past concerts
              </Link>
            </nav>
          </Reveal>
        </div>
      </section>

      {/* featured */}
      {featured && tab === "upcoming" && (
        <section className="mx-auto max-w-[1600px] px-5 pb-16 sm:px-8 lg:pl-24 lg:pr-10">
          <Reveal>
            <div className="relative overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.coverUrl || "/images/hero-stage.jpg"}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(15,11,11,0.92)_0%,rgba(15,11,11,0.55)_52%,rgba(193,18,31,0.32)_100%)]" />
              <div className="absolute inset-0 flex flex-col justify-end p-7 sm:p-12">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tag bg-primary text-white">Featured</span>
                  <span className="text-[0.72rem] uppercase tracking-[0.22em] text-white/75">
                    {dayParts(featured.startsAt).weekday} · {dayParts(featured.startsAt).time} CAT
                  </span>
                </div>
                <h2 className="display-md mt-5 max-w-3xl font-display text-white">{featured.title}</h2>
                <p className="mt-4 max-w-2xl text-white/85">{featured.tagline}</p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <Link href={`/concerts/${featured.slug}`} className="btn btn-primary">
                    <Ticket size={16} /> Book your seat
                  </Link>
                  <div className="flex items-center gap-5 text-white/80">
                    <span className="flex items-center gap-2 text-[0.85rem]">
                      <MapPin size={15} /> {featured.venue}, {featured.city}
                    </span>
                    {(() => {
                      const c = countdown(featured.startsAt);
                      return (
                        <span className="tnum flex items-center gap-2 text-[0.85rem]">
                          <Clock size={15} /> {c.days}d {c.hours}h {c.minutes}m to go
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ledger */}
      <section className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 lg:pl-24 lg:pr-10">
        <div className="ledger">
          {list.map((c, i) => {
            const d = dayParts(c.startsAt);
            return (
              <Reveal key={c.id} delay={i * 60}>
                <Link href={`/concerts/${c.slug}`} className="ledger-row group">
                  <div className="ledger-cell">
                    <p className="tnum font-display text-[2rem] leading-none">{d.day}</p>
                    <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-primary">
                      {d.month} {d.year}
                    </p>
                  </div>
                  <div className="ledger-cell">
                    <p className="font-display text-[1.35rem] leading-tight transition-colors group-hover:text-primary">
                      {c.title}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.85rem] text-muted">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} /> {c.venue}, {c.city}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} /> {d.weekday}
                      </span>
                    </p>
                  </div>
                  <div className="ledger-cell">
                    <span className={cn("tag", c.status === "past" && "opacity-70")}>
                      {c.status === "past" ? "Archived" : "On sale"}
                    </span>
                  </div>
                  <div className="ledger-cell tnum text-[0.92rem] text-muted">{d.time}</div>
                  <div className="ledger-cell">
                    <span className="btn btn-primary h-10 px-5 text-[0.8rem]">
                      {c.status === "past" ? "View archive" : "Get tickets"} <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {list.length === 0 && (
          <p className="py-20 text-center text-muted">Nothing here yet — check back soon.</p>
        )}

        <div className="mt-14 rounded-[calc(var(--radius)*1.2)] border border-line bg-surface p-8">
          <h3 className="font-display text-[1.65rem] leading-tight">
            Booking for a group of 10 or more?
          </h3>
          <p className="mt-3 max-w-2xl text-muted">
            We hold blocks of seats for churches, schools and ministries. Write to us and we will sort
            the pricing, seating and transport.
          </p>
          <Link href="/contact" className="btn btn-primary mt-6">
            Talk to the events team
          </Link>
        </div>
      </section>
    </>
  );
}
