import { json } from '@/lib/server/guard';
import { getSheet } from '@/lib/server/sheet';
import { getSession } from '@/lib/server/session';
import { toView } from '@/lib/server/orderView';

/** GET -> every paid order of the signed-in customer (newest first, max 40) with the full bill, for "My orders". */
export async function GET() {
  const s = await getSession();
  if (!s) return json({ ok: false, code: 'signin', error: 'Please sign in to see your orders.' }, 401);
  const r = await getSheet({ action: 'my_orders', email: s.email });
  if (!r || r.ok !== true) return json({ ok: false, error: 'We could not load your orders right now. Please try again.' }, 502);
  const list = Array.isArray(r.orders) ? (r.orders as Record<string, unknown>[]).map(toView) : [];
  return json({ ok: true, serverNow: Number(r.serverNow) || Date.now(), orders: list });
}
