export const RAT_RACE_EVENT_URL = 'https://www.ratrace.com/events/scotland-coast-to-coast/';

export const RAT_RACE_2027 = {
  slug: 'rat-race-c2c-2027',
  title: 'Scotland Coast to Coast',
  organiser: 'Rat Race',
  eventDatesLabel: '11–12 September 2027',
  eventUrl: RAT_RACE_EVENT_URL,
  locationLabel: 'Rat Race Coast to Coast · Glengarry Shinty Club field',
  pitchFriday: '2027-09-10',
  checkinDate: '2027-09-11',
  checkoutDate: '2027-09-12',
  nights: 1 as const,
  guestNightLabel: 'Saturday 11 September 2027',
  opsLabel: 'We pitch Friday 10 September and pack up on Sunday 12 September',
  tile: '/events/rat-race-c2c-tile.webp',
  logo: '/events/ratrace-logo.svg',
  photos: {
    site: '/events/rat-race-site.jpg',
    header: '/events/rat-race-glencoe.jpg',
    deluxeFive: '/events/rat-race-deluxe-five.jpg',
    deluxeBeds: '/events/rat-race-deluxe-beds.jpg',
    deluxeBedsClose: '/events/rat-race-deluxe-beds-close.jpg',
    morrisons: '/events/rat-race-morrisons.jpg',
  },
  organiserCommissionRate: 0.1,
} as const;

export type RatRacePackage = 'cosy' | 'deluxe';

export const COSY_RATE_PER_GUEST = 50;
export const DELUXE_ADDON_PER_GUEST = 35;

export const RAT_RACE_PACKAGE_META: Record<
  RatRacePackage,
  {
    label: string;
    capacity6: number;
    capacity4: number;
    capacity: number;
    minGuests: number;
    guestStep: number;
    ratePerGuest: number;
    addonPerGuest: number;
    summary: string;
  }
> = {
  cosy: {
    label: 'Cosy',
    capacity6: 10,
    capacity4: 4,
    capacity: 10,
    minGuests: 2,
    guestStep: 1,
    ratePerGuest: COSY_RATE_PER_GUEST,
    addonPerGuest: 0,
    summary:
      'Memory-foam camping mattress, sleeping bag, pillow, night stand and one chair.',
  },
  deluxe: {
    label: 'Deluxe',
    capacity6: 5,
    capacity4: 2,
    capacity: 5,
    minGuests: 2,
    guestStep: 1,
    ratePerGuest: COSY_RATE_PER_GUEST + DELUXE_ADDON_PER_GUEST,
    addonPerGuest: DELUXE_ADDON_PER_GUEST,
    summary:
      `Cosy sleep kit on airframes, plus the kitchen camp: a double-burner hob, gas, kitchen table, seating, and cutlery and crockery for the number of guests on the booking. £${DELUXE_ADDON_PER_GUEST} on top of Cosy.`,
  },
};

export interface RatRaceVillagePack {
  tents6: number;
  tents4: number;
  tents: number;
  tentType: string;
  leftoverAfterSix: number;
  occupancy6: number[];
  occupancy4: number[];
}

function distributeOccupancy(tents: number, people: number, cap: number): number[] {
  if (tents <= 0) return [];
  const fills: number[] = [];
  let left = people;
  for (let i = 0; i < tents; i += 1) {
    const fill = Math.min(cap, Math.max(0, Math.ceil(left / (tents - i))));
    fills.push(fill);
    left -= fill;
  }
  return fills;
}

export function packRatRaceVillage(guests: number, packageKind: RatRacePackage): RatRaceVillagePack {
  const meta = RAT_RACE_PACKAGE_META[packageKind];
  const headcount = Math.max(1, Math.round(guests));
  let tents6 = Math.floor(headcount / meta.capacity6);
  const leftoverAfterSix = headcount % meta.capacity6;
  let tents4 = 0;
  if (packageKind === 'deluxe') {
    if (leftoverAfterSix === meta.capacity4) tents4 = 1;
    else if (leftoverAfterSix > 0) tents6 += 1;
  } else if (leftoverAfterSix > 0 && leftoverAfterSix <= meta.capacity4) {
    tents4 = 1;
  } else if (leftoverAfterSix > 0) {
    tents6 += 1;
  }
  if (tents6 + tents4 === 0) tents4 = 1;
  const occupancy4 = distributeOccupancy(tents4, Math.min(headcount, tents4 * meta.capacity4), meta.capacity4);
  const sixPeople = headcount - occupancy4.reduce((sum, n) => sum + n, 0);
  const occupancy6 = distributeOccupancy(tents6, sixPeople, meta.capacity6);
  const tents = tents6 + tents4;
  const bits = [
    tents6 ? `${tents6} × 6M` : '',
    tents4 ? `${tents4} × 4M` : '',
  ].filter(Boolean);
  return {
    tents6,
    tents4,
    tents,
    leftoverAfterSix,
    occupancy6,
    occupancy4,
    tentType: `${bits.join(' + ')} ${meta.label}`,
  };
}

