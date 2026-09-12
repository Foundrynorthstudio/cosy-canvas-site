import type { BookingRecord, KitInspection, KitInspectionItem, KitItemStatus } from './booking';
import { isDiyFulfillment } from './booking';
import { buildKitManifest, type KitLine } from './booking-kit';
import { formatKitMoney, kitPrice } from './kit-catalog';

export interface InspectableKitItem {
  sku: string;
  label: string;
  qty: string;
  groupTitle: string;
  test: string;
  cost: number;
  replacement: number;
}

function explodeLine(groupTitle: string, line: KitLine): InspectableKitItem[] {
  const price = kitPrice(line.sku);
  const count = Number(line.qty);
  const explode = Number.isInteger(count) && count > 1 && line.sku === 'mattress';
  if (!explode) {
    return [
      {
        sku: line.sku,
        label: line.label,
        qty: line.qty,
        groupTitle,
        test: line.test || price.test,
        cost: price.cost,
        replacement: price.replacement,
      },
    ];
  }
  return Array.from({ length: count }, (_, index) => ({
    sku: `${line.sku}-${index + 1}`,
    label: `${line.label} ${index + 1}`,
    qty: '1',
    groupTitle,
    test: line.test || price.test,
    cost: price.cost,
    replacement: price.replacement,
  }));
}

export function inspectableKit(booking: BookingRecord): InspectableKitItem[] {
  const manifest = buildKitManifest(booking);
  return manifest.groups.flatMap((group) => group.lines.flatMap((line) => explodeLine(group.title, line)));
}

export function parseKitItemStatus(value: unknown): KitItemStatus {
  const raw = String(value || '').toLowerCase();
  if (raw === 'pass' || raw === 'ok') return 'pass';
  if (raw === 'fail' || raw === 'damaged' || raw === 'missing') return 'fail';
  return 'test';
}

export function parsePicked(value: unknown, legacyOutbound?: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const raw = String(value ?? '').toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'picked' || raw === 'on' || raw === 'pass' || raw === 'ok') return true;
  if (legacyOutbound !== undefined && legacyOutbound !== null && String(legacyOutbound) !== '') {
    return parseKitItemStatus(legacyOutbound) === 'pass';
  }
  return false;
}

export function emptyInspectionItem(sku: string): KitInspectionItem {
  return { sku, picked: false, inbound: 'test', note: '' };
}

export function mergeKitInspection(booking: BookingRecord): KitInspection {
  const items = inspectableKit(booking);
  const previous = new Map((booking.kitOps?.items || []).map((item) => [item.sku, item]));
  return {
    outboundAt: booking.kitOps?.outboundAt,
    outboundBy: booking.kitOps?.outboundBy,
    inboundAt: booking.kitOps?.inboundAt,
    inboundBy: booking.kitOps?.inboundBy,
    depositRefundedAt: booking.kitOps?.depositRefundedAt,
    items: items.map((item) => {
      const prev = previous.get(item.sku);
      if (!prev) return emptyInspectionItem(item.sku);
      return {
        sku: item.sku,
        picked: parsePicked((prev as { picked?: unknown }).picked, (prev as { outbound?: unknown }).outbound),
        inbound: parseKitItemStatus(prev.inbound),
        note: prev.note || '',
        photoName: prev.photoName,
      };
    }),
  };
}

