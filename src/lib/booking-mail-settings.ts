import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { mergeMailSettings, type MailSettings } from './booking-mail';

const BLOB_STORE = 'cosy-bookings';
const BLOB_KEY = 'mail-settings-v1.json';
const LOCAL_DIR = path.join(process.cwd(), '.data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'mail-settings.json');

let writeChain: Promise<void> = Promise.resolve();
let memory: MailSettings | null = null;

async function readLocal(): Promise<MailSettings | null> {
  try {
    const raw = await readFile(LOCAL_FILE, 'utf8');
    return mergeMailSettings(JSON.parse(raw) as Partial<MailSettings>);
  } catch {
    return null;
  }
}

async function writeLocal(settings: MailSettings): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

async function readBlobs(): Promise<MailSettings | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    const data = await store.get(BLOB_KEY, { type: 'json' });
    return data ? mergeMailSettings(data as Partial<MailSettings>) : null;
  } catch {
    return null;
  }
}

async function writeBlobs(settings: MailSettings): Promise<boolean> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    await store.setJSON(BLOB_KEY, settings);
    return true;
  } catch {
    return false;
  }
}

export async function getMailSettings(): Promise<MailSettings> {
  if (memory) return memory;
  const fromBlobs = await readBlobs();
  if (fromBlobs) {
    memory = fromBlobs;
    return fromBlobs;
  }
  const fromDisk = await readLocal();
  memory = fromDisk || mergeMailSettings();
  return memory;
}

export async function saveMailSettings(next: MailSettings): Promise<MailSettings> {
  const run = writeChain.then(async () => {
    const settings = mergeMailSettings(next);
    memory = settings;
    const blobOk = await writeBlobs(settings);
    if (!blobOk) await writeLocal(settings);
    return settings;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
