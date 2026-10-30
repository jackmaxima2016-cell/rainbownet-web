/**
 * POST /api/contact — RAINBOWNET confidential form endpoint.
 *
 * 1. server-side validation of every field (never trust the browser)
 * 2. honeypot + best-effort per-IP throttle
 * 3. reCAPTCHA Enterprise assessment, server-to-server, through the VPS relay
 *    (https://captcha.accidata.fr/verify → Google Enterprise API, service account).
 *    Fail-closed: without valid:true, nothing is sent.
 * 4. email relay through the cPanel SMTP server (flocon.o2switch.net, 465/TLS).
 *    Brevo is kept as a fallback if the SMTP variables are absent.
 *
 * Pages secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 *                SENDER_EMAIL, SENDER_NAME, LEADS_TO,
 *                RECAPTCHA_SITE_KEY, RECAPTCHA_MIN_SCORE,
 *                BREVO_API_KEY (optional fallback)
 */
import { connect } from 'cloudflare:sockets';

const MAX_BODY = 24 * 1024;
const ALLOWED_ACTIONS = new Set(['CONFIDENTIAL_CONTACT', 'CALLBACK_REQUEST']);
const VERIFY_URL = 'https://captcha.accidata.fr/verify';
const CRLF = '\r\n';

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
  const siteKey = env.RECAPTCHA_SITE_KEY;
  if (!siteKey) return { ok: false, reason: 'not_configured' };
  if (!token) return { ok: false, reason: 'missing_token' };

  let data;
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        site_key: siteKey,
        action,
        threshold: Number(env.RECAPTCHA_MIN_SCORE || 0.5),
        remote_ip: remoteip || undefined,
      }),
      signal: AbortSignal.timeout(8000),
    });
    data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: 'api_error', status: res.status };
  } catch (e) {
    return { ok: false, reason: 'api_unreachable' };
  }

  if (data.valid !== true) return { ok: false, reason: data.reason || 'invalid_token', score: data.score };
  if (data.action && data.action !== action) return { ok: false, reason: 'action_mismatch', score: data.score };
  return { ok: true, score: data.score, reasons: data.reasons || [] };
}


const SIGNATURE_HTML = `<table cellpadding="0" cellspacing="0" border="0" width="420" style="border-collapse:collapse;width:420px;margin-top:26px;font-family:Arial,Helvetica,sans-serif;color:#101E2C;font-size:12px;line-height:1.5">
  <tr><td style="padding:18px 0 0 0;border-top:1px solid #E6E0D2">
    <div style="font-size:15px;font-weight:700;color:#101E2C;line-height:1.2">Luc - RAINBOWNET</div>
    <div style="font-size:11px;color:#22364A;margin-top:3px">Private Investigations &amp; Corporate Intelligence</div>
    <div style="font-size:11px;color:#5C6B79;margin-top:9px">Rue Adrien-Lachenal 26 · 1207 Genève · Suisse</div>
    <div style="font-size:11px;color:#5C6B79;margin-top:2px"><a href="mailto:Luc@rainbownet.ch" style="color:#22364A;text-decoration:none">luc@rainbownet.ch</a> · <a href="https://rainbownet.ch" style="color:#22364A;text-decoration:none">rainbownet.ch</a></div>
    <div style="width:36px;height:1px;background:#D9B77A;margin:14px 0 8px 0"></div>
    <div style="font-size:9px;letter-spacing:.14em;color:#8C6B2F;text-transform:uppercase">La discrétion est notre signature.</div>
  </td></tr>
</table>`;

/* ───────────────────────── SMTP (cloudflare:sockets) ───────────────────────── */
const b64utf8 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const b64wrap = (s) => (b64utf8(s).match(/.{1,76}/g) || []).join(CRLF);
const mimeHeader = (s) => (/^[\x20-\x7E]*$/.test(s) ? s : `=?UTF-8?B?${b64utf8(s)}?=`);

async function smtpSend(env, { from, fromName, to, replyTo, subject, html }) {
  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT || 465);
  const timeout = 20000;
  const socket = connect({ hostname: host, port }, { secureTransport: 'on' });
  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();
  const dec = new TextDecoder();
  let buf = '';

  const withTimeout = (p) => Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('SMTP timeout')), timeout)),
  ]);

  async function line() {
    for (;;) {
      const i = buf.indexOf(CRLF);
      if (i >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 2); return l; }
      const { value, done } = await withTimeout(reader.read());
      if (done) throw new Error('SMTP: connexion fermée');
      buf += dec.decode(value, { stream: true });
    }
  }
  async function expect(codes) {
    for (let i = 0; i < 80; i++) {
      const l = await line();
      if (/^\d{3} /.test(l)) {
        const code = l.slice(0, 3);
        if (codes.includes(code)) return l;
        throw new Error(`SMTP ${code}: ${l.slice(0, 180)}`);
      }
    }
    throw new Error('SMTP: réponse illisible');
  }
  async function send(s) { await withTimeout(writer.write(new TextEncoder().encode(s))); }
  async function cmd(s, codes) { await send(s + CRLF); return expect(codes); }

  try {
    await expect(['220']);
    await cmd('EHLO rainbownet.ch', ['250']);
    await cmd('AUTH LOGIN', ['334']);
    await cmd(b64utf8(env.SMTP_USER), ['334']);
    await cmd(b64utf8(env.SMTP_PASS), ['235']);
    await cmd(`MAIL FROM:<${from}>`, ['250']);
    await cmd(`RCPT TO:<${to}>`, ['250', '251']);
    await cmd('DATA', ['354']);

    const message = [
      `From: ${mimeHeader(fromName)} <${from}>`,
      `To: <${to}>`,
      replyTo ? `Reply-To: ${mimeHeader(replyTo.name || '')} <${replyTo.email}>` : '',
      `Subject: ${mimeHeader(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@rainbownet.ch>`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      'Auto-Submitted: auto-generated',
      '',
      b64wrap(html),
    ].filter((l) => l !== '').join(CRLF);

    await send(message + CRLF + '.' + CRLF);
    const done = await expect(['250']);
    try { await cmd('QUIT', ['221']); } catch (e) { /* la fermeture peut couper avant */ }
    return { ok: true, detail: done.slice(0, 120) };
  } finally {
    try { writer.releaseLock(); } catch (e) {}
    try { reader.releaseLock(); } catch (e) {}
    try { await socket.close(); } catch (e) {}
  }
}

