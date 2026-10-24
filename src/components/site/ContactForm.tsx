"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

const DEPARTMENTS = ["Bookings & events", "Press & media", "Music & collaborations", "Orders & support"];

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: DEPARTMENTS[0], message: "" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not send your message");
      setState("done");
      setMessage(json.message || "Thank you — we will reply within two working days.");
      setForm({ name: "", email: "", subject: DEPARTMENTS[0], message: "" });
    } catch (error) {
      setState("error");
      setMessage((error as Error).message);
    }
  };

  if (state === "done") {
    return (
      <div className="card p-8">
        <CheckCircle2 className="text-primary" size={30} />
        <h3 className="mt-4 font-display text-[1.75rem] leading-tight">Message received.</h3>
        <p className="mt-3 text-muted">{message}</p>
        <button onClick={() => setState("idle")} className="btn btn-ghost mt-6">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="ct-name">Your name</label>
          <input id="ct-name" required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Diane Uwase" />
        </div>
        <div>
          <label className="label" htmlFor="ct-email">Email</label>
          <input id="ct-email" type="email" required className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
        </div>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="ct-subject">Department</label>
        <select id="ct-subject" className="field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="ct-message">Message</label>
        <textarea
          id="ct-message"
          required
          rows={6}
          className="field"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Tell us what you need — bookings, press requests, collaboration ideas…"
        />
      </div>

      {state === "error" && <p className="mt-4 text-sm text-primary">{message}</p>}

      <button type="submit" disabled={state === "loading"} className="btn btn-primary mt-6">
        {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Send message
      </button>
      <p className="mt-4 text-[0.8rem] text-muted">
        We reply within two working days. By writing to us you accept our{" "}
        <a href="/privacy" className="text-primary underline underline-offset-2">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
