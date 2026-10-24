import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";

const COOKIE = "sinza_admin_session";
const SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "sinza-universal-dev-secret";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(adminId: number, username: string) {
  const payload = Buffer.from(
    JSON.stringify({ id: adminId, u: username, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string | null) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.exp || data.exp < Date.now()) return null;
    return data as { id: number; u: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE)?.value);
}

export async function getAdmin() {
  const session = await getSession();
  if (!session) return null;
  const rows = await db.select().from(admins).where(eq(admins.id, session.id)).limit(1);
  return rows[0] ?? null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error("UNAUTHORISED");
  return admin;
}

export async function authenticate(identifier: string, password: string) {
  const rows = await db
    .select()
    .from(admins)
    .where(and(eq(admins.username, identifier)))
    .limit(1);
  let admin = rows[0];
  if (!admin) {
    const byEmail = await db.select().from(admins).where(eq(admins.email, identifier)).limit(1);
    admin = byEmail[0];
  }
  if (!admin) return null;
  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return null;
  await db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, admin.id));
  return admin;
}

export const sessionCookieName = COOKIE;
export { sign as signValue };
