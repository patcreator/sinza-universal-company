import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { subscribers } from "@/db/schema";
import { sendEmail, newsletterEmail } from "@/lib/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
  if (existing[0]) {
    return NextResponse.json({ message: "You are already subscribed — thank you!", subscriber: existing[0] });
  }

  const inserted = await db
    .insert(subscribers)
    .values({ email, name: name || null, status: "active", source: "site" })
    .returning();

  await sendEmail({
    to: email,
    subject: "Welcome to the Sinza Universal list",
    html: newsletterEmail(
      "Welcome to the list",
      `<p>Dear ${name || "friend"},</p>
       <p>You are now on the Sinza Universal Company list. Expect new music, tour dates and short devotionals from Kigali — a few times a week at most.</p>
       <p>In the meantime:</p>
       <ul>
         <li><a href="${process.env.SITE_URL || ""}/music">Stream the latest releases</a></li>
         <li><a href="${process.env.SITE_URL || ""}/concerts">See the concert schedule</a></li>
         <li><a href="https://www.youtube.com/@jadosinza14">Subscribe on YouTube</a></li>
       </ul>`,
    ),
    kind: "welcome",
  });

  return NextResponse.json({ message: "You are on the list. Check your inbox for a welcome note.", subscriber: inserted[0] });
}

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const email = Buffer.from(token, "base64url").toString("utf8");
  await db.update(subscribers).set({ status: "unsubscribed" }).where(eq(subscribers.email, email));
  return NextResponse.json({ message: "You have been unsubscribed." });
}
