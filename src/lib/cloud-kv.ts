/**
 * JSON + text persistence for Cosy Studio.
 * Prefers Cloudflare KV (COSY_DATA), falls back to local `.data/` for `astro dev`.
 */
type KvNamespaceLike = {
  get(key: string, type?: 'text' | 'json'): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
};

type CfEnv = {
  COSY_DATA?: KvNamespaceLike;
  [key: string]: unknown;
};

let cachedEnv: CfEnv | null | undefined;

async function cloudflareEnv(): Promise<CfEnv | null> {
  if (cachedEnv !== undefined) return cachedEnv;
  try {
    const mod = await import('cloudflare:workers');
    cachedEnv = (mod as { env: CfEnv }).env ?? null;
  } catch {
    cachedEnv = null;
  }
  return cachedEnv;
}

export async function getKv(): Promise<KvNamespaceLike | null> {
  const env = await cloudflareEnv();
  return env?.COSY_DATA ?? null;
}

/** Runtime secrets/vars from Workers bindings, then process / import.meta. */
export async function runtimeSecret(name: string): Promise<string> {
  const env = await cloudflareEnv();
  const fromCf = env?.[name];
  if (typeof fromCf === 'string' && fromCf.trim()) return fromCf.trim();
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  let fromMeta: string | undefined;
  try {
    fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  } catch {
    fromMeta = undefined;
  }
  return (fromProcess || fromMeta || '').trim();
}

export function runtimeSecretSync(name: string): string {
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  let fromMeta: string | undefined;
  try {
    fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  } catch {
    fromMeta = undefined;
  }
  try {
    // Sync path for request handlers: CF injects bindings onto globalThis in some runtimes.
    const g = globalThis as { COSY_DATA?: unknown } & Record<string, unknown>;
    const fromGlobal = g[name];
    if (typeof fromGlobal === 'string' && fromGlobal.trim()) return fromGlobal.trim();
  } catch {
    /* ignore */
  }
  return (fromProcess || fromMeta || '').trim();
}

async function localRead(fileName: string): Promise<string | null> {
  try {
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    return await readFile(join(process.cwd(), '.data', fileName), 'utf8');
  } catch {
    return null;
  }
}

async function localWrite(fileName: string, raw: string): Promise<void> {
  const { mkdir, writeFile } = await import('node:fs/promises');
  const { join, dirname } = await import('node:path');
  const file = join(process.cwd(), '.data', fileName);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, raw, 'utf8');
}

/** Stable KV keys (and matching local filenames for JSON stores). */
export const STORE_KEYS = {
  bookings: { kv: 'bookings-v1.json', local: 'bookings.json' },
  guests: { kv: 'guest-crm-v1.json', local: 'guest-crm.json' },
  journal: { kv: 'posts-v1.json', local: 'journal-posts.json' },
  staff: { kv: 'staff-v1.json', local: 'studio-staff.json' },
  mail: { kv: 'mail-settings-v1.json', local: 'mail-settings.json' },
} as const;

export async function readJsonStore<T>(store: keyof typeof STORE_KEYS): Promise<T | null> {
  const { kv, local } = STORE_KEYS[store];
  try {
    const namespace = await getKv();
    if (namespace) {
      const data = await namespace.get(kv, 'json');
      if (data != null) return data as T;
    }
  } catch (error) {
    console.error(`[cloud-kv] read ${kv} failed`, error);
  }
  const raw = await localRead(local);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJsonStore(store: keyof typeof STORE_KEYS, value: unknown): Promise<boolean> {
  const { kv, local } = STORE_KEYS[store];
  const raw = JSON.stringify(value, null, 2);
  try {
    const namespace = await getKv();
    if (namespace) {
      await namespace.put(kv, raw);
      return true;
    }
  } catch (error) {
    console.error(`[cloud-kv] write ${kv} failed`, error);
  }
  try {
    await localWrite(local, raw);
    return true;
  } catch (error) {
    console.error(`[cloud-kv] local write ${local} failed`, error);
    return false;
  }
}

export async function readTextKey(key: string): Promise<string | null> {
  try {
    const namespace = await getKv();
    if (namespace) {
      const data = await namespace.get(key, 'text');
      if (typeof data === 'string') return data;
    }
  } catch {
    /* local */
  }
  return localRead(key.replace(/\//g, '__'));
}

export async function writeTextKey(key: string, value: string): Promise<boolean> {
  try {
    const namespace = await getKv();
    if (namespace) {
      await namespace.put(key, value);
      return true;
    }
  } catch (error) {
    console.error(`[cloud-kv] write text ${key} failed`, error);
  }
  try {
    await localWrite(key.replace(/\//g, '__'), value);
    return true;
  } catch {
    return false;
  }
}
