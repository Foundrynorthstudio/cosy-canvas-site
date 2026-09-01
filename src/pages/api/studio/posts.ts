import type { APIRoute } from 'astro';
import { createPost, getAllPosts } from '../../../lib/journal-store';
import type { JournalCategory, JournalStatus } from '../../../lib/journal';

function parseBody(data: Record<string, unknown>) {
  return {
    title: String(data.title ?? ''),
    excerpt: String(data.excerpt ?? ''),
    content: String(data.content ?? ''),
    category: String(data.category ?? 'guides') as JournalCategory,
    authorName: String(data.authorName ?? ''),
    authorRole: String(data.authorRole ?? ''),
    authorAvatar: String(data.authorAvatar ?? ''),
    isoDate: String(data.isoDate ?? ''),
    featured: Boolean(data.featured),
    status: (data.status === 'published' ? 'published' : 'draft') as JournalStatus,
    image: String(data.image ?? ''),
    imageAlt: String(data.imageAlt ?? ''),
    seoTitle: String(data.seoTitle ?? ''),
    seoDescription: String(data.seoDescription ?? ''),
    keywords: String(data.keywords ?? ''),
    slug: data.slug ? String(data.slug) : undefined,
  };
}

export const GET: APIRoute = async () => {
  const posts = await getAllPosts(true);
  return new Response(JSON.stringify({ posts }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const input = parseBody(data);
  if (!input.title || !input.content || !input.excerpt) {
    return new Response(JSON.stringify({ error: 'Title, excerpt and content are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const post = await createPost(input);
  return new Response(JSON.stringify({ post }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
