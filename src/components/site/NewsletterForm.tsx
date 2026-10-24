"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function NewsletterForm({ variant = "inline" }: { variant?: "inline" | "panel" }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setState("done");
      setMessage(json.message || "You are on the list. Check your inbox for a welcome note.");
      setEmail("");
      setName("");
    } catch (error) {
      setState("error");
      setMessage((error as Error).message);
    }
  };

  if (state === "done") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-5">
        <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={20} />
        <p className="text-sm leading-relaxed text-text">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={variant === "panel" ? "space-y-3" : "flex flex-col gap-3 sm:flex-row"}>
      {variant === "panel" && (
        <input
          className="field"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Your name"
        />
      )}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className="field flex-1"
      />
      <button type="submit" disabled={state === "loading"} className="btn btn-primary">
        {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : null}
        Subscribe
      </button>
      {state === "error" && (
        <p className="flex items-center gap-2 text-sm text-primary">
          <AlertCircle size={15} /> {message}
        </p>
      )}
    </form>
  );
}
