import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getAllBookings } from '../../lib/booking-store';
import { durnessUnavailableMessage, isDurnessBooking, takenDurnessMonthKeys } from '../../lib/durness';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const data = await request.json();
    const {
      checkinDate,
      checkoutDate,
      guests,
      bedding,
      fulfillment,
      addons = {},
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      campsiteLocation,
      specialRequests,
      partnerSiteKey = '',
      conciergeRequested = false,
    } = data;

    if (!checkinDate || !checkoutDate || !guests || !customerName || !customerEmail || !campsiteLocation) {
      return new Response(
        JSON.stringify({ error: 'Missing required booking details. Please complete all fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isDurnessBooking(campsiteLocation, partnerSiteKey)) {
      const taken = takenDurnessMonthKeys(await getAllBookings());
      const durnessError = durnessUnavailableMessage(checkinDate, taken);
      if (durnessError) {
        return new Response(JSON.stringify({ error: durnessError }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 1. Calculate dates and nights
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = checkout.getTime() - checkin.getTime();
    const nights = Math.max(2, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const daysUntilCheckin = Math.ceil((checkin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 2. Determine Tent Type & Price
    let tentType = '4M Bell Tent';
    let ratePerNight = 50;
    if (guests >= 7) {
      tentType = '6M Cathedral';
      ratePerNight = 100;
    } else if (guests >= 4) {
      tentType = '5M Bell Tent';
      ratePerNight = 75;
    }

    const baseTentPrice = ratePerNight * nights;

    // Multi-night & early bird discount
    let discountRate = 0;
    if (nights === 3) discountRate = 0.05;
    else if (nights === 4) discountRate = 0.10;
    else if (nights === 5) discountRate = 0.15;
    else if (nights >= 6) discountRate = 0.25;

    if (checkinDate.startsWith('2027') && discountRate < 0.15) {
      discountRate = 0.15;
    }

    const discountedTentPrice = baseTentPrice * (1 - discountRate);

    // 3. Bedding calculation
    let beddingPrice = 0;
    let beddingTitle = 'DIY Sleeping (No Bedding)';
    if (bedding === 'essentials') {
      beddingPrice = 25 * guests;
      beddingTitle = 'Bedding: Essentials';
    } else if (bedding === 'cosy') {
      beddingPrice = 35 * guests;
      beddingTitle = 'Bedding: Cosy Camping Luxury';
    }

    // 4. Add-ons calculation
    const addonPriceMap: Record<string, { title: string; price: number }> = {
      kitchen: { title: 'Cosy Kitchen Setup', price: 40 + 5 * guests },
      living: { title: 'Cosy Living Lounge', price: 65 },
      woodburner: { title: 'Indoor Wood Burner', price: 40 },
      awning: { title: 'Outdoor Awning Porch', price: 30 },
      chairs: { title: 'Indoor & Outdoor Chairs', price: 10 * guests },
      firecooking: { title: 'Fire Cooking Gear', price: 25 },
      starlink: { title: 'Starlink Satellite Wi-Fi', price: 10 * nights },
      beachtoys: { title: 'Beach & Adventure Kit', price: 20 },
    };

    let addonsTotal = 0;
    const selectedAddonsList: { title: string; price: number }[] = [];
    for (const key of Object.keys(addons)) {
      if (addons[key] && addonPriceMap[key]) {
        const item = addonPriceMap[key];
        addonsTotal += item.price;
        selectedAddonsList.push(item);
      }
    }

    // 5. Fulfillment calculation
    const fulfillmentPrice = fulfillment === 'deluxe' ? 225 : 0;
    const fulfillmentTitle = fulfillment === 'deluxe' ? 'Cosy Camping Deluxe Setup & Pitching' : 'DIY Depot Pickup';

    // 6. Total Stay Price
    const totalRentalPrice = discountedTentPrice + beddingPrice + addonsTotal + fulfillmentPrice;

    // 7. Deposit Rule (50% if >= 28 days, 100% if < 28 days)
    const isFiftyPercentEligible = daysUntilCheckin >= 28;
    const depositPercent = isFiftyPercentEligible ? 50 : 100;
    const depositAmount = isFiftyPercentEligible ? Number((totalRentalPrice * 0.5).toFixed(2)) : totalRentalPrice;
    const remainingBalance = isFiftyPercentEligible ? Number((totalRentalPrice - depositAmount).toFixed(2)) : 0;

    let balanceDueDate = '';
    if (isFiftyPercentEligible) {
      const dueDate = new Date(checkin);
      dueDate.setDate(dueDate.getDate() - 28);
      balanceDueDate = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // 8. Refundable Security Deposit
    const securityDeposit = 200;
    const totalDueToday = depositAmount + securityDeposit;

    // Unique Booking Ref
    const bookingRef = `CC-${Math.floor(100000 + Math.random() * 900000)}`;
    const partner = Boolean(partnerSiteKey);
    const concierge = Boolean(conciergeRequested) || partner;
    const conciergeNote = [
      specialRequests || '',
      concierge ? 'Cosy Concierge with Trystan.' : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey || stripeSecretKey === 'sk_test_placeholder_key' || stripeSecretKey.startsWith('sk_test_placeholder')) {
      // If Stripe keys are placeholder, return informative error or mock support
      return new Response(
        JSON.stringify({
          error: 'Stripe Secret Key is not configured yet in .env. Please set a valid STRIPE_SECRET_KEY.',
          isPlaceholderKey: true,
          bookingSummary: {
            bookingRef,
            totalRentalPrice,
            depositPercent,
            depositAmount,
            securityDeposit,
            totalDueToday,
            remainingBalance,
            balanceDueDate,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Build Stripe Line Items
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${tentType} (${nights} Nights: ${checkinDate} to ${checkoutDate}) - ${depositPercent}% Deposit`,
            description: `Includes: ${beddingTitle}, ${fulfillmentTitle}, and ${selectedAddonsList.length} add-ons. Total stay value: £${totalRentalPrice.toFixed(2)}${remainingBalance > 0 ? ` (Balance of £${remainingBalance.toFixed(2)} due by ${balanceDueDate})` : ''}`,
          },
          unit_amount: Math.round(depositAmount * 100), // in pence
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Refundable Security Deposit',
            description: 'Held for peace of mind. Automatically released 48h after post-stay inspection.',
          },
          unit_amount: Math.round(securityDeposit * 100), // £200 in pence
        },
        quantity: 1,
      },
    ];

    // Create Stripe Embedded Session
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items,
      return_url: `${url.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        bookingRef,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress: customerAddress || '',
        campsiteLocation,
        specialRequests: conciergeNote,
        checkinDate,
        checkoutDate,
        nights: String(nights),
        guests: String(guests),
        tentType,
        beddingTier: beddingTitle,
        beddingPrice: String(beddingPrice),
        addonsList: JSON.stringify(selectedAddonsList),
        fulfillment: fulfillmentTitle,
        fulfillmentPrice: String(fulfillmentPrice),
        totalRentalPrice: String(totalRentalPrice.toFixed(2)),
        depositPercent: String(depositPercent),
        depositAmount: String(depositAmount.toFixed(2)),
        securityDeposit: String(securityDeposit.toFixed(2)),
        totalPaidToday: String(totalDueToday.toFixed(2)),
        remainingBalance: String(remainingBalance.toFixed(2)),
        balanceDueDate,
        type: 'deposit',
        conciergeRequested: concierge ? 'true' : 'false',
        partnerSiteKey: partnerSiteKey || '',
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: session.client_secret,
        bookingRef,
        depositAmount,
        securityDeposit,
        totalDueToday,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Stripe Session Error]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create payment session.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
