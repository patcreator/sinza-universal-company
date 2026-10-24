import { NextRequest, NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { syncOrderPayment } from "@/lib/payment-flow";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 10 * 60_000);
  const stale = await db
    .select()
    .from(orders)
    .where(and(eq(orders.status, "pending"), lt(orders.createdAt, cutoff)))
    .limit(200);

  for (const order of stale) {
    await syncOrderPayment(order).catch((e) => console.error("[cron] sync", order.ref, e));
  }
  return NextResponse.json({ checked: stale.length });
}