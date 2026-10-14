'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { CONFIG, MENU, type Item } from '@/data/menu';
import { getLenis } from '@/lib/lenis';
import { cartServerSnapshot, cartSnapshot, parseCart, subscribeCart, writeCart, type Cart } from '@/lib/cart';

type Mode = 'regular' | 'jain';
type Line = { key: string; it: Item; m: Mode; qty: number; price: number };

const rupee = (n: number) => `₹${n}`;

const BY_ID: Record<string, Item> = {};
MENU.forEach((c) => c.items.forEach((i) => { BY_ID[i.id] = i; }));

const priceOf = (it: Item, m: Mode) => (m === 'jain' ? it.j ?? null : it.p);
const onMenu = (it: Item, m: Mode) => (m === 'jain' ? Object.prototype.hasOwnProperty.call(it, 'j') : true);
const keyOf = (it: Item, m: Mode) => `${it.id}:${m === 'jain' ? 'j' : 'r'}`;
const parseKey = (key: string): { it: Item; m: Mode } | null => {
  const [id, mm] = key.split(':');
  const it = BY_ID[id];
  return it ? { it, m: mm === 'j' ? 'jain' : 'regular' } : null;
};

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
  const [drawer, setDrawer] = useState(false);
  const [done, setDone] = useState(false);
  const [type, setType] = useState<'Delivery' | 'Pickup'>('Delivery');
  const [error, setError] = useState('');
  const [activeCat, setActiveCat] = useState('');
  const rootRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const change = useCallback((key: string, delta: number) => {
    const r = parseKey(key);
    if (!r || priceOf(r.it, r.m) == null) return;
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
        if (!onMenu(it, mode)) return false;
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
      const price = priceOf(r.it, r.m);
      if (price == null) return;
      out.push({ key, it: r.it, m: r.m, qty: cart[key], price });
    });
    return { lines: out, count: out.reduce((a, l) => a + l.qty, 0), sum: out.reduce((a, l) => a + l.qty * l.price, 0) };
  }, [cart]);

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

  /* ---------- drawer: lock scroll, Esc to close ---------- */
  useEffect(() => {
    const lenis = getLenis();
    if (drawer) { if (lenis) lenis.stop(); else document.documentElement.style.overflow = 'hidden'; }
    return () => { if (lenis) lenis.start(); document.documentElement.style.overflow = ''; };
  }, [drawer]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- checkout -> WhatsApp ---------- */
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!count) { setError('Your order is empty.'); return; }
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') || '').trim();
    let digits = String(f.get('phone') || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    const addr = String(f.get('address') || '').trim();
    const notes = String(f.get('notes') || '').trim();
    if (name.length < 2) return setError('Please enter your name.');
    if (!/^[6-9]\d{9}$/.test(digits)) return setError('Please enter a valid 10-digit mobile number.');
    if (type === 'Delivery' && addr.length < 8) return setError('Please enter your full delivery address.');
    if (CONFIG.minOrder && sum < CONFIG.minOrder) return setError(`Minimum order is ${rupee(CONFIG.minOrder)}.`);
    setError('');

    const msg =
      `*New order - ${CONFIG.shopName} (website)*\nName: ${name}\nPhone: ${digits}\nType: ${type}\n` +
      (type === 'Delivery' ? `Address: ${addr}\n` : '') +
      `------------------\n${lines.map((l) => `${l.qty} x ${l.it.name}${l.m === 'jain' ? ' (Jain)' : ''} - ${rupee(l.qty * l.price)}`).join('\n')}\n------------------\n` +
      `Subtotal: ${rupee(sum)}\n` +
      (notes ? `Notes: ${notes}\n` : '') +
      (type === 'Delivery' ? '(Delivery charge, if any, to be confirmed)' : '');

    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    writeCart({});
    setDone(true);
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

  const closeDrawer = () => setDrawer(false);

  return (
    <>
      {/* ===== HERO ===== */}
      <header className="om-hero">
        <div className="container om-hero-inner">
          <div className="mb-breadcrumb"><Link href="/">Home</Link> › <span>Menu &amp; Order</span></div>
          <h1 className="om-title">Our Menu, <em>Delivered</em></h1>
          <p className="om-sub">Everything Misal Hub serves — see what we have, add it to your order and send it to our kitchen.</p>
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
        {cats.length === 0 && <p className="no-match">No dishes match “{query}”. Try another word.</p>}
        {cats.map((cat) => (
          <section className="cat" id={`cat-${cat.id}`} key={cat.id}>
            <div className="cat-head"><h2>{cat.name}</h2><p>{cat.blurb}</p></div>
            <div className="item-grid">
              {cat.items.map((it) => {
                const p = priceOf(it, mode);
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
                                <button type="button" className="add" onClick={() => change(key, 1)}>Add</button>
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
          Prices are in Indian Rupees. Seasonal items (Aamras) are available in store. Also available on{' '}
          <a href="https://www.zomato.com/" target="_blank" rel="noopener noreferrer">Zomato</a> and{' '}
          <a href="https://www.swiggy.com/" target="_blank" rel="noopener noreferrer">Swiggy</a>.
        </p>
      </section>

      {/* ===== CART BAR ===== */}
      <div className="cart-fab" id="cartFab" hidden={count === 0}>
        <button type="button" className="btn btn-gold" id="openCart" onClick={() => { setDone(false); setDrawer(true); }}>
          <span>View Order</span><span className="cf-sep" />
          <span><b id="cartCount">{count}</b> items</span><span className="cf-sep" />
          <span id="cartTotal">{rupee(sum)}</span>
        </button>
      </div>

      {/* ===== CART DRAWER ===== */}
      <div className={`scrim${drawer ? ' open' : ''}`} id="scrim" onClick={closeDrawer} />
      <aside className={`cart-drawer${drawer ? ' open' : ''}`} id="cartDrawer" data-lenis-prevent aria-hidden={!drawer} aria-label="Your order">
        <div className="cd-head">
          <h2>Your Order</h2>
          <button type="button" className="cd-close" aria-label="Close" onClick={closeDrawer}>×</button>
        </div>

        {!done ? (
          <div className="cd-body" id="cdBody">
            <div className="cart-lines">
              {lines.length === 0 && <p className="cart-empty">Your order is empty. Add dishes from the menu.</p>}
              {lines.map((l) => (
                <div className="cl" key={l.key}>
                  <div className="cl-main"><b>{l.it.name}</b><small>{l.m === 'jain' ? 'Jain · ' : ''}{rupee(l.price)} each</small></div>
                  <Stepper qty={l.qty} onDec={() => change(l.key, -1)} onInc={() => change(l.key, 1)} />
                  <span className="cl-total">{rupee(l.qty * l.price)}</span>
                </div>
              ))}
            </div>

            <div className="cd-totals">
              <div><span>Subtotal</span><b>{rupee(sum)}</b></div>
              <p className="cd-small">{CONFIG.deliveryNote}</p>
            </div>

            <form ref={formRef} className={`order-form${lines.length ? '' : ' is-disabled'}`} noValidate onSubmit={submit}>
              <h3>Your details</h3>
              <label>Name<input name="name" type="text" autoComplete="name" required placeholder="Your name" /></label>
              <label>Phone number<input name="phone" type="tel" inputMode="numeric" autoComplete="tel" required placeholder="10-digit mobile number" /></label>
              <fieldset className="ot">
                <legend>Order type</legend>
                <label className="radio"><input type="radio" name="type" value="Delivery" checked={type === 'Delivery'} onChange={() => setType('Delivery')} /> <span>Delivery</span></label>
                <label className="radio"><input type="radio" name="type" value="Pickup" checked={type === 'Pickup'} onChange={() => setType('Pickup')} /> <span>Pickup from shop</span></label>
              </fieldset>
              <label style={{ display: type === 'Pickup' ? 'none' : undefined }}>Delivery address<textarea name="address" rows={3} placeholder="Flat / building, street, landmark" /></label>
              <label>Notes (optional)<textarea name="notes" rows={2} placeholder="Spice level, extra pav, anything else" /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-gold full-w">Send Order on WhatsApp</button>
              <p className="cd-small">Your order is placed when you press Send in WhatsApp. We will reply to confirm the total, delivery charge and time.</p>
            </form>
          </div>
        ) : (
          <div className="cd-done" id="cdDone">
            <h3>Almost done</h3>
            <p>WhatsApp has opened with your order. Press <b>Send</b> there to place it — we will confirm shortly.</p>
            <button type="button" className="btn btn-gold" onClick={() => { setDone(false); setDrawer(false); formRef.current?.reset(); }}>Start a new order</button>
          </div>
        )}
      </aside>
    </>
  );
}
