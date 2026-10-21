'use client';
import { useEffect, useState } from 'react';

export type OrderStatus = { delivery: boolean; pickup: boolean; message: string };
const OPEN: OrderStatus = { delivery: true, pickup: true, message: '' };

/** Owner's manual delivery / pickup switch. Starts "on", refreshed every minute and when the tab is shown again. */
export function useOrderStatus(): OrderStatus {
  const [s, setS] = useState<OrderStatus>(OPEN);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch('/api/status', { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json();
        if (alive) setS({ delivery: j.delivery !== false, pickup: j.pickup !== false, message: String(j.message || '') });
      } catch { /* keep last value */ }
    };
    load();
    const t = setInterval(load, 60_000);
    const vis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { alive = false; clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, []);
  return s;
}
