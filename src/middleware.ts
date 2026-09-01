import { defineMiddleware } from 'astro:middleware';
import { isValidStudioToken, STUDIO_COOKIE } from './lib/journal-auth';

export const onRequest = defineMiddleware(async (context, next) => {
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
