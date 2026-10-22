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
var ORDER_HEADERS = ['Created', 'Order ref', 'Status', 'Razorpay order id', 'Payment id', 'Paid at', 'Name', 'Phone', 'Email',
  'Type', 'Address', 'Map link', 'Distance (km)', 'Items', 'Subtotal', 'Delivery fee', 'Total', 'Notes', 'Promo', 'Discount', 'Source', 'Progress', 'ETA (min)', 'ETA set at', 'Message to customer'];
var BULK_HEADERS = ['Received', 'Name', 'Phone', 'Email', 'Occasion', 'Date needed', 'Time needed', 'People', 'Order details', 'Special / Jain', 'Plates & cutlery', 'Budget', 'Type', 'Address', 'Notes', 'Status'];
var CUSTOMER_HEADERS = ['Created', 'Email', 'Name', 'Phone', 'Last sign-in', 'Sign-in method'];
var FRANCHISE_HEADERS = ['Received', 'Name', 'Phone', 'Email', 'City', 'Message'];

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
// Stops a cell that starts with = + - @ from being run as a spreadsheet formula (formula injection).
function cell_(v) { var s = String(v == null ? '' : v); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function shopEmail_() { return prop_('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail(); }

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (sh && name === ORDERS) {
    var have = sh.getLastColumn();
    if (have > 0 && have < headers.length) {
      sh.getRange(1, have + 1, 1, headers.length - have).setValues([headers.slice(have)]).setFontWeight('bold').setBackground('#FFE0B8');
    }
  }
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#FFE0B8');
    sh.setFrozenRows(1);
  }
  return sh;
}

var SETTINGS = 'Settings';

/** Runs automatically when someone edits the Sheet: typing a number in "ETA (min)" restarts that order's countdown from now. */
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    if (sh.getName() !== ORDERS || e.range.getRow() < 2 || e.range.getColumn() !== 23) return;
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

/** The shape the tracker needs, from one Orders row. */
function orderView_(r) {
  var mins = Number(r[22]), at = r[23];
  var etaAt = (mins > 0 && at instanceof Date) ? at.getTime() + mins * 60000 : null;
  return { ok: true, ref: String(r[1]), progress: String(r[21] || 'Preparing'), items: String(r[13] || ''), total: r[16], type: String(r[9] || ''), address: String(r[10] || ''),
    etaAt: etaAt, etaMin: mins > 0 ? mins : null, note: String(r[24] || ''), serverNow: new Date().getTime() };
}

/** The signed-in customer's latest PAID order: shown while it is active (up to 12 hours), and for 3 hours after it was delivered / cancelled. */
function activeOrder_(q) {
  var email = String(q.email || '').trim().toLowerCase();
  var sh = sheet_(ORDERS, ORDER_HEADERS);
  var n = sh.getLastRow() - 1;
  if (!email || n < 1) return { ok: true };
  var rows = sh.getRange(2, 1, n, ORDER_HEADERS.length).getValues();
  var now = new Date().getTime();
  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    if (String(r[8]).trim().toLowerCase() !== email || String(r[2]).indexOf('Paid') !== 0) continue;
    if (!(r[0] instanceof Date)) continue;
    var prog = String(r[21] || 'Preparing');
    var finished = prog === 'Delivered' || prog === 'Cancelled';
    if (now - r[0].getTime() > (finished ? 3 : 12) * 60 * 60 * 1000) return { ok: true };   // too old: nothing to show
    return orderView_(r);                                                                   // the latest paid order decides
  }
  return { ok: true };
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
  return { ok: true, ref: ref, progress: String(r[21] || 'Preparing'), items: String(r[13] || ''), total: r[16], type: String(r[9] || ''), address: String(r[10] || ''),
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
    if (q.action === 'active_order') return out_(activeOrder_(q));
    if (q.action !== 'status') return out_({ ok: false, error: 'unknown action' });
    var v = settingsSheet_().getRange('B2:B4').getValues();
    var yn = function (x) { return String(x).toUpperCase().trim() === 'NO' ? 'NO' : 'YES'; };
    return out_({ ok: true, delivery: yn(v[0][0]), pickup: yn(v[1][0]), message: String(v[2][0] || '') });
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
  sheet_(ORDERS, ORDER_HEADERS); sheet_(FRANCHISE, FRANCHISE_HEADERS); sheet_(BULK, BULK_HEADERS); sheet_(CUSTOMERS, CUSTOMER_HEADERS); settingsSheet_();
  MailApp.sendEmail(shopEmail_(), 'Misal Hub website: test e-mail', 'If you can read this, order and franchise e-mails will reach you.');
  Logger.log('OK - sheets (Orders, Franchise Applications, Bulk Orders, Customers, Settings) created and test e-mail sent to ' + shopEmail_());
}
