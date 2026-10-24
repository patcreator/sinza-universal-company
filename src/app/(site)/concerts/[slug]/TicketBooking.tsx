"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Info, X, ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

type Concert = {
  id: string | number;
  title: string;
  slug: string;
  venue: string;
  city: string;
  country: string;
  startsAt: string;
  status: string;
};

type Tier = {
  id: string | number;
  name: string;
  price: number;
  currency?: string;
  description?: string | null;
  isVip?: boolean;
  capacity?: number | null;
};

type Props = {
  concert: Concert;
  tiers?: Tier[] | null;
  paymentMethods?: string[];
};

function RwandaFlag({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      className={cn("h-4 w-6 shrink-0 rounded-[2px] object-cover", className)}
      aria-hidden
    >
      <path fill="#20603d" d="M0 0h640v480H0z" />
      <path fill="#fad201" d="M0 0h640v360H0z" />
      <path fill="#00a1de" d="M0 0h640v240H0z" />
      <g transform="translate(511 125.4) scale(.66667)">
        <g id="rw-b">
          <path
            id="rw-a"
            fill="#e5be01"
            d="M116.1 0 35.7 4.7l76.4 25.4-78.8-16.3L100.6 58l-72-36.2L82 82.1 21.9 28.6l36.2 72-44.3-67.3L30 112 4.7 35.7 0 116.1-1-1z"
          />
          <use href="#rw-a" width="100%" height="100%" transform="scale(1 -1)" />
        </g>
        <use href="#rw-b" width="100%" height="100%" transform="scale(-1 1)" />
        <circle r="34.3" fill="#e5be01" stroke="#00a1de" strokeWidth="3.4" />
      </g>
    </svg>
  );
}

