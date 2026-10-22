import { cleanText, json } from '@/lib/server/guard';
import { callSheet } from '@/lib/server/sheet';
import { getSession, setSession } from '@/lib/server/session';
import { validMobile } from '@/lib/phone';

/** POST { name, phone } -> saves the customer's name and mobile number (both required once, at the first sign-in). */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return json({ ok: false, code: 'signin', error: 'Please sign in first.' }, 401);
  let b: { name?: unknown; phone?: unknown };
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }
  const name = cleanText(b.name, 80) || s.name;          // Google already gave the name: only the phone number is asked
  const phone = validMobile(b.phone);
  if (name.length < 2) return json({ ok: false, error: 'Please enter your name.' }, 400);
  if (!phone) return json({ ok: false, error: 'Please enter a real 10-digit mobile number — we call this number about your order.' }, 400);
  const r = await callSheet({ action: 'customer_save', email: s.email, name, phone });
  if (!r?.ok) return json({ ok: false, error: 'We could not save your details. Please try again.' }, 502);
  await setSession(s.email, name, phone, s.picture || '');
  return json({ ok: true, user: { email: s.email, name, phone, picture: s.picture || '' } });
}
