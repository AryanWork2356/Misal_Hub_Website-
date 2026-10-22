import { json } from '@/lib/server/guard';
import { authConfigured, getSession, googleClientId } from '@/lib/server/session';

/** GET -> who is signed in on this browser (or null), and which sign-in methods are available. */
export async function GET() {
  const s = await getSession();
  return json({ user: s ? { email: s.email, name: s.name, phone: s.phone, picture: s.picture || '' } : null, available: authConfigured(), google: googleClientId() || null });
}
