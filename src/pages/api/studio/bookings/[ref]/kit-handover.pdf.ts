import type { APIRoute } from 'astro';
import { getBookingByRef } from '../../../../../lib/booking-store';
import { buildKitHandoverPdf } from '../../../../../lib/pack-list-pdf';

export const GET: APIRoute = async ({ params }) => {
  const ref = params.ref;
  if (!ref) return new Response('Missing booking ref', { status: 400 });
  const booking = await getBookingByRef(ref);
  if (!booking) return new Response('Not found', { status: 404 });

  const bytes = await buildKitHandoverPdf(booking);
  const filename = `kit-inventory-${booking.bookingRef}.pdf`;
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};
