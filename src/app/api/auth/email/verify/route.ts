import { clientIp, json, rateLimit } from '@/lib/server/guard';
import { checkChallenge, cleanEmail } from '@/lib/server/session';
import { finishLogin } from '@/lib/server/login';

/** POST { email, code, challenge } -> signs the customer in when the code is right. */
export async function POST(req: Request) {
  let b: { email?: unknown; code?: unknown; challenge?: unknown };
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }
  const email = cleanEmail(b.email);
  const code = String(b.code ?? '').replace(/\D/g, '');
  if (!email || code.length !== 6) return json({ ok: false, error: 'Please enter the 6-digit code from your email.' }, 400);
  if (!rateLimit(`verify-ip:${clientIp(req)}`, 15, 15 * 60_000) || !rateLimit(`verify-mail:${email}`, 8, 15 * 60_000)) {
    return json({ ok: false, error: 'Too many attempts. Please wait a few minutes.' }, 429);
  }
  if (!checkChallenge(email, code, b.challenge)) return json({ ok: false, error: 'That code is not right or has expired. Please check it or ask for a new one.' }, 400);
  return finishLogin(email, '', 'email');
}
