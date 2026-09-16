import type { BookingRecord } from './booking';
import { deriveBookingStatus, statusLabel } from './booking';
import {
  getAllGuestProfiles,
  getGuestProfile,
  normalizeGuestEmail,
  type GuestProfile,
} from './guest-store';
import { shortTent } from './booking-ops-calendar';

export interface GuestStaySummary {
  ref: string;
  checkin: string;
  checkout: string;
  tent: string;
  location: string;
  guests: number;
  nights: number;
  total: number;
  balanceDue: number;
  status: string;
  statusLabel: string;
}

export interface GuestDirectoryRow {
  email: string;
  name: string;
  phone: string;
  stayCount: number;
  totalSpend: number;
  balanceDue: number;
  lastCheckin: string;
  nextCheckin: string;
  tents: string[];
  tags: string[];
  hasNotes: boolean;
  hasDiscounts: boolean;
  hasComms: boolean;
  recommendationCount: number;
  profile: GuestProfile;
}

export interface GuestDetail {
  email: string;
  name: string;
  phone: string;
  address: string;
  stayCount: number;
  totalSpend: number;
  balanceDue: number;
  lastCheckin: string;
  nextCheckin: string;
  tents: string[];
  stays: GuestStaySummary[];
  profile: GuestProfile;
}

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function bookingsByEmail(bookings: BookingRecord[]): Map<string, BookingRecord[]> {
  const map = new Map<string, BookingRecord[]>();
  for (const booking of bookings) {
    const email = normalizeGuestEmail(booking.customerEmail);
    if (!email) continue;
    const list = map.get(email) || [];
    list.push(booking);
    map.set(email, list);
  }
  return map;
}

function summarizeStays(stays: BookingRecord[]): {
  name: string;
  phone: string;
  address: string;
  stayCount: number;
  totalSpend: number;
  balanceDue: number;
  lastCheckin: string;
  nextCheckin: string;
  tents: string[];
  staySummaries: GuestStaySummary[];
} {
  const sorted = [...stays].sort((a, b) => b.checkinDate.localeCompare(a.checkinDate));
  const today = todayYmd();
  const upcoming = sorted
    .filter((stay) => stay.checkinDate >= today)
    .sort((a, b) => a.checkinDate.localeCompare(b.checkinDate));
  const past = sorted.filter((stay) => stay.checkinDate < today);
  const tents = [...new Set(sorted.map((stay) => shortTent(stay.tentType)).filter(Boolean))];

  return {
    name: sorted[0]?.customerName || '',
    phone: sorted.find((stay) => stay.customerPhone)?.customerPhone || '',
    address: sorted.find((stay) => stay.customerAddress)?.customerAddress || '',
    stayCount: sorted.length,
    totalSpend: sorted.reduce((sum, stay) => sum + (stay.totalRentalPrice || 0), 0),
    balanceDue: sorted.reduce((sum, stay) => sum + Math.max(0, stay.remainingBalance || 0), 0),
    lastCheckin: past[0]?.checkinDate || sorted[0]?.checkinDate || '',
    nextCheckin: upcoming[0]?.checkinDate || '',
    tents,
    staySummaries: sorted.map((stay) => {
      const status = deriveBookingStatus(stay);
      return {
        ref: stay.bookingRef,
        checkin: stay.checkinDate,
        checkout: stay.checkoutDate,
        tent: shortTent(stay.tentType),
        location: stay.campsiteLocation,
        guests: stay.guests,
        nights: stay.nights,
        total: stay.totalRentalPrice,
        balanceDue: stay.remainingBalance,
        status,
        statusLabel: statusLabel(status),
      };
    }),
  };
}

export async function buildGuestDirectory(bookings: BookingRecord[]): Promise<GuestDirectoryRow[]> {
  const byEmail = bookingsByEmail(bookings);
  const profiles = await getAllGuestProfiles();
  const profileMap = new Map(profiles.map((profile) => [profile.email, profile]));
  const emails = new Set([...byEmail.keys(), ...profileMap.keys()]);

  const rows: GuestDirectoryRow[] = [];
  for (const email of emails) {
    const stays = byEmail.get(email) || [];
    const summary = summarizeStays(stays);
    const profile =
      profileMap.get(email) ||
      ({
        email,
        preferredName: '',
        relationshipNotes: '',
        tags: [],
        discounts: [],
        recommendations: [],
        comms: [],
        createdAt: '',
        updatedAt: '',
      } satisfies GuestProfile);
    rows.push({
      email,
      name: profile.preferredName || summary.name || email,
      phone: summary.phone,
      stayCount: summary.stayCount,
      totalSpend: summary.totalSpend,
      balanceDue: summary.balanceDue,
      lastCheckin: summary.lastCheckin,
      nextCheckin: summary.nextCheckin,
      tents: summary.tents,
      tags: profile.tags,
      hasNotes: Boolean(profile.relationshipNotes.trim()),
      hasDiscounts: profile.discounts.some((item) => item.active),
      hasComms: profile.comms.length > 0,
      recommendationCount: profile.recommendations.length,
      profile,
    });
  }

  return rows.sort((a, b) => {
    if (b.stayCount !== a.stayCount) return b.stayCount - a.stayCount;
    return a.name.localeCompare(b.name);
  });
}

export async function buildGuestDetail(
  email: string,
  bookings: BookingRecord[],
): Promise<GuestDetail | null> {
  const key = normalizeGuestEmail(email);
  if (!key) return null;
  const stays = bookings.filter((booking) => normalizeGuestEmail(booking.customerEmail) === key);
  const profile = await getGuestProfile(key);
  const hasCrm =
    Boolean(profile.preferredName.trim()) ||
    Boolean(profile.relationshipNotes.trim()) ||
    profile.tags.length > 0 ||
    profile.discounts.length > 0 ||
    profile.recommendations.length > 0 ||
    profile.comms.length > 0;

  if (stays.length === 0 && !hasCrm) return null;

  const summary = summarizeStays(stays);
  return {
    email: key,
    name: profile.preferredName || summary.name || key,
    phone: summary.phone,
    address: summary.address,
    stayCount: summary.stayCount,
    totalSpend: summary.totalSpend,
    balanceDue: summary.balanceDue,
    lastCheckin: summary.lastCheckin,
    nextCheckin: summary.nextCheckin,
    tents: summary.tents,
    stays: summary.staySummaries,
    profile,
  };
}

export function guestProfileHref(email: string): string {
  return `/studio/guests/${encodeURIComponent(normalizeGuestEmail(email))}`;
}
