import { isDiyFulfillment, type BookingAddon, type BookingRecord } from './booking';

export type LineKind = 'tent' | 'bedding' | 'fulfillment' | 'addon';

export interface BookingLineItem {
  id: string;
  kind: LineKind;
  title: string;
  detail: string;
  price: number;
  icon: string;
}

type LineSource = Pick<
  BookingRecord,
  | 'tentType'
  | 'nights'
  | 'guests'
  | 'beddingTier'
  | 'beddingPrice'
  | 'addons'
  | 'fulfillment'
  | 'fulfillmentPrice'
  | 'totalRentalPrice'
>;

const ADDON_ICONS: { match: string; icon: string }[] = [
  { match: 'kitchen', icon: 'fa-kitchen-set' },
  { match: 'living', icon: 'fa-couch' },
  { match: 'lounge', icon: 'fa-couch' },
  { match: 'wood', icon: 'fa-fire-flame-curved' },
  { match: 'awning', icon: 'fa-umbrella-beach' },
  { match: 'chair', icon: 'fa-chair' },
  { match: 'fire', icon: 'fa-fire' },
  { match: 'starlink', icon: 'fa-satellite-dish' },
  { match: 'wi-fi', icon: 'fa-satellite-dish' },
  { match: 'wifi', icon: 'fa-satellite-dish' },
  { match: 'beach', icon: 'fa-bucket' },
];

export function formatGbp(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

export function addonIcon(title: string): string {
  const hay = title.toLowerCase();
  return ADDON_ICONS.find((entry) => hay.includes(entry.match))?.icon ?? 'fa-box';
}

export function addonsTotal(addons: BookingAddon[]): number {
  return addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
}

export function tentHirePrice(booking: LineSource): number {
  const remaining =
    booking.totalRentalPrice -
    (booking.beddingPrice || 0) -
    addonsTotal(booking.addons) -
    (booking.fulfillmentPrice || 0);
  return Math.max(0, Number(remaining.toFixed(2)));
}

function beddingDetail(booking: LineSource): string {
  const guests = Math.max(1, booking.guests || 1);
  const tier = booking.beddingTier.toLowerCase();
  if (tier.includes('cosy')) return `Hotel linen & air beds · ${guests} guests · £35 each`;
  if (tier.includes('essential')) return `Raised air-frame mattresses · ${guests} guests · £25 each`;
  return 'Guest brings their own sleeping bags & mats';
}

function addonDetail(title: string): string {
  const hay = title.toLowerCase();
  if (hay.includes('kitchen')) return 'Gas stove, cookware, kettle, tableware & coolbox';
  if (hay.includes('living') || hay.includes('lounge')) return 'Power, cinema projector, speaker & lights';
  if (hay.includes('wood')) return 'Tent stove, flue, hearth mat & starter basket';
  if (hay.includes('awning')) return 'Sheltered entrance porch';
  if (hay.includes('chair')) return 'Indoor cushions & outdoor folding chairs';
  if (hay.includes('fire')) return 'Dutch oven, tripod grate, skewers & gloves';
  if (hay.includes('starlink') || hay.includes('wi-fi') || hay.includes('wifi')) return 'Satellite broadband kit';
  if (hay.includes('beach')) return 'Boogie boards, games & buckets';
  return 'Camp add-on';
}

export function buildBookingLineItems(booking: LineSource): BookingLineItem[] {
  const guests = Math.max(1, booking.guests || 1);
  const diy = isDiyFulfillment(booking.fulfillment);

  const lines: BookingLineItem[] = [
    {
      id: 'tent',
      kind: 'tent',
      title: booking.tentType,
      detail: `${booking.nights} nights · ${guests} guests`,
      price: tentHirePrice(booking),
      icon: 'fa-campground',
    },
    {
      id: 'bedding',
      kind: 'bedding',
      title: booking.beddingTier || 'DIY Sleeping',
      detail: beddingDetail(booking),
      price: booking.beddingPrice || 0,
      icon: 'fa-bed',
    },
    {
      id: 'fulfillment',
      kind: 'fulfillment',
      title: booking.fulfillment,
      detail: diy ? 'Collect from Polmont depot' : 'Pitch on site & collect at the end',
      price: booking.fulfillmentPrice || 0,
      icon: diy ? 'fa-warehouse' : 'fa-truck',
    },
    ...booking.addons.map((addon, index) => ({
      id: `addon-${index}`,
      kind: 'addon' as const,
      title: addon.title,
      detail: addonDetail(addon.title),
      price: addon.price || 0,
      icon: addonIcon(addon.title),
    })),
  ];

  return lines;
}

export function lineItemsEmailRows(booking: LineSource): string {
  const lines = buildBookingLineItems(booking);
  const rows = lines
    .map(
      (line) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
            ${line.title}
            <div style="color:#64748b;font-size:11px;">${line.detail}</div>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;white-space:nowrap;">
            ${line.price === 0 ? 'Free' : formatGbp(line.price)}
          </td>
        </tr>`,
    )
    .join('');

  return `${rows}
    <tr>
      <td style="padding:12px 0 4px;font-weight:800;">Stay total</td>
      <td style="padding:12px 0 4px;text-align:right;font-weight:800;">${formatGbp(booking.totalRentalPrice)}</td>
    </tr>`;
}
