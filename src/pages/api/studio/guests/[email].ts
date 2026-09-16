import type { APIRoute } from 'astro';
import { parseStudioSession, STUDIO_COOKIE } from '../../../../lib/journal-auth';
import {
  upsertGuestProfile,
  type GuestCommsEntry,
  type GuestProfilePatch,
  type GuestRecommendation,
} from '../../../../lib/guest-store';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const raw = params.email || '';
  let email = raw;
  try {
    email = decodeURIComponent(raw).trim();
  } catch {
    email = raw.trim();
  }
  if (!email) {
    return new Response(JSON.stringify({ error: 'Guest email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = (await request.json().catch(() => ({}))) as GuestProfilePatch;
  const session = parseStudioSession(cookies.get(STUDIO_COOKIE)?.value);
  const author = session?.name || session?.email || '';

  const stampedComms = Array.isArray(body.comms)
    ? body.comms.map(
        (entry: GuestCommsEntry): GuestCommsEntry => ({
          ...entry,
          createdBy: entry.createdBy || author,
        }),
      )
    : body.comms;
  const stampedRecs = Array.isArray(body.recommendations)
    ? body.recommendations.map(
        (entry: GuestRecommendation): GuestRecommendation => ({
          ...entry,
          createdBy: entry.createdBy || author,
        }),
      )
    : body.recommendations;

  try {
    const saved = await upsertGuestProfile(email, {
      ...body,
      comms: stampedComms,
      recommendations: stampedRecs,
    });
    return new Response(JSON.stringify(saved), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Save failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
