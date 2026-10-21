/**
 * Promo codes. A flat percentage (no cap) of the FOOD subtotal (never to the delivery fee).
 * The server recomputes everything; the browser only previews it.
 * "One use per phone number" is enforced in the Google Sheet (see apps-script/Code.gs, promoUsed_).
 */
export const PROMOS: Record<string, { percent: number; title: string; blurb: string }> = {
  MISAL10: { percent: 10, title: '10% off your first order', blurb: '10% off your first order' },
};

export const normCode = (c: unknown) => String(c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);

export type PromoResult = { code: string; discount: number; blurb: string };

/** discount for `code` on a food subtotal, or null when the code is unknown / empty. Whole rupees, rounded down. */
export function promoDiscount(code: unknown, subtotal: number): PromoResult | null {
  const c = normCode(code);
  const p = PROMOS[c];
  if (!p || !Number.isFinite(subtotal) || subtotal <= 0) return null;
  const discount = Math.floor((subtotal * p.percent) / 100);
  return { code: c, discount, blurb: p.blurb };
}
