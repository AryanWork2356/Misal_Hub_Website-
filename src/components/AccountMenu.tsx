'use client';
import { useEffect, useRef, useState } from 'react';
import SignInCard from './SignInCard';
import { isComplete, signOut, useAccount } from '@/lib/useAccount';

const initials = (name: string, email: string) => {
  const t = (name || email || '?').trim();
  const parts = t.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase();
};

/**
 * The profile circle in the header. Signed out: an anonymous silhouette that invites people to sign in with Google.
 * Signed in: their Google profile photo (or their initials), with a small menu: who they are, their order, sign out.
 */
export default function AccountMenu({ className = '' }: { className?: string }) {
  const acct = useAccount();
  const user = acct.user;
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [imgBad, setImgBad] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { setImgBad(false); }, [user?.picture]);
  useEffect(() => {
    const open = () => setDialog(true);
    window.addEventListener('mh:open-signin', open);
    return () => window.removeEventListener('mh:open-signin', open);
  }, []);
  useEffect(() => { if (dialog && isComplete(user)) setDialog(false); }, [dialog, user]);   // signed in: close the prompt
  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [menu]);
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDialog(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog]);

  const click = () => { if (user) setMenu((m) => !m); else setDialog(true); };

  return (
    <div className={`acct ${className}`.trim()} ref={box}>
      <button type="button" className={`acct-btn${user ? ' in' : ''}`} onClick={click} aria-label={user ? `Your account: ${user.name || user.email}` : 'Sign in'} aria-expanded={menu}>
        {user ? (
          user.picture && !imgBad
            ? <img src={user.picture} alt="" referrerPolicy="no-referrer" onError={() => setImgBad(true)} />
            : <span className="acct-initials">{initials(user.name, user.email)}</span>
        ) : (
          <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="15" r="7" /><path d="M5 38c1-9 7-13 15-13s14 4 15 13z" /></svg>
        )}
        {!user && <i className="acct-dot" aria-hidden="true" />}
      </button>

      {user && menu && (
        <div className="acct-pop" role="menu">
          <div className="acct-who"><b>{user.name || 'Welcome'}</b><small>{user.email}</small></div>
          <button type="button" role="menuitem" onClick={() => { setMenu(false); window.dispatchEvent(new Event('mh:open-tracker')); }}>🛵 My current order</button>
          <button type="button" role="menuitem" className="out" onClick={() => { setMenu(false); signOut(); }}>Sign out</button>
        </div>
      )}

      {dialog && (
        <div className="acct-modal" role="dialog" aria-label="Sign in">
          <div className="acct-backdrop" onClick={() => setDialog(false)} />
          <div className="acct-card">
            <button type="button" className="acct-close" onClick={() => setDialog(false)} aria-label="Close">×</button>
            <SignInCard title="Sign in with Google" />
          </div>
        </div>
      )}
    </div>
  );
}
