import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { sendBookingConfirmationEmails, type BookingDetails } from '../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || stripeSecretKey.startsWith('sk_test_placeholder')) {
    return new Response(JSON.stringify({ error: 'Stripe keys not configured' }), { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();

    if (webhookSecret && !webhookSecret.startsWith('whsec_placeholder') && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // In dev / testing without webhook secret
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`[Webhook Signature Verification Failed]`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata;

    if (meta && meta.bookingRef) {
      let parsedAddons: { title: string; price: number }[] = [];
      try {
        parsedAddons = JSON.parse(meta.addonsList || '[]');
      } catch (e) {
        parsedAddons = [];
      }

      const booking: BookingDetails = {
        bookingRef: meta.bookingRef,
        customerName: meta.customerName || 'Valued Guest',
        customerEmail: meta.customerEmail || session.customer_details?.email || '',
        customerPhone: meta.customerPhone || '',
        customerAddress: meta.customerAddress || '',
        campsiteLocation: meta.campsiteLocation || 'Scotland Campsite',
        specialRequests: meta.specialRequests || '',
        checkinDate: meta.checkinDate,
        checkoutDate: meta.checkoutDate,
        nights: Number(meta.nights) || 2,
        guests: Number(meta.guests) || 2,
        tentType: meta.tentType || 'Bell Tent',
        beddingTier: meta.beddingTier || 'Standard',
        beddingPrice: Number(meta.beddingPrice) || 0,
        addons: parsedAddons,
        fulfillment: meta.fulfillment || 'Standard',
        fulfillmentPrice: Number(meta.fulfillmentPrice) || 0,
        totalRentalPrice: Number(meta.totalRentalPrice) || 0,
        depositPercent: Number(meta.depositPercent) || 100,
        depositAmount: Number(meta.depositAmount) || 0,
        securityDeposit: Number(meta.securityDeposit) || 200,
        totalPaidToday: Number(meta.totalPaidToday) || (session.amount_total ? session.amount_total / 100 : 0),
        remainingBalance: Number(meta.remainingBalance) || 0,
        balanceDueDate: meta.balanceDueDate || '',
      };

      console.log(`[Stripe Webhook] Processing successful booking confirmation for ${booking.bookingRef}`);
      await sendBookingConfirmationEmails(booking);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
