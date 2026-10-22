/**
 * Indian mobile number checks, shared by the checkout form (browser) and the server.
 * This catches typos and obvious made-up numbers for free. It cannot prove the person owns the number —
 * that needs an OTP (planned together with the payment-gateway / SMS setup).
 */
export function normalizePhone(raw: unknown): string | null {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

/** true for numbers that look made up: 9999999999, 9876543210, 9898989898, lots of one digit ... */
export function looksFake(d: string): boolean {
  if (new Set(d).size <= 2) return true;                                   // 9999999999, 9898989898, 6666677777
  if (/(\d)\1{5,}/.test(d)) return true;                                   // six or more of the same digit in a row
  const up = '01234567890123456789', down = '98765432109876543210';
  for (let i = 0; i + 6 <= d.length; i++) {                                 // 6+ in a row going up or down (123456, 987654)
    const s = d.slice(i, i + 6);
    if (up.includes(s) || down.includes(s)) return true;
  }
  return false;
}

/** the number, cleaned to 10 digits, or null when it is not a plausible Indian mobile number */
export function validMobile(raw: unknown): string | null {
  const d = normalizePhone(raw);
  return d && !looksFake(d) ? d : null;
}
