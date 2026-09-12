import { isDiyFulfillment, type BookingRecord } from './booking';
import { kitEmailHtml } from './booking-kit';
import { formatGbp, lineItemsEmailRows } from './booking-lines';
import {
  DEPOT,
  depotMapsUrl,
  depotW3wLabel,
  depotW3wUrl,
  depotWhat3Words,
} from './depot';

export const MAIL_TYPES = ['confirmation', 'welcome', 'diy', 'kitHandover', 'balance'] as const;
export type MailType = (typeof MAIL_TYPES)[number];
export type MailTrigger = 'on_payment' | 'days_before_checkin' | 'on_checkout' | 'manual_only';

export interface MailTemplate {
  headline: string;
  subject: string;
  body: string;
}

export interface MailRule {
  enabled: boolean;
  trigger: MailTrigger;
  daysBefore: number;
  onlyDiy: boolean;
  requireBalance: boolean;
  notifyAdmin: boolean;
}

export interface MailSettings {
  templates: Record<MailType, MailTemplate>;
  rules: Record<MailType, MailRule>;
}

export const MAIL_META: Record<
  MailType,
  { label: string; blurb: string; sentKey: keyof BookingRecord['emails'] }
> = {
  confirmation: {
    label: 'Booking confirmation',
    blurb: 'Receipt, stay details, and what they paid.',
    sentKey: 'confirmationAt',
  },
  welcome: {
    label: 'Welcome pack',
    blurb: 'What to bring, arrival notes, and how the stay works.',
    sentKey: 'welcomePackAt',
  },
  diy: {
    label: 'DIY setup guide',
    blurb: 'Pitching checklist for depot collections.',
    sentKey: 'diyGuideAt',
  },
  kitHandover: {
    label: 'Kit list',
    blurb: 'Short checkout note with a button to download the kit list PDF.',
    sentKey: 'kitHandoverAt',
  },
  balance: {
    label: 'Balance reminder',
    blurb: 'Remaining stay balance with a Stripe payment link.',
    sentKey: 'balanceReminderAt',
  },
};

export const DEFAULT_RULES: Record<MailType, MailRule> = {
  confirmation: {
    enabled: true,
    trigger: 'on_payment',
    daysBefore: 0,
    onlyDiy: false,
    requireBalance: false,
    notifyAdmin: true,
  },
  welcome: {
    enabled: true,
    trigger: 'on_payment',
    daysBefore: 0,
    onlyDiy: false,
    requireBalance: false,
    notifyAdmin: false,
  },
  diy: {
    enabled: true,
    trigger: 'on_payment',
    daysBefore: 7,
    onlyDiy: true,
    requireBalance: false,
    notifyAdmin: false,
  },
  kitHandover: {
    enabled: true,
    trigger: 'on_checkout',
    daysBefore: 0,
    onlyDiy: false,
    requireBalance: false,
    notifyAdmin: false,
  },
  balance: {
    enabled: true,
    trigger: 'days_before_checkin',
    daysBefore: 28,
    onlyDiy: false,
    requireBalance: true,
    notifyAdmin: false,
  },
};

