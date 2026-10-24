import { db } from "@/db";
import { emailLogs } from "@/db/schema";

const RESEND_URL = "https://api.resend.com/emails";

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  kind?: string;
  from?: string;
}) {
  const to = Array.isArray(opts.to) ? opts.to : [opts.to];
  const key = process.env.RESEND_API_KEY;
  const from =
    opts.from ||
    process.env.EMAIL_FROM ||
    "Sinza Universal Company <onboarding@resend.dev>";

  let status = "skipped";
  let providerId: string | undefined;

  if (key) {
    try {
      const res = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject: opts.subject, html: opts.html }),
      });
      const json = (await res.json().catch(() => ({}))) as { id?: string };
      status = res.ok ? "sent" : "failed";
      providerId = json?.id;
    } catch (error) {
      status = "failed";
      console.error("[resend]", (error as Error).message);
    }
  } else {
    console.info(`[mail:demo] to=${to.join(",")} subject="${opts.subject}"`);
  }

  try {
    await db.insert(emailLogs).values({
      to: to.join(","),
      subject: opts.subject,
      kind: opts.kind ?? "transactional",
      status,
      providerId,
    });
  } catch {
    /* logging is best effort */
  }

  return { status, providerId };
}

const shell = (title: string, body: string) => `
<div style="background:#F3EDE7;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E4DAD1;">
    <div style="background:#14100F;padding:22px 28px;">
      <div style="color:#F3EDE7;font-size:13px;letter-spacing:.22em;text-transform:uppercase;">Sinza Universal Company</div>
    </div>
    <div style="padding:28px;color:#14100F;line-height:1.65;font-size:15px;">
      <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 14px;color:#C1121F;">${title}</h1>
      ${body}
    </div>
    <div style="padding:18px 28px;background:#F7DEDD;color:#7C716B;font-size:12px;">
      Sinza Universal Company · KG 7 Ave, Kigali, Rwanda · <a href="mailto:hello@sinzauniversal.com">hello@sinzauniversal.com</a><br/>
      <a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> from these emails at any time.
    </div>
  </div>
</div>`;

export const ticketEmail = (data: {
  name: string;
  ref: string;
  event: string;
  date: string;
  venue: string;
  items: string;
  total: string;
}) =>
  shell(
    "Your tickets are confirmed",
    `<p>Dear ${data.name},</p>
     <p>Thank you for booking with Sinza Universal Company. Your booking reference is <strong style="color:#C1121F">${data.ref}</strong> — show it at the entrance (on paper or on your phone).</p>
     <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;">
       <tr><td style="padding:8px 0;border-bottom:1px solid #E4DAD1;color:#7C716B;">Event</td><td style="padding:8px 0;border-bottom:1px solid #E4DAD1;text-align:right;"><strong>${data.event}</strong></td></tr>
       <tr><td style="padding:8px 0;border-bottom:1px solid #E4DAD1;color:#7C716B;">Date</td><td style="padding:8px 0;border-bottom:1px solid #E4DAD1;text-align:right;">${data.date}</td></tr>
       <tr><td style="padding:8px 0;border-bottom:1px solid #E4DAD1;color:#7C716B;">Venue</td><td style="padding:8px 0;border-bottom:1px solid #E4DAD1;text-align:right;">${data.venue}</td></tr>
       <tr><td style="padding:8px 0;border-bottom:1px solid #E4DAD1;color:#7C716B;">Tickets</td><td style="padding:8px 0;border-bottom:1px solid #E4DAD1;text-align:right;">${data.items}</td></tr>
       <tr><td style="padding:8px 0;color:#7C716B;">Total paid</td><td style="padding:8px 0;text-align:right;"><strong>${data.total}</strong></td></tr>
     </table>
     <p>Doors open 90 minutes before the show. Worship starts on time — come early, come ready.</p>
     <p style="margin-top:22px"><a href="${process.env.SITE_URL || ""}/concerts" style="background:#C1121F;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;">See the full schedule</a></p>`,
  );

export const orderEmail = (data: {
  name: string;
  ref: string;
  items: string;
  total: string;
  address?: string;
}) =>
  shell(
    "We received your order",
    `<p>Dear ${data.name},</p>
     <p>Your order <strong style="color:#C1121F">${data.ref}</strong> is being prepared with care.</p>
     <p>${data.items}</p>
     <p><strong>Total: ${data.total}</strong></p>
     ${data.address ? `<p>Shipping to: ${data.address}</p>` : ""}
     <p>Dispatch takes 3 working days inside Rwanda and 7–14 days internationally.</p>`,
  );

export const newsletterEmail = (subject: string, body: string) =>
  shell(subject, body);

export const contactAckEmail = (name: string) =>
  shell(
    "We got your message",
    `<p>Dear ${name},</p><p>Thank you for writing to Sinza Universal Company. Our team reads every message and will reply within two working days.</p><p>In the meantime, follow the ministry on <a href="https://www.youtube.com/@jadosinza14">YouTube</a> and <a href="https://www.instagram.com/jadosinza/?hl=en">Instagram</a>.</p>`,
  );
