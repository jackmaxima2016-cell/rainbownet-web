/**
 * Root redirect: `/` has no indexable HTML of its own.
 * Sends visitors to /fr/ or /en/ based on Accept-Language, with a 302
 * so search engines never see a `noindex` page at the domain root.
 */
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname !== '/' && url.pathname !== '/index.html') return next();

  const al = (request.headers.get('accept-language') || '').toLowerCase();
  const french = /(^|,)\s*fr(-[a-z]{2})?(\s*;|\s*,|$)/.test(al);
  const target = french ? '/fr/' : '/en/';

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'Cache-Control': 'no-store, must-revalidate',
      Vary: 'Accept-Language',
    },
  });
}
