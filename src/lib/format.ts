export function formatRWF(value: number | string, currency = "RWF") {
  const n = typeof value === "string" ? Number(value) : value;
  if (currency === "RWF") {
    return `RWF ${new Intl.NumberFormat("en-US").format(Math.round(n))}`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function formatDate(value: string | Date, locale = "en-GB") {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date, locale = "en-GB") {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dayParts(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return {
    day: d.toLocaleDateString("en-GB", { day: "2-digit" }),
    month: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
    year: d.toLocaleDateString("en-GB", { year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    weekday: d.toLocaleDateString("en-GB", { weekday: "long" }),
  };
}

export function formatDuration(seconds: number) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function countdown(value: string | Date) {
  const target = typeof value === "string" ? new Date(value) : value;
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { done: true, days: 0, hours: 0, minutes: 0 };
  return {
    done: false,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
  };
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function excerptFrom(html: string, length = 160) {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export function makeRef(prefix = "SIN") {
  const now = new Date();
  const stamp = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}
