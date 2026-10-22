/**
 * Order tracking helpers. The shop sets "ETA (min)" in the Sheet; the Sheet stamps when it was set, so the
 * ready-by time `etaAt` is fixed in time. The phone just counts down to it: 40 now -> 39 a minute later -> ...
 * Changing the ETA in the Sheet moves `etaAt`, and the countdown simply jumps to the new value.
 */
export type OrderView = {
  ref: string;
  progress: string;              // Preparing | Out for delivery | Ready for pickup | Delivered | Cancelled
  items: string;                 // one dish per line
  total: number;
  type: string;                  // Delivery | Pickup
  address: string;
  etaAt: number | null;          // ms since 1970 (server clock) the order should arrive / be ready
  etaMin: number | null;         // the minutes the shop originally set (for the progress ring)
  note: string;                  // optional message from the shop
  /* the bill (My orders) */
  createdAt?: number | null;     // when the order was placed (ms)
  subtotal?: number; fee?: number; discount?: number; promo?: string; paymentId?: string;
};

/** whole minutes left, rounded UP (40:00 -> 40, 39:59 -> 40, 39:00 -> 39); null when no ETA has been set yet */
export const minutesLeft = (etaAt: number | null, now: number): number | null => (etaAt == null ? null : Math.ceil((etaAt - now) / 60000));

export const isFinished = (progress: string) => progress === 'Delivered' || progress === 'Cancelled';

/** which step of the 4-step bar is current: 0 placed, 1 preparing, 2 on the way / ready, 3 delivered */
export function stepIndex(progress: string): number {
  if (progress === 'Delivered') return 3;
  if (progress === 'Out for delivery' || progress === 'Ready for pickup') return 2;
  return 1;
}
