/**
 * Turns a long Indian-style address ("A/504, Ankur Enclave, Vijay Park, Opp Tokyo Tower, Near GN Residency.")
 * into a list of progressively simpler search queries. Map databases (especially OpenStreetMap) rarely know flat numbers,
 * building names or "Opp / Near" landmarks, but usually know the area — so we try the full text first, then drop the
 * flat number, then the building, then fall back to the neighbourhood. Results from query #2 onwards are "approximate".
 */
export type AddressQuery = { q: string; approx: boolean };

const LANDMARK = /^(opp(osite)?|near(by)?|nr|behind|beside|next to|above|adj(acent)?|off|landmark)\b[\s:.\-]*/i;
const UNIT_WORD = /^(flat|room|wing|floor|shop|bldg|building|plot|house|h\.?\s?no|unit|block)\b\.?\s*[#:\-]?\s*[A-Za-z0-9/-]*(?=[\s,.;-]|$)[\s,.;-]*/i;
// "A/504", "504", "B-12/3" — but not "5th floor" or "Sector 5"
const UNIT_CODE = /^[A-Za-z]{0,2}[-/ ]?\d+[A-Za-z]?(?:[-/]\d+[A-Za-z]?)*(?=[\s,.;-]|$)[\s,.;-]*/;
const PINCODE = /^\d{6}$/;

const trimJunk = (s: string) => s.replace(/^[\s.,;:-]+|[\s.,;:-]+$/g, '');

export function addressQueries(address: string, max = 5): AddressQuery[] {
  const norm = address.replace(/\s+/g, ' ').replace(/\s+([,.;])/g, '$1').trim();
  if (!norm) return [];

  const keep: string[] = [];
  const landmarks: string[] = [];
  for (const raw of norm.split(/[,;\n]+/)) {
    let s = trimJunk(raw);
    if (!s) continue;
    if (LANDMARK.test(s)) { const l = trimJunk(s.replace(LANDMARK, '')); if (l) landmarks.push(l); continue; }
    s = trimJunk(s.replace(UNIT_WORD, ''));
    s = trimJunk(s.replace(UNIT_CODE, ''));
    s = trimJunk(s.replace(/\b\d{6}\b/g, ''));   // pincodes often make a map search fail
    if (!s || PINCODE.test(s)) continue;
    keep.push(s);
  }

  // add some local context unless the customer already gave it
  const located = /mira|kashi|thane|mumbai|bhayand|bhayandar|dahisar|borivali|vasai|\b4\d{5}\b/i.test(norm);
  const suffix = located ? '' : ', Mira Road, Thane';

  const out: AddressQuery[] = [{ q: norm, approx: false }];
  const add = (q: string) => { q = trimJunk(q); if (q && !out.some((o) => o.q.toLowerCase() === q.toLowerCase())) out.push({ q, approx: out.length > 0 }); };

  if (keep.length) add(keep.join(', ') + suffix);                              // without flat no. / landmarks
  for (let i = 1; i < keep.length; i++) add(keep.slice(i).join(', ') + suffix); // without the building, then without the society…
  landmarks.slice(0, 2).forEach((l) => add(l + (suffix || ', Mira Road, Thane')));
  return out.slice(0, max);
}
