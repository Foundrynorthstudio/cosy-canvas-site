import type { APIRoute } from 'astro';
import { isMailType } from '../../../../../lib/booking-mail';
import { sendBookingMail } from '../../../../../lib/booking-mail-send';
import { getBookingByRef } from '../../../../../lib/booking-store';

export const POST: APIRoute = async ({ params, request, url }) => {
  const ref = params.ref;
  if (!ref) return new Response(JSON.stringify({ error: 'Missing ref' }), { status: 400 });
  const booking = await getBookingByRef(ref);
  if (!booking) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  const body = await request.json().catch(() => ({}));
  const type = String(body.type || '');
  if (!isMailType(type)) {
    return new Response(JSON.stringify({ error: 'Unknown email type' }), { status: 400 });
  }

  try {
    const result = await sendBookingMail({
      booking,
      type,
      origin: url.origin,
      subject: body.subject ? String(body.subject) : undefined,
      headline: body.headline ? String(body.headline) : undefined,
      body: body.body ? String(body.body) : undefined,
    });
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error || 'Email failed' }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true, mocked: result.mocked }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Email failed' }), { status: 500 });
  }
};
