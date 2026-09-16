import type { APIRoute } from 'astro';
import {
  createStudioToken,
  studioCookieOptions,
  studioPasswordConfigured,
  STUDIO_COOKIE,
  verifyPassword,
  verifyStudioPassword,
} from '../../../lib/journal-auth';
import { getStaffByEmail } from '../../../lib/staff-store';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    const nextPath = String(form.get('next') ?? '/studio/bookings');
    const safeNext = nextPath.startsWith('/studio') ? nextPath : '/studio';

    if (!studioPasswordConfigured() && !email) {
      return redirect('/studio/login?error=config');
    }

    // Named staff login
    if (email) {
      const staff = await getStaffByEmail(email);
      if (!staff || !verifyPassword(password, staff.passwordHash)) {
        return redirect(`/studio/login?error=invalid&next=${encodeURIComponent(safeNext)}`);
      }
      cookies.set(
        STUDIO_COOKIE,
        createStudioToken({ email: staff.email, name: staff.name, role: 'admin' }),
        studioCookieOptions(import.meta.env.PROD),
      );
      return redirect(safeNext);
    }

    // Break-glass: password only (no email)
    if (!verifyStudioPassword(password)) {
      return redirect(`/studio/login?error=invalid&next=${encodeURIComponent(safeNext)}`);
    }

    cookies.set(STUDIO_COOKIE, createStudioToken(), studioCookieOptions(import.meta.env.PROD));
    return redirect(safeNext);
  } catch (error) {
    console.error('[studio/login] failed', error);
    return redirect('/studio/login?error=invalid');
  }
};
