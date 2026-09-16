import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { hashPassword, readAuthEnv } from './journal-auth';

const BLOB_STORE = 'cosy-staff';
const BLOB_KEY = 'staff-v1.json';
const LOCAL_DIR = path.join(process.cwd(), '.data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'studio-staff.json');

export type StaffRole = 'admin';

export interface StaffUser {
  email: string;
  name: string;
  role: StaffRole;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffStoreFile {
  users: StaffUser[];
}

/** Cofounder accounts — full Studio admin. */
export const SEED_STAFF: { email: string; name: string; role: StaffRole }[] = [
  { email: 'jeremie@cosycanvasco.com', name: 'Jeremie', role: 'admin' },
  { email: 'hello@cosycanvasco.com', name: 'Trystan', role: 'admin' },
];

let writeChain: Promise<void> = Promise.resolve();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function readLocalFile(): Promise<StaffUser[] | null> {
  try {
    const raw = await readFile(LOCAL_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StaffStoreFile;
    return Array.isArray(parsed.users) ? parsed.users : null;
  } catch {
    return null;
  }
}

async function writeLocalFile(users: StaffUser[]): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify({ users }, null, 2), 'utf8');
}

async function readBlobs(): Promise<StaffUser[] | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    const data = await store.get(BLOB_KEY, { type: 'json' });
    if (data && Array.isArray((data as StaffStoreFile).users)) {
      return (data as StaffStoreFile).users;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeBlobs(users: StaffUser[]): Promise<boolean> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    await store.setJSON(BLOB_KEY, { users });
    return true;
  } catch {
    return false;
  }
}

async function persist(users: StaffUser[]): Promise<void> {
  writeChain = writeChain.then(async () => {
    await writeLocalFile(users);
    await writeBlobs(users);
  });
  await writeChain;
}

function bootstrapPassword(): string {
  return readAuthEnv('STUDIO_STAFF_INITIAL_PASSWORD') || readAuthEnv('JOURNAL_ADMIN_PASSWORD');
}

async function seedMissing(existing: StaffUser[]): Promise<{ users: StaffUser[]; added: boolean }> {
  const byEmail = new Map(existing.map((user) => [normalizeEmail(user.email), user]));
  const bootstrap = bootstrapPassword();
  if (!bootstrap) return { users: existing, added: false };

  let added = false;
  const now = new Date().toISOString();
  for (const seed of SEED_STAFF) {
    const key = normalizeEmail(seed.email);
    if (byEmail.has(key)) continue;
    byEmail.set(key, {
      email: key,
      name: seed.name,
      role: seed.role,
      passwordHash: hashPassword(bootstrap),
      createdAt: now,
      updatedAt: now,
    });
    added = true;
  }
  return { users: [...byEmail.values()], added };
}

export async function listStaff(): Promise<StaffUser[]> {
  const fromBlobs = await readBlobs();
  const fromLocal = fromBlobs ?? (await readLocalFile()) ?? [];
  const { users, added } = await seedMissing(fromLocal);
  if (added) await persist(users);
  return users;
}

export async function getStaffByEmail(email: string): Promise<StaffUser | null> {
  const key = normalizeEmail(email);
  if (!key) return null;
  const users = await listStaff();
  return users.find((user) => normalizeEmail(user.email) === key) ?? null;
}

export async function updateStaffPassword(email: string, password: string): Promise<StaffUser | null> {
  const key = normalizeEmail(email);
  const users = await listStaff();
  const index = users.findIndex((user) => normalizeEmail(user.email) === key);
  if (index < 0) return null;
  const now = new Date().toISOString();
  users[index] = {
    ...users[index],
    passwordHash: hashPassword(password),
    updatedAt: now,
  };
  await persist(users);
  return users[index];
}
