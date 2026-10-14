'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Active = 'home' | 'about' | 'franchise' | 'menu';

/**
 * Same markup/classes as the static site's nav.
 * `home`: on the home page the Home link / logo / Contact are in-page anchors.
 * `applyAnchor`: on the franchise page "Get Franchise" jumps to the form.
 */
export default function Navbar({ active, home = false, applyAnchor = false }: { active?: Active; home?: boolean; applyAnchor?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

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

  const cls = (k: Active) => (active === k ? 'active' : undefined);
  const close = () => setOpen(false);

  /* Home page: plain in-page anchors. Elsewhere: client-side links. */
  const homeLink = (className?: string) =>
    home ? <a href="#home" className={className} onClick={close}>Home</a>
         : <Link href="/" className={className} onClick={close}>Home</Link>;
  const contactLink = () =>
    home ? <a href="#contact" onClick={close}>Contact Us</a>
         : <Link href="/#contact" onClick={close}>Contact Us</Link>;
  const franchiseCta = (className: string) =>
    applyAnchor ? <a href="#apply" className={className} onClick={close}>Get Franchise</a>
                : <Link href="/franchise" className={className} onClick={close}>Get Franchise</Link>;

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar" ref={navRef}>
      <div className="nav-inner">
        <ul className="nav-links nav-left">
          <li>{homeLink(cls('home'))}</li>
          <li><Link href="/about" className={cls('about')}>About Us</Link></li>
          <li><Link href="/franchise" className={cls('franchise')}>Franchise</Link></li>
        </ul>
        {home ? (
          <a href="#home" className="nav-logo"><img src="/images/logo.jpg" alt="Misal Hub Logo" /></a>
        ) : (
          <Link href="/" className="nav-logo"><img src="/images/logo.jpg" alt="Misal Hub Logo" /></Link>
        )}
        <ul className="nav-links nav-right">
          <li><Link href="/menu" className={cls('menu')}>Menu &amp; Order</Link></li>
          <li>{contactLink()}</li>
          <li>{franchiseCta('btn-franchise')}</li>
        </ul>
        <button className="hamburger" id="hamburger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          <span style={open ? { transform: 'rotate(45deg) translate(5px,5px)' } : undefined} />
          <span style={open ? { opacity: 0 } : undefined} />
          <span style={open ? { transform: 'rotate(-45deg) translate(5px,-5px)' } : undefined} />
        </button>
      </div>

      <div className={`mobile-drawer${open ? ' open' : ''}`} id="mobileDrawer">
        {homeLink(cls('home'))}
        <Link href="/about" className={cls('about')} onClick={close}>About Us</Link>
        <Link href="/franchise" className={cls('franchise')} onClick={close}>Franchise</Link>
        <Link href="/menu" className={cls('menu')} onClick={close}>Menu &amp; Order</Link>
        {contactLink()}
        {franchiseCta('drawer-cta')}
      </div>
    </nav>
  );
}
