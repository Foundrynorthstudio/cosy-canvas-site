import Stripe from 'stripe';
import { runtimeSecret, runtimeSecretSync } from './cloud-kv';

export function readSecretEnv(name: string): string {
  return runtimeSecretSync(name);
}

export function getStripeSecretKey(): string {
  return runtimeSecretSync('STRIPE_SECRET_KEY');
}

export async function getStripeSecretKeyAsync(): Promise<string> {
  return runtimeSecret('STRIPE_SECRET_KEY');
}

export function getStripePublishableKey(): string {
  return runtimeSecretSync('PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

export async function getStripePublishableKeyAsync(): Promise<string> {
  return runtimeSecret('PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

export function getStripe(): Stripe | null {
  const key = getStripeSecretKey();
  if (!key || key.startsWith('sk_test_placeholder')) return null;
  return new Stripe(key);
}

export async function getStripeAsync(): Promise<Stripe | null> {
  const key = await getStripeSecretKeyAsync();
  if (!key || key.startsWith('sk_test_placeholder')) return null;
  return new Stripe(key);
}
