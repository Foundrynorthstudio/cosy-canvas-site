import type { BookingRecord } from './booking';
import { sendBookingMail, runPaymentEmails } from './booking-mail-send';

export async function sendWelcomePack(booking: BookingRecord, origin = '') {
  return sendBookingMail({ booking, type: 'welcome', origin });
}

export async function sendDiySetupGuide(booking: BookingRecord, origin = '') {
  return sendBookingMail({ booking, type: 'diy', origin });
}

export async function sendBalanceReminder(booking: BookingRecord, origin = '') {
  return sendBookingMail({ booking, type: 'balance', origin });
}

export async function sendOnboardingEmails(booking: BookingRecord, origin: string) {
  return runPaymentEmails(booking, origin);
}
