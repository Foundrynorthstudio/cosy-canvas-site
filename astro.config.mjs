// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://cosycanvas.co.uk',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  redirects: {
    '/tents-packages': '/camping-hire',
    '/kids-parties': '/parties',
    '/blog': '/journal',
    '/about-us': '/about',
    '/gallery': '/camping-hire',
    '/camping-check-availability': '/booking',
    '/terms-conditions': '/terms',
    '/privacy-policy': '/privacy',
  },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [sitemap()]
});