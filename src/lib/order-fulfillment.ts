import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { concerts, orders, products, ticketTypes, tickets } from "@/db/schema";
import { formatDateTime, formatRWF } from "@/lib/format";
import { orderEmail, sendEmail } from "@/lib/mail";
import { newTicketCode, ticketsEmailHtml } from "@/lib/tickets";

export type OrderRow = typeof orders.$inferSelect;
export type TicketRow = typeof tickets.$inferSelect;
export type TicketLine = { label: string; qty: number; price: number; ticketTypeId: number };
export type ProductLine = { label: string; qty: number; price: number; productId: number };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class SoldOutError extends Error {}

/* ------------------------------------------------------------------ */
/* Atomic reservation (call inside the same transaction as the insert) */
/* ------------------------------------------------------------------ */

export async function reserveTicketLines(tx: Tx, lines: TicketLine[]) {
  for (const l of lines) {
    const updated = await tx
      .update(ticketTypes)
      .set({ quantitySold: sql`${ticketTypes.quantitySold} + ${l.qty}` })
      .where(
        and(
          eq(ticketTypes.id, l.ticketTypeId),
          sql`${ticketTypes.quantityTotal} - ${ticketTypes.quantitySold} >= ${l.qty}`
        )
      )
      .returning({ id: ticketTypes.id });
    if (!updated.length) throw new SoldOutError(`Not enough tickets left for ${l.label}.`);
  }
}

export async function reserveProductLines(tx: Tx, lines: ProductLine[]) {
  for (const l of lines) {
    const updated = await tx
      .update(products)
      .set({ stock: sql`${products.stock} - ${l.qty}` })
      .where(and(eq(products.id, l.productId), sql`${products.stock} >= ${l.qty}`))
      .returning({ id: products.id });
    if (!updated.length) throw new SoldOutError(`Not enough stock left for ${l.label}.`);
  }
}

/* ------------------------------------------------------------------ */
/* Paid: flip status once, create tickets, then email                  */
/* ------------------------------------------------------------------ */

export async function confirmOrderPaid(orderId: number) {
  const result = await db.transaction(async (tx) => {
    // Only the first caller (poll, callback or IPN) wins this transition.
    const [order] = await tx
      .update(orders)
      .set({ status: "paid", failureReason: null, updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning();
    if (!order) return null;

    let created: TicketRow[] = [];
    if (order.type === "ticket") {
      const lines = (Array.isArray(order.items) ? order.items : []) as TicketLine[];
      const tiers = lines.length
        ? await tx
            .select()
            .from(ticketTypes)
            .where(inArray(ticketTypes.id, lines.map((l) => Number(l.ticketTypeId))))
        : [];

      const rows: (typeof tickets.$inferInsert)[] = [];
      for (const line of lines) {
        const tier = tiers.find((t) => t.id === Number(line.ticketTypeId));
        if (!tier) throw new Error(`Ticket type ${line.ticketTypeId} no longer exists`);
        for (let i = 0; i < line.qty; i++) {
          rows.push({
            code: newTicketCode(),
            orderId: order.id,
            concertId: tier.concertId,
            ticketTypeId: tier.id,
            tierName: tier.name,
            holderName: order.customerName,
          });
        }
      }
      // Throwing here rolls everything back: never mark paid without tickets.
      if (!rows.length) throw new Error("Paid ticket order has no ticket lines");
      created = await tx.insert(tickets).values(rows).returning();
    }
    return { order, created };
  });

  if (!result) return { changed: false };
  await sendPaidEmail(result.order, result.created);
  return { changed: true };
}

async function sendPaidEmail(order: OrderRow, created: TicketRow[]) {
  try {
    if (order.type === "ticket" && created.length) {
      const [concert] = await db
        .select()
        .from(concerts)
        .where(eq(concerts.id, created[0].concertId))
        .limit(1);
      await sendEmail({
        to: order.email,
        subject: `Your tickets for ${concert?.title ?? "the concert"} - ${order.ref}`,
        html: ticketsEmailHtml({
          name: order.customerName,
          event: concert?.title ?? "the concert",
          date: concert ? formatDateTime(concert.startsAt) : "",
          venue: concert ? `${concert.venue}, ${concert.city}` : "",
          ref: order.ref,
          total: formatRWF(Number(order.total), order.currency),
          tickets: created.map((t) => ({ code: t.code, tier: t.tierName })),
        }),
        kind: "ticket",
      });
    } else {
      const lines = (Array.isArray(order.items) ? order.items : []) as ProductLine[];
      await sendEmail({
        to: order.email,
        subject: `Order ${order.ref} confirmed - Sinza Universal Company`,
        html: orderEmail({
          name: order.customerName,
          ref: order.ref,
          items: lines.map((l) => `${l.qty} × ${l.label}`).join(", "),
          total: formatRWF(Number(order.total), order.currency),
          address: order.notes || "",
        }),
        kind: "order",
      });
    }
  } catch (error) {
    // The order stays paid; the customer can still open/download tickets from the order page.
    console.error("[order-email] failed for", order.ref, error);
  }
}

/* ------------------------------------------------------------------ */
/* Failed: flip status once and release reserved stock                 */
/* ------------------------------------------------------------------ */

export async function failOrderAndReleaseInventory(orderId: number, reason?: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({ status: "failed", failureReason: reason ?? null, updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning();
    if (!order) return false;

    const lines = (Array.isArray(order.items) ? order.items : []) as Array<
      Partial<TicketLine & ProductLine>
    >;
    for (const l of lines) {
      const qty = Math.max(0, Number(l.qty) || 0);
      if (order.type === "ticket" && l.ticketTypeId) {
        await tx
          .update(ticketTypes)
          .set({ quantitySold: sql`GREATEST(0, ${ticketTypes.quantitySold} - ${qty})` })
          .where(eq(ticketTypes.id, Number(l.ticketTypeId)));
      } else if (order.type === "product" && l.productId) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${qty}` })
          .where(eq(products.id, Number(l.productId)));
      }
    }
    return true;
  });
}