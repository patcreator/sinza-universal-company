import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import {
  Disc3,
  Ticket,
  ShoppingBag,
  Users,
  Newspaper,
  MessageCircle,
  Mail,
  TrendingUp,
  Image as ImageIcon,
} from "lucide-react";
import { db, ensureSeeded } from "@/db";
import { comments, concerts, contactMessages, media, orders, posts, products, subscribers, tracks, newsletters } from "@/db/schema";
import { formatRWF } from "@/lib/format";

export const dynamic = "force-dynamic";

async function safeCount(table: any) {
  try {
    const rows = (await db.select({ value: count() }).from(table)) as Array<{ value: number }>;
    return rows[0]?.value ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminDashboard() {
  await ensureSeeded();

  const [tracksCount, concertsCount, productsCount, subsCount, postsCount, commentsCount, messagesCount, mediaCount] =
    await Promise.all([
      safeCount(tracks),
      safeCount(concerts),
      safeCount(products),
      safeCount(subscribers),
      safeCount(posts),
      safeCount(comments),
      safeCount(contactMessages),
      safeCount(media),
    ]);

  let revenue = 0;
  let recentOrders: any[] = [];
  let recentComments: any[] = [];
  let upcoming: any[] = [];

  try {
    const paid = await db.select().from(orders).where(eq(orders.status, "paid"));
    revenue = paid.reduce((sum, o) => sum + Number(o.total), 0);
    recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6);
    recentComments = await db.select().from(comments).orderBy(desc(comments.createdAt)).limit(5);
    upcoming = await db.select().from(concerts).orderBy(desc(concerts.startsAt)).limit(4);
  } catch {
    /* first boot */
  }

  const stats = [
    { label: "Tracks live", value: tracksCount, icon: Disc3, href: "/admin/tracks" },
    { label: "Concerts", value: concertsCount, icon: Ticket, href: "/admin/concerts" },
    { label: "Products", value: productsCount, icon: ShoppingBag, href: "/admin/products" },
    { label: "Subscribers", value: subsCount, icon: Users, href: "/admin/subscribers" },
    { label: "Articles", value: postsCount, icon: Newspaper, href: "/admin/posts" },
    { label: "Comments", value: commentsCount, icon: MessageCircle, href: "/admin/comments" },
    { label: "Messages", value: messagesCount, icon: Mail, href: "/admin/contactMessages" },
    { label: "Media files", value: mediaCount, icon: ImageIcon, href: "/admin/media" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">Sinza Universal Company</p>
        <h1 className="mt-3 font-display text-[2.35rem] leading-none">Dashboard</h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-muted">
          Everything on the website is stored in PostgreSQL and editable here — music, concerts, tickets,
          store, news, media, subscribers and the theme.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card card-hover p-6">
            <s.icon size={19} className="text-primary" />
            <p className="tnum mt-4 font-display text-[2.35rem] leading-none">{s.value}</p>
            <p className="mt-2 text-[0.78rem] uppercase tracking-[0.16em] text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[1.55rem] leading-tight">Recent bookings & orders</h2>
            <Link href="/admin/orders" className="text-[0.82rem] text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-line">
                  {["Ref", "Customer", "Total", "Status"].map((h) => (
                    <th key={h} className="py-2.5 text-[0.66rem] uppercase tracking-[0.18em] text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0">
                    <td className="tnum py-3 text-[0.88rem] text-primary">{o.ref}</td>
                    <td className="py-3 text-[0.88rem]">{o.customerName}</td>
                    <td className="tnum py-3 text-[0.88rem]">{formatRWF(o.total, o.currency)}</td>
                    <td className="py-3">
                      <span
                        className={`tag ${
                          o.status === "paid"
                            ? "bg-primary/12 text-primary"
                            : o.status === "pending"
                              ? "bg-accent/15 text-accent"
                              : "opacity-60"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-muted">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-7 flex items-center gap-4 rounded-2xl border border-line bg-surface-2 p-5">
            <TrendingUp size={20} className="text-primary" />
            <div>
              <p className="text-[0.78rem] uppercase tracking-[0.16em] text-muted">Revenue (paid)</p>
              <p className="tnum font-display text-[1.75rem] leading-none">{formatRWF(revenue)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-7">
            <h2 className="font-display text-[1.45rem] leading-tight">Latest comments</h2>
            <ul className="mt-5 space-y-4">
              {recentComments.map((c) => (
                <li key={c.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                  <p className="text-[0.88rem] font-medium">{c.authorName}</p>
                  <p className="mt-1.5 line-clamp-2 text-[0.85rem] text-muted">{c.body}</p>
                  <p className="mt-2 text-[0.72rem] uppercase tracking-[0.14em] text-muted">{c.status}</p>
                </li>
              ))}
              {recentComments.length === 0 && <li className="text-muted">No comments yet.</li>}
            </ul>
          </div>

          <div className="card p-7">
            <h2 className="font-display text-[1.45rem] leading-tight">Concerts</h2>
            <ul className="mt-5 space-y-3">
              {upcoming.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.92rem] font-medium">{c.title}</p>
                    <p className="tnum text-[0.78rem] text-muted">
                      {new Date(c.startsAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="tag">{c.status}</span>
                </li>
              ))}
              {upcoming.length === 0 && <li className="text-muted">No concerts yet.</li>}
            </ul>
            <Link href="/admin/concerts/new" className="btn btn-primary mt-5 w-full">
              Create a concert
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
