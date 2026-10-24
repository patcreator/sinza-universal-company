import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { orders } from "@/db/schema";
import { syncOrderPayment } from "@/lib/payment-flow";

export const dynamic = "force-dynamic";

/** The notification is only a "go check" signal. Truth always comes from the provider API. */
async function checkByPaymentRef(paymentRef: string) {
  if (!paymentRef) return;
  const [order] = await db.select().from(orders).where(eq(orders.paymentRef, paymentRef)).limit(1);
  if (order) await syncOrderPayment(order);
}

/** pawaPay deposit callback (set this URL in the pawaPay dashboard). */
export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));
  const depositId = String(body?.depositId ?? body?.data?.depositId ?? "");
  try {
    await checkByPaymentRef(depositId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[callback] pawapay", error);
    return NextResponse.json({ ok: false }, { status: 500 }); // provider retries
  }
}

/** Pesapal IPN (registered automatically, GET). */
export async function GET(req: NextRequest) {
  await ensureSeeded();
  const sp = req.nextUrl.searchParams;
  const trackingId = sp.get("OrderTrackingId") || "";
  const merchantRef = sp.get("OrderMerchantReference") || "";
  const type = sp.get("OrderNotificationType") || "IPNCHANGE";

  try {
    if (merchantRef) {
      const [order] = await db.select().from(orders).where(eq(orders.ref, merchantRef)).limit(1);
      if (order) await syncOrderPayment(order);
    } else {
      await checkByPaymentRef(trackingId);
    }
    return NextResponse.json({
      orderNotificationType: type,
      orderTrackingId: trackingId,
      orderMerchantReference: merchantRef,
      status: 200,
    });
  } catch (error) {
    console.error("[callback] pesapal", error);
    return NextResponse.json({ status: 500 }, { status: 500 });
  }
}