export const SECURITY_PER_TENT = 200;

export function ratRaceSecurityCheckinNote(tents: number, amount: number): string {
  const mix =
    tents <= 1
      ? '£200 refundable deposit per tent'
      : `£200 refundable deposit per tent (£${amount.toFixed(2)} for this mix)`;
  return `${mix}. We take it on a card reader at Saturday check-in.`;
}

export function isRatRaceBooking(booking: { eventSlug?: string }): boolean {
  return booking.eventSlug === RAT_RACE_2027.slug;
}

const MAX_GUESTS = 40;

export interface RatRaceQuoteLine {
  title: string;
  price: number;
}

export interface RatRaceQuote {
  guests: number;
  requestedGuests: number;
  minGuests: number;
  packageKind: RatRacePackage;
  packageLabel: string;
  nights: 1;
  checkinDate: string;
  checkoutDate: string;
  pitchFriday: string;
  tents: number;
  tents6: number;
  tents4: number;
  capacityPerTent: number;
  capacity6: number;
  capacity4: number;
  ratePerGuest: number;
  addonPerGuest: number;
  tentType: string;
  lines: RatRaceQuoteLine[];
  addons: RatRaceQuoteLine[];
  beddingTier: string;
  beddingPrice: number;
  fulfillment: string;
  fulfillmentPrice: number;
  canvasPrice: number;
  discountRate: number;
  discountAmount: number;
  totalRentalPrice: number;
  organiserCommissionRate: number;
  organiserCommissionAmount: number;
  daysUntilCheckin: number;
  depositPercent: number;
  depositAmount: number;
  remainingBalance: number;
  balanceDueDate: string;
  securityDeposit: number;
  securityCheckinNote: string;
  totalDueToday: number;
  conciergeNote: string;
  payMonthly: RatRacePayMonthly;
  paymentPlan: 'deposit' | 'instalment';
}

export interface RatRacePayMonthly {
  available: boolean;
  reason?: string;
  upfrontMonths: number;
  monthlyCount: number;
  monthlyAmount: number;
  upfrontAmount: number;
  remainingAmount: number;
  totalDueToday: number;
  firstMonthlyDate: string;
  lastMonthlyDate: string;
}

const INSTALMENT_UPFRONT_MONTHS = 2;
const INSTALMENT_MONTHLY_COUNT = 10;

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function addCalendarMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function splitInstalments(total: number, monthlyCount: number, upfrontMonths: number) {
  const parts = monthlyCount + upfrontMonths;
  const pence = Math.round(total * 100);
  const monthlyPence = Math.floor(pence / parts);
  const monthlyAmount = roundMoney(monthlyPence / 100);
  const remainingAmount = roundMoney(monthlyAmount * monthlyCount);
  const upfrontAmount = roundMoney(total - remainingAmount);
  return { monthlyAmount, remainingAmount, upfrontAmount, monthlyCount, upfrontMonths };
}

