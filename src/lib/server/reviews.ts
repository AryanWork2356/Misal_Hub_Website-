import 'server-only';
import { cacheLife } from 'next/cache';
import { GOOGLE, REVIEWS, type Review } from '@/data/reviews';

export type ReviewsData = {
  rating: number;
  count: number | null;
  reviews: Review[];
  /** where the "Read our reviews on Google" button goes */
  url: string;
  source: 'google' | 'manual';
};

type PlacesReview = {
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string };
};

/**
 * Real Google reviews via the official Places API (New).
 * Needs GOOGLE_MAPS_API_KEY and GOOGLE_PLACE_ID (see docs/SETUP.md). Google returns at most the 5 "most relevant" reviews,
 * which is a Google limit. The result is cached and refreshed about every hour, so the page stays fast and the API bill ~zero.
 * Without those settings (or if Google is unreachable) it falls back to the list in src/data/reviews.ts.
 */
export async function getReviewsData(): Promise<ReviewsData> {
  'use cache';
  cacheLife('hours');

  const manual: ReviewsData = { rating: GOOGLE.rating, count: null, reviews: REVIEWS, url: GOOGLE.url, source: 'manual' };
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return manual;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews' },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const reviews: Review[] = ((j.reviews || []) as PlacesReview[])
      .map((r) => ({
        name: r.authorAttribution?.displayName || 'Google user',
        stars: Math.round(r.rating || 5),
        text: (r.text?.text || r.originalText?.text || '').trim(),
        when: r.relativePublishTimeDescription,
      }))
      .filter((r) => r.text.length > 0);
    return {
      rating: typeof j.rating === 'number' ? j.rating : GOOGLE.rating,
      count: typeof j.userRatingCount === 'number' ? j.userRatingCount : null,
      reviews,
      url: j.googleMapsUri || GOOGLE.url,
      source: 'google',
    };
  } catch (e) {
    console.error('[reviews] Places API failed, using manual list:', (e as Error).message);
    return manual;
  }
}
