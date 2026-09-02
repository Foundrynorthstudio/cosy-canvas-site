import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { capturePaidBooking } from '../../lib/booking-capture';
import { getStripeSecretKey } from '../../lib/stripe-client';
import { readSecretEnv } from '../../lib/stripe-client';

export const POST: APIRoute = async ({ request, url }) => {
  const stripeSecretKey = getStripeSecretKey();
  const webhookSecret = readSecretEnv('STRIPE_WEBHOOK_SECRET');

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
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`[Webhook Signature Verification Failed]`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await capturePaidBooking(session, url.origin);
    } catch (error) {
      console.error('[Webhook] Failed to capture booking', error);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
