// NSR – send the verified daily layer report on WhatsApp (WhatsApp Business Cloud API).
// Netlify environment variables: WA_TOKEN (permanent system-user token), WA_PHONE_ID (sender phone number ID),
// WA_TEMPLATE (approved template name, default nsr_daily_report), WA_LANG (default en).
// Only Admin / Management may send; numbers come from the app (settings/wa). Each date is sent once unless Management resends.
const E = process.env, PROJECT = E.FIREBASE_PROJECT || 'nsr-poultry-farms', G = E.GRAPH_URL || 'https://graph.facebook.com/v21.0';
const FS = E.FS_URL || `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const JWKS_URL = E.JWKS_URL || 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let keys = null, keysAt = 0;
const b64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function verify(tok) {
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
// Firestore with the caller's own sign-in, so the database rules apply to everything this function reads or writes
const fs = (tok, path, init = {}) => fetch(FS + path, { ...init, headers: { Authorization: 'Bearer ' + tok, 'content-type': 'application/json', ...(init.headers || {}) } });
const sv = f => f ? (f.stringValue ?? f.integerValue ?? f.booleanValue ?? (f.arrayValue ? (f.arrayValue.values || []).map(sv) : null)) : null;
const fields = o => ({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? { arrayValue: { values: v.map(x => typeof x === 'object' ? { mapValue: fields(x) } : { stringValue: String(x) }) } } : typeof v === 'number' ? { integerValue: String(Math.round(v)) } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) }])) });

export default async req => {
  if (req.method !== 'POST') return json({ error: 'post-only' }, 405);
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  let uid = null; try { uid = await verify(tok); } catch (e) {}
  if (!uid) return json({ error: 'sign-in' }, 401);
  let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad-request' }, 400); }
  const date = String(b.date || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !b.pdf) return json({ error: 'bad-request' }, 400);
  if (b.pdf.length > 7e6) return json({ error: 'pdf-too-large' }, 413);

  const me = await fs(tok, '/users/' + uid); if (!me.ok) return json({ error: 'no-user' }, 403);
  const u = (await me.json()).fields || {}, role = sv(u.role), name = sv(u.name) || '';
  if (!['chk', 'admin'].includes(role)) return json({ error: 'not-allowed' }, 403);
  if (b.force && role !== 'admin') return json({ error: 'resend-management-only' }, 403);
  if (!E.WA_TOKEN || !E.WA_PHONE_ID) return json({ error: 'WhatsApp is not set up yet (WA_TOKEN / WA_PHONE_ID)' }, 503);

  const cfgR = await fs(tok, '/settings/wa'), cfg = cfgR.ok ? (await cfgR.json()).fields || {} : {};
  const to = (sv(cfg.to) || []).filter(x => /^\d{10,15}$/.test(x));
  if (!to.length) return json({ error: 'no-numbers' }, 400);

  // send each date once: create wa/<date>; if it already exists and this is not a resend, stop here
  const cr = await fs(tok, '/wa?documentId=' + date, { method: 'POST', body: JSON.stringify(fields({ at: Date.now(), by: name, state: 'sending' })) });
  if (!cr.ok) {
    if (cr.status !== 409) return json({ error: 'log-' + cr.status }, 502);
    if (!b.force) { // already there: stop, unless the earlier try failed or got stuck
      const old = await fs(tok, '/wa/' + date), o = old.ok ? (await old.json()).fields || {} : {}, st = sv(o.state), at = +sv(o.at) || 0;
      if (st === 'sent' || st === 'partial' || (st === 'sending' && Date.now() - at < 10 * 60e3)) return json({ skipped: 'already-sent' });
    }
  }

  const H = { Authorization: 'Bearer ' + E.WA_TOKEN };
  // 1. upload the PDF once
  const fd = new FormData(); fd.append('messaging_product', 'whatsapp'); fd.append('type', 'application/pdf');
  fd.append('file', new Blob([Buffer.from(b.pdf, 'base64')], { type: 'application/pdf' }), b.filename || 'NSR-daily-report.pdf');
  const up = await fetch(`${G}/${E.WA_PHONE_ID}/media`, { method: 'POST', headers: H, body: fd }), uj = await up.json().catch(() => ({}));
  if (!up.ok || !uj.id) { const err = (uj.error && uj.error.message) || 'upload ' + up.status; await fs(tok, `/wa/${date}?updateMask.fieldPaths=state&updateMask.fieldPaths=error`, { method: 'PATCH', body: JSON.stringify(fields({ state: 'failed', error: err })) }); return json({ error: err }, 502); }
  // 2. template message with the PDF as header and the summary figures in the body
  const vars = (Array.isArray(b.vars) ? b.vars : []).slice(0, 10).map(v => String(v).replace(/[\n\t]+/g, ' ').replace(/ {4,}/g, ' ').slice(0, 200) || '-');
  let sent = 0; const failed = [];
  for (const n of to) {
    const r = await fetch(`${G}/${E.WA_PHONE_ID}/messages`, { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({
      messaging_product: 'whatsapp', to: n, type: 'template',
      template: { name: E.WA_TEMPLATE || 'nsr_daily_report', language: { code: E.WA_LANG || 'en' }, components: [
        { type: 'header', parameters: [{ type: 'document', document: { id: uj.id, filename: b.filename || 'NSR-daily-report.pdf' } }] },
        ...(vars.length ? [{ type: 'body', parameters: vars.map(text => ({ type: 'text', text })) }] : [])] } }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) sent++; else failed.push({ to: n.slice(0, 4) + '…' + n.slice(-3), error: (j.error && j.error.message) || 'HTTP ' + r.status });
  }
  await fs(tok, `/wa/${date}?updateMask.fieldPaths=state&updateMask.fieldPaths=sent&updateMask.fieldPaths=failed&updateMask.fieldPaths=at&updateMask.fieldPaths=by`,
    { method: 'PATCH', body: JSON.stringify(fields({ state: failed.length ? (sent ? 'partial' : 'failed') : 'sent', sent, failed, at: Date.now(), by: name })) });
  return json({ sent, failed });
};
export const config = { path: '/api/wa-report' };
