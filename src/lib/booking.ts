export type BookingStatus =
  | 'confirmed'
  | 'balance_due'
  | 'paid_in_full'
  | 'cancelled'
  | 'refunded';

export interface BookingAddon {
  title: string;
  price: number;
}

export interface BookingRecord {
  bookingRef: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  campsiteLocation: string;
  specialRequests: string;
  internalNotes: string;
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  guests: number;
  tentType: string;
  beddingTier: string;
  beddingPrice: number;
  addons: BookingAddon[];
  fulfillment: string;
  fulfillmentPrice: number;
  totalRentalPrice: number;
  depositPercent: number;
  depositAmount: number;
  securityDeposit: number;
  totalPaidToday: number;
  remainingBalance: number;
  balanceDueDate: string;
  amountRefunded: number;
  stripeSessionId: string;
  stripePaymentIntentId: string;
  stripeBalanceSessionId?: string;
  emails: {
    confirmationAt?: string;
    welcomePackAt?: string;
    diyGuideAt?: string;
    balanceReminderAt?: string;
  };
}

export function isDiyFulfillment(fulfillment: string): boolean {
  return /diy|depot|pickup/i.test(fulfillment);
}

export function deriveBookingStatus(booking: BookingRecord): BookingStatus {
  if (booking.amountRefunded > 0 && booking.amountRefunded >= booking.totalPaidToday - 0.01) {
    return 'refunded';
  }
  if (booking.remainingBalance <= 0.01) return 'paid_in_full';
  if (booking.remainingBalance > 0) return 'balance_due';
  return 'confirmed';
}

export function statusLabel(status: BookingStatus): string {
  switch (status) {
    case 'paid_in_full':
      return 'Paid in full';
    case 'balance_due':
      return 'Balance due';
    case 'refunded':
      return 'Refunded';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Confirmed';
  }
}
