import type { APIRoute } from 'astro';
import services from '../content/services.json';
import cities from '../content/cities.json';
import insights from '../content/insights.json';

const BASE = 'https://rainbownet.ch';

export const GET: APIRoute = () => {
  const paths: { fr: string; en: string }[] = [
    { fr: '/fr/', en: '/en/' },
    { fr: '/fr/about/', en: '/en/about/' },
    { fr: '/fr/approach/', en: '/en/approach/' },
    { fr: '/fr/services/', en: '/en/services/' },
    { fr: '/fr/coverage/', en: '/en/coverage/' },
    { fr: '/fr/confidentiality/', en: '/en/confidentiality/' },
    { fr: '/fr/insights/', en: '/en/insights/' },
    { fr: '/fr/contact/', en: '/en/contact/' },
    { fr: '/fr/legal/legal-notice/', en: '/en/legal/legal-notice/' },
    { fr: '/fr/legal/privacy/', en: '/en/legal/privacy/' },
    { fr: '/fr/legal/cookies/', en: '/en/legal/cookies/' },
  ];
  for (const s of services as any[]) paths.push({ fr: `/fr/services/${s.slug}/`, en: `/en/services/${s.slug}/` });
  for (const c of cities as any[]) paths.push({ fr: `/fr/locations/${c.slug}/`, en: `/en/locations/${c.slug}/` });
  for (const a of insights as any[]) paths.push({ fr: `/fr/insights/${a.slug}/`, en: `/en/insights/${a.slug}/` });

  const urls = paths.flatMap((p) => [p.fr, p.en]);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths.map((p) => `  <url>
    <loc>${BASE}${p.fr}</loc>
    <xhtml:link rel="alternate" hreflang="fr-CH" href="${BASE}${p.fr}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE}${p.en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${p.fr}"/>
  </url>
  <url>
    <loc>${BASE}${p.en}</loc>
    <xhtml:link rel="alternate" hreflang="fr-CH" href="${BASE}${p.fr}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE}${p.en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${p.fr}"/>
  </url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
