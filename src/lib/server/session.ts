import 'server-only';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { env } from './env';

/**
 * Customer accounts without a database:
 *  - sign-in proves the e-mail address (Google, or a 6-digit code we e-mail);
 *  - the signed-in state is a signed cookie (HMAC) — it cannot be edited or made up by the browser;
 *  - name + phone live in the Google Sheet ("Customers" tab) and are copied into the cookie at sign-in.
 */
const COOKIE = 'mh_session';
const MAX_AGE = 90 * 24 * 60 * 60;                    // stay signed in for 90 days
const key = () => process.env.SESSION_SECRET || env.appsScriptSecret() || env.razorpayKeySecret();

export type Session = { email: string; name: string; phone: string; picture?: string; exp: number };

/** sign-in needs a secret to sign with and the Sheet script to send codes / store accounts */
export const authConfigured = () => !!key() && !!env.appsScriptUrl();
export const googleClientId = () => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';

const mac = (s: string) => createHmac('sha256', key()).update(s).digest('base64url');
const safeEq = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export function makeToken(s: Session): string {
  const body = Buffer.from(JSON.stringify(s)).toString('base64url');
  return `${body}.${mac(`s|${body}`)}`;
}
export function readToken(token: string | undefined | null, now = Date.now()): Session | null {
  if (!token || !key()) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig || !safeEq(sig, mac(`s|${body}`))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
    return s && typeof s.email === 'string' && s.exp > now ? s : null;
  } catch { return null; }
}

export async function getSession(): Promise<Session | null> {
  return readToken((await cookies()).get(COOKIE)?.value);
}
export async function setSession(email: string, name: string, phone: string, picture = ''): Promise<Session> {
  const s: Session = { email, name, phone, ...(picture ? { picture } : {}), exp: Date.now() + MAX_AGE * 1000 };
  (await cookies()).set(COOKIE, makeToken(s), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE });
  return s;
}
export async function clearSession() { (await cookies()).delete(COOKIE); }

/* ---- e-mail code challenge (stateless): the browser gets { exp.sig }, never the code ---- */
const CODE_TTL = 10 * 60 * 1000;
export const newCode = () => String(randomInt(100000, 1000000));
export function makeChallenge(email: string, code: string, now = Date.now()): string {
  const exp = now + CODE_TTL;
  return `${exp}.${mac(`c|${email}|${exp}|${code}`)}`;
}
export function checkChallenge(email: string, code: string, challenge: unknown, now = Date.now()): boolean {
  if (typeof challenge !== 'string' || !key()) return false;
  const [exp, sig] = challenge.split('.');
  if (!exp || !sig || !/^\d{12,15}$/.test(exp) || Number(exp) < now) return false;
  return safeEq(sig, mac(`c|${email}|${exp}|${code}`));
}

export const cleanEmail = (v: unknown): string | null => {
  const e = String(v ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120 ? e : null;
};
