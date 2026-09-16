export const BRAW_BREAD_URL = 'https://brawbread.com';
export const BRAW_BREAD_NETLIFY_URL = 'https://brawbread.netlify.app';
export const BRAW_BREAD_LOGO = '/events/braw-bread/logo-horizontal.svg';
export const BRAW_BREAD_MARK = '/events/braw-bread/logo-vertical.svg';

export type BrawBreadItemId = 'loaf' | 'cookies' | 'rolls';

export interface BrawBreadItem {
  id: BrawBreadItemId;
  name: string;
  unitLabel: string;
  price: number;
  description: string;
  image: string;
  imageAlt: string;
}

export type BrawBreadOrder = Record<BrawBreadItemId, number>;

const MAX_QTY = 20;

export const BRAW_BREAD_MENU: BrawBreadItem[] = [
  {
    id: 'loaf',
    name: 'Sourdough loaf',
    unitLabel: 'loaf',
    price: 3.5,
    description: 'A naturally leavened country boule with a blistered crust and an open, tangy crumb.',
    image: `${BRAW_BREAD_URL}/images/sourdough-loaf.jpg`,
    imageAlt: 'Braw Bread sourdough loaf in a kraft bag',
  },
  {
    id: 'cookies',
    name: 'Dozen cookies',
    unitLabel: 'dozen',
    price: 6,
    description: 'A dozen thick, chewy sea-salt chocolate chip cookies.',
    image: `${BRAW_BREAD_URL}/images/chocolate-chip-cookies.jpg`,
    imageAlt: 'Braw Bread cookies in a kraft box',
  },
  {
    id: 'rolls',
    name: 'Cinnamon rolls',
    unitLabel: 'pack of 6',
    price: 7,
    description: 'A tray of six slow-proved, sticky cinnamon rolls.',
    image: `${BRAW_BREAD_URL}/images/cinnamon-rolls.jpg`,
    imageAlt: 'Braw Bread iced cinnamon rolls',
  },
];

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function clampQty(value: unknown): number {
  const n = Math.round(Number(value) || 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(MAX_QTY, n);
}

export function emptyBrawBreadOrder(): BrawBreadOrder {
  return { loaf: 0, cookies: 0, rolls: 0 };
}

export function parseBrawBreadOrder(input: unknown): BrawBreadOrder {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  return {
    loaf: clampQty(raw.loaf),
    cookies: clampQty(raw.cookies),
    rolls: clampQty(raw.rolls),
  };
}

export function brawBreadLines(order: BrawBreadOrder) {
  return BRAW_BREAD_MENU.filter((item) => order[item.id] > 0).map((item) => {
    const qty = order[item.id];
    return {
      id: item.id,
      title: `${qty} × Braw Bread ${item.name} @ £${item.price.toFixed(2)}`,
      price: roundMoney(qty * item.price),
    };
  });
}

export function brawBreadTotal(order: BrawBreadOrder): number {
  return roundMoney(brawBreadLines(order).reduce((sum, line) => sum + line.price, 0));
}

export function brawBreadNote(order: BrawBreadOrder): string {
  const bits = BRAW_BREAD_MENU.filter((item) => order[item.id] > 0).map(
    (item) => `${order[item.id]} × ${item.name}`,
  );
  if (!bits.length) return '';
  return `Braw Bread onsite: ${bits.join(', ')}. In the tent at Saturday check-in.`;
}
