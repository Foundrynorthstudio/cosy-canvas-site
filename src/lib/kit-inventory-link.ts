import { signedToken, tokenMatches } from './journal-auth';

export function kitInventoryPayload(ref: string): string {
  return `kit-inventory.${ref}`;
}

export function kitInventoryPublicUrl(origin: string, ref: string): string {
  const token = signedToken(kitInventoryPayload(ref));
  return `${origin}/api/kit-inventory/${encodeURIComponent(ref)}?t=${token}`;
}

export function kitInventoryTokenValid(ref: string, token: string | null): boolean {
  return tokenMatches(kitInventoryPayload(ref), token || '');
}