export const DEFAULT_TEMPLATES: Record<MailType, MailTemplate> = {
  confirmation: {
    headline: 'Booking Confirmed!',
    subject: 'Your Cosy Canvas Booking Confirmation [{{bookingRef}}]',
    body: `<p>Hi <strong>{{customerName}}</strong>,</p>
<p>Thank you for booking your Scottish glamping getaway with The Cosy Canvas Co. We have received your payment and secured your dates.</p>
<div style="background:#faf7ee;border:1px dashed #7d6e23;border-radius:12px;padding:16px;margin:24px 0;text-align:center;">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7d6e23;font-weight:bold;">Your booking reference</div>
  <div style="font-size:22px;font-weight:800;font-family:monospace;color:#111;">{{bookingRef}}</div>
</div>
<h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#111;border-bottom:1px solid #f0eee6;padding-bottom:6px;">Stay details</h3>
<p>{{checkinDate}} → {{checkoutDate}} · {{nights}} nights · {{guests}} guests<br/>{{campsiteLocation}}<br/>{{fulfillment}}</p>
{{#diy}}
<h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#111;border-bottom:1px solid #f0eee6;padding-bottom:6px;">Collection — Falkirk container</h3>
<p>Pickup and return: <strong>{{depotHours}}</strong>. What3Words: <strong>{{depotW3w}}</strong>{{#depotW3wUrl}} · <a href="{{depotW3wUrl}}">Open the pin</a>{{/depotW3wUrl}}<br/>
<a href="{{depotMapsUrl}}">Google Maps to the container</a>. {{depotHoursNote}}</p>
{{/diy}}
<h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#111;border-bottom:1px solid #f0eee6;padding-bottom:6px;">Your booking</h3>
{{lineItemsHtml}}
<h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#111;border-bottom:1px solid #f0eee6;padding-bottom:6px;">What we are packing</h3>
{{kitHtml}}
<h3 style="font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:#111;border-bottom:1px solid #f0eee6;padding-bottom:6px;">Payment</h3>
<p>Stay total {{stayTotal}} · Deposit paid {{depositPaid}} · Paid today {{paidToday}}<br/>Security hold {{securityDeposit}}{{#balance}} · Balance {{remainingBalance}} due {{balanceDueDate}}{{/balance}}</p>
<p style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;font-size:12px;color:#166534;">The {{securityDeposit}} security deposit is held against damage or missing kit and is refunded after the post-stay check.</p>`,
  },
  welcome: {
    headline: 'Your welcome pack',
    subject: 'Welcome pack for {{bookingRef}} · The Cosy Canvas Co.',
    body: `<p>Hi <strong>{{customerName}}</strong>,</p>
<p>Your canvas stay is booked (<strong>{{bookingRef}}</strong>). Here is everything you need before you arrive.</p>
<h3 style="color:#111;">Your stay</h3>
<p>{{checkinDate}} → {{checkoutDate}} · {{guests}} guests · {{tentType}}<br/>{{campsiteLocation}}<br/>{{fulfillment}}</p>
<p><strong>Add-ons:</strong> {{addons}}</p>
<h3 style="color:#111;">What we bring</h3>
<p>Heavy-duty canvas, lanterns, and the extras you selected. Hotel-grade bedding is included only if you chose a bedding package ({{beddingTier}}).</p>
<h3 style="color:#111;">What to pack</h3>
<ul>
  <li>Layered clothing, a waterproof shell, and easy-on shoes for the tent door</li>
  <li>Smidge or similar midgie protection in late spring and summer</li>
  <li>Headtorch, reusable bottle, and any food you want to cook</li>
</ul>
<h3 style="color:#111;">Arrival</h3>
{{#diy}}
<p>Collect from the Falkirk container, <strong>{{depotHours}}</strong>. What3Words: <strong>{{depotW3w}}</strong>{{#depotW3wUrl}} · <a href="{{depotW3wUrl}}">Open the pin</a>{{/depotW3wUrl}}.<br/>
<a href="{{depotMapsUrl}}">Google Maps directions</a>. {{depotHoursNote}}</p>
{{/diy}}
{{#deluxe}}
<p>Please be on-site for the agreed pitching window. Our crew will confirm access the week before.</p>
{{/deluxe}}
<p>See you under canvas.</p>`,
  },
  diy: {
    headline: 'DIY pitching guide',
    subject: 'DIY setup guide for {{bookingRef}}',
    body: `<p>Hi <strong>{{customerName}}</strong>,</p>
<p>You chose depot pickup for <strong>{{bookingRef}}</strong> ({{tentType}}). Use this as your setup checklist.</p>
<h3 style="color:#111;">Pitch size</h3>
<p>4M tents need about 6×6m of flat grass including guy lines. 5M needs 7×7m. The 6M Cathedral needs 8×8m.</p>
<h3 style="color:#111;">Order of work</h3>
<ol>
  <li>Spread the groundsheet and canvas, door facing the view / away from prevailing wind.</li>
  <li>Raise the centre pole, then peg the walls, then guy lines in a circle.</li>
  <li>Fit the stove flashing kit before the first fire if you have a wood burner.</li>
  <li>Keep guy lines taut and re-check after the first night of rain or wind.</li>
</ol>
<h3 style="color:#111;">Collection &amp; return</h3>
<p>Collect from the Falkirk container, <strong>{{depotHours}}</strong>. What3Words: <strong>{{depotW3w}}</strong>{{#depotW3wUrl}} · <a href="{{depotW3wUrl}}">Open the pin</a>{{/depotW3wUrl}}.<br/>
<a href="{{depotMapsUrl}}">Google Maps to the container</a>. Canvas must come back dry, or extra drying time may be charged against the security deposit. Pack poles together and bag the canvas as you found it. {{depotHoursNote}}</p>
<p>Stuck on the pitch? Reply to this email and we will talk you through it.</p>`,
  },
  kitHandover: {
    headline: 'Your kit is on its way',
    subject: 'Your kit list {{bookingRef}}',
    body: `<p>Hi <strong>{{customerName}}</strong>,</p>
<p>Your canvas kit for <strong>{{bookingRef}}</strong> has been picked and checked out for {{checkinDate}} → {{checkoutDate}} at {{campsiteLocation}}.</p>
<p>Every piece is catalogued for this stay so we can keep the same standard for you and for the next guest. Please look after it, and shout if anything isn't right.</p>
{{kitPdfButton}}
<p>See you under canvas.</p>`,
  },
  balance: {
    headline: 'Balance due',
    subject: 'Balance reminder {{bookingRef}} · {{remainingBalance}} due',
    body: `<p>Hi <strong>{{customerName}}</strong>,</p>
<p>Your remaining stay balance for <strong>{{bookingRef}}</strong> is <strong>{{remainingBalance}}</strong>{{#balanceDueDate}}, due by {{balanceDueDate}}{{/balanceDueDate}}.</p>
<p>{{checkinDate}} → {{checkoutDate}} at {{campsiteLocation}}.</p>
{{payButton}}
<p>The {{securityDeposit}} security deposit is already held and is separate from this balance.</p>`,
  },
};

