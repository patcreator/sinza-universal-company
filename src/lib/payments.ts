export type PaymentMethod = "mtn" | "airtel" | "card";
export type Provider = "pawapay" | "pesapal";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  mtn: "MTN Mobile Money",
  airtel: "Airtel Money",
  card: "Visa / Mastercard",
};

export type StatusResult = {
  status: "paid" | "failed" | "pending";
  amount?: number;
  currency?: string;
  failureCode?: string;
  failureMessage?: string;
  notFound?: boolean; // provider has no record (yet)
  raw?: unknown;
};

/* ------------------------------------------------------------------ */
/* Input helpers                                                       */
/* ------------------------------------------------------------------ */

export function normalizeMethod(input: unknown): PaymentMethod | null {
  const m = String(input ?? "").toLowerCase();
  if (m === "mtn" || m === "airtel") return m;
  if (["card", "visa", "mastercard", "pesapal"].includes(m)) return "card";
  return null;
}

export function providerFor(method: string | null | undefined): Provider | null {
  if (method === "mtn" || method === "airtel") return "pawapay";
  if (method === "card") return "pesapal";
  return null;
}

/** "+250 788 000 000" | "0788000000" | "788000000" -> "250788000000" */
export function normalizeRwandaPhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("250")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^7\d{8}$/.test(d) ? "250" + d : null;
}

export type Payer =
  | { ok: true; method: PaymentMethod; name: string; email: string; msisdn: string | null }
  | { ok: false; error: string };

export function parsePayer(body: Record<string, unknown>): Payer {
  const method = normalizeMethod(body.paymentMethod);
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!method) return { ok: false, error: "Please choose a payment method." };
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  let msisdn: string | null = null;
  if (method !== "card") {
    msisdn = normalizeRwandaPhone(String(body.phone ?? ""));
    if (!msisdn) {
      return { ok: false, error: "Enter a valid Rwandan mobile number, e.g. 788 000 000." };
    }
    const prefix = msisdn.slice(3, 5);
    if (method === "mtn" && !["78", "79"].includes(prefix)) {
      return { ok: false, error: "This does not look like an MTN number (078/079). Check the number or choose Airtel." };
    }
    if (method === "airtel" && !["72", "73"].includes(prefix)) {
      return { ok: false, error: "This does not look like an Airtel number (072/073). Check the number or choose MTN." };
    }
  }
  return { ok: true, method, name, email, msisdn };
}

/* ------------------------------------------------------------------ */
/* pawaPay (MTN / Airtel)                                              */
/* ------------------------------------------------------------------ */

const PAWAPAY_BASE = (
  process.env.PAWAPAY_BASE_URL || "https://api.sandbox.pawapay.io"
).replace(/\/$/, "");

const PAWAPAY_PROVIDER = { mtn: "MTN_MOMO_RWA", airtel: "AIRTEL_RWA" } as const;

const PAWAPAY_FAILURES: Record<string, string> = {
  INSUFFICIENT_BALANCE: "Not enough money in your mobile money account. Top up and try again.",
  PAYMENT_NOT_APPROVED: "The payment was not approved on your phone (cancelled, wrong PIN, or it timed out). You were not charged.",
  PAYER_NOT_FOUND: "This number is not registered for mobile money on that network. Check the number and network.",
  INVALID_PHONE_NUMBER: "The phone number is not valid. Check it and try again.",
  PAYER_LIMIT_REACHED: "You have reached your mobile money transaction limit. Try later or use another method.",
  WALLET_LIMIT_REACHED: "Your mobile money wallet limit was reached. Try another method.",
  TRANSACTION_ALREADY_IN_PROCESSING: "Another payment for this number is already in progress. Finish it on your phone first.",
  PROVIDER_TEMPORARILY_UNAVAILABLE: "Your mobile money provider is temporarily unavailable. Try again in a few minutes.",
  AMOUNT_OUT_OF_BOUNDS: "This amount is outside the limits allowed for mobile money.",
};

function pawapayFailure(code?: string) {
  return (
    (code && PAWAPAY_FAILURES[code]) ||
    "The payment failed. You were not charged. Please try again."
  );
}

function pawapayHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export type InitiateInput = {
  method: PaymentMethod;
  orderRef: string;
  depositId: string | null; // pre-generated for pawaPay
  amount: number;
  currency: string;
  msisdn: string | null; // 2507XXXXXXXX
  email: string;
  name: string;
  description: string;
  returnUrl: string; // where Pesapal sends the browser back
};

export type InitiateResult =
  | { ok: true; provider: Provider; paymentRef: string; redirectUrl?: string; message: string }
  | { ok: false; provider: Provider; failureMessage: string };

