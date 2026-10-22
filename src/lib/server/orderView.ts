import 'server-only';
import type { OrderView } from '@/lib/eta';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);

/** one order as the Sheet script describes it -> exactly the fields the website shows (nothing else leaks through) */
export function toView(r: Record<string, unknown>): OrderView {
  return {
    ref: String(r.ref || ''), progress: String(r.progress || 'Preparing'), items: String(r.items || ''), total: num(r.total), type: String(r.type || ''),
    address: String(r.address || ''), etaAt: typeof r.etaAt === 'number' ? r.etaAt : null, etaMin: typeof r.etaMin === 'number' ? r.etaMin : null, note: String(r.note || ''),
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : null, subtotal: num(r.subtotal), fee: num(r.fee), discount: num(r.discount), promo: String(r.promo || ''),
    paymentId: String(r.paymentId || ''),
  };
}
