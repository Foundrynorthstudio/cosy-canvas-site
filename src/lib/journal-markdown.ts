import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

function sanitizeHtml(html: string): string {
  const youtube: string[] = [];
  const withPlaceholders = html.replace(
    /<iframe\b[^>]*\bsrc="https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[A-Za-z0-9_-]+[^"]*"[^>]*>[\s\S]*?<\/iframe>/gi,
    (match) => {
      youtube.push(match);
      return `<!--yt-embed-${youtube.length - 1}-->`;
    },
  );
  let cleaned = withPlaceholders
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
  youtube.forEach((embed, index) => {
    cleaned = cleaned.replace(`<!--yt-embed-${index}-->`, embed);
  });
  return cleaned;
}

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([2-3])>([\s\S]*?)<\/h\1>/gi, (_match, level, inner) => {
    const id = headingId(inner);
    return id ? `<h${level} id="${id}">${inner}</h${level}>` : `<h${level}>${inner}</h${level}>`;
  });
}

export async function renderJournalMarkdown(markdown: string): Promise<string> {
  const html = await marked.parse(markdown ?? '');
  const withIds = addHeadingIds(typeof html === 'string' ? html : '');
  const withExternal = withIds.replace(
    /<a href="(https?:[^"]+)"/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer"',
  );
  return sanitizeHtml(withExternal);
}

export function extractHeadings(markdown: string): { id: string; text: string }[] {
  const headings: { id: string; text: string }[] = [];
  for (const line of markdown.split('\n')) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const text = match[2].replace(/[*_`]/g, '').trim();
    const id = headingId(text);
    if (id) headings.push({ id, text });
  }
  return headings;
}
