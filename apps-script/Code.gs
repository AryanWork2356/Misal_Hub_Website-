/**
 * MISAL HUB — Google Apps Script: writes orders + franchise applications to this Google Sheet and sends the e-mails.
 *
 * SETUP (once, ~5 minutes) — see docs/SETUP.md for screenshots-level detail
 *   1. Create a Google Sheet (any name). Extensions -> Apps Script. Delete the default code, paste THIS file, Save.
 *   2. Project Settings (gear icon) -> Script properties -> Add:
 *        SECRET        = a long random password you invent (the website uses the same one)
 *        NOTIFY_EMAIL  = the e-mail that should receive new paid orders and franchise applications
 *   3. Deploy -> New deployment -> type "Web app" -> Execute as: Me -> Who has access: Anyone -> Deploy.
 *      Copy the Web app URL. Authorise the permissions it asks for (Sheets + sending e-mail).
 *   4. In Vercel (or .env.local) set  APPS_SCRIPT_URL = that URL   and   APPS_SCRIPT_SECRET = the SECRET from step 2.
 *   5. Run the function  selfTest  once from the editor (Run button) to check the Sheet and e-mail work.
 *
 * ORDER TRACKING: every paid order gets Progress = Preparing and an ORANGE empty "ETA (min)" cell: type the minutes for that order (e.g. 40) and the
 *   customer's phone shows a live countdown. (Optional: put a default in Settings to have it filled automatically.) To change it later, just type a new number in the "ETA (min)" cell of that order (e.g. 55): the countdown restarts from 55 minutes
 *   from that moment. Use the Progress dropdown (Preparing / Out for delivery / Ready for pickup / Delivered / Cancelled) and, if you like,
 *   "Message to customer" (e.g. "Heavy rain, a few minutes late").
 *
 * OUT OF STOCK: the "Menu" tab lists every dish. Change "Available" to NO (dropdown) and the website shows the dish as "Out of stock" within about a minute
 *   and will not take orders for it; optional "Note to customers" (e.g. "Back at 4 PM") is shown next to it. Set it back to YES when it is available again.
 *   Do not edit columns A-D. After the menu changes on the website, a new dish row is added automatically the next time selfTest runs.
 *
 * MANUAL SWITCH (pause delivery / pickup for a day): the "Settings" tab of this Sheet.
 *   Delivery = YES / NO, Pickup = YES / NO, Message = text shown to customers. The website reads it about once a minute.
 *   (The tab is created by selfTest; after pasting a new version of this script: Deploy -> Manage deployments -> pencil -> Version: New version -> Deploy.)
 *
 * Events handled (JSON body, always includes "secret"):
 *   order_created  -> new row, status "Awaiting payment"            (no e-mail yet)
 *   order_paid     -> row becomes "Paid", e-mail to the shop + receipt to the customer (only the first time)
 *   franchise      -> new row in "Franchise Applications", e-mail to the shop + confirmation to the applicant
 *
 * Note: a free Gmail account can send ~100 e-mails/day from Apps Script — plenty for a single shop.
 */

var ORDERS = 'Orders';
var FRANCHISE = 'Franchise Applications';
var BULK = 'Bulk Orders';
var CUSTOMERS = 'Customers';
var MENU_TAB = 'Menu';
var MENU_HEADERS = ['Item ID', 'Category', 'Item', 'Price (Rs)', 'Available', 'Note to customers'];

