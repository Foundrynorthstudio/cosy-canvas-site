import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { isRatRacePackage, quoteRatRace, RAT_RACE_2027, type RatRaceNights } from '../../lib/rat-race';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const data = await request.json();
    const {
      guests,
      packageKind,
      nights,
      conciergeRequested,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      specialRequests,
    } = data;

    if (!customerName || !customerEmail || !customerPhone) {
      return new Response(
        JSON.stringify({ error: 'Name, email and phone are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const stayNights: RatRaceNights = Number(nights) === 3 ? 3 : 2;
    const kind = isRatRacePackage(packageKind) ? packageKind : 'budget';
    const quote = quoteRatRace({ guests: Number(guests) || 1, packageKind: kind, nights: stayNights });
    const bookingRef = `CC-RR-${Math.floor(100000 + Math.random() * 900000)}`;
    const concierge = Boolean(conciergeRequested);
    const requestNotes = [
      specialRequests?.trim() || '',
      concierge
        ? 'Morrisons Fort William concierge requested. Guest will send a shopping list; charge basket + 10% once ordered.'
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || String(stripeSecretKey).startsWith('sk_test_placeholder')) {
      return new Response(
        JSON.stringify({
          error: 'Stripe Secret Key is not configured yet in .env.',
          isPlaceholderKey: true,
          bookingSummary: quote,
          bookingRef,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${quote.tentType} · Rat Race C2C ${quote.nights} nights (${quote.checkinDate} to ${quote.checkoutDate}) · ${quote.depositPercent}% deposit`,
            description: `${quote.guests} guests. Total stay £${quote.totalRentalPrice.toFixed(2)}${
              quote.remainingBalance > 0
                ? ` (balance £${quote.remainingBalance.toFixed(2)} due by ${quote.balanceDueDate})`
                : ''
            }`,
          },
          unit_amount: Math.round(quote.depositAmount * 100),
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Refundable security deposit',
            description: `${quote.tents} tent${quote.tents === 1 ? '' : 's'} × £200. Released 48h after post-stay inspection.`,
          },
          unit_amount: Math.round(quote.securityDeposit * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items,
      return_url: `${url.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        bookingRef,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress: customerAddress || '',
        campsiteLocation: RAT_RACE_2027.locationLabel,
        specialRequests: requestNotes,
        checkinDate: quote.checkinDate,
        checkoutDate: quote.checkoutDate,
        nights: String(quote.nights),
        guests: String(quote.guests),
        tentType: quote.tentType,
        beddingTier: quote.beddingTier,
        beddingPrice: String(quote.beddingPrice),
        addonsList: JSON.stringify(quote.addons),
        fulfillment: quote.fulfillment,
        fulfillmentPrice: String(quote.fulfillmentPrice),
        totalRentalPrice: String(quote.totalRentalPrice.toFixed(2)),
        depositPercent: String(quote.depositPercent),
        depositAmount: String(quote.depositAmount.toFixed(2)),
        securityDeposit: String(quote.securityDeposit.toFixed(2)),
        totalPaidToday: String(quote.totalDueToday.toFixed(2)),
        remainingBalance: String(quote.remainingBalance.toFixed(2)),
        balanceDueDate: quote.balanceDueDate,
        type: 'deposit',
        eventSlug: RAT_RACE_2027.slug,
        conciergeRequested: concierge ? 'true' : 'false',
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: session.client_secret,
        bookingRef,
        depositAmount: quote.depositAmount,
        securityDeposit: quote.securityDeposit,
        totalDueToday: quote.totalDueToday,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[Rat Race Stripe Session]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create payment session.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
