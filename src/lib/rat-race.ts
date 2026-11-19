import type { BookingRecord } from './booking';
import { deriveBookingStatus } from './booking';

export const RAT_RACE_EVENT_URL = 'https://www.ratrace.com/events/scotland-coast-to-coast/';

/** Flip to true once Rat Race organisers (Dave) approve paid canvas bookings. */
export const RAT_RACE_PAYMENTS_ENABLED = true;

export const RAT_RACE_PAYMENTS_PAUSED_MESSAGE =
  'Paid Rat Race bookings are paused until we have organiser approval. You can still preview packages and pricing on this page.';

export const RAT_RACE_CAMPING_PASS_NOTE =
  'All participants need to buy a camping pass via the Rat Race website. Your tent booking with us does not include the camping pass.';

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

export const RAT_RACE_TENT_CAP = 20;
export const RAT_RACE_GROUP_CAP = 3;
export const SECURITY_PER_TENT = 200;

export type RatRaceTentKind = 'bell' | 'group';

export interface RatRaceTentLineInput {
  kind: RatRaceTentKind;
  guests: number;
}

const SHARED_BEDDING =
  'Raised bed, sleeping bag, pillow and camping chair per guest';

export const RAT_RACE_TENT_META: Record<
  RatRaceTentKind,
  {
    label: string;
    sizeLabel: string;
    sizeMetres: 5 | 6;
    minGuests: number;
    maxGuests: number;
    basePrice: number;
    baseGuests: number;
    extraGuestPrice: number;
    limited?: boolean;
    summary: string;
    /** Short price line for packages / booking radios — includes what’s covered vs capacity. */
    priceBlurb: string;
    beddingTier: string;
  }
> = {
  bell: {
    label: 'Bell tent',
    sizeLabel: '5M',
    sizeMetres: 5,
    minGuests: 1,
    maxGuests: 4,
    basePrice: 295,
    baseGuests: 2,
    extraGuestPrice: 50,
    summary: 'A raised bed, sleeping bag, pillow and camping chair for every guest. Pitched and ready when you arrive.',
    priceBlurb: '£295 for up to 2 guests. Extra guests £50 each, sleeps up to 4.',
    beddingTier: SHARED_BEDDING,
  },
  group: {
    label: 'Group tent',
    sizeLabel: '6M',
    sizeMetres: 6,
    minGuests: 4,
    maxGuests: 6,
    basePrice: 495,
    baseGuests: 6,
    extraGuestPrice: 0,
    limited: true,
    summary: 'Same set-up as the 5M, with room for the whole crew. Only three on the field.',
    priceBlurb: '£495 flat for 4 to 6 guests.',
    beddingTier: SHARED_BEDDING,
  },
};

export const RAT_RACE_BELL_GUEST_LIMIT_MESSAGE =
  'Up to 4 per 5M tent. Choose a Group tent for 4 to 6, or add another tent.';

export function isRatRaceTentKind(value: unknown): value is RatRaceTentKind {
  return value === 'bell' || value === 'group';
}

/** Accepts current kinds plus legacy package aliases. */
export function isRatRacePackage(value: unknown): boolean {
  return (
    isRatRaceTentKind(value) ||
    value === 'cosy' ||
    value === 'deluxe' ||
    value === 'budget' ||
    value === 'medium'
  );
}

export function normaliseRatRaceTentKind(value: unknown): RatRaceTentKind {
  if (value === 'group') return 'group';
  // Legacy Cosy / Deluxe / package aliases all map to the 5M Bell tent.
  return 'bell';
}

export function clampTentGuests(kind: RatRaceTentKind, guests: number): number {
  const meta = RAT_RACE_TENT_META[kind];
  const n = Math.round(Number(guests) || meta.minGuests);
  return Math.min(meta.maxGuests, Math.max(meta.minGuests, n));
}

export function priceRatRaceTentLine(kind: RatRaceTentKind, guestsInput: number): {
  kind: RatRaceTentKind;
  guests: number;
  price: number;
  title: string;
  sizeLabel: string;
} {
  const meta = RAT_RACE_TENT_META[kind];
  const guests = clampTentGuests(kind, guestsInput);
  const extras = Math.max(0, guests - meta.baseGuests);
  const price = roundMoney(meta.basePrice + extras * meta.extraGuestPrice);
  const sizeBit = `${meta.sizeLabel} ${meta.label}`;
  const title = `${sizeBit} · ${guests} guest${guests === 1 ? '' : 's'} · £${price.toFixed(2)}`;
  return { kind, guests, price, title, sizeLabel: meta.sizeLabel };
}