// <MENU-LIST> (generated from src/data/menu.ts by scripts/gen-menu-gs.mjs — do not edit by hand)
var MENU_ITEMS = [
  ['misal-pav', 'Misal Pav', 'Misal Pav', 90],
  ['only-misal', 'Misal Pav', 'Only Misal', 85],
  ['dahi-misal-pav', 'Misal Pav', 'Dahi Misal Pav', 110],
  ['vada-misal-pav', 'Misal Pav', 'Vada Misal Pav', 110],
  ['only-vada-misal', 'Misal Pav', 'Only Vada Misal', 105],
  ['cheese-misal-pav', 'Misal Pav', 'Cheese Misal Pav', 130],
  ['fry-misal-pav', 'Misal Pav', 'Fry Misal Pav', 120],
  ['only-fry-misal', 'Misal Pav', 'Only Fry Misal', 110],
  ['cheese-fry-misal', 'Misal Pav', 'Cheese Fry Misal Pav', 160],
  ['nikahara-misal-pav', 'Misal Pav', 'Nikahara Misal Pav', 125],
  ['sizzling-fry-misal', 'Misal Pav', 'Sizzling Fry Misal Pav', 240],
  ['usal-pav', 'Usal Pav', 'Usal Pav', 85],
  ['only-usal', 'Usal Pav', 'Only Usal', 80],
  ['vada-usal-pav', 'Usal Pav', 'Vada Usal Pav', 100],
  ['chulha-misal', 'Chulha Misal', 'Chulha Misal (Group of 4)', 850],
  ['misal-thali', 'Thali', 'Misal Thali', 170],
  ['nikhara-misal-thali', 'Thali', 'Nikhara Misal Thali', 200],
  ['fry-misal-thali', 'Thali', 'Fry Misal Thali', 220],
  ['misal-pav-combo', 'Combos', 'Misal Pav Combo', 135],
  ['misal-fry-combo', 'Combos', 'Misal Pav & Fry Misal Pav Combo', 255],
  ['vada-usal-combo', 'Combos', 'Vada Usal Pav Combo', 365],
  ['nikahara-combo', 'Combos', 'Nikahara Misal Pav Combo', 290],
  ['masala-papad', 'Snacks', 'Masala Papad', 70],
  ['samosa-pav', 'Snacks', 'Samosa Pav', 25],
  ['samosa-2', 'Snacks', 'Samosa (2 Pc)', 40],
  ['kanda-bhajiya', 'Snacks', 'Kanda Bhajiya', 100],
  ['batata-bhajiya', 'Snacks', 'Batata Bhajiya', 100],
  ['mix-bhajiya', 'Snacks', 'Mix Bhajiya', 140],
  ['moongdal-bhajiya', 'Snacks', 'Moongdal Bhajiya', 120],
  ['bread-cutlet', 'Snacks', 'Bread Cutlet', 30],
  ['sabudana-vada', 'Snacks', 'Sabudana Vada', 70],
  ['sabudana-khichdi', 'Snacks', 'Sabudana Khichdi', 80],
  ['kande-pohe', 'Snacks', 'Kande Pohe', 70],
  ['upma', 'Snacks', 'Upma', 70],
  ['aloo-paratha', 'Snacks', 'Aloo Paratha with Curd (2 Pc)', 150],
  ['moong-dal-bhaji', 'Snacks', 'Moong Dal Bhaji', 90],
  ['paneer-bhurji', 'Snacks', 'Paneer Bhurji (2 Pav)', 170],
  ['vada-pav', 'Vada Pav', 'Vada Pav', 25],
  ['cheese-grill-vp', 'Vada Pav', 'Cheese Grill Vada Pav', 65],
  ['mayo-vada-pav', 'Vada Pav', 'Mayonnaise Vada Pav', 35],
  ['tandoori-vada-pav', 'Vada Pav', 'Tandoori Vada Pav', 40],
  ['loaded-cheese-vp', 'Vada Pav', 'Loaded Cheese Grill Vada Pav', 75],
  ['batata-vada-2', 'Vada Pav', 'Batata Vada (2 Pc)', 40],
  ['chole-puri', 'Chole Puri / Puri Bhaji', 'Chole Puri', 110],
  ['puri-5', 'Chole Puri / Puri Bhaji', 'Puri (5 Pcs)', 45],
  ['puri-bhaji', 'Chole Puri / Puri Bhaji', 'Puri Bhaji', 90],
  ['aamras-puri', 'Chole Puri / Puri Bhaji', 'Aamras Puri', ''],
  ['sada-sandwich', 'Sandwich', 'Sada Sandwich', 80],
  ['veg-grill', 'Sandwich', 'Veg Grill Sandwich', 120],
  ['veg-cheese-grill', 'Sandwich', 'Veg Cheese Grill Sandwich', 160],
  ['masala-grill', 'Sandwich', 'Masala Grill Sandwich', 145],
  ['masala-cheese-grill', 'Sandwich', 'Masala Cheese Grill Sandwich', 180],
  ['loaded-sandwich', 'Sandwich', 'Loaded Sandwich', 199],
  ['cheese-chilly-grill', 'Sandwich', 'Cheese Chilly Grill Sandwich', 170],
  ['tandoori-mayo-grill', 'Sandwich', 'Tandoori Mayo Cheese Grill Sandwich', 190],
  ['kulhad-tea', 'Beverages', 'Kulhad Tea', 25],
  ['kulhad-coffee', 'Beverages', 'Kulhad Nescafe Coffee', 45],
  ['chaas', 'Beverages', 'Chaas', 30],
  ['water', 'Beverages', 'Mineral Water 1 Ltr', 20],
  ['cold-drink', 'Beverages', 'Cold Drink', 20],
  ['kokam-soda', 'Beverages', 'Kokam Soda', 80],
  ['kokam-sarbat', 'Beverages', 'Kokam Sarbat', 60],
  ['solkadhi', 'Beverages', 'Solkadhi', 60],
  ['aamras-vati', 'Beverages', 'Aamras Vati', ''],
  ['aamras-500', 'Beverages', 'Aamras (500 gm)', ''],
  ['x-pav', 'Extras', 'Pav', 5],
  ['x-butter-pav', 'Extras', 'Butter Pav', 20],
  ['x-farsan', 'Extras', 'Farsan', 15],
  ['x-papad', 'Extras', 'Papad', 10],
  ['x-cheese', 'Extras', 'Cheese', 35],
  ['x-dahi', 'Extras', 'Dahi', 25],
  ['x-gulab-jamun', 'Extras', 'Gulab Jamun', 20],
  ['x-rassa-vati', 'Extras', 'Rassa Vati', 25]
];
// </MENU-LIST>
var ORDER_HEADERS = ['Created', 'Order ref', 'Status', 'Razorpay order id', 'Payment id', 'Paid at', 'Name', 'Phone', 'Email',
  'Type', 'Address', 'Map link', 'Distance (km)', 'Items', 'Subtotal', 'Delivery fee', 'Total', 'Notes', 'Promo', 'Discount', 'Source', 'Progress', 'ETA (min)', 'ETA set at', 'Message to customer', 'Finished at'];
