import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

export default defineConfig({
  schema: "./src/db/schema.ts", // see below: set to wherever your pgTable() calls live
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});