export function parseRatRaceTentLines(raw: unknown): RatRaceTentLineInput[] {
  if (!Array.isArray(raw)) return [];
  const lines: RatRaceTentLineInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const kind = normaliseRatRaceTentKind((item as { kind?: unknown }).kind);
    const guests = clampTentGuests(kind, Number((item as { guests?: unknown }).guests));
    lines.push({ kind, guests });
  }
  return lines;
}

export function tentMixLabel(lines: { kind: RatRaceTentKind; guests: number }[]): string {
  const counts: Record<RatRaceTentKind, number> = { bell: 0, group: 0 };
  for (const line of lines) counts[line.kind] += 1;
  const bits = (Object.keys(counts) as RatRaceTentKind[])
    .filter((kind) => counts[kind] > 0)
    .map((kind) => {
      const meta = RAT_RACE_TENT_META[kind];
      return `${counts[kind]} × ${meta.sizeLabel} ${meta.label}`;
    });
  return bits.join(' + ') || 'No tents';
}

export function countTentKinds(lines: RatRaceTentLineInput[]): {
  tents: number;
  tents5: number;
  tents6: number;
  groupTents: number;
} {
  let tents5 = 0;
  let tents6 = 0;
  let groupTents = 0;
  for (const line of lines) {
    if (line.kind === 'group') {
      tents6 += 1;
      groupTents += 1;
    } else {
      tents5 += 1;
    }
  }
  return { tents: lines.length, tents5, tents6, groupTents };
}

/** Parse tent counts from stored tentType strings. */
export function parseRatRaceTentTypeCounts(tentType: string): {
  tents: number;
  tents5: number;
  tents6: number;
  groupTents: number;
} {
  const multi = [
    ...String(tentType).matchAll(/(\d+)\s*[×x]\s*(\d)\s*M\s*(Bell[^·+]*|Cosy|Deluxe|Group[^·+]*)?/gi),
  ];
  if (multi.length) {
    let tents5 = 0;
    let tents6 = 0;
    let groupTents = 0;
    for (const match of multi) {
      const qty = Number(match[1]) || 0;
      const size = match[2];
      const label = (match[3] || '').toLowerCase();
      if (size === '6' || label.includes('group')) {
        tents6 += qty;
        groupTents += qty;
      } else {
        tents5 += qty;
      }
    }
    return { tents: tents5 + tents6, tents5, tents6, groupTents };
  }
  const single = String(tentType).match(/(\d)\s*M/i);
  if (single) {
    const size = single[1];
    if (size === '6' || /group/i.test(tentType)) {
      return { tents: 1, tents5: 0, tents6: 1, groupTents: 1 };
    }
    return { tents: 1, tents5: 1, tents6: 0, groupTents: 0 };
  }
  return { tents: 0, tents5: 0, tents6: 0, groupTents: 0 };
}

export function isActiveRatRaceBooking(booking: BookingRecord): boolean {
  if (!isRatRaceBooking(booking)) return false;
  const status = deriveBookingStatus(booking);
  return status !== 'cancelled' && status !== 'refunded';
}

export function ratRaceInventoryFromBookings(bookings: BookingRecord[]): {
  bookedTents: number;
  bookedGroup: number;
  remainingTents: number;
  remainingGroup: number;
  soldOut: boolean;
  bellSoldOut: boolean;
  groupSoldOut: boolean;
} {
  let bookedTents = 0;
  let bookedGroup = 0;
  for (const booking of bookings) {
    if (!isActiveRatRaceBooking(booking)) continue;
    const counts = parseRatRaceTentTypeCounts(booking.tentType);
    bookedTents += counts.tents;
    bookedGroup += counts.groupTents;
  }
  const remainingTents = Math.max(0, RAT_RACE_TENT_CAP - bookedTents);
  const remainingGroup = Math.max(0, RAT_RACE_GROUP_CAP - bookedGroup);
  const soldOut = remainingTents <= 0;
  const groupSoldOut = remainingGroup <= 0 || soldOut;
  return {
    bookedTents,
    bookedGroup,
    remainingTents,
    remainingGroup,
    soldOut,
    bellSoldOut: soldOut,
    groupSoldOut,
  };
}

