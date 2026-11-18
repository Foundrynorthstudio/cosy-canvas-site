import type { BookingRecord } from './booking';
import { readJsonStore, writeJsonStore } from './cloud-kv';

interface BookingStoreFile {
  bookings: BookingRecord[];
}

let writeChain: Promise<void> = Promise.resolve();

function sortBookings(bookings: BookingRecord[]): BookingRecord[] {
  return [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Legacy walkthrough bookings — no longer seeded; purged from the store when found. */
export function isDemoBookingRef(ref: string): boolean {
  return /^CC-DEMO\d+/i.test(ref.trim());
}

async function loadBookings(): Promise<BookingRecord[]> {
  let loaded: BookingRecord[] = [];
  try {
    const data = await readJsonStore<BookingStoreFile>('bookings');
    if (data && Array.isArray(data.bookings)) loaded = data.bookings;
  } catch (error) {
    console.error('Booking store read failed.', error);
  }

  const withoutDemos = loaded.filter((booking) => !isDemoBookingRef(booking.bookingRef));
  if (withoutDemos.length !== loaded.length) {
    await persist(withoutDemos);
    return sortBookings(withoutDemos);
  }

  return sortBookings(loaded);
}

async function persist(bookings: BookingRecord[]): Promise<void> {
  const sorted = sortBookings(bookings);
  await writeJsonStore('bookings', { bookings: sorted });
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

export async function getBookingBySubscriptionId(
  subscriptionId: string,
): Promise<BookingRecord | undefined> {
  if (!subscriptionId) return undefined;
  const bookings = await loadBookings();
  return bookings.find((booking) => booking.stripeSubscriptionId === subscriptionId);
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

export async function deleteBooking(ref: string): Promise<boolean> {
  return enqueueWrite(async () => {
    const bookings = await loadBookings();
    const next = bookings.filter((booking) => booking.bookingRef !== ref);
    if (next.length === bookings.length) return false;
    await persist(next);
    return true;
  });
}
