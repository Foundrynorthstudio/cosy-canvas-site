import { Resend } from 'resend';
import type { BookingRecord } from './booking';
import { kitEmailHtml } from './booking-kit';
import { formatGbp, lineItemsEmailRows } from './booking-lines';
import { readSecretEnv } from './stripe-client';

export interface BookingDetails {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  campsiteLocation: string;
  specialRequests?: string;
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  guests: number;
  tentType: string;
  beddingTier: string;
  beddingPrice: number;
  addons: { title: string; price: number }[];
  fulfillment: string;
  fulfillmentPrice: number;
  totalRentalPrice: number;
  depositPercent: number; // 50 or 100
  depositAmount: number;
  securityDeposit: number; // 200
  totalPaidToday: number;
  remainingBalance: number;
  balanceDueDate?: string;
}

function resendKey(): string {
  return readSecretEnv('RESEND_API_KEY');
}

function adminInbox(): string {
  return readSecretEnv('ADMIN_NOTIFICATION_EMAIL') || 'bookings@cosycanvas.co.uk';
}

export async function sendHtmlEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; mocked?: boolean; error?: string }> {
  const apiKey = resendKey();
  const from = options.from || 'The Cosy Canvas Co. <bookings@cosycanvas.co.uk>';

  if (apiKey && apiKey !== 're_placeholder_key' && !apiKey.startsWith('re_placeholder')) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return { success: true };
    } catch (err: any) {
      console.error('[Email Error]', err);
      return { success: false, error: err.message };
    }
  }

  console.log(`[Email Mock] ${options.subject} → ${options.to}`);
  return { success: true, mocked: true };
}

export async function sendAdminNewBookingAlert(booking: BookingDetails | BookingRecord) {
  const adminEmail = adminInbox();
  const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; }
    .header { background: #0f172a; padding: 20px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { padding: 24px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { text-align: left; background: #f8fafc; padding: 8px; font-size: 11px; text-transform: uppercase; color: #64748b; }
    td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
    .highlight { font-weight: bold; color: #0f172a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span style="color: #38bdf8; font-size: 11px; font-weight: bold; text-transform: uppercase;">New Paid Booking Alert</span>
      <h1>Booking Ref: ${booking.bookingRef}</h1>
    </div>
    <div class="content">
      <h3>Customer Information</h3>
      <table>
        <tr><td><strong>Name:</strong></td><td>${booking.customerName}</td></tr>
        <tr><td><strong>Email:</strong></td><td><a href="mailto:${booking.customerEmail}">${booking.customerEmail}</a></td></tr>
        <tr><td><strong>Phone:</strong></td><td><a href="tel:${booking.customerPhone}">${booking.customerPhone}</a></td></tr>
        <tr><td><strong>Address:</strong></td><td>${booking.customerAddress || 'Not provided'}</td></tr>
        <tr><td><strong>Pitch / Campsite:</strong></td><td class="highlight">${booking.campsiteLocation}</td></tr>
        <tr><td><strong>Notes / Special Requests:</strong></td><td>${booking.specialRequests || 'None'}</td></tr>
      </table>

      <table>
        <tr><td><strong>Dates:</strong></td><td class="highlight">${booking.checkinDate} to ${booking.checkoutDate} (${booking.nights} nights)</td></tr>
        <tr><td><strong>Guests:</strong></td><td>${booking.guests}</td></tr>
      </table>

      <h3>Booking line items</h3>
      <table>
        ${lineItemsEmailRows(booking)}
      </table>

      <h3 style="background:#111;color:#f7ba1e;padding:10px 12px;border-radius:8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Load sheet</h3>
      ${kitEmailHtml(booking)}

      <h3>Financial Breakdown</h3>
      <table>
        <tr><td>Total Stay Value:</td><td>${formatGbp(booking.totalRentalPrice)}</td></tr>
        <tr><td>Deposit Collected (${booking.depositPercent}%):</td><td>£${booking.depositAmount.toFixed(2)}</td></tr>
        <tr><td>Security Deposit:</td><td>£${booking.securityDeposit.toFixed(2)}</td></tr>
        <tr><td><strong>Total Collected in Stripe Today:</strong></td><td class="highlight" style="color: #059669; font-size: 16px;">£${booking.totalPaidToday.toFixed(2)}</td></tr>
        ${booking.remainingBalance > 0 ? `<tr><td><strong>Remaining Balance Due:</strong></td><td style="color: #d97706;">£${booking.remainingBalance.toFixed(2)}</td></tr>` : ''}
      </table>
    </div>
  </div>
</body>
</html>
  `;

  return sendHtmlEmail({
    from: 'Cosy Canvas System <bookings@cosycanvas.co.uk>',
    to: adminEmail,
    subject: `[NEW BOOKING] ${booking.bookingRef} - ${booking.customerName} (${booking.checkinDate})`,
    html: adminEmailHtml,
  });
}

