import type { APIRoute } from 'astro';
import { updateBooking } from '../../../../lib/booking-store';

export const PUT: APIRoute = async ({ params, request }) => {
  const ref = params.ref;
  if (!ref) return new Response(JSON.stringify({ error: 'Missing ref' }), { status: 400 });

  const data = await request.json();
  const booking = await updateBooking(ref, {
    customerName: String(data.customerName ?? ''),
    customerEmail: String(data.customerEmail ?? ''),
    customerPhone: String(data.customerPhone ?? ''),
    customerAddress: String(data.customerAddress ?? ''),
    campsiteLocation: String(data.campsiteLocation ?? ''),
    specialRequests: String(data.specialRequests ?? ''),
    internalNotes: String(data.internalNotes ?? ''),
    checkinDate: String(data.checkinDate ?? ''),
    checkoutDate: String(data.checkoutDate ?? ''),
    nights: Number(data.nights) || undefined,
    guests: Number(data.guests) || undefined,
    tentType: String(data.tentType ?? ''),
    beddingTier: String(data.beddingTier ?? ''),
    fulfillment: String(data.fulfillment ?? ''),
    remainingBalance: Number.isFinite(Number(data.remainingBalance)) ? Number(data.remainingBalance) : undefined,
    balanceDueDate: String(data.balanceDueDate ?? ''),
  });

  if (!booking) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ booking }), { headers: { 'Content-Type': 'application/json' } });
};
