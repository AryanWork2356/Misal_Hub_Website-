'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/** Small orange ring + dot that follow the mouse and swell over links/buttons/cards. Desktop mouse only. */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const off = new URLSearchParams(window.location.search).has('nofx');
    if (!fine || reduce || off || !ring.current || !dot.current) return;

    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.35, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.35, ease: 'power3' });
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.05 });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.05 });
    const hot = 'a, button, input, select, textarea, label, .spot, .hs-card, [role="button"]';

    const move = (e: PointerEvent) => {
      document.body.classList.add('cursor-on');
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
      ring.current?.classList.toggle('is-hot', !!(e.target as HTMLElement).closest?.(hot));
    };
    const leave = () => document.body.classList.remove('cursor-on');

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
      document.body.classList.remove('cursor-on');
    };
  }, []);

  return (
    <>
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
