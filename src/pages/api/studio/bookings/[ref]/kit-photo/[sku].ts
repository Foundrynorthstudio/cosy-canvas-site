import type { APIRoute } from 'astro';
import { getBookingByRef, updateBooking } from '../../../../../../lib/booking-store';
import { readKitPhoto, saveKitPhoto } from '../../../../../../lib/kit-photos';
import { mergeKitInspection } from '../../../../../../lib/kit-ops';

const MAX_BYTES = 4.5 * 1024 * 1024;

export const GET: APIRoute = async ({ params }) => {
  const ref = params.ref;
  const sku = params.sku ? decodeURIComponent(params.sku) : '';
  if (!ref || !sku) return new Response('Missing', { status: 400 });
  const photo = await readKitPhoto(ref, sku);
  if (!photo) return new Response('Not found', { status: 404 });
  return new Response(photo.bytes, {
    headers: {
      'Content-Type': photo.contentType,
      'Cache-Control': 'private, max-age=60',
    },
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  const ref = params.ref;
  const sku = params.sku ? decodeURIComponent(params.sku) : '';
  if (!ref || !sku) return new Response(JSON.stringify({ error: 'Missing ref' }), { status: 400 });

  const booking = await getBookingByRef(ref);
  if (!booking) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  const form = await request.formData();
  const file = form.get('photo');
  if (!(file instanceof File) || file.size < 20) {
    return new Response(JSON.stringify({ error: 'Choose a photo of the damaged or missing kit.' }), { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'Photo must be under 4.5MB.' }), { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const photoName = await saveKitPhoto(ref, sku, bytes, file.type || 'image/jpeg');
  const current = mergeKitInspection(booking);
  const items = current.items.map((item) => (item.sku === sku ? { ...item, photoName } : item));
  await updateBooking(ref, { kitOps: { ...current, items } });

  return new Response(JSON.stringify({ photoName, sku }), { headers: { 'Content-Type': 'application/json' } });
};
