/**
 * Opening hours — one tiny file with no other imports, so the header and the order check can share it
 * without pulling the whole menu into every page.
 */
export const HOURS = { openHour: 8, closeHour: 20, tz: 'Asia/Kolkata' } as const;

/** Open 8 AM – 8 PM India time, every day (uses India time wherever the visitor is). */
export function isOpenNow(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: HOURS.tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value);
  const m = Number(parts.find((p) => p.type === 'minute')?.value);
  const t = (h % 24) + m / 60;
  return t >= HOURS.openHour && t < HOURS.closeHour;
}
