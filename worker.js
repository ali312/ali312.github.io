const POLARA_HOST = "polara.antoncgi.com";

const POLARA_REWRITES = {
  "/": "/Polara.html",
  "/privacy": "/Polara-privacy.html",
  "/terms": "/Polara-tos.html",
};

const POLARA_CANONICAL_REDIRECTS = {
  "/Polara.html": "/",
  "/Polara-privacy.html": "/privacy",
  "/Polara-tos.html": "/terms",
};

const MAIN_DOMAIN_REDIRECTS = {
  "/Polara.html": "https://polara.antoncgi.com/",
  "/Polara-privacy.html": "https://polara.antoncgi.com/privacy",
  "/Polara-tos.html": "https://polara.antoncgi.com/terms",
  "/polara": "https://polara.antoncgi.com/",
};

function fetchAsset(env, path) {
  // Hostname is ignored by the ASSETS binding; only the path is used.
  return env.ASSETS.fetch(new Request(`https://assets.local${path}`));
}

function withPolaraCacheHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  headers.set("Vary", "Host");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === POLARA_HOST) {
      const canonicalPath = POLARA_CANONICAL_REDIRECTS[url.pathname];
      if (canonicalPath) {
        return Response.redirect(`${url.origin}${canonicalPath}`, 301);
      }

      const rewritePath = POLARA_REWRITES[url.pathname];
      if (rewritePath) {
        return withPolaraCacheHeaders(await fetchAsset(env, rewritePath));
      }

      return env.ASSETS.fetch(request);
    }

    const redirectTarget = MAIN_DOMAIN_REDIRECTS[url.pathname];
    if (redirectTarget) {
      return Response.redirect(redirectTarget, 301);
    }

    if (url.pathname.startsWith("/polara/")) {
      const rest = url.pathname.slice("/polara".length);
      return Response.redirect(`https://polara.antoncgi.com${rest}`, 301);
    }

    return env.ASSETS.fetch(request);
  },
};
