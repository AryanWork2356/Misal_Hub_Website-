'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { BESTSELLERS, MENU, type Item } from '@/data/menu';
import { getLenis } from '@/lib/lenis';
import { cartServerSnapshot, cartSnapshot, parseCart, subscribeCart, writeCart, type Cart } from '@/lib/cart';
import { DELIVERY, SHOP, deliveryQuote, hasModePrice, isOpenNow, rupee, unitPrice, type Mode } from '@/lib/pricing';

type Line = { key: string; it: Item; m: Mode; qty: number; price: number };
type Step = 'cart' | 'details' | 'success';
type Quote = { distanceKm: number; lat: number; lng: number; label: string; address: string; deliverable: boolean; message: string; approx: boolean };
type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(ev: string, cb: (r: { error?: { description?: string } }) => void): void };
  }
}

const BY_ID: Record<string, Item> = {};
MENU.forEach((c) => c.items.forEach((i) => { BY_ID[i.id] = i; }));

const keyOf = (it: Item, m: Mode) => `${it.id}:${m === 'jain' ? 'j' : 'r'}`;
const parseKey = (key: string): { it: Item; m: Mode } | null => {
  const [id, mm] = key.split(':');
  const it = BY_ID[id];
  return it ? { it, m: mm === 'j' ? 'jain' : 'regular' } : null;
};
/** Quick add-ons offered in the cart (regular-menu items). */
const ADDON_IDS = ['x-butter-pav', 'x-papad', 'chaas', 'x-gulab-jamun', 'water'];

