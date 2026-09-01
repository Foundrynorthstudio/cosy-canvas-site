import type { APIRoute } from 'astro';
import { STUDIO_COOKIE } from '../../../lib/journal-auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(STUDIO_COOKIE, { path: '/' });
  return redirect('/studio/login');
};
