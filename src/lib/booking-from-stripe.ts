import type Stripe from 'stripe';
import type { BookingRecord } from './booking';

export function bookingFromStripeSession(
  session: Stripe.Checkout.Session,
  existing?: BookingRecord,
): BookingRecord | null {
  const meta = session.metadata;
  if (!meta?.bookingRef) return null;

  let addons: { title: string; price: number }[] = [];
  try {
    addons = JSON.parse(meta.addonsList || '[]');
  } catch {
    addons = existing?.addons ?? [];
  }

  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || existing?.stripePaymentIntentId || '';

  const now = new Date().toISOString();

  return {
    bookingRef: meta.bookingRef,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    customerName: meta.customerName || existing?.customerName || 'Valued Guest',
    customerEmail:
      meta.customerEmail ||
      session.customer_details?.email ||
      existing?.customerEmail ||
      '',
    customerPhone: meta.customerPhone || existing?.customerPhone || '',
    customerAddress: meta.customerAddress || existing?.customerAddress || '',
    campsiteLocation: meta.campsiteLocation || existing?.campsiteLocation || '',
    specialRequests: meta.specialRequests || existing?.specialRequests || '',
    internalNotes: existing?.internalNotes || '',
    checkinDate: meta.checkinDate || existing?.checkinDate || '',
    checkoutDate: meta.checkoutDate || existing?.checkoutDate || '',
    nights: Number(meta.nights) || existing?.nights || 2,
    guests: Number(meta.guests) || existing?.guests || 2,
    tentType: meta.tentType || existing?.tentType || 'Bell Tent',
    beddingTier: meta.beddingTier || existing?.beddingTier || '',
    beddingPrice: Number(meta.beddingPrice) || existing?.beddingPrice || 0,
    addons,
    fulfillment: meta.fulfillment || existing?.fulfillment || '',
    fulfillmentPrice: Number(meta.fulfillmentPrice) || existing?.fulfillmentPrice || 0,
    totalRentalPrice: Number(meta.totalRentalPrice) || existing?.totalRentalPrice || 0,
    depositPercent: Number(meta.depositPercent) || existing?.depositPercent || 100,
    depositAmount: Number(meta.depositAmount) || existing?.depositAmount || 0,
    securityDeposit: Number(meta.securityDeposit) || existing?.securityDeposit || 200,
    totalPaidToday: Number(meta.totalPaidToday) || (session.amount_total ? session.amount_total / 100 : existing?.totalPaidToday || 0),
    remainingBalance: Number(meta.remainingBalance) || existing?.remainingBalance || 0,
    balanceDueDate: meta.balanceDueDate || existing?.balanceDueDate || '',
    amountRefunded: existing?.amountRefunded || 0,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntent,
    stripeBalanceSessionId: existing?.stripeBalanceSessionId,
    stripeSubscriptionId:
      (typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id) || existing?.stripeSubscriptionId,
    paymentPlan: (meta.paymentPlan as BookingRecord['paymentPlan']) || existing?.paymentPlan || 'deposit',
    instalmentMonthly: Number(meta.instalmentMonthly) || existing?.instalmentMonthly,
    instalmentCount: Number(meta.instalmentCount) || existing?.instalmentCount,
    paidInvoiceIds: existing?.paidInvoiceIds,
    emails: existing?.emails || {},
    logistics: existing?.logistics,
    kitOps: existing?.kitOps,
    eventSlug: meta.eventSlug || existing?.eventSlug,
    conciergeRequested:
      meta.conciergeRequested === 'true' || existing?.conciergeRequested === true,
  };
}
