/**
 * Cart persistence as a tiny external store (localStorage), read with useSyncExternalStore.
 * Server snapshot is always an empty cart, so server and first client render agree.
 */
export type Cart = Record<string, number>;

const STORE = 'mh_cart_v1';
const listeners = new Set<() => void>();

export function subscribeCart(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === STORE) cb(); };
  window.addEventListener('storage', onStorage); // other tabs
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage); };
}

/** Raw JSON string — a primitive, so the snapshot is stable between renders. */
export function cartSnapshot(): string {
  try { return localStorage.getItem(STORE) || '{}'; } catch { return '{}'; }
}
export const cartServerSnapshot = () => '{}';

export function parseCart(json: string): Cart {
  try { const c = JSON.parse(json); return c && typeof c === 'object' ? c : {}; } catch { return {}; }
}

export function writeCart(next: Cart) {
  try { localStorage.setItem(STORE, JSON.stringify(next)); } catch { /* private mode: cart just won't persist */ }
  listeners.forEach((l) => l());
}
