import { notFound } from "next/navigation";
import { desc, or, ilike, eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { RESOURCES } from "@/lib/admin-resources";
import { ResourceTable } from "@/components/admin/ResourceTable";

export const dynamic = "force-dynamic";

export default async function ResourceListPage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams?: Promise<Record<string, string>>;
}) {
  const { resource } = await params;
  const config = RESOURCES[resource];
  if (!config) notFound();

  const sp = (await searchParams) ?? {};
  await ensureSeeded();

  let rows: any[] = [];
  try {
    let query: any = db.select().from(config.table);
    if (sp.q && config.searchable?.length) {
      query = query.where(or(...config.searchable.map((c) => ilike((config.table as any)[c], `%${sp.q}%`))));
    }
    rows = await query.orderBy(desc((config.table as any).createdAt ?? (config.table as any).id)).limit(200);
  } catch {
    rows = [];
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">Manage</p>
          <h1 className="mt-3 font-display text-[2.15rem] leading-none">{config.label}</h1>
          <p className="mt-3 max-w-2xl text-[0.92rem] leading-relaxed text-muted">
            Create, edit and remove {config.label.toLowerCase()}. Changes go live on the website immediately.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ResourceTable
          resource={resource}
          rows={JSON.parse(JSON.stringify(rows))}
          columns={config.columns}
          readOnly={config.readOnly}
          label={config.label}
        />
      </div>
    </div>
  );
}
