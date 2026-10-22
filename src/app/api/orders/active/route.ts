import { json } from '@/lib/server/guard';
import { getSheet } from '@/lib/server/sheet';
import { getSession } from '@/lib/server/session';

/** GET -> the signed-in customer's current order (paid, not yet delivered) for the floating tracker. Works on any device. */
export async function GET() {
  const s = await getSession();
  if (!s) return json({ ok: true, order: null });
  const r = await getSheet({ action: 'active_order', email: s.email });
  if (!r || r.ok !== true || !r.ref) return json({ ok: true, order: null, serverNow: Date.now() });
  return json({
    ok: true,
    serverNow: Number(r.serverNow) || Date.now(),
    order: {
      ref: String(r.ref), progress: String(r.progress || 'Preparing'), items: String(r.items || ''), total: Number(r.total) || 0, type: String(r.type || ''),
      address: String(r.address || ''), etaAt: typeof r.etaAt === 'number' ? r.etaAt : null, etaMin: typeof r.etaMin === 'number' ? r.etaMin : null, note: String(r.note || ''),
    },
  });
}
