"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Check, Palette, Monitor, Newspaper, Mail, CreditCard } from "lucide-react";
import { cn } from "@/lib/format";

type Tab = "theme" | "hero" | "site" | "newsletter" | "payments";

const TABS: Array<{ key: Tab; label: string; icon: any }> = [
  { key: "theme", label: "Theme & colours", icon: Palette },
  { key: "hero", label: "Hero & homepage", icon: Monitor },
  { key: "site", label: "Site information", icon: Newspaper },
  { key: "newsletter", label: "Newsletter schedule", icon: Mail },
  { key: "payments", label: "Payments", icon: CreditCard },
];

export function AppearanceForm({
  theme,
  site,
  schedule,
  payments,
}: {
  theme: Record<string, any>;
  site: Record<string, any>;
  schedule: Record<string, any>;
  payments: Record<string, any>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("theme");
  const [t, setT] = useState(theme);
  const [s, setS] = useState(site);
  const [n, setN] = useState(schedule);
  const [p, setP] = useState(payments);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const save = async () => {
    setState("saving");
    try {
      for (const [key, value] of [
        ["theme", t],
        ["site", s],
        ["newsletterSchedule", n],
        ["payments", p],
      ] as const) {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!res.ok) throw new Error(`Could not save ${key}`);
      }
      setState("saved");
      setMessage("Saved — the whole website now uses these settings.");
      router.refresh();
      setTimeout(() => setState("idle"), 2400);
    } catch (error) {
      setState("error");
      setMessage((error as Error).message);
    }
  };

  const colourFields: Array<{ key: string; label: string }> = [
    { key: "primary", label: "Primary (brand red)" },
    { key: "primaryDark", label: "Primary dark (hover)" },
    { key: "accent", label: "Accent (brass)" },
    { key: "ink", label: "Ink (deep text)" },
    { key: "bone", label: "Bone (light paper)" },
  ];

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn("chip", tab === item.key && "chip-active")}
          >
            <item.icon size={14} /> {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-8">
        {tab === "theme" && (
          <div className="space-y-6">
            <h2 className="font-display text-[1.65rem] leading-tight">Colour system</h2>
            <p className="text-[0.92rem] text-muted">
              These colours are written into the site&apos;s CSS variables — change them here and every
              button, rule, tag and gradient on the website updates instantly.
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {colourFields.map((c) => (
                <label key={c.key} className="block">
                  <span className="label">{c.label}</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={t[c.key] || "#000000"}
                      onChange={(e) => setT({ ...t, [c.key]: e.target.value })}
                      className="h-11 w-16 cursor-pointer rounded-lg border border-line bg-transparent"
                    />
                    <input
                      className="field flex-1"
                      value={t[c.key] || ""}
                      onChange={(e) => setT({ ...t, [c.key]: e.target.value })}
                    />
                  </div>
                </label>
              ))}

              <label className="block">
                <span className="label">Corner radius (px)</span>
                <input
                  type="number"
                  className="field"
                  value={t.radius ?? 18}
                  onChange={(e) => setT({ ...t, radius: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="label">Default mode</span>
                <select className="field" value={t.defaultMode} onChange={(e) => setT({ ...t, defaultMode: e.target.value })}>
                  <option value="dark">Dark (stage house)</option>
                  <option value="light">Light (bone paper)</option>
                </select>
              </label>
              <label className="block">
                <span className="label">Visitors may switch mode</span>
                <button
                  type="button"
                  onClick={() => setT({ ...t, allowModeSwitch: !t.allowModeSwitch })}
                  className={cn(
                    "flex h-11 w-full items-center gap-3 rounded-xl border px-4 text-[0.9rem]",
                    t.allowModeSwitch ? "border-primary bg-primary/10 text-primary" : "border-line text-muted",
                  )}
                >
                  <span className={cn("grid h-5 w-5 place-items-center rounded-md border", t.allowModeSwitch ? "border-primary bg-primary text-white" : "border-line")}>
                    {t.allowModeSwitch ? "✓" : ""}
                  </span>
                  {t.allowModeSwitch ? "Enabled" : "Disabled"}
                </button>
              </label>
            </div>

            <div className="rounded-2xl border border-line p-6">
              <p className="label">Live preview</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl p-6" style={{ background: t.ink }}>
                <span className="rounded-full px-5 py-2.5 text-white" style={{ background: t.primary }}>
                  Primary button
                </span>
                <span className="rounded-full border px-5 py-2.5" style={{ borderColor: t.bone, color: t.bone }}>
                  Ghost button
                </span>
                <span className="rounded-full px-4 py-1.5 text-[0.78rem]" style={{ background: t.accent, color: t.ink }}>
                  Accent tag
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === "hero" && (
          <div className="space-y-5">
            <h2 className="font-display text-[1.65rem] leading-tight">Hero & homepage</h2>
            <div>
              <span className="label">Headline (use \n to break a line — the second part is italic)</span>
              <textarea rows={3} className="field" value={t.heroTitle ?? ""} onChange={(e) => setT({ ...t, heroTitle: e.target.value })} />
            </div>
            <div>
              <span className="label">Sub-title</span>
              <textarea rows={3} className="field" value={t.heroSubtitle ?? ""} onChange={(e) => setT({ ...t, heroSubtitle: e.target.value })} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="label">Primary button label</span>
                <input className="field" value={t.heroCtaPrimary ?? ""} onChange={(e) => setT({ ...t, heroCtaPrimary: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Secondary button label</span>
                <input className="field" value={t.heroCtaSecondary ?? ""} onChange={(e) => setT({ ...t, heroCtaSecondary: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Background poster image</span>
                <input className="field" value={t.heroPoster ?? ""} onChange={(e) => setT({ ...t, heroPoster: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Background video URL (mp4)</span>
                <input className="field" value={t.heroVideoUrl ?? ""} onChange={(e) => setT({ ...t, heroVideoUrl: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Hero lightbox YouTube ID</span>
                <input className="field" value={t.heroYoutubeId ?? ""} onChange={(e) => setT({ ...t, heroYoutubeId: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Marquee words (comma separated)</span>
                <input
                  className="field"
                  value={(t.marquee ?? []).join(", ")}
                  onChange={(e) => setT({ ...t, marquee: e.target.value.split(",").map((x: string) => x.trim()).filter(Boolean) })}
                />
              </label>
            </div>
          </div>
        )}

        {tab === "site" && (
          <div className="space-y-5">
            <h2 className="font-display text-[1.65rem] leading-tight">Site information</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ["siteName", "Site name"],
                ["shortName", "Short name"],
                ["email", "Contact email"],
                ["phone", "Phone"],
                ["whatsapp", "WhatsApp"],
                ["address", "Address"],
                ["currency", "Currency"],
                ["defaultLanguage", "Default language"],
                ["footerNote", "Footer note"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="label">{label}</span>
                  <input className="field" value={s[key] ?? ""} onChange={(e) => setS({ ...s, [key]: e.target.value })} />
                </label>
              ))}
            </div>
            <div>
              <span className="label">Tagline</span>
              <textarea rows={2} className="field" value={s.tagline ?? ""} onChange={(e) => setS({ ...s, tagline: e.target.value })} />
            </div>
            <div>
              <span className="label">Enabled languages (JSON array)</span>
              <input
                className="field"
                value={(s.languages ?? []).join(", ")}
                onChange={(e) => setS({ ...s, languages: e.target.value.split(",").map((x: string) => x.trim()).filter(Boolean) })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {["showMusic", "showVideos", "showConcerts", "showStore", "showNews", "showNewsletter"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setS({ ...s, [key]: !s[key] })}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-[0.88rem]",
                    s[key] ? "border-primary bg-primary/10 text-primary" : "border-line text-muted",
                  )}
                >
                  <span className={cn("grid h-5 w-5 place-items-center rounded-md border", s[key] ? "border-primary bg-primary text-white" : "border-line")}>
                    {s[key] ? "✓" : ""}
                  </span>
                  Show {key.replace("show", "")}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "newsletter" && (
          <div className="space-y-6">
            <h2 className="font-display text-[1.65rem] leading-tight">Automatic newsletter</h2>
            <p className="text-[0.92rem] text-muted">
              Choose the days of the week the newsletter is sent automatically (for example Monday,
              Wednesday and Friday). Then point your cron at{" "}
              <code className="text-primary">/api/cron/newsletter</code> — or use the button in the header
              to send right now.
            </p>

            <div className="flex flex-wrap gap-2">
              {dayNames.map((day, index) => {
                const active = (n.days ?? []).includes(index);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setN({
                        ...n,
                        days: active ? (n.days ?? []).filter((d: number) => d !== index) : [...(n.days ?? []), index].sort(),
                      })
                    }
                    className={cn("chip", active && "chip-active")}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <label className="block">
                <span className="label">Send hour (0–23)</span>
                <input type="number" className="field" value={n.hour ?? 9} onChange={(e) => setN({ ...n, hour: Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className="label">Timezone</span>
                <input className="field" value={n.timezone ?? "Africa/Kigali"} onChange={(e) => setN({ ...n, timezone: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Automatic sending</span>
                <button
                  type="button"
                  onClick={() => setN({ ...n, enabled: !n.enabled })}
                  className={cn(
                    "flex h-11 w-full items-center gap-3 rounded-xl border px-4 text-[0.9rem]",
                    n.enabled ? "border-primary bg-primary/10 text-primary" : "border-line text-muted",
                  )}
                >
                  <span className={cn("grid h-5 w-5 place-items-center rounded-md border", n.enabled ? "border-primary bg-primary text-white" : "border-line")}>
                    {n.enabled ? "✓" : ""}
                  </span>
                  {n.enabled ? "Enabled" : "Paused"}
                </button>
              </label>
            </div>
          </div>
        )}

        {tab === "payments" && (
          <div className="space-y-6">
            <h2 className="font-display text-[1.65rem] leading-tight">Payment methods</h2>
            <p className="text-[0.92rem] text-muted">
              Toggle the methods offered at checkout. Configure the gateway credentials in{" "}
              <code className="text-primary">.env.local</code> (PESAPAL_*, PAWAPAY_*). While demo mode is
              on, payments are simulated instantly.
            </p>
            <div className="flex flex-wrap gap-2">
              {["mtn", "airtel", "visa", "mastercard", "pesapal", "pawapay"].map((m) => {
                const active = (p.enabled ?? []).includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      setP({
                        ...p,
                        enabled: active ? (p.enabled ?? []).filter((x: string) => x !== m) : [...(p.enabled ?? []), m],
                      })
                    }
                    className={cn("chip capitalize", active && "chip-active")}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="block">
                <span className="label">Booking fee (%)</span>
                <input type="number" className="field" value={p.bookingFeePercent ?? 3} onChange={(e) => setP({ ...p, bookingFeePercent: Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className="label">Currency</span>
                <input className="field" value={p.currency ?? "RWF"} onChange={(e) => setP({ ...p, currency: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Demo mode</span>
                <button
                  type="button"
                  onClick={() => setP({ ...p, demoMode: !p.demoMode })}
                  className={cn(
                    "flex h-11 w-full items-center gap-3 rounded-xl border px-4 text-[0.9rem]",
                    p.demoMode ? "border-primary bg-primary/10 text-primary" : "border-line text-muted",
                  )}
                >
                  <span className={cn("grid h-5 w-5 place-items-center rounded-md border", p.demoMode ? "border-primary bg-primary text-white" : "border-line")}>
                    {p.demoMode ? "✓" : ""}
                  </span>
                  {p.demoMode ? "Simulated" : "Live gateways"}
                </button>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button onClick={save} disabled={state === "saving"} className="btn btn-primary">
          {state === "saving" ? <Loader2 size={16} className="animate-spin" /> : state === "saved" ? <Check size={16} /> : <Save size={16} />}
          Save settings
        </button>
        {message && <p className={cn("text-sm", state === "error" ? "text-primary" : "text-muted")}>{message}</p>}
      </div>
    </div>
  );
}