var BULK_HEADERS = ['Received', 'Name', 'Phone', 'Email', 'Occasion', 'Date needed', 'Time needed', 'People', 'Order details', 'Special / Jain', 'Plates & cutlery', 'Budget', 'Type', 'Address', 'Notes', 'Status'];
var CUSTOMER_HEADERS = ['Created', 'Email', 'Name', 'Phone', 'Last sign-in', 'Sign-in method'];
var FRANCHISE_HEADERS = ['Received', 'Name', 'Phone', 'Email', 'City', 'Message'];

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
// Stops a cell that starts with = + - @ from being run as a spreadsheet formula (formula injection).
function cell_(v) { var s = String(v == null ? '' : v); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function shopEmail_() { return prop_('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail(); }

/** Progress dropdown on every row (existing and future) + a readable date/time format for "ETA set at". Safe to run any number of times. */
function formatOrders_(sh) {
  var list = SpreadsheetApp.newDataValidation().requireValueInList(['Preparing', 'Out for delivery', 'Ready for pickup', 'Delivered', 'Cancelled'], true).setAllowInvalid(true).build();
  var rows = Math.max(sh.getMaxRows() - 1, 1);
  sh.getRange(2, 22, rows, 1).setDataValidation(list);
  sh.getRange(2, 24, rows, 1).setNumberFormat('dd-mmm hh:mm:ss');
  sh.getRange(2, 26, rows, 1).setNumberFormat('dd-mmm hh:mm:ss');
}

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (sh && name === ORDERS) {
    var have = sh.getLastColumn();
    if (have > 0 && have < headers.length) {
      sh.getRange(1, have + 1, 1, headers.length - have).setValues([headers.slice(have)]).setFontWeight('bold').setBackground('#FFE0B8');
    }
    if ((have > 0 && have < headers.length) || (sh.getLastColumn() >= 24 && !sh.getRange(2, 22).getDataValidation())) formatOrders_(sh);
  }
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#FFE0B8');
    sh.setFrozenRows(1);
  }
  return sh;
}

var SETTINGS = 'Settings';

/** The "Menu" tab: one row per dish with an Available YES/NO dropdown. Missing dishes are added; the owner's choices are never overwritten. */
function menuSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(MENU_TAB);
  var fresh = false;
  if (!sh) {
    sh = ss.insertSheet(MENU_TAB);
    sh.getRange(1, 1, 1, MENU_HEADERS.length).setValues([MENU_HEADERS]).setFontWeight('bold').setBackground('#FFE0B8');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 150); sh.setColumnWidth(3, 260); sh.setColumnWidth(4, 90); sh.setColumnWidth(5, 110); sh.setColumnWidth(6, 330);
    fresh = true;
  }
  var have = {};
  var last = sh.getLastRow();
  if (last > 1) { var ids = sh.getRange(2, 1, last - 1, 1).getValues(); for (var i = 0; i < ids.length; i++) have[String(ids[i][0])] = true; }
  var add = [];
  for (var k = 0; k < MENU_ITEMS.length; k++) { var it = MENU_ITEMS[k]; if (!have[it[0]]) add.push([it[0], it[1], it[2], it[3], 'YES', '']); }
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 6).setValues(add);
  var rows = Math.max(sh.getLastRow() - 1, 1);
  sh.getRange(2, 5, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['YES', 'NO'], true).setAllowInvalid(false).build()).setHorizontalAlignment('center').setFontWeight('bold');
  sh.getRange(2, 1, rows, 4).setFontColor('#777777');
  if (fresh) {
    var rule = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('NO').setBackground('#F4C7C3').setFontColor('#B71C1C').setRanges([sh.getRange(2, 5, 500, 1)]).build();
    sh.setConditionalFormatRules([rule]);
  }
  return sh;
}

