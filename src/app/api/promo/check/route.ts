import { cleanPhone, clientIp, json, rateLimit } from '@/lib/server/guard';
import { callSheet } from '@/lib/server/sheet';
import { normCode, promoDiscount } from '@/lib/promo';

/** POST { code, phone, subtotal } -> is this offer valid for this phone number (first use only)? Final check happens again at payment. */
export async function POST(req: Request) {
  if (!rateLimit(`promo:${clientIp(req)}`, 20, 10 * 60_000)) return json({ ok: false, error: 'Too many attempts — please wait a few minutes.' }, 429);
  let b: { code?: unknown; phone?: unknown; subtotal?: unknown };
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  const code = normCode(b.code);
  const subtotal = typeof b.subtotal === 'number' ? b.subtotal : 0;
  const d = promoDiscount(code, subtotal || 1000);
  if (!code || !d) return json({ ok: false, error: 'That offer code is not valid.' }, 404);

  const phone = cleanPhone(b.phone);
  if (!phone) return json({ ok: false, error: 'Please enter your 10-digit mobile number first, so we can check the offer is still available for you.' }, 400);

  const r = await callSheet({ action: 'promo_check', phone, code });
  if (r?.used) return json({ ok: false, code: 'promo_used', error: 'Welcome back! The first-order offer is for new customers, so it is not available on this number. You can still order at the normal price.' }, 409);
  return json({ ok: true, code, blurb: d.blurb });
}