const METHODS = [
  { id: "mtn", label: "MTN Mobile Money" },
  { id: "airtel", label: "Airtel Money" },
  { id: "card", label: "VISA / Mastercard" },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

const MAX_PER_TIER = 10; // must match the server limit in /api/orders

function formatRwf(amount: number) {
  if (amount >= 1000) {
    const k = amount / 1000;
    return k % 1 === 0 ? `RWF ${k}K` : `RWF ${k.toFixed(1)}K`;
  }
  return `RWF ${amount.toLocaleString()}`;
}

export function TicketBooking({ concert, tiers: tiersProp }: Props) {
  const router = useRouter();
  const tiers = Array.isArray(tiersProp) ? tiersProp : [];

  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(tiers.map((t) => [String(t.id), 0]))
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<MethodId>("mtn");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCard = payMethod === "card";

  const selected = tiers.filter((t) => (qty[String(t.id)] ?? 0) > 0);
  const totalQty = selected.reduce((s, t) => s + (qty[String(t.id)] ?? 0), 0);
  const totalAmount = selected.reduce(
    (s, t) => s + (qty[String(t.id)] ?? 0) * Number(t.price),
    0
  );
  const canContinue = totalQty > 0;

  function setTierQty(id: string, next: number) {
    setQty((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(MAX_PER_TIER, next)),
    }));
  }

  function openModal() {
    if (!canContinue) return;
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setMethodOpen(false);
  }

  /**
   * Pay -> POST /api/orders (creates a PENDING order and starts the payment)
   *  - card         -> redirect to Pesapal
   *  - mtn / airtel -> go to /payment/[ref]/[token], which polls every 2s
   * The server prices everything. We only send ticket ids and quantities.
   */
  async function handlePay() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concertId: concert.id,
          items: selected.map((t) => ({
            ticketTypeId: t.id,
            qty: qty[String(t.id)],
          })),
          name: name.trim() || email.split("@")[0],
          email: email.trim(),
          phone: isCard ? "" : phone.trim(),
          paymentMethod: payMethod,
        }),
      });

      const raw = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch {
        // server returned non-JSON (usually a crash page)
      }

      if (!res.ok) {
        console.error("[payment] /api/orders failed", res.status, raw.slice(0, 500));
        setError(
          data?.error ||
            `The server returned an error (${res.status}). Please try again, or contact support if it keeps happening.`
        );
        setSubmitting(false);
        return;
      }

      // Leave `submitting` true while navigating so the button cannot be clicked twice.
      if (data.payment?.redirectUrl) {
        window.location.href = data.payment.redirectUrl;
      } else {
        router.push(
          `/payment/${encodeURIComponent(data.order.ref)}/${data.access}`
        );
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  const canPay =
    agreed &&
    email.trim().length > 3 &&
    (isCard || phone.replace(/\D/g, "").length >= 9) &&
    !submitting;

  return (
    <>
      <div className="overflow-hidden rounded-[calc(var(--radius)*1.35)] border border-line bg-surface shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)]">
        <div className="border-b border-line bg-surface-2/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
              <Ticket size={18} />
            </span>
            <div>
              <h3 className="font-display text-[1.35rem] leading-tight text-fg">
                Get tickets
              </h3>
              <p className="mt-0.5 text-[0.82rem] text-muted">
                Choose your ticket type to continue
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-5">
          {tiers.map((tier) => {
            const id = String(tier.id);
            const q = qty[id] ?? 0;
            const active = q > 0;
            const isVip =
              tier.isVip ||
              /vip/i.test(tier.name) ||
              /album|support/i.test(tier.name);

            return (
              <div
                key={id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                  active
                    ? "border-primary/60 bg-primary/10"
                    : "border-line bg-surface-2/40 hover:border-white/20"
                )}
              >
                {active && (
                  <span className="absolute inset-y-0 left-0 w-1 bg-primary" />
                )}

                <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[1.05rem] leading-tight text-fg">
                        {tier.name}
                      </span>
                      {isVip && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-amber-400">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[0.95rem] font-medium tabular-nums text-primary">
                      {formatRwf(Number(tier.price))}
                    </p>
                    {tier.description && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-[0.78rem] leading-snug text-muted">
                        <Info size={12} className="mt-0.5 shrink-0 opacity-70" />
                        {tier.description}
                      </p>
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex items-center rounded-full border p-0.5",
                      active
                        ? "border-primary/50 bg-primary/20"
                        : "border-line bg-surface"
                    )}
                  >
                    <button
                      type="button"
                      disabled={q === 0}
                      onClick={() => setTierQty(id, q - 1)}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-full text-lg font-medium",
                        q === 0
                          ? "cursor-not-allowed text-muted/40"
                          : "text-fg hover:bg-white/10"
                      )}
                    >
                      −
                    </button>
                    <span className="min-w-[1.75rem] text-center text-[0.95rem] font-semibold tabular-nums">
                      {q}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTierQty(id, q + 1)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-primary text-lg font-medium text-white hover:brightness-110"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-line px-5 pb-5 pt-4">
          <p className="mb-3 text-center text-[0.8rem] text-muted">
            Questions about tickets? Contact the organizer.
          </p>
          <button
            type="button"
            disabled={!canContinue}
            onClick={openModal}
            className={cn(
              "btn w-full justify-center rounded-xl py-3.5 text-[0.95rem] font-semibold",
              canContinue
                ? "btn-primary"
                : "cursor-not-allowed bg-white/8 text-muted"
            )}
          >
            {canContinue
              ? `Continue · ${formatRwf(totalAmount)}`
              : "Continue"}
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={closeModal}
            aria-label="Close"
          />

          <div className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-[420px] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#141210] shadow-2xl sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="font-display text-[1.15rem] text-white">
                Reserve ticket{totalQty > 1 ? "s" : ""}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[0.78rem] font-medium uppercase tracking-wider text-white/50">
                    Pay with
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMethodOpen((o) => !o)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/12 bg-white/5 px-3.5 py-3 text-left"
                    >
                      <PaymentIcon method={payMethod} />
                      <span className="flex-1 text-[0.95rem] text-white">
                        {METHODS.find((m) => m.id === payMethod)?.label}
                      </span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "text-white/50 transition-transform",
                          methodOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {methodOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-white/12 bg-[#1c1917] shadow-xl">
                        {METHODS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setPayMethod(m.id);
                              setMethodOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 px-3.5 py-3 text-left",
                              m.id === payMethod
                                ? "bg-primary/15 text-white"
                                : "text-white/85 hover:bg-white/5"
                            )}
                          >
                            <PaymentIcon method={m.id} />
                            <span className="flex-1 text-[0.92rem]">
                              {m.label}
                            </span>
                            {m.id === payMethod && (
                              <Check size={16} className="text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[0.78rem] font-medium uppercase tracking-wider text-white/50">
                    Send to
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-[0.8rem] text-white/60">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-3 text-[0.95rem] text-white outline-none placeholder:text-white/30 focus:border-primary/60"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.8rem] text-white/60">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com"
                        className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-3 text-[0.95rem] text-white outline-none placeholder:text-white/30 focus:border-primary/60"
                      />
                      <p className="mt-1.5 text-[0.75rem] text-white/40">
                        We will send your ticket to this address
                      </p>
                    </div>

                    {!isCard && (
                      <div>
                        <label className="mb-1.5 block text-[0.8rem] text-white/60">
                          Phone number
                        </label>
                        <div className="flex overflow-hidden rounded-xl border border-white/12 bg-white/5 focus-within:border-primary/60">
                          <span className="flex items-center gap-2 border-r border-white/10 px-3 text-[0.9rem] text-white/80">
                            <RwandaFlag />
                            +250
                          </span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) =>
                              setPhone(
                                e.target.value.replace(/\D/g, "").slice(0, 9)
                              )
                            }
                            placeholder="7XX XXX XXX"
                            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[0.95rem] text-white outline-none placeholder:text-white/30"
                          />
                        </div>
                        <p className="mt-1.5 text-[0.75rem] text-white/40">
                          You will get a PIN prompt on this number
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border",
                      agreed
                        ? "border-primary bg-primary text-white"
                        : "border-white/25"
                    )}
                  >
                    {agreed && <Check size={12} strokeWidth={3} />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span className="text-[0.85rem] leading-snug text-white/70">
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline">
                      terms
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                      privacy
                    </a>{" "}
                    policies.
                  </span>
                </label>

                {error && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[0.85rem] text-red-300">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 px-5 py-4">
              <button
                type="button"
                disabled={!canPay}
                onClick={handlePay}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[0.95rem] font-semibold transition-all",
                  canPay
                    ? "bg-primary text-white hover:brightness-110"
                    : "cursor-not-allowed bg-white/10 text-white/40"
                )}
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting
                  ? isCard
                    ? "Redirecting to secure payment…"
                    : "Sending payment request…"
                  : `Pay ${totalAmount.toLocaleString()} RWF`}
              </button>
              <p className="mt-2 text-center text-[0.72rem] text-white/40">
                A small service fee is added at checkout.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PaymentIcon({ method }: { method: string }) {
  if (method === "mtn") {
    return (
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FFCC00] text-[0.65rem] font-bold text-black">
        MTN
      </span>
    );
  }
  if (method === "airtel") {
    return (
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ED1C24] text-[0.55rem] font-bold uppercase text-white">
        airtel
      </span>
    );
  }
  return (
    <span className="grid h-8 w-8 place-items-center rounded-md bg-[#1A1F71] text-[0.6rem] font-bold text-white">
      VISA
    </span>
  );
}

export default TicketBooking;