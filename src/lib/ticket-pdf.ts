import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export type PdfEvent = { title: string; date: string; venue: string; orderRef: string };
export type PdfTicket = { code: string; tierName: string; holderName: string };

// Standard PDF fonts only support Latin-1; strip anything else so drawText never throws.
const safe = (s: string) =>
  s.replace(/[\u2013\u2014]/g, "-").replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");

function wrap(text: string, font: PDFFont, size: number, max: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const w of safe(text).split(/\s+/)) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= max) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function buildTicketsPdf(event: PdfEvent, tickets: PdfTicket[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const mono = await pdf.embedFont(StandardFonts.CourierBold);

  for (const [index, t] of tickets.entries()) {
    const W = 420;
    const H = 620;
    const page = pdf.addPage([W, H]);

    const center = (text: string, y: number, font: PDFFont, size: number, color = rgb(0.1, 0.1, 0.1)) => {
      const s = safe(text);
      page.drawText(s, { x: (W - font.widthOfTextAtSize(s, size)) / 2, y, size, font, color });
    };

    // header band
    page.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: rgb(0.76, 0.07, 0.12) });
    center("ADMIT ONE", H - 50, bold, 22, rgb(1, 1, 1));

    // event
    let y = H - 118;
    for (const line of wrap(event.title, bold, 20, W - 60)) {
      center(line, y, bold, 20);
      y -= 26;
    }
    y -= 4;
    center(event.date, y, regular, 12, rgb(0.3, 0.3, 0.3));
    y -= 18;
    for (const line of wrap(event.venue, regular, 12, W - 60)) {
      center(line, y, regular, 12, rgb(0.3, 0.3, 0.3));
      y -= 16;
    }

    // tear line
    y -= 10;
    page.drawLine({
      start: { x: 30, y },
      end: { x: W - 30, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
      dashArray: [4, 4],
    });

    // QR
    const png = await QRCode.toBuffer(t.code, { width: 600, margin: 1, errorCorrectionLevel: "M" });
    const img = await pdf.embedPng(png);
    const qrSize = 220;
    const qrY = y - 20 - qrSize;
    page.drawImage(img, { x: (W - qrSize) / 2, y: qrY, width: qrSize, height: qrSize });

    // code + holder
    center(t.code, qrY - 28, mono, 18);
    center(t.tierName, qrY - 54, bold, 14);
    center(`Holder: ${t.holderName}`, qrY - 72, regular, 11, rgb(0.3, 0.3, 0.3));

    // footer
    center(`Order ${event.orderRef}  -  Ticket ${index + 1} of ${tickets.length}`, 52, regular, 9, rgb(0.5, 0.5, 0.5));
    center("Present this QR code at the entrance. Each code can be scanned only once.", 38, regular, 9, rgb(0.5, 0.5, 0.5));
  }

  return pdf.save();
}