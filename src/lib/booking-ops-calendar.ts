import type { BookingRecord } from './booking';
import { isDiyFulfillment } from './booking';
import { buildKitManifest } from './booking-kit';

export type FleetKey =
  | 'tents'
  | 'mattresses'
  | 'linen'
  | 'pillows'
  | 'kitchens'
  | 'woodburners'
  | 'lounges'
  | 'awnings'
  | 'starlinks'
  | 'chairs'
  | 'firekits'
  | 'beachkits';

export interface FleetMetric {
  key: FleetKey;
  label: string;
  icon: string;
  /** Peak concurrent units needed on any single night */
  peak: number;
  /** Sum of unit-nights across all stays (usage pressure) */
  unitNights: number;
  /** Bookings that need at least one of this item */
  bookings: number;
}

export interface CalendarStayChip {
  ref: string;
  name: string;
  color: string;
  tent: string;
  guests: number;
  delivery: boolean;
  kitUnits: number;
  kitSummary: string;
  icons: string[];
  title: string;
}

export interface CalendarDay {
  iso: string;
  day: number;
  inMonth: boolean;
  stays: CalendarStayChip[];
  demand: Partial<Record<FleetKey, number>>;
}

export interface OpsCalendar {
  year: number;
  month: number; // 1-12
  label: string;
  prev: string;
  next: string;
  days: CalendarDay[];
  metrics: FleetMetric[];
  stayCount: number;
}

const FLEET_META: Record<FleetKey, { label: string; icon: string }> = {
  tents: { label: 'Bell tents', icon: 'fa-campground' },
  mattresses: { label: 'Beds / airframes', icon: 'fa-bed' },
  linen: { label: 'Linen sets', icon: 'fa-shirt' },
  pillows: { label: 'Pillows', icon: 'fa-cloud' },
  kitchens: { label: 'Cosy kitchens', icon: 'fa-kitchen-set' },
  woodburners: { label: 'Wood burners', icon: 'fa-fire-flame-curved' },
  lounges: { label: 'Living lounges', icon: 'fa-couch' },
  awnings: { label: 'Awnings', icon: 'fa-umbrella-beach' },
  starlinks: { label: 'Starlink kits', icon: 'fa-satellite-dish' },
  chairs: { label: 'Camp chairs', icon: 'fa-chair' },
  firekits: { label: 'Fire cooking', icon: 'fa-fire' },
  beachkits: { label: 'Beach kits', icon: 'fa-bucket' },
};

const STAY_COLORS = ['#F7BA1E', '#7D6E23', '#60a5fa', '#c084fc', '#34d399', '#fb7185', '#fbbf24', '#a3e635'];

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function qtyNumber(raw: string): number {
  const match = String(raw).match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 1;
}

/** Physical kit units this booking needs while on site. */
export function bookingFleetDemand(booking: BookingRecord): Record<FleetKey, number> {
  const demand: Record<FleetKey, number> = {
    tents: 0,
    mattresses: 0,
    linen: 0,
    pillows: 0,
    kitchens: 0,
    woodburners: 0,
    lounges: 0,
    awnings: 0,
    starlinks: 0,
    chairs: 0,
    firekits: 0,
    beachkits: 0,
  };

  const tentCountMatch = booking.tentType.match(/^(\d+)\s*[×x]/i);
  demand.tents = tentCountMatch ? Number(tentCountMatch[1]) : 1;

  const manifest = buildKitManifest(booking);
  for (const group of manifest.groups) {
    if (group.id === 'kitchen') demand.kitchens = 1;
    if (group.id === 'heat') demand.woodburners = 1;
    if (group.id === 'living') demand.lounges = 1;
    if (group.id === 'awning') demand.awnings = 1;
    if (group.id === 'tech') demand.starlinks = 1;
    if (group.id === 'fire') demand.firekits = 1;
    if (group.id === 'beach') demand.beachkits = 1;
    if (group.id === 'seating') {
      const chairs = group.lines.find((line) => line.sku === 'chairs');
      demand.chairs = chairs ? qtyNumber(chairs.qty) : booking.guests;
    }
    if (group.id === 'sleep') {
      for (const line of group.lines) {
        if (line.sku === 'mattress') demand.mattresses = qtyNumber(line.qty);
        if (line.sku === 'linen') demand.linen = qtyNumber(line.qty);
        if (line.sku === 'pillows') demand.pillows = qtyNumber(line.qty);
      }
    }
  }

  return demand;
}

function shortTent(tentType: string): string {
  const multi = tentType.match(/^(\d+)\s*[×x]\s*(\d+\s*M)/i);
  if (multi) return `${multi[1]}×${multi[2].replace(/\s+/g, '')}`;
  const single = tentType.match(/(\d+\s*M)/i);
  if (single) return single[1].replace(/\s+/g, '');
  return tentType.slice(0, 8);
}

