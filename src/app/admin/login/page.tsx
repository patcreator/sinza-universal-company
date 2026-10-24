"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User, ShieldCheck } from "lucide-react";
import { SinzaLogo } from "@/components/site/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setState("error");
      setError((err as Error).message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="gradient-ink absolute inset-0" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/hero-stage.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-18" />
      <div className="grain absolute inset-0" />

      <div className="relative w-full max-w-[440px]">
        <div className="card p-9">
          <SinzaLogo size={40} />
          <p className="mt-6 text-[0.72rem] uppercase tracking-[0.24em] text-muted">Control room</p>
          <h1 className="mt-3 font-display text-[2.15rem] leading-none">Admin sign in</h1>
          <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">
            Staff access only — this portal uses a username and password, never social login.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="username">Username or email</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="username"
                  autoComplete="username"
                  required
                  className="field pl-11"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="field pl-11"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {state === "error" && <p className="text-sm text-primary">{error}</p>}

            <button type="submit" disabled={state === "loading"} className="btn btn-primary w-full">
              {state === "loading" ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
              Sign in to the dashboard
            </button>
          </form>

          
        </div>
      </div>
    </div>
  );
}
