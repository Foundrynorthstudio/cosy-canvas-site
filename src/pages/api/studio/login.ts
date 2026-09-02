import type { APIRoute } from 'astro';
import {
  createStudioToken,
  studioCookieOptions,
  studioPasswordConfigured,
  STUDIO_COOKIE,
  verifyStudioPassword,
} from '../../../lib/journal-auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  const nextPath = String(form.get('next') ?? '/studio/bookings');
  const safeNext = nextPath.startsWith('/studio') ? nextPath : '/studio';

  if (!studioPasswordConfigured()) {
    return redirect('/studio/login?error=config');
  }

  if (!verifyStudioPassword(password)) {
    return redirect(`/studio/login?error=invalid&next=${encodeURIComponent(safeNext)}`);
  }

  cookies.set(STUDIO_COOKIE, createStudioToken(), studioCookieOptions(import.meta.env.PROD));
  return redirect(safeNext);
};
