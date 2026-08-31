import { Resend } from 'resend';

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

export async function sendBookingConfirmationEmails(booking: BookingDetails) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const adminEmail = import.meta.env.ADMIN_NOTIFICATION_EMAIL || 'bookings@cosycanvas.co.uk';

  // Build itemized addons HTML
  const addonsHtml = booking.addons.length > 0
    ? booking.addons.map(a => `<tr><td style="padding: 6px 0; color: #444;">${a.title}</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">£${a.price.toFixed(2)}</td></tr>`).join('')
    : `<tr><td colspan="2" style="padding: 6px 0; color: #888; font-style: italic;">None selected</td></tr>`;

  // Customer Email HTML
  const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; color: #1c1917; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
    .header { background: #111111; padding: 32px 24px; text-align: center; color: #ffffff; border-bottom: 4px solid #f7ba1e; }
    .header h1 { margin: 0 0 6px 0; font-size: 24px; letter-spacing: 0.5px; }
    .header p { margin: 0; color: #f7ba1e; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 24px; }
    .badge-box { background: #faf7ee; border: 1px dashed #7d6e23; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; }
    .badge-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7d6e23; font-weight: bold; margin-bottom: 4px; }
    .badge-code { font-size: 22px; font-weight: 800; color: #111111; font-family: monospace; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #111111; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #f0eee6; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .total-table td { padding: 8px 0; }
    .highlight-row { background: #faf7ee; font-weight: bold; font-size: 15px; }
    .highlight-row td { padding: 12px 8px !important; }
    .footer { background: #f5f4f0; padding: 24px; text-align: center; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>The Cosy Canvas Co.</p>
      <h1>Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p style="font-size: 15px; line-height: 1.5;">Hi <strong>${booking.customerName}</strong>,</p>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        Thank you for booking your Scottish glamping getaway with The Cosy Canvas Co.! We have received your payment and secured your dates.
      </p>

      <div class="badge-box">
        <div class="badge-title">Your Booking Reference</div>
        <div class="badge-code">${booking.bookingRef}</div>
      </div>

      <div class="section-title">Stay & Location Details</div>
      <table>
        <tr><td style="padding: 6px 0; color: #666;">Dates:</td><td style="text-align: right; font-weight: 600;">${booking.checkinDate} to ${booking.checkoutDate} (${booking.nights} Nights)</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Guests:</td><td style="text-align: right; font-weight: 600;">${booking.guests} Guests</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Campsite / Location:</td><td style="text-align: right; font-weight: 600;">${booking.campsiteLocation}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Fulfillment:</td><td style="text-align: right; font-weight: 600;">${booking.fulfillment}</td></tr>
      </table>

      <div class="section-title">Equipment & Setup</div>
      <table>
        <tr><td style="padding: 6px 0; color: #666;">Tent:</td><td style="text-align: right; font-weight: 600;">${booking.tentType}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Bedding Package:</td><td style="text-align: right; font-weight: 600;">${booking.beddingTier}</td></tr>
      </table>

      <div class="section-title">Camp Extras & Add-ons</div>
      <table>
        ${addonsHtml}
      </table>

      <div class="section-title">Payment Summary</div>
      <table class="total-table">
        <tr>
          <td style="color: #666;">Total Stay Cost:</td>
          <td style="text-align: right; font-weight: 600;">£${booking.totalRentalPrice.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color: #666;">Deposit Paid Today (${booking.depositPercent}%):</td>
          <td style="text-align: right; font-weight: 600;">£${booking.depositAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color: #666;">Refundable Security Deposit:</td>
          <td style="text-align: right; font-weight: 600;">£${booking.securityDeposit.toFixed(2)}</td>
        </tr>
        <tr class="highlight-row">
          <td>Total Paid Today (via Stripe):</td>
          <td style="text-align: right; color: #111111;">£${booking.totalPaidToday.toFixed(2)}</td>
        </tr>
        ${booking.remainingBalance > 0 ? `
        <tr>
          <td style="color: #b45309; padding-top: 10px; font-weight: bold;">Remaining Balance Due:</td>
          <td style="text-align: right; color: #b45309; padding-top: 10px; font-weight: bold;">£${booking.remainingBalance.toFixed(2)} (Due ${booking.balanceDueDate || '28 days prior to check-in'})</td>
        </tr>
        ` : ''}
      </table>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; margin-top: 24px; font-size: 12px; color: #166534; line-height: 1.5;">
        <strong>🛡️ Security Deposit Notice:</strong> The £200.00 security deposit is held to cover any damages or lost equipment and will be refunded to your card within 48 hours after your post-stay inspection.
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><strong>The Cosy Canvas Co.</strong> — Luxury Bell Tent Hire Scotland</p>
      <p style="margin: 0;">Questions? Reply directly to this email or contact us at <a href="mailto:info@cosycanvas.co.uk" style="color: #7d6e23;">info@cosycanvas.co.uk</a></p>
    </div>
  </div>
</body>
</html>
  `;

  // Admin Notification Email HTML
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

      <h3>Stay & Equipment Details</h3>
      <table>
        <tr><td><strong>Dates:</strong></td><td class="highlight">${booking.checkinDate} to ${booking.checkoutDate} (${booking.nights} Nights)</td></tr>
        <tr><td><strong>Guests:</strong></td><td>${booking.guests} Guests</td></tr>
        <tr><td><strong>Tent Model:</strong></td><td class="highlight">${booking.tentType}</td></tr>
        <tr><td><strong>Bedding Tier:</strong></td><td>${booking.beddingTier}</td></tr>
        <tr><td><strong>Fulfillment:</strong></td><td class="highlight">${booking.fulfillment}</td></tr>
      </table>

      <h3>Selected Add-ons</h3>
      <table>
        ${addonsHtml}
      </table>

      <h3>Financial Breakdown</h3>
      <table>
        <tr><td>Total Stay Value:</td><td>£${booking.totalRentalPrice.toFixed(2)}</td></tr>
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

  // If Resend API key is provided and valid, send real emails
  if (apiKey && apiKey !== 're_placeholder_key' && !apiKey.startsWith('re_placeholder')) {
    try {
      const resend = new Resend(apiKey);

      // 1. Send confirmation to Customer
      await resend.emails.send({
        from: 'The Cosy Canvas Co. <bookings@cosycanvas.co.uk>',
        to: booking.customerEmail,
        subject: `Your Cosy Canvas Booking Confirmation [${booking.bookingRef}]`,
        html: customerEmailHtml,
      });

      // 2. Send notification to Admin
      await resend.emails.send({
        from: 'Cosy Canvas System <bookings@cosycanvas.co.uk>',
        to: adminEmail,
        subject: `[NEW BOOKING] ${booking.bookingRef} - ${booking.customerName} (${booking.checkinDate})`,
        html: adminEmailHtml,
      });

      console.log(`[Email] Confirmation emails successfully sent for booking ${booking.bookingRef}`);
      return { success: true };
    } catch (err: any) {
      console.error('[Email Error] Failed to send emails via Resend:', err);
      return { success: false, error: err.message };
    }
  } else {
    // In dev / test mode without active Resend key, log to console
    console.log(`[Email Mock] Real Resend API key not configured. Mocking email dispatch for ${booking.bookingRef}:`);
    console.log(`- Customer Email queued for: ${booking.customerEmail}`);
    console.log(`- Admin Alert queued for: ${adminEmail}`);
    return { success: true, mocked: true };
  }
}
