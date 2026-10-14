'use client';
import { useEffect, useState } from 'react';

/** WhatsApp bubble + back-to-top button (shown after scrolling). */
export default function FloatButtons({ threshold = 400 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return (
    <>
      <a href="https://wa.me/919004167448" className="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="#fff" aria-hidden="true"><path d="M4 4h16v12H8l-4 4z" /></svg>
      </a>
      <button
        className={`scroll-top${visible ? ' visible' : ''}`}
        id="scrollTop"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </>
  );
}
