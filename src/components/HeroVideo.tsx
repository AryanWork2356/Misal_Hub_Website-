'use client';
import { useEffect, useRef } from 'react';

/**
 * Background hero video — always silent (the file has no audio track and the element is muted).
 * React does not render the `muted` attribute on the server, so it is set before playing.
 * `poster` is shown instantly while the video loads, so the hero is never blank.
 */
export default function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.volume = 0;
    v.play().catch(() => { /* autoplay blocked: the poster stays */ });
  }, []);
  return <video ref={ref} className="hero-video" src={src} poster={poster} autoPlay muted loop playsInline preload="auto" />;
}
