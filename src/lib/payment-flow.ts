import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import {
  checkPawaPayDepositStatus,
  checkPesapalStatus,
  initiatePayment,
  PAYMENT_LABELS,
  providerFor,
  type PaymentMethod,
  type StatusResult,
} from "@/lib/payments";
import {
  confirmOrderPaid,
  failOrderAndReleaseInventory,
  type OrderRow,
} from "@/lib/order-fulfillment";
import { appUrl, orderToken } from "@/lib/tickets";

/** Called right after the pending order exists. */
export async function startPayment(args: {
  order: OrderRow;
  method: PaymentMethod;
  msisdn: string | null;
  description: string;
}) {
  const { order, method, msisdn, description } = args;
  const token = orderToken(order.ref);
  const provider = providerFor(method)!;

  const result = await initiatePayment({
    method,
    orderRef: order.ref,
    depositId: provider === "pawapay" ? order.paymentRef : null,
    amount: Number(order.total),
    currency: order.currency,
    msisdn,
    email: order.email,
    name: order.customerName,
    description,
    returnUrl: `${appUrl()}/payment/${encodeURIComponent(order.ref)}/${token}`,
  });

  if (!result.ok) {
    await failOrderAndReleaseInventory(order.id, result.failureMessage);
    return { ok: false as const, error: result.failureMessage };
  }

  if (result.paymentRef !== order.paymentRef) {
    await db
      .update(orders)
      .set({ paymentRef: result.paymentRef, updatedAt: new Date() })
      .where(eq(orders.id, order.id));
  }

  return {
    ok: true as const,
    body: {
      order: { ref: order.ref },
      access: token,
      payment: {
        provider: result.provider,
        method: PAYMENT_LABELS[method],
        status: result.redirectUrl ? "redirect" : "pending",
        redirectUrl: result.redirectUrl,
        message: result.message,
      },
    },
  };
}

/* ------------------------------------------------------------------ */

const NOT_FOUND_GRACE_MS = 2 * 60_000; // provider has no record 2 min after creation -> never started
const MISSING_REF_GRACE_MS = 5 * 60_000;
const EXPIRE_AFTER_MS = 30 * 60_000; // abandoned card checkouts etc.

function amountMatches(r: StatusResult, order: OrderRow) {
  if (r.amount === undefined || !Number.isFinite(r.amount)) return false;
  if (Math.abs(r.amount - Number(order.total)) >= 0.01) return false;
  // Only compare currency when the provider returned one.
  return !r.currency || r.currency.toUpperCase() === order.currency.toUpperCase();
}

/**
 * The single place that turns provider truth into DB state.
 * Used by the status route, the callback/IPN route and the cron job.
 */
export async function syncOrderPayment(order: OrderRow): Promise<"paid" | "failed" | "pending"> {
  if (order.status === "paid") return "paid";
  if (order.status !== "pending") return "failed";

  const age = Date.now() - order.createdAt.getTime();
  const provider = providerFor(order.paymentMethod);

  if (!provider || !order.paymentRef) {
    if (age > MISSING_REF_GRACE_MS) {
      await failOrderAndReleaseInventory(order.id, "The payment could not be started. Please try again.");
      return "failed";
    }
    return "pending";
  }

  let result: StatusResult;
  try {
    result =
      provider === "pawapay"
        ? await checkPawaPayDepositStatus(order.paymentRef)
        : await checkPesapalStatus(order.paymentRef);
  } catch (error) {
    console.error("[payment-sync] provider check failed", order.ref, error);
    return "pending"; // temporary problem: keep waiting, never fail on our own errors
  }

  if (result.status === "paid") {
    if (!amountMatches(result, order)) {
      console.error("[payment-sync] AMOUNT/CURRENCY MISMATCH - manual review", {
        ref: order.ref,
        expected: [order.total, order.currency],
        got: [result.amount, result.currency],
      });
      await db
        .update(orders)
        .set({ failureReason: "AMOUNT_MISMATCH: manual review required", updatedAt: new Date() })
        .where(eq(orders.id, order.id));
      return "pending";
    }
    await confirmOrderPaid(order.id);
    return "paid";
  }

  if (result.status === "failed") {
    await failOrderAndReleaseInventory(order.id, result.failureMessage);
    return "failed";
  }

  if (result.notFound && age > NOT_FOUND_GRACE_MS) {
    await failOrderAndReleaseInventory(order.id, "We could not start the payment. You were not charged. Please try again.");
    return "failed";
  }
  if (age > EXPIRE_AFTER_MS) {
    await failOrderAndReleaseInventory(order.id, "The payment was not completed in time. You were not charged.");
    return "failed";
  }
  return "pending";
}