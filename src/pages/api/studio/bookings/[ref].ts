import type { APIRoute } from 'astro';
import type { BookingRecord } from '../../../../lib/booking';
import { updateBooking } from '../../../../lib/booking-store';

export const PUT: APIRoute = async ({ params, request }) => {
  const ref = params.ref;
  if (!ref) return new Response(JSON.stringify({ error: 'Missing ref' }), { status: 400 });

  const data = await request.json();
  const patch: Partial<BookingRecord> = {};

  const textKeys = [
    'customerName',
    'customerEmail',
    'customerPhone',
    'customerAddress',
    'campsiteLocation',
    'specialRequests',
    'internalNotes',
    'checkinDate',
    'checkoutDate',
    'tentType',
    'beddingTier',
    'fulfillment',
    'balanceDueDate',
  ] as const;
  for (const key of textKeys) {
    if (key in data) patch[key] = String(data[key] ?? '');
  }
  if ('nights' in data) patch.nights = Number(data.nights) || undefined;
  if ('guests' in data) patch.guests = Number(data.guests) || undefined;
  if ('remainingBalance' in data && Number.isFinite(Number(data.remainingBalance))) {
    patch.remainingBalance = Number(data.remainingBalance);
  }
  if (data.logistics) {
    patch.logistics = {
      pitchDetail: String(data.logistics.pitchDetail ?? ''),
      pitchW3w: String(data.logistics.pitchW3w ?? ''),
      accessNotes: String(data.logistics.accessNotes ?? ''),
    };
  }

  const booking = await updateBooking(ref, patch);
  if (!booking) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ booking }), { headers: { 'Content-Type': 'application/json' } });
};