/** Dishes currently marked NO in the Menu tab: [{id, note}] (read by the website). */
function soldOutList_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MENU_TAB);
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  var out = [];
  for (var i = 0; i < v.length; i++) if (String(v[i][4]).toUpperCase().trim() === 'NO' && v[i][0]) out.push({ id: String(v[i][0]), note: String(v[i][5] || '') });
  return out;
}

/** Runs automatically when someone edits the Sheet: typing a number in "ETA (min)" restarts that order's countdown from now. */
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    if (sh.getName() !== ORDERS || e.range.getRow() < 2) return;
    if (e.range.getColumn() === 22) {      // Progress changed: remember WHEN it was finished (the customer sees it for 10 minutes, then it clears)
      var st = normProgress_(e.value);
      sh.getRange(e.range.getRow(), 26).setValue(st === 'Delivered' || st === 'Cancelled' ? new Date() : '');
      return;
    }
    if (e.range.getColumn() !== 23) return;
    var n = Number(e.value);
    sh.getRange(e.range.getRow(), 24).setValue(e.value === undefined || e.value === '' || isNaN(n) ? '' : new Date());
    if (e.value !== undefined && e.value !== '' && !isNaN(n)) e.range.setBackground(null).clearNote();      // time given: remove the orange
  } catch (err) { /* never block an edit */ }
}

/** Sign-in code e-mail (sent from the shop's own Gmail through this script). */
function sendCode_(d) {
  var email = String(d.email || '').trim();
  var code = String(d.code || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !/^\d{6}$/.test(code)) return { ok: false, error: 'bad request' };
  MailApp.sendEmail({
    to: email, name: 'Misal Hub', subject: 'Your Misal Hub sign-in code: ' + code,
    htmlBody: '<p>Your Misal Hub sign-in code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">' + code + '</p>' +
      '<p>It is valid for 10 minutes. If you did not ask for it, you can ignore this email.</p><p>Misal Hub &middot; +91 90041 67448</p>'
  });
  return { ok: true };
}

function customerRow_(sh, email) {
  if (sh.getLastRow() < 2) return 0;
  var hit = sh.getRange(2, 2, sh.getLastRow() - 1, 1).createTextFinder(String(email).toLowerCase()).matchEntireCell(true).matchCase(false).findNext();
  return hit ? hit.getRow() : 0;
}

/** Called after every successful sign-in: creates the customer on first visit, notes the sign-in, returns the saved name + phone. */
function customerLogin_(d) {
  var sh = sheet_(CUSTOMERS, CUSTOMER_HEADERS);
  var email = String(d.email || '').trim().toLowerCase();
  if (!email) return { ok: false };
  var r = customerRow_(sh, email);
  if (!r) {
    sh.appendRow([new Date(), cell_(email), cell_(d.name || ''), '', new Date(), cell_(d.method || '')]);
    return { ok: true, name: String(d.name || ''), phone: '' };
  }
  var row = sh.getRange(r, 1, 1, 6).getValues()[0];
  if (!row[2] && d.name) sh.getRange(r, 3).setValue(cell_(d.name));
  sh.getRange(r, 5).setValue(new Date());
  return { ok: true, name: String(row[2] || d.name || ''), phone: String(row[3] || '').replace(/\D/g, '').slice(-10) };
}

/** First sign-in: name + mobile number saved (both required by the website). */
function customerSave_(d) {
  var sh = sheet_(CUSTOMERS, CUSTOMER_HEADERS);
  var email = String(d.email || '').trim().toLowerCase();
  var phone = String(d.phone || '').replace(/\D/g, '').slice(-10);
  if (!email || phone.length !== 10) return { ok: false };
  var r = customerRow_(sh, email);
  if (!r) { sh.appendRow([new Date(), cell_(email), cell_(d.name), "'" + phone, new Date(), '']); return { ok: true }; }
  sh.getRange(r, 3).setValue(cell_(d.name));
  sh.getRange(r, 4).setNumberFormat('@').setValue(phone);
  return { ok: true };
}

/** Whatever is in the Progress cell -> one of the five known states (so "Done", "delivered", "on the way" all work). */
function normProgress_(v) {
  var t = String(v || '').toLowerCase().trim();
  if (!t) return 'Preparing';
  if (/cancel/.test(t)) return 'Cancelled';
  if (/deliver|done|complete|picked|collected|finish/.test(t) && !/out for|on the way/.test(t)) return 'Delivered';
  if (/out for|on the way|way|dispatch|rider|left|pick ?up from rider/.test(t)) return 'Out for delivery';
  if (/ready/.test(t)) return 'Ready for pickup';
  return 'Preparing';
}

