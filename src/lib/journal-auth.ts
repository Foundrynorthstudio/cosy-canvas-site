import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const STUDIO_COOKIE = 'cc_studio';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type StudioSession = {
  email: string | null;
  name: string;
  role: 'admin';
};

export function readAuthEnv(name: string): string {
  const fromProcess = process.env[name];
  let fromMeta: string | undefined;
  try {
    fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  } catch {
    fromMeta = undefined;
  }
  return (fromProcess || fromMeta || '').trim();
}

function adminPassword(): string {
  return readAuthEnv('JOURNAL_ADMIN_PASSWORD');
}

function secret(): string {
  return readAuthEnv('JOURNAL_SESSION_SECRET') || adminPassword();
}

export function studioPasswordConfigured(): boolean {
  return Boolean(adminPassword()) || Boolean(readAuthEnv('STUDIO_STAFF_INITIAL_PASSWORD'));
}

function hmac(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function b64url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromB64url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function signedToken(payload: string): string {
  return hmac(payload);
}

export function tokenMatches(payload: string, token: string): boolean {
  if (!token || !secret()) return false;
  return safeEqual(hmac(payload), token);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!password || !stored) return false;
  const [algo, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  try {
    const next = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    if (expected.length !== next.length) return false;
    return timingSafeEqual(expected, next);
  } catch {
    return false;
  }
}

export function verifyStudioPassword(password: string): boolean {
  const expected = adminPassword();
  if (!expected || !password) return false;
  return safeEqual(password, expected);
}

export function createStudioToken(session?: StudioSession): string {
  const exp = Date.now() + SESSION_TTL_MS;
  if (!session?.email) {
    const payload = `studio.${exp}`;
    return `${payload}.${hmac(payload)}`;
  }
  const payload = `staff.${b64url(session.email)}.${b64url(session.name)}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

export function parseStudioSession(token: string | undefined | null): StudioSession | null {
  if (!token || !secret()) return null;
  const lastDot = token.lastIndexOf('.');
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!safeEqual(hmac(payload), sig)) return null;

  const parts = payload.split('.');
  if (parts[0] === 'studio' && parts.length === 2) {
    const exp = Number(parts[1]);
    if (!Number.isFinite(exp) || Date.now() >= exp) return null;
    return { email: null, name: 'Break-glass admin', role: 'admin' };
  }

  if (parts[0] === 'staff' && parts.length === 4) {
    const exp = Number(parts[3]);
    if (!Number.isFinite(exp) || Date.now() >= exp) return null;
    try {
      const email = fromB64url(parts[1]);
      const name = fromB64url(parts[2]);
      if (!email) return null;
      return { email, name, role: 'admin' };
    } catch {
      return null;
    }
  }

  return null;
}

export function isValidStudioToken(token: string | undefined | null): boolean {
  return Boolean(parseStudioSession(token));
}

export function studioCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}
