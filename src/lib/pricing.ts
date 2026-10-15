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
  /** up to this distance (inclusive) AND order above freeMinOrder -> no delivery fee */
  freeRadiusKm: 1.5,
  /** "above ₹250" — the subtotal must be MORE than this */
  freeMinOrder: 250,
  /** otherwise: distance (km) x this = fee (₹) ... */
  perKm: 4,
  /** ... but never less than this */
  minFee: 30,
  /** farther than this -> we do not deliver */
  maxKm: 10,
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
  free: boolean;
  message: string;
};

/**
 * Owner's rules:
 *  - up to 1.5 km and order above ₹250  -> free
 *  - otherwise up to 10 km              -> distance x ₹4 per km, minimum ₹30 (3 km -> ₹30, 9 km -> ₹36)
 *  - beyond 10 km                       -> not deliverable
 * (So an order of ₹250 or less within 1.5 km pays the ₹30 minimum — see docs/SETUP.md "Decisions to confirm".)
 */
export function deliveryQuote(rawKm: number, subtotal: number): DeliveryQuote {
  const distanceKm = Math.round(rawKm * 10) / 10;
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return { deliverable: false, distanceKm: 0, fee: 0, free: false, message: 'We could not work out the distance to your address.' };
  }
  if (distanceKm > DELIVERY.maxKm) {
    return { deliverable: false, distanceKm, fee: 0, free: false, message: `Sorry, we deliver up to ${DELIVERY.maxKm} km only. You are ${distanceKm} km away.` };
  }
  const within = distanceKm <= DELIVERY.freeRadiusKm;
  if (within && subtotal > DELIVERY.freeMinOrder) {
    return { deliverable: true, distanceKm, fee: 0, free: true, message: `Free delivery (${distanceKm} km).` };
  }
  const fee = Math.max(DELIVERY.minFee, Math.round(distanceKm * DELIVERY.perKm));
  const why = within
    ? `Orders above ₹${DELIVERY.freeMinOrder} get free delivery within ${DELIVERY.freeRadiusKm} km.`
    : `₹${DELIVERY.perKm} per km, minimum ₹${DELIVERY.minFee}.`;
  return { deliverable: true, distanceKm, fee, free: false, message: `${distanceKm} km — delivery ₹${fee}. ${why}` };
}

export const rupee = (n: number) => `₹${n}`;
export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
