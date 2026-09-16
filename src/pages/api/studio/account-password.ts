import type { APIRoute } from 'astro';
import {
  createStudioToken,
  parseStudioSession,
  STUDIO_COOKIE,
  studioCookieOptions,
} from '../../../lib/journal-auth';
import { updateStaffPassword } from '../../../lib/staff-store';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = parseStudioSession(cookies.get(STUDIO_COOKIE)?.value);
  if (!session?.email) {
    return redirect('/studio/login?error=invalid');
  }

  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');

  if (password.length < 12) {
    return redirect('/studio/account?error=short');
  }
  if (password !== confirm) {
    return redirect('/studio/account?error=mismatch');
  }

  const updated = await updateStaffPassword(session.email, password);
  if (!updated) {
    return redirect('/studio/account?error=missing');
  }

  cookies.set(
    STUDIO_COOKIE,
    createStudioToken({ email: updated.email, name: updated.name, role: updated.role }),
    studioCookieOptions(import.meta.env.PROD),
  );
  return redirect('/studio/account?ok=1');
};
