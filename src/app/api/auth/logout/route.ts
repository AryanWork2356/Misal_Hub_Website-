import { json } from '@/lib/server/guard';
import { clearSession } from '@/lib/server/session';

export async function POST() {
  await clearSession();
  return json({ ok: true });
}
