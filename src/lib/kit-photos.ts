import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function safePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function blobKey(ref: string, sku: string): string {
  return `kit-photo/${safePart(ref)}/${safePart(sku)}`;
}

function localFile(ref: string, sku: string): string {
  return path.join(process.cwd(), '.data', 'kit-photos', safePart(ref), safePart(sku));
}

export async function saveKitPhoto(
  ref: string,
  sku: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const name = `${safePart(sku)}.bin`;
  const payload = JSON.stringify({
    contentType: contentType || 'image/jpeg',
    bytes: Buffer.from(bytes).toString('base64'),
  });
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('cosy-bookings');
    await store.set(blobKey(ref, sku), payload);
    return name;
  } catch {
    const file = localFile(ref, sku);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, payload, 'utf8');
    return name;
  }
}

export async function readKitPhoto(
  ref: string,
  sku: string,
): Promise<{ contentType: string; bytes: Buffer } | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('cosy-bookings');
    const raw = await store.get(blobKey(ref, sku), { type: 'text' });
    if (raw) {
      const parsed = JSON.parse(raw) as { contentType: string; bytes: string };
      return { contentType: parsed.contentType, bytes: Buffer.from(parsed.bytes, 'base64') };
    }
  } catch {
    /* local fallback */
  }
  try {
    const raw = await readFile(localFile(ref, sku), 'utf8');
    const parsed = JSON.parse(raw) as { contentType: string; bytes: string };
    return { contentType: parsed.contentType, bytes: Buffer.from(parsed.bytes, 'base64') };
  } catch {
    return null;
  }
}
