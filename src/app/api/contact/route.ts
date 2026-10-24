import { NextRequest, NextResponse } from "next/server";
import { db, ensureSeeded } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactAckEmail, sendEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const subject = String(body.subject || "General").trim();
  const message = String(body.message || "").trim();

  if (!name || !email || message.length < 5) {
    return NextResponse.json({ error: "Please fill in your name, email and a message." }, { status: 400 });
  }

  await db.insert(contactMessages).values({ name, email, subject, message, status: "new" });

  await sendEmail({
    to: email,
    subject: "We received your message — Sinza Universal Company",
    html: contactAckEmail(name),
    kind: "contact-ack",
  });

  return NextResponse.json({ message: "Thank you — we will reply within two working days." });
}
