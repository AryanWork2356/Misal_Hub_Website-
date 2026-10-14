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
 * Events handled (JSON body, always includes "secret"):
 *   order_created  -> new row, status "Awaiting payment"            (no e-mail yet)
 *   order_paid     -> row becomes "Paid", e-mail to the shop + receipt to the customer (only the first time)
 *   franchise      -> new row in "Franchise Applications", e-mail to the shop + confirmation to the applicant
 *
 * Note: a free Gmail account can send ~100 e-mails/day from Apps Script — plenty for a single shop.
 */

var ORDERS = 'Orders';
var FRANCHISE = 'Franchise Applications';
var ORDER_HEADERS = ['Created', 'Order ref', 'Status', 'Razorpay order id', 'Payment id', 'Paid at', 'Name', 'Phone', 'Email',
  'Type', 'Address', 'Map link', 'Distance (km)', 'Items', 'Subtotal', 'Delivery fee', 'Total', 'Notes'];
var FRANCHISE_HEADERS = ['Received', 'Name', 'Phone', 'Email', 'City', 'Preferred date', 'Preferred call time', 'Message'];

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
// Stops a cell that starts with = + - @ from being run as a spreadsheet formula (formula injection).
function cell_(v) { var s = String(v == null ? '' : v); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function shopEmail_() { return prop_('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail(); }

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#FFE0B8');
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);
    if (!prop_('SECRET') || data.secret !== prop_('SECRET')) return out_({ ok: false, error: 'unauthorized' });
    if (data.action === 'order_created') return out_(orderCreated_(data));
    if (data.action === 'order_paid') return out_(orderPaid_(data));
    if (data.action === 'franchise') return out_(franchise_(data));
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

function orderCreated_(d) {
  var sh = sheet_(ORDERS, ORDER_HEADERS);
  var c = d.customer || {};
  sh.appendRow([new Date(), cell_(d.ref), 'Awaiting payment', cell_(d.razorpayOrderId), '', '', cell_(c.name), cell_(c.phone), cell_(c.email),
    cell_(d.type), cell_(d.address), cell_(d.mapLink), d.distanceKm || '', cell_(itemsText_(d.items)), d.subtotal, d.deliveryFee, d.total, cell_(d.notes)]);
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

  var o = { ref: row[1], name: row[6], phone: row[7], email: row[8], type: row[9], address: row[10], map: row[11], km: row[12], items: row[13], sub: row[14], fee: row[15], total: row[16], notes: row[17] };
  var html = '<h2>New PAID order ' + esc_(o.ref) + '</h2>' +
    '<p><b>' + esc_(o.type) + '</b> &middot; Total <b>Rs ' + esc_(o.total) + '</b> (items Rs ' + esc_(o.sub) + ' + delivery Rs ' + esc_(o.fee) + ')</p>' +
    '<pre style="font-size:14px">' + esc_(o.items) + '</pre>' +
    '<p><b>' + esc_(o.name) + '</b> &middot; ' + esc_(o.phone) + (o.email ? ' &middot; ' + esc_(o.email) : '') + '</p>' +
    (o.type === 'Delivery' ? '<p>' + esc_(o.address) + '<br>' + (o.km ? esc_(o.km) + ' km &middot; ' : '') + '<a href="' + esc_(o.map) + '">Open in Google Maps</a></p>' : '<p>Pickup from shop.</p>') +
    (o.notes ? '<p><i>Notes: ' + esc_(o.notes) + '</i></p>' : '') +
    '<p style="color:#666">Razorpay payment id: ' + esc_(d.paymentId) + '</p>';
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
  sh.appendRow([new Date(), cell_(d.name), cell_(d.phone), cell_(d.email), cell_(d.city), cell_(d.date), cell_(d.callTime), cell_(d.message)]);
  MailApp.sendEmail({
    to: shopEmail_(), name: 'Misal Hub website', replyTo: d.email, subject: 'New franchise application: ' + d.name + ' (' + d.city + ')',
    htmlBody: '<h2>New franchise application</h2><p><b>' + esc_(d.name) + '</b> &middot; ' + esc_(d.phone) + ' &middot; ' + esc_(d.email) + '</p>' +
      '<p>City: ' + esc_(d.city) + '<br>Preferred call: ' + esc_(d.date) + ' at ' + esc_(d.callTime) + '</p>' + (d.message ? '<p>' + esc_(d.message) + '</p>' : '')
  });
  if (d.email) {
    MailApp.sendEmail({
      to: d.email, name: 'Misal Hub', subject: 'We received your Misal Hub franchise application',
      htmlBody: '<p>Hi ' + esc_(d.name) + ', thank you for your interest in a Misal Hub franchise. Our team will call you within 24 hours' +
        (d.date ? ' (you asked for ' + esc_(d.date) + ' at ' + esc_(d.callTime) + ')' : '') + '.</p><p>Misal Hub &middot; +91 90041 67448</p>'
    });
  }
  return { ok: true };
}

/** Run once from the editor: creates the sheets and sends a test e-mail to NOTIFY_EMAIL. */
function selfTest() {
  sheet_(ORDERS, ORDER_HEADERS); sheet_(FRANCHISE, FRANCHISE_HEADERS);
  MailApp.sendEmail(shopEmail_(), 'Misal Hub website: test e-mail', 'If you can read this, order and franchise e-mails will reach you.');
  Logger.log('OK - sheets created and test e-mail sent to ' + shopEmail_());
}
