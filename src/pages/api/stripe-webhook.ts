import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import {
  capturePaidBooking,
  captureSubscriptionInvoice,
  ensurePayUpSubscriptionEnds,
} from '../../lib/booking-capture';
import { getStripeSecretKeyAsync } from '../../lib/stripe-client';
import { runtimeSecret } from '../../lib/cloud-kv';

export const POST: APIRoute = async ({ request, url }) => {
  const stripeSecretKey = await getStripeSecretKeyAsync();
  const webhookSecret = await runtimeSecret('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecretKey || stripeSecretKey.startsWith('sk_test_placeholder')) {
    return new Response(JSON.stringify({ error: 'Stripe keys not configured' }), { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();

    if (!webhookSecret || webhookSecret.startsWith('whsec_placeholder')) {
      console.error('[Webhook] STRIPE_WEBHOOK_SECRET missing or placeholder');
      return new Response('Webhook secret not configured', { status: 500 });
    }
    if (!sig) {
      return new Response('Missing stripe-signature', { status: 400 });
    }
    // Cloudflare Workers require the async SubtleCrypto path.
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Webhook Signature Verification Failed]`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await capturePaidBooking(session, url.origin);
      // Belt-and-braces: capture already sets cancel_at; retry if that path no-oped.
      await ensurePayUpSubscriptionEnds(session);
    } catch (error) {
      console.error('[Webhook] Failed to capture booking', error);
      return new Response(JSON.stringify({ error: 'capture failed' }), { status: 500 });
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    try {
      await captureSubscriptionInvoice(invoice);
    } catch (error) {
      console.error('[Webhook] Failed to capture instalment invoice', error);
      return new Response(JSON.stringify({ error: 'invoice capture failed' }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
