import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  _NextJsPostgresqlPool?: Pool;
  __sinzaSeeded?: boolean;
};

export const pool =
  globalForDb._NextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._NextJsPostgresqlPool = pool;
}

export const db = drizzle(pool, { schema });

export { schema };

/** Push schema + load sample data exactly once per runtime. Safe to call often. */
export async function ensureSeeded(): Promise<void> {
  if (globalForDb.__sinzaSeeded) return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  globalForDb.__sinzaSeeded = true;
  try {
    const { seed } = await import("./seed");
    await seed();
  } catch (error) {
    globalForDb.__sinzaSeeded = false;
    console.error("[sinza] seed skipped:", (error as Error).message);
  }
}

// Fire and forget on first server-side import.
if (process.env.NEXT_PHASE !== "phase-production-build") {
  void ensureSeeded();
}
