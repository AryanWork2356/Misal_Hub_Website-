import 'server-only';
import { json } from './guard';
import { callSheet } from './sheet';
import { setSession } from './session';

/** common end of every sign-in: remember the customer in the Sheet, start the session, say whether the phone number is still needed */
export async function finishLogin(email: string, nameFromProvider: string, method: 'google' | 'email', picture = '') {
  const r = await callSheet({ action: 'customer_login', email, name: nameFromProvider, method }) as { ok?: boolean; name?: string; phone?: string } | null;
  if (!r || r.ok !== true) return json({ ok: false, error: 'We could not sign you in right now. Please try again.' }, 502);
  const name = String(r.name || nameFromProvider || '');
  const phone = String(r.phone || '');
  await setSession(email, name, phone, picture);
  return json({ ok: true, user: { email, name, phone, picture }, needsProfile: !phone || name.length < 2 });
}
