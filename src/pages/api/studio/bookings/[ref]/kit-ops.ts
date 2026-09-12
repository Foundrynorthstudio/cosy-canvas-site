import type { APIRoute } from 'astro';
import type { KitInspectionItem } from '../../../../../lib/booking';
import { getMailSettings } from '../../../../../lib/booking-mail-settings';
import { sendBookingMail } from '../../../../../lib/booking-mail-send';
import { updateBooking, getBookingByRef } from '../../../../../lib/booking-store';
import {
  allInboundDone,
  allOutboundDone,
  emptyInspectionItem,
  mergeKitInspection,
  missingFailEvidence,
  parseKitItemStatus,
  parsePicked,
} from '../../../../../lib/kit-ops';

export const POST: APIRoute = async ({ params, request, url }) => {
  const ref = params.ref;
  if (!ref) return new Response(JSON.stringify({ error: 'Missing ref' }), { status: 400 });

  const booking = await getBookingByRef(ref);
  if (!booking) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || 'save');
  const current = mergeKitInspection(booking);
  const incoming = Array.isArray(body.items) ? body.items : [];
  const bySku = new Map(current.items.map((item) => [item.sku, item]));

  for (const row of incoming) {
    const sku = String(row.sku || '');
    if (!sku) continue;
    const prev = bySku.get(sku) || emptyInspectionItem(sku);
    bySku.set(sku, {
      sku,
      picked: parsePicked(row.picked ?? prev.picked, row.outbound),
      inbound: parseKitItemStatus(row.inbound ?? prev.inbound),
      note: String(row.note ?? prev.note ?? ''),
      photoName: prev.photoName,
    });
  }

  const items: KitInspectionItem[] = current.items.map((item) => bySku.get(item.sku) || item);
  const now = new Date().toISOString();
  const who = String(body.checkedBy || '').trim();

  let outboundAt = current.outboundAt;
  let outboundBy = current.outboundBy;
  let inboundAt = current.inboundAt;
  let inboundBy = current.inboundBy;

  if (action === 'checkout') {
    if (!allOutboundDone(items)) {
      return new Response(
        JSON.stringify({ error: 'Tick every piece as picked from the container shelf before you check gear out.' }),
        { status: 400 },
      );
    }
    outboundAt = now;
    outboundBy = who || 'Yard';
  }
  if (action === 'checkin') {
    if (!allInboundDone(items)) {
      return new Response(
        JSON.stringify({ error: 'Every item must be tested (Pass or Fail / damaged) before the deposit can be completed.' }),
        { status: 400 },
      );
    }
    const gaps = missingFailEvidence(items);
    if (gaps.length) {
      return new Response(
        JSON.stringify({ error: `Fail / damaged needs a note and a photo. ${gaps[0]}` }),
        { status: 400 },
      );
    }
    inboundAt = now;
    inboundBy = who || 'Yard';
  }

  const updated = await updateBooking(ref, {
    kitOps: {
      outboundAt,
      outboundBy,
      inboundAt,
      inboundBy,
      depositRefundedAt: current.depositRefundedAt,
      items,
    },
  });

  let mail: { ok: boolean; mocked?: boolean; error?: string } | undefined;
  if (action === 'checkout' && updated) {
    const settings = await getMailSettings();
    if (settings.rules.kitHandover.enabled) {
      mail = await sendBookingMail({ booking: updated, type: 'kitHandover', origin: url.origin });
    }
  }

  return new Response(JSON.stringify({ booking: updated, mail }), { headers: { 'Content-Type': 'application/json' } });
};
