import 'server-only';
import { env } from './env';

/**
 * Orders and franchise applications are written to a Google Sheet and e-mailed by a small Google Apps Script
 * (apps-script/Code.gs) that you deploy as a web app. This function POSTs one event to it.
 * Returns false (and logs) on failure instead of throwing, so a Google hiccup never loses a PAID order's confirmation.
 */
export async function notifySheet(payload: Record<string, unknown>): Promise<boolean> {
  const url = env.appsScriptUrl();
  if (!url) { console.error('[sheet] APPS_SCRIPT_URL is not set — event not recorded:', payload.action); return false; }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script web apps accept text/plain without a CORS pre-flight
      body: JSON.stringify({ ...payload, secret: env.appsScriptSecret() }),
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let out: { ok?: boolean; error?: string } = {};
    try { out = JSON.parse(text); } catch { /* HTML error page */ }
    if (!res.ok || !out.ok) { console.error('[sheet] script rejected event', payload.action, res.status, out.error || text.slice(0, 120)); return false; }
    return true;
  } catch (e) {
    console.error('[sheet] request failed', payload.action, (e as Error).message);
    return false;
  }
}

/** Like notifySheet, but returns the script's JSON answer (or null when it could not be reached). */
export async function callSheet(payload: Record<string, unknown>): Promise<{ ok?: boolean; error?: string; used?: boolean } | null> {
  const url = env.appsScriptUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, secret: env.appsScriptSecret() }),
      redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    return JSON.parse(await res.text());
  } catch (e) {
    console.error('[sheet] request failed', payload.action, (e as Error).message);
    return null;
  }
}

/** GET a read-only answer from the Apps Script (order tracking). Returns null when it cannot be reached. */
export async function getSheet(params: Record<string, string>): Promise<Record<string, unknown> | null> {
  const url = env.appsScriptUrl();
  if (!url) return null;
  try {
    const q = new URLSearchParams({ ...params, secret: env.appsScriptSecret() });
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}${q}`, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(8000) });
    return JSON.parse(await res.text());
  } catch (e) {
    console.error('[sheet] read failed', params.action, (e as Error).message);
    return null;
  }
}