export function buildPayMonthlyPlan(total: number, checkinDate: string): RatRacePayMonthly {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkin = new Date(`${checkinDate}T12:00:00`);
  const lastAllowed = new Date(checkin);
  lastAllowed.setDate(lastAllowed.getDate() - 14);
  const firstMonthly = addCalendarMonths(today, 1);
  const lastMonthly = addCalendarMonths(today, INSTALMENT_MONTHLY_COUNT);
  if (lastMonthly > lastAllowed) {
    return {
      available: false,
      reason: 'Monthly Pay Up needs about 10 months before the Saturday night. Pay the stay instead.',
      upfrontMonths: INSTALMENT_UPFRONT_MONTHS,
      monthlyCount: INSTALMENT_MONTHLY_COUNT,
      monthlyAmount: 0,
      upfrontAmount: 0,
      remainingAmount: 0,
      totalDueToday: 0,
      firstMonthlyDate: '',
      lastMonthlyDate: '',
    };
  }
  const split = splitInstalments(total, INSTALMENT_MONTHLY_COUNT, INSTALMENT_UPFRONT_MONTHS);
  return {
    available: true,
    upfrontMonths: split.upfrontMonths,
    monthlyCount: split.monthlyCount,
    monthlyAmount: split.monthlyAmount,
    upfrontAmount: split.upfrontAmount,
    remainingAmount: split.remainingAmount,
    totalDueToday: split.upfrontAmount,
    firstMonthlyDate: formatShortDate(firstMonthly),
    lastMonthlyDate: formatShortDate(lastMonthly),
  };
}

export function instalmentSubscriptionSchedule(now = new Date()) {
  const cancelAt = addCalendarMonths(now, INSTALMENT_MONTHLY_COUNT + 1);
  return {
    trialPeriodDays: 30,
    cancelAtUnix: Math.floor(cancelAt.getTime() / 1000),
  };
}

export function pricedForPaymentPlan(
  quote: RatRaceQuote,
  plan: 'deposit' | 'instalment',
): RatRaceQuote {
  if (plan !== 'instalment') return { ...quote, paymentPlan: 'deposit' };
  if (!quote.payMonthly.available) return { ...quote, paymentPlan: 'deposit' };
  const monthly = quote.payMonthly;
  return {
    ...quote,
    paymentPlan: 'instalment',
    depositPercent: Math.round((monthly.upfrontAmount / quote.totalRentalPrice) * 100) || 17,
    depositAmount: monthly.upfrontAmount,
    remainingBalance: monthly.remainingAmount,
    balanceDueDate: monthly.lastMonthlyDate,
    totalDueToday: monthly.totalDueToday,
  };
}

export function normaliseRatRacePackage(value: unknown): RatRacePackage {
  if (value === 'deluxe' || value === 'medium') return 'deluxe';
  return 'cosy';
}

export function isRatRacePackage(value: unknown): value is RatRacePackage {
  return value === 'cosy' || value === 'deluxe' || value === 'budget' || value === 'medium';
}

export function isValidDeluxeGuests(n: number): boolean {
  const guests = Math.round(n);
  if (guests < 2 || guests > MAX_GUESTS) return false;
  if (guests === 3) return false;
  if (guests % 5 === 1) return false;
  return true;
}

export function billedRatRaceGuests(requested: number, packageKind: RatRacePackage): number {
  const meta = RAT_RACE_PACKAGE_META[packageKind];
  let n = Math.min(MAX_GUESTS, Math.max(meta.minGuests, Math.round(Number(requested) || meta.minGuests)));
  if (packageKind === 'deluxe') {
    while (n <= MAX_GUESTS && !isValidDeluxeGuests(n)) n += 1;
    if (!isValidDeluxeGuests(n)) {
      while (n >= meta.minGuests && !isValidDeluxeGuests(n)) n -= 1;
    }
  }
  return n;
}

export function stepRatRaceGuests(current: number, delta: number, packageKind: RatRacePackage): number {
  const dir = delta >= 0 ? 1 : -1;
  let n = billedRatRaceGuests(current, packageKind) + dir;
  while (n >= 2 && n <= MAX_GUESTS) {
    if (packageKind !== 'deluxe' || isValidDeluxeGuests(n)) return n;
    n += dir;
  }
  return billedRatRaceGuests(current, packageKind);
}

