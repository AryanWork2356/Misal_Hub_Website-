'use client';
import { useEffect } from 'react';
import { getLenis } from '@/lib/lenis';

/**
 * Arriving from another page with #section in the URL (e.g. "Contact Us" on the Menu page -> /#contact)
 * should land on that section, not the top. The page is still settling (images, pinned scroller), so we
 * scroll a few times and give up as soon as the visitor scrolls themselves.
 */
export default function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let stopped = false;
    const stop = () => { stopped = true; };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchmove', stop, { passive: true });
    const go = (immediate: boolean) => {
      const el = document.getElementById(id);
      if (stopped || !el) return;
      const top = el.getBoundingClientRect().top;
      if (Math.abs(top - 70) < 8) return;               // already there
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(el, { offset: -70, immediate });
      else window.scrollTo({ top: window.scrollY + top - 70, behavior: immediate ? 'auto' : 'smooth' });
    };
    const timers = [250, 900, 1800].map((ms, i) => window.setTimeout(() => go(i > 0), ms));
    return () => { timers.forEach(clearTimeout); window.removeEventListener('wheel', stop); window.removeEventListener('touchmove', stop); };
  }, []);
  return null;
}
