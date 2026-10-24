import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { getAdmin } from "@/lib/auth";
import { RESOURCES } from "@/lib/admin-resources";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ resource: string; id: string }> }) {
  await ensureSeeded();
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { resource, id } = await ctx.params;
  const config = RESOURCES[resource];
  if (!config) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const rows = (await db.select().from(config.table).where(eq((config.table as any).id, Number(id))).limit(1)) as any[];
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ row: rows[0] });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ resource: string; id: string }> }) {
  await ensureSeeded();
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { resource, id } = await ctx.params;
  const config = RESOURCES[resource];
  if (!config) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  if (config.readOnly) return NextResponse.json({ error: "This resource is read only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const values: Record<string, any> = {};

  for (const field of config.fields) {
    const raw = body[field.name];
    if (raw === undefined) continue;
    if (field.type === "number") values[field.name] = raw === "" || raw === null ? 0 : Number(raw);
    else if (field.type === "checkbox") values[field.name] = Boolean(raw);
    else if (field.type === "date") values[field.name] = raw ? new Date(raw) : null;
    else if (field.type === "json") {
      if (typeof raw === "string") {
        try {
          values[field.name] = JSON.parse(raw || "null");
        } catch {
          values[field.name] = raw;
        }
      } else values[field.name] = raw;
    } else if (field.type !== "readonly") values[field.name] = raw;
  }
  values.updatedAt = new Date();

  const updated = (await db
    .update(config.table)
    .set(values)
    .where(eq((config.table as any).id, Number(id)))
    .returning()) as any[];

  return NextResponse.json({ row: updated[0] });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ resource: string; id: string }> }) {
  await ensureSeeded();
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { resource, id } = await ctx.params;
  const config = RESOURCES[resource];
  if (!config) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  if (config.readOnly) return NextResponse.json({ error: "This resource is read only" }, { status: 403 });

  await db.delete(config.table).where(eq((config.table as any).id, Number(id)));
  return NextResponse.json({ ok: true });
}
