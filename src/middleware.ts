import { defineMiddleware } from 'astro:middleware';
import { isValidStudioToken, STUDIO_COOKIE } from './lib/journal-auth';

const SECRET_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'ADMIN_NOTIFICATION_EMAIL',
  'JOURNAL_ADMIN_PASSWORD',
  'JOURNAL_SESSION_SECRET',
  'STUDIO_STAFF_INITIAL_PASSWORD',
  'BOOKING_CRON_SECRET',
  'GOOGLE_PLACES_API_KEY',
  'GOOGLE_PLACES_PLACE_ID',
  'PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'PUBLIC_DEPOT_W3W',
  'PUBLIC_GA4_MEASUREMENT_ID',
  'PUBLIC_META_PIXEL_ID',
] as const;

async function hydrateProcessEnvFromCloudflare() {
  if (typeof process === 'undefined' || !process.env) return;
  try {
    const { env } = await import('cloudflare:workers');
    const bindings = env as Record<string, unknown>;
    for (const key of SECRET_KEYS) {
      const value = bindings[key];
      if (typeof value === 'string' && value.trim()) {
        process.env[key] = value.trim();
      }
    }
  } catch {
    /* local Node / non-CF runtime */
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  await hydrateProcessEnvFromCloudflare();

  const { pathname } = context.url;
  const token = context.cookies.get(STUDIO_COOKIE)?.value;
  const authed = isValidStudioToken(token);

  if (pathname.startsWith('/studio') && pathname !== '/studio/login' && !authed) {
    return context.redirect(`/studio/login?next=${encodeURIComponent(pathname)}`);
  }

  if (pathname.startsWith('/api/studio') && pathname !== '/api/studio/login' && !authed) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return next();
});
