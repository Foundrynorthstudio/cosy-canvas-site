import { isDiyFulfillment, type BookingRecord } from './booking';

export type KitSource = Pick<
  BookingRecord,
  'tentType' | 'guests' | 'nights' | 'beddingTier' | 'fulfillment' | 'addons'
>;

export interface KitLine {
  sku: string;
  label: string;
  qty: string;
  detail?: string;
  test?: string;
}

export interface KitGroup {
  id: string;
  title: string;
  icon: string;
  packed: boolean;
  lines: KitLine[];
}

function hasAddon(booking: KitSource, ...needles: string[]): boolean {
  const hay = booking.addons.map((addon) => addon.title.toLowerCase()).join(' | ');
  return needles.some((needle) => hay.includes(needle.toLowerCase()));
}

function beddingKind(tier: string): 'none' | 'essentials' | 'cosy' {
  const value = tier.toLowerCase();
  if (value.includes('cosy')) return 'cosy';
  if (value.includes('essential')) return 'essentials';
  return 'none';
}

export function buildKitManifest(booking: KitSource): {
  diy: boolean;
  loadVerb: string;
  groups: KitGroup[];
} {
  const guests = Math.max(1, booking.guests || 1);
  const diy = isDiyFulfillment(booking.fulfillment);
  const bedding = beddingKind(booking.beddingTier);
  const tentCountMatch = booking.tentType.match(/^(\d+)\s*[×x]/i);
  const tentQty = tentCountMatch ? tentCountMatch[1] : '1';
  const kitchen = hasAddon(booking, 'kitchen');
  const airframes = hasAddon(booking, 'airframe');
  const living = hasAddon(booking, 'living', 'lounge');
  const woodburner = hasAddon(booking, 'wood burner', 'woodburner');
  const awning = hasAddon(booking, 'awning');
  const chairs = hasAddon(booking, 'chair');
  const firecooking = hasAddon(booking, 'fire cooking');
  const starlink = hasAddon(booking, 'starlink', 'wi-fi', 'wifi');
  const beach = hasAddon(booking, 'beach');

  const groups: KitGroup[] = [
    {
      id: 'canvas',
      title: 'Canvas & structure',
      icon: 'fa-campground',
      packed: true,
      lines: [
        { sku: 'tent', label: booking.tentType, qty: tentQty, detail: `${booking.nights} nights` },
        { sku: 'groundsheet', label: 'Groundsheet', qty: tentQty },
        { sku: 'poles', label: 'Poles, pegs & guy lines', qty: `${tentQty} set${tentQty === '1' ? '' : 's'}` },
        { sku: 'flooring', label: 'Coir / carpet flooring', qty: tentQty },
      ],
    },
  ];

  if (airframes && bedding === 'none') {
    groups.push({
      id: 'sleep',
      title: 'Airframes',
      icon: 'fa-bed',
      packed: true,
      lines: [{ sku: 'mattress', label: 'Raised air-frame mattress', qty: String(guests) }],
    });
  } else if (bedding === 'essentials') {
    groups.push({
      id: 'sleep',
      title: 'Bedding: Essentials',
      icon: 'fa-bed',
      packed: true,
      lines: [{ sku: 'mattress', label: 'Raised air-frame mattress', qty: String(guests) }],
    });
  } else if (bedding === 'cosy') {
    groups.push({
      id: 'sleep',
      title: 'Bedding: Cosy Camping',
      icon: 'fa-bed',
      packed: true,
      lines: [
        { sku: 'mattress', label: 'Raised air-frame mattress', qty: String(guests) },
        { sku: 'linen', label: 'Hotel linen & duvet sets', qty: String(guests) },
        { sku: 'pillows', label: 'Pillows', qty: String(guests * 2) },
      ],
    });
  }

  if (kitchen) {
    groups.push({
      id: 'kitchen',
      title: 'Cosy Kitchen Setup',
      icon: 'fa-kitchen-set',
      packed: true,
      lines: [
        { sku: 'gas_stove', label: 'Gas stove', qty: '1' },
        { sku: 'cookware', label: 'Cookware, kettle & tableware', qty: `${guests} settings` },
        { sku: 'cutlery', label: 'Cutlery', qty: `${guests} sets` },
        { sku: 'coolbox', label: 'Coolbox', qty: '1' },
      ],
    });
  }

  if (living) {
    groups.push({
      id: 'living',
      title: 'Cosy Living Lounge',
      icon: 'fa-couch',
      packed: true,
      lines: [
        { sku: 'power', label: 'Power system', qty: '1' },
        { sku: 'projector', label: 'Cinema projector', qty: '1' },
        { sku: 'speaker', label: 'Bluetooth speaker', qty: '1' },
        { sku: 'fairy_lights', label: 'LED fairy lights', qty: '1 set' },
        { sku: 'aa_batteries', label: 'AA rechargeable batteries', qty: '8', detail: 'Packed with the lights in case they run out' },
      ],
    });
  }

  if (woodburner) {
    groups.push({
      id: 'heat',
      title: 'Indoor Wood Burner',
      icon: 'fa-fire-flame-curved',
      packed: true,
      lines: [
        { sku: 'woodburner', label: 'Wood-burning tent stove', qty: '1' },
        { sku: 'flue', label: 'Chimney flue & flashing', qty: '1' },
        { sku: 'hearth', label: 'Hearth mat', qty: '1' },
        { sku: 'logs', label: 'Starter log basket', qty: '1' },
      ],
    });
  }

  if (awning) {
    groups.push({
      id: 'awning',
      title: 'Outdoor Awning Porch',
      icon: 'fa-umbrella-beach',
      packed: true,
      lines: [{ sku: 'awning', label: 'Entrance awning porch', qty: '1' }],
    });
  }

  if (chairs) {
    groups.push({
      id: 'seating',
      title: 'Indoor & Outdoor Chairs',
      icon: 'fa-chair',
      packed: true,
      lines: [
        { sku: 'cushions', label: 'Indoor lounge cushions', qty: String(guests) },
        { sku: 'chairs', label: 'Campfire folding chairs', qty: String(guests) },
      ],
    });
  }

  if (firecooking) {
    groups.push({
      id: 'fire',
      title: 'Fire Cooking Equipment',
      icon: 'fa-fire',
      packed: true,
      lines: [
        { sku: 'dutch_oven', label: 'Dutch oven', qty: '1' },
        { sku: 'grate', label: 'Tripod fire grate', qty: '1' },
        { sku: 'skewers', label: 'Skewers', qty: '1 set' },
        { sku: 'gloves', label: 'Heat-resistant gloves', qty: '1 pair' },
      ],
    });
  }

  if (starlink) {
    groups.push({
      id: 'tech',
      title: 'Starlink Satellite Wi-Fi',
      icon: 'fa-satellite-dish',
      packed: true,
      lines: [{ sku: 'starlink', label: 'Starlink kit & stand', qty: '1', detail: `${booking.nights} nights` }],
    });
  }

  if (beach) {
    groups.push({
      id: 'beach',
      title: 'Beach & Adventure Kit',
      icon: 'fa-bucket',
      packed: true,
      lines: [
        { sku: 'boards', label: 'Boogie boards', qty: '1 set' },
        { sku: 'beach_games', label: 'Beach games & buckets', qty: '1' },
      ],
    });
  }

  return {
    diy,
    loadVerb: diy ? 'Pack for depot collection' : 'Pack for on-site setup',
    groups,
  };
}

export function kitEmailHtml(booking: KitSource): string {
  const manifest = buildKitManifest(booking);

  const packedBlocks = manifest.groups
    .map((group) => {
      const items = group.lines
        .map(
          (line) =>
            `<tr>
              <td style="padding:8px 0;border-bottom:1px solid #f0eee6;">${line.label}${line.detail ? `<div style="color:#78716c;font-size:11px;">${line.detail}</div>` : ''}</td>
              <td style="padding:8px 0;border-bottom:1px solid #f0eee6;text-align:right;font-weight:700;white-space:nowrap;">${line.qty}</td>
            </tr>`,
        )
        .join('');
      return `<h3 style="margin:20px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#7d6e23;">${group.title}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">${items}</table>`;
    })
    .join('');

  return `
    <div style="background:#111;color:#f7ba1e;border-radius:12px;padding:12px 16px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:16px 0;">
      ${manifest.loadVerb}
    </div>
    ${packedBlocks}
  `;
}