async function initiatePawaPay(i: InitiateInput): Promise<InitiateResult> {
  const depositId = i.depositId!;
  try {
    const res = await fetch(`${PAWAPAY_BASE}/v2/deposits`, {
      method: "POST",
      headers: pawapayHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        depositId,
        amount: String(Math.round(i.amount)),
        currency: i.currency,
        payer: {
          type: "MMO",
          accountDetails: {
            phoneNumber: i.msisdn,
            provider: PAWAPAY_PROVIDER[i.method as "mtn" | "airtel"],
          },
        },
        clientReferenceId: i.orderRef,
        customerMessage: "Sinza Universal", // pawaPay allows 4-22 chars
      }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.status === "REJECTED") {
      console.error("[pawapay] deposit rejected", res.status, JSON.stringify(json));

      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          provider: "pawapay",
          failureMessage:
            "Mobile money is not available right now (provider authentication failed). Please try card or contact support.",
        };
      }

      return {
        ok: false,
        provider: "pawapay",
        failureMessage: pawapayFailure(json?.failureReason?.failureCode),
      };
    }
    return {
      ok: true,
      provider: "pawapay",
      paymentRef: depositId,
      message: "Check your phone and enter your PIN to approve the payment.",
    };
  } catch (error) {
    // Unknown outcome (timeout/network). The deposit may exist, so keep the
    // order pending and let status polling decide.
    console.error("[pawapay] initiate error", error);
    return {
      ok: true,
      provider: "pawapay",
      paymentRef: depositId,
      message: "Waiting for confirmation from your mobile money provider.",
    };
  }
}

export async function checkPawaPayDepositStatus(depositId: string): Promise<StatusResult> {
  const res = await fetch(`${PAWAPAY_BASE}/v2/deposits/${encodeURIComponent(depositId)}`, {
    headers: pawapayHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`pawaPay status HTTP ${res.status}`);
  const json = await res.json();

  if (json.status !== "FOUND" || !json.data) {
    return { status: "pending", notFound: true, raw: json };
  }
  const d = json.data;

  if (d.status === "COMPLETED") {
    return { status: "paid", amount: Number(d.amount), currency: d.currency, raw: json };
  }
  if (d.status === "FAILED") {
    const code = d.failureReason?.failureCode;
    return {
      status: "failed",
      failureCode: code,
      failureMessage: pawapayFailure(code),
      raw: json,
    };
  }
  // ACCEPTED, PROCESSING, IN_RECONCILIATION -> still pending
  return { status: "pending", raw: json };
}

/* ------------------------------------------------------------------ */
/* Pesapal (cards)                                                     */
/* ------------------------------------------------------------------ */

const PESAPAL_BASE = (
  process.env.PESAPAL_BASE_URL || "https://cybqa.pesapal.com/pesapalv3"
).replace(/\/$/, "");

let tokenCache: { token: string; exp: number } | null = null;
let ipnIdCache: string | null = process.env.PESAPAL_IPN_ID || null;

async function pesapalToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 30_000) return tokenCache.token;
  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.token) throw new Error("Pesapal auth failed: " + JSON.stringify(json));
  tokenCache = { token: json.token, exp: Date.now() + 4 * 60_000 };
  return json.token;
}

async function pesapalIpnId(token: string): Promise<string> {
  if (ipnIdCache) return ipnIdCache;
  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: `${(process.env.APP_URL || "").replace(/\/$/, "")}/api/payments/callback`,
      ipn_notification_type: "GET",
    }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ipn_id) throw new Error("Pesapal IPN registration failed: " + JSON.stringify(json));
  ipnIdCache = json.ipn_id as string;
  return ipnIdCache;
}

async function initiatePesapal(i: InitiateInput): Promise<InitiateResult> {
  try {
    const token = await pesapalToken();
    const notificationId = await pesapalIpnId(token);
    const [first, ...rest] = i.name.split(" ");

    const res = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        id: i.orderRef,
        currency: i.currency,
        amount: Math.round(i.amount),
        description: i.description.slice(0, 100),
        callback_url: i.returnUrl,
        notification_id: notificationId,
        billing_address: {
          email_address: i.email,
          first_name: first,
          last_name: rest.join(" "),
          country_code: "RW",
        },
      }),
    });
    const json = await res.json().catch(() => ({}));

    if (!json.redirect_url || !json.order_tracking_id) {
      console.error("[pesapal] submit failed", JSON.stringify(json));
      return {
        ok: false,
        provider: "pesapal",
        failureMessage: "Could not start the card payment. Please try again or use mobile money.",
      };
    }
    return {
      ok: true,
      provider: "pesapal",
      paymentRef: json.order_tracking_id,
      redirectUrl: json.redirect_url,
      message: "Redirecting to the secure card payment page.",
    };
  } catch (error) {
    console.error("[pesapal] initiate error", error);
    return {
      ok: false,
      provider: "pesapal",
      failureMessage: "Card payment is temporarily unavailable. Try mobile money or retry shortly.",
    };
  }
}

export async function checkPesapalStatus(orderTrackingId: string): Promise<StatusResult> {
  const token = await pesapalToken();
  const res = await fetch(
    `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }
  );
  if (!res.ok) throw new Error(`Pesapal status HTTP ${res.status}`);
  const d = await res.json();

  // status_code: 0 = invalid/unpaid, 1 = completed, 2 = failed, 3 = reversed
  if (d.status_code === 1) {
    return { status: "paid", amount: Number(d.amount), currency: d.currency, raw: d };
  }
  if (d.status_code === 2) {
    return {
      status: "failed",
      failureMessage: d.description
        ? `Card payment failed: ${d.description}. You were not charged.`
        : "Your card payment was declined or cancelled. You were not charged.",
      raw: d,
    };
  }
  if (d.status_code === 3) {
    return { status: "failed", failureMessage: "This payment was reversed.", raw: d };
  }
  return { status: "pending", raw: d };
}

/* ------------------------------------------------------------------ */

export async function initiatePayment(i: InitiateInput): Promise<InitiateResult> {
  return i.method === "card" ? initiatePesapal(i) : initiatePawaPay(i);
}