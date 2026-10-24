"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, Pencil, Upload, Check, X, Filter } from "lucide-react";
import { cn, formatRWF } from "@/lib/format";

type Row = Record<string, any>;

export function ResourceTable({
  resource,
  rows,
  columns,
  readOnly,
  label,
}: {
  resource: string;
  rows: Row[];
  columns: string[];
  readOnly?: boolean;
  label: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const filtered = useMemo(() => {
    if (!q) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => String(r[c] ?? "").toLowerCase().includes(needle)),
    );
  }, [rows, q, columns]);

  const remove = async (id: number) => {
    if (!window.confirm("Delete this item permanently? This cannot be undone.")) return;
    setBusy(id);
    await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  };

  const upload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setUploading(true);
    setUploadMsg("");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setUploadMsg(`Uploaded: ${json.row.url} (${json.storage})`);
      form.reset();
      router.refresh();
    } catch (error) {
      setUploadMsg((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const renderCell = (row: Row, column: string) => {
    const value = row[column];
    if (value === null || value === undefined || value === "") return <span className="text-muted">—</span>;
    if (typeof value === "boolean")
      return (
        <span className={cn("tag", value ? "bg-primary/12 text-primary" : "opacity-60")}>
          {value ? "Yes" : "No"}
        </span>
      );
    if (column === "price" || column === "total") return <span className="tnum">{formatRWF(value, row.currency || "RWF")}</span>;
    if (value instanceof Date || column.endsWith("At"))
      return (
        <span className="tnum text-[0.85rem]">
          {new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      );
    if (Array.isArray(value)) return <span className="text-muted">{value.length} item(s)</span>;
    if (typeof value === "object") return <span className="text-muted">{JSON.stringify(value).slice(0, 40)}…</span>;
    return <span className="line-clamp-2">{String(value)}</span>;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}…`}
            className="field pl-11"
            aria-label="Search"
          />
        </div>
        {!readOnly && (
          <Link href={`/admin/${resource}/new`} className="btn btn-primary">
            <Plus size={16} /> New {label.replace(/s$/, "")}
          </Link>
        )}
      </div>

      {resource === "media" && (
        <form onSubmit={upload} className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6">
          <p className="flex items-center gap-2 font-display text-[1.15rem]">
            <Upload size={17} className="text-primary" /> Upload files
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <input name="title" className="field" placeholder="Title (optional)" />
            <select name="category" className="field" defaultValue="general">
              <option value="general">general</option>
              <option value="hero">hero</option>
              <option value="covers">covers</option>
              <option value="concerts">concerts</option>
              <option value="store">store</option>
              <option value="press">press</option>
              <option value="music videos">music videos</option>
            </select>
            <input name="file" type="file" required className="field" />
            <button type="submit" disabled={uploading} className="btn btn-primary">
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
          {uploadMsg && <p className="mt-3 text-[0.84rem] text-primary">{uploadMsg}</p>}
          <p className="mt-3 text-[0.78rem] text-muted">
            Files are stored on Cloudflare R2 when R2_* variables are set, otherwise in /public/uploads.
          </p>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              {columns.map((c) => (
                <th key={c} className="px-5 py-3.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">
                  {c.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
              <th className="px-5 py-3.5 text-right text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-line transition-colors last:border-0 hover:bg-primary/5">
                {columns.map((c) => (
                  <td key={c} className="px-5 py-4 align-top text-[0.9rem]">
                    {renderCell(row, c)}
                  </td>
                ))}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {!readOnly && (
                      <>
                        <Link
                          href={`/admin/${resource}/${row.id}`}
                          className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => remove(row.id)}
                          disabled={busy === row.id}
                          className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {readOnly && <span className="tag opacity-70">read only</span>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-16 text-center text-muted">
                  No {label.toLowerCase()} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[0.82rem] text-muted">
        Showing <span className="tnum text-text">{filtered.length}</span> of{" "}
        <span className="tnum text-text">{rows.length}</span> {label.toLowerCase()}.
      </p>
    </div>
  );
}
