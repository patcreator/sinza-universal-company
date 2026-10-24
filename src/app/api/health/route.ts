import { NextResponse } from "next/server";
import { db, ensureSeeded } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "up" | "down" = "down";
  let seeded = false;
  try {
    await db.execute(sql`select 1`);
    database = "up";
    await ensureSeeded();
    seeded = true;
  } catch (error) {
    console.error("[health]", (error as Error).message);
  }

  return NextResponse.json({
    status: database === "up" ? "ok" : "degraded",
    service: "sinza-universal-company",
    database,
    seeded,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
}
