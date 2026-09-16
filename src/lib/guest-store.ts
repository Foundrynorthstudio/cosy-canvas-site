import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const BLOB_STORE = 'cosy-bookings';
const BLOB_KEY = 'guest-crm-v1.json';
const LOCAL_DIR = path.join(process.cwd(), '.data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'guest-crm.json');

export interface GuestDiscount {
  id: string;
  label: string;
  code: string;
  percent: number | null;
  amountGbp: number | null;
  notes: string;
  active: boolean;
  createdAt: string;
}

export interface GuestRecommendation {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

export interface GuestCommsEntry {
  id: string;
  subject: string;
  body: string;
  channel: 'email' | 'phone' | 'note';
  sentAt: string;
  createdBy: string;
  relatedBookingRef: string;
}

export interface GuestProfile {
  email: string;
  preferredName: string;
  relationshipNotes: string;
  tags: string[];
  discounts: GuestDiscount[];
  recommendations: GuestRecommendation[];
  comms: GuestCommsEntry[];
  createdAt: string;
  updatedAt: string;
}

interface GuestStoreFile {
  profiles: GuestProfile[];
}

let writeChain: Promise<void> = Promise.resolve();

export function normalizeGuestEmail(email: string): string {
  return email.trim().toLowerCase();
}

function emptyProfile(email: string): GuestProfile {
  const now = new Date().toISOString();
  return {
    email: normalizeGuestEmail(email),
    preferredName: '',
    relationshipNotes: '',
    tags: [],
    discounts: [],
    recommendations: [],
    comms: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function readLocalFile(): Promise<GuestProfile[] | null> {
  try {
    const raw = await readFile(LOCAL_FILE, 'utf8');
    const parsed = JSON.parse(raw) as GuestStoreFile;
    return Array.isArray(parsed.profiles) ? parsed.profiles : null;
  } catch {
    return null;
  }
}

async function writeLocalFile(profiles: GuestProfile[]): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify({ profiles }, null, 2), 'utf8');
}

async function readBlobs(): Promise<GuestProfile[] | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    const data = await store.get(BLOB_KEY, { type: 'json' });
    if (data && Array.isArray((data as GuestStoreFile).profiles)) {
      return (data as GuestStoreFile).profiles;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeBlobs(profiles: GuestProfile[]): Promise<boolean> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    await store.setJSON(BLOB_KEY, { profiles });
    return true;
  } catch {
    return false;
  }
}

async function loadProfiles(): Promise<GuestProfile[]> {
  try {
    const fromBlobs = await readBlobs();
    if (fromBlobs) return fromBlobs;
    const fromDisk = await readLocalFile();
    if (fromDisk) return fromDisk;
  } catch (error) {
    console.error('[guest-store] read failed', error);
  }
  return [];
}

async function persist(profiles: GuestProfile[]): Promise<void> {
  const blobOk = await writeBlobs(profiles);
  if (blobOk) return;
  try {
    await writeLocalFile(profiles);
  } catch (error) {
    console.error('[guest-store] persist failed', error);
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

export async function getAllGuestProfiles(): Promise<GuestProfile[]> {
  return loadProfiles();
}

export async function getGuestProfile(email: string): Promise<GuestProfile> {
  const key = normalizeGuestEmail(email);
  const profiles = await loadProfiles();
  return profiles.find((profile) => profile.email === key) || emptyProfile(key);
}

export type GuestProfilePatch = Partial<
  Pick<GuestProfile, 'preferredName' | 'relationshipNotes' | 'tags' | 'discounts' | 'recommendations' | 'comms'>
>;

export async function upsertGuestProfile(email: string, patch: GuestProfilePatch): Promise<GuestProfile> {
  return enqueueWrite(async () => {
    const key = normalizeGuestEmail(email);
    if (!key) throw new Error('Guest email required');
    const profiles = await loadProfiles();
    const index = profiles.findIndex((profile) => profile.email === key);
    const now = new Date().toISOString();
    const base = index === -1 ? emptyProfile(key) : profiles[index];
    const next: GuestProfile = {
      ...base,
      preferredName: patch.preferredName !== undefined ? String(patch.preferredName) : base.preferredName,
      relationshipNotes:
        patch.relationshipNotes !== undefined ? String(patch.relationshipNotes) : base.relationshipNotes,
      tags: patch.tags !== undefined ? normalizeTags(patch.tags) : base.tags,
      discounts: patch.discounts !== undefined ? normalizeDiscounts(patch.discounts) : base.discounts,
      recommendations:
        patch.recommendations !== undefined
          ? normalizeRecommendations(patch.recommendations)
          : base.recommendations,
      comms: patch.comms !== undefined ? normalizeComms(patch.comms) : base.comms,
      updatedAt: now,
    };
    if (index === -1) profiles.unshift(next);
    else profiles[index] = next;
    await persist(profiles);
    return next;
  });
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

function normalizeDiscounts(items: GuestDiscount[]): GuestDiscount[] {
  return items.map((item) => ({
    id: item.id || randomUUID(),
    label: String(item.label || '').trim(),
    code: String(item.code || '').trim(),
    percent: item.percent == null || Number.isNaN(Number(item.percent)) ? null : Number(item.percent),
    amountGbp:
      item.amountGbp == null || Number.isNaN(Number(item.amountGbp)) ? null : Number(item.amountGbp),
    notes: String(item.notes || '').trim(),
    active: Boolean(item.active),
    createdAt: item.createdAt || new Date().toISOString(),
  }));
}

function normalizeRecommendations(items: GuestRecommendation[]): GuestRecommendation[] {
  return items.map((item) => ({
    id: item.id || randomUUID(),
    title: String(item.title || '').trim(),
    body: String(item.body || '').trim(),
    createdAt: item.createdAt || new Date().toISOString(),
    createdBy: String(item.createdBy || '').trim(),
  }));
}

function normalizeComms(items: GuestCommsEntry[]): GuestCommsEntry[] {
  return items
    .map((item) => {
      const channel: GuestCommsEntry['channel'] =
        item.channel === 'phone' || item.channel === 'note' ? item.channel : 'email';
      return {
        id: item.id || randomUUID(),
        subject: String(item.subject || '').trim(),
        body: String(item.body || '').trim(),
        channel,
        sentAt: item.sentAt || new Date().toISOString(),
        createdBy: String(item.createdBy || '').trim(),
        relatedBookingRef: String(item.relatedBookingRef || '').trim(),
      };
    })
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export function newDiscount(partial: Partial<GuestDiscount> = {}): GuestDiscount {
  return {
    id: randomUUID(),
    label: partial.label || '',
    code: partial.code || '',
    percent: partial.percent ?? null,
    amountGbp: partial.amountGbp ?? null,
    notes: partial.notes || '',
    active: partial.active ?? true,
    createdAt: new Date().toISOString(),
  };
}

export function newRecommendation(partial: Partial<GuestRecommendation> = {}): GuestRecommendation {
  return {
    id: randomUUID(),
    title: partial.title || '',
    body: partial.body || '',
    createdAt: new Date().toISOString(),
    createdBy: partial.createdBy || '',
  };
}

export function newCommsEntry(partial: Partial<GuestCommsEntry> = {}): GuestCommsEntry {
  return {
    id: randomUUID(),
    subject: partial.subject || '',
    body: partial.body || '',
    channel: partial.channel || 'email',
    sentAt: partial.sentAt || new Date().toISOString(),
    createdBy: partial.createdBy || '',
    relatedBookingRef: partial.relatedBookingRef || '',
  };
}
