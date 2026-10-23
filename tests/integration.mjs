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
const sheetEvents = [];
const promoUsed = new Set();
const sentCodes = new Map(), customers = new Map();   // stand-ins for the Customers tab + the e-mails the script sends    // stand-in for the Sheet: phone|code already used         // what our server sent to the Apps Script
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
  if (req.method === 'GET') {                                   // read-only requests (order tracking)
    const u = new URL(req.url, 'http://x');
    res.setHeader('Content-Type', 'application/json');
    if (u.searchParams.get('secret') !== SCRIPT_SECRET) return res.end('{"ok":false,"error":"unauthorized"}');
    if (u.searchParams.get('action') === 'track') {
      const okOrder = u.searchParams.get('ref') === 'MH-TEST-1' && u.searchParams.get('phone') === '9820145678';
      return res.end(JSON.stringify(okOrder ? { ok: true, progress: 'Out for delivery', items: '2 x Misal Pav - Rs 180', total: 230, type: 'Delivery', address: 'Flat 4, Silver Cassia', etaAt: 1790000000000, etaMin: 40, note: 'Rain, a little late', serverNow: 1789999000000, secretLeak: 'x' } : { ok: false, error: 'not found' }));
    }
    const em = u.searchParams.get('email');
    const live = { ok: true, ref: 'MH-LIVE-9', progress: 'Preparing', items: '1 x Misal Pav - Rs 90', total: 140, type: 'Pickup', address: '', etaAt: 1790000000000, etaMin: 20, note: '', serverNow: 1789999000000, createdAt: 1789998000000, subtotal: 150, fee: 0, discount: 10, promo: 'MISAL10', paymentId: 'pay_ABC123', secretLeak: 'x' };
    const live2 = { ...live, ref: 'MH-LIVE-10', progress: 'Out for delivery', type: 'Delivery', address: 'Flat 4, Silver Cassia', total: 230, fee: 50, discount: 0, promo: '', paymentId: 'pay_DEF456' };
    const old = { ...live, ref: 'MH-OLD-1', progress: 'Delivered', createdAt: 1789000000000, paymentId: 'pay_OLD001' };
    if (u.searchParams.get('action') === 'active_orders') return res.end(JSON.stringify(em === 'tracker@example.com' ? { ok: true, orders: [live, live2], serverNow: 1789999000000 } : { ok: true, orders: [] }));
    if (u.searchParams.get('action') === 'my_orders') return res.end(JSON.stringify(em === 'tracker@example.com' ? { ok: true, orders: [live, live2, old], serverNow: 1789999000000 } : { ok: true, orders: [] }));
    return res.end('{"ok":true,"delivery":"YES","pickup":"YES","message":""}');
  }
  const body = JSON.parse((await readBody(req)) || '{}');
  if (body.secret !== SCRIPT_SECRET) { res.writeHead(200); return res.end('{"ok":false,"error":"unauthorized"}'); }
  res.setHeader('Content-Type', 'application/json');
  if (body.action === 'send_code') { sentCodes.set(body.email, body.code); return res.end('{"ok":true}'); }
  if (body.action === 'customer_login') { const c = customers.get(body.email) || { name: body.name || '', phone: '' }; customers.set(body.email, c); return res.end(JSON.stringify({ ok: true, name: c.name, phone: c.phone })); }
  if (body.action === 'customer_save') { customers.set(body.email, { name: body.name, phone: body.phone }); return res.end('{"ok":true}'); }
  if (body.action === 'promo_check') return res.end(JSON.stringify({ ok: true, used: promoUsed.has(`${body.phone}|${body.code}`) || promoUsed.has(`${body.email}|${body.code}`) }));
  if (body.action === 'order_created' && body.customer?.name === 'Sheet Down') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":false,"error":"boom"}'); }   // the Sheet refuses to record this order
  if (body.action === 'order_created' && body.promo) {
    const k = `${body.customer.phone}|${body.promo}`, k2 = `${body.customer.email}|${body.promo}`;
    if (promoUsed.has(k) || promoUsed.has(k2)) return res.end('{"ok":false,"error":"promo_used"}');
    promoUsed.add(k); promoUsed.add(k2);
  }
  sheetEvents.push(body);
  res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}');
}, 4011);

