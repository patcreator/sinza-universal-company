import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { RESOURCES } from "@/lib/admin-resources";
import { ResourceForm } from "@/components/admin/ResourceForm";

export const dynamic = "force-dynamic";

export default async function ResourceEditPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  const config = RESOURCES[resource];
  if (!config) notFound();
  await ensureSeeded();

  const isNew = id === "new";
  let row: Record<string, any> = {};

  if (!isNew) {
    try {
      const rows = await db.select().from(config.table).where(eq((config.table as any).id, Number(id))).limit(1);
      if (!rows[0]) notFound();
      row = rows[0];
    } catch {
      notFound();
    }
  }

  // Options for relational selects (album → tracks, concert → ticket tiers, …)
  const refOptions: Record<string, Array<{ value: string; label: string }>> = {};
  for (const field of config.fields) {
    if (!field.ref) continue;
    const refConfig = RESOURCES[field.ref];
    if (!refConfig) continue;
    try {
      const rows = await db.select().from(refConfig.table).limit(200);
      refOptions[field.ref] = rows.map((r: any) => ({
        value: String(r.id),
        label: String(r[refConfig.titleField] ?? r.id),
      }));
    } catch {
      refOptions[field.ref] = [];
    }
  }

  let mediaOptions: Array<{ value: string; label: string }> = [];
  if (config.fields.some((f) => f.type === "image")) {
    try {
      const rows = await db.select().from((await import("@/db/schema")).media).limit(200);
      mediaOptions = rows.map((r: any) => ({ value: r.url, label: `${r.title} (${r.url})` }));
    } catch {
      mediaOptions = [];
    }
  }

  return (
    <ResourceForm
      resource={resource}
      fields={config.fields}
      row={JSON.parse(JSON.stringify(row))}
      refOptions={refOptions}
      mediaOptions={mediaOptions}
      isNew={isNew}
      title={isNew ? `New ${config.singular}` : String(row[config.titleField] ?? config.singular)}
    />
  );
}