async function brevo(env, payload) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const out = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: out };
}

async function resendSend(env, mail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${mail.fromName} <${mail.from}>`,
      to: [mail.to],
      reply_to: mail.replyTo ? mail.replyTo.email : undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text || undefined,
    }),
    signal: AbortSignal.timeout(15000),
  });
  const out = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, id: out.id, message: out.message };
}

async function sendMail(env, mail) {
  if (env.RESEND_API_KEY) {
    try {
      const r = await resendSend(env, mail);
      if (r.ok) return { ok: true, voie: 'resend', detail: r.id };
      if (!env.SMTP_HOST && !env.BREVO_API_KEY) return { ok: false, voie: 'resend', status: r.status, message: r.message };
    } catch (e) {
      if (!env.SMTP_HOST && !env.BREVO_API_KEY) return { ok: false, voie: 'resend', status: 0, message: String(e).slice(0, 160) };
    }
  }
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    try {
      const r = await smtpSend(env, mail);
      return { ok: true, voie: 'smtp', detail: r.detail };
    } catch (e) {
      const msg = String((e && e.message) || e).slice(0, 200);
      if (!env.BREVO_API_KEY) return { ok: false, voie: 'smtp', status: 0, message: msg };
      const secours = await brevo(env, {
        sender: { name: mail.fromName, email: mail.from },
        to: [{ email: mail.to }],
        replyTo: mail.replyTo || undefined,
        subject: mail.subject,
        htmlContent: mail.html,
      });
      return { ok: secours.ok, voie: 'brevo (secours)', status: secours.status, message: msg };
    }
  }
  if (env.BREVO_API_KEY) {
    const r = await brevo(env, {
      sender: { name: mail.fromName, email: mail.from },
      to: [{ email: mail.to }],
      replyTo: mail.replyTo || undefined,
      subject: mail.subject,
      htmlContent: mail.html,
    });
    return { ok: r.ok, voie: 'brevo', status: r.status, message: String((r.body && r.body.message) || '').slice(0, 200) };
  }
  return { ok: false, voie: 'aucune', status: 0, message: 'aucun transport configuré' };
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

  const verdict = await verifyRecaptcha(env, String(data.recaptchaToken || ''), action, ip);
  if (!verdict.ok) {
    console.log(`[contact] ref=${ref} recaptcha=reject reason=${verdict.reason} score=${verdict.score ?? '-'}`);
    if (verdict.reason === 'not_configured') return json(503, { ok: false, error: 'verification_not_configured' });
    if (verdict.reason === 'api_unreachable' || verdict.reason === 'api_error') return json(503, { ok: false, error: 'verification_unavailable' });
    return json(403, { ok: false, error: 'verification_failed', message: lang === 'fr' ? 'Nous n’avons pas pu vérifier votre demande. Veuillez réessayer.' : 'We couldn’t verify your request. Please try again.' });
  }
  console.log(`[contact] ref=${ref} recaptcha=ok score=${verdict.score}`);

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

  const mail = {
    from: env.SENDER_EMAIL || 'info@agenceweb4.ch',
    fromName: env.SENDER_NAME || 'RAINBOWNET',
    to: env.LEADS_TO || 'jackmaxima2016@gmail.com',
    replyTo: f.email ? { name: f.name, email: f.email } : null,
    subject,
    html,
    text: rows.map(([k, v]) => `${L[k] || k}: ${v || '-'}`).join('\n') + '\n\nRAINBOWNET - Rue Adrien-Lachenal 26, 1207 Geneve, Suisse - rainbownet.ch',
  };

  const sent = await sendMail(env, mail);
  if (!sent.ok) {
    console.log(`[contact] ref=${ref} mail=reject voie=${sent.voie} status=${sent.status || '-'} msg=${sent.message || ''}`);
    return json(503, { ok: false, error: 'mail_failed' });
  }

  console.log(`[contact] ref=${ref} mail=sent voie=${sent.voie} action=${action}`);
  return json(200, { ok: true, ref });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json(405, { ok: false, error: 'method_not_allowed' });
}
