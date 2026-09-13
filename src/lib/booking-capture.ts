import type Stripe from 'stripe';
import { bookingFromStripeSession } from './booking-from-stripe';
import { sendOnboardingEmails } from './booking-emails';
import { getBookingByRef, getBookingBySubscriptionId, upsertBooking } from './booking-store';

export async function capturePaidBooking(session: Stripe.Checkout.Session, origin = '') {
  const meta = session.metadata || {};

  if (meta.type === 'concierge' && meta.bookingRef) {
    const existing = await getBookingByRef(meta.bookingRef);
    if (!existing) return null;
    const paid = session.amount_total ? session.amount_total / 100 : 0;
    const stamp = new Date().toISOString().slice(0, 10);
    return upsertBooking({
      ...existing,
      internalNotes: [existing.internalNotes, `Morrisons concierge paid £${paid.toFixed(2)} on ${stamp}.`]
        .filter(Boolean)
        .join('\n'),
    });
  }

  if (meta.type === 'balance' && meta.bookingRef) {
    const existing = await getBookingByRef(meta.bookingRef);
    if (!existing) return null;
    const paid = session.amount_total ? session.amount_total / 100 : existing.remainingBalance;
    return upsertBooking({
      ...existing,
      remainingBalance: Math.max(0, Number((existing.remainingBalance - paid).toFixed(2))),
      totalPaidToday: Number((existing.totalPaidToday + paid).toFixed(2)),
    });
  }

  const existing = meta.bookingRef ? await getBookingByRef(meta.bookingRef) : undefined;
  const record = bookingFromStripeSession(session, existing);
  if (!record) return null;

  const saved = await upsertBooking(record);
  const emails = await sendOnboardingEmails(saved, origin);
  return upsertBooking({ ...saved, emails });
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | { id: string } }).subscription;
  if (typeof legacy === 'string') return legacy;
  if (legacy && typeof legacy === 'object' && 'id' in legacy) return legacy.id;
  const parent = (
    invoice as Stripe.Invoice & {
      parent?: { subscription_details?: { subscription?: string | { id: string } } };
    }
  ).parent?.subscription_details?.subscription;
  if (typeof parent === 'string') return parent;
  if (parent && typeof parent === 'object' && 'id' in parent) return parent.id;
  return undefined;
}

export async function captureSubscriptionInvoice(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') return null;
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return null;

  const existing = await getBookingBySubscriptionId(subscriptionId);
  if (!existing || existing.paymentPlan !== 'instalment') return null;
  if (existing.paidInvoiceIds?.includes(invoice.id)) return existing;

  const paid = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
  if (paid <= 0) return existing;

  return upsertBooking({
    ...existing,
    remainingBalance: Math.max(0, Number((existing.remainingBalance - paid).toFixed(2))),
    totalPaidToday: Number((existing.totalPaidToday + paid).toFixed(2)),
    paidInvoiceIds: [...(existing.paidInvoiceIds || []), invoice.id],
  });
}
