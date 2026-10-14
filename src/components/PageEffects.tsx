'use client';
/**
 * Per-page scroll + cursor effects (rendered by <PageShell>, so it runs AFTER the page's own markup
 * is in the DOM — an effect in the root layout can fire before streamed page content exists).
 *  hero intro + scrub, section-title reveals, parallax, tilt, magnetic buttons, pinned horizontal
 *  best-sellers scroller, scroll-reveal (.reveal), stat counters.
 * Everything is class driven, so page markup stays plain and identical to the static site.
 * ?nofx = deterministic still frame (no animation) for screenshot comparison.
 */
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from '@/lib/lenis';

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const noFx = () => new URLSearchParams(window.location.search).has('nofx');

export default function PageEffects() {
  /* runs once when the page (and all its content) has mounted */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = prefersReduced();
    const off = noFx();
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const cleanups: Array<() => void> = [];

    getLenis()?.scrollTo(0, { immediate: true });

    /* scroll-reveal for .reveal (all pages) */
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (off) {
      // ?nofx = deterministic still frame (screenshot comparison): no transitions, no animation
      const freeze = document.createElement('style');
      freeze.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
      document.head.appendChild(freeze);
      cleanups.push(() => freeze.remove());
      reveals.forEach((el) => el.classList.add('visible'));
    } else {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e, i) => {
          if (!e.isIntersecting) return;
          setTimeout(() => e.target.classList.add('visible'), i * 100);
          io.unobserve(e.target);
        }),
        { threshold: 0.1, rootMargin: '0px 0px -60px 0px' },
      );
      reveals.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    /* stat counters (home) */
    const counters = Array.from(document.querySelectorAll<HTMLElement>('.sn[data-target]'));
    const showFinal = (el: HTMLElement) => {
      const dec = el.dataset.decimal ? parseInt(el.dataset.decimal, 10) : 0;
      el.textContent = parseFloat(el.dataset.target || '0').toFixed(dec);
    };
    if (counters.length) {
      if (off || reduce) {
        counters.forEach(showFinal);
      } else {
        const host = document.querySelector('.stats-cream');
        const sio = new IntersectionObserver((entries) => {
          if (!entries[0].isIntersecting) return;
          counters.forEach((el) => {
            const target = parseFloat(el.dataset.target || '0');
            const dec = el.dataset.decimal ? parseInt(el.dataset.decimal, 10) : 0;
            const o = { v: 0 };
            gsap.to(o, {
              v: target, duration: 1.8, ease: 'power3.out',
              onUpdate: () => { el.textContent = dec ? o.v.toFixed(dec) : String(Math.floor(o.v)); },
              onComplete: () => showFinal(el),
            });
          });
          sio.disconnect();
        }, { threshold: 0.4 });
        if (host) sio.observe(host);
        cleanups.push(() => sio.disconnect());
      }
    }

    if (off) return () => cleanups.forEach((c) => c());

    /* cursor spotlight on .spot */
    if (canHover) {
      const onMove = (e: PointerEvent) => {
        const s = (e.target as HTMLElement).closest?.('.spot') as HTMLElement | null;
        if (!s) return;
        const r = s.getBoundingClientRect();
        s.style.setProperty('--mx', `${e.clientX - r.left}px`);
        s.style.setProperty('--my', `${e.clientY - r.top}px`);
      };
      document.addEventListener('pointermove', onMove, { passive: true });
      cleanups.push(() => document.removeEventListener('pointermove', onMove));
    }

    if (reduce) return () => cleanups.forEach((c) => c());

    const ctx = gsap.context(() => {
      /* tilt + magnetic */
      if (canHover) {
        gsap.utils.toArray<HTMLElement>('.tilt').forEach((el) => {
          const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
          const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
          gsap.set(el, { transformPerspective: 900 });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 10);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
          };
          const leave = () => { rx(0); ry(0); };
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerleave', leave);
          cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
        });
        gsap.utils.toArray<HTMLElement>('.magnetic').forEach((el) => {
          const x = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
          const y = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            x((e.clientX - (r.left + r.width / 2)) * 0.22);
            y((e.clientY - (r.top + r.height / 2)) * 0.3);
          };
          const leave = () => { x(0); y(0); };
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerleave', leave);
          cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
        });
      }

      /* hero intro + scrub */
      const hero = document.querySelector<HTMLElement>('.hero-cine');
      if (hero) {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from('.hero-eyebrow', { y: 18, opacity: 0, duration: 0.7 })
          .from('.hero-h1 .hl', { yPercent: 110, duration: 1.05, stagger: 0.14 }, '-=.35')
          .from('.hero-desc', { y: 22, opacity: 0, duration: 0.8 }, '-=.6')
          .from('.hero-btns .btn', { y: 22, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=.55')
          .from('.scroll-cue', { opacity: 0, duration: 0.8 }, '-=.3');
        gsap.to('.hero-video', { scale: 1.22, yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        gsap.to('.hero-text', { yPercent: -14, opacity: 0.1, ease: 'none',
          scrollTrigger: { trigger: hero, start: '30% top', end: 'bottom top', scrub: true } });
        gsap.to('.scroll-cue', { opacity: 0, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: '25% top', scrub: true } });
      }

      /* section titles slide up */
      gsap.utils.toArray<HTMLElement>('.section-title').forEach((el) => {
        if (el.closest('.reveal') || el.closest('.hero')) return;
        gsap.from(el, { y: 44, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });

      /* parallax layers */
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const s = parseFloat(el.dataset.parallax || '0.1') || 0.1;
        gsap.fromTo(el, { y: -s * 160 }, { y: s * 160, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      /* stagger-in chips */
      const chips = gsap.utils.toArray<HTMLElement>('.oc-chip');
      if (chips.length) {
        gsap.set(chips, { y: 28, opacity: 0 });
        ScrollTrigger.batch(chips, { start: 'top 92%', once: true,
          onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: 'power3.out' }) });
      }

      /* best sellers: pinned horizontal scroll (desktop) */
      const track = document.querySelector<HTMLElement>('.hs-track');
      const pin = document.querySelector<HTMLElement>('.hs-pin');
      if (track && pin) {
        const mm = gsap.matchMedia();
        mm.add('(min-width: 1025px)', () => {
          track.classList.add('is-pinned');
          const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);
          gsap.to(track, { x: () => -dist(), ease: 'none',
            scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true } });
          return () => track.classList.remove('is-pinned');
        });
      }
    });

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    const t = setTimeout(() => ScrollTrigger.refresh(), 400); // images/fonts settle

    return () => {
      clearTimeout(t);
      window.removeEventListener('load', onLoad);
      cleanups.forEach((c) => c());
      ctx.revert();
    };
  }, []);

  return null;
}

