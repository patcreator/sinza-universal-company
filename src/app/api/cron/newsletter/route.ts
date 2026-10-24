import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db, ensureSeeded } from "@/db";
import { emailLogs, newsletters, newsletterSends, posts, settings, subscribers } from "@/db/schema";
import { sendEmail, newsletterEmail } from "@/lib/mail";
import { excerptFrom } from "@/lib/format";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Automatic newsletter sender.
 * Configure the days/hour in Admin → Settings → Newsletter schedule, then hit:
 *   GET /api/cron/newsletter?force=1   (Authorization: Bearer $CRON_SECRET)
 * Wire it to Vercel Cron in vercel.json for fully automatic sending.
 */
export async function GET(req: NextRequest) {
  await ensureSeeded();

  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const provided = req.nextUrl.searchParams.get("secret");
  if (secret && auth !== `Bearer ${secret}` && provided !== secret) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force") === "1";
  const scheduleRows = await db.select().from(settings).where(eq(settings.key, "newsletterSchedule")).limit(1);
  const schedule = (scheduleRows[0]?.value as any) ?? { enabled: true, days: [1, 3, 5], hour: 9, timezone: "Africa/Kigali" };

  const now = new Date();
  const today = now.getDay();
  const days: number[] = Array.isArray(schedule.days) ? schedule.days : [1, 3, 5];

  if (!force && !schedule.enabled) {
    return NextResponse.json({ skipped: true, reason: "Automatic sending is disabled." });
  }
  if (!force && !days.includes(today)) {
    return NextResponse.json({
      skipped: true,
      reason: `Today is ${DAY_NAMES[today]}. Scheduled days: ${days.map((d) => DAY_NAMES[d]).join(", ")}.`,
    });
  }

  const recipients = await db.select().from(subscribers).where(eq(subscribers.status, "active"));
  if (!recipients.length) return NextResponse.json({ skipped: true, reason: "No active subscribers." });

  // Use the newest draft, otherwise build a digest of the latest articles.
  const drafts = await db.select().from(newsletters).where(eq(newsletters.status, "draft")).orderBy(desc(newsletters.createdAt)).limit(1);
  let subject: string;
  let body: string;

  if (drafts[0]) {
    subject = drafts[0].subject;
    body = drafts[0].body;
  } else {
    const latest = await db.select().from(posts).where(eq(posts.published, true)).orderBy(desc(posts.publishedAt)).limit(3);
    subject = `This week at Sinza Universal — ${DAY_NAMES[today]}`;
    body = `<h2>The latest from Kigali</h2>${latest
      .map(
        (p) =>
          `<h3>${p.title}</h3><p>${p.excerpt ?? excerptFrom(p.content, 150)}</p><p><a href="${process.env.SITE_URL || ""}/news/${p.slug}">Read the article</a></p>`,
      )
      .join("<hr/>")}`;
  }

  let sent = 0;
  for (const person of recipients) {
    const unsubUrl = `${process.env.SITE_URL || ""}/api/newsletter?token=${Buffer.from(person.email).toString("base64url")}`;
    const result = await sendEmail({
      to: person.email,
      subject,
      html: body.split("{{UNSUBSCRIBE_URL}}").join(unsubUrl),
      kind: "newsletter",
    });
    if (result.status !== "failed") sent += 1;
    await db.insert(newsletterSends).values({
      newsletterId: drafts[0]?.id ?? null,
      subscriberId: person.id,
      email: person.email,
      status: result.status === "failed" ? "failed" : "sent",
    });
    await db.insert(emailLogs).values({
      to: person.email,
      subject,
      kind: "newsletter",
      status: result.status,
      providerId: result.providerId,
    });
  }

  if (drafts[0]) {
    await db
      .update(newsletters)
      .set({ status: "sent", sentAt: now, recipientsCount: sent })
      .where(eq(newsletters.id, drafts[0].id));
  }

  return NextResponse.json({
    ok: true,
    sent,
    scheduledDays: days.map((d) => DAY_NAMES[d]),
    hour: schedule.hour,
    timezone: schedule.timezone,
  });
}
