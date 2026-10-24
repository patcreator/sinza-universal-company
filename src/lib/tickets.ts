import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

export function newTicketCode(): string {
  const bytes = randomBytes(10);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `TKT-${s.slice(0, 5)}-${s.slice(5)}`;
}

export const TICKET_CODE_RE = /^TKT-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

export const appUrl = () => (process.env.APP_URL || "").replace(/\/$/, "");

function secret() {
  const s = process.env.TICKET_SECRET;
  if (!s || s.length < 16) throw new Error("TICKET_SECRET is missing or too short");
  return s;
}

/** Unguessable access token for an order page / PDF / status polling. */
export function orderToken(ref: string): string {
  return createHmac("sha256", secret()).update(`order:${ref}`).digest("hex").slice(0, 32);
}

export function verifyOrderToken(ref: string, token: string | null | undefined): boolean {
  if (!ref || !token) return false;
  const a = Buffer.from(orderToken(ref));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const orderPageUrl = (ref: string) =>
  `${appUrl()}/payment/${encodeURIComponent(ref)}/${orderToken(ref)}`;

export const orderPdfUrl = (ref: string) =>
  `${appUrl()}/api/tickets/pdf?ref=${encodeURIComponent(ref)}&t=${orderToken(ref)}`;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function ticketsEmailHtml(p: {
  name: string;
  event: string;
  date: string;
  venue: string;
  ref: string;
  total: string;
  tickets: { code: string; tier: string }[];
}) {
  const cards = p.tickets
    .map(
      (t) => `
      <tr><td style="padding:16px;border:1px solid #e5e5e5;border-radius:12px;text-align:center">
        <div style="font-weight:700;font-size:15px">${esc(t.tier)}</div>
        <img src="${appUrl()}/api/tickets/${encodeURIComponent(t.code)}/qr" width="200" height="200"
             alt="QR code ${esc(t.code)}" style="display:block;margin:12px auto" />
        <div style="font-family:monospace;font-size:18px;letter-spacing:1px">${esc(t.code)}</div>
      </td></tr><tr><td height="12"></td></tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h2 style="margin:0 0 8px">Payment confirmed. Your tickets are ready.</h2>
    <p>Hi ${esc(p.name)}, thank you for booking <strong>${esc(p.event)}</strong>.</p>
    <p style="color:#555;margin:0 0 16px">
      ${esc(p.date)}<br/>${esc(p.venue)}<br/>Booking reference: <strong>${esc(p.ref)}</strong> &middot; Total paid: ${esc(p.total)}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">${cards}</table>
    <p style="margin:20px 0">
      <a href="${orderPdfUrl(p.ref)}" style="background:#c1121f;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Download tickets (PDF)</a>
    </p>
    <p style="color:#555;font-size:13px">
      Show the QR code at the entrance. Each code can be scanned once, so do not share it publicly.
      You can always reopen your tickets here: <a href="${orderPageUrl(p.ref)}">${orderPageUrl(p.ref)}</a>
    </p>
  </div>`;
}