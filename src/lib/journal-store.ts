import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  CATEGORY_LABELS,
  estimateReadTime,
  formatJournalDate,
  SEED_POSTS,
  slugify,
  type JournalCategory,
  type JournalPost,
  type JournalStatus,
} from './journal';

const BLOB_STORE = 'cosy-journal';
const BLOB_KEY = 'posts-v1.json';
const LOCAL_DIR = path.join(process.cwd(), '.data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'journal-posts.json');

interface JournalStoreFile {
  posts: JournalPost[];
}

let writeChain: Promise<void> = Promise.resolve();

function sortPosts(posts: JournalPost[]): JournalPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime(),
  );
}

async function readLocalFile(): Promise<JournalPost[] | null> {
  try {
    const raw = await readFile(LOCAL_FILE, 'utf8');
    const parsed = JSON.parse(raw) as JournalStoreFile;
    return Array.isArray(parsed.posts) ? parsed.posts : null;
  } catch {
    return null;
  }
}

async function writeLocalFile(posts: JournalPost[]): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify({ posts }, null, 2), 'utf8');
}

async function readBlobs(): Promise<JournalPost[] | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    const data = await store.get(BLOB_KEY, { type: 'json' });
    if (data && Array.isArray((data as JournalStoreFile).posts)) {
      return (data as JournalStoreFile).posts;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeBlobs(posts: JournalPost[]): Promise<boolean> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    await store.setJSON(BLOB_KEY, { posts });
    return true;
  } catch {
    return false;
  }
}

function seedPosts(): JournalPost[] {
  return sortPosts(structuredClone(SEED_POSTS));
}

async function loadPosts(): Promise<JournalPost[]> {
  try {
    const fromBlobs = await readBlobs();
    if (fromBlobs && fromBlobs.length > 0) return sortPosts(fromBlobs);

    const fromDisk = await readLocalFile();
    if (fromDisk && fromDisk.length > 0) return sortPosts(fromDisk);
  } catch (error) {
    console.error('Journal store read failed; using built-in stories.', error);
  }
  return seedPosts();
}

async function persist(posts: JournalPost[]): Promise<void> {
  const sorted = sortPosts(posts);
  const blobOk = await writeBlobs(sorted);
  if (blobOk) return;
  try {
    await writeLocalFile(sorted);
  } catch (error) {
    console.error('Journal store persist failed.', error);
  }
}

function enqueueWrite<T>(work: () => Promise<T>): Promise<T> {
  const run = writeChain.then(work, work);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function getAllPosts(includeDrafts = false): Promise<JournalPost[]> {
  const posts = await loadPosts();
  if (includeDrafts) return posts;
  return posts.filter((post) => post.status === 'published');
}

export async function getPostBySlug(
  slug: string,
  includeDrafts = false,
): Promise<JournalPost | undefined> {
  const posts = await getAllPosts(includeDrafts);
  return posts.find((post) => post.slug === slug);
}

export async function getRelatedPosts(post: JournalPost, limit = 3): Promise<JournalPost[]> {
  const posts = await getAllPosts();
  return posts
    .filter((candidate) => candidate.slug !== post.slug && candidate.category === post.category)
    .slice(0, limit);
}

export interface JournalPostInput {
  title: string;
  excerpt: string;
  content: string;
  category: JournalCategory;
  authorName?: string;
  authorRole?: string;
  authorAvatar?: string;
  isoDate?: string;
  featured?: boolean;
  status?: JournalStatus;
  image: string;
  imageAlt: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  slug?: string;
}

function buildPost(input: JournalPostInput, existing?: JournalPost): JournalPost {
  const isoDate = input.isoDate || existing?.isoDate || new Date().toISOString();
  const slugBase = input.slug || existing?.slug || slugify(input.title);
  const category = input.category;
  const excerpt = input.excerpt.trim();
  const content = input.content;
  const title = input.title.trim();

  return {
    slug: slugBase,
    title,
    excerpt,
    content,
    category,
    categoryName: CATEGORY_LABELS[category],
    author: {
      name: input.authorName?.trim() || existing?.author.name || 'The Cosy Canvas Co.',
      role: input.authorRole?.trim() || existing?.author.role || 'Scottish Bell Tent Specialists',
      avatar: input.authorAvatar || existing?.author.avatar,
    },
    date: formatJournalDate(isoDate),
    isoDate,
    updatedIso: existing ? new Date().toISOString() : undefined,
    readTime: estimateReadTime(content),
    featured: Boolean(input.featured),
    status: input.status ?? existing?.status ?? 'draft',
    image: input.image.trim() || '/cosy_canvas_hero_coastal_pitch.jpg',
    imageAlt: input.imageAlt.trim() || title,
    seoTitle: (input.seoTitle || title).trim(),
    seoDescription: (input.seoDescription || excerpt).trim().slice(0, 160),
    keywords: (input.keywords || '').trim(),
  };
}

export async function createPost(input: JournalPostInput): Promise<JournalPost> {
  return enqueueWrite(async () => {
    const posts = await loadPosts();
    let slug = slugify(input.slug || input.title);
    if (posts.some((post) => post.slug === slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    const post = buildPost({ ...input, slug });
    if (post.featured) {
      for (const item of posts) item.featured = false;
    }
    posts.unshift(post);
    await persist(posts);
    return post;
  });
}

export async function updatePost(
  slug: string,
  input: JournalPostInput,
): Promise<JournalPost | null> {
  return enqueueWrite(async () => {
    const posts = await loadPosts();
    const index = posts.findIndex((post) => post.slug === slug);
    if (index === -1) return null;
    const next = buildPost({ ...input, slug }, posts[index]);
    if (next.featured) {
      for (const item of posts) item.featured = item.slug === slug;
    }
    posts[index] = next;
    await persist(posts);
    return next;
  });
}

export async function deletePost(slug: string): Promise<boolean> {
  return enqueueWrite(async () => {
    const posts = await loadPosts();
    const next = posts.filter((post) => post.slug !== slug);
    if (next.length === posts.length) return false;
    await persist(next);
    return true;
  });
}
