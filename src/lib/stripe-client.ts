import Stripe from 'stripe';

export function readSecretEnv(name: string): string {
  const fromProcess = process.env[name];
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return (fromProcess || fromMeta || '').trim();
}

export function getStripeSecretKey(): string {
  return readSecretEnv('STRIPE_SECRET_KEY');
}

export function getStripe(): Stripe | null {
  const key = getStripeSecretKey();
  if (!key || key.startsWith('sk_test_placeholder')) return null;
  return new Stripe(key);
}
