import type { APIRoute } from 'astro';
import { deletePost, updatePost } from '../../../../lib/journal-store';
import type { JournalCategory, JournalStatus } from '../../../../lib/journal';

export const PUT: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  }

  const data = await request.json();
  const post = await updatePost(slug, {
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
    slug,
  });

  if (!post) {
    return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ post }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  }
  const ok = await deletePost(slug);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
