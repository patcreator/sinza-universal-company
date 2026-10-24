import { NextRequest, NextResponse } from "next/server";
import { desc, eq, or, ilike, count, asc } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { getAdmin } from "@/lib/auth";
import { RESOURCES, type Field } from "@/lib/admin-resources";

function coerce(fields: Field[], body: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const field of fields) {
    const raw = body[field.name];
    if (raw === undefined) continue;
    switch (field.type) {
      case "number":
        out[field.name] = raw === "" || raw === null ? 0 : Number(raw);
        break;
      case "checkbox":
        out[field.name] = Boolean(raw);
        break;
      case "json":
        if (typeof raw === "string") {
          try {
            out[field.name] = JSON.parse(raw || "null");
          } catch {
            out[field.name] = raw;
          }
        } else {
          out[field.name] = raw;
        }
        break;
      case "date":
        out[field.name] = raw ? new Date(raw) : null;
        break;
      default:
        out[field.name] = raw;
    }
  }
  return out;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  await ensureSeeded();
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { resource } = await ctx.params;
  const config = RESOURCES[resource];
  if (!config) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const q = req.nextUrl.searchParams.get("q");
  const limit = Math.min(200, Number(req.nextUrl.searchParams.get("limit") || 50));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset") || 0));

  let query: any = db.select().from(config.table);
  if (q && config.searchable?.length) {
    const filters = config.searchable.map((col) => ilike((config.table as any)[col], `%${q}%`));
    query = query.where(or(...filters));
  }

  const rows = await query.orderBy(desc((config.table as any).createdAt ?? (config.table as any).id)).limit(limit).offset(offset);
  const totals = (await db.select({ value: count() }).from(config.table)) as Array<{ value: number }>;

  return NextResponse.json({ rows, total: totals[0]?.value ?? rows.length, resource, config: { label: config.label, columns: config.columns, readOnly: config.readOnly } });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  await ensureSeeded();
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { resource } = await ctx.params;
  const config = RESOURCES[resource];
  if (!config) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  if (config.readOnly) return NextResponse.json({ error: "This resource is read only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const values = coerce(config.fields, body);
  if (values.createdAt === undefined) values.createdAt = new Date();
  values.updatedAt = new Date();

  const inserted = (await db.insert(config.table).values(values).returning()) as any[];
  return NextResponse.json({ row: inserted[0] });
}
