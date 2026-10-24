import { NextResponse } from "next/server";

/** Turns any unexpected crash into a JSON error the UI can show. */
export function errorResponse(error: unknown, where: string) {
  console.error(`[${where}] unhandled error`, error);
  const msg = error instanceof Error ? error.message : String(error);

  let friendly = "Something went wrong on our side. Please try again in a moment.";
  if (/TICKET_SECRET/i.test(msg)) {
    friendly = "Server setup problem: TICKET_SECRET is missing in .env (restart the dev server after adding it).";
  } else if (/does not exist/i.test(msg)) {
    friendly = "Database is out of date (missing table or column). Run: npx drizzle-kit push";
  } else if (/ECONNREFUSED|ENOTFOUND|connect/i.test(msg)) {
    friendly = "Cannot reach the database or a payment service. Check DATABASE_URL and your internet connection.";
  }

  // The real technical message is shown only in development.
  const dev = process.env.NODE_ENV !== "production";
  return NextResponse.json(
    { error: dev ? `${friendly} [${msg}]` : friendly },
    { status: 500 }
  );
}