export function inventoryAllowsLines(
  inventory: ReturnType<typeof ratRaceInventoryFromBookings>,
  lines: RatRaceTentLineInput[],
): { ok: boolean; error?: string } {
  const counts = countTentKinds(lines);
  if (counts.tents < 1) return { ok: false, error: 'Add at least one tent to continue.' };
  if (counts.tents > inventory.remainingTents) {
    return {
      ok: false,
      error: inventory.soldOut
        ? 'Sold out — all 20 tents are booked.'
        : `Only ${inventory.remainingTents} tent${inventory.remainingTents === 1 ? '' : 's'} left across 5M Bell and 6M Group.`,
    };
  }
  if (counts.groupTents > inventory.remainingGroup) {
    return {
      ok: false,
      error: inventory.groupSoldOut
        ? 'Group tents are sold out (max 3).'
        : `Only ${inventory.remainingGroup} Group tent${inventory.remainingGroup === 1 ? '' : 's'} left.`,
    };
  }
  return { ok: true };
}

export function ratRaceSecurityCheckinNote(tents: number, amount: number): string {
  const mix =
    tents <= 1
      ? '£200 refundable deposit per tent'
      : `£200 refundable deposit per tent (£${amount.toFixed(2)} for this mix)`;
  return `${mix}. We take it on a card reader at Saturday check-in.`;
}

const RAT_RACE_EVENT_SLUGS = new Set([
  RAT_RACE_2027.slug,
  'rat-race', // legacy / mistaken Stripe metadata from early live tests
]);

export function isRatRaceBooking(booking: { eventSlug?: string }): boolean {
  return Boolean(booking.eventSlug && RAT_RACE_EVENT_SLUGS.has(booking.eventSlug));
}

export interface RatRaceQuoteLine {
  title: string;
  price: number;
}

