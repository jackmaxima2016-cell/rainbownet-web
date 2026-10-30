/**
 * POST /api/contact — RAINBOWNET confidential form endpoint.
 *
 * Security model:
 *  - server-side validation of every field (never trust the browser)
 *  - honeypot field + minimum time + best-effort per-IP throttling
 *  - Google reCAPTCHA Enterprise assessment (token, action, score) — fail closed
 *  - no form content in logs, only a random reference and the outcome
 *
 * Required environment (Cloudflare Pages → Settings → Variables and Secrets):
 *  RECAPTCHA_PROJECT_ID   Google Cloud project id
 *  RECAPTCHA_API_KEY      API key restricted to reCAPTCHA Enterprise assessments
 *  RECAPTCHA_SITE_KEY     same key as the public build variable
 *  RECAPTCHA_MIN_SCORE    optional, default 0.5
 *  BREVO_API_KEY          Brevo API key
 *  CONTACT_TO_EMAIL       inbox receiving requests
 *  CONTACT_FROM_EMAIL     verified Brevo sender
 *  CONTACT_FROM_NAME      optional, default "RAINBOWNET"
 *  FORM_UNVERIFIED_MODE   optional: "allow" only for local testing
 */

const MAX_BODY = 24 * 1024;
const ALLOWED_ACTIONS = new Set(['CONFIDENTIAL_CONTACT', 'CALLBACK_REQUEST']);

const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > MAX_PER_WINDOW;
}

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const clean = (v, max = 500) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const LABELS = {
  fr: {
    clientType: 'Type de client', requestType: 'Nature de la demande', country: 'Pays', city: 'Ville / région',
    area: 'Zone d’intervention', multi: 'Plusieurs pays', multiCountries: 'Pays concernés',
    description: 'Description', urgency: 'Urgence', timeframe: 'Délai souhaité', budget: 'Budget indicatif',
    name: 'Nom', email: 'E-mail', phone: 'Téléphone', contactPref: 'Contact préféré', language: 'Langue',
    slot: 'Créneau souhaité',
  },
  en: {
    clientType: 'Client type', requestType: 'Nature of request', country: 'Country', city: 'City / region',
    area: 'Area', multi: 'Several countries', multiCountries: 'Countries involved',
    description: 'Description', urgency: 'Urgency', timeframe: 'Timeframe', budget: 'Indicative budget',
    name: 'Name', email: 'Email', phone: 'Phone', contactPref: 'Preferred contact', language: 'Language',
    slot: 'Preferred time',
  },
};

