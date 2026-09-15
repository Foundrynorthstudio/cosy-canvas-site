// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://cosycanvasco.com',
  output: 'server',
  adapter: netlify(),
  trailingSlash: 'never',
  redirects: {
    '/tents-packages': '/camping-hire',
    '/tents-packages/': '/camping-hire',
    '/kids-parties': '/parties',
    '/kids-parties/': '/parties',
    '/blog': '/journal',
    '/blog/': '/journal',
    '/blog/page/[...page]': '/journal',
    '/about-us': '/about',
    '/about-us/': '/about',
    '/gallery': '/camping-hire',
    '/gallery/': '/camping-hire',
    '/shop': '/camping-hire',
    '/shop/': '/camping-hire',
    '/camping-check-availability': '/booking',
    '/camping-check-availability/': '/booking',
    '/terms-conditions': '/terms',
    '/terms-conditions/': '/terms',
    '/privacy-policy': '/privacy',
    '/privacy-policy/': '/privacy',
    '/product/4m-bell-tent-rental': '/camping-hire',
    '/product/4m-bell-tent-rental/': '/camping-hire',
    '/feed': '/journal/rss.xml',
    '/feed/': '/journal/rss.xml',
    '/bed-tent': '/journal',
    '/bed-tent/': '/journal',
    '/glamping-tents': '/camping-hire',
    '/glamping-tents/': '/camping-hire',
    '/party-tent': '/parties',
    '/party-tent/': '/parties',
    '/teepee': '/parties',
    '/teepee/': '/parties',
    '/pop-up-tent': '/camping-hire',
    '/pop-up-tent/': '/camping-hire',
    '/new-forest-camping': '/campsites',
    '/new-forest-camping/': '/campsites',
    '/create-unforgettable-kids-birthdays-with-these-5-bell-tent-party-themes': '/parties',
    '/create-unforgettable-kids-birthdays-with-these-5-bell-tent-party-themes/': '/parties',
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
