'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import SignInCard from './SignInCard';
import { isFinished, minutesLeft, stepIndex, type OrderView } from '@/lib/eta';
import { SHOP } from '@/lib/pricing';
import { isComplete, useAccount } from '@/lib/useAccount';

const when = (ms?: number | null) => ms ? new Date(ms).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const rs = (n?: number) => `₹${Number(n || 0)}`;

function statusLabel(o: OrderView, left: number | null) {
  if (o.progress === 'Cancelled') return 'Cancelled';
  if (isFinished(o.progress)) return o.type === 'Pickup' ? 'Picked up' : 'Delivered';
  if (o.progress === 'Out for delivery') return left != null && left > 0 ? `Out for delivery · ${left} min` : 'Out for delivery';
  if (o.progress === 'Ready for pickup') return 'Ready for pickup';
  return left != null && left > 0 ? `Preparing · ${left} min` : 'Preparing';
}

/** "My orders": live orders on top (with a Track button), then the history. Every order opens into the full bill. */
export default function MyOrders() {
  const acct = useAccount();
  const ready = isComplete(acct.user);
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [err, setErr] = useState('');
  const [skew, setSkew] = useState(0);
  const [now, setNow] = useState(0);
  const [openBill, setOpenBill] = useState<string>('');

  const load = useCallback(async () => {
    if (!ready) return;
    try {
      const r = await fetch('/api/orders/mine', { cache: 'no-store' });
      const j = await r.json();
      if (!j.ok) { setErr(j.error || 'We could not load your orders.'); return; }
      setErr(''); setOrders(j.orders as OrderView[]); setSkew(Number(j.serverNow || Date.now()) - Date.now());
    } catch { setErr('We could not load your orders. Please check your internet.'); }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [ready, load]);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 10_000); return () => clearInterval(t); }, []);

  if (!acct.loaded) return <p className="mo-note">Loading…</p>;
  if (!ready) {
    return (
      <div className="mo-signin">
        <p className="mo-note">Sign in to see your orders, live tracking and bills.</p>
        <SignInCard title="Sign in with Google to see your orders" />
      </div>
    );
  }
  if (!orders) return <p className="mo-note">{err || 'Loading your orders…'}</p>;
  if (!orders.length) {
    return (
      <div className="mo-empty">
        <span aria-hidden="true">🍲</span>
        <h3>No orders yet</h3>
        <p>Your orders and bills will appear here after your first order.</p>
        <Link href="/menu" className="btn btn-gold">Order now →</Link>
      </div>
    );
  }

  const active = orders.filter((o) => !isFinished(o.progress));
  const past = orders.filter((o) => isFinished(o.progress));

  const card = (o: OrderView) => {
    const left = minutesLeft(o.etaAt, now + skew);
    const fin = isFinished(o.progress);
    const lines = (o.items || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const step = stepIndex(o.progress);
    const open = openBill === o.ref;
    return (
      <article key={o.ref} className={`mo-card${fin ? ' fin' : ''}`}>
        <header>
          <div><b>{o.ref}</b><small>{when(o.createdAt)}</small></div>
          <span className={`mo-badge ${o.progress === 'Cancelled' ? 'bad' : fin ? 'ok' : 'live'}`}>{statusLabel(o, left)}</span>
        </header>

        {!fin && (
          <div className="mo-prog" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <i key={i} className={i < step ? 'd' : i === step ? 'n' : ''} />)}
          </div>
        )}

        <ul className="mo-lines">{lines.slice(0, open ? lines.length : 3).map((l, i) => <li key={i}>{l}</li>)}{!open && lines.length > 3 && <li className="more">+ {lines.length - 3} more</li>}</ul>

        <div className="mo-foot">
          <span><small>{o.type === 'Pickup' ? 'Pickup' : 'Delivery'}</small><b>{rs(o.total)}</b></span>
          <div className="mo-btns">
            {!fin && <button type="button" className="btn btn-sm btn-gold" onClick={() => window.dispatchEvent(new CustomEvent('mh:open-tracker', { detail: { ref: o.ref } }))}>🛵 Track live</button>}
            <button type="button" className="btn btn-sm" onClick={() => setOpenBill(open ? '' : o.ref)}>{open ? 'Hide bill' : 'View bill'}</button>
          </div>
        </div>

        {open && (
          <div className="mo-bill">
            <h4>Bill</h4>
            <dl>
              <div><dt>Items</dt><dd>{rs(o.subtotal)}</dd></div>
              {!!o.discount && <div className="disc"><dt>Offer {o.promo}</dt><dd>−{rs(o.discount)}</dd></div>}
              <div><dt>Delivery</dt><dd>{o.type === 'Pickup' ? '—' : rs(o.fee)}</dd></div>
              <div className="tot"><dt>Total paid</dt><dd>{rs(o.total)}</dd></div>
            </dl>
            <p><small>Placed</small> {when(o.createdAt)}</p>
            <p><small>{o.type === 'Pickup' ? 'Pickup from' : 'Delivered to'}</small> {o.type === 'Pickup' ? SHOP.address : o.address || '—'}</p>
            {o.paymentId && <p><small>Payment reference</small> {o.paymentId}</p>}
            {o.note && <p><small>Message from the shop</small> {o.note}</p>}
            <p className="mo-help">Need help with this order? <a href={`tel:+${SHOP.whatsapp}`}>Call us</a> or <a href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Hi Misal Hub! About my order ${o.ref}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="mo">
      {active.length > 0 && <section><h2>Active orders <em>{active.length}</em></h2><div className="mo-list">{active.map(card)}</div></section>}
      {past.length > 0 && <section><h2>Order history</h2><div className="mo-list">{past.map(card)}</div></section>}
    </div>
  );
}
