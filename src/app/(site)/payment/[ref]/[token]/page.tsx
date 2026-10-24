"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, RefreshCw, XCircle } from "lucide-react";
import { formatRWF } from "@/lib/format";

type StatusData = {
  status: "paid" | "failed" | "pending";
  failureMessage?: string | null;
  order: { ref: string; type: string; total: string; currency: string; email: string; method: string | null; methodLabel: string };
  event?: { title: string; startsAt: string; venue: string; city: string } | null;
  tickets: { code: string; tier: string; status: string; qrUrl: string }[];
  pdfUrl?: string | null;
};

const POLL_MS = 2000;
const MAX_POLLS = 90; // 3 minutes, then offer a manual re-check

export default function PaymentStatusPage() {
  const { ref, token } = useParams<{ ref: string; token: string }>();
  const [data, setData] = useState<StatusData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [round, setRound] = useState(0);
  const polls = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    polls.current = 0;
    setTimedOut(false);

    const tick = async () => {
      try {
        const res = await fetch(
          `/api/payments/status?ref=${encodeURIComponent(ref)}&t=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const json = (await res.json()) as StatusData;
        if (cancelled) return;
        setData(json);
        if (json.status !== "pending") return; // paid or failed: stop polling
      } catch {
        // network blip: retry on the next tick
      }
      polls.current += 1;
      if (polls.current >= MAX_POLLS) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ref, token, round]);

  // Clear the store cart only once the payment really succeeded.
  useEffect(() => {
    if (data?.status === "paid" && data.order.type === "product") {
      localStorage.removeItem("sinza-cart");
    }
  }, [data?.status, data?.order.type]);

  // Warn before closing the tab while waiting.
  const waiting = data?.status === "pending" && !timedOut;
  useEffect(() => {
    if (!waiting) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [waiting]);

  const wrap = "mx-auto max-w-3xl px-5 pb-24 pt-40";

  if (notFound) {
    return (
      <section className={wrap}>
        <div className="card p-9">
          <XCircle className="text-primary" size={36} />
          <h1 className="mt-5 display-md font-display">We could not find this booking.</h1>
          <p className="mt-3 text-muted">Check the link from your email, or contact us with your booking reference.</p>
          <Link href="/" className="btn btn-ghost mt-6">Back home</Link>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className={wrap}>
        <div className="card flex items-center gap-4 p-9">
          <Loader2 className="animate-spin text-primary" size={28} />
          <p className="text-muted">Checking your payment…</p>
        </div>
      </section>
    );
  }

  const isMobileMoney = data.order.method === "mtn" || data.order.method === "airtel";
  const total = formatRWF(Number(data.order.total), data.order.currency);

  /* ---------------- PAID ---------------- */
  if (data.status === "paid") {
    return (
      <section className={wrap}>
        <div className="card p-9">
          <CheckCircle2 className="text-primary" size={36} />
          <h1 className="mt-5 display-md font-display">Payment confirmed.</h1>
          <p className="mt-3 text-muted">
            Booking <strong className="text-text">{data.order.ref}</strong> · {total} paid with {data.order.methodLabel}.
            {" "}A confirmation was sent to {data.order.email}.
          </p>

          {data.event && (
            <p className="mt-4 text-[0.95rem]">
              <strong>{data.event.title}</strong>
              <br />
              <span className="text-muted">
                {new Date(data.event.startsAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Kigali" })}
                {" · "}{data.event.venue}, {data.event.city}
              </span>
            </p>
          )}

          {data.pdfUrl && (
            <a href={data.pdfUrl} className="btn btn-primary mt-6 inline-flex items-center gap-2">
              <Download size={16} /> Download tickets (PDF)
            </a>
          )}

          {data.tickets.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {data.tickets.map((t) => (
                <div key={t.code} className="rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-5 text-center">
                  <p className="label">{t.tier}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.qrUrl} alt={`QR code ${t.code}`} className="mx-auto my-3 h-44 w-44 rounded-lg bg-white p-2" />
                  <p className="tnum font-display text-[1.15rem] tracking-wide text-primary">{t.code}</p>
                  <p className="mt-1 text-[0.78rem] text-muted">Show this QR code at the entrance. One scan only.</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={data.order.type === "product" ? "/store" : "/concerts"} className="btn btn-ghost">
              {data.order.type === "product" ? "Continue shopping" : "More concerts"}
            </Link>
            <Link href="/" className="btn btn-ghost">Back home</Link>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- FAILED ---------------- */
  if (data.status === "failed") {
    return (
      <section className={wrap}>
        <div className="card p-9">
          <XCircle className="text-primary" size={36} />
          <h1 className="mt-5 display-md font-display">Payment not completed.</h1>
          <p className="mt-3 text-[1.02rem]">
            {data.failureMessage || "The payment failed. You were not charged. Please try again."}
          </p>
          <p className="mt-3 text-[0.85rem] text-muted">Booking reference: {data.order.ref}. No ticket was issued.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={data.order.type === "product" ? "/checkout" : "/concerts"} className="btn btn-primary">
              Try again
            </Link>
            <Link href="/contact" className="btn btn-ghost">Contact support</Link>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- PENDING ---------------- */
  return (
    <section className={wrap}>
      <div className="card p-9">
        {timedOut ? (
          <RefreshCw className="text-primary" size={34} />
        ) : (
          <Loader2 className="animate-spin text-primary" size={34} />
        )}
        <h1 className="mt-5 display-md font-display">
          {timedOut ? "Still waiting for confirmation" : "Waiting for your payment…"}
        </h1>

        <p className="mt-3 text-muted">
          {timedOut
            ? "We have not received confirmation yet. No ticket has been issued and you have not been double charged. Do not pay again. Check again in a moment."
            : isMobileMoney
              ? `A payment request was sent to your phone. Open the ${data.order.methodLabel} prompt and enter your PIN to approve ${total}.`
              : "Confirming your card payment. This usually takes a few seconds."}
        </p>

        {!timedOut && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-[0.9rem]">
            <strong>Please do not close or refresh this page and do not pay again.</strong>{" "}
            Your tickets appear here automatically as soon as the payment is confirmed.
          </div>
        )}

        <p className="mt-5 text-[0.85rem] text-muted">Booking reference: {data.order.ref}</p>

        {timedOut && (
          <button className="btn btn-primary mt-6" onClick={() => setRound((r) => r + 1)}>
            Check status again
          </button>
        )}
      </div>
    </section>
  );
}