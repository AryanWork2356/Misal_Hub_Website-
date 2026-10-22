import { clientIp, json, rateLimit } from '@/lib/server/guard';
import { getSheet } from '@/lib/server/sheet';
import { normalizePhone } from '@/lib/phone';

/** POST { ref, phone } -> the live status of that PAID order (needs both the order reference and the phone number it was placed with). */
export async function POST(req: Request) {
  if (!rateLimit(`track:${clientIp(req)}`, 90, 10 * 60_000)) return json({ ok: false, error: 'Too many requests.' }, 429);
  let b: { ref?: unknown; phone?: unknown };
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  const ref = String(b.ref ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30);
  const phone = normalizePhone(b.phone);
  if (!ref || !phone) return json({ ok: false, error: 'Order not found.' }, 404);

  const r = await getSheet({ action: 'track', ref, phone });
  if (!r || r.ok !== true) return json({ ok: false, error: 'Order not found.' }, 404);
  return json({
    ok: true,
    serverNow: Number(r.serverNow) || Date.now(),
    order: {
      ref, progress: String(r.progress || 'Preparing'), items: String(r.items || ''), total: Number(r.total) || 0, type: String(r.type || ''),
      address: String(r.address || ''), etaAt: typeof r.etaAt === 'number' ? r.etaAt : null, etaMin: typeof r.etaMin === 'number' ? r.etaMin : null, note: String(r.note || ''),
    },
  });
}
