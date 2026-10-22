import { clientIp, json, rateLimit } from '@/lib/server/guard';
import { env } from '@/lib/server/env';
import { notifySheet } from '@/lib/server/sheet';
import { validateBulk } from '@/lib/bulk';

/** POST bulk / party order enquiry -> "Bulk Orders" tab in the Sheet + e-mail to the shop + confirmation to the customer. */
export async function POST(req: Request) {
  if (!rateLimit(`bulk:${clientIp(req)}`, 5, 60 * 60_000)) return json({ ok: false, error: 'Too many requests — please try again later or call us on +91 90041 67448.' }, 429);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }
  if (b.website) return json({ ok: true });                    // honeypot

  const v = validateBulk(b);
  if (!v.ok) return json({ ok: false, error: v.error }, 400);
  if (!env.appsScriptUrl()) return json({ ok: false, error: 'Bulk requests are temporarily unavailable. Please call us on +91 90041 67448.' }, 503);

  const ok = await notifySheet({ action: 'bulk', ...v.data });
  if (!ok) return json({ ok: false, error: 'We could not save your request. Please try again or call us on +91 90041 67448.' }, 502);
  return json({ ok: true });
}
