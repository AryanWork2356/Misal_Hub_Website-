import { json } from '@/lib/server/guard';
import { getSheet } from '@/lib/server/sheet';
import { getSession } from '@/lib/server/session';
import { toView } from '@/lib/server/orderView';

/** GET -> the signed-in customer's current orders for the floating tracker (all active ones, plus ones finished in the last 3 hours). Works on any device. */
export async function GET() {
  const s = await getSession();
  if (!s) return json({ ok: true, orders: [], order: null });
  const r = await getSheet({ action: 'active_orders', email: s.email });
  const list = r && r.ok === true && Array.isArray(r.orders) ? (r.orders as Record<string, unknown>[]).map(toView) : [];
  return json({ ok: true, serverNow: Number(r?.serverNow) || Date.now(), orders: list, order: list[0] ?? null });
}
