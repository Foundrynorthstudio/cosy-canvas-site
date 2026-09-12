const W3W_PATTERN = /^[a-z]+\.[a-z]+\.[a-z]+$/;

export const DEPOT = {
  id: 'falkirk',
  shortName: 'Falkirk',
  label: 'Falkirk container',
  title: 'The Cosy Canvas Co. Falkirk Container',
  locality: 'Falkirk',
  region: 'Stirlingshire',
  country: 'Scotland',
  hoursShort: '9am–10pm, 7 days',
  hoursNote: 'Message us if you will arrive after 8pm.',
  opens: '09:00',
  closes: '22:00',
  latitude: 56.0019,
  longitude: -3.7839,
  mapPinLeft: '54%',
  mapPinTop: '67%',
  badge: 'FALKIRK CONTAINER',
} as const;

function readWhat3Words(): string {
  const raw = String(import.meta.env.PUBLIC_DEPOT_W3W ?? '').trim();
  if (!raw) return '';
  const cleaned = raw
    .replace(/^https?:\/\/(www\.)?what3words\.com\//i, '')
    .replace(/^\/+/, '')
    .replace(/\s+/g, '.')
    .toLowerCase();
  return W3W_PATTERN.test(cleaned) ? cleaned : '';
}

export function depotWhat3Words(): string {
  return readWhat3Words();
}

export function depotW3wUrl(): string {
  const words = depotWhat3Words();
  return words ? `https://what3words.com/${words}` : '';
}

export function depotW3wLabel(): string {
  return depotWhat3Words() || 'Pin to follow';
}

export function depotOriginQuery(): string {
  return `${DEPOT.latitude},${DEPOT.longitude}`;
}

export function depotMapsUrl(): string {
  const words = depotWhat3Words();
  const query = words || depotOriginQuery();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleDirectionsUrl(destLat: number, destLng: number): string {
  const origin = encodeURIComponent(depotOriginQuery());
  const dest = encodeURIComponent(`${destLat},${destLng}`);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
}

export function googleDirectionsEmbedSrc(destLat: number, destLng: number): string {
  return `https://maps.google.com/maps?saddr=${DEPOT.latitude},${DEPOT.longitude}&daddr=${destLat},${destLng}&output=embed`;
}

export function estimateVanFuel(milesOneWay: number): { oneWayGbp: number; roundTripGbp: number } {
  const mpg = 32;
  const litresPerGallon = 4.546;
  const gbpPerLitre = 1.5;
  const perMile = (litresPerGallon / mpg) * gbpPerLitre;
  const oneWay = Math.max(1, Math.round(milesOneWay * perMile));
  return { oneWayGbp: oneWay, roundTripGbp: oneWay * 2 };
}

export function formatDriveMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (rest === 0) return `${hours} HR${hours === 1 ? '' : 'S'}`;
    return `${hours} HR ${rest} MINS`;
  }
  return `${minutes} MINS`;
}
