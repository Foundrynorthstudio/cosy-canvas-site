import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
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
  return sanitizeHtml(withIds);
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
