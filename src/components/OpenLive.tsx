'use client';
import { useEffect, useState } from 'react';

/** Shop is open 8 AM – 8 PM every day. Starts as "open" on the server, corrected on the client. */
function useIsOpen() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const h = d.getHours() + d.getMinutes() / 60;
      setOpen(h >= 8 && h < 20);
    };
    tick();
    const t = setInterval(tick, 60000);
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
