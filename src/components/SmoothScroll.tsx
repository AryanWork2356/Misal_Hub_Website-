'use client';
/**
 * Scroll + cursor effects for every page (port of the static site's fx.js / script.js).
 *  - Lenis smooth scroll (one instance for the whole app)
 *  - per page: hero intro + scrub, section-title reveals, parallax, tilt, magnetic buttons,
 *    pinned horizontal best-sellers scroller, scroll-reveal (.reveal), stat counters
 * Everything is DOM-class driven, so the page markup stays plain and identical to the static site.
 * Add ?nofx to any URL to switch effects off (used for screenshot comparison).
 */
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { setLenis } from '@/lib/lenis';

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const noFx = () => new URLSearchParams(window.location.search).has('nofx');

export default function SmoothScroll() {

  /* ---------- once: Lenis smooth scroll ---------- */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (prefersReduced() || noFx()) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // in-page anchors (#contact, #apply, #cat-misal …)
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute('href') || '';
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -90 });
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}