export const PLACEHOLDER_HELP = [
  '{{customerName}}',
  '{{bookingRef}}',
  '{{checkinDate}}',
  '{{checkoutDate}}',
  '{{nights}}',
  '{{guests}}',
  '{{tentType}}',
  '{{beddingTier}}',
  '{{fulfillment}}',
  '{{campsiteLocation}}',
  '{{addons}}',
  '{{stayTotal}}',
  '{{depositPaid}}',
  '{{paidToday}}',
  '{{remainingBalance}}',
  '{{balanceDueDate}}',
  '{{securityDeposit}}',
  '{{specialRequests}}',
  '{{kitHtml}}',
  '{{kitPdfButton}}',
  '{{lineItemsHtml}}',
  '{{depotW3w}}',
  '{{depotW3wUrl}}',
  '{{depotHours}}',
  '{{depotHoursNote}}',
  '{{depotMapsUrl}}',
  '{{payButton}}',
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyConditionals(text: string, flags: Record<string, boolean>): string {
  return text.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key: string, inner: string) => (flags[key] ? inner : ''),
  );
}

export function mailVars(
  booking: BookingRecord,
  extras: { payUrl?: string; kitPdfUrl?: string } = {},
): Record<string, string> {
  const addons =
    booking.addons.length > 0
      ? booking.addons.map((addon) => `${addon.title} (${formatGbp(addon.price)})`).join(', ')
      : 'None';
  const kitPdfButton = extras.kitPdfUrl
    ? `<p style="margin:28px 0;text-align:center;"><a href="${extras.kitPdfUrl}" style="display:inline-block;background:#f7ba1e;color:#111;font-weight:800;text-decoration:none;padding:14px 22px;border-radius:999px;">Download kit list</a></p>`
    : `<p style="margin:28px 0;text-align:center;"><span style="display:inline-block;background:#f7ba1e;color:#111;font-weight:800;padding:14px 22px;border-radius:999px;">Download kit list</span></p><p style="font-size:12px;color:#78716c;">The live download link is added when this email is sent.</p>`;
  const payButton = extras.payUrl
    ? `<p style="margin:24px 0;"><a href="${extras.payUrl}" style="display:inline-block;background:#f7ba1e;color:#111;font-weight:800;text-decoration:none;padding:14px 22px;border-radius:999px;">Pay remaining balance · ${formatGbp(booking.remainingBalance)}</a></p>`
    : booking.remainingBalance > 0
      ? `<p style="margin:24px 0;"><span style="display:inline-block;background:#f7ba1e;color:#111;font-weight:800;padding:14px 22px;border-radius:999px;">Pay remaining balance · ${formatGbp(booking.remainingBalance)}</span></p><p style="font-size:12px;color:#78716c;">A live Stripe link is added when this email is sent.</p>`
      : '';

  return {
    customerName: escapeHtml(booking.customerName),
    customerEmail: escapeHtml(booking.customerEmail),
    bookingRef: escapeHtml(booking.bookingRef),
    checkinDate: escapeHtml(booking.checkinDate),
    checkoutDate: escapeHtml(booking.checkoutDate),
    nights: String(booking.nights),
    guests: String(booking.guests),
    tentType: escapeHtml(booking.tentType),
    beddingTier: escapeHtml(booking.beddingTier),
    fulfillment: escapeHtml(booking.fulfillment),
    campsiteLocation: escapeHtml(booking.campsiteLocation),
    addons: escapeHtml(addons),
    stayTotal: formatGbp(booking.totalRentalPrice),
    depositPaid: formatGbp(booking.depositAmount),
    paidToday: formatGbp(booking.totalPaidToday),
    remainingBalance: formatGbp(booking.remainingBalance),
    balanceDueDate: escapeHtml(booking.balanceDueDate || '28 days before check-in'),
    securityDeposit: formatGbp(booking.securityDeposit),
    specialRequests: escapeHtml(booking.specialRequests || 'None'),
    kitHtml: kitEmailHtml(booking),
    kitPdfButton,
    lineItemsHtml: `<table style="width:100%;border-collapse:collapse;font-size:13px;">${lineItemsEmailRows(booking)}</table>`,
    payButton,
    depotW3w: escapeHtml(depotW3wLabel()),
    depotW3wUrl: depotW3wUrl(),
    depotHours: escapeHtml(DEPOT.hoursShort),
    depotHoursNote: escapeHtml(DEPOT.hoursNote),
    depotMapsUrl: depotMapsUrl(),
  };
}

