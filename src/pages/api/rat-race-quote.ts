import type { APIRoute } from 'astro';
import { isRatRacePackage, quoteRatRace } from '../../lib/rat-race';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const packageKind = isRatRacePackage(data.packageKind) ? data.packageKind : 'deluxe';
  const quote = quoteRatRace({
    guests: Number(data.guests) || 5,
    packageKind,
  });
  return new Response(JSON.stringify(quote), { headers: { 'Content-Type': 'application/json' } });
};
