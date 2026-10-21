import 'server-only';
import { env } from './env';

/**
 * The owner's manual switch ("Settings" tab in the Google Sheet: Delivery = YES/NO, Pickup = YES/NO, Message).
 * Anything that goes wrong reading it keeps the shop OPEN (a Google hiccup must never block orders).
 * Emergency override without the Sheet: set ORDERS_DELIVERY_PAUSED=1 / ORDERS_PICKUP_PAUSED=1 in Vercel.
 */
export type OrderStatus = { delivery: boolean; pickup: boolean; message: string };

let cache: { at: number; v: OrderStatus } | null = null;
const TTL = 15_000;

export async function getOrderStatus(): Promise<OrderStatus> {
  const forcedDelivery = process.env.ORDERS_DELIVERY_PAUSED !== '1';
  const forcedPickup = process.env.ORDERS_PICKUP_PAUSED !== '1';
  if (!cache || Date.now() - cache.at > TTL) {
    let v: OrderStatus = { delivery: true, pickup: true, message: '' };
    const url = env.appsScriptUrl();
    if (url) {
      try {
        const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}action=status&secret=${encodeURIComponent(env.appsScriptSecret())}`, {
          redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(5000),
        });
        const o = (await res.json()) as { ok?: boolean; delivery?: string; pickup?: string; message?: string };
        if (o.ok) v = { delivery: String(o.delivery).toUpperCase() !== 'NO', pickup: String(o.pickup).toUpperCase() !== 'NO', message: String(o.message || '').slice(0, 160) };
      } catch { /* keep open */ }
    }
    cache = { at: Date.now(), v };
  }
  return { delivery: cache.v.delivery && forcedDelivery, pickup: cache.v.pickup && forcedPickup, message: cache.v.message };
}
