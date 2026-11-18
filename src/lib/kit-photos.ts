import { readTextKey, writeTextKey } from './cloud-kv';

function safePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function photoKey(ref: string, sku: string): string {
  return `kit-photo/${safePart(ref)}/${safePart(sku)}`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(raw: string): Uint8Array {
  const binary = atob(raw);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
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
    bytes: toBase64(bytes),
  });
  await writeTextKey(photoKey(ref, sku), payload);
  return name;
}

export async function readKitPhoto(
  ref: string,
  sku: string,
): Promise<{ contentType: string; bytes: Uint8Array } | null> {
  const raw = await readTextKey(photoKey(ref, sku));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { contentType: string; bytes: string };
    return { contentType: parsed.contentType, bytes: fromBase64(parsed.bytes) };
  } catch {
    return null;
  }
}
