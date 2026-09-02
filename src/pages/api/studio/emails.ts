import type { APIRoute } from 'astro';
import { mergeMailSettings } from '../../../lib/booking-mail';
import { getMailSettings, saveMailSettings } from '../../../lib/booking-mail-settings';

export const GET: APIRoute = async () => {
  const settings = await getMailSettings();
  return new Response(JSON.stringify(settings), { headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const saved = await saveMailSettings(mergeMailSettings(body));
  return new Response(JSON.stringify(saved), { headers: { 'Content-Type': 'application/json' } });
};
