'use client';
import { useEffect, useRef, useState } from 'react';
import { setUser, useAccount } from '@/lib/useAccount';
import { validMobile } from '@/lib/phone';

type Step = 'choose' | 'code' | 'profile';
type G = { accounts?: { id: { initialize(o: Record<string, unknown>): void; renderButton(el: HTMLElement, o: Record<string, unknown>): void } } };

const post = async (url: string, body: unknown) => {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ ok: false, error: 'Something went wrong. Please try again.' }));
};

/**
 * Sign in (or create the account) before ordering. Two ways: "Continue with Google", or a 6-digit code we e-mail.
 * New customers are then asked for their name and mobile number (both required). Tracking, history and offers follow the account.
 */
export default function SignInCard({ title = 'Sign in with Google to order' }: { title?: string }) {
  const acct = useAccount();
  const [step, setStep] = useState<Step>('choose');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const gRef = useRef<HTMLDivElement>(null);

  /* signed in (e.g. via Google) but name / mobile missing -> ask for them */
  useEffect(() => {
    if (acct.user && !(acct.user.phone.length === 10 && acct.user.name.trim().length >= 2)) {
      setStep('profile'); setName((n) => n || acct.user!.name || '');
    }
  }, [acct.user]);

  /* the Google button (only when a Google client id is configured) */
  useEffect(() => {
    if (step !== 'choose' || !acct.google || !gRef.current) return;
    const clientId = acct.google;
    const init = () => {
      const g = (window as unknown as { google?: G }).google?.accounts?.id;
      if (!g || !gRef.current) return;
      g.initialize({
        client_id: clientId,
        callback: async (resp: { credential?: string }) => {
          setBusy(true); setMsg('');
          const j = await post('/api/auth/google', { credential: resp.credential });
          setBusy(false);
          if (!j.ok) return setMsg(j.error || 'Google sign-in failed.');
          setUser(j.user); if (j.needsProfile) setStep('profile');
        },
      });
      gRef.current.innerHTML = '';
      g.renderButton(gRef.current, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 300 });
    };
    if ((window as unknown as { google?: G }).google?.accounts) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init;
    document.head.appendChild(s);
  }, [step, acct.google]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault(); setMsg('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setMsg('Please enter a valid email address.');
    setBusy(true);
    const j = await post('/api/auth/email/start', { email });
    setBusy(false);
    if (!j.ok) return setMsg(j.error || 'We could not send the code.');
    setChallenge(j.challenge); setCode(''); setStep('code');
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    if (code.replace(/\D/g, '').length !== 6) return setMsg('Please enter the 6-digit code from your email.');
    setBusy(true);
    const j = await post('/api/auth/email/verify', { email, code, challenge });
    setBusy(false);
    if (!j.ok) return setMsg(j.error || 'That code is not right.');
    setUser(j.user); if (j.needsProfile) { setName(j.user.name || ''); setStep('profile'); }
  }
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    if (name.trim().length < 2) return setMsg('Please enter your name.');
    if (!validMobile(phone)) return setMsg('Please enter a real 10-digit mobile number — we call this number about your order.');
    setBusy(true);
    const j = await post('/api/auth/profile', { name, phone });
    setBusy(false);
    if (!j.ok) return setMsg(j.error || 'We could not save your details.');
    setUser(j.user);
  }

  if (!acct.available && acct.loaded) {
    return <div className="si-card"><h3>{title}</h3><p className="si-msg">Online ordering is being set up. Please call us on <b>+91 90041 67448</b> to order.</p></div>;
  }

  return (
    <div className="si-card" id="signIn">
      <div className="si-head"><span aria-hidden="true">👋</span><div><h3>{step === 'profile' ? 'Almost done — your details' : title}</h3>
        <p>{step === 'profile' ? (name.trim().length >= 2 ? `Hi ${name.split(' ')[0]}! Just your mobile number so our rider can reach you.` : 'We need your name and mobile number so our rider can reach you.') : acct.google ? 'One tap with your Google account — no password. Your orders, tracking and first-order offer follow your account on every device.' : 'Your orders, tracking and first-order offer follow your account on every device.'}</p></div></div>

      {step === 'choose' && (
        <>
          {acct.google && <div className="si-google" ref={gRef} />}
          {acct.google && <div className="si-or"><span>or</span></div>}
          <form onSubmit={sendCode} className="si-form">
            <label htmlFor="siEmail">{acct.google ? 'No Google account? Get a sign-in code by email' : 'Email me a sign-in code'}</label>
            <div className="si-row">
              <input id="siEmail" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" disabled={busy}>{busy ? '…' : 'Send code'}</button>
            </div>
          </form>
        </>
      )}

      {step === 'code' && (
        <form onSubmit={verify} className="si-form">
          <label htmlFor="siCode">We sent a 6-digit code to <b>{email}</b></label>
          <div className="si-row">
            <input id="siCode" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
            <button type="submit" disabled={busy}>{busy ? '…' : 'Verify'}</button>
          </div>
          <p className="si-small">Check your spam folder if it does not arrive. <button type="button" onClick={() => { setStep('choose'); setMsg(''); }}>Use a different email</button> · <button type="button" onClick={() => sendCode()} disabled={busy}>Resend</button></p>
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={saveProfile} className="si-form si-profile">
          {!(acct.user && acct.user.name.trim().length >= 2) && <><label htmlFor="siName">Your name</label>
          <input id="siName" type="text" autoComplete="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} /></>}
          <label htmlFor="siPhone">Mobile number</label>
          <input id="siPhone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button type="submit" className="si-go" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
        </form>
      )}

      {msg && <p className="si-msg" role="alert">{msg}</p>}
    </div>
  );
}
