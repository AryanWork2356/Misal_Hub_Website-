import { cleanPhone, clientIp, json, rateLimit } from '@/lib/server/guard';
import { callSheet } from '@/lib/server/sheet';
import { normCode, promoDiscount } from '@/lib/promo';

/** POST { code, phone } -> can this phone number still use this offer (first order only)? The final check repeats when paying. */
export async function POST(req: Request) {
  if (!rateLimit(`promo:${clientIp(req)}`, 20, 10 * 60_000)) return json({ ok: false, error: 'Too many attempts — please wait a few minutes.' }, 429);
  let b: { code?: unknown; phone?: unknown };
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  const code = normCode(b.code);
  const d = promoDiscount(code, 1000);
  if (!code || !d) return json({ ok: false, error: 'That code is not valid.' }, 404);

  const phone = cleanPhone(b.phone);
  if (!phone) return json({ ok: false, code: 'need_phone', error: 'Enter your mobile number above first. The offer is for the first order on each number.' }, 400);

  const r = await callSheet({ action: 'promo_check', phone, code });
  if (r?.used) return json({ ok: false, code: 'promo_used', error: 'Welcome back! The first-order offer is for new customers, so it is not available on this number. You can still order at the normal price.' }, 409);
  return json({ ok: true, code, blurb: d.blurb });
}
