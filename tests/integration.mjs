/**
 * End-to-end test of the money path against the REAL Next.js server (run `npm run build` first).
 * Razorpay and the Google Apps Script are replaced by local stand-ins, so nothing real is charged or e-mailed.
 *   npm run test:integration
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SECRET = 'rzp_test_secret_xyz', WEBHOOK = 'whsec_test', SCRIPT_SECRET = 'script-secret-abc';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`); };

/* ---------- stand-ins ---------- */
const rzpOrders = [];           // what our server asked Razorpay to create
const sheetEvents = [];         // what our server sent to the Apps Script
const mk = (handler, port) => new Promise((res) => { const s = http.createServer(handler).listen(port, '127.0.0.1', () => res(s)); });
const readBody = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });

const rzp = await mk(async (req, res) => {
  const body = JSON.parse((await readBody(req)) || '{}');
  const auth = Buffer.from((req.headers.authorization || '').replace('Basic ', ''), 'base64').toString();
  if (auth !== `rzp_test_key:${SECRET}`) { res.writeHead(401); return res.end('{"error":"bad auth"}'); }
  const o = { id: `order_${rzpOrders.length + 1}TEST`, amount: body.amount, currency: body.currency, receipt: body.receipt };
  rzpOrders.push({ ...o, notes: body.notes });
  res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o));
}, 4010);
const script = await mk(async (req, res) => {
  const body = JSON.parse((await readBody(req)) || '{}');
  if (body.secret !== SCRIPT_SECRET) { res.writeHead(200); return res.end('{"ok":false,"error":"unauthorized"}'); }
  sheetEvents.push(body);
  res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}');
}, 4011);

