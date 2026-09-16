import { readSecretEnv } from './stripe-client';

export interface GuestReview {
  author: string;
  quote: string;
  rating: number;
  meta: string;
  source: 'google' | 'site';
}

export interface GuestReviewsResult {
  reviews: GuestReview[];
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string | null;
  fromGoogle: boolean;
}

const FALLBACK_REVIEWS: GuestReview[] = [
  {
    author: 'Annie',
    quote:
      'Trystan and his team really got us out of a fix! Fast setup, incredible accommodation, and seamless collection. We will definitely book again without hesitation.',
    rating: 5,
    meta: 'Loch Lomond Stay',
    source: 'site',
  },
  {
    author: 'Rhys L.',
    quote:
      'The set up was perfect when we arrived and collection afterwards was just as smooth. Made the whole trip so much easier and more enjoyable!',
    rating: 5,
    meta: 'Coastal Sutherland Stay',
    source: 'site',
  },
  {
    author: 'Donna R.',
    quote:
      'Dealing with the company from initial inquiry to setup was completely effortless. The kids loved watching movies in the tent!',
    rating: 5,
    meta: 'Falkirk Garden Sleepover',
    source: 'site',
  },
];

type PlacesReview = {
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
  authorAttribution?: { displayName?: string };
};

type PlacesDetails = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReview[];
};

let cache: { expiresAt: number; result: GuestReviewsResult } | null = null;
const CACHE_MS = 60 * 60 * 1000;

function stars(rating: number): number {
  const n = Math.round(rating);
  return Math.min(5, Math.max(1, n || 5));
}

function fallbackResult(): GuestReviewsResult {
  return {
    reviews: FALLBACK_REVIEWS,
    rating: null,
    reviewCount: null,
    mapsUrl: null,
    fromGoogle: false,
  };
}

export async function getGuestReviews(limit = 3): Promise<GuestReviewsResult> {
  if (cache && cache.expiresAt > Date.now()) return cache.result;

  const apiKey = readSecretEnv('GOOGLE_PLACES_API_KEY');
  const placeId = readSecretEnv('GOOGLE_PLACES_PLACE_ID');

  if (!apiKey || !placeId || apiKey.includes('placeholder')) {
    return fallbackResult();
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri,displayName',
      },
    });

    if (!response.ok) {
      console.error('[Google Reviews] Places API error', response.status, await response.text());
      return fallbackResult();
    }

    const data = (await response.json()) as PlacesDetails;
    const googleReviews = (data.reviews || [])
      .map((review) => {
        const quote = (review.text?.text || '').trim();
        const author = (review.authorAttribution?.displayName || 'Google guest').trim();
        if (!quote) return null;
        return {
          author,
          quote,
          rating: stars(review.rating || 5),
          meta: review.relativePublishTimeDescription || 'Google Review',
          source: 'google' as const,
        };
      })
      .filter((review): review is GuestReview => Boolean(review))
      .slice(0, limit);

    if (!googleReviews.length) return fallbackResult();

    const result: GuestReviewsResult = {
      reviews: googleReviews,
      rating: typeof data.rating === 'number' ? data.rating : null,
      reviewCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : null,
      mapsUrl: data.googleMapsUri || null,
      fromGoogle: true,
    };

    cache = { expiresAt: Date.now() + CACHE_MS, result };
    return result;
  } catch (error) {
    console.error('[Google Reviews] Failed to load', error);
    return fallbackResult();
  }
}

export function starIcons(rating: number): string {
  const filled = stars(rating);
  return Array.from({ length: 5 }, (_, i) =>
    i < filled ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>',
  ).join('');
}