/** The shape the tracker + "My orders" need, from one Orders row (status + countdown + the full bill). */
function orderView_(r) {
  var mins = Number(r[22]), at = r[23];
  var etaAt = (mins > 0 && at instanceof Date) ? at.getTime() + mins * 60000 : null;
  return { ok: true, ref: String(r[1]), progress: normProgress_(r[21]), items: String(r[13] || ''), total: r[16], type: String(r[9] || ''), address: String(r[10] || ''),
    etaAt: etaAt, etaMin: mins > 0 ? mins : null, note: String(r[24] || ''), serverNow: new Date().getTime(),
    createdAt: r[0] instanceof Date ? r[0].getTime() : null, finishedAt: r[25] instanceof Date ? r[25].getTime() : null, subtotal: r[14], fee: r[15], discount: Number(r[19]) || 0, promo: String(r[18] || ''), paymentId: String(r[4] || '') };
}

/** All of the signed-in customer's PAID orders, newest first (max 40) — for the "My orders" page. */
function myOrders_(q) {
  var email = String(q.email || '').trim().toLowerCase();
  var sh = sheet_(ORDERS, ORDER_HEADERS);
  var n = sh.getLastRow() - 1;
  if (!email || n < 1) return { ok: true, orders: [], serverNow: new Date().getTime() };
  var rows = sh.getRange(2, 1, n, ORDER_HEADERS.length).getValues();
  var out = [];
  for (var i = rows.length - 1; i >= 0 && out.length < 40; i--) {
    var r = rows[i];
    if (String(r[8]).trim().toLowerCase() === email && String(r[2]).indexOf('Paid') === 0) out.push(orderView_(r));
  }
  return { ok: true, orders: out, serverNow: new Date().getTime() };
}

/** The customer's orders for the floating tracker: every one still active (up to 12 h), and a finished one only for 10 minutes after it was delivered / cancelled (max 6). */
function activeOrders_(q) {
  var all = myOrders_(q).orders;
  var now = new Date().getTime(), out = [];
  for (var i = 0; i < all.length && out.length < 6; i++) {
    var o = all[i];
    var finished = o.progress === 'Delivered' || o.progress === 'Cancelled';
    if (finished ? (o.finishedAt && now - o.finishedAt <= 10 * 60 * 1000) : (o.createdAt && now - o.createdAt <= 12 * 60 * 60 * 1000)) out.push(o);
  }
  return { ok: true, orders: out, serverNow: now };
}

/** Customer tracking: find the PAID order for this reference + phone and return what the tracker needs. */
function track_(q) {
  var ref = String(q.ref || '').trim();
  var want = String(q.phone || '').replace(/\D/g, '').slice(-10);
  if (!ref || want.length !== 10) return { ok: false, error: 'not found' };
  var sh = sheet_(ORDERS, ORDER_HEADERS);
  if (sh.getLastRow() < 2) return { ok: false, error: 'not found' };
  var hit = sh.getRange(2, 2, sh.getLastRow() - 1, 1).createTextFinder(ref).matchEntireCell(true).findNext();
  if (!hit) return { ok: false, error: 'not found' };
  var r = sh.getRange(hit.getRow(), 1, 1, ORDER_HEADERS.length).getValues()[0];
  if (String(r[7]).replace(/\D/g, '').slice(-10) !== want || String(r[2]).indexOf('Paid') !== 0) return { ok: false, error: 'not found' };
  var mins = Number(r[22]), at = r[23];
  var etaAt = (mins > 0 && at instanceof Date) ? at.getTime() + mins * 60000 : null;
  return { ok: true, ref: ref, progress: normProgress_(r[21]), items: String(r[13] || ''), total: r[16], type: String(r[9] || ''), address: String(r[10] || ''),
    etaAt: etaAt, etaMin: mins > 0 ? mins : null, note: String(r[24] || ''), serverNow: new Date().getTime() };
}

