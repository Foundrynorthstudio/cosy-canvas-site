import { createHmac, timingSafeEqual } from 'node:crypto';

export const STUDIO_COOKIE = 'cc_studio';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function readEnv(name: string): string {
  const fromProcess = process.env[name];
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return (fromProcess || fromMeta || '').trim();
}

function adminPassword(): string {
  return readEnv('JOURNAL_ADMIN_PASSWORD');
}

function secret(): string {
  return readEnv('JOURNAL_SESSION_SECRET') || adminPassword();
}

export function studioPasswordConfigured(): boolean {
  return Boolean(adminPassword());
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

export function verifyStudioPassword(password: string): boolean {
  const expected = adminPassword();
  if (!expected || !password) return false;
  return safeEqual(password, expected);
}

export function createStudioToken(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `studio.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

export function isValidStudioToken(token: string | undefined | null): boolean {
  if (!token || !secret()) return false;
  const lastDot = token.lastIndexOf('.');
  if (lastDot <= 0) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!safeEqual(hmac(payload), sig)) return false;
  const exp = Number(payload.split('.')[1]);
  return Number.isFinite(exp) && Date.now() < exp;
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
