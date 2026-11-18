/** 2027 early bird: book by end of this date (Europe/London calendar day, inclusive). */
export const EARLY_BIRD_BOOK_BY = '2026-12-31';
export const EARLY_BIRD_RATE = 0.15;

/** YYYY-MM-DD in Europe/London. */
export function londonDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** True while the booking calendar day in London is on or before 31 Dec 2026. */
export function isEarlyBirdBookingWindowOpen(now = new Date()): boolean {
  return londonDateKey(now) <= EARLY_BIRD_BOOK_BY;
}

/**
 * Floor discount for tent hire when the stay is in 2027 and the guest books
 * on or before 31 Dec 2026 (London). Does not apply to Rat Race (separate quote path).
 */
export function earlyBirdDiscountRate(checkinDate: string, now = new Date()): number {
  if (!String(checkinDate || '').startsWith('2027')) return 0;
  if (!isEarlyBirdBookingWindowOpen(now)) return 0;
  return EARLY_BIRD_RATE;
}
