import {
  DEPOT,
  estimateVanFuel,
  formatDriveMinutes,
  googleDirectionsEmbedSrc,
  googleDirectionsUrl,
} from './depot';

export interface CampsiteRoute {
  key: string;
  tag: string;
  drive: string;
  img: string;
  elevation: string;
  title: string;
  destShort: string;
  region: string;
  desc: string;
  suitability: string;
  website: string;
  badge?: string;
  journalSlug?: string;
  gridRef: string;
  miles: number;
  minutes: number;
  ferry?: boolean;
  lat: number;
  lng: number;
  distance: string;
  routeDesc: string;
  terrain: string;
  fuelOneWay: string;
  fuelRoundTrip: string;
  mapsUrl: string;
  embedSrc: string;
}

function routeStats(miles: number, minutes: number, ferry = false) {
  const fuel = estimateVanFuel(miles);
  const driveCore = ferry
    ? `FERRY + ${formatDriveMinutes(minutes)} FROM FALKIRK`
    : `${formatDriveMinutes(minutes)} FROM FALKIRK`;
  const distance = ferry
    ? `${miles} miles road + CalMac ferry (${formatDriveMinutes(minutes)} driving)`
    : `${miles} miles (${formatDriveMinutes(minutes).toLowerCase()} typical drive)`;
  return {
    drive: driveCore,
    distance,
    fuelOneWay: `~£${fuel.oneWayGbp}`,
    fuelRoundTrip: `~£${fuel.roundTripGbp} return`,
  };
}

function withMaps(
  site: Omit<CampsiteRoute, 'mapsUrl' | 'embedSrc' | 'drive' | 'distance' | 'fuelOneWay' | 'fuelRoundTrip'> & {
    miles: number;
    minutes: number;
    ferry?: boolean;
  },
): CampsiteRoute {
  const stats = routeStats(site.miles, site.minutes, site.ferry);
  return {
    ...site,
    ...stats,
    mapsUrl: googleDirectionsUrl(site.lat, site.lng),
    embedSrc: googleDirectionsEmbedSrc(site.lat, site.lng),
  };
}