const scriptPaused = await mk(async (req, res) => {   // a Sheet whose Settings tab says: Pickup = NO, message set
  if (req.method === 'POST') {                                    // it also signs people in (codes + accounts)
    const body = JSON.parse((await readBody(req)) || '{}');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (body.secret !== SCRIPT_SECRET) return res.end('{"ok":false,"error":"unauthorized"}');
    if (body.action === 'send_code') { sentCodes.set(body.email, body.code); return res.end('{"ok":true}'); }
    if (body.action === 'customer_login') { const c = customers.get(body.email) || { name: body.name || '', phone: '' }; customers.set(body.email, c); return res.end(JSON.stringify({ ok: true, name: c.name, phone: c.phone })); }
    if (body.action === 'customer_save') { customers.set(body.email, { name: body.name, phone: body.phone }); return res.end('{"ok":true}'); }
    return res.end('{"ok":true}');
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(req.url.includes(`secret=${SCRIPT_SECRET}`) ? { ok: true, delivery: 'YES', pickup: 'NO', message: 'Closed today', soldOut: [{ id: 'chaas', note: 'Back at 4 PM' }, { id: 'misal-thali', note: '' }] } : { ok: false, error: 'unauthorized' }));
}, 4012);

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
const F = startServer(3205, { ...FULL, ORDERS_DELIVERY_PAUSED: '1' });                // owner paused delivery (Vercel override)
const H = startServer(3207, FULL);                                                     // promo-code tests (own server: separate rate limit)
const I = startServer(3208, FULL);                                                     // sign-in / account tests (own rate limit)
const G = startServer(3206, { ...FULL, APPS_SCRIPT_URL: 'http://127.0.0.1:4012/exec' }); // owner paused pickup via the Sheet's Settings tab
await Promise.all([waitFor(3200), waitFor(3201), waitFor(3202), waitFor(3203), waitFor(3204), waitFor(3205), waitFor(3206), waitFor(3207), waitFor(3208)]);

