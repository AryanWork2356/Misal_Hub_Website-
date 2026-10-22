'use client';
import { useEffect, useState } from 'react';
import { BULK, CUTLERY, OCCASIONS, PEOPLE, earliestDate } from '@/lib/bulk';

type State = 'idle' | 'sending' | 'sent';

/** Bulk / party order enquiry -> POST /api/bulk -> Sheet tab "Bulk Orders" + e-mails. The shop calls back with a quote. */
export default function BulkForm() {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [type, setType] = useState<'Delivery' | 'Pickup'>('Delivery');
  const [minDate, setMinDate] = useState('');   // tomorrow (India time); worked out in the browser, never while the page is built
  useEffect(() => { setMinDate(earliestDate()); }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setError(''); setState('sending');
    try {
      const res = await fetch('/api/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, type }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) { setError(j.error || 'Something went wrong. Please try again or call us on +91 90041 67448.'); setState('idle'); return; }
      form.reset(); setState('sent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Could not reach the server. Please check your internet and try again.'); setState('idle');
    }
  }

  if (state === 'sent') {
    return (
      <div className="bk-sent" role="status">
        <span aria-hidden="true">🎉</span>
        <h3>Request received!</h3>
        <p>Thank you. Our team will call you within about {BULK.callbackHours} hours to confirm the menu, the price and the timing.</p>
        <p className="bk-sent-small">If it is urgent, call or WhatsApp us on <b>+91 90041 67448</b>.</p>
        <button type="button" className="btn btn-gold" onClick={() => setState('idle')}>Send another request</button>
      </div>
    );
  }

  return (
    <form className="bk-form" onSubmit={submit} noValidate>
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

      <fieldset>
        <legend><i>1</i> About you</legend>
        <div className="bk-row">
          <label>Your name *<input name="name" type="text" autoComplete="name" required placeholder="Full name" /></label>
          <label>Mobile number *<input name="phone" type="tel" inputMode="numeric" autoComplete="tel" required placeholder="10-digit mobile number" /></label>
        </div>
        <label>Email <em>for the confirmation · optional</em><input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label>
      </fieldset>

      <fieldset>
        <legend><i>2</i> Your event</legend>
        <div className="bk-row">
          <label>Occasion *
            <select name="occasion" required defaultValue="">
              <option value="" disabled>Choose…</option>
              {OCCASIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label>How many people? *
            <select name="people" required defaultValue="">
              <option value="" disabled>Choose…</option>
              {PEOPLE.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <div className="bk-row">
          <label>Date needed *<input name="date" type="date" min={minDate || undefined} required /></label>
          <label>Time needed *<input name="time" type="time" required /></label>
        </div>
        <p className="bk-hint">Please send your request at least {BULK.leadHours} hours before the event so we can prepare properly.</p>
      </fieldset>

      <fieldset>
        <legend><i>3</i> Your order</legend>
        <label>What would you like? *<em>dishes and rough quantities</em>
          <textarea name="details" rows={4} required placeholder="e.g. 40 Misal Pav, 20 Vada Pav, 30 Chaas…" />
        </label>
        <label>Jain or special requirements <em>optional</em>
          <input name="special" type="text" placeholder="e.g. 10 Jain plates, less spicy, no onion-garlic" />
        </label>
        <div className="bk-row">
          <label>Plates &amp; cutlery? *
            <select name="cutlery" required defaultValue="">
              <option value="" disabled>Choose…</option>
              {CUTLERY.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label>Budget <em>optional</em><input name="budget" type="text" placeholder="e.g. ₹8,000 or ₹200 per person" /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend><i>4</i> Delivery</legend>
        <div className="bk-type" role="radiogroup" aria-label="Delivery or pickup">
          <label className={type === 'Delivery' ? 'on' : ''}><input type="radio" name="typeRadio" checked={type === 'Delivery'} onChange={() => setType('Delivery')} /><b>Delivery</b><small>To your venue</small></label>
          <label className={type === 'Pickup' ? 'on' : ''}><input type="radio" name="typeRadio" checked={type === 'Pickup'} onChange={() => setType('Pickup')} /><b>Pickup</b><small>From our shop</small></label>
        </div>
        {type === 'Delivery' && (
          <label>Full delivery address *<em>with a landmark</em>
            <textarea name="address" rows={3} placeholder="Flat / hall name, building, area, landmark" />
          </label>
        )}
        <label>Anything else? <em>optional</em><textarea name="notes" rows={2} placeholder="Timing, spice level, how to reach the venue…" /></label>
      </fieldset>

      {error && <p className="bk-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-gold bk-submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Request a quote'}</button>
      <p className="bk-fine">We will call you back with a quote. Sending this form does not charge you anything.</p>
    </form>
  );
}
