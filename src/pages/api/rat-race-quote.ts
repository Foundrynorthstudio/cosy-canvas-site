import type { APIRoute } from 'astro';
import { getAllBookings } from '../../lib/booking-store';
import {
  quoteRatRace,
  ratRaceInventoryFromBookings,
} from '../../lib/rat-race';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const inventory = ratRaceInventoryFromBookings(await getAllBookings());
  const quote = quoteRatRace({
    tents: data.tents,
    guests: Number(data.guests) || undefined,
    packageKind: data.packageKind,
    inventory,
  });
  return new Response(JSON.stringify(quote), { headers: { 'Content-Type': 'application/json' } });
};
