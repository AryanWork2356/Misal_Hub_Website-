import { clientIp, json, rateLimit } from '@/lib/server/guard';
import { authConfigured, cleanEmail, googleClientId } from '@/lib/server/session';
import { finishLogin } from '@/lib/server/login';

/** POST { credential } (the Google ID token from "Continue with Google") -> verified with Google, then signed in. */
export async function POST(req: Request) {
  if (!authConfigured() || !googleClientId()) return json({ ok: false, error: 'Google sign-in is not available right now.' }, 503);
  if (!rateLimit(`google:${clientIp(req)}`, 20, 15 * 60_000)) return json({ ok: false, error: 'Too many attempts. Please wait a few minutes.' }, 429);
  let b: { credential?: unknown };
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }
  const token = String(b.credential ?? '');
  if (token.length < 20 || token.length > 4000) return json({ ok: false, error: 'Bad request.' }, 400);
  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const t = await r.json() as { aud?: string; email?: string; email_verified?: string | boolean; name?: string; picture?: string; exp?: string };
    const email = cleanEmail(t.email);
    if (!r.ok || t.aud !== googleClientId() || !email || !(t.email_verified === true || t.email_verified === 'true')) return json({ ok: false, error: 'Google sign-in could not be verified.' }, 401);
    const picture = typeof t.picture === 'string' && /^https:\/\//.test(t.picture) ? t.picture.slice(0, 400) : '';
    return finishLogin(email, String(t.name || '').slice(0, 80), 'google', picture);
  } catch {
    return json({ ok: false, error: 'Google sign-in failed. Please try again or use an email code.' }, 502);
  }
}
