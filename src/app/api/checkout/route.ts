import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db, ensureSeeded } from "@/db";
import { orders, products } from "@/db/schema";
import { makeRef } from "@/lib/format";
import { parsePayer } from "@/lib/payments";
import { reserveProductLines, SoldOutError, type ProductLine } from "@/lib/order-fulfillment";
import { startPayment } from "@/lib/payment-flow";
import { errorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));

  const payer = parsePayer(body);
  if (!payer.ok) return NextResponse.json({ error: payer.error }, { status: 400 });

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!rawItems.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const catalogue = (await db.select().from(products)).filter((p) => p.published);
  const wanted = new Map<number, number>();
  for (const item of rawItems) {
    const id = Number(item?.productId);
    const qty = Math.max(0, Math.min(20, Math.floor(Number(item?.qty) || 0)));
    if (id && qty) wanted.set(id, Math.min(20, (wanted.get(id) ?? 0) + qty));
  }

  const lines: ProductLine[] = [];
  for (const [id, qty] of wanted) {
    const p = catalogue.find((x) => x.id === id);
    if (!p) continue;
    lines.push({ label: p.title, qty, price: Number(p.price), productId: p.id });
  }
  if (!lines.length) {
    return NextResponse.json({ error: "No valid items in your cart." }, { status: 400 });
  }

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  if (total <= 0) return NextResponse.json({ error: "Invalid order total." }, { status: 400 });

  const ref = makeRef("ORD");
  const depositId = payer.method === "card" ? null : randomUUID();
  const now = new Date();

  let order;
  try {
    order = await db.transaction(async (tx) => {
      await reserveProductLines(tx, lines);
      const [row] = await tx
        .insert(orders)
        .values({
          ref,
          type: "product",
          status: "pending",
          customerName: payer.name,
          email: payer.email,
          phone: payer.msisdn ?? (String(body.phone || "").trim() || null),
          items: lines,
          subtotal: String(total),
          fees: "0",
          total: String(total),
          currency: "RWF",
          paymentMethod: payer.method,
          paymentRef: depositId,
          notes: String(body.address || "").trim() || null, // delivery address
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row;
    });
  } catch (error) {
    if (error instanceof SoldOutError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  const started = await startPayment({
    order,
    method: payer.method,
    msisdn: payer.msisdn,
    description: `Sinza Universal store order ${ref}`,
  });
  if (!started.ok) return NextResponse.json({ error: started.error }, { status: 422 });

  return NextResponse.json(started.body);
}

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (error) {
    return errorResponse(error, "checkout");
  }
}