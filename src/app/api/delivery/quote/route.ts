import { deliveryQuote } from '@/lib/pricing';
import { drivingKm, geocode, reverseGeocode } from '@/lib/server/geo';
import { clientIp, cleanText, json, rateLimit } from '@/lib/server/guard';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** POST { address? | lat+lng, subtotal } -> distance, fee, resolved address. Rules live in lib/pricing.ts. */
export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientIp(req)}`, 20, 60_000)) return json({ ok: false, error: 'Too many requests — please wait a minute.' }, 429);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  const subtotal = num(body.subtotal) ?? 0;
  if (subtotal < 0 || subtotal > 100_000) return json({ ok: false, error: 'Bad request.' }, 400);

  let lat = num(body.lat), lng = num(body.lng);
  let label = '';
  try {
    if (lat != null && lng != null) {
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return json({ ok: false, error: 'Bad location.' }, 400);
      label = await reverseGeocode({ lat, lng });
    } else {
      const address = cleanText(body.address, 250);
      if (address.length < 8) return json({ ok: false, error: 'Please enter your full address.' }, 400);
      const g = await geocode(address);
      if (!g) return json({ ok: false, error: 'We could not find that address. Add a landmark or area name, or use "Use my current location".' }, 404);
      ({ lat, lng, label } = g);
    }
    const { km, source } = await drivingKm({ lat: lat as number, lng: lng as number });
    const q = deliveryQuote(km, subtotal);
    return json({ ok: true, ...q, lat, lng, label, source });
  } catch (e) {
    console.error('[quote]', (e as Error).message);
    return json({ ok: false, error: 'Could not check delivery right now. Please try again, or choose Pickup.' }, 502);
  }
}
