import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { TICKET_CODE_RE } from "@/lib/tickets";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = process.env.SCANNER_KEY;
  if (!key || req.headers.get("x-scanner-key") !== key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim().toUpperCase();
  const concertId = body.concertId ? Number(body.concertId) : null;
  if (!TICKET_CODE_RE.test(code)) return NextResponse.json({ result: "invalid" });

  const conds = [eq(tickets.code, code), eq(tickets.status, "valid")];
  if (concertId) conds.push(eq(tickets.concertId, concertId));

  // Atomic: only one scan can ever flip valid -> used.
  const [ok] = await db
    .update(tickets)
    .set({ status: "used", checkedInAt: new Date(), updatedAt: new Date() })
    .where(and(...conds))
    .returning();
  if (ok) {
    return NextResponse.json({
      result: "valid",
      ticket: { code: ok.code, tier: ok.tierName, holder: ok.holderName },
    });
  }

  const [t] = await db.select().from(tickets).where(eq(tickets.code, code)).limit(1);
  if (!t) return NextResponse.json({ result: "invalid" });
  if (concertId && t.concertId !== concertId) return NextResponse.json({ result: "wrong_event" });
  if (t.status === "used") {
    return NextResponse.json({ result: "already_used", checkedInAt: t.checkedInAt });
  }
  return NextResponse.json({ result: "void" });
}