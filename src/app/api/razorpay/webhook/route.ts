import { json } from '@/lib/server/guard';
import { verifyWebhookSignature } from '@/lib/server/razorpay';
import { notifySheet } from '@/lib/server/sheet';

/**
 * Razorpay -> us, server to server. Safety net for customers who pay but close the tab before our verify call.
 * Set it up in Razorpay Dashboard -> Settings -> Webhooks: URL https://YOUR-SITE/api/razorpay/webhook,
 * events payment.captured + order.paid, and put the secret you choose in RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get('x-razorpay-signature') || '')) return json({ ok: false }, 400);

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } }; order?: { entity?: { id?: string } } } };
  try { event = JSON.parse(raw); } catch { return json({ ok: false }, 400); }

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const pay = event.payload?.payment?.entity;
    const orderId = pay?.order_id || event.payload?.order?.entity?.id;
    if (orderId) await notifySheet({ action: 'order_paid', razorpayOrderId: orderId, paymentId: pay?.id || '' });
  }
  return json({ ok: true });
}
