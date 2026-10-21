import { deliveryQuote, isOpenNow, mapsLink, priceCart } from '@/lib/pricing';
import { drivingKm } from '@/lib/server/geo';
import { env, paymentsConfigured } from '@/lib/server/env';
import { cleanPhone, cleanText, clientIp, isEmail, json, rateLimit } from '@/lib/server/guard';
import { createRazorpayOrder } from '@/lib/server/razorpay';
import { notifySheet } from '@/lib/server/sheet';
import { getOrderStatus } from '@/lib/server/status';

const makeRef = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `MH${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

/**
 * POST { items:[{id,mode,qty}], customer:{name,phone,email?}, type:'Delivery'|'Pickup', address?, lat?, lng?, notes? }
 * Re-prices everything on the server, works out delivery, creates the Razorpay order and records the (unpaid) order.
 */
export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 12, 10 * 60_000)) return json({ ok: false, error: 'Too many attempts — please wait a few minutes.' }, 429);
  // TEST MODE only ever applies while real payment keys are missing, so it can never bypass a live payment
  const demo = env.testMode() && !paymentsConfigured();
  if (!paymentsConfigured() && !demo) return json({ ok: false, code: 'not_configured', error: 'Online payment is being set up. Please call us on +91 90041 67448 to order.' }, 503);

  let b: {
    items?: unknown; type?: unknown; address?: unknown; lat?: unknown; lng?: unknown; notes?: unknown;
    customer?: { name?: unknown; phone?: unknown; email?: unknown };
  };
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  if (!demo && !env.ignoreHours() && !isOpenNow()) return json({ ok: false, code: 'closed', error: 'We are closed right now. Orders are open from 8 AM to 8 PM — please come back then.' }, 409);

  const status = await getOrderStatus();
  const wantsDelivery = b.type !== 'Pickup';
  if (wantsDelivery && !status.delivery) return json({ ok: false, code: 'paused', error: `Delivery is paused right now.${status.message ? ' ' + status.message : ''}${status.pickup ? ' You can still choose Pickup.' : ''}` }, 409);
  if (!wantsDelivery && !status.pickup) return json({ ok: false, code: 'paused', error: `Pickup orders are paused right now.${status.message ? ' ' + status.message : ''}` }, 409);

  const priced = priceCart(b.items);
  if (!priced.ok) return json({ ok: false, error: priced.error }, 400);

  const name = cleanText(b.customer?.name, 80);
  const phone = cleanPhone(b.customer?.phone);
  const email = cleanText(b.customer?.email, 120);
  if (name.length < 2) return json({ ok: false, error: 'Please enter your name.' }, 400);
  if (!phone) return json({ ok: false, error: 'Please enter a valid 10-digit mobile number.' }, 400);
  if (email && !isEmail(email)) return json({ ok: false, error: 'That email address does not look right.' }, 400);

  const type = b.type === 'Pickup' ? 'Pickup' : 'Delivery';
  const notes = cleanText(b.notes, 300);
  let address = '', lat: number | null = null, lng: number | null = null;
  let distanceKm = 0, fee = 0;

  if (type === 'Delivery') {
    address = cleanText(b.address, 300);
    lat = typeof b.lat === 'number' ? b.lat : null;
    lng = typeof b.lng === 'number' ? b.lng : null;
    if (address.length < 8) return json({ ok: false, error: 'Please enter your full delivery address.' }, 400);
    if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return json({ ok: false, error: 'Please check your delivery address first so we can work out the delivery charge.' }, 400);
    try {
      const { km } = await drivingKm({ lat, lng });
      const q = deliveryQuote(km);
      if (!q.deliverable) return json({ ok: false, error: q.message }, 422);
      distanceKm = q.distanceKm; fee = q.fee;
    } catch {
      return json({ ok: false, error: 'Could not check delivery right now. Please try again, or choose Pickup.' }, 502);
    }
  }

  const total = priced.subtotal + fee;
  const ref = demo ? `TEST-${makeRef()}` : makeRef();

  if (demo) {
    const items = priced.lines;
    const common = { ref, customer: { name, phone, email }, type, address, mapLink: lat != null && lng != null ? mapsLink(lat, lng) : '', distanceKm, items, subtotal: priced.subtotal, deliveryFee: fee, total, notes: `TEST ORDER - no payment was taken.${notes ? ' ' + notes : ''}` };
    const okRow = await notifySheet({ action: 'order_created', razorpayOrderId: `TEST-${ref}`, status: 'Awaiting payment', ...common });
    const okPaid = okRow && await notifySheet({ action: 'order_paid', razorpayOrderId: `TEST-${ref}`, paymentId: 'TEST-NO-PAYMENT' });
    if (!okRow || !okPaid) return json({ ok: false, error: 'Test order could not be saved to the Sheet. Check APPS_SCRIPT_URL and APPS_SCRIPT_SECRET in Vercel.' }, 502);
    return json({ ok: true, demo: true, ref, totals: { subtotal: priced.subtotal, deliveryFee: fee, total, distanceKm }, prefill: { name, email, contact: phone } });
  }

  let rzp;
  try {
    rzp = await createRazorpayOrder(total, ref, { ref, name, phone, type });
  } catch (e) {
    console.error('[checkout]', (e as Error).message);
    return json({ ok: false, error: 'Payment could not be started. Please try again in a moment.' }, 502);
  }

  await notifySheet({
    action: 'order_created',
    ref, razorpayOrderId: rzp.id, status: 'Awaiting payment',
    customer: { name, phone, email }, type, address,
    mapLink: lat != null && lng != null ? mapsLink(lat, lng) : '',
    distanceKm, items: priced.lines, subtotal: priced.subtotal, deliveryFee: fee, total, notes,
  });

  return json({
    ok: true, ref,
    razorpay: { key: env.razorpayKeyId(), orderId: rzp.id, amount: rzp.amount, currency: rzp.currency },
    totals: { subtotal: priced.subtotal, deliveryFee: fee, total, distanceKm },
    prefill: { name, email, contact: phone },
  });
}
