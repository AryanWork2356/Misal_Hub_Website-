'use client';
import { useCallback, useEffect, useState } from 'react';
import { isFinished, minutesLeft, stepIndex, type OrderView } from '@/lib/eta';
import { SHOP } from '@/lib/pricing';

const KEY = 'mh_active_order';
type Active = { ref: string; phone: string; at: number };
const MAX_AGE = 12 * 60 * 60 * 1000;       // stop tracking after 12 hours

/**
 * Floating "Track your order" pill (every page) + a bottom sheet with live status, the countdown and the order.
 * The shop sets the ETA in the Google Sheet; the countdown here drops every minute by itself.
 */
export default function OrderTracker() {
  const [active, setActive] = useState<Active | null>(null);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [skew, setSkew] = useState(0);
  const [now, setNow] = useState(0);
  const [open, setOpen] = useState(false);

  const read = useCallback(() => {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || 'null') as Active | null;
      if (a && a.ref && a.phone && Date.now() - a.at < MAX_AGE) { setActive(a); return; }
      if (a) localStorage.removeItem(KEY);
    } catch { /* ignore */ }
    setActive(null); setOrder(null);
  }, []);

  useEffect(() => {
    read();
    const onPlaced = () => { read(); };
    const onOpen = () => { read(); setOpen(true); };
    window.addEventListener('mh:order-placed', onPlaced);
    window.addEventListener('mh:open-tracker', onOpen);
    return () => { window.removeEventListener('mh:order-placed', onPlaced); window.removeEventListener('mh:open-tracker', onOpen); };
  }, [read]);

  const load = useCallback(async () => {
    if (!active) return;
    try {
      const r = await fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: active.ref, phone: active.phone }) });
      if (r.status === 404) return;                      // not in the Sheet (yet): keep trying quietly
      const j = await r.json();
      if (j.ok) { setOrder(j.order); setSkew(Number(j.serverNow) - Date.now()); }
    } catch { /* keep what we have */ }
  }, [active]);

  /* poll the shop's Sheet: every 30 s (every 10 s while the sheet is open) and when the tab is shown again */
  useEffect(() => {
    if (!active) return;
    load();
    const t = setInterval(load, open ? 10_000 : 30_000);
    const vis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [active, load, open]);

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

  if (!active) return null;

  const left = order ? minutesLeft(order.etaAt, now + skew) : null;
  const finished = order ? isFinished(order.progress) : false;
  const cancelled = order?.progress === 'Cancelled';
  const isPickup = order?.type === 'Pickup';
  const step = order ? stepIndex(order.progress) : 1;
  const steps = isPickup ? ['Order placed', 'Preparing', 'Ready for pickup', 'Picked up'] : ['Order placed', 'Preparing', 'Out for delivery', 'Delivered'];

  const pill = !order ? 'Track order' : cancelled ? 'Order cancelled' : finished ? (isPickup ? 'Picked up ✓' : 'Delivered ✓') : left == null ? 'Confirming time…' : left > 0 ? `${left} min` : 'Arriving soon';
  const big = left != null && left > 0 ? String(left) : null;
  const frac = order?.etaMin && left != null ? Math.max(0, Math.min(1, left / order.etaMin)) : 1;
  const C = 2 * Math.PI * 54;
  const lines = (order?.items || '').split('\n').map((l) => l.trim()).filter(Boolean);

  const done = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setOpen(false); setActive(null); setOrder(null); };

  return (
    <>
      <button type="button" className={`ot-pill${finished ? ' is-done' : ''}`} onClick={() => setOpen(true)} aria-label={`Track your order: ${pill}`}>
        <span className="ot-pill-ico" aria-hidden="true">{finished ? '✓' : '🛵'}</span>
        <span className="ot-pill-txt"><small>{finished ? 'Your order' : 'Track order'}</small><b>{pill}</b></span>
        {!finished && <i className="ot-pulse" aria-hidden="true" />}
      </button>

      <div className={`ot-sheet${open ? ' open' : ''}`} aria-hidden={!open} role="dialog" aria-label="Track your order">
        <div className="ot-backdrop" onClick={() => setOpen(false)} />
        <div className="ot-panel">
          <div className="ot-head">
            <div><small>YOUR ORDER</small><b>{active.ref}</b></div>
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
                    <div>{finished ? <span className="ot-big ok">{cancelled ? '✕' : '✓'}</span> : big ? <><span className="ot-big">{big}</span><small>min</small></> : <span className="ot-soon">{left == null ? '…' : '≈'}</span>}</div>
                  </div>
                  <div className="ot-eta-txt">
                    <b>{cancelled ? 'This order was cancelled' : finished ? (isPickup ? 'Enjoy your meal!' : 'Delivered. Enjoy your meal!') : left == null ? 'We are confirming your time' : left > 0 ? (isPickup ? 'Ready for pickup in about' : 'Arriving in about') : 'Almost there'}</b>
                    <span>{cancelled ? `Please call us on ${SHOP.phone}.` : finished ? 'Thank you for ordering from Misal Hub 🧡' : left == null ? 'Your delivery time will appear here in a moment.' : left > 0 ? `${left} ${left === 1 ? 'minute' : 'minutes'} to go` : 'Your order should reach you any moment now.'}</span>
                  </div>
                </div>

                {order.note && <div className="ot-note"><span aria-hidden="true">💬</span><p>{order.note}</p></div>}

                {!cancelled && (
                  <ol className="ot-steps">
                    {steps.map((s, i) => <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}><i>{i < step || finished ? '✓' : i + 1}</i><span>{s}</span></li>)}
                  </ol>
                )}

                <div className="ot-items">
                  <h4>What you ordered</h4>
                  <ul>{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
                  <div className="ot-total"><span>Total paid</span><b>₹{order.total}</b></div>
                  <p className="ot-where">{isPickup ? `Pickup from ${SHOP.address}` : order.address ? `Delivering to ${order.address}` : ''}</p>
                </div>
              </>
            )}

            <div className="ot-actions">
              <a href={`tel:+${SHOP.whatsapp}`} className="btn btn-sm ot-call">📞 Call us</a>
              <a href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Hi Misal Hub! About my order ${active.ref}`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm ot-wa">WhatsApp</a>
              {finished && <button type="button" className="btn btn-sm btn-gold" onClick={done}>Done</button>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