/* ---------- real server ---------- */
function startServer(port, env) {
  const p = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '-p', String(port)], {
    cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  p.stderr.on('data', () => {}); p.stdout.on('data', () => {});
  return p;
}
async function waitFor(port) { for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/api/franchise`, { method: 'POST', body: '{}' }); return; } catch { await sleep(500); } } throw new Error('server did not start'); }

const FULL = {
  RAZORPAY_KEY_ID: 'rzp_test_key', RAZORPAY_KEY_SECRET: SECRET, RAZORPAY_WEBHOOK_SECRET: WEBHOOK,
  RAZORPAY_API_BASE: 'http://127.0.0.1:4010', APPS_SCRIPT_URL: 'http://127.0.0.1:4011/exec', APPS_SCRIPT_SECRET: SCRIPT_SECRET,
  ORDERS_IGNORE_HOURS: '1', SHOP_LATLNG: '19.2892,72.85905',
};
const A = startServer(3200, FULL);                                                     // everything configured
const B = startServer(3201, { RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', APPS_SCRIPT_URL: '', ORDERS_IGNORE_HOURS: '1' }); // nothing configured
const C = startServer(3202, { ...FULL, ORDERS_IGNORE_HOURS: '' });                    // real opening hours enforced
const D = startServer(3203, { RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', APPS_SCRIPT_URL: 'http://127.0.0.1:4011/exec', APPS_SCRIPT_SECRET: SCRIPT_SECRET, ORDERS_TEST_MODE: '1', ORDERS_IGNORE_HOURS: '' }); // TEST MODE: no payment keys
const E = startServer(3204, { ...FULL, ORDERS_TEST_MODE: '1' });                      // TEST MODE flag set but real keys present
await Promise.all([waitFor(3200), waitFor(3201), waitFor(3202), waitFor(3203), waitFor(3204)]);

const post = async (port, url, body, headers = {}) => {
  const r = await fetch(`http://127.0.0.1:${port}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const customer = { name: 'Asha Test', phone: '+91 98765 43210', email: 'asha@example.com' };
const NEAR = { lat: 19.2933, lng: 72.85905 };   // ~0.5 km north of the shop
const MID = { lat: 19.2700, lng: 72.8900 };     // Ghodbunder Road: about 5 km by road
const FAR = { lat: 19.4692, lng: 72.85905 };    // ~20 km north
const near = async (extra) => (await post(3200, '/api/delivery/quote', { ...NEAR, ...extra })).json;

try {
  /* ----- delivery quotes (distance comes from the routing service; fee rules are checked exactly in the unit tests) ----- */
  let q = await near({ subtotal: 300 });
  ok('quote: ~0.5 km, order ₹300 (above ₹250) -> free delivery', q.ok && q.deliverable && q.free && q.fee === 0, `${q.distanceKm} km via ${q.source}`);
  q = await near({ subtotal: 100 });
  ok('quote: ~0.5 km, order ₹100 -> pays the ₹30 minimum (not free)', q.ok && !q.free && q.fee === 30, `fee ₹${q.fee}`);
  q = (await post(3200, '/api/delivery/quote', { ...MID, subtotal: 500 })).json;
  ok('quote: ~5 km -> never free, ₹4/km with the ₹30 minimum', q.ok && q.deliverable && !q.free && q.fee === Math.max(30, Math.round(q.distanceKm * 4)) && q.distanceKm >= 4 && q.distanceKm <= 8, `${q.distanceKm} km -> ₹${q.fee}`);
  q = (await post(3200, '/api/delivery/quote', { ...FAR, subtotal: 500 })).json;
  ok('quote: ~20 km -> not deliverable', q.ok && q.deliverable === false, q.message);
  const real = (await post(3200, '/api/delivery/quote', { address: 'A/504 , Ankur Enclave , Vijay Park , Opp Tokyo Tower , Near GN Residency .', subtotal: 300 })).json;
  ok('quote: the long real address (flat no. + building + Opp/Near landmarks) is now found by area', real.ok && real.approx === true && /Vijay Park/i.test(real.label) && real.deliverable, JSON.stringify({ label: real.label, km: real.distanceKm, fee: real.fee, err: real.error }));
  ok('quote: junk input rejected', (await post(3200, '/api/delivery/quote', { lat: 'x', lng: 5 })).status === 400);

  /* ----- creating an order ----- */
  let r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 2, price: 1 }], customer, type: 'Pickup' });
  ok('create (pickup): total comes from the MENU, not the browser (2 × ₹90 = ₹180)', r.json.ok && r.json.totals.total === 180 && rzpOrders.at(-1)?.amount === 18000, JSON.stringify(r.json.totals));
  const ev = sheetEvents.find((e) => e.action === 'order_created' && e.razorpayOrderId === r.json.razorpay?.orderId);
  ok('create: unpaid order recorded in the Sheet with items, phone, total', ev && ev.status === 'Awaiting payment' && ev.total === 180 && ev.customer.phone === '9876543210' && ev.items[0].qty === 2);
  ok('create: Razorpay key id (never the secret) is returned', r.json.razorpay.key === 'rzp_test_key' && !JSON.stringify(r.json).includes(SECRET));

  r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Delivery', address: 'Flat 4, Silver Cassia, Mira Road East', ...NEAR });
  ok('create (delivery, ₹90 near): pays the ₹30 minimum', r.json.ok && r.json.totals.deliveryFee === 30 && r.json.totals.total === 120 && rzpOrders.at(-1).amount === (90 + r.json.totals.deliveryFee) * 100, JSON.stringify(r.json.totals));

  r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-thali', mode: 'regular', qty: 2 }], customer, type: 'Delivery', address: 'Flat 4, Silver Cassia, Mira Road East', ...NEAR });
  ok('create (delivery, ₹340 near): FREE delivery, total ₹340', r.json.ok && r.json.totals.deliveryFee === 0 && r.json.totals.total === 340, JSON.stringify(r.json.totals));

  r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-thali', mode: 'regular', qty: 1 }], customer, type: 'Delivery', address: 'Somewhere very far away 123', ...FAR });
  ok('create: address beyond 10 km refused (422), no payment order made', r.status === 422 && !r.json.ok, r.json.error);
  const before = rzpOrders.length;
  r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-thali', mode: 'regular', qty: 1 }], customer, type: 'Delivery', address: 'Flat 4, Silver Cassia, Mira Road East' });
  ok('create: delivery without a checked location refused (400)', r.status === 400 && rzpOrders.length === before);

  const bad = [
    ['unknown dish', [{ id: 'nope', mode: 'regular', qty: 1 }]],
    ['seasonal dish', [{ id: 'aamras-vati', mode: 'regular', qty: 1 }]],
    ['non-Jain dish on the Jain menu', [{ id: 'vada-misal-pav', mode: 'jain', qty: 1 }]],
    ['absurd quantity', [{ id: 'misal-pav', mode: 'regular', qty: 999 }]],
    ['empty cart', []],
  ];
  for (const [label, items] of bad) {
    const n = rzpOrders.length;
    const x = await post(3200, '/api/checkout/create', { items, customer, type: 'Pickup' });
    ok(`create rejects ${label}`, x.status === 400 && rzpOrders.length === n, x.json.error);
  }
  r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer: { ...customer, phone: '12345' }, type: 'Pickup' });
  ok('create rejects a bad phone number', r.status === 400);

  /* ----- payment confirmation ----- */
  const created = (await post(3200, '/api/checkout/create', { items: [{ id: 'chaas', mode: 'regular', qty: 1 }], customer, type: 'Pickup' })).json;
  const orderId = created.razorpay.orderId, payId = 'pay_TEST123';
  sheetEvents.length = 0;
  r = await post(3200, '/api/checkout/verify', { razorpay_order_id: orderId, razorpay_payment_id: payId, razorpay_signature: 'f'.repeat(64), ref: created.ref });
  ok('verify: forged signature rejected, shop NOT told it is paid', r.status === 400 && !sheetEvents.some((e) => e.action === 'order_paid'));
  const sig = createHmac('sha256', SECRET).update(`${orderId}|${payId}`).digest('hex');
  r = await post(3200, '/api/checkout/verify', { razorpay_order_id: orderId, razorpay_payment_id: payId, razorpay_signature: sig, ref: created.ref });
  ok('verify: genuine signature accepted, Sheet told "paid"', r.json.ok && sheetEvents.some((e) => e.action === 'order_paid' && e.razorpayOrderId === orderId && e.paymentId === payId));

  /* ----- webhook safety net ----- */
  const wb = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_WH1', order_id: 'order_WEBHOOK' } } } });
  sheetEvents.length = 0;
  r = await post(3200, '/api/razorpay/webhook', wb, { 'x-razorpay-signature': 'bad' });
  ok('webhook: wrong signature rejected', r.status === 400 && sheetEvents.length === 0);
  r = await post(3200, '/api/razorpay/webhook', wb, { 'x-razorpay-signature': createHmac('sha256', WEBHOOK).update(wb).digest('hex') });
  ok('webhook: genuine event marks the order paid', r.json.ok && sheetEvents.some((e) => e.action === 'order_paid' && e.razorpayOrderId === 'order_WEBHOOK' && e.paymentId === 'pay_WH1'));

  /* ----- franchise application ----- */
  const app = { name: 'Asha Test', phone: '9876543210', email: 'asha@example.com', city: 'Pune', date: '2026-11-05', hh: '11', mm: '30', ap: 'AM', message: 'Two outlets in Pune' };
  sheetEvents.length = 0;
  r = await post(3200, '/api/franchise', app);
  const fe = sheetEvents.find((e) => e.action === 'franchise');
  ok('franchise: saved to the Sheet with every field', r.json.ok && fe && fe.city === 'Pune' && fe.callTime === '11:30 AM' && fe.email === 'asha@example.com' && fe.message === 'Two outlets in Pune');
  sheetEvents.length = 0;
  r = await post(3200, '/api/franchise', { ...app, website: 'http://spam.example' });
  ok('franchise: spam-trap (honeypot) filled -> silently dropped', r.json.ok && sheetEvents.length === 0);
  ok('franchise: bad phone rejected', (await post(3200, '/api/franchise', { ...app, phone: '123' })).status === 400);
  ok('franchise: bad email rejected', (await post(3200, '/api/franchise', { ...app, email: 'nope' })).status === 400);

  /* ----- not configured yet / closed ----- */
  r = await post(3201, '/api/checkout/create', { items: [{ id: 'chaas', mode: 'regular', qty: 1 }], customer, type: 'Pickup' });
  ok('unconfigured server: checkout says "being set up" (503), no crash', r.status === 503 && r.json.code === 'not_configured');
  r = await post(3201, '/api/franchise', app);
  ok('unconfigured server: franchise form says unavailable (503) with the phone number', r.status === 503 && /90041 67448/.test(r.json.error));

  const istHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).format(new Date())) % 24;
  const openNow = istHour >= 8 && istHour < 20;
  r = await post(3202, '/api/checkout/create', { items: [{ id: 'chaas', mode: 'regular', qty: 1 }], customer, type: 'Pickup' });
  ok(`opening hours enforced on the server (it is ${openNow ? 'open' : 'closed'} in India now)`, openNow ? r.json.ok === true : (r.status === 409 && r.json.code === 'closed'), `status ${r.status}`);

  /* ----- TEST MODE (no payment keys yet): orders still land in the Sheet, clearly marked ----- */
  sheetEvents.length = 0;
  r = await post(3203, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Pickup', notes: 'less spicy' });
  const tc = sheetEvents.find((e) => e.action === 'order_created'), tp = sheetEvents.find((e) => e.action === 'order_paid');
  ok('test mode: order accepted without payment, reference starts with TEST-, even outside opening hours', r.json.ok && r.json.demo === true && /^TEST-MH/.test(r.json.ref) && !r.json.razorpay, JSON.stringify(r.json).slice(0, 120));
  ok('test mode: Sheet gets the row + the "paid" event (so the e-mail is sent) and the note says TEST ORDER', tc && tp && /TEST ORDER/.test(tc.notes) && /less spicy/.test(tc.notes) && tc.total === 90 && tp.razorpayOrderId === tc.razorpayOrderId);
  r = await post(3204, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Pickup' });
  ok('test mode flag can NEVER bypass payment once real Razorpay keys exist', r.json.ok && !r.json.demo && r.json.razorpay?.orderId);

  /* ----- rate limiting ----- */
  let limited = 0;
  for (let i = 0; i < 8; i++) { const x = await post(3200, '/api/franchise', { ...app, phone: '123' }); if (x.status === 429) limited++; }
  ok('franchise endpoint is rate limited against abuse', limited > 0, `${limited} of 8 blocked`);
} finally {
  [A, B, C, D, E].forEach((p) => p.kill());
  rzp.close(); script.close();
}
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
