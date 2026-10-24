import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { concerts, orders, tickets } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { buildTicketsPdf } from "@/lib/ticket-pdf";
import { verifyOrderToken } from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") || "";
  const token = req.nextUrl.searchParams.get("t");
  if (!verifyOrderToken(ref, token)) return new NextResponse("Not found", { status: 404 });

  const [order] = await db.select().from(orders).where(eq(orders.ref, ref)).limit(1);
  if (!order || order.status !== "paid") {
    return new NextResponse("Tickets are available once payment is confirmed.", { status: 409 });
  }

  const rows = await db.select().from(tickets).where(eq(tickets.orderId, order.id)).orderBy(tickets.id);
  if (!rows.length) return new NextResponse("No tickets for this order.", { status: 404 });

  const [concert] = await db.select().from(concerts).where(eq(concerts.id, rows[0].concertId)).limit(1);

  const pdf = await buildTicketsPdf(
    {
      title: concert?.title ?? "Concert",
      date: concert ? formatDateTime(concert.startsAt) : "",
      venue: concert ? `${concert.venue}, ${concert.city}` : "",
      orderRef: order.ref,
    },
    rows.map((t) => ({ code: t.code, tierName: t.tierName, holderName: t.holderName }))
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tickets-${order.ref}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}