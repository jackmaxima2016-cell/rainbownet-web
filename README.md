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
2. reCAPTCHA Enterprise assessment (token, action, score) — **fail closed**
3. Brevo transactional email to `CONTACT_TO_EMAIL`

Without `RECAPTCHA_*` / `BREVO_API_KEY` / `CONTACT_*` variables the endpoint returns **503** rather than
silently accepting unverified submissions. See `.dev.vars.example`.

## Before launch

- [ ] fill legal identity (company name, address, UID, VAT) in `src/content/pages.ts`
- [ ] set `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` and verify the sender in Brevo
- [ ] create the reCAPTCHA Enterprise key + API key, set all `RECAPTCHA_*` variables
- [ ] attach `rainbownet.ch` + `www` to the Pages project (DNS A records currently point to an unreachable host)
- [ ] remove the temporary `[à compléter]` placeholders once supplied
