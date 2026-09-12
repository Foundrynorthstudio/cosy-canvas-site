export interface KitPrice {
  sku: string;
  cost: number;
  replacement: number;
  test: string;
}

const REPLACEMENT_MARKUP = 1.1;

const CATALOG: Record<string, { cost: number; test: string }> = {
  tent: { cost: 220, test: 'Peg out, check canvas, zips, and pole joints. No tears or mould.' },
  groundsheet: { cost: 28, test: 'Unfold and check for holes or delamination.' },
  poles: { cost: 35, test: 'Count poles, pegs and guys. No bent poles or missing bags.' },
  flooring: { cost: 40, test: 'Shake out, check dry, no rips.' },
  mattress: { cost: 48, test: 'Inflate fully. Leave 5 minutes. No hiss, sag, or puncture.' },
  linen: { cost: 22, test: 'Check complete set, stains, and smell. Bag if damp.' },
  pillows: { cost: 12, test: 'Count pillows. Clean covers only.' },
  gas_stove: { cost: 18, test: 'Connect, light both burners, check hose and click igniter.' },
  cookware: { cost: 25, test: 'Count pans, kettle, plates and mugs. No burns-through.' },
  cutlery: { cost: 8, test: 'Count full sets. No missing knives.' },
  coolbox: { cost: 22, test: 'Lid seal, drain bung, no cracks.' },
  power: { cost: 90, test: 'Charge indicator on, 12V and USB ports live.' },
  projector: { cost: 70, test: 'Power on, lamp/image on a wall, HDMI/Bluetooth pair.' },
  speaker: { cost: 25, test: 'Power on, Bluetooth pair, play a track.' },
  fairy_lights: { cost: 9, test: 'Plug in / switch on the full string. Every section must light.' },
  aa_batteries: { cost: 14, test: 'Count 8x AA rechargeables. Voltage check. Pack with the lights.' },
  woodburner: { cost: 95, test: 'Door seal, glass, legs. No cracks. Flue collars present.' },
  flue: { cost: 22, test: 'Dry-fit flue and flashing. Spark arrestor on.' },
  hearth: { cost: 18, test: 'Mat intact, no melt holes.' },
  logs: { cost: 8, test: 'Dry basket, no mould.' },
  awning: { cost: 55, test: 'Peg out, check poles and canvas.' },
  cushions: { cost: 15, test: 'Dry, no tears.' },
  chairs: { cost: 18, test: 'Unfold, sit test, no broken frame.' },
  dutch_oven: { cost: 28, test: 'Lid fit, no cracks.' },
  grate: { cost: 16, test: 'Legs lock, grate not warped.' },
  skewers: { cost: 4, test: 'Count set. No rust-through.' },
  gloves: { cost: 6, test: 'Pair complete, no holes.' },
  starlink: { cost: 220, test: 'Boot dish, get online, stow cable and stand.' },
  boards: { cost: 20, test: 'No snapped fins. Pair present.' },
  beach_games: { cost: 12, test: 'Count buckets, games, tote dry.' },
};

export function kitReplacementCharge(cost: number): number {
  return Number((cost * REPLACEMENT_MARKUP).toFixed(2));
}

export function kitPrice(sku: string): KitPrice {
  const base = sku.replace(/-\d+$/, '');
  const found = CATALOG[base];
  const cost = found?.cost ?? 15;
  return {
    sku,
    cost,
    replacement: kitReplacementCharge(cost),
    test: found?.test || 'Visual check, function test, pack complete.',
  };
}

export function formatKitMoney(value: number): string {
  return `£${value.toFixed(2)}`;
}
