import type { APIRoute } from 'astro';
import { sendDueBalanceReminders } from '../../../../lib/booking-reminders';

export const POST: APIRoute = async ({ url }) => {
  const sent = await sendDueBalanceReminders(url.origin);
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
};
