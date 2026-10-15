'use client';
import { useEffect, useState } from 'react';
import { isOpenNow } from '@/lib/hours';

/** Shop is open 8 AM – 8 PM India time. Starts as "open" on the server, corrected on the client every 30 s. */
export function useIsOpen() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const tick = () => setOpen(isOpenNow());
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  return open;
}
export function OpenLive() {
  const open = useIsOpen();
  return (
    <span className="open-live" style={{ color: open ? '#4ade80' : '#f87171' }}>
      {open ? 'Open Now' : 'Closed'}
    </span>
  );
}

export function OpenBadge() {
  const open = useIsOpen();
  return (
    <span
      className="open-badge"
      style={{ background: open ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: open ? '#16a34a' : '#dc2626' }}
    >
      {open ? 'Open Now' : 'Closed'}
    </span>
  );
}
