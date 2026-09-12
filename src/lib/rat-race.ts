export const RAT_RACE_EVENT_URL = 'https://www.ratrace.com/events/scotland-coast-to-coast/';

export const RAT_RACE_2027 = {
  slug: 'rat-race-c2c-2027',
  title: 'Scotland Coast to Coast',
  organiser: 'Rat Race',
  eventDatesLabel: '11–12 September 2027',
  eventUrl: RAT_RACE_EVENT_URL,
  locationLabel: 'Rat Race Coast to Coast · Fort William / Glen Coe field',
  checkinDate: '2027-09-10',
  checkoutTwoNights: '2027-09-12',
  checkoutThreeNights: '2027-09-13',
  tile: '/events/rat-race-c2c-tile.webp',
} as const;

export type RatRacePackage = 'budget' | 'medium';
export type RatRaceNights = 2 | 3;

export const RAT_RACE_PACKAGE_META: Record<
  RatRacePackage,
  { label: string; capacity: number; summary: string }
> = {
  budget: {
    label: 'Budget',
    capacity: 10,
    summary: '6M pitched with a dry floor. Up to 10 people. Bring your own sleep kit.',
  },
  medium: {
    label: 'Medium',
    capacity: 6,
    summary: '6M with kitchen, airframes, table and chairs. Up to 6 people per tent.',
  },
};

const CANVAS_PER_NIGHT = 100;
const PITCH_PER_TENT = 225;
const KITCHEN_BASE = 40;
const KITCHEN_PER_GUEST = 5;
const CHAIRS_PER_GUEST = 10;
const AIRFRAME_PER_GUEST = 15;
const SECURITY_PER_TENT = 200;
const MAX_GUESTS = 40;

export interface RatRaceQuoteLine {
  title: string;
  price: number;
}

export interface RatRaceQuote {
  guests: number;
  packageKind: RatRacePackage;
  packageLabel: string;
  nights: RatRaceNights;
  checkinDate: string;
  checkoutDate: string;
  tents: number;
  capacityPerTent: number;
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
  daysUntilCheckin: number;
  depositPercent: 50 | 100;
  depositAmount: number;
  remainingBalance: number;
  balanceDueDate: string;
  securityDeposit: number;
  totalDueToday: number;
  conciergeNote: string;
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function occupancyForTents(guests: number, tents: number, capacity: number): number[] {
  const remaining = [...Array(tents)].map(() => 0);
  let left = guests;
  for (let i = 0; i < tents; i += 1) {
    const take = Math.min(capacity, left);
    remaining[i] = take;
    left -= take;
  }
  return remaining;
}

export function quoteRatRace(input: {
  guests: number;
  packageKind: RatRacePackage;
  nights: RatRaceNights;
}): RatRaceQuote {
  const guests = Math.min(MAX_GUESTS, Math.max(1, Math.round(input.guests) || 1));
  const packageKind = input.packageKind === 'medium' ? 'medium' : 'budget';
  const nights: RatRaceNights = input.nights === 3 ? 3 : 2;
  const meta = RAT_RACE_PACKAGE_META[packageKind];
  const tents = Math.max(1, Math.ceil(guests / meta.capacity));
  const occupancy = occupancyForTents(guests, tents, meta.capacity);
  const checkoutDate = nights === 3 ? RAT_RACE_2027.checkoutThreeNights : RAT_RACE_2027.checkoutTwoNights;
  const checkinDate = RAT_RACE_2027.checkinDate;

  const canvasGross = CANVAS_PER_NIGHT * nights * tents;
  const discountRate = 0.15;
  const discountAmount = roundMoney(canvasGross * discountRate);
  const canvasPrice = roundMoney(canvasGross - discountAmount);
  const fulfillmentPrice = PITCH_PER_TENT * tents;

  const addons: RatRaceQuoteLine[] = [];
  let beddingPrice = 0;
  let beddingTier = 'Own sleeping kit (Budget)';

  if (packageKind === 'medium') {
    const kitchen = occupancy.reduce((sum, n) => sum + KITCHEN_BASE + KITCHEN_PER_GUEST * n, 0);
    const chairs = occupancy.reduce((sum, n) => sum + CHAIRS_PER_GUEST * n, 0);
    const airframes = occupancy.reduce((sum, n) => sum + AIRFRAME_PER_GUEST * n, 0);
    addons.push({ title: 'Cosy kitchen (per tent)', price: roundMoney(kitchen) });
    addons.push({ title: 'Table and chairs', price: roundMoney(chairs) });
    addons.push({ title: 'Airframes', price: roundMoney(airframes) });
    beddingPrice = roundMoney(airframes);
    beddingTier = 'Airframes included';
  }

  const addonsTotal = addons.reduce((sum, line) => sum + line.price, 0);
  const totalRentalPrice = roundMoney(canvasPrice + fulfillmentPrice + addonsTotal);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkin = new Date(`${checkinDate}T12:00:00`);
  const daysUntilCheckin = Math.ceil((checkin.getTime() - today.getTime()) / 86400000);
  const isFiftyPercentEligible = daysUntilCheckin >= 28;
  const depositPercent: 50 | 100 = isFiftyPercentEligible ? 50 : 100;
  const depositAmount = isFiftyPercentEligible
    ? roundMoney(totalRentalPrice * 0.5)
    : totalRentalPrice;
  const remainingBalance = roundMoney(totalRentalPrice - depositAmount);
  let balanceDueDate = '';
  if (isFiftyPercentEligible) {
    const due = new Date(checkin);
    due.setDate(due.getDate() - 28);
    balanceDueDate = due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const securityDeposit = SECURITY_PER_TENT * tents;
  const tentType = `${tents} × 6M ${meta.label}`;

  const lines: RatRaceQuoteLine[] = [
    {
      title: `${tents} × 6M canvas · ${nights} night${nights === 1 ? '' : 's'} (£${CANVAS_PER_NIGHT}/n, 15% 2027 early bird)`,
      price: canvasPrice,
    },
    {
      title: `Delivered, pitched and collected (${tents} tent${tents === 1 ? '' : 's'})`,
      price: fulfillmentPrice,
    },
    ...addons,
  ];

  return {
    guests,
    packageKind,
    packageLabel: meta.label,
    nights,
    checkinDate,
    checkoutDate,
    tents,
    capacityPerTent: meta.capacity,
    tentType,
    lines,
    addons,
    beddingTier,
    beddingPrice: packageKind === 'medium' ? 0 : beddingPrice,
    fulfillment: 'Event pitch: delivered, guyed and collected',
    fulfillmentPrice,
    canvasPrice,
    discountRate,
    discountAmount,
    totalRentalPrice,
    daysUntilCheckin,
    depositPercent,
    depositAmount,
    remainingBalance,
    balanceDueDate,
    securityDeposit,
    totalDueToday: roundMoney(depositAmount + securityDeposit),
    conciergeNote:
      'Morrisons Fort William click-and-collect. Send your shopping list after booking. We charge the basket plus 10%.',
  };
}

export function conciergeChargeFromBasket(basketValue: number): number {
  const basket = Math.max(0, Number(basketValue) || 0);
  return roundMoney(basket * 1.1);
}

export function isRatRacePackage(value: unknown): value is RatRacePackage {
  return value === 'budget' || value === 'medium';
}
