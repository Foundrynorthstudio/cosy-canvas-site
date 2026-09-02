import type { APIRoute } from 'astro';
import { sendDueBalanceReminders } from '../../../lib/booking-reminders';
import { readSecretEnv } from '../../../lib/stripe-client';

export const POST: APIRoute = async ({ request, url }) => {
  const cronSecret = readSecretEnv('BOOKING_CRON_SECRET');
  const header = request.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (!cronSecret || token !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401 });
  }
  const sent = await sendDueBalanceReminders(url.origin);
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
};