export function interpolate(text: string, vars: Record<string, string>, flags: Record<string, boolean>): string {
  const withBlocks = applyConditionals(text, flags);
  return withBlocks.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}

export function wrapBrandHtml(headline: string, innerHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f7f6f2;color:#1c1917;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;">
    <div style="background:#111111;padding:32px 24px;text-align:center;color:#ffffff;border-bottom:4px solid #f7ba1e;">
      <p style="margin:0;color:#f7ba1e;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">The Cosy Canvas Co.</p>
      <h1 style="margin:8px 0 0;font-size:24px;letter-spacing:0.5px;">${headline}</h1>
    </div>
    <div style="padding:32px 24px;font-size:14px;line-height:1.65;color:#444;">
      ${innerHtml}
    </div>
    <div style="background:#f5f4f0;padding:24px;text-align:center;font-size:12px;color:#78716c;border-top:1px solid #e7e5e4;">
      <p style="margin:0 0 8px;"><strong>The Cosy Canvas Co.</strong> — Luxury Bell Tent Hire Scotland</p>
      <p style="margin:0;">Questions? Reply to this email or write to <a href="mailto:hello@cosycanvasco.com" style="color:#7d6e23;">hello@cosycanvasco.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function composeGuestMail(
  booking: BookingRecord,
  type: MailType,
  template: MailTemplate,
  extras: { payUrl?: string; kitPdfUrl?: string } = {},
): { to: string; subject: string; headline: string; body: string; html: string } {
  const vars = mailVars(booking, extras);
  const diy = isDiyFulfillment(booking.fulfillment);
  const flags = {
    balance: booking.remainingBalance > 0.01,
    balanceDueDate: Boolean(booking.balanceDueDate),
    diy,
    deluxe: !diy,
    depotW3wUrl: Boolean(depotWhat3Words()),
  };
  const headline = interpolate(template.headline, vars, flags);
  const subject = interpolate(template.subject, vars, flags);
  const body = interpolate(template.body, vars, flags);
  return {
    to: booking.customerEmail,
    subject,
    headline,
    body,
    html: wrapBrandHtml(headline, body),
  };
}

export function isMailType(value: string): value is MailType {
  return (MAIL_TYPES as readonly string[]).includes(value);
}

export function sentAt(booking: BookingRecord, type: MailType): string | undefined {
  return booking.emails[MAIL_META[type].sentKey];
}

export function ruleSummary(rule: MailRule): string {
  if (!rule.enabled || rule.trigger === 'manual_only') return 'Manual send only';
  const extras = [
    rule.onlyDiy ? 'DIY bookings only' : '',
    rule.requireBalance ? 'only if a balance is due' : '',
  ].filter(Boolean);
  const extra = extras.length ? ` (${extras.join(', ')})` : '';
  if (rule.trigger === 'on_payment') return `Auto: when the deposit is paid${extra}`;
  if (rule.trigger === 'on_checkout') return `Auto: when gear is checked out from the shelf${extra}`;
  return `Auto: ${rule.daysBefore} days before check-in${extra}`;
}

export function mergeMailSettings(input?: Partial<MailSettings> | null): MailSettings {
  const templates = { ...DEFAULT_TEMPLATES };
  const rules = { ...DEFAULT_RULES };
  for (const type of MAIL_TYPES) {
    templates[type] = { ...DEFAULT_TEMPLATES[type], ...(input?.templates?.[type] || {}) };
    rules[type] = { ...DEFAULT_RULES[type], ...(input?.rules?.[type] || {}) };
    if (/Polmont/i.test(templates[type].body)) {
      templates[type] = { ...templates[type], body: DEFAULT_TEMPLATES[type].body };
    }
    if (type === 'kitHandover' && /kitHandoverHtml|security deposit|replacement price/i.test(templates[type].body)) {
      templates[type] = DEFAULT_TEMPLATES.kitHandover;
    }
  }
  return { templates, rules };
}