export const CAMPSITE_ROUTES: Record<string, CampsiteRoute> = {
  falkirk: {
    key: 'falkirk',
    tag: DEPOT.badge,
    drive: 'DISPATCH HUB',
    img: '/TCCC Horizontal Logo.png',
    elevation: '35m ELEVATION',
    title: DEPOT.title,
    destShort: 'Falkirk',
    region: `${DEPOT.locality}, ${DEPOT.region}`,
    desc: 'Our kit container and dispatch hub in Falkirk. Free DIY collection and return, 9am–10pm every day, plus Deluxe runs across Scotland.',
    suitability: 'All tent sizes and bespoke event packages',
    website: '/booking',
    gridRef: 'Falkirk container',
    miles: 0,
    minutes: 0,
    lat: DEPOT.latitude,
    lng: DEPOT.longitude,
    distance: '0 miles — collection hub',
    routeDesc: 'M9 / M876 / A803. What3Words is sent on DIY booking confirmation.',
    terrain: 'Container yard. Park close, load from the rear doors.',
    fuelOneWay: '—',
    fuelRoundTrip: '—',
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${DEPOT.latitude},${DEPOT.longitude}`)}`,
    embedSrc: `https://maps.google.com/maps?q=${DEPOT.latitude},${DEPOT.longitude}&z=14&output=embed`,
  },
  cobleland: withMaps({
    key: 'cobleland',
    tag: 'OS GRID: NS 539 800',
    img: '/campsite_cobleland.jpg',
    elevation: '25m ELEVATION',
    title: 'Cobleland Campsite',
    destShort: 'Cobleland',
    region: 'Gartmore, Stirling • Queen Elizabeth Forest Park',
    desc: 'We know Oliver and his team. Always friendly, always keeping the site running smoothly. Full electric hook-up or grass-only pitches, modern clean facilities, a sourdough pizza wagon at the weekend and a newly built covered veranda. The team loves the coffee from the barista machine in the shop. Book the pitch with Cobleland, send us your booking reference, and setup with us is pitch perfect.',
    suitability: '4M, 5M & 6M · partner site, Deluxe setup',
    badge: 'Partner site',
    website: 'https://www.coblelandcampsite.co.uk/',
    gridRef: 'NS 539 800',
    miles: 28,
    minutes: 40,
    lat: 56.15837,
    lng: -4.36617,
    routeDesc: 'A803 / M9 towards Stirling, A811 west through Buchlyvie, A81 to Gartmore (FK8 3RR).',
    terrain: 'Flat riverbank grass pitch with easy vehicle access.',
  }),
  fidden: withMaps({
    key: 'fidden',
    tag: 'OS GRID: NM 301 214',
    img: '/campsite_fidden_farm.jpg',
    elevation: '5m ELEVATION',
    title: 'Fidden Farm Campsite',
    destShort: 'Fidden',
    region: 'Fionnphort, Isle of Mull',
    desc: 'A special place. Remote, and you need the ferry to get there. The beach is hard to describe: pools of crystal-blue water and white sand at the southern tip of Mull. Book Fidden Farm directly, send us your booking reference, and we bring the canvas.',
    suitability: '4M, 5M & 6M · partner site, Deluxe setup',
    badge: 'Partner site',
    website: 'https://fiddenfarm.co.uk/',
    gridRef: 'NM 301 214',
    miles: 155,
    minutes: 200,
    ferry: true,
    lat: 56.3152,
    lng: -6.3694,
    routeDesc: 'M80 / A82 / A85 to Oban, CalMac to Craignure, A849 to Fionnphort.',
    terrain: 'Coastal machair grass meadow. High-grade storm pegs used.',
  }),
  lochchon: withMaps({
    key: 'lochchon',
    tag: 'OS GRID: NN 420 051',
    img: '/campsite_loch_chon.jpg',
    elevation: '90m ELEVATION',
    title: 'Loch Chon Campsite',
    destShort: 'Loch Chon',
    region: 'Kinlochard, The Trossachs',
    desc: 'A precious place for the team, inside Loch Lomond and The Trossachs National Park. DIY only from the Falkirk container — a journal post on this one is coming.',
    suitability: '4M & 5M · National Park, DIY only',
    badge: 'DIY · National Park',
    website: 'https://www.lochlomond-trossachs.org/',
    gridRef: 'NN 420 051',
    miles: 35,
    minutes: 55,
    lat: 56.2128,
    lng: -4.5472,
    routeDesc: 'A811 / A81 to Aberfoyle, then B829 past Loch Ard to Loch Chon.',
    terrain: 'Woodland lochside pitches. Bunkered soil and grass clearing.',
  }),
  sallochy: withMaps({
    key: 'sallochy',
    tag: 'OS GRID: NS 383 956',
    img: '/campsite_sallochy.jpg',
    elevation: '15m ELEVATION',
    title: 'Sallochy Campsite',
    destShort: 'Sallochy',
    region: 'East Loch Lomond Shore',
    desc: 'Hands-down our favourite. National Park, so DIY, and it does not want to be busy — a peaceful oak wood on the east shore of Loch Lomond. Such a special spot is worth the effort.',
    suitability: '4M, 5M & 6M · National Park, DIY only',
    badge: 'DIY · National Park',
    website: 'https://www.lochlomond-trossachs.org/',
    gridRef: 'NS 383 956',
    miles: 42,
    minutes: 60,
    lat: 56.1224,
    lng: -4.6031,
    routeDesc: 'A811 to Drymen, B837 west along the east loch shore to Sallochy.',
    terrain: 'Sheltered shore woodland clearing with loch views.',
  }),
  luss: withMaps({
    key: 'luss',
    tag: 'OS GRID: NS 359 932',
    img: '/campsite_glen_Luss.jpg',
    elevation: '10m ELEVATION',
    title: 'Luss Campsite',
    destShort: 'Luss',
    region: 'Loch Lomond West Bank',
    desc: 'Near Luss village on the west bank of Loch Lomond, with views across to Ben Lomond.',
    suitability: 'Suitable for 4M, 5M & 6M Bell Tents',
    website: 'https://www.lusscampsite.co.uk/',
    gridRef: 'NS 359 932',
    miles: 44,
    minutes: 55,
    lat: 56.1014,
    lng: -4.6382,
    routeDesc: 'M9 / M80 west, Erskine Bridge, A82 north to Luss.',
    terrain: 'Manicured level lawn pitch near the water.',
  }),
  redsquirrel: withMaps({
    key: 'redsquirrel',
    tag: 'OS GRID: NN 105 577',
    img: '/campsite_red_squirrel.jpg',
    elevation: '50m ELEVATION',
    title: 'Red Squirrel Campsite',
    destShort: 'Red Squirrel',
    region: 'Glen Coe, Lochaber • River Coe woodland',
    desc: 'Wild camping with hot water and showers. An iconic Glen Coe spot — wild, and wildly popular. The views are spectacular, the drive incredible, and the staff give a real Highland welcome at check-in. Riverside, forest and grass pitches. Book the pitch with Red Squirrel, send us your booking reference, and setup with us is pitch perfect.',
    suitability: 'Best for 4M (2 guests). Partner site, Deluxe setup',
    badge: 'Partner site',
    website: 'https://redsquirrelcampsite.co.uk/',
    journalSlug: 'red-squirrel-campsite-glencoe',
    gridRef: 'NN 105 577',
    miles: 108,
    minutes: 125,
    lat: 56.6825,
    lng: -5.1028,
    routeDesc: 'M80 / A82 north through Crianlarich and Glen Coe.',
    terrain: 'Wooded river-valley clearings. Easy enough once you have done a lap of the site.',
  }),
  durness: withMaps({
    key: 'durness',
    tag: 'SECRET GRID: NC 40* ***',
    img: '/campsite_durness_wild.jpg',
    elevation: '18m ELEVATION',
    title: 'Durness Coastal Spot',
    destShort: 'Durness',
    region: 'Sutherland, NC500 (Wild Spot)',
    desc: 'Secluded wild coastal headland with panoramic ocean sunset views over Balnakeil cliffs. We keep the exact pitch location private to protect the spot. The map below is the public road into Durness village, not the pitch.',
    suitability: '4M & 6M Tents (Bespoke Setup Only)',
    website: 'https://www.outdooraccess-scotland.scot/',
    gridRef: 'NC 40* ***',
    miles: 250,
    minutes: 310,
    lat: 58.5684,
    lng: -4.7467,
    routeDesc: 'A9 north through Inverness, A835 / A838 to Durness village. Exact pitch issued only on confirmed wild bookings.',
    terrain: 'Wild coastal bluff. Heavy storm anchoring required.',
  }),
};

export function getCampsiteRoute(key: string): CampsiteRoute | undefined {
  return CAMPSITE_ROUTES[key];
}
