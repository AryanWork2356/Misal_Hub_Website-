import { connection } from 'next/server';
import { clientIp, json, rateLimit } from '@/lib/server/guard';
import { makeOfferToken } from '@/lib/server/offerToken';

/** POST -> { token } : called by the /offer page. Checkout accepts the offer code only together with this token. */
export async function POST(req: Request) {
  await connection();
  if (!rateLimit(`offer:${clientIp(req)}`, 30, 10 * 60_000)) return json({ ok: false }, 429);
  const token = makeOfferToken();
  return token ? json({ ok: true, token }) : json({ ok: false }, 503);
}
