import type { APIRoute } from 'astro';
import { getBookingByRef, updateBooking } from '../../../../../lib/booking-store';
import { conciergeChargeFromBasket, conciergeFeeFromBasket } from '../../../../../lib/rat-race';
import { sendHtmlEmail } from '../../../../../lib/email';
import { getStripe } from '../../../../../lib/stripe-client';

export const POST: APIRoute = async ({ params, request, url }) => {
  const ref = params.ref;
  if (!ref) return new Response(JSON.stringify({ error: 'Missing ref' }), { status: 400 });

  const booking = await getBookingByRef(ref);
  if (!booking) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  const body = await request.json().catch(() => ({}));
  const basket = Number(body.basketValue);
  if (!basket || basket <= 0) {
    return new Response(JSON.stringify({ error: 'Enter the Morrisons basket total in pounds.' }), { status: 400 });
  }

  const charge = conciergeChargeFromBasket(basket);
  const fee = conciergeFeeFromBasket(basket);
  const stripe = getStripe();
  if (!stripe) {
    return new Response(JSON.stringify({ error: 'Stripe is not configured.' }), { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    allow_promotion_codes: true,
    customer_email: booking.customerEmail,
    success_url: `${url.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url.origin}/events/rat-race`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: Math.round(charge * 100),
          product_data: {
            name: `Morrisons Fort William concierge ${booking.bookingRef}`,
            description: `Basket £${basket.toFixed(2)} + £${fee.toFixed(2)} concierge (10%, capped at £15).`,
          },
        },
      },
    ],
    metadata: {
      type: 'concierge',
      bookingRef: booking.bookingRef,
      basketValue: String(basket.toFixed(2)),
      conciergeCharge: String(charge.toFixed(2)),
    },
  });

  const payUrl = session.url || '';
  if (payUrl) {
    await sendHtmlEmail({
      to: booking.customerEmail,
      subject: `Morrisons shop payment · ${booking.bookingRef}`,
      html: `<p>Hi ${booking.customerName.split(' ')[0] || 'there'},</p>
<p>Your Fort William Morrisons click-and-collect shop is ready to pay.</p>
<p>Basket £${basket.toFixed(2)} + £${fee.toFixed(2)} concierge (10%, capped at £15) = <strong>£${charge.toFixed(2)}</strong>.</p>
<p><a href="${payUrl}">Pay the shopping link</a></p>
<p>The Cosy Canvas Co.</p>`,
    });
    await updateBooking(ref, {
      internalNotes: [
        booking.internalNotes,
        `Concierge payment link sent for basket £${basket.toFixed(2)} (charge £${charge.toFixed(2)}).`,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  return new Response(JSON.stringify({ payUrl, charge, basket }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
