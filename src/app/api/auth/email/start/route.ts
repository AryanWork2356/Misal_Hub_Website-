import { clientIp, json, rateLimit } from '@/lib/server/guard';
import { callSheet } from '@/lib/server/sheet';
import { authConfigured, cleanEmail, makeChallenge, newCode } from '@/lib/server/session';

let sentToday = { day: '', n: 0 };

/** POST { email } -> e-mails a 6-digit code (through the shop's Apps Script) and returns the signed challenge for the next step. */
export async function POST(req: Request) {
  if (!authConfigured()) return json({ ok: false, error: 'Sign-in is being set up. Please call us on +91 90041 67448 to order.' }, 503);
  let b: { email?: unknown };
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }
  const email = cleanEmail(b.email);
  if (!email) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (!rateLimit(`code-ip:${clientIp(req)}`, 6, 60 * 60_000) || !rateLimit(`code-mail:${email}`, 4, 30 * 60_000)) {
    return json({ ok: false, error: 'Too many codes requested. Please wait a few minutes and try again.' }, 429);
  }
  const day = new Date().toISOString().slice(0, 10);                       // protects the shop's daily e-mail allowance
  if (sentToday.day !== day) sentToday = { day, n: 0 };
  if (++sentToday.n > 80) return json({ ok: false, error: 'Sign-in e-mails are busy right now. Please try again later or continue with Google.' }, 429);

  const code = newCode();
  const r = await callSheet({ action: 'send_code', email, code });
  if (!r?.ok) return json({ ok: false, error: 'We could not send the code. Please check the address and try again.' }, 502);
  return json({ ok: true, challenge: makeChallenge(email, code) });
}