export function bookingStayChip(booking: BookingRecord, color: string): CalendarStayChip {
  const demand = bookingFleetDemand(booking);
  const diy = isDiyFulfillment(booking.fulfillment);
  const icons: string[] = [];
  const bits: string[] = [];
  let kitUnits = 0;

  for (const key of Object.keys(FLEET_META) as FleetKey[]) {
    const n = demand[key];
    if (!n) continue;
    kitUnits += n;
    icons.push(FLEET_META[key].icon);
    if (key === 'tents') bits.push(n > 1 ? `${n} tents` : shortTent(booking.tentType));
    else if (key === 'mattresses') bits.push(n > 1 ? `${n} beds` : 'beds');
    else if (key === 'kitchens') bits.push('kitchen');
    else if (key === 'woodburners') bits.push('burner');
    else if (key === 'lounges') bits.push('lounge');
    else if (key === 'starlinks') bits.push('Starlink');
    else if (key === 'awnings') bits.push('awning');
    else if (key === 'linen') bits.push('linen');
  }

  const name = booking.customerName.split(' ')[0] || booking.customerName;
  const tent = shortTent(booking.tentType);
  const kitSummary = bits.slice(0, 4).join(' · ');
  const title = [
    booking.customerName,
    tent,
    `${booking.guests} guests`,
    diy ? 'DIY pickup' : 'With delivery',
    kitSummary ? `${kitUnits} kit units: ${kitSummary}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    ref: booking.bookingRef,
    name,
    color,
    tent,
    guests: booking.guests,
    delivery: !diy,
    kitUnits,
    kitSummary,
    icons: icons.slice(0, 4),
    title,
  };
}

function nightsBetween(checkin: string, checkout: string): string[] {
  const start = parseIso(checkin);
  const end = parseIso(checkout);
  const nights: string[] = [];
  for (let cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
    nights.push(toIso(cursor));
  }
  return nights;
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function buildOpsCalendar(bookings: BookingRecord[], year: number, month: number): OpsCalendar {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);

  const active = bookings.filter((booking) => {
    const inStart = parseIso(booking.checkinDate);
    const outEnd = parseIso(booking.checkoutDate);
    return inStart <= last && outEnd > first;
  });

  const colorByRef = new Map<string, string>();
  active.forEach((booking, index) => {
    colorByRef.set(booking.bookingRef, STAY_COLORS[index % STAY_COLORS.length]);
  });

  const demandByDay = new Map<string, Record<FleetKey, number>>();
  const unitNights: Record<FleetKey, number> = {
    tents: 0,
    mattresses: 0,
    linen: 0,
    pillows: 0,
    kitchens: 0,
    woodburners: 0,
    lounges: 0,
    awnings: 0,
    starlinks: 0,
    chairs: 0,
    firekits: 0,
    beachkits: 0,
  };
  const bookingHits: Record<FleetKey, number> = { ...unitNights };

  for (const booking of bookings) {
    const demand = bookingFleetDemand(booking);
    const nights = nightsBetween(booking.checkinDate, booking.checkoutDate);
    for (const key of Object.keys(demand) as FleetKey[]) {
      if (demand[key] > 0) bookingHits[key] += 1;
      unitNights[key] += demand[key] * nights.length;
    }
    for (const iso of nights) {
      const dayDemand = demandByDay.get(iso) || {
        tents: 0,
        mattresses: 0,
        linen: 0,
        pillows: 0,
        kitchens: 0,
        woodburners: 0,
        lounges: 0,
        awnings: 0,
        starlinks: 0,
        chairs: 0,
        firekits: 0,
        beachkits: 0,
      };
      for (const key of Object.keys(demand) as FleetKey[]) {
        dayDemand[key] += demand[key];
      }
      demandByDay.set(iso, dayDemand);
    }
  }

  const peaks: Record<FleetKey, number> = { ...unitNights };
  for (const key of Object.keys(peaks) as FleetKey[]) peaks[key] = 0;
  for (const dayDemand of demandByDay.values()) {
    for (const key of Object.keys(dayDemand) as FleetKey[]) {
      peaks[key] = Math.max(peaks[key], dayDemand[key] || 0);
    }
  }

  const metrics: FleetMetric[] = (Object.keys(FLEET_META) as FleetKey[])
    .map((key) => ({
      key,
      label: FLEET_META[key].label,
      icon: FLEET_META[key].icon,
      peak: peaks[key],
      unitNights: unitNights[key],
      bookings: bookingHits[key],
    }))
    .filter((metric) => metric.peak > 0 || metric.bookings > 0)
    .sort((a, b) => b.peak - a.peak || b.unitNights - a.unitNights);

  const days: CalendarDay[] = [];
  const gridStart = new Date(year, month - 1, 1 - startPad);
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const iso = toIso(date);
    const inMonth = date.getMonth() === month - 1;
    const stays = active
      .filter((booking) => booking.checkinDate <= iso && iso < booking.checkoutDate)
      .map((booking) =>
        bookingStayChip(booking, colorByRef.get(booking.bookingRef) || STAY_COLORS[0]),
      );
    days.push({
      iso,
      day: date.getDate(),
      inMonth,
      stays,
      demand: demandByDay.get(iso) || {},
    });
    if (date > last && date.getDay() === 0 && days.length >= 35) break;
  }

  return {
    year,
    month,
    label,
    prev: monthKey(prevDate.getFullYear(), prevDate.getMonth() + 1),
    next: monthKey(nextDate.getFullYear(), nextDate.getMonth() + 1),
    days,
    metrics,
    stayCount: active.length,
  };
}

export function parseMonthParam(value: string | null, fallback = new Date()): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split('-').map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m };
  }
  return { year: fallback.getFullYear(), month: fallback.getMonth() + 1 };
}

export function bookingLoadIcons(booking: BookingRecord): { icon: string; label: string }[] {
  const demand = bookingFleetDemand(booking);
  const icons: { icon: string; label: string }[] = [];
  for (const key of Object.keys(FLEET_META) as FleetKey[]) {
    if (demand[key] > 0) {
      icons.push({
        icon: FLEET_META[key].icon,
        label: demand[key] > 1 ? `${FLEET_META[key].label} ×${demand[key]}` : FLEET_META[key].label,
      });
    }
  }
  return icons;
}
