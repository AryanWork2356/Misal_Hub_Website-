import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env';

/**
 * Proof that the customer opened the /offer page (QR or link). The page asks for a token, the browser keeps it,
 * and checkout only accepts the offer code together with a valid, recent token. So typing the code (or editing a link)
 * by itself gets nothing. Signed with a server secret, so it cannot be made up in the browser.
 */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const key = () => process.env.OFFER_SECRET || env.appsScriptSecret() || env.razorpayKeySecret();

const sign = (ts: string) => createHmac('sha256', key()).update(`offer|${ts}`).digest('hex').slice(0, 32);

export function makeOfferToken(now = Date.now()): string | null {
  if (!key()) return null;
  const ts = String(now);
  return `${ts}.${sign(ts)}`;
}

export function verifyOfferToken(token: unknown, now = Date.now()): boolean {
  if (!key() || typeof token !== 'string') return false;
  const [ts, sig] = token.split('.');
  if (!ts || !sig || !/^\d{10,15}$/.test(ts)) return false;
  const age = now - Number(ts);
  if (age < -60_000 || age > MAX_AGE_MS) return false;
  const want = Buffer.from(sign(ts)), got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}
