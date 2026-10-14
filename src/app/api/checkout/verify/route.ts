import { clientIp, json, rateLimit } from '@/lib/server/guard';
import { verifyPaymentSignature } from '@/lib/server/razorpay';
import { notifySheet } from '@/lib/server/sheet';

/** POST { razorpay_order_id, razorpay_payment_id, razorpay_signature, ref } — called by the browser after the Razorpay popup succeeds. */
export async function POST(req: Request) {
  if (!rateLimit(`verify:${clientIp(req)}`, 30, 10 * 60_000)) return json({ ok: false, error: 'Too many requests.' }, 429);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ ok: false, error: 'Bad request.' }, 400); }

  const orderId = String(b.razorpay_order_id || '');
  const paymentId = String(b.razorpay_payment_id || '');
  const signature = String(b.razorpay_signature || '');
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return json({ ok: false, error: 'We could not verify this payment. If money was deducted, please contact us — it will be matched to your order.' }, 400);
  }

  // The Sheet is told the order is paid (and the shop is e-mailed). The webhook does the same as a safety net; the script ignores duplicates.
  await notifySheet({ action: 'order_paid', razorpayOrderId: orderId, paymentId });
  return json({ ok: true, ref: String(b.ref || '') });
}