export function kitCharges(booking: BookingRecord): {
  lines: { sku: string; label: string; reason: 'fail'; amount: number }[];
  total: number;
  depositKeep: number;
  depositRefund: number;
  extraOwed: number;
  allTested: boolean;
  failEvidenceOk: boolean;
  depositReady: boolean;
} {
  const catalog = inspectableKit(booking);
  const inspection = mergeKitInspection(booking);
  const lines: { sku: string; label: string; reason: 'fail'; amount: number }[] = [];
  for (const item of catalog) {
    const row = inspection.items.find((entry) => entry.sku === item.sku);
    if (row?.inbound === 'fail') {
      lines.push({ sku: item.sku, label: item.label, reason: 'fail', amount: item.replacement });
    }
  }
  const total = Number(lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2));
  const deposit = booking.securityDeposit || 200;
  const depositKeep = Math.min(deposit, total);
  const depositRefund = Number((deposit - depositKeep).toFixed(2));
  const extraOwed = Number(Math.max(0, total - deposit).toFixed(2));
  const allTested = allInboundDone(inspection.items);
  const failEvidenceOk = failRowsHaveEvidence(inspection.items);
  return {
    lines,
    total,
    depositKeep,
    depositRefund,
    extraOwed,
    allTested,
    failEvidenceOk,
    depositReady: allTested && failEvidenceOk,
  };
}

export function failRowsHaveEvidence(items: KitInspectionItem[]): boolean {
  return items
    .filter((item) => item.inbound === 'fail')
    .every((item) => Boolean(item.note?.trim()) && Boolean(item.photoName));
}

export function missingFailEvidence(items: KitInspectionItem[]): string[] {
  const gaps: string[] = [];
  for (const item of items) {
    if (item.inbound !== 'fail') continue;
    if (!item.note?.trim()) gaps.push(`${item.sku}: add a description`);
    if (!item.photoName) gaps.push(`${item.sku}: upload a photo`);
  }
  return gaps;
}

export function allOutboundDone(items: KitInspectionItem[]): boolean {
  return items.every((item) => item.picked);
}

export function pickedCount(items: KitInspectionItem[]): { picked: number; total: number } {
  return { picked: items.filter((item) => item.picked).length, total: items.length };
}

export function allInboundDone(items: KitInspectionItem[]): boolean {
  return items.every((item) => item.inbound === 'pass' || item.inbound === 'fail');
}

export function isDeluxeFulfillment(fulfillment: string): boolean {
  return !isDiyFulfillment(fulfillment);
}

export function kitPhotoPath(ref: string, sku: string): string {
  return `/api/studio/bookings/${encodeURIComponent(ref)}/kit-photo/${encodeURIComponent(sku)}`;
}

export function groupedHandoverItems(booking: BookingRecord): { title: string; items: InspectableKitItem[] }[] {
  const groups: { title: string; items: InspectableKitItem[] }[] = [];
  for (const item of inspectableKit(booking)) {
    const last = groups[groups.length - 1];
    if (last && last.title === item.groupTitle) last.items.push(item);
    else groups.push({ title: item.groupTitle, items: [item] });
  }
  return groups;
}

export function kitHandoverHtml(booking: BookingRecord): string {
  const blocks = groupedHandoverItems(booking)
    .map((group) => {
      const rows = group.items
        .map(
          (item) => `<tr>
              <td style="padding:8px 0;border-bottom:1px solid #f0eee6;">${item.label}<div style="color:#78716c;font-size:11px;">${item.qty}</div></td>
              <td style="padding:8px 0;border-bottom:1px solid #f0eee6;text-align:right;white-space:nowrap;color:#7d6e23;">${formatKitMoney(item.replacement)}</td>
            </tr>`,
        )
        .join('');
      return `<h3 style="margin:20px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#7d6e23;">${group.title}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr><td style="padding:0 0 6px;font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:0.06em;">Item</td><td style="padding:0 0 6px;font-size:11px;color:#78716c;text-align:right;text-transform:uppercase;">If missing / damaged</td></tr>
          ${rows}
        </table>`;
    })
    .join('');
  const checked = booking.kitOps?.outboundAt
    ? `Checked out ${new Date(booking.kitOps.outboundAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}${booking.kitOps.outboundBy ? ` · ${booking.kitOps.outboundBy}` : ''}`
    : 'Ready for checkout';
  return `
    <div style="background:#111;color:#f7ba1e;border-radius:12px;padding:12px 16px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:16px 0;">
      Catalogued kit for ${booking.bookingRef} · ${checked}
    </div>
    ${blocks}
  `;
}
