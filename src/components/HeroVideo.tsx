'use client';
import { useEffect, useRef } from 'react';

/** Background hero video. React does not render the `muted` attribute on the server, so set it before playing. */
export default function HeroVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => { /* autoplay blocked: poster/first frame stays */ });
  }, []);
  return <video ref={ref} className="hero-video" src={src} autoPlay muted loop playsInline preload="auto" />;
}
