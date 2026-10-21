import { connection } from 'next/server';
import { clientIp, json, rateLimit } from '@/lib/server/guard';
import { getOrderStatus } from '@/lib/server/status';

/** GET -> { delivery, pickup, message } : whether the owner has paused delivery / pickup today. */
export async function GET(req: Request) {
  await connection();
  if (!rateLimit(`status:${clientIp(req)}`, 60, 60_000)) return json({ delivery: true, pickup: true, message: '' }, 429);
  return json(await getOrderStatus());
}
