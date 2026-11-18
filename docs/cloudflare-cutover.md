# Cosy Canvas → Cloudflare cutover

Staging Worker (live now):

https://cosy-canvas-site.wandering-sunset-8b84.workers.dev

Account: `Hello@foundrynorthstudio.com's Account` (`5722000f882f8635263687ba35892740`)

## What's done
- Astro adapter switched to `@astrojs/cloudflare`
- Netlify Blobs replaced with KV `COSY_DATA`
- Local bookings JSON seeded into KV
- Worker deployed on Foundry North Cloudflare

## Before DNS cutover
1. Copy production secrets from Netlify → Cloudflare Worker secrets (`wrangler secret put …`):
   - `STRIPE_SECRET_KEY`
   - `PUBLIC_STRIPE_PUBLISHABLE_KEY` (also add as a Wrangler `vars` entry if the client build needs it)
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `JOURNAL_ADMIN_PASSWORD` / `JOURNAL_SESSION_SECRET` (if not already set)
   - `GOOGLE_PLACES_API_KEY` / `GOOGLE_PLACES_PLACE_ID` if used
2. In Stripe Dashboard, add webhook endpoint:
   `https://cosycanvasco.com/api/stripe-webhook` (keep Netlify URL until cutover completes)
3. Smoke-test staging: homepage, `/events/rat-race`, `/booking`, `/studio/login`

## GoDaddy DNS (cutover)
Prefer Cloudflare nameservers for the zone (Workers custom domain is simplest):

1. Cloudflare Dashboard → Workers → `cosy-canvas-site` → **Custom domains** → add `cosycanvasco.com` and `www.cosycanvasco.com`
2. Cloudflare will show nameservers — set those in GoDaddy for the domain
3. Wait for SSL + DNS propagation
4. Verify Search Console still lists `https://cosycanvasco.com` (canonicals already use this host)
5. Retire Netlify site once stable

## Deploy commands
```bash
npm run build
npx wrangler deploy
node scripts/seed-cf-kv.mjs   # only when re-seeding JSON stores
```
