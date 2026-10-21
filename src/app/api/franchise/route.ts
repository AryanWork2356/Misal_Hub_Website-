import { cleanPhone, cleanText, clientIp, isEmail, json, rateLimit } from '@/lib/server/guard';
import { env } from '@/lib/server/env';
import { notifySheet } from '@/lib/server/sheet';

/** POST franchise application -> Google Sheet row + e-mail to the shop + confirmation e-mail to the applicant. */
export async function POST(req: Request) {
  if (!rateLimit(`franchise:${clientIp(req)}`, 5, 60 * 60_000)) return json({ ok: false, error: 'Too many submissions — please try again later.' }, 429);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  if (b.website) return json({ ok: true }); // honeypot field: real people leave it empty, bots fill it

  const name = cleanText(b.name, 80);
  const phone = cleanPhone(b.phone);
  const email = cleanText(b.email, 120);
  const city = cleanText(b.city, 80);
  if (name.length < 2) return json({ ok: false, error: 'Please enter your name.' }, 400);
  if (!phone) return json({ ok: false, error: 'Please enter a valid 10-digit mobile number.' }, 400);
  if (!isEmail(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (city.length < 2) return json({ ok: false, error: 'Please enter your city.' }, 400);

  if (!env.appsScriptUrl()) return json({ ok: false, error: 'Applications are temporarily unavailable. Please call us on +91 90041 67448.' }, 503);

  const ok = await notifySheet({
    action: 'franchise',
    name, phone, email, city,
    message: cleanText(b.message, 1000),
  });
  if (!ok) return json({ ok: false, error: 'We could not save your application. Please try again or call us on +91 90041 67448.' }, 502);
  return json({ ok: true });
}