/** Creates the Settings tab with YES/NO dropdowns the first time. */
function settingsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SETTINGS);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS, 0);
    sh.getRange(1, 1, 6, 3).setValues([
      ['Setting', 'Value', 'What it does'],
      ['Delivery', 'YES', 'YES = customers can order delivery. NO = delivery paused (website blocks it).'],
      ['Pickup', 'YES', 'YES = customers can order pickup. NO = pickup paused.'],
      ['Message', '', 'Optional text shown to customers when something is paused (e.g. "Closed today, back tomorrow 8 AM").'],
      ['Default delivery time (min)', '', 'OPTIONAL. Leave EMPTY to set the time yourself for every order (recommended). A number here is applied automatically to every new paid delivery order.'],
      ['Default pickup time (min)', '', 'OPTIONAL. Leave EMPTY to set the time yourself. A number here is applied automatically to every new paid pickup order.']
    ]);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#FFE0B8');
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(['YES', 'NO'], true).setAllowInvalid(false).build();
    sh.getRange('B2:B3').setDataValidation(rule).setFontWeight('bold').setHorizontalAlignment('center');
    sh.setColumnWidth(1, 190); sh.setColumnWidth(2, 110); sh.setColumnWidth(3, 520);
  } else if (sh.getLastRow() < 6) {
    sh.getRange(5, 1, 2, 3).setValues([
      ['Default delivery time (min)', '', 'OPTIONAL. Leave EMPTY to set the time yourself for every order (recommended). A number here is applied automatically to every new paid delivery order.'],
      ['Default pickup time (min)', '', 'OPTIONAL. Leave EMPTY to set the time yourself. A number here is applied automatically to every new paid pickup order.']
    ]);
    sh.setColumnWidth(1, 190);
  }
  return sh;
}

/** Website asks: GET <web app url>?action=status&secret=...  -> {ok, delivery, pickup, message} */
function doGet(e) {
  try {
    var q = (e && e.parameter) || {};
    if (!prop_('SECRET') || q.secret !== prop_('SECRET')) return out_({ ok: false, error: 'unauthorized' });
    if (q.action === 'track') return out_(track_(q));
    if (q.action === 'active_orders') return out_(activeOrders_(q));
    if (q.action === 'my_orders') return out_(myOrders_(q));
    if (q.action !== 'status') return out_({ ok: false, error: 'unknown action' });
    var v = settingsSheet_().getRange('B2:B4').getValues();
    var yn = function (x) { return String(x).toUpperCase().trim() === 'NO' ? 'NO' : 'YES'; };
    return out_({ ok: true, delivery: yn(v[0][0]), pickup: yn(v[1][0]), message: String(v[2][0] || ''), soldOut: soldOutList_() });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);
    if (!prop_('SECRET') || data.secret !== prop_('SECRET')) return out_({ ok: false, error: 'unauthorized' });
    if (data.action === 'order_created') return out_(orderCreated_(data));
    if (data.action === 'order_paid') return out_(orderPaid_(data));
    if (data.action === 'promo_check') return out_({ ok: true, used: promoUsed_(data.phone, data.code, data.email) });
    if (data.action === 'franchise') return out_(franchise_(data));
    if (data.action === 'bulk') return out_(bulk_(data));
    if (data.action === 'send_code') return out_(sendCode_(data));
    if (data.action === 'customer_login') return out_(customerLogin_(data));
    if (data.action === 'customer_save') return out_(customerSave_(data));
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { /* not held */ }
  }
}

function itemsText_(items) {
  return (items || []).map(function (l) {
    return l.qty + ' x ' + l.name + (l.mode === 'jain' ? ' (Jain)' : '') + ' - Rs ' + l.total;
  }).join('\n');
}

/** Has this phone number already used this promo code? Counts paid orders and unpaid ones started in the last 30 minutes. */
function promoUsed_(phone, code, email) {
  if (!code || (!phone && !email)) return false;
  var sh = sheet_(ORDERS, ORDER_HEADERS);
  var n = sh.getLastRow() - 1;
  if (n < 1) return false;
  var want = String(phone || '').replace(/\D/g, '').slice(-10);
  var wantMail = String(email || '').trim().toLowerCase();
  var rows = sh.getRange(2, 1, n, 19).getValues();      // columns A..S (Created ... Promo)
  var now = new Date().getTime();
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[18]).toUpperCase() !== String(code).toUpperCase()) continue;
    var samePhone = want && String(r[7]).replace(/\D/g, '').slice(-10) === want;
    var sameMail = wantMail && String(r[8]).trim().toLowerCase() === wantMail;
    if (!samePhone && !sameMail) continue;
    var status = String(r[2]);
    if (status.indexOf('Paid') === 0) return true;
    if (status === 'Awaiting payment' && r[0] instanceof Date && now - r[0].getTime() < 30 * 60 * 1000) return true;
  }
  return false;
}

function orderCreated_(d) {
  var sh = sheet_(ORDERS, ORDER_HEADERS);
  var c = d.customer || {};
  if (d.promo && promoUsed_(c.phone, d.promo, c.email)) return { ok: false, error: 'promo_used' };    // checked again here, inside the lock, so two quick orders cannot both get the offer
  sh.appendRow([new Date(), cell_(d.ref), 'Awaiting payment', cell_(d.razorpayOrderId), '', '', cell_(c.name), cell_(c.phone), cell_(c.email),
    cell_(d.type), cell_(d.address), cell_(d.mapLink), d.distanceKm || '', cell_(itemsText_(d.items)), d.subtotal, d.deliveryFee, d.total, cell_(d.notes), cell_(d.promo || ''), d.discount || '', cell_(d.source || '')]);
  return { ok: true };
}

