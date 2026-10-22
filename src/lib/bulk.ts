import { validMobile } from './phone';

/**
 * Bulk / party order enquiries. Everything the shop needs to plan and quote an order is collected here.
 * Shared by the form (browser) and the API route (server), so both apply the same rules.
 * Change the numbers below to change the rules.
 */
export const BULK = {
  /** shown to customers: please send the request at least this long before the event */
  leadHours: 24,
  /** the shop calls back within this time (shown to customers) */
  callbackHours: 3,
  /** furthest ahead an event date can be */
  maxDaysAhead: 180,
};

export const OCCASIONS = ['Birthday party', 'Office / corporate', 'Family function', 'Festival / puja', 'Wedding / engagement', 'Get-together', 'Other'] as const;
export const PEOPLE = ['10 – 25 people', '25 – 50 people', '50 – 100 people', '100+ people'] as const;
export const CUTLERY = ['Yes, please send plates & cutlery', 'No, we have our own'] as const;

export type BulkInput = {
  name: string; phone: string; email: string;
  occasion: string; date: string; time: string; people: string;
  details: string; special: string; cutlery: string; budget: string;
  type: 'Delivery' | 'Pickup'; address: string; notes: string;
};

const clean = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanMulti = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, ' ').trim().slice(0, max);

/** today's date in India as YYYY-MM-DD */
export const istToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
const addDays = (ymd: string, n: number) => { const d = new Date(`${ymd}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
/** the earliest date a customer can pick (tomorrow, India time) */
export const earliestDate = (now = new Date()) => addDays(istToday(now), 1);

export function validateBulk(b: Record<string, unknown>, now = new Date()): { ok: true; data: BulkInput } | { ok: false; error: string } {
  const name = clean(b.name, 80);
  const phone = validMobile(b.phone);
  const email = clean(b.email, 120);
  const occasion = clean(b.occasion, 40);
  const date = clean(b.date, 10);
  const time = clean(b.time, 5);
  const people = clean(b.people, 30);
  const details = cleanMulti(b.details, 1500);
  const special = clean(b.special, 300);
  const cutlery = clean(b.cutlery, 60);
  const budget = clean(b.budget, 40);
  const type = b.type === 'Pickup' ? 'Pickup' : 'Delivery';
  const address = cleanMulti(b.address, 300);
  const notes = cleanMulti(b.notes, 500);

  if (name.length < 2) return { ok: false, error: 'Please enter your name.' };
  if (!phone) return { ok: false, error: 'Please enter a real 10-digit mobile number — we will call you on it.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'That email address does not look right.' };
  if (!(OCCASIONS as readonly string[]).includes(occasion)) return { ok: false, error: 'Please choose the occasion.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, error: 'Please choose the date you need the food.' };
  if (date < earliestDate(now)) return { ok: false, error: `Please choose a date at least ${BULK.leadHours} hours ahead (tomorrow or later).` };
  if (date > addDays(istToday(now), BULK.maxDaysAhead)) return { ok: false, error: 'That date is too far ahead. Please call us for dates beyond 6 months.' };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { ok: false, error: 'Please choose the time you need the food.' };
  if (!(PEOPLE as readonly string[]).includes(people)) return { ok: false, error: 'Please choose how many people.' };
  if (details.length < 10) return { ok: false, error: 'Please tell us what you would like to order (dishes and rough quantities).' };
  if (!(CUTLERY as readonly string[]).includes(cutlery)) return { ok: false, error: 'Please tell us if you need plates and cutlery.' };
  if (type === 'Delivery' && address.length < 10) return { ok: false, error: 'Please enter the full delivery address with a landmark.' };

  return { ok: true, data: { name, phone, email, occasion, date, time, people, details, special, cutlery, budget, type, address: type === 'Delivery' ? address : '', notes } };
}
