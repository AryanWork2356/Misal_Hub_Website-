'use client';
import { useCallback, useEffect, useState } from 'react';
import { isFinished, minutesLeft, stepIndex, type OrderView } from '@/lib/eta';
import { SHOP } from '@/lib/pricing';
import { useAccount } from '@/lib/useAccount';

/**
 * Floating "Track your order" pill (every page) + a bottom sheet with live status, the countdown and the order.
 * It follows the SIGNED-IN account, so it works on any phone or laptop. The shop sets the ETA in the Google Sheet;
 * the countdown here drops every minute by itself.
 */
export default function OrderTracker() {
  const acct = useAccount();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [skew, setSkew] = useState(0);
  const [now, setNow] = useState(0);
  const [open, setOpen] = useState(false);
  const signedIn = !!acct.user;

  const load = useCallback(async () => {
    if (!signedIn) { setOrder(null); return; }
    try {
      const j = await (await fetch('/api/orders/active', { cache: 'no-store' })).json();
      if (!j.ok) return;
      setSkew(Number(j.serverNow || Date.now()) - Date.now());
      let dismissed = '';
      try { dismissed = localStorage.getItem('mh_dismissed_order') || ''; } catch { /* ignore */ }
      setOrder(j.order && j.order.ref !== dismissed ? (j.order as OrderView) : null);   // exactly what the shop set; hidden once the customer pressed Done
    } catch { /* keep what we have */ }
  }, [signedIn]);

  /* poll: every 30 s (10 s while the sheet is open) and when the tab is shown again; extra tries right after an order is placed */
  useEffect(() => {
    if (!signedIn) return;
    load();
    const t = setInterval(load, open ? 10_000 : 30_000);
    const vis = () => { if (document.visibilityState === 'visible') load(); };
    const placed = () => { load(); setTimeout(load, 2500); setTimeout(load, 7000); };
    const openIt = () => { load(); setOpen(true); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('mh:order-placed', placed);
    window.addEventListener('mh:open-tracker', openIt);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); window.removeEventListener('mh:order-placed', placed); window.removeEventListener('mh:open-tracker', openIt); };
  }, [signedIn, load, open]);

  /* the clock that makes the countdown drop by itself */
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  /* lock the page behind the sheet; Esc closes it */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!signedIn || !order) return null;

  const left = minutesLeft(order.etaAt, now + skew);
  const finished = isFinished(order.progress);
  const cancelled = order.progress === 'Cancelled';
  const isPickup = order.type === 'Pickup';
  const step = stepIndex(order.progress);
  const steps = isPickup ? ['Order placed', 'Preparing', 'Ready for pickup', 'Picked up'] : ['Order placed', 'Preparing', 'Out for delivery', 'Delivered'];

  const pill = cancelled ? 'Order cancelled' : finished ? (isPickup ? 'Picked up ✓' : 'Delivered ✓') : left == null ? 'Confirming time…' : left > 0 ? `${left} min` : 'Arriving soon';
  const big = left != null && left > 0 ? String(left) : null;
  const frac = order.etaMin && left != null ? Math.max(0, Math.min(1, left / order.etaMin)) : 1;
  const C = 2 * Math.PI * 54;
  const travel = finished ? 1 : step >= 2 ? (order.etaMin && left != null ? Math.max(0.06, Math.min(0.94, 1 - left / order.etaMin)) : 0.4) : 0;
  const scene = finished ? 'done' : step >= 2 ? 'ride' : 'cook';
  const lines = (order.items || '').split('\n').map((l) => l.trim()).filter(Boolean);

  const done = () => { try { localStorage.setItem('mh_dismissed_order', order.ref); } catch { /* ignore */ } setOpen(false); setOrder(null); };

  return (
    <>
      <button type="button" className={`ot-pill${finished ? ' is-done' : ''}`} onClick={() => setOpen(true)} aria-label={`Track your order: ${pill}`}>
        <span className="ot-pill-ico" aria-hidden="true">{finished ? '✓' : <span className="ot-bike">🛵</span>}</span>
        <span className="ot-pill-txt"><small>{finished ? 'Your order' : 'Track order'}</small><b>{pill}</b></span>
        {!finished && <i className="ot-pulse" aria-hidden="true" />}
      </button>

      <div className={`ot-sheet${open ? ' open' : ''}`} aria-hidden={!open} role="dialog" aria-label="Track your order">
        <div className="ot-backdrop" onClick={() => setOpen(false)} />
        <div className="ot-panel">
          <div className="ot-head">
            <div><small>YOUR ORDER</small><b>{order.ref}</b></div>
            <button type="button" className="ot-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>

          <div className="ot-body">
            {!order ? (
              <p className="ot-wait">Getting your order details…</p>
            ) : (
              <>
                <div className="ot-eta">
                  <div className="ot-ring" aria-hidden="true">
                    <svg viewBox="0 0 120 120"><circle className="trk" cx="60" cy="60" r="54" /><circle className="bar" cx="60" cy="60" r="54" strokeDasharray={C} strokeDashoffset={C * (1 - (finished ? 1 : frac))} /></svg>
                    <div>{finished ? <span className="ot-big ok">{cancelled ? '✕' : '✓'}</span> : big ? <><span className="ot-big flip" key={big}>{big}</span><small>min</small></> : <span className="ot-soon">{left == null ? '…' : '≈'}</span>}</div>
                  </div>
                  <div className="ot-eta-txt">
                    <b>{cancelled ? 'This order was cancelled' : finished ? (isPickup ? 'Enjoy your meal!' : 'Delivered. Enjoy your meal!') : left == null ? 'We are confirming your time' : left > 0 ? (isPickup ? 'Ready for pickup in about' : 'Arriving in about') : 'Almost there'}</b>
                    <span>{cancelled ? `Please call us on ${SHOP.phone}.` : finished ? 'Thank you for ordering from Misal Hub 🧡' : left == null ? 'Your delivery time will appear here in a moment.' : left > 0 ? `${left} ${left === 1 ? 'minute' : 'minutes'} to go` : 'Your order should reach you any moment now.'}</span>
                  </div>
                </div>

                {!cancelled && (
                  <div className={`ot-scene s-${scene}${isPickup ? ' pick' : ''}`} aria-hidden="true">
                    <span className="ot-pt shop"><b>🍲</b><em>Misal Hub</em><i className="steam s1" /><i className="steam s2" /><i className="steam s3" /></span>
                    {isPickup ? <div className="ot-road pickup"><span className="ot-lane" /></div> : <div className="ot-road"><span className="ot-lane" /><span className="ot-rider" style={{ left: `${travel * 100}%` }}>🛵</span></div>}
                    <span className="ot-pt home"><b>{isPickup ? '🛍️' : '🏠'}</b><em>{isPickup ? 'Your order' : 'You'}</em></span>
                    {finished && Array.from({ length: 16 }, (_, i) => <u key={i} className="conf" style={{ '--dx': `${((i * 53) % 120) - 60}px`, '--dy': `${-30 - ((i * 29) % 70)}px`, '--c': i % 4, '--d': `${(i % 5) * 60}ms` } as React.CSSProperties} />)}
                  </div>
                )}

                {order.note && <div className="ot-note"><span aria-hidden="true">💬</span><p>{order.note}</p></div>}

                {!cancelled && (
                  <ol className="ot-steps">
                    {steps.map((s, i) => <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}><i>{i < step || finished ? '✓' : i + 1}</i><span>{s}</span></li>)}
                  </ol>
                )}

                <div className="ot-items">
                  <h4>What you ordered</h4>
                  <ul>{lines.map((l, i) => <li key={i} style={{ '--i': i } as React.CSSProperties}>{l}</li>)}</ul>
                  <div className="ot-total"><span>Total paid</span><b>₹{order.total}</b></div>
                  <p className="ot-where">{isPickup ? `Pickup from ${SHOP.address}` : order.address ? `Delivering to ${order.address}` : ''}</p>
                </div>
              </>
            )}

            <div className="ot-actions">
              <a href={`tel:+${SHOP.whatsapp}`} className="btn btn-sm ot-call">📞 Call us</a>
              <a href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Hi Misal Hub! About my order ${order.ref}`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm ot-wa">WhatsApp</a>
              {finished && <button type="button" className="btn btn-sm btn-gold" onClick={done}>Done</button>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
