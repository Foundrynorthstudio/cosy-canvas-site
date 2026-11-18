import { hashPassword, readAuthEnv } from './journal-auth';
import { readJsonStore, writeJsonStore } from './cloud-kv';

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

async function persist(users: StaffUser[]): Promise<void> {
  await writeJsonStore('staff', { users });
}

function enqueueWrite<T>(work: () => Promise<T>): Promise<T> {
  const run = writeChain.then(work, work);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function bootstrapPassword(): string {
  return readAuthEnv('STUDIO_STAFF_INITIAL_PASSWORD') || readAuthEnv('JOURNAL_ADMIN_PASSWORD');
}

function seedMissing(existing: StaffUser[]): { users: StaffUser[]; added: boolean } {
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
  let loaded: StaffUser[] = [];
  try {
    const data = await readJsonStore<StaffStoreFile>('staff');
    if (data && Array.isArray(data.users) && data.users.length > 0) loaded = data.users;
  } catch (error) {
    console.error('[staff-store] read failed', error);
  }

  const { users, added } = seedMissing(loaded);
  if (added || loaded.length === 0) {
    await enqueueWrite(async () => {
      await persist(users);
    });
  }
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
  return enqueueWrite(async () => {
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
  });
}
