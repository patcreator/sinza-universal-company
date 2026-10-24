import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { settings } from "@/db/schema";
import { getAdmin } from "@/lib/auth";
import { invalidateSettingsCache } from "@/lib/settings";

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const key = String(body.key || "");
  const value = body.value;
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });

  const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (existing[0]) {
    await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
  invalidateSettingsCache();

  return NextResponse.json({ ok: true, key, value });
}
