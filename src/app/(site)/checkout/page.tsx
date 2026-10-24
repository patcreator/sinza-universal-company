"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, ShieldCheck, Trash2 } from "lucide-react";
import { PaymentMark } from "@/components/site/Icons";
import { formatRWF, cn } from "@/lib/format";
import type { CartItem } from "../store/StoreView";

// Payment METHODS only. pawaPay and Pesapal are providers, chosen by the server.
const METHODS = ["mtn", "airtel", "visa", "mastercard"];

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [method, setMethod] = useState("mtn");
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const isMobileMoney = method === "mtn" || method === "airtel";

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("sinza-cart") || "[]"));
    } catch {
      setCart([]);
    }
  }, []);

  const subtotal = cart.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;

    if (!cart.length) {
      setError("Your cart is empty.");
      setState("error");
      return;
    }

    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Prices are NOT sent. The server reads them from the database.
          items: cart.map((i) => ({ productId: i.id, qty: i.qty })),
          ...form,
          paymentMethod: method,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not start the payment.");

      // The cart is cleared on the status page, once the payment is really confirmed.
      // Keep the button in "loading" while the browser navigates.
      if (json.payment?.redirectUrl) {
        window.location.href = json.payment.redirectUrl; // card -> Pesapal
      } else {
        window.location.href = `/payment/${encodeURIComponent(json.order.ref)}/${json.access}`; // mobile money
      }
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  };

  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-24 pt-40 sm:px-8 lg:pl-24 lg:pr-10">
      <Link href="/store" className="inline-flex items-center gap-2 text-muted transition-colors hover:text-primary">
        <ArrowLeft size={16} /> Back to the store
      </Link>
      <h1 className="display-lg mt-8 font-display">
        Secure <span className="italic-voice">checkout</span>
      </h1>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={submit} className="card p-7">
          <h2 className="font-display text-[1.65rem] leading-tight">Your details</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="co-name">Full name</label>
              <input
                id="co-name"
                required
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="co-email">Email</label>
              <input
                id="co-email"
                type="email"
                required
                className="field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="co-phone">
                {isMobileMoney ? "Mobile money phone" : "Phone"}
              </label>
              <input
                id="co-phone"
                required={isMobileMoney}
                className="field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0788 000 000"
              />
            </div>
            <div>
              <label className="label" htmlFor="co-address">Delivery address</label>
              <input
                id="co-address"
                className="field"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Kigali, KG 7 Ave…"
              />
            </div>
          </div>

          <h2 className="mt-9 font-display text-[1.65rem] leading-tight">Payment method</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                aria-pressed={method === m}
                className={cn(
                  "rounded-xl p-1.5 transition-all",
                  method === m ? "ring-2 ring-primary ring-offset-2 ring-offset-bg" : "opacity-60 hover:opacity-100",
                )}
              >
                <PaymentMark method={m} />
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-surface-2 p-4 text-[0.84rem] text-muted">
            <span className="flex items-start gap-2">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
              {isMobileMoney
                ? "You will get a payment request on your phone. Enter your PIN to approve it. Your order is confirmed only after the payment is verified."
                : "Payments are processed securely by Pesapal. Card details never touch our servers. You will be redirected to complete the payment."}
            </span>
          </div>

          {state === "error" && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "loading" || cart.length === 0}
            className="btn btn-primary mt-7 w-full"
          >
            {state === "loading" ? <Loader2 size={17} className="animate-spin" /> : null}
            {state === "loading"
              ? isMobileMoney
                ? "Sending payment request…"
                : "Redirecting…"
              : `Pay ${formatRWF(subtotal)}`}
          </button>
        </form>

        <aside className="card h-fit p-7">
          <h2 className="font-display text-[1.65rem] leading-tight">Order summary</h2>
          {cart.length === 0 ? (
            <p className="mt-5 text-muted">
              Your cart is empty. <Link href="/store" className="text-primary underline">Browse the store</Link>.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {cart.map((i) => (
                <li key={i.id} className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.imageUrl || "/images/merch-hoodie.jpg"} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="font-display text-[1.02rem] leading-tight">{i.title}</p>
                    <p className="tnum text-[0.84rem] text-muted">
                      {i.qty} × {formatRWF(i.price, i.currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = cart.filter((c) => c.id !== i.id);
                      setCart(next);
                      localStorage.setItem("sinza-cart", JSON.stringify(next));
                    }}
                    aria-label={`Remove ${i.title}`}
                    className="text-muted transition-colors hover:text-primary"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-7 space-y-2 border-t border-line pt-5">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="tnum">{formatRWF(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span className="tnum">Calculated after order</span>
            </div>
            <div className="flex justify-between pt-2 text-[1.15rem] font-medium">
              <span>Total</span>
              <span className="tnum">{formatRWF(subtotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}