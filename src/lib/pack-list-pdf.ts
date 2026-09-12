import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import type { BookingRecord } from './booking';
import { buildKitManifest } from './booking-kit';
import { COMPANY } from './company';
import { formatKitMoney } from './kit-catalog';
import { groupedHandoverItems } from './kit-ops';

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 40;
const HEADER = 78;
const FOOTER = 48;
const GOLD = rgb(0.97, 0.73, 0.12);
const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.35, 0.32, 0.28);
const CREAM = rgb(0.98, 0.97, 0.93);
const BLACK = rgb(0.07, 0.07, 0.07);
const WHITE = rgb(1, 1, 1);

function pdfSafe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/×/g, 'x')
    .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, '');
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
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

async function loadLogo(pdf: PDFDocument): Promise<PDFImage> {
  const file = path.join(process.cwd(), 'public', 'TCCC Horizontal Logo.png');
  const bytes = await readFile(file);
  return pdf.embedPng(bytes);
}

interface BrandedPdf {
  pdf: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  logo: PDFImage;
  page: PDFPage;
  y: number;
  newPage: () => void;
  ensure: (needed: number) => void;
  draw: (text: string, size: number, options?: { bold?: boolean; color?: ReturnType<typeof rgb>; x?: number }) => void;
}

async function createBrandedPdf(): Promise<BrandedPdf> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(pdf);
  const state: BrandedPdf = {
    pdf,
    font,
    bold,
    logo,
    page: pdf.addPage([PAGE.width, PAGE.height]),
    y: PAGE.height - HEADER - 16,
    newPage: () => undefined,
    ensure: () => undefined,
    draw: () => undefined,
  };

  const paintChrome = () => {
    state.page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE.width,
      height: PAGE.height,
      color: CREAM,
    });
    state.page.drawRectangle({
      x: 0,
      y: PAGE.height - HEADER,
      width: PAGE.width,
      height: HEADER,
      color: BLACK,
    });
    const logoHeight = 42;
    const logoWidth = (logo.width / logo.height) * logoHeight;
    state.page.drawImage(logo, {
      x: MARGIN,
      y: PAGE.height - HEADER + (HEADER - logoHeight) / 2,
      width: logoWidth,
      height: logoHeight,
    });

    const rightX = MARGIN + logoWidth + 16;
    const lines = [
      { text: COMPANY.tradingName, size: 10, face: bold, color: GOLD },
      { text: `${COMPANY.phone}  ·  ${COMPANY.email}`, size: 8, face: font, color: WHITE },
      { text: `${COMPANY.websiteLabel}  ·  ${COMPANY.base}`, size: 8, face: font, color: rgb(0.75, 0.75, 0.72) },
      { text: `${COMPANY.hours}  ·  ${COMPANY.registered}`, size: 8, face: font, color: rgb(0.75, 0.75, 0.72) },
    ];
    let textY = PAGE.height - 22;
    for (const line of lines) {
      state.page.drawText(pdfSafe(line.text), {
        x: rightX,
        y: textY - line.size,
        size: line.size,
        font: line.face,
        color: line.color,
      });
      textY -= line.size + 3;
    }

    state.page.drawRectangle({
      x: 0,
      y: PAGE.height - HEADER - 3,
      width: PAGE.width,
      height: 3,
      color: GOLD,
    });

    state.page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE.width,
      height: FOOTER,
      color: BLACK,
    });
    state.page.drawRectangle({
      x: 0,
      y: FOOTER,
      width: PAGE.width,
      height: 3,
      color: GOLD,
    });
    const footer = `${COMPANY.legalName}  ·  ${COMPANY.phone}  ·  ${COMPANY.email}  ·  ${COMPANY.websiteLabel}`;
    state.page.drawText(pdfSafe(footer), {
      x: MARGIN,
      y: 22,
      size: 8,
      font,
      color: GOLD,
    });
    state.page.drawText(pdfSafe(`${COMPANY.base}  ·  ${COMPANY.hours}`), {
      x: MARGIN,
      y: 10,
      size: 7,
      font,
      color: WHITE,
    });
  };

  paintChrome();

  state.newPage = () => {
    state.page = pdf.addPage([PAGE.width, PAGE.height]);
    paintChrome();
    state.y = PAGE.height - HEADER - 16;
  };

  state.ensure = (needed: number) => {
    if (state.y - needed < FOOTER + 16) state.newPage();
  };

  state.draw = (text, size, options) => {
    const face = options?.bold ? bold : font;
    state.page.drawText(pdfSafe(text), {
      x: options?.x ?? MARGIN,
      y: state.y - size,
      size,
      font: face,
      color: options?.color ?? INK,
    });
    state.y -= size + 4;
  };

  return state;
}

