// NSR – live silo weights for the Silos page (layer farm and feed mill).
// The Poultry Manager secret lives only in Netlify's environment variables, never in the phones.
// Only signed-in staff (a real Firebase account, not anonymous) get an answer.
const E = process.env, PROJECT = E.FIREBASE_PROJECT || 'nsr-poultry-farms';
const JWKS_URL = E.JWKS_URL || 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let keys = null, keysAt = 0, cache = null;
const b64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function staff(req) {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const p = tok.split('.'); if (p.length !== 3) return null;
  const head = JSON.parse(new TextDecoder().decode(b64(p[0]))), body = JSON.parse(new TextDecoder().decode(b64(p[1])));
  if (head.alg !== 'RS256') return null;
  if (!keys || Date.now() - keysAt > 36e5) { keys = (await (await fetch(JWKS_URL)).json()).keys; keysAt = Date.now(); }
  const jwk = keys.find(k => k.kid === head.kid); if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64(p[2]), new TextEncoder().encode(p[0] + '.' + p[1]));
  const now = Date.now() / 1000;
  if (!ok || body.aud !== PROJECT || body.iss !== 'https://securetoken.google.com/' + PROJECT || body.exp < now || body.iat > now + 300) return null;
  if (!body.sub || (body.firebase || {}).sign_in_provider === 'anonymous') return null;
  return body.sub;
}

export default async req => {
  try { if (!(await staff(req))) return json({ error: 'sign-in' }, 401); } catch (e) { return json({ error: 'sign-in' }, 401); }
  for (const k of ['SILO_HOST', 'SILO_CLIENT_ID', 'SILO_CLIENT_SECRET', 'SILO_TENANT']) if (!E[k]) return json({ error: 'not-set-up' }, 503);
  if (cache && Date.now() - cache.at < 60e3) return json(cache);           // at most one Poultry Manager call a minute
  const base = /^https?:\/\//.test(E.SILO_HOST) ? E.SILO_HOST.replace(/\/+$/, '') : 'https://' + E.SILO_HOST.replace(/\/+$/, '');
  try {
    const r = await fetch(base + '/oauth/silo/list', { method: 'POST', body: '{}', signal: AbortSignal.timeout(12000),
      headers: { client_id: E.SILO_CLIENT_ID, client_secret: E.SILO_CLIENT_SECRET, name: E.SILO_TENANT, 'Content-Type': 'application/json' } });
    if (r.status === 401 || r.status === 403) return json({ error: 'silo-login' }, 502);
    const j = await r.json();
    if (j.status !== 200) return json({ error: j.message || 'silo-error' }, 502);
    cache = { at: Date.now(), silos: (j.silos || []).map(s => ({ id: s.id, name: s.name || 'Silo ' + s.id, la: s.last_active || null, kg: Number.isFinite(+s.current_value) ? +s.current_value : null })) };
    return json(cache);
  } catch (e) { return json({ error: 'silo-offline' }, 502); }
};
export const config = { path: '/api/silo-live' };
