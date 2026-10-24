import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export type SettingsMap = Record<string, any>;

let cache: SettingsMap | null = null;

export async function getAllSettings(): Promise<SettingsMap> {
  if (cache) return cache;
  const rows = await db.select().from(settings);
  const map: SettingsMap = {};
  for (const row of rows) map[row.key] = row.value;
  cache = map;
  return map;
}

export function invalidateSettingsCache() {
  cache = null;
}

export async function getSetting<T = any>(key: string, fallback: T): Promise<T> {
  const map = await getAllSettings();
  return (map[key] as T) ?? fallback;
}

export async function upsertSetting(key: string, value: unknown) {
  const where = eq(settings.key, key);
  const existing = await db.select().from(settings).where(where).limit(1);
  if (existing[0]) {
    await db.update(settings).set({ value: value as any, updatedAt: new Date() }).where(where);
  } else {
    await db.insert(settings).values({ key, value: value as any });
  }
  invalidateSettingsCache();
}

export const defaultSite = {
  siteName: "Sinza Universal Company",
  shortName: "SINZA",
  tagline: "Praise & worship from Kigali to the world",
  email: "hello@sinzauniversal.com",
  phone: "+250 788 300 120",
  currency: "RWF",
  languages: ["en", "rw", "fr"],
  defaultLanguage: "en",
};

export const defaultTheme = {
  primary: "#C1121F",
  primaryDark: "#8E0D17",
  accent: "#C8912F",
  ink: "#14100F",
  bone: "#F3EDE7",
  radius: 18,
  defaultMode: "dark",
  allowModeSwitch: true,
  heroTitle: "The sound of\nsalvation",
  heroSubtitle: "Jado Sinza & Esther — Rwandan praise and worship.",
  heroPoster: "/images/hero-stage.jpg",
  heroVideoUrl: "",
  heroYoutubeId: "Uy0blMiY4mU",
};
