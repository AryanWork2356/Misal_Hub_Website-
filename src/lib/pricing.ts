/**
 * Prices, delivery rules and opening hours — ONE place, used by the server (authoritative) and the browser (preview).
 * Never trust a price sent from the browser: the checkout API re-prices the cart with priceCart() below.
 */
import { MENU, type Item } from '@/data/menu';

export type Mode = 'regular' | 'jain';
export type CartInput = { id: string; mode: Mode; qty: number }[];
export type PricedLine = { id: string; name: string; mode: Mode; qty: number; unit: number; total: number };

/** The shop. Coordinates are where delivery distance is measured from (the shop's Google Maps pin). */
export const SHOP = {
  name: 'Misal Hub',
  address: 'Shop 2/3, Silver Cassia Apartment, Pleasant Park Road, Mira Road East, Thane 401107',
  lat: 19.274968,   // the shop's Google Maps pin
  lng: 72.8772034,
  phone: '+91 90041 67448',
  whatsapp: '919004167448',
};

/** Delivery rules (set by the owner). */
export const DELIVERY = {
  /** up to this distance (inclusive) the "near" fee applies */
  nearKm: 1,
  /** fee (₹) up to nearKm */
  nearFee: 50,
  /** fee (₹) beyond nearKm, up to maxKm */
  farFee: 80,
  /** farther than this -> we do not deliver */
  maxKm: 5,
} as const;

export { HOURS, isOpenNow } from './hours';

const BY_ID = new Map<string, Item>();
MENU.forEach((c) => c.items.forEach((i) => BY_ID.set(i.id, i)));

export const unitPrice = (it: Item, mode: Mode): number | null => (mode === 'jain' ? it.j ?? null : it.p);
export const hasModePrice = (it: Item, mode: Mode) => (mode === 'jain' ? Object.prototype.hasOwnProperty.call(it, 'j') : true);

/** Re-price a cart from the menu data. Rejects unknown, seasonal, wrong-menu or silly quantities. */
export function priceCart(input: unknown): { ok: true; lines: PricedLine[]; subtotal: number } | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: 'Your order is empty.' };
  if (input.length > 40) return { ok: false, error: 'Too many different items in one order.' };

  const merged = new Map<string, PricedLine>();
  for (const raw of input) {
    const r = raw as { id?: unknown; mode?: unknown; qty?: unknown };
    const mode: Mode = r.mode === 'jain' ? 'jain' : 'regular';
    const qty = Number(r.qty);
    const it = typeof r.id === 'string' ? BY_ID.get(r.id) : undefined;
    if (!it) return { ok: false, error: 'An item in your order is no longer on the menu.' };
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) return { ok: false, error: `Invalid quantity for ${it.name}.` };
    if (!hasModePrice(it, mode)) return { ok: false, error: `${it.name} is not on the ${mode === 'jain' ? 'Jain' : 'regular'} menu.` };
    const unit = unitPrice(it, mode);
    if (unit == null) return { ok: false, error: `${it.name} is seasonal — please ask in store.` };
    const key = `${it.id}:${mode}`;
    const prev = merged.get(key);
    const nextQty = (prev?.qty ?? 0) + qty;
    if (nextQty > 50) return { ok: false, error: `Invalid quantity for ${it.name}.` };
    merged.set(key, { id: it.id, name: it.name, mode, qty: nextQty, unit, total: nextQty * unit });
  }
  const lines = [...merged.values()];
  return { ok: true, lines, subtotal: lines.reduce((a, l) => a + l.total, 0) };
}

export type DeliveryQuote = {
  deliverable: boolean;
  /** driving distance, rounded to 0.1 km (this rounded value is what the fee is based on) */
  distanceKm: number;
  fee: number;
  message: string;
};

/**
 * Owner's rules (flat fee, no free delivery):
 *  - up to 1 km (inclusive) -> ₹50
 *  - over 1 km, up to 5 km  -> ₹80
 *  - beyond 5 km            -> not deliverable
 */
export function deliveryQuote(rawKm: number): DeliveryQuote {
  const distanceKm = Math.round(rawKm * 10) / 10;
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return { deliverable: false, distanceKm: 0, fee: 0, message: 'We could not work out the distance to your address.' };
  }
  if (distanceKm > DELIVERY.maxKm) {
    return { deliverable: false, distanceKm, fee: 0, message: `Sorry, we deliver up to ${DELIVERY.maxKm} km only. You are ${distanceKm} km away. You can choose Pickup instead.` };
  }
  const fee = distanceKm <= DELIVERY.nearKm ? DELIVERY.nearFee : DELIVERY.farFee;
  return { deliverable: true, distanceKm, fee, message: `${distanceKm} km — delivery ₹${fee}.` };
}

export const rupee = (n: number) => `₹${n}`;
export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
