import 'server-only';
import { SHOP } from '@/lib/pricing';
import { addressQueries } from '@/lib/addressQueries';
import { env } from './env';

export type LatLng = { lat: number; lng: number };
export type Geocoded = LatLng & { label: string };
/** pprox: only a simplified version of the address matched (flat / building / landmark dropped) — position is the neighbourhood, not the doorstep. */
export type GeocodedAddress = Geocoded & { approx: boolean; matched: string };

const shopPoint = (): LatLng => env.shopLatLng() ?? { lat: SHOP.lat, lng: SHOP.lng };

/** A box ~±15 km around the shop, used to bias address search towards Mira Road / Bhayander. */
const BOX = () => {
  const s = shopPoint();
  const d = 0.15;
  return { south: s.lat - d, north: s.lat + d, west: s.lng - d, east: s.lng + d };
};

const OSM_HEADERS = { 'User-Agent': 'MisalHubWebsite/1.0 (contact: misalhub@gmail.com)', 'Accept-Language': 'en' };

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  return res.json();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One search query -> coordinates. Google if a key is configured, otherwise OpenStreetMap (much weaker for Indian addresses). */
async function geocodeOne(address: string): Promise<Geocoded | null> {
  const b = BOX();
  const key = env.googleKey();
  if (key) {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json?' + new URLSearchParams({
      address, key, region: 'in', components: 'country:IN',
      bounds: `${b.south},${b.west}|${b.north},${b.east}`,
    });
    const j = await getJson(url);
    if (j.status && !['OK', 'ZERO_RESULTS'].includes(j.status)) console.error('[geocode] Google status', j.status, j.error_message || '');
    const r = j.results?.[0];
    return r ? { lat: r.geometry.location.lat, lng: r.geometry.location.lng, label: r.formatted_address } : null;
  }
  const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
    format: 'jsonv2', limit: '1', countrycodes: 'in', q: address,
    viewbox: `${b.west},${b.north},${b.east},${b.south}`, bounded: '0',
  });
  const j = await getJson(url, { headers: OSM_HEADERS });
  const r = j?.[0];
  return r ? { lat: Number(r.lat), lng: Number(r.lon), label: r.display_name } : null;
}

/**
 * Address text -> coordinates, trying the full address first and then simpler versions of it
 * (see lib/addressQueries.ts). OpenStreetMap allows ~1 request per second, so those retries are spaced out.
 */
export async function geocode(address: string): Promise<GeocodedAddress | null> {
  const usingGoogle = !!env.googleKey();
  const queries = addressQueries(address, usingGoogle ? 4 : 4);
  for (let i = 0; i < queries.length; i++) {
    if (i > 0 && !usingGoogle) await sleep(1100);
    const g = await geocodeOne(queries[i].q);
    if (g) return { ...g, approx: queries[i].approx, matched: queries[i].q };
  }
  return null;
}
/** Coordinates -> a readable address (for "use my location"). */
export async function reverseGeocode(p: LatLng): Promise<string> {
  try {
    const key = env.googleKey();
    if (key) {
      const j = await getJson('https://maps.googleapis.com/maps/api/geocode/json?' + new URLSearchParams({ latlng: `${p.lat},${p.lng}`, key }));
      return j.results?.[0]?.formatted_address || '';
    }
    const j = await getJson('https://nominatim.openstreetmap.org/reverse?' + new URLSearchParams({ format: 'jsonv2', lat: String(p.lat), lon: String(p.lng) }), { headers: OSM_HEADERS });
    return j?.display_name || '';
  } catch {
    return '';
  }
}

const haversineKm = (a: LatLng, b: LatLng) => {
  const R = 6371, rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Driving distance in km from the shop. Google Routes if a key exists, else OSRM (public demo server),
 * else straight-line x 1.3 as a last resort so a customer is never stuck on a map outage.
 */
export async function drivingKm(to: LatLng): Promise<{ km: number; source: 'google' | 'osrm' | 'estimate' }> {
  const from = shopPoint();
  const key = env.googleKey();
  if (key) {
    try {
      const j = await getJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'routes.distanceMeters' },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
          destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
          travelMode: 'DRIVE',
        }),
      });
      const m = j.routes?.[0]?.distanceMeters;
      if (typeof m === 'number') return { km: m / 1000, source: 'google' };
    } catch { /* fall through */ }
  }
  try {
    const j = await getJson(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`, { headers: OSM_HEADERS });
    const m = j.routes?.[0]?.distance;
    if (typeof m === 'number') return { km: m / 1000, source: 'osrm' };
  } catch { /* fall through */ }
  return { km: haversineKm(from, to) * 1.3, source: 'estimate' };
}
