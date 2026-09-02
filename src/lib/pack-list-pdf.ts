import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { BookingRecord } from './booking';
import { buildKitManifest } from './booking-kit';

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const GOLD = rgb(0.72, 0.62, 0.14);
const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.35, 0.32, 0.28);

function pdfSafe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/×/g, 'x')
    .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, '');
}

function wrapText(text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, maxWidth: number): string[] {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export async function buildPackListPdf(booking: BookingRecord): Promise<Uint8Array> {
  const kit = buildKitManifest(booking);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - MARGIN;

  const newPage = () => {
    page = pdf.addPage([PAGE.width, PAGE.height]);
    y = PAGE.height - MARGIN;
  };

  const ensure = (needed: number) => {
    if (y - needed < MARGIN) newPage();
  };

  const draw = (text: string, size: number, options?: { bold?: boolean; color?: ReturnType<typeof rgb>; x?: number }) => {
    const face = options?.bold ? bold : font;
    page.drawText(pdfSafe(text), {
      x: options?.x ?? MARGIN,
      y: y - size,
      size,
      font: face,
      color: options?.color ?? INK,
    });
    y -= size + 4;
  };

  draw('THE COSY CANVAS CO.', 9, { bold: true, color: GOLD });
  draw('LOAD SHEET / PACK LIST', 18, { bold: true });
  draw(kit.loadVerb, 11, { color: MUTED });
  y -= 8;

  const meta = [
    `Ref  ${booking.bookingRef}`,
    `Guest  ${booking.customerName}  ·  ${booking.guests} guests`,
    `Stay  ${booking.checkinDate}  to  ${booking.checkoutDate}  ·  ${booking.nights} nights`,
    `Pitch  ${booking.campsiteLocation}`,
    `Setup  ${booking.fulfillment}`,
  ];
  for (const line of meta) {
    for (const wrapped of wrapText(line, font, 10, PAGE.width - MARGIN * 2)) {
      ensure(16);
      draw(wrapped, 10);
    }
  }

  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE.width - MARGIN, y },
    thickness: 1,
    color: GOLD,
  });
  y -= 18;

  for (const group of kit.groups) {
    ensure(36);
    draw(group.title.toUpperCase(), 11, { bold: true, color: GOLD });
    for (const line of group.lines) {
      const label = `[ ]  ${line.label}${line.detail ? `  (${line.detail})` : ''}`;
      const qty = String(line.qty);
      const qtyWidth = bold.widthOfTextAtSize(qty, 10);
      const wrapped = wrapText(label, font, 10, PAGE.width - MARGIN * 2 - qtyWidth - 16);
      ensure(wrapped.length * 14 + 4);
      const rowTop = y;
      wrapped.forEach((part, index) => {
        draw(part, 10, { color: INK });
        if (index === 0) {
          page.drawText(pdfSafe(qty), {
            x: PAGE.width - MARGIN - qtyWidth,
            y: rowTop - 10,
            size: 10,
            font: bold,
            color: INK,
          });
        }
      });
    }
    y -= 8;
  }

  if (booking.specialRequests) {
    ensure(40);
    draw('GUEST NOTES', 11, { bold: true, color: GOLD });
    for (const wrapped of wrapText(booking.specialRequests, font, 10, PAGE.width - MARGIN * 2)) {
      ensure(16);
      draw(wrapped, 10);
    }
  }

  y -= 12;
  ensure(28);
  draw('Packed by ______________    Checked by ______________    Van ______________', 9, { color: MUTED });

  pdf.setTitle(`Pack list ${booking.bookingRef}`);
  pdf.setAuthor('The Cosy Canvas Co.');
  return pdf.save();
}
