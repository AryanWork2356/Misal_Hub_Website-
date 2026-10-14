'use client';
import { useEffect, useRef } from 'react';

export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (ref.current) ref.current.style.transform = `scaleX(${h > 0 ? Math.min(window.scrollY / h, 1) : 0})`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <div className="scroll-progress" ref={ref} />;
}
