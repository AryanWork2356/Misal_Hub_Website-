'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { OpenLive, useIsOpen } from './OpenLive';
import { useOrderStatus } from '@/lib/useOrderStatus';
import { getLenis } from '@/lib/lenis';
import { cartServerSnapshot, cartSnapshot, parseCart, subscribeCart } from '@/lib/cart';
import { SHOP } from '@/lib/pricing';

type Active = 'home' | 'about' | 'franchise' | 'menu';

const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${SHOP.lat},${SHOP.lng}`;

/**
 * Same desktop markup/classes as the static site's nav.
 * Phones get: logo · "Deliver Now" pill · hamburger (far right) which opens a full-screen menu.
 *  - `home`: on the home page the Home link / logo / Contact are in-page anchors.
 *  - `applyAnchor`: on the franchise page "Get Franchise" jumps to the form.
 *  - on the Menu page the pill becomes "Cart · N" and opens the cart drawer.
 */
export default function Navbar({ active, home = false, applyAnchor = false }: { active?: Active; home?: boolean; applyAnchor?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const isOpen = useIsOpen();
  const ost = useOrderStatus();                      // owner's manual switch
  const accepting = isOpen && (ost.delivery || ost.pickup);
  const state = accepting ? 's-open' : 's-closed';   // green glow while taking orders, red while not

  const cartJson = useSyncExternalStore(subscribeCart, cartSnapshot, cartServerSnapshot);
  const cartCount = Object.values(parseCart(cartJson)).reduce((a, n) => a + (Number(n) || 0), 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > (home ? 80 : 60));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [home]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  /* full-screen menu: lock page scroll while open, Esc closes */
  useEffect(() => {
    if (!open) return;
    const lenis = getLenis();
    if (lenis) lenis.stop(); else document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (lenis) lenis.start(); else document.documentElement.style.overflow = '';
    };
  }, [open]);

  const cls = (k: Active) => (active === k ? 'active' : undefined);
  const close = () => setOpen(false);

  /* Home page: plain in-page anchors. Elsewhere: client-side links. */
  const homeLink = (className?: string, label = 'Home') =>
    home ? <a href="#home" className={className} onClick={close}>{label}</a>
         : <Link href="/" className={className} onClick={close}>{label}</Link>;
  const contactLink = (className?: string, label = 'Contact Us') =>
    home ? <a href="#contact" className={className} onClick={close}>{label}</a>
         : <Link href="/#contact" className={className} onClick={close}>{label}</Link>;
  const franchiseCta = (className: string) =>
    applyAnchor ? <a href="#apply" className={className} onClick={close}>Get Franchise</a>
                : <Link href="/franchise" className={className} onClick={close}>Get Franchise</Link>;

  const onMenuPage = active === 'menu';
  const openCart = () => { close(); window.dispatchEvent(new Event('mh:open-cart')); };

  const overlayLinks: { node: React.ReactNode }[] = [
    { node: homeLink(cls('home'), 'Home') },
    { node: <Link href="/menu" className={cls('menu')} onClick={close}>Menu &amp; Order</Link> },
    { node: <Link href="/about" className={cls('about')} onClick={close}>About Us</Link> },
    { node: <Link href="/franchise" className={cls('franchise')} onClick={close}>Franchise</Link> },
    { node: contactLink(undefined, 'Contact') },
  ];

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}${open ? ' menu-open' : ''}`} id="navbar" ref={navRef}>
      <div className="nav-inner">
        <ul className="nav-links nav-left">
          <li>{homeLink(cls('home'))}</li>
          <li><Link href="/about" className={cls('about')}>About Us</Link></li>
          <li><Link href="/franchise" className={cls('franchise')}>Franchise</Link></li>
        </ul>
        {home ? (
          <a href="#home" className="nav-logo" onClick={close}><img src="/images/logo.png" alt="Misal Hub Logo" /></a>
        ) : (
          <Link href="/" className="nav-logo" onClick={close}><img src="/images/logo.png" alt="Misal Hub Logo" /></Link>
        )}
        <ul className="nav-links nav-right">
          <li><Link href="/menu" className={cls('menu')}>Menu &amp; Order</Link></li>
          <li>{contactLink()}</li>
          <li>{franchiseCta('btn-franchise')}</li>
          {/* far-right call to action (laptops/desktops). On the Menu page it becomes the cart button once there is something in it. */}
          <li className="nav-deliver">
            {onMenuPage ? (
              cartCount > 0 && (
                <button type="button" className={`deliver-btn is-cart ${state}`} onClick={openCart} aria-label={`Open your cart, ${cartCount} items`}>
                  <i /> Cart · {cartCount} <span aria-hidden="true">→</span>
                </button>
              )
            ) : (
              <Link href="/menu" className={`deliver-btn ${state}`} title={accepting ? undefined : (isOpen ? `Orders are paused right now${ost.message ? ' — ' + ost.message : ''}` : 'We are closed right now — open 8 AM to 8 PM')}><i /> Deliver Now <span aria-hidden="true">→</span></Link>
            )}
          </li>
        </ul>

        {/* phones only (hidden by CSS on desktop) */}
        {onMenuPage ? (
          cartCount > 0 && (
            <button type="button" className={`deliver-pill is-cart ${state}`} onClick={openCart} aria-label={`Open your cart, ${cartCount} items`}>
              <i /> Cart · {cartCount}
            </button>
          )
        ) : (
          <Link href="/menu" className={`deliver-pill ${state}`} onClick={close}><i /> Deliver Now</Link>
        )}
        <button
          type="button"
          className={`hamburger${open ? ' is-open' : ''}`}
          id="hamburger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobileMenu"
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* full-screen phone menu */}
      <div className={`mnav${open ? ' open' : ''}`} id="mobileMenu" aria-hidden={!open}>
        <div className="mnav-glow" aria-hidden="true" />
        <ul className="mnav-links">
          {overlayLinks.map((l, i) => (
            <li key={i} style={{ '--i': i } as React.CSSProperties}><em>{String(i + 1).padStart(2, '0')}</em>{l.node}</li>
          ))}
        </ul>
        <div className="mnav-foot" style={{ '--i': 5 } as React.CSSProperties}>
          <Link href="/menu" className="mnav-cta" onClick={close}>Deliver Now <span>→</span></Link>
          <div className="mnav-actions">
            <a href={`tel:+${SHOP.whatsapp}`}>Call</a>
            <a href={`https://wa.me/${SHOP.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer">Directions</a>
          </div>
          <p className="mnav-meta"><OpenLive /> · 8 AM – 8 PM · Mira Road East</p>
          <div className="mnav-extra">{franchiseCta('mnav-franchise')}</div>
        </div>
      </div>
    </nav>
  );
}
