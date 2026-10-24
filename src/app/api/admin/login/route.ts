import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSessionToken, sessionCookieName } from "@/lib/auth";
import { ensureSeeded } from "@/db";

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));
  const identifier = String(body.username || body.email || "").trim();
  const password = String(body.password || "");

  if (!identifier || !password) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const admin = await authenticate(identifier, password);
  if (!admin) {
    return NextResponse.json({ error: "Invalid credentials. Check your username and password." }, { status: 401 });
  }

  const token = createSessionToken(admin.id, admin.username);
  const res = NextResponse.json({
    ok: true,
    admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role },
  });
  res.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && (process.env.SITE_URL || "").startsWith("https"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
