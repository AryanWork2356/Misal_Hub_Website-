'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PROMOS } from '@/lib/promo';

/**
 * The tear-off coupon + order button on the /offer page.
 * Remembers the offer (and where the visitor came from, e.g. ?src=card). Once the offer has been used on this
 * device it is replaced by a thank-you, so the customer never sees it again.
 */
export default function OfferCta({ code }: { code: keyof typeof PROMOS & string }) {
  const p = PROMOS[code];
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem('mh_promo_used') === '1') { setUsed(true); return; }
      localStorage.setItem('mh_promo', code);
      const src = new URLSearchParams(window.location.search).get('src');
      if (src) localStorage.setItem('mh_src', src.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20));
    } catch { /* ignore */ }
  }, [code]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { /* ignore */ }
  };

  if (used) {
    return (
      <div className="of-used">
        <span aria-hidden="true">🧡</span>
        <b>Thank you for your first order!</b>
        <p>You have already enjoyed this welcome offer. Order your favourites again any time.</p>
        <Link href="/menu" className="btn btn-gold btn-lg">Order again →</Link>
      </div>
    );
  }

  return (
    <div className="of-cta">
      <div className="of-ticket" role="group" aria-label={`${p.title}, code ${code}`}>
        <div className="of-ticket-main">
          <small>FIRST ORDER</small>
          <strong>{p.percent}<sup>%</sup> OFF</strong>
          <span>on any order</span>
        </div>
        <button type="button" className="of-ticket-code" onClick={copy} aria-label={`Copy code ${code}`}>
          <small>CODE</small>
          <b>{code}</b>
          <span>{copied ? 'Copied ✓' : 'Tap to copy'}</span>
        </button>
      </div>
      <Link href={`/menu?promo=${code}`} className="of-btn">
        <span>Order now — offer applied</span>
        <i aria-hidden="true">→</i>
      </Link>
    </div>
  );
}
