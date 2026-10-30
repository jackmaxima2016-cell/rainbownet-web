# RAINBOWNET — website

Bilingual (FR/EN) corporate site for RAINBOWNET, private investigations and corporate intelligence, Geneva.

- Stack: Astro 5 (static) + Cloudflare Pages Functions
- Deploy: `npm run deploy` → project `rainbownet-web` (`rainbownet-web.pages.dev`)
- Domain: `rainbownet.ch` is **not** attached yet; validation happens on the `*.pages.dev` URL.

## Commands

```bash
npm install
npm run dev        # local dev
npm run build      # static build into dist/
npm run deploy     # build + wrangler pages deploy (needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID)
```

## Content

- `src/content/site.ts` — brand, navigation, UI strings, home copy
- `src/content/services.json` — 4 service pages (FR/EN)
- `src/content/cities.json` — 11 location pages (FR/EN)
- `src/content/insights.json` — 7 articles (FR/EN)
- `src/content/pages.ts` — about, approach, confidentiality, coverage, contact, legal
- `src/content/images.json` — responsive image variants (generated)
- `src/content/image-credits.json` — Pexels credits

## Assets

- `scripts/fetch_images.py` — downloads licensed Pexels photography and renders WebP variants
- `scripts/fetch_fonts.py` — self-hosted Manrope/Inter WOFF2 subsets
- `scripts/build_map.py` — builds the Europe SVG map from public GeoJSON

## Forms

`functions/api/contact.js` handles both the six-step case assessment and the callback request:

1. server-side validation, honeypot, per-IP throttle
2. reCAPTCHA Enterprise assessment through the VPS relay (`captcha.accidata.fr/verify`,
   service account) — **fail closed**
3. transactional email through **Resend** from `Luc@rainbownet.ch` to `jackmaxima2016@gmail.com`,
   with the cPanel SMTP relay as fallback

Configured values: see `.dev.vars.example`. Without `SMTP_*` or `BREVO_API_KEY`, the endpoint
returns **503** rather than silently accepting unverified submissions.

## Before launch

- [ ] attach `rainbownet.ch` + `www` to the Pages project (the apex currently points to an
      unreachable host and answers 522)
- [ ] replace the "IDE / TVA en cours de création" wording in the legal notice once issued
- [ ] add SPF/DKIM/DMARC for `rainbownet.ch` when mailboxes move to the domain