async function verifyRecaptcha(env, token, action, remoteip) {
  const project = env.RECAPTCHA_PROJECT_ID;
  const key = env.RECAPTCHA_API_KEY;
  const siteKey = env.RECAPTCHA_SITE_KEY;
  if (!project || !key || !siteKey) return { ok: false, reason: 'not_configured' };
  if (!token) return { ok: false, reason: 'missing_token' };

  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(project)}/assessments?key=${encodeURIComponent(key)}`;
  const payload = { event: { token, siteKey, expectedAction: action } };
  if (remoteip) payload.event.userIpAddress = remoteip;

  let data;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    data = await res.json();
    if (!res.ok) return { ok: false, reason: 'api_error', status: res.status };
  } catch (e) {
    return { ok: false, reason: 'api_unreachable' };
  }

  const tp = data.tokenProperties || {};
  if (!tp.valid) return { ok: false, reason: 'invalid_token', invalidReason: tp.invalidReason };
  if (tp.action && tp.action !== action) return { ok: false, reason: 'wrong_action' };
  if (env.RECAPTCHA_EXPECTED_HOSTNAME && tp.hostname && tp.hostname !== env.RECAPTCHA_EXPECTED_HOSTNAME) {
    return { ok: false, reason: 'wrong_hostname' };
  }
  const score = typeof data.riskAnalysis?.score === 'number' ? data.riskAnalysis.score : null;
  const min = Number(env.RECAPTCHA_MIN_SCORE || 0.5);
  if (score === null) return { ok: false, reason: 'no_score' };
  if (score < min) return { ok: false, reason: 'low_score', score };
  return { ok: true, score, reasons: data.riskAnalysis?.reasons || [] };
}

async function sendMail(env, subject, html, text, replyTo) {
  const apiKey = env.BREVO_API_KEY;
  const to = env.CONTACT_TO_EMAIL;
  const from = env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return { ok: false, reason: 'not_configured' };

  const body = {
    sender: { email: from, name: env.CONTACT_FROM_NAME || 'RAINBOWNET' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  };
  if (replyTo && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(replyTo)) body.replyTo = { email: replyTo };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, reason: 'mail_error', status: res.status };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'mail_unreachable' };
  }
}

export async function onRequestPost({ request, env }) {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return json(415, { ok: false, error: 'unsupported_media_type' });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: 'payload_too_large' });

  let data;
  try { data = JSON.parse(raw); } catch { return json(400, { ok: false, error: 'invalid_json' }); }
  if (!data || typeof data !== 'object') return json(400, { ok: false, error: 'invalid_payload' });

  const lang = data.lang === 'en' ? 'en' : 'fr';
  const L = LABELS[lang];
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ref = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())).slice(0, 8);

  // Honeypot: answer like a success, do nothing.
  if (clean(data.company_website, 50)) return json(200, { ok: true, ref });

  // Throttle
  if (ip && limited(ip)) return json(429, { ok: false, error: 'too_many_requests' });

  const action = ALLOWED_ACTIONS.has(data.action) ? data.action : '';
  if (!action) return json(400, { ok: false, error: 'invalid_action' });

  // Normalise + validate
  const f = {
    form: data.form === 'callback' ? 'callback' : 'case_assessment',
    lang,
    clientType: clean(data.clientType, 40),
    requestType: clean(data.requestType, 40),
    country: clean(data.country, 40),
    city: clean(data.city, 120),
    area: clean(data.area, 200),
    multi: data.multi === true || data.multi === 'yes',
    multiCountries: clean(data.multiCountries, 240),
    description: clean(data.description, 2000),
    urgency: clean(data.urgency, 40),
    timeframe: clean(data.timeframe, 120),
    budget: clean(data.budget, 40),
    name: clean(data.name, 120),
    email: clean(data.email, 180).toLowerCase(),
    phone: clean(data.phone, 40),
    contactPref: clean(data.contactPref, 20),
    language: clean(data.language, 20),
    slot: clean(data.slot, 20),
    consent: data.consent === true,
  };

  const errors = [];
  if (!f.name) errors.push('name');
  if (!f.consent) errors.push('consent');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email) && f.form !== 'callback') errors.push('email');
  if (f.form === 'callback') {
    if (!f.phone) errors.push('phone');
  } else {
    if (!f.clientType || !f.requestType || !f.country || !f.city) errors.push('required');
    if (f.description.length < 30) errors.push('description');
    if (!f.urgency) errors.push('urgency');
  }
  if (errors.length) return json(422, { ok: false, error: 'validation_failed', fields: errors });

  // Anti-robot — fail closed unless explicitly told otherwise for testing.
  const mode = env.FORM_UNVERIFIED_MODE || '';
  let verdict = null;
  if (mode !== 'allow') {
    verdict = await verifyRecaptcha(env, clean(data.recaptchaToken, 4000), action, ip);
    if (!verdict.ok) {
      const clientFacing = ['low_score', 'missing_token', 'invalid_token', 'wrong_action', 'no_score'].includes(verdict.reason);
      console.log(`[contact] ref=${ref} recaptcha=reject reason=${verdict.reason} score=${verdict.score ?? '-'}`);
      if (verdict.reason === 'not_configured') return json(503, { ok: false, error: 'verification_not_configured' });
      if (verdict.reason === 'api_unreachable' || verdict.reason === 'api_error') return json(503, { ok: false, error: 'verification_unavailable' });
      return json(403, { ok: false, error: clientFacing ? 'verification_failed' : 'blocked', message: lang === 'fr' ? 'Nous n’avons pas pu vérifier votre demande. Veuillez réessayer.' : 'We couldn’t verify your request. Please try again.' });
    }
    console.log(`[contact] ref=${ref} recaptcha=ok score=${verdict.score}`);
  } else {
    console.log(`[contact] ref=${ref} WARNING unverified mode (FORM_UNVERIFIED_MODE=allow)`);
  }

  const rows = f.form === 'callback'
    ? [['name', f.name], ['phone', f.phone], ['slot', f.slot], ['language', f.language]]
    : [['clientType', f.clientType], ['requestType', f.requestType], ['country', f.country], ['city', f.city], ['area', f.area], ['multi', f.multi ? 'yes' : 'no'], ['multiCountries', f.multiCountries], ['urgency', f.urgency], ['timeframe', f.timeframe], ['budget', f.budget], ['name', f.name], ['email', f.email], ['phone', f.phone], ['contactPref', f.contactPref], ['language', f.language], ['description', f.description]];

  const subject = f.form === 'callback'
    ? `[RAINBOWNET] Demande de rappel — ${f.name} (${ref})`
    : `[RAINBOWNET] ${lang === 'fr' ? 'Nouvelle demande confidentielle' : 'New confidential request'} — ${ref}`;

  const html = `<div style="font-family:Arial,sans-serif;color:#101E2C;line-height:1.6;max-width:640px">
    <p style="font-size:12px;letter-spacing:2px;color:#8C9BAA;text-transform:uppercase;margin:0 0 6px">RAINBOWNET — ${lang.toUpperCase()}</p>
    <h2 style="margin:0 0 18px;font-size:20px">${esc(subject)}</h2>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      ${rows.map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;color:#5C6B79;vertical-align:top;white-space:nowrap">${esc(L[k] || k)}</td><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(v || '—')}</td></tr>`).join('')}
    </table>
    <p style="font-size:12px;color:#8C9BAA;margin-top:22px">Référence ${esc(ref)} · reCAPTCHA score ${esc(String(verdict && verdict.score != null ? verdict.score : 'n/a'))} · ${new Date().toISOString()}</p>
  </div>`;
  const text = rows.map(([k, v]) => `${L[k] || k}: ${v || '—'}`).join('\n');

  const mail = await sendMail(env, subject, html, text, f.email);
  if (!mail.ok) {
    console.log(`[contact] ref=${ref} mail=reject reason=${mail.reason} status=${mail.status || '-'}`);
    if (mail.reason === 'not_configured') return json(503, { ok: false, error: 'mail_not_configured' });
    return json(502, { ok: false, error: 'mail_failed' });
  }

  console.log(`[contact] ref=${ref} mail=sent action=${action}`);
  return json(200, { ok: true, ref });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json(405, { ok: false, error: 'method_not_allowed' });
}