function orderPaid_(d) {
  var sh = sheet_(ORDERS, ORDER_HEADERS);
  var hit = sh.getRange(2, 4, Math.max(sh.getLastRow() - 1, 1), 1).createTextFinder(String(d.razorpayOrderId)).matchEntireCell(true).findNext();
  if (!hit) {
    sh.appendRow([new Date(), '', 'Paid (details missing)', cell_(d.razorpayOrderId), cell_(d.paymentId), new Date()]);
    MailApp.sendEmail(shopEmail_(), 'Misal Hub: payment received but order details missing', 'Razorpay order ' + d.razorpayOrderId + ', payment ' + d.paymentId + '. Please check Razorpay.');
    return { ok: true, note: 'row missing' };
  }
  var r = hit.getRow();
  var row = sh.getRange(r, 1, 1, ORDER_HEADERS.length).getValues()[0];
  if (row[2] === 'Paid') return { ok: true, duplicate: true };       // webhook + browser both report the payment: only act once

  sh.getRange(r, 3).setValue('Paid');
  sh.getRange(r, 5).setValue(cell_(d.paymentId));
  sh.getRange(r, 6).setValue(new Date());

  // order tracking: starts as "Preparing" with the default time from Settings (the owner can edit both in the Orders tab)
  var prog = sh.getRange(r, 22);
  prog.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Preparing', 'Out for delivery', 'Ready for pickup', 'Delivered', 'Cancelled'], true).setAllowInvalid(true).build());
  prog.setValue('Preparing');
  var st = settingsSheet_().getRange('B5:B6').getValues();
  var defMin = Number(String(row[9]) === 'Pickup' ? st[1][0] : st[0][0]);
  var etaCell = sh.getRange(r, 23);
  if (defMin > 0 && !etaCell.getValue()) { etaCell.setValue(defMin); sh.getRange(r, 24).setValue(new Date()); }
  else if (!etaCell.getValue()) { etaCell.setBackground('#FFC266').setNote('Type the minutes for THIS order (e.g. 40). The customer sees a live countdown.'); }   // orange = needs a time

  var o = { ref: row[1], name: row[6], phone: row[7], email: row[8], type: row[9], address: row[10], map: row[11], km: row[12], items: row[13], sub: row[14], fee: row[15], total: row[16], notes: row[17], promo: row[18], discount: row[19] };
  var html = '<h2>New PAID order ' + esc_(o.ref) + '</h2>' +
    '<p><b>' + esc_(o.type) + '</b> &middot; Total <b>Rs ' + esc_(o.total) + '</b> (items Rs ' + esc_(o.sub) + (o.discount ? ' - offer ' + esc_(o.promo) + ' Rs ' + esc_(o.discount) : '') + ' + delivery Rs ' + esc_(o.fee) + ')</p>' +
    '<pre style="font-size:14px">' + esc_(o.items) + '</pre>' +
    '<p><b>' + esc_(o.name) + '</b> &middot; ' + esc_(o.phone) + (o.email ? ' &middot; ' + esc_(o.email) : '') + '</p>' +
    (o.type === 'Delivery' ? '<p>' + esc_(o.address) + '<br>' + (o.km ? esc_(o.km) + ' km &middot; ' : '') + '<a href="' + esc_(o.map) + '">Open in Google Maps</a></p>' : '<p>Pickup from shop.</p>') +
    (o.notes ? '<p><i>Notes: ' + esc_(o.notes) + '</i></p>' : '') +
    '<p style="color:#666">Razorpay payment id: ' + esc_(d.paymentId) + '</p>' +
    '<p style="color:#666">Customer sees a live countdown. SET THE TIME: type the minutes in the orange "ETA (min)" cell of this order in the Orders tab (and use "Progress" to update it later).</p>';
  MailApp.sendEmail({ to: shopEmail_(), subject: 'New paid order ' + o.ref + ' - Rs ' + o.total + ' (' + o.type + ')', htmlBody: html, name: 'Misal Hub website' });

  if (o.email) {
    MailApp.sendEmail({
      to: o.email, name: 'Misal Hub', subject: 'Your Misal Hub order ' + o.ref + ' is confirmed',
      htmlBody: '<p>Hi ' + esc_(o.name) + ', thank you! We have received your payment of <b>Rs ' + esc_(o.total) + '</b> and are preparing your order.</p>' +
        '<pre style="font-size:14px">' + esc_(o.items) + '</pre>' +
        '<p>' + (o.type === 'Delivery' ? 'Delivering to: ' + esc_(o.address) : 'Pickup from: Shop 2/3, Silver Cassia Apt, Pleasant Park Road, Mira Road East.') + '</p>' +
        '<p>Questions? Call +91 90041 67448.</p>'
    });
  }
  return { ok: true };
}

