import type Stripe from 'stripe';
import { bookingFromStripeSession } from './booking-from-stripe';
import { sendOnboardingEmails } from './booking-emails';
import { getBookingByRef, upsertBooking } from './booking-store';

export async function capturePaidBooking(session: Stripe.Checkout.Session, origin = '') {
  const meta = session.metadata || {};

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
