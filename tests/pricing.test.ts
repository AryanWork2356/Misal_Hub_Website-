import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { DELIVERY, deliveryQuote, isOpenNow, priceCart } from '@/lib/pricing';
import { addressQueries } from '@/lib/addressQueries';
import { verifyPaymentSignature, verifyWebhookSignature } from '@/lib/server/razorpay';
import { MENU } from '@/data/menu';

describe('delivery fee — the owner rules (₹50 up to 1 km, ₹80 beyond, nothing past 5 km)', () => {
  it('rules in code match what was agreed', () => {
    expect(DELIVERY).toEqual({ nearKm: 1, nearFee: 50, farFee: 80, maxKm: 5 });
  });

  it('up to 1 km (inclusive) costs ₹50', () => {
    expect(deliveryQuote(0)).toMatchObject({ deliverable: true, fee: 50 });
    expect(deliveryQuote(0.6)).toMatchObject({ deliverable: true, fee: 50 });
    expect(deliveryQuote(1.0)).toMatchObject({ deliverable: true, fee: 50 });
  });

  it('beyond 1 km (up to 5 km) costs ₹80', () => {
    expect(deliveryQuote(1.1)).toMatchObject({ deliverable: true, fee: 80 });
    expect(deliveryQuote(3)).toMatchObject({ deliverable: true, fee: 80 });
    expect(deliveryQuote(5)).toMatchObject({ deliverable: true, fee: 80 });
  });

  it('there is no free delivery, whatever the order size', () => {
    expect(deliveryQuote(0.2).fee).toBeGreaterThan(0);
  });

  it('the fee uses the distance rounded to 0.1 km', () => {
    expect(deliveryQuote(1.04)).toMatchObject({ distanceKm: 1, fee: 50 });
    expect(deliveryQuote(1.06)).toMatchObject({ distanceKm: 1.1, fee: 80 });
  });

  it('beyond 5 km we do not deliver', () => {
    expect(deliveryQuote(5.04).deliverable).toBe(true);   // rounds to 5.0
    expect(deliveryQuote(5.05).deliverable).toBe(false);  // rounds to 5.1
    expect(deliveryQuote(25)).toMatchObject({ deliverable: false, fee: 0 });
  });

  it('rejects nonsense distances', () => {
    expect(deliveryQuote(NaN).deliverable).toBe(false);
    expect(deliveryQuote(-1).deliverable).toBe(false);
  });
});

describe('address simplifier — long Indian addresses the map cannot match directly', () => {
  const full = 'A/504 , Ankur Enclave , Vijay Park , Opp Tokyo Tower , Near GN Residency .';

  it('tries the full text first, then drops the flat number and landmarks', () => {
    const q = addressQueries(full);
    expect(q[0]).toMatchObject({ approx: false });
    expect(q[1].q).toBe('Ankur Enclave, Vijay Park, Mira Road, Thane');
    expect(q[1].approx).toBe(true);
  });

  it('then falls back to the neighbourhood, and finally to the landmarks', () => {
    const qs = addressQueries(full, 6).map((x) => x.q);
    expect(qs).toContain('Vijay Park, Mira Road, Thane');
    expect(qs).toContain('Tokyo Tower, Mira Road, Thane');
    expect(qs.slice(1).some((s) => /A\/504|Opp|Near/i.test(s))).toBe(false);
  });

  it('does not add local context when the customer already gave it', () => {
    const qs = addressQueries('Flat 4, Silver Cassia, Pleasant Park Road, Mira Road East 401107').map((x) => x.q);
    expect(qs[1]).toBe('Silver Cassia, Pleasant Park Road, Mira Road East');   // flat + pincode removed, no extra suffix
  });

  it('keeps "5th floor" style words and does not repeat a locality the customer already gave', () => {
    const qs = addressQueries('5th Floor, Sai Heights, Station Road, Bhayander West').map((x) => x.q);
    expect(qs.some((s) => /^5th Floor/.test(s))).toBe(true);                         // "5th Floor" is not mistaken for a flat number
    expect(qs).toContain('Sai Heights, Station Road, Bhayander West');                // simplified version without the floor
    expect(qs.some((s) => /Bhayander West, Bhayander|, Mira Road, Thane/.test(s))).toBe(false);  // no redundant locality added
  });

  it('is safe on junk and caps the number of searches', () => {
    expect(addressQueries('   ')).toEqual([]);
    expect(addressQueries('1, 2, 3, 4, 5, 6, 7, 8, 9, 10')[0].approx).toBe(false);
    expect(addressQueries('A, B, C, D, E, F, G, H, I, J, K', 4).length).toBeLessThanOrEqual(4);
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
