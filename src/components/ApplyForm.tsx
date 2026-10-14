'use client';
import { useState } from 'react';
import { CONFIG } from '@/data/menu';

/**
 * Franchise application. There is no server, so the application is handed to the shop on WhatsApp
 * (same channel as online orders). To collect applications by e-mail or in a spreadsheet instead,
 * replace `send()` with a call to your own API route.
 */
export default function ApplyForm() {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function send(f: HTMLFormElement) {
    const v = (n: string) => ((f.elements.namedItem(n) as HTMLInputElement | null)?.value || '').trim();
    const digits = v('phone').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(digits)) { setError('Please enter a valid 10-digit mobile number.'); return false; }
    setError('');
    const msg =
      '*New franchise application - Misal Hub (website)*\n' +
      `Name: ${v('name')}\nPhone: ${digits}\nEmail: ${v('email')}\nCity: ${v('city')}\n` +
      `Preferred call: ${v('date')} at ${v('hh')}:${v('mm')} ${v('ap')}\n` +
      (v('message') ? `Message: ${v('message')}\n` : '');
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    return true;
  }

  return (
    <form
      id="franchiseForm"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (send(form)) { setSent(true); form.reset(); }
      }}
    >
      <div className="form-row">
        <div className="form-field">
          <label>Full Name *</label>
          <input name="name" type="text" placeholder="Your full name" required />
        </div>
        <div className="form-field">
          <label>Phone Number *</label>
          <input name="phone" type="tel" placeholder="+91 XXXXX XXXXX" required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Email Address *</label>
          <input name="email" type="email" placeholder="your@email.com" required />
        </div>
        <div className="form-field">
          <label>City *</label>
          <input name="city" type="text" placeholder="Your city" required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Preferred Date *</label>
          <input name="date" type="date" required />
        </div>
        <div className="form-field">
          <label>Calling Time *</label>
          <div className="time-row">
            <select name="hh" required defaultValue="">
              <option value="" disabled>Hours</option>
              {['09', '10', '11', '12', '01', '02', '03', '04', '05', '06'].map((h) => <option key={h}>{h}</option>)}
            </select>
            <select name="mm" required defaultValue="">
              <option value="" disabled>Min</option>
              {['00', '15', '30', '45'].map((m) => <option key={m}>{m}</option>)}
            </select>
            <select name="ap" defaultValue="AM">
              <option>AM</option><option>PM</option>
            </select>
          </div>
        </div>
      </div>
      <div className="form-field">
        <label>Message (Optional)</label>
        <textarea name="message" rows={3} placeholder="Tell us about your location, experience or any questions..." />
      </div>
      {error && <p className="form-note" role="alert" style={{ color: '#fca5a5' }}>{error}</p>}
      <button type="submit" className="btn btn-gold full-w submit-btn">Submit Application</button>
      {sent && <p className="form-note">WhatsApp has opened with your application — press Send there and our team will call you within 24 hours.</p>}
    </form>
  );
}
