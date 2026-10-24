"use client";

import { useState } from "react";
import { Loader2, MessageCircle, Reply, Check } from "lucide-react";

type Comment = {
  id: number;
  parentId: number | null;
  authorName: string;
  body: string;
  createdAt: string | Date;
};

export function Comments({ postId, comments }: { postId: number; comments: Comment[] }) {
  const [items, setItems] = useState(comments);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [form, setForm] = useState({ authorName: "", email: "", body: "" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const roots = items.filter((c) => !c.parentId);
  const repliesOf = (id: number) => items.filter((c) => c.parentId === id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, parentId: replyTo, ...form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not post your comment");
      setItems((prev) => [...prev, json.comment]);
      setForm({ ...form, body: "" });
      setReplyTo(null);
      setState("done");
      setMessage("Thank you — your comment is live.");
      setTimeout(() => setState("idle"), 2500);
    } catch (error) {
      setState("error");
      setMessage((error as Error).message);
    }
  };

  return (
    <section className="mt-16 border-t border-line pt-12">
      <h2 className="flex items-center gap-3 font-display text-[1.95rem] leading-tight">
        <MessageCircle size={22} className="text-primary" />
        Conversation <span className="tnum text-muted">({items.length})</span>
      </h2>

      <div className="mt-8 space-y-7">
        {roots.map((c) => (
          <article key={c.id} className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/12 font-display text-[1.02rem] text-primary">
                {c.authorName.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="font-medium">{c.authorName}</p>
                <p className="tnum text-[0.74rem] uppercase tracking-[0.14em] text-muted">
                  {new Date(c.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                className="ml-auto inline-flex items-center gap-1.5 text-[0.82rem] text-primary transition-colors hover:text-primary-dark"
              >
                <Reply size={14} /> Reply
              </button>
            </div>
            <p className="mt-4 leading-relaxed text-text/90">{c.body}</p>

            {repliesOf(c.id).length > 0 && (
              <div className="mt-6 space-y-5 border-l-2 border-primary/25 pl-6">
                {repliesOf(c.id).map((r) => (
                  <div key={r.id}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/12 text-[0.85rem] text-primary">
                        {r.authorName.slice(0, 1).toUpperCase()}
                      </span>
                      <p className="font-medium">{r.authorName}</p>
                      <p className="tnum text-[0.72rem] uppercase tracking-[0.14em] text-muted">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <p className="mt-2.5 leading-relaxed text-text/90">{r.body}</p>
                  </div>
                ))}
              </div>
            )}

            {replyTo === c.id && (
              <form onSubmit={submit} className="mt-6 rounded-2xl border border-line bg-bg p-5">
                <p className="label">Replying to {c.authorName}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    className="field"
                    placeholder="Your name"
                    value={form.authorName}
                    onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  />
                  <input
                    required
                    type="email"
                    className="field"
                    placeholder="Email (never published)"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  className="field mt-3"
                  placeholder="Write your reply…"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
                <div className="mt-3 flex items-center gap-3">
                  <button type="submit" className="btn btn-primary h-10 px-5 text-[0.82rem]">
                    {state === "loading" ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Post reply
                  </button>
                  <button type="button" onClick={() => setReplyTo(null)} className="btn btn-ghost h-10 px-5 text-[0.82rem]">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </article>
        ))}

        {roots.length === 0 && <p className="text-muted">Be the first to comment on this article.</p>}
      </div>

      {/* main form */}
      <form onSubmit={submit} className="mt-12 rounded-[calc(var(--radius)*1.1)] border border-line bg-surface p-7">
        <h3 className="font-display text-[1.55rem] leading-tight">Leave a comment</h3>
        <p className="mt-2 text-[0.88rem] text-muted">
          Comments are moderated. Be kind — this is a worship space.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            required
            className="field"
            placeholder="Your name"
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
          />
          <input
            required
            type="email"
            className="field"
            placeholder="Email (never published)"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <textarea
          required
          rows={4}
          className="field mt-3"
          placeholder="Share what this song or story means to you…"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        {state === "error" && <p className="mt-3 text-sm text-primary">{message}</p>}
        {state === "done" && (
          <p className="mt-3 flex items-center gap-2 text-sm text-primary">
            <Check size={15} /> {message}
          </p>
        )}
        <button type="submit" className="btn btn-primary mt-5">
          {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
          Post comment
        </button>
      </form>
    </section>
  );
}
