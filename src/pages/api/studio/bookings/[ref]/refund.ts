import type { APIRoute } from 'astro';
import { getBookingByRef, updateBooking } from '../../../../../lib/booking-store';
import { kitCharges } from '../../../../../lib/kit-ops';
import { getStripe } from '../../../../../lib/stripe-client';

export const POST: APIRoute = async ({ params, request }) => {
  const ref = params.ref;
  if (!ref) return new Response(JSON.stringify({ error: 'Missing ref' }), { status: 400 });

  const booking = await getBookingByRef(ref);
  if (!booking) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  const charges = kitCharges(booking);
  if (!charges.depositReady) {
    return new Response(
      JSON.stringify({
        error: charges.allTested
          ? 'Every Fail / damaged item needs a description and a photo before the deposit can be refunded.'
          : 'Every kit item must be tested (Pass or Fail / damaged) before the deposit can be processed.',
      }),
      { status: 400 },
    );
  }
  if (!booking.stripePaymentIntentId) {
    return new Response(JSON.stringify({ error: 'No Stripe payment on this booking yet.' }), { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (!amount || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Enter a refund amount in pounds.' }), { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return new Response(JSON.stringify({ error: 'Stripe is not configured.' }), { status: 400 });
  }

  try {
    await stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: Math.round(amount * 100),
      reason: 'requested_by_customer',
    });
    const updated = await updateBooking(ref, {
      amountRefunded: Number((booking.amountRefunded + amount).toFixed(2)),
    });
    return new Response(JSON.stringify({ booking: updated }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Refund failed' }), { status: 400 });
  }
};