export interface RatRaceQuote {
  tents: RatRaceTentLineInput[];
  guests: number;
  requestedGuests: number;
  packageKind: RatRaceTentKind;
  packageLabel: string;
  nights: 1;
  checkinDate: string;
  checkoutDate: string;
  pitchFriday: string;
  tentCount: number;
  tents5: number;
  tents6: number;
  groupTents: number;
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
  inventory?: ReturnType<typeof ratRaceInventoryFromBookings>;
  stockOk: boolean;
  stockError?: string;
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
/** Remaining months after the upfront slice — kept short so the last charge lands before Rat Race Saturday. */
const INSTALMENT_MONTHLY_COUNT = 6;

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
      reason:
        'Pay Up is two months of the stay today, then six interest-free months on a Stripe subscription — Klarna energy, not Klarna. Book earlier so the last charge lands before Saturday night. Pay the stay instead.',
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

export function quoteRatRace(input: {
  tents?: unknown;
  guests?: number;
  packageKind?: unknown;
  inventory?: ReturnType<typeof ratRaceInventoryFromBookings>;
}): RatRaceQuote {
  let lines = parseRatRaceTentLines(input.tents);
  if (!lines.length) {
    const kind = normaliseRatRaceTentKind(input.packageKind);
    const guests = clampTentGuests(kind, Number(input.guests) || RAT_RACE_TENT_META[kind].minGuests);
    lines = [{ kind, guests }];
  }

  const priced = lines.map((line) => priceRatRaceTentLine(line.kind, line.guests));
  const normalised = priced.map((line) => ({ kind: line.kind, guests: line.guests }));
  const counts = countTentKinds(normalised);
  const guests = priced.reduce((sum, line) => sum + line.guests, 0);
  const canvasPrice = roundMoney(priced.reduce((sum, line) => sum + line.price, 0));
  const stayTotal = canvasPrice;
  const organiserCommissionAmount = roundMoney(canvasPrice * RAT_RACE_2027.organiserCommissionRate);
  const primary = priced[0];
  const packageKind = primary?.kind ?? 'bell';
  const meta = RAT_RACE_TENT_META[packageKind];
  const tentType = tentMixLabel(normalised);

  const quoteLines: RatRaceQuoteLine[] = [
    ...priced.map((line) => ({ title: line.title, price: line.price })),
    {
      title: `Village pitch Friday, Saturday night, pack up Sunday (${tentType})`,
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

  const securityDeposit = SECURITY_PER_TENT * counts.tents;
  const inventory = input.inventory;
  const stock = inventory
    ? inventoryAllowsLines(inventory, normalised)
    : { ok: true as const };

  const beddingBits = [...new Set(priced.map((line) => RAT_RACE_TENT_META[line.kind].beddingTier))];

  return {
    tents: normalised,
    guests,
    requestedGuests: guests,
    packageKind,
    packageLabel: meta.label,
    nights: RAT_RACE_2027.nights,
    checkinDate: RAT_RACE_2027.checkinDate,
    checkoutDate: RAT_RACE_2027.checkoutDate,
    pitchFriday: RAT_RACE_2027.pitchFriday,
    tentCount: counts.tents,
    tents5: counts.tents5,
    tents6: counts.tents6,
    groupTents: counts.groupTents,
    tentType,
    lines: quoteLines,
    addons: [],
    beddingTier: beddingBits.join(' · '),
    beddingPrice: 0,
    fulfillment: 'Village pitch Friday, Saturday night for guests, pack up Sunday',
    fulfillmentPrice: 0,
    canvasPrice,
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
    securityCheckinNote: ratRaceSecurityCheckinNote(counts.tents, securityDeposit),
    totalDueToday: depositAmount,
    conciergeNote:
      'Optional Morrisons Fort William click & collect in the tent at check-in. Tick it on the booking, we email how to build the order, you send the list back, then pay on a Stripe link. Basket plus 10% (capped at £15). Not part of the tent fee.',
    payMonthly: buildPayMonthlyPlan(stayTotal, RAT_RACE_2027.checkinDate),
    paymentPlan: 'deposit' as const,
    inventory,
    stockOk: stock.ok,
    stockError: stock.ok ? undefined : stock.error,
  };
}

/** Sample confirmation payload for organiser / sales previews (no Stripe). */
export function buildRatRacePreviewBooking(options?: {
  tents?: RatRaceTentLineInput[];
  guests?: number;
  packageKind?: RatRaceTentKind;
  concierge?: boolean;
  paymentPlan?: 'deposit' | 'instalment';
}): {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  campsiteLocation: string;
  specialRequests: string;
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  guests: number;
  tentType: string;
  beddingTier: string;
  beddingPrice: number;
  addons: { title: string; price: number }[];
  fulfillment: string;
  fulfillmentPrice: number;
  totalRentalPrice: number;
  depositPercent: number;
  depositAmount: number;
  securityDeposit: number;
  totalPaidToday: number;
  remainingBalance: number;
  balanceDueDate: string;
  paymentPlan: 'deposit' | 'instalment';
  instalmentMonthly?: number;
  instalmentCount?: number;
  eventSlug: string;
} {
  const quote = pricedForPaymentPlan(
    quoteRatRace({
      tents: options?.tents ?? [
        { kind: options?.packageKind ?? 'bell', guests: options?.guests ?? 2 },
      ],
    }),
    options?.paymentPlan === 'instalment' ? 'instalment' : 'deposit',
  );
  const notes = [
    options?.concierge
      ? 'Morrisons Fort William concierge requested. Send order-build instructions after canvas payment.'
      : '',
    'Preview confirmation — payments paused pending organiser approval.',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    bookingRef: 'CC-PREVIEW',
    customerName: 'Alex Campbell',
    customerEmail: 'alex@example.com',
    customerPhone: '+44 7700 900123',
    customerAddress: '14 Highland Way, Edinburgh, EH1 2NG',
    campsiteLocation: RAT_RACE_2027.locationLabel,
    specialRequests: notes,
    checkinDate: quote.checkinDate,
    checkoutDate: quote.checkoutDate,
    nights: quote.nights,
    guests: quote.guests,
    tentType: quote.tentType,
    beddingTier: quote.beddingTier,
    beddingPrice: quote.beddingPrice,
    addons: quote.addons.filter((line) => line.price > 0),
    fulfillment: quote.fulfillment,
    fulfillmentPrice: quote.fulfillmentPrice,
    totalRentalPrice: quote.totalRentalPrice,
    depositPercent: quote.depositPercent,
    depositAmount: quote.depositAmount,
    securityDeposit: quote.securityDeposit,
    totalPaidToday: quote.totalDueToday,
    remainingBalance: quote.remainingBalance,
    balanceDueDate: quote.balanceDueDate,
    paymentPlan: quote.paymentPlan,
    instalmentMonthly: quote.payMonthly.monthlyAmount,
    instalmentCount: quote.payMonthly.monthlyCount,
    eventSlug: RAT_RACE_2027.slug,
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
