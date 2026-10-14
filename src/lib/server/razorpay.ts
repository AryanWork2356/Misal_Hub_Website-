import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env';

export type RzpOrder = { id: string; amount: number; currency: string; receipt: string };

/** Create a Razorpay order. `amountInr` is whole/decimal rupees; Razorpay wants paise. */
export async function createRazorpayOrder(amountInr: number, receipt: string, notes: Record<string, string>): Promise<RzpOrder> {
  const auth = Buffer.from(`${env.razorpayKeyId()}:${env.razorpayKeySecret()}`).toString('base64');
  const res = await fetch(`${env.razorpayApiBase()}/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: Math.round(amountInr * 100), currency: 'INR', receipt, notes }),
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: HTTP ${res.status}`);
  return res.json();
}

const safeEqualHex = (a: string, b: string) => {
  const x = Buffer.from(a, 'utf8'), y = Buffer.from(b, 'utf8');
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Checkout success signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = env.razorpayKeySecret();
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook_secret). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = env.razorpayWebhookSecret();
  if (!secret || !signature) return false;
  return safeEqualHex(createHmac('sha256', secret).update(rawBody).digest('hex'), signature);
}
