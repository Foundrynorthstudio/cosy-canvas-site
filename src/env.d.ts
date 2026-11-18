type CosyKv = {
  get(key: string, type?: 'text' | 'json'): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
};

type Env = {
  COSY_DATA: CosyKv;
  ASSETS: Fetcher;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  ADMIN_NOTIFICATION_EMAIL?: string;
  JOURNAL_ADMIN_PASSWORD?: string;
  JOURNAL_SESSION_SECRET?: string;
  STUDIO_STAFF_INITIAL_PASSWORD?: string;
  BOOKING_CRON_SECRET?: string;
  GOOGLE_PLACES_API_KEY?: string;
  GOOGLE_PLACES_PLACE_ID?: string;
  PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  PUBLIC_DEPOT_W3W?: string;
  PUBLIC_GA4_MEASUREMENT_ID?: string;
  PUBLIC_META_PIXEL_ID?: string;
};

declare namespace Cloudflare {
  interface Env extends Env {}
}

declare module 'cloudflare:workers' {
  export const env: Env;
}