const CUSTOMER_KEY = 'mh_customer_v1';
const subscribeMinute = (cb: () => void) => { const t = setInterval(cb, 30_000); return () => clearInterval(t); };

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Dish photo that quietly disappears if the file is missing. */
function DishImg({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false);
  if (!item.img || failed) return null;
  return (
    <div className="item-media">
      <img src={`/images/menu/${item.img}.jpg`} alt={item.name} loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}

/** Small round-cornered dish picture for cart rows; a lettered tile when there is no photo. */
function Thumb({ item, className = 'cl-thumb' }: { item: Item; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (item.img && !failed) {
    return <img className={className} src={`/images/menu/${item.img}.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} />;
  }
  return <span className={`${className} cl-thumb-ph`} aria-hidden="true">{item.name.charAt(0)}</span>;
}

function Stepper({ qty, onDec, onInc }: { qty: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="stepper">
      <button type="button" onClick={onDec} aria-label="Remove one">−</button>
      <span>{qty}</span>
      <button type="button" onClick={onInc} aria-label="Add one">+</button>
    </div>
  );
}

export default function MenuApp() {
  const [mode, setMode] = useState<Mode>('regular');
  const [query, setQuery] = useState('');
  const cartJson = useSyncExternalStore(subscribeCart, cartSnapshot, cartServerSnapshot);
  const cart = useMemo(() => parseCart(cartJson), [cartJson]);
  const open = useSyncExternalStore(subscribeMinute, () => isOpenNow(), () => true);

  const [drawer, setDrawer] = useState(false);
  const [step, setStep] = useState<Step>('cart');
  const [type, setType] = useState<'Delivery' | 'Pickup'>('Delivery');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState<{ ref: string; total: number } | null>(null);
  const [activeCat, setActiveCat] = useState('');

  const rootRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const change = useCallback((key: string, delta: number) => {
    const r = parseKey(key);
    if (!r || unitPrice(r.it, r.m) == null) return;
    const current = parseCart(cartSnapshot());
    const n = Math.max(0, Math.min(50, (current[key] || 0) + delta));
    const next: Cart = { ...current };
    if (n) next[key] = n; else delete next[key];
    writeCart(next);
  }, []);

  /* ---------- visible menu ---------- */
  const cats = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MENU.map((cat) => ({
      ...cat,
      items: cat.items.filter((it) => {
        if (!hasModePrice(it, mode)) return false;
        if (!q) return true;
        return `${it.name} ${it.note || ''} ${it.jn || ''}`.toLowerCase().includes(q);
      }),
    })).filter((c) => c.items.length);
  }, [mode, query]);

  /* ---------- cart totals ---------- */
  const { lines, count, sum } = useMemo(() => {
    const out: Line[] = [];
    Object.keys(cart).forEach((key) => {
      const r = parseKey(key);
      if (!r || !cart[key]) return;
      const price = unitPrice(r.it, r.m);
      if (price == null) return;
      out.push({ key, it: r.it, m: r.m, qty: cart[key], price });
    });
    return { lines: out, count: out.reduce((a, l) => a + l.qty, 0), sum: out.reduce((a, l) => a + l.qty * l.price, 0) };
  }, [cart]);

  /* delivery fee follows the cart total live (distance comes from the one address check) */
  const dq = type === 'Delivery' && quote ? deliveryQuote(quote.distanceKm, sum) : null;
  const fee = dq && dq.deliverable ? dq.fee : 0;
  const total = sum + fee;
  const canPay = open && count > 0 && !paying && (type === 'Pickup' || (!!dq && dq.deliverable));

  const toFree = Math.max(0, DELIVERY.freeMinOrder + 1 - sum);
  const pct = Math.min(100, Math.round((sum / (DELIVERY.freeMinOrder + 1)) * 100));
  /* the free-delivery meter only matters for delivery orders inside the free radius */
  const showMeter = count > 0 && type === 'Delivery' && !(quote && quote.distanceKm > DELIVERY.freeRadiusKm);

  /* ---------- active category tab ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveCat(e.target.id.replace('cat-', '')); }),
      { rootMargin: '-35% 0px -60% 0px' },
    );
    root.querySelectorAll('.cat').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [cats]);

  useEffect(() => {
    const wrap = tabsRef.current;
    const a = wrap?.querySelector<HTMLElement>(`a[data-cat="${activeCat}"]`);
    if (wrap && a) wrap.scrollTo({ left: a.offsetLeft - (wrap.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
  }, [activeCat]);

  /* ---------- deep links (#item-…, #cat-…) ---------- */
  useEffect(() => {
    if (!window.location.hash) return;
    const t = setTimeout(() => {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) el.scrollIntoView({ block: el.classList.contains('item') ? 'center' : 'start' });
    }, 160);
    return () => clearTimeout(t);
  }, []);

  /* ---------- remembered customer details ---------- */
  useEffect(() => {
    const f = formRef.current;
    if (!f) return;
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '{}');
      (['name', 'phone', 'email', 'address'] as const).forEach((k) => {
        const el = f.elements.namedItem(k) as HTMLInputElement | null;
        if (el && saved[k]) el.value = saved[k];
      });
    } catch { /* ignore */ }
  }, []);

  /* ---------- drawer: lock scroll, focus, Esc ---------- */
  useEffect(() => {
    const lenis = getLenis();
    if (drawer) {
      if (lenis) lenis.stop(); else document.documentElement.style.overflow = 'hidden';
      closeRef.current?.focus();
    }
    return () => { if (lenis) lenis.start(); document.documentElement.style.overflow = ''; };
  }, [drawer]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* "Clear cart" asks for a second tap (it un-arms itself after a few seconds, or when the cart changes) */
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    if (!confirmClear) return;
    const t = setTimeout(() => setConfirmClear(false), 3500);
    return () => clearTimeout(t);
  }, [confirmClear, count]);

  /* the header's "Cart · N" button (components/Navbar.tsx) opens the drawer from anywhere on the page */
  useEffect(() => {
    const openIt = () => { setError(''); setStep((s) => (s === 'success' ? 'cart' : s)); setDrawer(true); };
    window.addEventListener('mh:open-cart', openIt);
    return () => window.removeEventListener('mh:open-cart', openIt);
  }, []);

  const field = (name: string) => (formRef.current?.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() || '';

  /* ---------- delivery check ---------- */
  async function checkDelivery(coords?: { lat: number; lng: number }) {
    const address = field('address');
    if (!coords && address.length < 8) { setQuoteError('Please enter your full address first.'); return; }
    setQuoting(true); setQuoteError('');
    try {
      const res = await fetch('/api/delivery/quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(coords ?? { address }), subtotal: sum }),
      });
      const j = await res.json();
      if (!j.ok) { setQuote(null); setQuoteError(j.error || 'Could not check delivery.'); return; }
      const addrField = formRef.current?.elements.namedItem('address') as HTMLTextAreaElement | null;
      if (coords && addrField && !addrField.value.trim() && j.label) addrField.value = j.label;
      setQuote({ distanceKm: j.distanceKm, lat: j.lat, lng: j.lng, label: j.label, address: addrField?.value.trim() || address, deliverable: j.deliverable, message: j.message, approx: !!j.approx });
      if (!j.deliverable) setQuoteError(j.message);
    } catch {
      setQuote(null); setQuoteError('Could not check delivery. Please check your internet and try again.');
    } finally {
      setQuoting(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setQuoteError('Your browser cannot share location. Please type your address instead.'); return; }
    setQuoting(true); setQuoteError('');
    navigator.geolocation.getCurrentPosition(
      (p) => { setQuoting(false); checkDelivery({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      () => { setQuoting(false); setQuoteError('Could not get your location. Please type your address instead.'); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  /* ---------- pay ---------- */
  async function pay() {
    setError('');
    const name = field('name'), phone = field('phone'), email = field('email'), notes = field('notes'), address = field('address');
    if (name.length < 2) return setError('Please enter your name.');
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''))) return setError('Please enter a valid 10-digit mobile number.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setError('That email address does not look right.');
    if (type === 'Delivery') {
      if (address.length < 8) return setError('Please enter your full delivery address.');
      if (!quote || !dq?.deliverable) return setError('Please check your delivery address first.');
      if (quote.address !== address) return setError('You changed the address — please tap "Check delivery" again.');
    }
    setPaying(true);
    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.it.id, mode: l.m, qty: l.qty })),
          customer: { name, phone, email }, type, notes,
          ...(type === 'Delivery' && quote ? { address, lat: quote.lat, lng: quote.lng } : {}),
        }),
      });
      const j = await res.json();
      if (!j.ok) { setError(j.error || 'Could not start payment.'); setPaying(false); return; }
      try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name, phone, email, address })); } catch { /* ignore */ }

      if (j.demo) {   // TEST MODE (no payment keys yet): the order is already in the Sheet
        writeCart({});
        setPaid({ ref: j.ref, total: j.totals.total });
        setStep('success'); setPaying(false); return;
      }

      if (!(await loadRazorpay()) || !window.Razorpay) { setError('Could not load the payment window. Please check your internet and try again.'); setPaying(false); return; }
      const rz = new window.Razorpay({
        key: j.razorpay.key, amount: j.razorpay.amount, currency: j.razorpay.currency, order_id: j.razorpay.orderId,
        name: SHOP.name, description: `Order ${j.ref}`, prefill: j.prefill, theme: { color: '#FF8A1F' },
        handler: async (r: RzpResponse) => {
          try {
            const v = await fetch('/api/checkout/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...r, ref: j.ref }),
            }).then((x) => x.json());
            if (!v.ok) { setError(v.error || 'Payment could not be verified.'); setPaying(false); return; }
          } catch {
            setError('Payment went through but we could not confirm it on screen. Please call us with reference ' + j.ref + '.');
            setPaying(false); return;
          }
          writeCart({});
          setPaid({ ref: j.ref, total: j.totals.total });
          setStep('success'); setPaying(false);
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rz.on('payment.failed', (r) => { setError(r.error?.description || 'Payment failed. You have not been charged — please try again.'); setPaying(false); });
      rz.open();
    } catch {
      setError('Something went wrong. Please try again.'); setPaying(false);
    }
  }

  function goCat(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const target = document.getElementById(`cat-${id}`);
    if (!target) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { offset: -150 });
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const openDrawer = () => { setError(''); if (step === 'success') setStep('cart'); setDrawer(true); };
  const closeDrawer = () => setDrawer(false);
  const startOver = () => {
    const notes = formRef.current?.elements.namedItem('notes') as HTMLTextAreaElement | null;
    if (notes) notes.value = '';
    setPaid(null); setStep('cart'); setDrawer(false);
  };

  const addons = ADDON_IDS.map((id) => BY_ID[id]).filter((it) => it && !cart[keyOf(it, 'regular')]);

  return (
    <>
      {/* ===== HERO ===== */}
      <header className="om-hero">
        <div className="container om-hero-inner">
          <div className="mb-breadcrumb"><Link href="/">Home</Link> › <span>Menu &amp; Order</span></div>
          <h1 className="om-title">Our Menu, <em>Delivered</em></h1>
          <p className="om-sub">Everything Misal Hub serves — add your favourites, pay securely online and we will have it on its way.</p>
          <div className="om-controls">
            <div className="mode-switch" role="group" aria-label="Menu type">
              <button type="button" className={mode === 'regular' ? 'on' : undefined} onClick={() => setMode('regular')}>Regular Menu</button>
              <button type="button" className={mode === 'jain' ? 'on' : undefined} onClick={() => setMode('jain')}>Jain Menu</button>
            </div>
            <label className="om-search">
              <span className="sr-only">Search the menu</span>
              <input id="q" type="search" placeholder="Search the menu" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>
          <p className="om-jain-note" hidden={mode !== 'jain'}>Jain menu: prepared without onion, garlic or root vegetables. Prices differ from the regular menu.</p>
          <p className="om-delivery-note">
            Free delivery within {DELIVERY.freeRadiusKm} km on orders above ₹{DELIVERY.freeMinOrder}. Beyond that ₹{DELIVERY.perKm} per km (minimum ₹{DELIVERY.minFee}), up to {DELIVERY.maxKm} km.
            {!open && <strong> We are closed right now — orders reopen at 8 AM.</strong>}
          </p>
        </div>
      </header>

      {/* ===== CATEGORY BAR ===== */}
      <div className="cat-bar" id="catBar">
        <div className="container">
          <div className="cat-scroll" id="catScroll" ref={tabsRef}>
            {cats.map((c) => (
              <a key={c.id} href={`#cat-${c.id}`} data-cat={c.id} className={activeCat === c.id ? 'on' : undefined} onClick={(e) => goCat(c.id, e)}>{c.name}</a>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MENU ===== */}
      <main className="container om-main" id="menuRoot" ref={rootRef}>
        {cats.length === 0 && (
          <p className="no-match">No dishes match “{query}”. <button type="button" className="linkish" onClick={() => setQuery('')}>Clear search</button></p>
        )}
        {cats.map((cat) => (
          <section className="cat" id={`cat-${cat.id}`} key={cat.id}>
            <div className="cat-head"><h2>{cat.name}</h2><p>{cat.blurb}</p></div>
            <div className="item-grid">
              {cat.items.map((it) => {
                const p = unitPrice(it, mode);
                const note = mode === 'jain' && it.jn ? it.jn : it.note || '';
                const key = keyOf(it, mode);
                const qty = cart[key] || 0;
                return (
                  <article className="item spot" id={`item-${it.id}`} key={it.id}>
                    <DishImg item={it} />
                    <div className="item-body">
                      <h3>{it.name}</h3>
                      {note && <p className="note">{note}</p>}
                      <div className="item-foot">
                        {p == null ? (
                          <>
                            <span className="price seasonal">Seasonal</span>
                            <span className="ask">Ask in store</span>
                          </>
                        ) : (
                          <>
                            <span className="price">{rupee(p)}</span>
                            <span className="ctrl">
                              {qty ? (
                                <Stepper qty={qty} onDec={() => change(key, -1)} onInc={() => change(key, 1)} />
                              ) : (
                                <button type="button" className="add" onClick={() => change(key, 1)} aria-label={`Add ${it.name} to order`}>Add</button>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      <section className="om-foot container">
        <p>
          Prices are in Indian Rupees. Seasonal items (Aamras) are available in store. Online payment only — UPI, cards, net banking and wallets.
          Questions? <a href={`https://wa.me/${SHOP.whatsapp}`} target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</a>.
        </p>
      </section>

      {/* ===== CART BAR ===== */}
      <div className="cart-fab" id="cartFab" hidden={count === 0}>
        <button type="button" className="fab" id="openCart" onClick={openDrawer} aria-label={`View your order, ${count} items, ${rupee(sum)}`}>
          <span className="fab-thumbs" aria-hidden="true">
            {lines.slice(0, 3).map((l) => <Thumb key={l.key} item={l.it} className="fab-thumb" />)}
            {lines.length > 3 && <span className="fab-thumb fab-more">+{lines.length - 3}</span>}
          </span>
          <span className="fab-info">
            <b key={count} className="cf-count" aria-live="polite"><span id="cartCount">{count}</span> {count === 1 ? 'item' : 'items'}</b>
            <span id="cartTotal">{rupee(sum)}</span>
          </span>
          <span className="fab-go">View order <i aria-hidden="true">→</i></span>
        </button>
      </div>

      {/* ===== CART + CHECKOUT PANEL ===== */}
      <div className={`scrim${drawer ? ' open' : ''}`} id="scrim" onClick={closeDrawer} />
      <aside className={`cart-drawer${drawer ? ' open' : ''}`} id="cartDrawer" data-lenis-prevent role="dialog" aria-modal="true" aria-hidden={!drawer} aria-label="Your order">
        <div className="cd-head">
          <div className="cd-title">
            <h2>{step === 'details' ? 'Checkout' : step === 'success' ? 'Order placed' : 'Your Order'}</h2>
            {step !== 'success' && count > 0 && <span className="cd-badge">{count} {count === 1 ? 'item' : 'items'}</span>}
          </div>
          <button type="button" className="cd-close" aria-label="Close" onClick={closeDrawer} ref={closeRef}>×</button>
        </div>

        {step !== 'success' && (
          <ol className="cd-steps" aria-label="Checkout progress">
            <li className={step === 'cart' ? 'now' : 'done'}><i>{step === 'cart' ? '1' : '✓'}</i>Cart</li>
            <li className={step === 'details' ? 'now' : ''}><i>2</i>Details</li>
            <li><i>3</i>Pay</li>
          </ol>
        )}

        {step === 'success' && paid && (
          <div className="cd-done" id="cdDone">
            <svg className="done-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
            <h3>Thank you!</h3>
            <p>We have received your payment and are preparing your order.</p>
            <div className="ticket">
              <div><small>Order reference</small><b>{paid.ref}</b></div>
              <div><small>Amount paid</small><b>{rupee(paid.total)}</b></div>
            </div>
            <p className="cd-small">If you gave an email address, a confirmation is on its way. Questions? Call {SHOP.phone}.</p>
            <button type="button" className="btn btn-gold" onClick={startOver}>Done</button>
          </div>
        )}

        {/* the whole checkout stays mounted (just hidden after payment) so name / phone / address stay filled for the next order */}
        <div className="cd-scroll" id="cdBody" hidden={step === 'success'}>
          {/* ---- step 1: review ---- */}
          <div hidden={step !== 'cart'}>
            {lines.length === 0 ? (
              <div className="cart-empty">
                <b>Your order is empty</b>
                <p>Pick something delicious from the menu — or start with a favourite:</p>
                <div className="pop-list">
                  {BESTSELLERS.map((id) => BY_ID[id]).filter(Boolean).slice(0, 4).map((it) => (
                    <button type="button" key={it.id} className="pop" onClick={() => change(keyOf(it, 'regular'), 1)}>
                      <Thumb item={it} /><span><b>{it.name}</b><small>{rupee(it.p ?? 0)}</small></span><em>+</em>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="cart-tools">
                  <span>{count} {count === 1 ? 'item' : 'items'} in your order</span>
                  <button
                    type="button"
                    className={`clear-btn${confirmClear ? ' sure' : ''}`}
                    onClick={() => { if (confirmClear) { writeCart({}); setConfirmClear(false); } else setConfirmClear(true); }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>
                    {confirmClear ? 'Tap again to clear' : 'Clear cart'}
                  </button>
                </div>
                {showMeter && (
                  <div className={`meter${toFree === 0 ? ' done' : ''}`}>
                    <div className="meter-text">
                      {toFree > 0
                        ? <>Add <b>₹{toFree}</b> more for <b>free delivery</b> <span>within {DELIVERY.freeRadiusKm} km</span></>
                        : <><b>Free delivery unlocked</b> <span>within {DELIVERY.freeRadiusKm} km</span></>}
                    </div>
                    <div className="meter-bar"><i style={{ width: `${pct}%` }} /></div>
                  </div>
                )}

                <div className="cart-lines">
                  {lines.map((l, i) => (
                    <div className="cl" key={l.key} style={{ '--i': i } as React.CSSProperties}>
                      <Thumb item={l.it} />
                      <div className="cl-main">
                        <b>{l.it.name}</b>
                        <small>{l.m === 'jain' ? 'Jain · ' : ''}{rupee(l.price)} each</small>
                        <Stepper qty={l.qty} onDec={() => change(l.key, -1)} onInc={() => change(l.key, 1)} />
                      </div>
                      <span className="cl-total">{rupee(l.qty * l.price)}</span>
                    </div>
                  ))}
                </div>

                {addons.length > 0 && (
                  <div className="addons">
                    <small>Complete your meal</small>
                    <div className="addon-row">
                      {addons.map((it) => (
                        <button type="button" key={it.id} className="addon-chip" onClick={() => change(keyOf(it, 'regular'), 1)} aria-label={`Add ${it.name}`}>
                          <Thumb item={it} />
                          <span><b>{it.name}</b><small>{rupee(it.p ?? 0)}</small></span>
                          <em>+</em>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ---- step 2: details ---- */}
          <form id="checkoutForm" ref={formRef} className="order-form" hidden={step !== 'details'} noValidate onSubmit={(e) => { e.preventDefault(); pay(); }}>
            <button type="button" className="cd-back" onClick={() => setStep('cart')}>← Back to your order</button>

            {showMeter && type === 'Delivery' && (
              <div className={`meter${toFree === 0 ? ' done' : ''}`}>
                <div className="meter-text">
                  {toFree > 0 ? <>Add <b>₹{toFree}</b> more for <b>free delivery</b> <span>within {DELIVERY.freeRadiusKm} km</span></> : <><b>Free delivery unlocked</b> <span>within {DELIVERY.freeRadiusKm} km</span></>}
                </div>
                <div className="meter-bar"><i style={{ width: `${pct}%` }} /></div>
              </div>
            )}

            <h3>Contact</h3>
            <label>Name<input name="name" type="text" autoComplete="name" required placeholder="Your name" /></label>
            <label>Phone number<input name="phone" type="tel" inputMode="numeric" autoComplete="tel" required placeholder="10-digit mobile number" /></label>
            <label><span>Email <em className="opt">for your receipt · optional</em></span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label>

            <h3>How would you like it?</h3>
            <div className="otype" role="radiogroup" aria-label="Order type">
              <label className={`otype-card${type === 'Delivery' ? ' on' : ''}`}>
                <input type="radio" name="type" value="Delivery" checked={type === 'Delivery'} onChange={() => setType('Delivery')} />
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                <b>Delivery</b><small>To your door</small>
              </label>
              <label className={`otype-card${type === 'Pickup' ? ' on' : ''}`}>
                <input type="radio" name="type" value="Pickup" checked={type === 'Pickup'} onChange={() => setType('Pickup')} />
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
                <b>Pickup</b><small>From our shop</small>
              </label>
            </div>

            <div hidden={type !== 'Delivery'} className="addr-block">
              <label>Delivery address
                <textarea name="address" rows={3} placeholder="Flat / building, street, landmark, area"
                  onChange={() => { if (quote) setQuote(null); setQuoteError(''); }} />
              </label>
              <div className="addr-actions">
                <button type="button" className="btn btn-sm loc-btn" onClick={useMyLocation} disabled={quoting}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="8" /></svg>
                  {quoting ? 'Checking…' : 'Use my current location'}
                </button>
                <button type="button" className="btn btn-sm loc-btn" onClick={() => checkDelivery()} disabled={quoting}>Check delivery</button>
              </div>
              {quote && dq && dq.deliverable && (
                <p className="quote-ok" role="status">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
                  <span>{dq.message}<small>{quote.approx ? `Approximate spot near ${quote.label}. For an exact charge, tap “Use my current location”.` : quote.label}</small></span>
                </p>
              )}
              {quoteError && <p className="form-error" role="alert">{quoteError}</p>}
            </div>
            {type === 'Pickup' && <p className="pickup-note">Collect your order at {SHOP.address}. We will have it ready for you.</p>}

            <label><span>Notes <em className="opt">optional</em></span><textarea name="notes" rows={2} placeholder="Spice level, extra pav, anything else" /></label>
          </form>
        </div>

        {/* ---- sticky footer: always-visible totals + main button ---- */}
        {step !== 'success' && (
          <div className="cd-foot">
            {step === 'cart' ? (
              <>
                <div className="foot-rows cd-totals">
                  <div><span>Subtotal</span><b>{rupee(sum)}</b></div>
                  <small className="cd-small">Delivery charge is worked out from your address at checkout.</small>
                </div>
                {!open && <p className="form-error">We are closed right now. Orders open daily from 8 AM to 8 PM.</p>}
                <button type="button" className="btn btn-gold full-w btn-next" disabled={count === 0 || !open} onClick={() => { setError(''); setStep('details'); }}>
                  Continue to checkout <span className="btn-amt">{rupee(sum)}</span>
                </button>
              </>
            ) : (
              <>
                <div className="sum">
                  <div><span>Subtotal</span><b>{rupee(sum)}</b></div>
                  <div><span>Delivery</span><b>{type === 'Pickup' ? '—' : dq?.deliverable ? (dq.free ? 'Free' : rupee(dq.fee)) : 'Check address'}</b></div>
                  <div className="sum-total"><span>Total</span><b>{rupee(total)}</b></div>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" form="checkoutForm" className="btn btn-gold full-w btn-pay" disabled={!canPay}>
                  {paying ? 'Opening secure payment…' : `Pay ${rupee(total)} securely`}
                </button>
                <p className="secure">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                  Secure online payment by Razorpay · UPI, cards, net banking, wallets
                </p>
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
