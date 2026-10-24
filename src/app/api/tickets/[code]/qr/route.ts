import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { TICKET_CODE_RE } from "@/lib/tickets";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.toUpperCase();
  if (!TICKET_CODE_RE.test(clean)) return new NextResponse("Not found", { status: 404 });

  const [row] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.code, clean)).limit(1);
  if (!row) return new NextResponse("Not found", { status: 404 });

  const png = await QRCode.toBuffer(clean, { width: 400, margin: 1, errorCorrectionLevel: "M" });
  return new NextResponse(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}