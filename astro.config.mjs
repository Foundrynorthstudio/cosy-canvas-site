// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://cosycanvasco.com',
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: {
      enabled: true,
    },
  }),
  trailingSlash: 'never',
  // One entry per path — Cloudflare rejects duplicate _redirects (slash + no-slash both collapse with trailingSlash: 'never').
  redirects: {
    '/tents-packages': '/camping-hire',
    '/kids-parties': '/parties',
    '/blog': '/journal',
    '/about-us': '/about',
    '/gallery': '/camping-hire',
    '/shop': '/camping-hire',
    '/camping-check-availability': '/booking',
    '/terms-conditions': '/terms',
    '/privacy-policy': '/privacy',
    '/product/4m-bell-tent-rental': '/camping-hire',
    '/feed': '/journal/rss.xml',
    '/bed-tent': '/journal',
    '/glamping-tents': '/camping-hire',
    '/party-tent': '/parties',
    '/teepee': '/parties',
    '/pop-up-tent': '/camping-hire',
    '/new-forest-camping': '/campsites',
    '/create-unforgettable-kids-birthdays-with-these-5-bell-tent-party-themes': '/parties',
  },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [sitemap({
    filter: (page) =>
      !page.includes('/studio') &&
      !page.includes('/api/') &&
      !page.includes('/booking/success'),
  })]
});
