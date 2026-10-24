import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { concerts, orders, tickets } from "@/db/schema";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/payments";
import { syncOrderPayment } from "@/lib/payment-flow";
import { verifyOrderToken } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const ref = req.nextUrl.searchParams.get("ref")?.trim() || "";
  const token = req.nextUrl.searchParams.get("t");

  if (!verifyOrderToken(ref, token)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const [found] = await db.select().from(orders).where(eq(orders.ref, ref)).limit(1);
  if (!found) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  let delayed = false;
  try {
    await syncOrderPayment(found); // asks pawaPay / Pesapal; updates DB
  } catch (error) {
    console.error("[payment-status] sync failed", ref, error);
    delayed = true;
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, found.id)).limit(1);
  const status = order.status === "paid" ? "paid" : order.status === "pending" ? "pending" : "failed";

  let ticketRows: (typeof tickets.$inferSelect)[] = [];
  let event: { title: string; startsAt: Date; venue: string; city: string } | null = null;
  if (status === "paid" && order.type === "ticket") {
    ticketRows = await db.select().from(tickets).where(eq(tickets.orderId, order.id)).orderBy(tickets.id);
    if (ticketRows[0]) {
      const [c] = await db.select().from(concerts).where(eq(concerts.id, ticketRows[0].concertId)).limit(1);
      if (c) event = { title: c.title, startsAt: c.startsAt, venue: c.venue, city: c.city };
    }
  }

  return NextResponse.json({
    status,
    delayed,
    failureMessage: status === "failed" ? order.failureReason : null,
    order: {
      ref: order.ref,
      type: order.type,
      total: order.total,
      currency: order.currency,
      email: order.email,
      method: order.paymentMethod,
      methodLabel: PAYMENT_LABELS[order.paymentMethod as PaymentMethod] ?? order.paymentMethod,
    },
    event,
    tickets: ticketRows.map((t) => ({
      code: t.code,
      tier: t.tierName,
      status: t.status,
      qrUrl: `/api/tickets/${t.code}/qr`,
    })),
    pdfUrl: status === "paid" && ticketRows.length
      ? `/api/tickets/pdf?ref=${encodeURIComponent(order.ref)}&t=${encodeURIComponent(token!)}`
      : null,
  });
}