export async function buildPackListPdf(booking: BookingRecord): Promise<Uint8Array> {
  const kit = buildKitManifest(booking);
  const doc = await createBrandedPdf();
  const { font, bold } = doc;

  doc.draw('LOAD SHEET / PACK LIST', 16, { bold: true });
  doc.draw(kit.loadVerb, 10, { color: MUTED });
  doc.y -= 6;

  const meta = [
    `Ref  ${booking.bookingRef}`,
    `Guest  ${booking.customerName}  ·  ${booking.guests} guests`,
    `Stay  ${booking.checkinDate}  to  ${booking.checkoutDate}  ·  ${booking.nights} nights`,
    `Pitch  ${booking.campsiteLocation}`,
    `Setup  ${booking.fulfillment}`,
  ];
  if (booking.logistics?.pitchDetail) meta.push(`Pitch detail  ${booking.logistics.pitchDetail}`);
  if (booking.logistics?.pitchW3w) meta.push(`What3Words  ${booking.logistics.pitchW3w}`);
  if (booking.logistics?.accessNotes) meta.push(`Access  ${booking.logistics.accessNotes}`);
  for (const line of meta) {
    for (const wrapped of wrapText(line, font, 10, PAGE.width - MARGIN * 2)) {
      doc.ensure(16);
      doc.draw(wrapped, 10);
    }
  }

  doc.y -= 8;
  doc.page.drawLine({
    start: { x: MARGIN, y: doc.y },
    end: { x: PAGE.width - MARGIN, y: doc.y },
    thickness: 1,
    color: GOLD,
  });
  doc.y -= 16;

  for (const group of kit.groups) {
    doc.ensure(36);
    doc.draw(group.title.toUpperCase(), 11, { bold: true, color: GOLD });
    for (const line of group.lines) {
      const label = `[ ]  ${line.label}${line.detail ? `  (${line.detail})` : ''}`;
      const qty = String(line.qty);
      const qtyWidth = bold.widthOfTextAtSize(qty, 10);
      const wrapped = wrapText(label, font, 10, PAGE.width - MARGIN * 2 - qtyWidth - 16);
      doc.ensure(wrapped.length * 14 + 4);
      const rowTop = doc.y;
      wrapped.forEach((part, index) => {
        doc.draw(part, 10);
        if (index === 0) {
          doc.page.drawText(pdfSafe(qty), {
            x: PAGE.width - MARGIN - qtyWidth,
            y: rowTop - 10,
            size: 10,
            font: bold,
            color: INK,
          });
        }
      });
    }
    doc.y -= 8;
  }

  if (booking.specialRequests) {
    doc.ensure(40);
    doc.draw('GUEST NOTES', 11, { bold: true, color: GOLD });
    for (const wrapped of wrapText(booking.specialRequests, font, 10, PAGE.width - MARGIN * 2)) {
      doc.ensure(16);
      doc.draw(wrapped, 10);
    }
  }

  doc.y -= 12;
  doc.ensure(28);
  doc.draw('Packed by ______________    Checked by ______________    Van ______________', 9, { color: MUTED });

  doc.pdf.setTitle(`Pack list ${booking.bookingRef}`);
  doc.pdf.setAuthor(COMPANY.tradingName);
  return doc.pdf.save();
}

