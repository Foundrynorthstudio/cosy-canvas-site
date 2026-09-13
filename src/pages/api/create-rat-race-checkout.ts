import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import {
  instalmentSubscriptionSchedule,
  isRatRacePackage,
  pricedForPaymentPlan,
  quoteRatRace,
  RAT_RACE_2027,
  type RatRaceQuote,
} from '../../lib/rat-race';

function checkoutMetadata(
  quote: RatRaceQuote,
  extras: {
    bookingRef: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    requestNotes: string;
    concierge: boolean;
  },
): Record<string, string> {
  return {
    bookingRef: extras.bookingRef,
    customerName: extras.customerName,
    customerEmail: extras.customerEmail,
    customerPhone: extras.customerPhone,
    customerAddress: extras.customerAddress,
    campsiteLocation: RAT_RACE_2027.locationLabel,
    specialRequests: extras.requestNotes,
    checkinDate: quote.checkinDate,
    checkoutDate: quote.checkoutDate,
    nights: String(quote.nights),
    guests: String(quote.guests),
    tentType: quote.tentType,
    beddingTier: quote.beddingTier,
    beddingPrice: String(quote.beddingPrice),
    addonsList: JSON.stringify(quote.addons.filter((item) => item.price > 0)),
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
    paymentPlan: quote.paymentPlan,
    instalmentMonthly: String(quote.payMonthly.monthlyAmount.toFixed(2)),
    instalmentCount: String(quote.payMonthly.monthlyCount),
    eventSlug: RAT_RACE_2027.slug,
    conciergeRequested: extras.concierge ? 'true' : 'false',
    organiserCommissionRate: String(quote.organiserCommissionRate),
    organiserCommissionAmount: String(quote.organiserCommissionAmount),
  };
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const data = await request.json();
    const {
      guests,
      packageKind,
      conciergeRequested,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      specialRequests,
      paymentPlan: requestedPlan,
    } = data;

    if (!customerName || !customerEmail || !customerPhone) {
      return new Response(
        JSON.stringify({ error: 'Name, email and phone are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const kind = isRatRacePackage(packageKind) ? packageKind : 'deluxe';
    const plan = requestedPlan === 'instalment' ? 'instalment' : 'deposit';
    const quote = pricedForPaymentPlan(quoteRatRace({ guests: Number(guests) || 4, packageKind: kind }), plan);

    if (plan === 'instalment' && quote.paymentPlan !== 'instalment') {
      return new Response(
        JSON.stringify({
          error: quote.payMonthly.reason || 'Pay Up is not available for this stay. Pay the stay instead.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const bookingRef = `CC-RR-${Math.floor(100000 + Math.random() * 900000)}`;
    const concierge = Boolean(conciergeRequested);
    const requestNotes = [
      specialRequests?.trim() || '',
      concierge
        ? 'Morrisons Fort William concierge requested. Send order-build instructions after canvas payment. Guest sends the list back; Stripe link for basket + 10% (10% capped at £15). Not in the Rat Race fee.'
        : '',
      quote.paymentPlan === 'instalment'
        ? `Pay Up: 2 months (£${quote.depositAmount.toFixed(2)}) now, then ${quote.payMonthly.monthlyCount} × £${quote.payMonthly.monthlyAmount.toFixed(2)} on Stripe. Last charge ${quote.balanceDueDate}.`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const extras = {
      bookingRef,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress: customerAddress || '',
      requestNotes,
      concierge,
    };

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
    const metadata = checkoutMetadata(quote, extras);
    const schedule = instalmentSubscriptionSchedule();

    const session =
      quote.paymentPlan === 'instalment'
        ? await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: customerEmail,
            line_items: [
              {
                price_data: {
                  currency: 'gbp',
                  product_data: {
                    name: `${quote.tentType} · Pay Up monthly · Rat Race C2C`,
                    description: `${quote.payMonthly.monthlyCount} interest-free months after the 2-month deposit. Stay total £${quote.totalRentalPrice.toFixed(2)}.`,
                  },
                  unit_amount: Math.round(quote.payMonthly.monthlyAmount * 100),
                  recurring: { interval: 'month' },
                },
                quantity: 1,
              },
              {
                price_data: {
                  currency: 'gbp',
                  product_data: {
                    name: 'Pay Up deposit · two months of the stay',
                    description: `Interest-free split of Saturday night. Remaining ${quote.payMonthly.monthlyCount} months start after a 30-day trial so you are not charged a third month today.`,
                  },
                  unit_amount: Math.round(quote.depositAmount * 100),
                },
                quantity: 1,
              },
            ],
            subscription_data: {
              trial_period_days: schedule.trialPeriodDays,
              metadata,
            },
            return_url: `${url.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
            metadata,
          })
        : await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            payment_method_types: ['card'],
            customer_email: customerEmail,
            line_items: [
              {
                price_data: {
                  currency: 'gbp',
                  product_data: {
                    name: `${quote.tentType} · Rat Race C2C Saturday night (${quote.checkinDate}) · ${quote.depositPercent}% deposit`,
                    description: `${quote.guests} guests · Cosy £${quote.ratePerGuest - quote.addonPerGuest}${
                      quote.addonPerGuest ? ` + Deluxe add-on £${quote.addonPerGuest}` : ''
                    } · ${quote.tentType}. Total stay £${quote.totalRentalPrice.toFixed(2)}${
                      quote.remainingBalance > 0
                        ? ` (balance £${quote.remainingBalance.toFixed(2)} due by ${quote.balanceDueDate})`
                        : ''
                    }`,
                  },
                  unit_amount: Math.round(quote.depositAmount * 100),
                },
                quantity: 1,
              },
            ],
            return_url: `${url.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
            metadata,
          });

    return new Response(
      JSON.stringify({
        clientSecret: session.client_secret,
        bookingRef,
        depositAmount: quote.depositAmount,
        securityDeposit: quote.securityDeposit,
        totalDueToday: quote.totalDueToday,
        paymentPlan: quote.paymentPlan,
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
