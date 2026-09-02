import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEMO_BOOKINGS } from './booking-demo';
import type { BookingRecord } from './booking';

const BLOB_STORE = 'cosy-bookings';
const BLOB_KEY = 'bookings-v1.json';
const LOCAL_DIR = path.join(process.cwd(), '.data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'bookings.json');

interface BookingStoreFile {
  bookings: BookingRecord[];
}

let writeChain: Promise<void> = Promise.resolve();

function sortBookings(bookings: BookingRecord[]): BookingRecord[] {
  return [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

async function readLocalFile(): Promise<BookingRecord[] | null> {
  try {
    const raw = await readFile(LOCAL_FILE, 'utf8');
    const parsed = JSON.parse(raw) as BookingStoreFile;
    return Array.isArray(parsed.bookings) ? parsed.bookings : null;
  } catch {
    return null;
  }
}

async function writeLocalFile(bookings: BookingRecord[]): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify({ bookings }, null, 2), 'utf8');
}

async function readBlobs(): Promise<BookingRecord[] | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    const data = await store.get(BLOB_KEY, { type: 'json' });
    if (data && Array.isArray((data as BookingStoreFile).bookings)) {
      return (data as BookingStoreFile).bookings;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeBlobs(bookings: BookingRecord[]): Promise<boolean> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    await store.setJSON(BLOB_KEY, { bookings });
    return true;
  } catch {
    return false;
  }
}

function withMissingDemos(existing: BookingRecord[]): { bookings: BookingRecord[]; added: boolean } {
  const refs = new Set(existing.map((booking) => booking.bookingRef));
  const missing = DEMO_BOOKINGS.filter((demo) => !refs.has(demo.bookingRef));
  if (missing.length === 0) return { bookings: existing, added: false };
  return { bookings: [...existing, ...structuredClone(missing)], added: true };
}

async function loadBookings(): Promise<BookingRecord[]> {
  let loaded: BookingRecord[] = [];
  try {
    const fromBlobs = await readBlobs();
    if (fromBlobs && fromBlobs.length > 0) loaded = fromBlobs;
    else {
      const fromDisk = await readLocalFile();
      if (fromDisk && fromDisk.length > 0) loaded = fromDisk;
    }
  } catch (error) {
    console.error('Booking store read failed.', error);
  }

  const next = withMissingDemos(loaded);
  if (next.added || loaded.length === 0) {
    await persist(next.bookings);
  }
  return sortBookings(next.bookings);
}

async function persist(bookings: BookingRecord[]): Promise<void> {
  const sorted = sortBookings(bookings);
  const blobOk = await writeBlobs(sorted);
  if (blobOk) return;
  try {
    await writeLocalFile(sorted);
  } catch (error) {
    console.error('Booking store persist failed.', error);
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

export async function getAllBookings(): Promise<BookingRecord[]> {
  return loadBookings();
}

export async function getBookingByRef(ref: string): Promise<BookingRecord | undefined> {
  const bookings = await loadBookings();
  return bookings.find((booking) => booking.bookingRef === ref);
}

export async function upsertBooking(next: BookingRecord): Promise<BookingRecord> {
  return enqueueWrite(async () => {
    const bookings = await loadBookings();
    const index = bookings.findIndex((booking) => booking.bookingRef === next.bookingRef);
    const saved = { ...next, updatedAt: new Date().toISOString() };
    if (index === -1) bookings.unshift(saved);
    else bookings[index] = { ...bookings[index], ...saved };
    await persist(bookings);
    return bookings.find((booking) => booking.bookingRef === next.bookingRef)!;
  });
}

export async function updateBooking(
  ref: string,
  patch: Partial<BookingRecord>,
): Promise<BookingRecord | null> {
  return enqueueWrite(async () => {
    const bookings = await loadBookings();
    const index = bookings.findIndex((booking) => booking.bookingRef === ref);
    if (index === -1) return null;
    const cleaned = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as Partial<BookingRecord>;
    bookings[index] = {
      ...bookings[index],
      ...cleaned,
      bookingRef: bookings[index].bookingRef,
      updatedAt: new Date().toISOString(),
    };
    await persist(bookings);
    return bookings[index];
  });
}
