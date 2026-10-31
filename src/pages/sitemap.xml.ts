import type { APIRoute } from 'astro';
import services from '../content/services.json';
import cities from '../content/cities.json';
import insights from '../content/insights.json';

const BASE = 'https://rainbownet.ch';
const X_DEFAULT = '/en/'; // must match <link rel="alternate" hreflang="x-default"> in <head>

type Pair = { fr: string; en: string; lastmod?: string };

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = () => {
  const pairs: Pair[] = [
    { fr: '/fr/', en: '/en/' },
    { fr: '/fr/about/', en: '/en/about/' },
    { fr: '/fr/approach/', en: '/en/approach/' },
    { fr: '/fr/services/', en: '/en/services/' },
    { fr: '/fr/pricing/', en: '/en/pricing/' },
    { fr: '/fr/coverage/', en: '/en/coverage/' },
    { fr: '/fr/confidentiality/', en: '/en/confidentiality/' },
    { fr: '/fr/insights/', en: '/en/insights/' },
    { fr: '/fr/contact/', en: '/en/contact/' },
    { fr: '/fr/legal/legal-notice/', en: '/en/legal/legal-notice/' },
    { fr: '/fr/legal/privacy/', en: '/en/legal/privacy/' },
    { fr: '/fr/legal/cookies/', en: '/en/legal/cookies/' },
  ];

  for (const s of services as any[]) pairs.push({ fr: `/fr/services/${s.slug}/`, en: `/en/services/${s.slug}/` });
  for (const c of cities as any[]) pairs.push({ fr: `/fr/locations/${c.slug}/`, en: `/en/locations/${c.slug}/` });
  for (const a of insights as any[]) {
    const lastmod = a.date ? String(a.date).slice(0, 10) : undefined;
    pairs.push({ fr: `/fr/insights/${a.slug}/`, en: `/en/insights/${a.slug}/`, lastmod });
  }

  const entry = (loc: string, pair: Pair) => `  <url>
    <loc>${esc(BASE + loc)}</loc>${pair.lastmod ? `\n    <lastmod>${esc(pair.lastmod)}</lastmod>` : ''}
    <xhtml:link rel="alternate" hreflang="fr-CH" href="${esc(BASE + pair.fr)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${esc(BASE + pair.en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(BASE + X_DEFAULT)}"/>
  </url>`;

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pairs.map((p) => entry(p.fr, p) + '\n' + entry(p.en, p)).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
