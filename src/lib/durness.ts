import type { BookingRecord } from './booking';

export const DURNESS_SITE_KEY = 'durness';

const MONTH_LABELS = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface DurnessSlot {
  key: string;
  year: number;
  month: number;
  label: string;
  min: string;
  max: string;
  available: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function parseYmd(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '').trim());
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function lastDayOfMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

export function isDurnessBooking(location: string, partnerSiteKey?: string): boolean {
  if (partnerSiteKey === DURNESS_SITE_KEY) return true;
  return /durness/i.test(location || '');
}

export function durnessMonthKey(checkinIso: string): string | null {
  const parts = parseYmd(checkinIso);
  if (!parts) return null;
  return `${parts.y}-${pad(parts.m)}`;
}

/** Check-in must fall in April–August, or 1–7 September. */
export function isDurnessSeasonCheckin(checkinIso: string): boolean {
  const parts = parseYmd(checkinIso);
  if (!parts) return false;
  if (parts.m >= 4 && parts.m <= 8) return true;
  return parts.m === 9 && parts.d <= 7;
}

export function durnessWindowForMonth(year: number, month: number): { min: string; max: string } {
  if (month === 9) return { min: ymd(year, 9, 1), max: ymd(year, 9, 7) };
  return { min: ymd(year, month, 1), max: ymd(year, month, lastDayOfMonth(year, month)) };
}

export function durnessSlotLabel(year: number, month: number): string {
  if (month === 9) return `September ${year} · first week`;
  return `${MONTH_LABELS[month]} ${year}`;
}

export function takenDurnessMonthKeys(bookings: BookingRecord[]): string[] {
  const taken = new Set<string>();
  for (const booking of bookings) {
    const refunded =
      (booking.amountRefunded || 0) > 0 &&
      booking.amountRefunded >= (booking.totalPaidToday || 0) - 0.01;
    if (refunded) continue;
    if (!isDurnessBooking(booking.campsiteLocation, booking.partnerSiteKey)) continue;
    const key = durnessMonthKey(booking.checkinDate);
    if (key) taken.add(key);
  }
  return [...taken];
}

export function upcomingDurnessSlots(takenKeys: string[], fromIso?: string): DurnessSlot[] {
  const taken = new Set(takenKeys);
  const today = parseYmd(fromIso || new Date().toISOString().slice(0, 10)) || {
    y: new Date().getFullYear(),
    m: new Date().getMonth() + 1,
    d: new Date().getDate(),
  };
  const todayStamp = today.y * 10000 + today.m * 100 + today.d;
  const slots: DurnessSlot[] = [];
  for (let year = today.y; year <= today.y + 1; year += 1) {
    for (const month of [4, 5, 6, 7, 8, 9]) {
      const window = durnessWindowForMonth(year, month);
      const max = parseYmd(window.max)!;
      const maxStamp = max.y * 10000 + max.m * 100 + max.d;
      if (maxStamp < todayStamp) continue;
      const minParts = parseYmd(window.min)!;
      const minStamp = minParts.y * 10000 + minParts.m * 100 + minParts.d;
      const min = minStamp < todayStamp ? ymd(today.y, today.m, today.d) : window.min;
      const liveMin = parseYmd(min)!;
      if (liveMin.y * 10000 + liveMin.m * 100 + liveMin.d > maxStamp) continue;
      const key = `${year}-${pad(month)}`;
      slots.push({
        key,
        year,
        month,
        label: durnessSlotLabel(year, month),
        min,
        max: window.max,
        available: !taken.has(key),
      });
    }
  }
  return slots;
}

export function durnessUnavailableMessage(checkinIso: string, takenKeys: string[]): string | null {
  if (!isDurnessSeasonCheckin(checkinIso)) {
    return 'Durness is April to the first week of September, one Cosy Holidays stay a month.';
  }
  const key = durnessMonthKey(checkinIso);
  if (key && takenKeys.includes(key)) {
    return 'That Durness month is already booked. Once it is gone, it is gone.';
  }
  return null;
}
