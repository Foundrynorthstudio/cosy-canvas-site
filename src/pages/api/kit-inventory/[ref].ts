import type { APIRoute } from 'astro';
import { getBookingByRef } from '../../../lib/booking-store';
import { kitInventoryTokenValid } from '../../../lib/kit-inventory-link';
import { buildKitHandoverPdf } from '../../../lib/pack-list-pdf';

export const GET: APIRoute = async ({ params, url }) => {
  const ref = params.ref;
  const token = url.searchParams.get('t');
  if (!ref || !kitInventoryTokenValid(ref, token)) {
    return new Response('Not found', { status: 404 });
  }

  const booking = await getBookingByRef(ref);
  if (!booking) return new Response('Not found', { status: 404 });

  const bytes = await buildKitHandoverPdf(booking);
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="kit-list-${booking.bookingRef}.pdf"`,
      'Cache-Control': 'private, max-age=60',
    },
  });
};