function franchise_(d) {
  var sh = sheet_(FRANCHISE, FRANCHISE_HEADERS);
  sh.appendRow([new Date(), cell_(d.name), cell_(d.phone), cell_(d.email), cell_(d.city), cell_(d.message)]);
  MailApp.sendEmail({
    to: shopEmail_(), name: 'Misal Hub website', replyTo: d.email, subject: 'New franchise application: ' + d.name + ' (' + d.city + ')',
    htmlBody: '<h2>New franchise application</h2><p><b>' + esc_(d.name) + '</b> &middot; ' + esc_(d.phone) + ' &middot; ' + esc_(d.email) + '</p>' +
      '<p>City: ' + esc_(d.city) + '</p>' + (d.message ? '<p>' + esc_(d.message) + '</p>' : '')
  });
  if (d.email) {
    MailApp.sendEmail({
      to: d.email, name: 'Misal Hub', subject: 'We received your Misal Hub franchise application',
      htmlBody: '<p>Hi ' + esc_(d.name) + ', thank you for your interest in a Misal Hub franchise. Our team will call you within 24 hours.</p><p>Misal Hub &middot; +91 90041 67448</p>'
    });
  }
  return { ok: true };
}

/** Bulk / party order enquiry: new row (Status = New, change it as you follow up) + e-mail to the shop + confirmation to the customer. */
function bulk_(d) {
  var sh = sheet_(BULK, BULK_HEADERS);
  sh.appendRow([new Date(), cell_(d.name), cell_(d.phone), cell_(d.email), cell_(d.occasion), cell_(d.date), cell_(d.time), cell_(d.people),
    cell_(d.details), cell_(d.special), cell_(d.cutlery), cell_(d.budget), cell_(d.type), cell_(d.address), cell_(d.notes), 'New']);
  var rows = [['Name', d.name], ['Phone', d.phone], ['Email', d.email], ['Occasion', d.occasion], ['Date', d.date], ['Time', d.time], ['People', d.people],
    ['Order', d.details], ['Special / Jain', d.special], ['Plates & cutlery', d.cutlery], ['Budget', d.budget], ['Type', d.type], ['Address', d.address], ['Notes', d.notes]];
  var table = rows.filter(function (r) { return r[1]; }).map(function (r) { return '<tr><td style="padding:4px 12px 4px 0;color:#666"><b>' + esc_(r[0]) + '</b></td><td style="padding:4px 0;white-space:pre-wrap">' + esc_(r[1]) + '</td></tr>'; }).join('');
  MailApp.sendEmail({
    to: shopEmail_(), name: 'Misal Hub website', replyTo: d.email || shopEmail_(),
    subject: 'BULK ORDER request: ' + d.people + ' on ' + d.date + ' ' + d.time + ' (' + d.name + ')',
    htmlBody: '<h2>New bulk / party order request</h2><p>Call the customer back with a quote.</p><table>' + table + '</table>'
  });
  if (d.email) {
    MailApp.sendEmail({
      to: d.email, name: 'Misal Hub', subject: 'We received your Misal Hub bulk order request',
      htmlBody: '<p>Hi ' + esc_(d.name) + ', thank you! We have your request for <b>' + esc_(d.people) + '</b> on <b>' + esc_(d.date) + ' at ' + esc_(d.time) + '</b>.</p>' +
        '<p>Our team will call you on ' + esc_(d.phone) + ' shortly to confirm the menu, the price and the timing.</p><p>Misal Hub &middot; +91 90041 67448</p>'
    });
  }
  return { ok: true };
}

/** Run once from the editor: creates the sheets and sends a test e-mail to NOTIFY_EMAIL. */
function selfTest() {
  formatOrders_(sheet_(ORDERS, ORDER_HEADERS)); sheet_(FRANCHISE, FRANCHISE_HEADERS); sheet_(BULK, BULK_HEADERS); sheet_(CUSTOMERS, CUSTOMER_HEADERS); menuSheet_(); settingsSheet_();
  MailApp.sendEmail(shopEmail_(), 'Misal Hub website: test e-mail', 'If you can read this, order and franchise e-mails will reach you.');
  Logger.log('OK - sheets (Orders, Franchise Applications, Bulk Orders, Customers, Menu, Settings) created and test e-mail sent to ' + shopEmail_());
}