const jars = new Map();
const cookieOf = (r, old = '') => { const sc = r.headers.getSetCookie?.() || []; const m = sc.map((c) => c.split(';')[0]).find((c) => c.startsWith('mh_session=')); return m ?? old; };
/** real sign-in: ask for a code, read it from the stand-in mailbox, verify, then save name + phone. Returns the session cookie. */
async function signIn(port, email, phone = '9820145678', name = 'Test Customer') {
  const k = `${port}|${email}`;
  if (jars.has(k)) return jars.get(k);
  const call = (path, body, cookie = '') => fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  const st = await (await call('/api/auth/email/start', { email })).json();
  const v = await call('/api/auth/email/verify', { email, code: sentCodes.get(email), challenge: st.challenge });
  let cookie = cookieOf(v);
  const vj = await v.json();
  if (vj.needsProfile) { const p = await call('/api/auth/profile', { name, phone }, cookie); cookie = cookieOf(p, cookie); }
  jars.set(k, cookie); return cookie;
}
const post = async (port, url, body, headers = {}) => {
  if (!headers.cookie && headers.cookie !== '' && (url === '/api/checkout/create' || url === '/api/promo/check') && typeof body === 'object') {
    const ph = String(body.customer?.phone ?? body.phone ?? '').replace(/\D/g, '').slice(-10) || '9820145678';
    const usable = ph.length === 10 && /^[6-9]/.test(ph) && !/^(9999999999|9876543210)$/.test(ph);
    const who = usable ? ph : '9820145678';
    headers = { ...headers, cookie: await signIn(port, `u${who}@example.com`, who) };
  }
  const r = await fetch(`http://127.0.0.1:${port}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const customer = { name: 'Asha Test', phone: '+91 98201 45678', email: 'asha@example.com' };
const NEAR = { lat: 19.2933, lng: 72.85905 };   // ~0.5 km north of the shop
const MID = { lat: 19.3092, lng: 72.85905 };    // ~2.2 km north (a few km by road)
const FAR = { lat: 19.4692, lng: 72.85905 };    // ~20 km north
const near = async (extra) => (await post(3200, '/api/delivery/quote', { ...NEAR, ...extra })).json;

try {
  /* ----- delivery quotes (distance comes from the routing service; fee rules are checked exactly in the unit tests) ----- */
  let q = await near({ subtotal: 300 });
  ok('quote: ~0.5 km -> ₹50 (up to 1 km)', q.ok && q.deliverable && q.fee === 50 && q.distanceKm <= 1, `${q.distanceKm} km via ${q.source}`);
  q = await near({ subtotal: 100 });
  ok('quote: ~0.5 km, small order -> still ₹50 (no free delivery)', q.ok && q.fee === 50, `fee ₹${q.fee}`);
  q = (await post(3200, '/api/delivery/quote', { ...MID, subtotal: 500 })).json;
  ok('quote: a few km out -> ₹80 (beyond 1 km, within 5 km)', q.ok && q.deliverable && q.fee === 80 && q.distanceKm > 1 && q.distanceKm <= 5, `${q.distanceKm} km -> ₹${q.fee}`);
  q = (await post(3200, '/api/delivery/quote', { ...FAR, subtotal: 500 })).json;
  ok('quote: ~20 km -> not deliverable', q.ok && q.deliverable === false, q.message);
  const real = (await post(3200, '/api/delivery/quote', { address: 'A/504 , Ankur Enclave , Vijay Park , Opp Tokyo Tower , Near GN Residency .', subtotal: 300 })).json;
  ok('quote: the long real address (flat no. + building + Opp/Near landmarks) is now found by area', real.ok && real.approx === true && /Vijay Park/i.test(real.label) && real.deliverable, JSON.stringify({ label: real.label, km: real.distanceKm, fee: real.fee, err: real.error }));
  ok('quote: junk input rejected', (await post(3200, '/api/delivery/quote', { lat: 'x', lng: 5 })).status === 400);

  /* ----- creating an order ----- */
  let r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 2, price: 1 }], customer, type: 'Pickup' });
  ok('create (pickup): total comes from the MENU, not the browser (2 × ₹90 = ₹180)', r.json.ok && r.json.totals.total === 180 && rzpOrders.at(-1)?.amount === 18000, JSON.stringify(r.json.totals));
  const ev = sheetEvents.find((e) => e.action === 'order_created' && e.razorpayOrderId === r.json.razorpay?.orderId);
  ok('create: unpaid order recorded in the Sheet with items, phone, total', ev && ev.status === 'Awaiting payment' && ev.total === 180 && ev.customer.phone === '9820145678' && ev.items[0].qty === 2);
  ok('create: Razorpay key id (never the secret) is returned', r.json.razorpay.key === 'rzp_test_key' && !JSON.stringify(r.json).includes(SECRET));

  r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Delivery', address: 'Flat 4, Silver Cassia, Mira Road East', ...NEAR });
  ok('create (delivery, ₹90 near): pays the ₹50 delivery fee', r.json.ok && r.json.totals.deliveryFee === 50 && r.json.totals.total === 140 && rzpOrders.at(-1).amount === (90 + r.json.totals.deliveryFee) * 100, JSON.stringify(r.json.totals));

  r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-thali', mode: 'regular', qty: 2 }], customer, type: 'Delivery', address: 'Flat 4, Silver Cassia, Mira Road East', ...NEAR });
  ok('create (delivery, ₹340 near): ₹50 delivery on top, total ₹390 (no free delivery)', r.json.ok && r.json.totals.deliveryFee === 50 && r.json.totals.total === 390, JSON.stringify(r.json.totals));

  r = await post(3200, '/api/checkout/create', { items: [{ id: 'misal-thali', mode: 'regular', qty: 1 }], customer, type: 'Delivery', address: 'Somewhere very far away 123', ...FAR });
  ok('create: address beyond 5 km refused (422), no payment order made', r.status === 422 && !r.json.ok, r.json.error);
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
  const app = { name: 'Asha Test', phone: '9820145678', email: 'asha@example.com', city: 'Pune', message: 'Two outlets in Pune' };
  sheetEvents.length = 0;
  r = await post(3200, '/api/franchise', app);
  const fe = sheetEvents.find((e) => e.action === 'franchise');
  ok('franchise: saved to the Sheet with every field', r.json.ok && fe && fe.city === 'Pune' && fe.email === 'asha@example.com' && fe.message === 'Two outlets in Pune');
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

  /* ----- first-order offer MISAL10: open to everyone, 10% off, once per phone number ----- */
  const P1 = { ...customer, phone: '9811122233' }, P2 = { ...customer, phone: '9822233344' };
  const misal = [{ id: 'misal-pav', mode: 'regular', qty: 1 }];
  let before2 = rzpOrders.length;
  r = await post(3207, '/api/checkout/create', { items: misal, customer: P1, type: 'Pickup', promo: 'misal10', src: 'card' });
  const pe = sheetEvents.filter((e) => e.action === 'order_created').at(-1);
  ok('promo: anyone can use it on a first order -> ₹9 off ₹90 (total ₹81), Razorpay is asked for ₹81', r.json.ok && r.json.totals.discount === 9 && r.json.totals.total === 81 && rzpOrders.at(-1).amount === 8100, JSON.stringify(r.json.totals));
  ok('the Sheet row carries the code, discount and where it came from (card)', pe && pe.promo === 'MISAL10' && pe.discount === 9 && pe.source === 'card' && pe.total === 81);
  before2 = rzpOrders.length;
  r = await post(3207, '/api/checkout/create', { items: misal, customer: P1, type: 'Pickup', promo: 'MISAL10' });
  ok('SAME phone again -> offer removed (409 promo_used, friendly message), no payment order created', r.status === 409 && r.json.code === 'promo_used' && rzpOrders.length === before2, r.json.error);
  r = await post(3207, '/api/checkout/create', { items: misal, customer: P1, type: 'Pickup' });
  ok('same phone can still order at the normal price (₹90)', r.json.ok && r.json.totals.total === 90 && r.json.totals.discount === 0);
  r = await post(3207, '/api/checkout/create', { items: misal, customer: P2, type: 'Pickup', promo: 'MISAL10' });
  ok('a different phone gets the offer', r.json.ok && r.json.totals.discount === 9);
  r = await post(3207, '/api/checkout/create', { items: [{ id: 'misal-thali', mode: 'regular', qty: 4 }], customer: { ...customer, phone: '9833344455' }, type: 'Pickup', promo: 'MISAL10' });
  ok('no cap, flat 10% on a big order (₹680 -> ₹68 off -> ₹612)', r.json.ok && r.json.totals.discount === 68 && r.json.totals.total === 612, JSON.stringify(r.json.totals));
  r = await post(3207, '/api/checkout/create', { items: misal, customer: { ...customer, phone: '9844455566' }, type: 'Pickup', promo: 'FREE100' });
  ok('unknown code rejected (400)', r.status === 400 && !r.json.ok);
  r = await post(3207, '/api/checkout/create', { items: misal, customer: { ...customer, phone: '9999999999' }, type: 'Pickup' });
  ok('made-up phone number (9999999999) refused (400)', r.status === 400 && /mobile number/i.test(r.json.error), r.json.error);
  r = await post(3207, '/api/checkout/create', { items: misal, customer: { ...customer, phone: '9876543210' }, type: 'Pickup' });
  ok('made-up phone number (9876543210) refused (400)', r.status === 400);
  r = await post(3207, '/api/promo/check', { code: 'MISAL10', phone: '9855566677' });
  ok('offer picker check: fresh phone -> ok', r.json.ok === true && r.json.code === 'MISAL10');
  r = await post(3207, '/api/promo/check', { code: 'MISAL10', phone: '9811122233' });
  ok('offer picker check: used phone -> 409 promo_used', r.status === 409 && r.json.code === 'promo_used');
  r = await post(3207, '/api/promo/check', { code: 'MISAL10' });
  ok('offer picker check: no phone -> asks for it (400)', r.status === 400 && r.json.code === 'need_phone');
  r = await post(3207, '/api/promo/check', { code: 'NOPE', phone: '9855566677' });
  ok('offer picker check: bad code -> 404', r.status === 404);

  /* ----- bulk / party order enquiry ----- */
  const future = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
  const bulkBody = { name: 'Asha Rao', phone: '98201 45678', email: 'asha@example.com', occasion: 'Birthday party', date: future, time: '18:30', people: '25 – 50 people',
    details: '40 Misal Pav, 20 Vada Pav', special: '10 Jain plates', cutlery: 'Yes, please send plates & cutlery', budget: '8000', type: 'Delivery', address: 'Flat 4, Silver Cassia, Mira Road East, near Gayatri Dham', notes: '' };
  sheetEvents.length = 0;
  r = await post(3200, '/api/bulk', bulkBody);
  const be = sheetEvents.find((e) => e.action === 'bulk');
  ok('bulk: request saved to the Sheet with every detail (time, people, order, Jain, address)', r.json.ok && be && be.time === '18:30' && be.people === '25 – 50 people' && be.phone === '9820145678' && /Misal Pav/.test(be.details) && be.special === '10 Jain plates' && /Silver Cassia/.test(be.address));
  r = await post(3200, '/api/bulk', { ...bulkBody, time: '' });
  ok('bulk: missing time refused (400)', r.status === 400 && /time/i.test(r.json.error));
  r = await post(3200, '/api/bulk', { ...bulkBody, date: '2020-01-01' });
  ok('bulk: a past date refused (400)', r.status === 400);
  sheetEvents.length = 0;
  r = await post(3200, '/api/bulk', { ...bulkBody, website: 'http://spam.example' });
  ok('bulk: spam-trap filled -> silently dropped', r.json.ok && sheetEvents.length === 0);
  r = await post(3201, '/api/bulk', bulkBody);
  ok('bulk: unconfigured server says unavailable (503) with the phone number', r.status === 503 && /90041 67448/.test(r.json.error));

  /* ----- order tracking ----- */
  r = await post(3200, '/api/track', { ref: 'mh-test-1', phone: '+91 98201 45678' });
  ok('track: right reference + phone -> status, items, total, ETA and the shop note', r.json.ok && r.json.order.progress === 'Out for delivery' && r.json.order.total === 230 && r.json.order.etaAt === 1790000000000 && r.json.order.etaMin === 40 && r.json.order.note === 'Rain, a little late' && /Misal Pav/.test(r.json.order.items), JSON.stringify(r.json).slice(0, 100));
  ok('track: nothing internal leaks (no extra fields)', !('secretLeak' in (r.json.order || {})) && !JSON.stringify(r.json).includes('secretLeak'));
  r = await post(3200, '/api/track', { ref: 'MH-TEST-1', phone: '9811122233' });
  ok('track: wrong phone -> not found (404)', r.status === 404);
  r = await post(3200, '/api/track', { ref: 'MH-NOPE', phone: '9820145678' });
  ok('track: unknown reference -> not found (404)', r.status === 404);
  r = await post(3200, '/api/track', {});
  ok('track: empty request -> 404, no crash', r.status === 404);

  /* ----- sign-in (accounts) ----- */
  const get = async (port, url, cookie = '') => { const r = await fetch(`http://127.0.0.1:${port}${url}`, { headers: cookie ? { cookie } : {} }); return { status: r.status, json: await r.json().catch(() => ({})) }; };
  r = await post(3208, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Pickup' }, { cookie: '' });
  ok('sign-in required: ordering without being signed in -> 401 "signin"', r.status === 401 && r.json.code === 'signin');
  r = await get(3208, '/api/auth/me');
  ok('me: nobody signed in -> user null, e-mail sign-in available', r.json.user === null && r.json.available === true);
  const em = 'new.customer@example.com';
  const startR = await fetch('http://127.0.0.1:3208/api/auth/email/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: em }) });
  const start = await startR.json();
  ok('e-mail code: a 6-digit code was e-mailed, and the code is NEVER in the website answer', start.ok && /^\d{6}$/.test(sentCodes.get(em) || '') && !JSON.stringify(start).includes(sentCodes.get(em)));
  const callA = (path, body, cookie = '') => fetch(`http://127.0.0.1:3208${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  let vr = await callA('/api/auth/email/verify', { email: em, code: '000000', challenge: start.challenge });
  ok('wrong code -> refused (400)', vr.status === 400 && !cookieOf(vr));
  vr = await callA('/api/auth/email/verify', { email: 'other@example.com', code: sentCodes.get(em), challenge: start.challenge });
  ok('the code only works for the e-mail it was sent to', vr.status === 400);
  vr = await callA('/api/auth/email/verify', { email: em, code: sentCodes.get(em), challenge: start.challenge });
  const vj = await vr.json(); const ck = cookieOf(vr);
  ok('right code -> signed in (cookie), first time asks for name + mobile', vj.ok && ck.startsWith('mh_session=') && vj.needsProfile === true && vj.user.email === em);
  r = await get(3208, '/api/auth/me', ck);
  ok('me: shows the account', r.json.user?.email === em && r.json.user.phone === '');
  r = await post(3208, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Pickup' }, { cookie: ck });
  ok('order is allowed with a session', r.json.ok === true);
  let pr = await callA('/api/auth/profile', { name: 'Asha', phone: '9999999999' }, ck);
  ok('profile: a made-up mobile number is refused (400)', pr.status === 400);
  pr = await callA('/api/auth/profile', { name: 'A', phone: '9820145678' }, ck);
  ok('profile: a missing / too-short name is refused (400)', pr.status === 400);
  pr = await callA('/api/auth/profile', { name: 'Asha Rao', phone: '98201 45678' }, ck);
  const ck2 = cookieOf(pr, ck);
  ok('profile saved: name + mobile now on the account', (await pr.json()).ok && customers.get(em)?.phone === '9820145678');
  r = await get(3208, '/api/auth/me', ck2);
  ok('me: name and phone present after saving', r.json.user.name === 'Asha Rao' && r.json.user.phone === '9820145678');
  const again = await (await callA('/api/auth/email/start', { email: em })).json();
  const vr2 = await callA('/api/auth/email/verify', { email: em, code: sentCodes.get(em), challenge: again.challenge });
  const vj2 = await vr2.json();
  ok('signing in again (any device) brings the saved name + mobile back, no questions', vj2.ok && vj2.needsProfile === false && vj2.user.phone === '9820145678');
  r = await get(3208, '/api/auth/me', 'mh_session=eyJlbWFpbCI6ImV2aWxAZXhhbXBsZS5jb20iLCJleHAiOjk5OTk5OTk5OTk5OTl9.forged');
  ok('a forged cookie is not accepted', r.json.user === null);
  await callA('/api/auth/logout', {}, ck2);
  ok('sign-out endpoint works', (await callA('/api/auth/logout', {}, ck2)).status === 200);
  r = await post(3208, '/api/promo/check', { code: 'MISAL10', phone: '9820145678' }, { cookie: '' });
  ok('offer check needs sign-in too (401)', r.status === 401);
  // one offer per ACCOUNT as well as per phone number
  const acct1 = await signIn(3208, 'one.account@example.com', '9870011223');
  r = await post(3208, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer: { ...customer, phone: '9870011223' }, type: 'Pickup', promo: 'MISAL10' }, { cookie: acct1 });
  ok('account: first order with the offer works', r.json.ok && r.json.totals.discount === 9);
  r = await post(3208, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer: { ...customer, phone: '9870044556' }, type: 'Pickup', promo: 'MISAL10' }, { cookie: acct1 });
  ok('account: the SAME account with a DIFFERENT phone number is refused (409 promo_used)', r.status === 409 && r.json.code === 'promo_used');
  // tracking follows the account
  const tr = await signIn(3208, 'tracker@example.com', '9870099887');
  r = await get(3208, '/api/orders/active', tr);
  ok('tracker: the account sees ALL its active orders (two), the first one also as "order"', r.json.orders?.length === 2 && r.json.orders[0].ref === 'MH-LIVE-9' && r.json.orders[1].ref === 'MH-LIVE-10' && r.json.order?.ref === 'MH-LIVE-9' && r.json.orders[0].etaMin === 20);
  ok('tracker: nothing internal leaks (only the known fields)', !JSON.stringify(r.json).includes('secretLeak'));
  r = await get(3208, '/api/orders/mine', tr);
  ok('my orders: history + active with the full bill (items, subtotal, discount, delivery, payment reference)', r.json.ok && r.json.orders.length === 3 && r.json.orders[0].subtotal === 150 && r.json.orders[0].discount === 10 && r.json.orders[0].promo === 'MISAL10' && r.json.orders[1].fee === 50 && r.json.orders[2].paymentId === 'pay_OLD001' && r.json.orders[2].progress === 'Delivered');
  ok('my orders: nothing internal leaks', !JSON.stringify(r.json).includes('secretLeak'));
  r = await get(3208, '/api/orders/mine');
  ok('my orders: signed out -> 401 (sign in first)', r.status === 401);
  r = await get(3208, '/api/orders/mine', await signIn(3208, 'newbie@example.com', '9870077665'));
  ok('my orders: a new account has none', r.json.ok && r.json.orders.length === 0);
  r = await get(3208, '/api/orders/active', await signIn(3208, 'someone.else@example.com', '9870055443'));
  ok('tracker: another account sees nothing', r.json.order === null);
  r = await get(3208, '/api/orders/active');
  ok('tracker: signed out -> nothing', r.json.order === null);

  /* ----- manual pause switch ----- */
  let st = await (await fetch('http://127.0.0.1:3200/api/status')).json();
  ok('status: everything on by default', st.delivery === true && st.pickup === true);
  r = await post(3205, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Delivery', address: 'Flat 4, Silver Cassia, Mira Road East', ...NEAR });
  ok('delivery paused -> delivery order refused (409 paused), no payment order made', r.status === 409 && r.json.code === 'paused' && /paused/i.test(r.json.error) && /Pickup/.test(r.json.error));
  r = await post(3205, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Pickup' });
  ok('delivery paused -> pickup still works', r.json.ok === true);
  st = await (await fetch('http://127.0.0.1:3205/api/status')).json();
  ok('status endpoint reports delivery paused', st.delivery === false && st.pickup === true);
  st = await (await fetch('http://127.0.0.1:3206/api/status')).json();
  ok('Sheet Settings (Pickup = NO, message) is read by the website', st.pickup === false && st.delivery === true && st.message === 'Closed today', JSON.stringify(st));
  r = await post(3206, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Pickup' });
  ok('pickup paused in the Sheet -> pickup order refused with the owner message', r.status === 409 && r.json.code === 'paused' && /Closed today/.test(r.json.error));

  /* ----- out of stock (Menu tab in the Sheet) ----- */
  r = await get(3206, '/api/status');
  ok('status carries the out-of-stock dishes with their notes', r.json.soldOut?.chaas === 'Back at 4 PM' && r.json.soldOut['misal-thali'] === '' && Object.keys(r.json.soldOut).length === 2, JSON.stringify(r.json.soldOut));
  r = await get(3200, '/api/status');
  ok('nothing out of stock by default', r.json.soldOut && Object.keys(r.json.soldOut).length === 0);
  r = await post(3206, '/api/checkout/create', { items: [{ id: 'chaas', mode: 'regular', qty: 1 }, { id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Delivery' });
  ok('ordering an out-of-stock dish is refused by the server (409 soldout), naming it', r.status === 409 && r.json.code === 'soldout' && /Chaas/.test(r.json.error) && /out of stock/i.test(r.json.error) && r.json.ids?.[0] === 'chaas', r.json.error);
  r = await post(3206, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer, type: 'Delivery' });
  ok('in-stock dishes are not affected by the check (fails later, on the address, not on stock)', r.json.code !== 'soldout');

  /* ----- a paid order must never start if the Sheet could not record it ----- */
  r = await post(3205, '/api/checkout/create', { items: [{ id: 'misal-pav', mode: 'regular', qty: 1 }], customer: { ...customer, name: 'Sheet Down' }, type: 'Pickup' });
  ok('order the Sheet could not record: refused with 502, no payment popup data, customer told they were not charged', r.status === 502 && !r.json.razorpay && /not been charged/i.test(r.json.error || ''), JSON.stringify(r.json).slice(0, 160));

  /* ----- rate limiting ----- */
  let limited = 0;
  for (let i = 0; i < 8; i++) { const x = await post(3200, '/api/franchise', { ...app, phone: '123' }); if (x.status === 429) limited++; }
  ok('franchise endpoint is rate limited against abuse', limited > 0, `${limited} of 8 blocked`);
} finally {
  [A, B, C, D, E, F, G, H, I].forEach((p) => p.kill());
  rzp.close(); script.close(); scriptPaused.close();
}
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
