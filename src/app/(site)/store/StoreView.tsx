"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Plus, Minus, X, Check, ArrowRight } from "lucide-react";
import { Reveal, Eyebrow } from "@/components/site/Reveal";
import { Tilt } from "@/components/site/Motion";
import { formatRWF, cn } from "@/lib/format";

export type CartItem = { id: number; title: string; price: string; currency: string; imageUrl?: string | null; qty: number };

const readCart = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem("sinza-cart") || "[]");
  } catch {
    return [];
  }
};

export function StoreView({ products, categories }: { products: any[]; categories: string[] }) {
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<number | null>(null);

  useEffect(() => {
    setCart(readCart());
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && categories.includes(tab)) setCategory(tab);
    if (params.get("cart") === "open") setOpen(true);
  }, [categories]);

  const persist = (next: CartItem[]) => {
    setCart(next);
    localStorage.setItem("sinza-cart", JSON.stringify(next));
  };

  const add = (product: any) => {
    const existing = cart.find((i) => i.id === product.id);
    const next = existing
      ? cart.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      : [
          ...cart,
          {
            id: product.id,
            title: product.title,
            price: product.price,
            currency: product.currency,
            imageUrl: product.imageUrl,
            qty: 1,
          },
        ];
    persist(next);
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1500);
  };

  const change = (id: number, delta: number) =>
    persist(
      cart
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );

  const total = cart.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
  const count = cart.reduce((sum, i) => sum + i.qty, 0);

  const filtered = useMemo(
    () => (category === "all" ? products : products.filter((p) => p.category === category)),
    [products, category],
  );

  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-40">
        <div className="gradient-ink absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:pl-24 lg:pr-10">
          <Reveal>
            <Eyebrow>Store · shipped from Kigali</Eyebrow>
            <h1 className="display-xl mt-6 font-display">
              Merch, <span className="italic-voice">music</span> & prints
            </h1>
            <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
              Every purchase supports the ministry and its outreach work. Pay with MTN MoMo, Airtel
              Money, Visa, Mastercard, Pesapal or pawaPay.
            </p>
          </Reveal>

          <Reveal delay={110}>
            <div className="mt-10 flex flex-wrap items-center gap-2">
              <button onClick={() => setCategory("all")} className={cn("chip", category === "all" && "chip-active")}>
                Everything
              </button>
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={cn("chip", category === c && "chip-active")}>
                  {c}
                </button>
              ))}
              <button onClick={() => setOpen(true)} className="chip ml-auto chip-active">
                <ShoppingBag size={14} /> Cart ({count})
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 lg:pl-24 lg:pr-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 80}>
              <Tilt className="h-full">
                <article className="card card-hover flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl || "/images/merch-hoodie.jpg"}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 tag">{p.category}</span>
                    {p.stock < 20 && (
                      <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-[0.62rem] uppercase tracking-[0.18em] text-white">
                        {p.stock} left
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-[1.15rem] leading-tight">{p.title}</h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-[0.86rem] text-muted">{p.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="tnum text-[1.08rem] font-medium text-primary">
                        {formatRWF(p.price, p.currency)}
                      </span>
                      <button
                        onClick={() => add(p)}
                        className={cn("btn h-10 px-4 text-[0.8rem]", added === p.id ? "btn-primary" : "btn-ghost")}
                      >
                        {added === p.id ? (
                          <>
                            <Check size={14} /> Added
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* cart drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[85] transition-[opacity,visibility] duration-300",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close cart" onClick={() => setOpen(false)} />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col border-l border-line bg-bg transition-transform duration-400",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line p-6">
            <h2 className="font-display text-[1.65rem] leading-none">Your cart</h2>
            <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted hover:border-primary hover:text-primary">
              <X size={17} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="pt-16 text-center">
                <ShoppingBag size={30} className="mx-auto text-muted" />
                <p className="mt-4 text-muted">Your cart is empty.</p>
                <button onClick={() => setOpen(false)} className="btn btn-primary mt-6">
                  Browse the store
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {cart.map((i) => (
                  <li key={i.id} className="flex gap-4 rounded-2xl border border-line p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.imageUrl || "/images/merch-hoodie.jpg"} alt="" className="h-20 w-20 rounded-xl object-cover" />
                    <div className="flex-1">
                      <p className="font-display text-[1.02rem] leading-tight">{i.title}</p>
                      <p className="tnum mt-1 text-[0.86rem] text-primary">{formatRWF(i.price, i.currency)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => change(i.id, -1)} aria-label="Decrease" className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted">
                          <Minus size={13} />
                        </button>
                        <span className="tnum w-5 text-center">{i.qty}</span>
                        <button onClick={() => change(i.id, 1)} aria-label="Increase" className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted">
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-line p-6">
              <div className="flex items-center justify-between text-[1.05rem]">
                <span>Subtotal</span>
                <span className="tnum font-medium">{formatRWF(total)}</span>
              </div>
              <Link href="/checkout" className="btn btn-primary mt-5 w-full">
                Checkout <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
