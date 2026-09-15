import type { APIRoute } from 'astro';
import { getAllPosts } from '../../lib/journal-store';

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://cosycanvasco.com';
  const posts = await getAllPosts();
  const items = posts
    .map((post) => {
      const url = `${origin}/journal/${post.slug}`;
      const image = post.image.startsWith('http') ? post.image : `${origin}${post.image}`;
      return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(post.isoDate).toUTCString()}</pubDate>
      <description>${xmlEscape(post.excerpt)}</description>
      <enclosure url="${xmlEscape(image)}" type="image/jpeg" />
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>The Cosy Journal</title>
    <link>${origin}/journal</link>
    <description>Scottish glamping guides, wedding villages, and canvas camping stories from The Cosy Canvas Co.</description>
    <language>en-gb</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
