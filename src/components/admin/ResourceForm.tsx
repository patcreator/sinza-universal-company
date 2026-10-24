"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Loader2, Check } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { Field } from "@/lib/admin-resources";
import { cn } from "@/lib/format";

type Option = { value: string; label: string };

function toLocalInput(value: any) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ResourceForm({
  resource,
  fields,
  row,
  refOptions = {},
  mediaOptions = [],
  isNew = false,
  title,
}: {
  resource: string;
  fields: Field[];
  row: Record<string, any>;
  refOptions?: Record<string, Option[]>;
  mediaOptions?: Option[];
  isNew?: boolean;
  title: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of fields) {
      const v = row[f.name];
      if (f.type === "json") init[f.name] = JSON.stringify(v ?? (f.name === "tags" ? [] : {}), null, 2);
      else if (f.type === "date") init[f.name] = toLocalInput(v);
      else if (f.type === "checkbox") init[f.name] = Boolean(v);
      else init[f.name] = v ?? "";
    }
    return init;
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const set = (name: string, value: any) => setValues((prev) => ({ ...prev, [name]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("saving");
    try {
      const payload: Record<string, any> = { ...values };
      for (const f of fields) {
        if (f.type === "readonly") delete payload[f.name];
        if (f.type === "json") {
          try {
            payload[f.name] = JSON.parse(values[f.name] || "null");
          } catch {
            throw new Error(`Field "${f.label}" is not valid JSON.`);
          }
        }
        if (f.type === "select" && f.ref) payload[f.name] = values[f.name] ? Number(values[f.name]) : null;
      }

      const res = await fetch(isNew ? `/api/admin/${resource}` : `/api/admin/${resource}/${row.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save");
      setState("saved");
      setMessage("Saved.");
      if (isNew && json.row?.id) {
        router.push(`/admin/${resource}/${json.row.id}`);
      }
      router.refresh();
      setTimeout(() => setState("idle"), 2200);
    } catch (error) {
      setState("error");
      setMessage((error as Error).message);
    }
  };

  const remove = async () => {
    if (isNew) return router.push(`/admin/${resource}`);
    if (!window.confirm("Delete this item permanently?")) return;
    await fetch(`/api/admin/${resource}/${row.id}`, { method: "DELETE" });
    router.push(`/admin/${resource}`);
    router.refresh();
  };

  return (
    <form onSubmit={save} className="max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/admin/${resource}`)}
          className="btn btn-ghost h-10 px-4 text-[0.82rem]"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <h1 className="font-display text-[1.85rem] leading-tight">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={remove} className="btn btn-ghost h-10 px-4 text-[0.82rem]">
            <Trash2 size={15} /> Delete
          </button>
          <button type="submit" disabled={state === "saving"} className="btn btn-primary h-10 px-5 text-[0.82rem]">
            {state === "saving" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : state === "saved" ? (
              <Check size={15} />
            ) : (
              <Save size={15} />
            )}
            Save changes
          </button>
        </div>
      </div>

      {message && (
        <p className={cn("mt-4 text-sm", state === "error" ? "text-primary" : "text-muted")}>{message}</p>
      )}

      <div className="mt-8 space-y-5 rounded-2xl border border-line bg-surface p-7">
        {fields.map((field) => {
          const value = values[field.name];

          return (
            <div key={field.name} className={field.half ? "md:grid md:grid-cols-2 md:gap-5" : ""}>
              <div className={field.half ? "" : ""}>
                <label className="label" htmlFor={`f-${field.name}`}>
                  {field.label}
                </label>

                {field.type === "text" && (
                  <input
                    id={`f-${field.name}`}
                    className="field"
                    value={value ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                )}

                {field.type === "textarea" && (
                  <textarea
                    id={`f-${field.name}`}
                    rows={4}
                    className="field"
                    value={value ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                )}

                {field.type === "number" && (
                  <input
                    id={`f-${field.name}`}
                    type="number"
                    step="any"
                    className="field"
                    value={value ?? 0}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                )}

                {field.type === "date" && (
                  <input
                    id={`f-${field.name}`}
                    type="datetime-local"
                    className="field"
                    value={value ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                )}

                {field.type === "checkbox" && (
                  <button
                    type="button"
                    id={`f-${field.name}`}
                    onClick={() => set(field.name, !value)}
                    className={cn(
                      "flex h-11 w-full items-center gap-3 rounded-xl border px-4 text-[0.9rem] transition-colors",
                      value ? "border-primary bg-primary/10 text-primary" : "border-line text-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-md border",
                        value ? "border-primary bg-primary text-white" : "border-line",
                      )}
                    >
                      {value ? "✓" : ""}
                    </span>
                    {value ? "Enabled" : "Disabled"}
                  </button>
                )}

                {field.type === "select" && (
                  <select
                    id={`f-${field.name}`}
                    className="field"
                    value={value ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                  >
                    <option value="">— none —</option>
                    {field.ref
                      ? (refOptions[field.ref] ?? []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))
                      : (field.options ?? []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                  </select>
                )}

                {field.type === "image" && (
                  <div className="space-y-2">
                    <input
                      id={`f-${field.name}`}
                      className="field"
                      value={value ?? ""}
                      onChange={(e) => set(field.name, e.target.value)}
                      placeholder="/images/… or https://…"
                    />
                    <div className="flex items-center gap-3">
                      {value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={value} alt="" className="h-16 w-16 rounded-xl border border-line object-cover" />
                      ) : (
                        <div className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-line text-[0.7rem] text-muted">
                          no image
                        </div>
                      )}
                      <select
                        className="field flex-1"
                        value=""
                        onChange={(e) => e.target.value && set(field.name, e.target.value)}
                      >
                        <option value="">Pick from file manager…</option>
                        {mediaOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {field.type === "json" && (
                  <textarea
                    id={`f-${field.name}`}
                    rows={5}
                    className="field font-mono text-[0.82rem]"
                    value={value ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                )}

                {field.type === "rich" && (
                  <RichTextEditor value={value ?? ""} onChange={(html) => set(field.name, html)} />
                )}

                {field.type === "readonly" && (
                  <div className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-[0.92rem] text-muted">
                    {String(value ?? "—")}
                  </div>
                )}

                {field.help && <p className="mt-2 text-[0.78rem] text-muted">{field.help}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </form>
  );
}
