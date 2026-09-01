import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/journal-store';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://cosycanvas.co.uk';
  const posts = await getAllPosts();
  const urls = posts
    .map(
      (post) => `  <url>
    <loc>${origin}/journal/${post.slug}</loc>
    <lastmod>${(post.updatedIso || post.isoDate).slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/journal</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
