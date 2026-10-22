'use client';
import { useEffect, useSyncExternalStore } from 'react';

export type User = { email: string; name: string; phone: string; picture?: string };
type State = { loaded: boolean; user: User | null; available: boolean; google: string | null };

/** Who is signed in on this browser. One shared copy for the whole page (menu, tracker, sign-in card). */
const INITIAL: State = { loaded: false, user: null, available: true, google: null };
let state: State = INITIAL;
let started = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export async function refreshAccount(): Promise<void> {
  try {
    const j = await (await fetch('/api/auth/me', { cache: 'no-store' })).json();
    state = { loaded: true, user: j.user ?? null, available: !!j.available, google: j.google ?? null };
  } catch {
    state = { ...state, loaded: true };
  }
  emit();
}
/** called right after sign-in / profile save / sign-out so every part of the page updates at once */
export function setUser(user: User | null) { state = { ...state, loaded: true, user }; emit(); }

export async function signOut() {
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  setUser(null);
}

export const isComplete = (u: User | null): u is User => !!u && u.phone.length === 10 && u.name.trim().length >= 2;

export function useAccount(): State {
  const s = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => state, () => INITIAL);
  useEffect(() => { if (!started) { started = true; refreshAccount(); } }, []);
  return s;
}
