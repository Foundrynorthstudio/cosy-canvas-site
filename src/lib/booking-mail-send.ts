import type { BookingRecord } from './booking';
import { isDiyFulfillment } from './booking';
import { composeGuestMail, MAIL_META, MAIL_TYPES, type MailType, type MailTemplate } from './booking-mail';
import { getMailSettings } from './booking-mail-settings';
import { getAllBookings, updateBooking } from './booking-store';
import { sendAdminNewBookingAlert, sendHtmlEmail } from './email';
import { getStripe } from './stripe-client';

export async function createBalancePayUrl(booking: BookingRecord, origin: string): Promise<string> {
  const stripe = getStripe();
  if (!stripe || booking.remainingBalance <= 0) return '';
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: booking.customerEmail,
    success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: Math.round(booking.remainingBalance * 100),
          product_data: {
            name: `Remaining balance ${booking.bookingRef}`,
            description: `${booking.checkinDate} to ${booking.checkoutDate} · ${booking.campsiteLocation}`,
          },
        },
      },
    ],
    metadata: { type: 'balance', bookingRef: booking.bookingRef },
  });
  if (session.id) {
    await updateBooking(booking.bookingRef, { stripeBalanceSessionId: session.id });
  }
  return session.url || '';
}

export async function composeBookingMail(
  booking: BookingRecord,
  type: MailType,
  overrides?: Partial<MailTemplate>,
  extras: { payUrl?: string } = {},
) {
  const settings = await getMailSettings();
  const template: MailTemplate = {
    ...settings.templates[type],
    ...Object.fromEntries(Object.entries(overrides || {}).filter(([, value]) => value !== undefined)),
  };
  return composeGuestMail(booking, type, template, extras);
}

function withSentFlag(booking: BookingRecord, type: MailType): BookingRecord['emails'] {
  return {
    ...booking.emails,
    [MAIL_META[type].sentKey]: new Date().toISOString(),
  };
}

function alreadySent(booking: BookingRecord, type: MailType): boolean {
  return Boolean(booking.emails[MAIL_META[type].sentKey]);
}

function daysUntil(dateValue: string): number | null {
  const checkin = new Date(dateValue);
  if (Number.isNaN(checkin.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkin.setHours(0, 0, 0, 0);
  return Math.round((checkin.getTime() - today.getTime()) / 86400000);
}

export async function sendBookingMail(options: {
  booking: BookingRecord;
  type: MailType;
  origin?: string;
  subject?: string;
  body?: string;
  headline?: string;
}): Promise<{ ok: boolean; mocked?: boolean; error?: string }> {
  const { booking, type } = options;
  const payUrl = type === 'balance' && options.origin ? await createBalancePayUrl(booking, options.origin) : '';
  const composed = await composeBookingMail(
    booking,
    type,
    {
      subject: options.subject,
      body: options.body,
      headline: options.headline,
    },
    { payUrl },
  );

  const result = await sendHtmlEmail({
    to: composed.to,
    subject: composed.subject,
    html: composed.html,
  });
  if (!result.success) return { ok: false, error: result.error };

  const settings = await getMailSettings();
  if (type === 'confirmation' && settings.rules.confirmation.notifyAdmin) {
    await sendAdminNewBookingAlert(booking);
  }

  await updateBooking(booking.bookingRef, { emails: withSentFlag(booking, type) });
  return { ok: true, mocked: result.mocked };
}

export async function runPaymentEmails(booking: BookingRecord, origin: string): Promise<BookingRecord['emails']> {
  const settings = await getMailSettings();
  let current = booking;

  for (const type of MAIL_TYPES) {
    const rule = settings.rules[type];
    if (!rule.enabled || rule.trigger !== 'on_payment') continue;
    if (rule.onlyDiy && !isDiyFulfillment(current.fulfillment)) continue;
    if (rule.requireBalance && current.remainingBalance <= 0.01) continue;
    if (alreadySent(current, type)) continue;
    await sendBookingMail({ booking: current, type, origin });
    current = { ...current, emails: withSentFlag(current, type) };
  }

  return current.emails;
}

export async function runScheduledBookingEmails(origin: string): Promise<{ sent: number }> {
  const settings = await getMailSettings();
  const bookings = await getAllBookings();
  let sent = 0;

  for (const booking of bookings) {
    const days = daysUntil(booking.checkinDate);
    if (days === null) continue;

    for (const type of MAIL_TYPES) {
      const rule = settings.rules[type];
      if (!rule.enabled || rule.trigger !== 'days_before_checkin') continue;
      if (rule.onlyDiy && !isDiyFulfillment(booking.fulfillment)) continue;
      if (rule.requireBalance && booking.remainingBalance <= 0.01) continue;
      if (alreadySent(booking, type)) continue;
      if (days > rule.daysBefore || days < 1) continue;
      const result = await sendBookingMail({ booking, type, origin });
      if (result.ok) sent += 1;
    }
  }

  return { sent };
}

export async function sendDueBalanceReminders(origin: string): Promise<number> {
  const result = await runScheduledBookingEmails(origin);
  return result.sent;
}
