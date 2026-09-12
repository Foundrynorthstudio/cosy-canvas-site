import type { APIRoute } from 'astro';
import { isRatRacePackage, quoteRatRace, type RatRaceNights } from '../../lib/rat-race';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const nights: RatRaceNights = Number(data.nights) === 3 ? 3 : 2;
  const packageKind = isRatRacePackage(data.packageKind) ? data.packageKind : 'budget';
  const quote = quoteRatRace({
    guests: Number(data.guests) || 1,
    packageKind,
    nights,
  });
  return new Response(JSON.stringify(quote), { headers: { 'Content-Type': 'application/json' } });
};
