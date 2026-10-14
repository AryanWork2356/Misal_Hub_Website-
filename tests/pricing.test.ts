import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { DELIVERY, deliveryQuote, isOpenNow, priceCart } from '@/lib/pricing';
import { verifyPaymentSignature, verifyWebhookSignature } from '@/lib/server/razorpay';
import { MENU } from '@/data/menu';

describe('delivery fee — the owner\'s rules', () => {
  it('free under 2.5 km when the order is above ₹150', () => {
    expect(deliveryQuote(1.0, 200)).toMatchObject({ deliverable: true, fee: 0, free: true });
    expect(deliveryQuote(2.4, 151)).toMatchObject({ fee: 0, free: true });
    expect(deliveryQuote(0, 500)).toMatchObject({ fee: 0, free: true });
  });

  it('"above ₹150" means more than 150 — exactly ₹150 is charged', () => {
    const q = deliveryQuote(2.4, 150);
    expect(q.free).toBe(false);
    expect(q.fee).toBe(12); // 2.4 km x ₹5
  });

  it('2.5 km to 10 km: ₹5 per km — 2.6 km costs ₹13 (the owner\'s own example)', () => {
    expect(deliveryQuote(2.6, 500)).toMatchObject({ deliverable: true, fee: 13, free: false });
    expect(deliveryQuote(2.6, 80).fee).toBe(13);
  });

  it('2.5 km exactly is no longer "under 2.5" so it is charged', () => {
    expect(deliveryQuote(2.5, 500)).toMatchObject({ free: false, fee: 13 }); // 12.5 -> 13
  });

  it('the fee uses the distance rounded to 0.1 km', () => {
    expect(deliveryQuote(3.37, 500)).toMatchObject({ distanceKm: 3.4, fee: 17 });
    expect(deliveryQuote(5, 500).fee).toBe(25);
    expect(deliveryQuote(10, 500).fee).toBe(50);
  });

  it('beyond 10 km we do not deliver', () => {
    expect(deliveryQuote(10.04, 500).deliverable).toBe(true);  // rounds to 10.0
    expect(deliveryQuote(10.05, 500).deliverable).toBe(false); // rounds to 10.1
    expect(deliveryQuote(25, 500)).toMatchObject({ deliverable: false, fee: 0 });
  });

  it('rejects nonsense distances', () => {
    expect(deliveryQuote(NaN, 200).deliverable).toBe(false);
    expect(deliveryQuote(-1, 200).deliverable).toBe(false);
  });

  it('rules in code match what was agreed', () => {
    expect(DELIVERY).toEqual({ freeRadiusKm: 2.5, freeMinOrder: 150, perKm: 5, maxKm: 10 });
  });
});

describe('priceCart — the server never trusts browser prices', () => {
  it('prices regular and Jain items from the menu', () => {
    const r = priceCart([{ id: 'misal-pav', mode: 'regular', qty: 2 }, { id: 'misal-pav', mode: 'jain', qty: 1 }, { id: 'misal-thali', mode: 'regular', qty: 1 }]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.subtotal).toBe(2 * 90 + 115 + 170);
      expect(r.lines).toHaveLength(3);
    }
  });

  it('ignores any price the browser tries to send', () => {
    const r = priceCart([{ id: 'misal-pav', mode: 'regular', qty: 1, price: 1, unit: 1, total: 1 } as never]);
    expect(r.ok && r.subtotal).toBe(90);
  });

  it('merges duplicate lines', () => {
    const r = priceCart([{ id: 'chaas', mode: 'regular', qty: 2 }, { id: 'chaas', mode: 'regular', qty: 3 }]);
    expect(r.ok && r.lines[0].qty).toBe(5);
  });

  it('rejects empty carts, unknown items, seasonal items, items not on the Jain menu', () => {
    expect(priceCart([]).ok).toBe(false);
    expect(priceCart('nope').ok).toBe(false);
    expect(priceCart([{ id: 'does-not-exist', mode: 'regular', qty: 1 }]).ok).toBe(false);
    expect(priceCart([{ id: 'aamras-vati', mode: 'regular', qty: 1 }]).ok).toBe(false);          // seasonal, no price
    expect(priceCart([{ id: 'vada-misal-pav', mode: 'jain', qty: 1 }]).ok).toBe(false);          // not a Jain item
  });

  it('rejects bad quantities', () => {
    for (const qty of [0, -1, 1.5, 51, NaN, '3; DROP']) {
      expect(priceCart([{ id: 'misal-pav', mode: 'regular', qty: qty as number }]).ok).toBe(false);
    }
    expect(priceCart([{ id: 'misal-pav', mode: 'regular', qty: 30 }, { id: 'misal-pav', mode: 'regular', qty: 30 }]).ok).toBe(false);
  });

  it('every priced menu item can be ordered with a positive integer price', () => {
    for (const c of MENU) for (const it of c.items) {
      for (const p of [it.p, it.j]) if (p != null) expect(Number.isInteger(p) && p > 0).toBe(true);
    }
  });
});

describe('opening hours (India time, 8 AM – 8 PM)', () => {
  const at = (iso: string) => isOpenNow(new Date(iso));
  it('opens at 08:00 IST and closes at 20:00 IST', () => {
    expect(at('2026-11-02T02:29:00Z')).toBe(false); // 07:59 IST
    expect(at('2026-11-02T02:30:00Z')).toBe(true);  // 08:00 IST
    expect(at('2026-11-02T14:29:00Z')).toBe(true);  // 19:59 IST
    expect(at('2026-11-02T14:30:00Z')).toBe(false); // 20:00 IST
    expect(at('2026-11-02T20:00:00Z')).toBe(false); // 01:30 IST
  });
});

describe('Razorpay signatures', () => {
  process.env.RAZORPAY_KEY_SECRET = 'test_secret_123';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_456';

  it('accepts only a correct payment signature', () => {
    const good = createHmac('sha256', 'test_secret_123').update('order_A|pay_B').digest('hex');
    expect(verifyPaymentSignature('order_A', 'pay_B', good)).toBe(true);
    expect(verifyPaymentSignature('order_A', 'pay_B', good.replace(/.$/, good.endsWith('0') ? '1' : '0'))).toBe(false);
    expect(verifyPaymentSignature('order_X', 'pay_B', good)).toBe(false);
    expect(verifyPaymentSignature('order_A', 'pay_B', '')).toBe(false);
    expect(verifyPaymentSignature('order_A', 'pay_B', 'short')).toBe(false);
  });

  it('accepts only a correct webhook signature', () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    const good = createHmac('sha256', 'whsec_456').update(body).digest('hex');
    expect(verifyWebhookSignature(body, good)).toBe(true);
    expect(verifyWebhookSignature(body + ' ', good)).toBe(false);
    expect(verifyWebhookSignature(body, '')).toBe(false);
  });
});
