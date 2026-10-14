'use client';
import { useState } from 'react';

type State = 'idle' | 'sending' | 'sent';

/** Franchise application -> POST /api/franchise -> Google Sheet row + e-mail to the shop + confirmation e-mail to the applicant. */
export default function ApplyForm() {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setError('');
    setState('sending');
    try {
      const res = await fetch('/api/franchise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(f.entries())),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setError(j.error || 'Something went wrong. Please try again or call us on +91 90041 67448.');
        setState('idle');
        return;
      }
      form.reset();
      setState('sent');
    } catch {
      setError('Could not reach the server. Please check your internet and try again.');
      setState('idle');
    }
  }

  if (state === 'sent') {
    return (
      <div id="franchiseForm" className="apply-sent" role="status">
        <h3>Application received</h3>
        <p>Thank you! Our franchise team will call you within 24 hours. A confirmation has been sent to your email.</p>
        <button type="button" className="btn btn-gold" onClick={() => setState('idle')}>Submit another application</button>
      </div>
    );
  }

  return (
    <form id="franchiseForm" onSubmit={submit}>
      {/* honeypot: hidden from people, tempting to bots */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
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
      <button type="submit" className="btn btn-gold full-w submit-btn" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Submit Application'}
      </button>
    </form>
  );
}