export function quoteRatRace(input: { guests: number; packageKind: unknown }): RatRaceQuote {
  const packageKind = normaliseRatRacePackage(input.packageKind);
  const meta = RAT_RACE_PACKAGE_META[packageKind];
  const requestedGuests = Math.min(MAX_GUESTS, Math.max(1, Math.round(Number(input.guests) || 1)));
  const guests = billedRatRaceGuests(requestedGuests, packageKind);
  const pack = packRatRaceVillage(guests, packageKind);
  const nights = RAT_RACE_2027.nights;
  const cosySlice = roundMoney(guests * COSY_RATE_PER_GUEST * nights);
  const addonSlice = roundMoney(guests * meta.addonPerGuest * nights);
  const stayTotal = roundMoney(cosySlice + addonSlice);
  const organiserCommissionAmount = roundMoney(stayTotal * RAT_RACE_2027.organiserCommissionRate);

  const addons: RatRaceQuoteLine[] =
    packageKind === 'deluxe'
      ? [{ title: `${guests} × Deluxe add-on @ £${DELUXE_ADDON_PER_GUEST} (airframes + kitchen camp)`, price: addonSlice }]
      : [];

  const lines: RatRaceQuoteLine[] = [
    {
      title: `${guests} × Cosy · Saturday night @ £${COSY_RATE_PER_GUEST}`,
      price: cosySlice,
    },
    ...addons,
    {
      title: `Village mix included (${pack.tentType} · pitch Friday, pack up Sunday)`,
      price: 0,
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkin = new Date(`${RAT_RACE_2027.checkinDate}T12:00:00`);
  const daysUntilCheckin = Math.ceil((checkin.getTime() - today.getTime()) / 86400000);
  const withinWeek = daysUntilCheckin < 7;
  const depositPercent: 50 | 100 = withinWeek ? 100 : 50;
  const depositAmount = withinWeek ? stayTotal : roundMoney(stayTotal * 0.5);
  const remainingBalance = roundMoney(stayTotal - depositAmount);
  let balanceDueDate = '';
  if (remainingBalance > 0) {
    const due = new Date(checkin);
    due.setDate(due.getDate() - 7);
    balanceDueDate = due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const securityDeposit = SECURITY_PER_TENT * pack.tents;

  return {
    guests,
    requestedGuests,
    minGuests: meta.minGuests,
    packageKind,
    packageLabel: meta.label,
    nights,
    checkinDate: RAT_RACE_2027.checkinDate,
    checkoutDate: RAT_RACE_2027.checkoutDate,
    pitchFriday: RAT_RACE_2027.pitchFriday,
    tents: pack.tents,
    tents6: pack.tents6,
    tents4: pack.tents4,
    capacityPerTent: meta.capacity6,
    capacity6: meta.capacity6,
    capacity4: meta.capacity4,
    ratePerGuest: meta.ratePerGuest,
    addonPerGuest: meta.addonPerGuest,
    tentType: pack.tentType,
    lines,
    addons,
    beddingTier:
      packageKind === 'deluxe'
        ? 'Cosy sleep kit on airframes'
        : 'Memory-foam mattress, sleeping bag, pillow, night stand, chair',
    beddingPrice: 0,
    fulfillment: 'Village pitch Friday, Saturday night for guests, pack up Sunday',
    fulfillmentPrice: 0,
    canvasPrice: stayTotal,
    discountRate: 0,
    discountAmount: 0,
    totalRentalPrice: stayTotal,
    organiserCommissionRate: RAT_RACE_2027.organiserCommissionRate,
    organiserCommissionAmount,
    daysUntilCheckin,
    depositPercent,
    depositAmount,
    remainingBalance,
    balanceDueDate,
    securityDeposit,
    securityCheckinNote: ratRaceSecurityCheckinNote(pack.tents, securityDeposit),
    totalDueToday: depositAmount,
    conciergeNote:
      'Morrisons Fort William. Add it to the booking, we send order instructions, you send the list back, then a Stripe payment link. Basket plus 10%, with the 10% capped at £15. Not in the Rat Race fee.',
    payMonthly: buildPayMonthlyPlan(stayTotal, RAT_RACE_2027.checkinDate),
    paymentPlan: 'deposit' as const,
  };
}

export const CONCIERGE_FEE_RATE = 0.1;
export const CONCIERGE_FEE_CAP = 15;

export function conciergeFeeFromBasket(basketValue: number): number {
  const basket = Math.max(0, Number(basketValue) || 0);
  return roundMoney(Math.min(basket * CONCIERGE_FEE_RATE, CONCIERGE_FEE_CAP));
}

export function conciergeChargeFromBasket(basketValue: number): number {
  const basket = Math.max(0, Number(basketValue) || 0);
  return roundMoney(basket + conciergeFeeFromBasket(basket));
}