export async function buildKitHandoverPdf(booking: BookingRecord): Promise<Uint8Array> {
  const groups = groupedHandoverItems(booking);
  const doc = await createBrandedPdf();
  const { font, bold } = doc;
  const replaceCol = 88;
  const qtyCol = 36;
  const labelWidth = PAGE.width - MARGIN * 2 - replaceCol - qtyCol - 12;

  const checked = booking.kitOps?.outboundAt
    ? `Checked out ${new Date(booking.kitOps.outboundAt).toLocaleString('en-GB')} · ${booking.kitOps.outboundBy || 'Yard'}`
    : 'Kit list';

  doc.draw('YOUR KIT LIST', 16, { bold: true });
  doc.draw('Catalogued for this stay', 10, { color: MUTED });
  doc.y -= 6;

  const meta = [
    `Ref  ${booking.bookingRef}`,
    `Guest  ${booking.customerName}`,
    `Stay  ${booking.checkinDate}  to  ${booking.checkoutDate}  ·  ${booking.nights} nights  ·  ${booking.guests} guests`,
    `Pitch  ${booking.campsiteLocation}`,
    `Setup  ${booking.fulfillment}`,
    checked,
  ];
  for (const line of meta) {
    for (const wrapped of wrapText(line, font, 10, PAGE.width - MARGIN * 2)) {
      doc.ensure(16);
      doc.draw(wrapped, 10);
    }
  }

  doc.y -= 6;
  doc.page.drawLine({
    start: { x: MARGIN, y: doc.y },
    end: { x: PAGE.width - MARGIN, y: doc.y },
    thickness: 1,
    color: GOLD,
  });
  doc.y -= 14;

  doc.ensure(36);
  doc.draw('Please look after this kit. Every piece is tracked so the next stay is as good as yours.', 9, { color: MUTED });
  doc.draw('Replacement is our cost plus 10% to cover logistics and admin of replacing the gear.', 9, { color: MUTED });
  doc.y -= 6;

  const drawTableHead = () => {
    doc.page.drawText('ITEM', { x: MARGIN, y: doc.y - 8, size: 8, font: bold, color: MUTED });
    doc.page.drawText('QTY', {
      x: PAGE.width - MARGIN - replaceCol - qtyCol,
      y: doc.y - 8,
      size: 8,
      font: bold,
      color: MUTED,
    });
    doc.page.drawText('REPLACEMENT', {
      x: PAGE.width - MARGIN - replaceCol,
      y: doc.y - 8,
      size: 8,
      font: bold,
      color: MUTED,
    });
    doc.y -= 16;
  };

  drawTableHead();

  for (const group of groups) {
    doc.ensure(36);
    if (doc.y < FOOTER + 48) {
      doc.newPage();
      drawTableHead();
    }
    doc.draw(group.title.toUpperCase(), 11, { bold: true, color: GOLD });
    for (const item of group.items) {
      const qty = String(item.qty);
      const replace = formatKitMoney(item.replacement);
      const wrapped = wrapText(item.label, font, 10, labelWidth);
      doc.ensure(wrapped.length * 14 + 6);
      const rowTop = doc.y;
      wrapped.forEach((part) => doc.draw(part, 10));
      doc.page.drawText(pdfSafe(qty), {
        x: PAGE.width - MARGIN - replaceCol - qtyCol,
        y: rowTop - 10,
        size: 10,
        font: bold,
        color: INK,
      });
      doc.page.drawText(pdfSafe(replace), {
        x: PAGE.width - MARGIN - replaceCol,
        y: rowTop - 10,
        size: 10,
        font: bold,
        color: GOLD,
      });
    }
    doc.y -= 8;
  }

  doc.pdf.setTitle(`Kit list ${booking.bookingRef}`);
  doc.pdf.setAuthor(COMPANY.tradingName);
  doc.pdf.setSubject(`${COMPANY.tradingName} kit list`);
  return doc.pdf.save();
}
