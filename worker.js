const POLARA_HOST = "polara.antoncgi.com";

const POLARA_REWRITES = {
  "/": "/Polara.html",
  "/privacy": "/Polara-privacy.html",
  "/terms": "/Polara-tos.html",
};

const MAIN_DOMAIN_REDIRECTS = {
  "/Polara.html": "https://polara.antoncgi.com/",
  "/Polara-privacy.html": "https://polara.antoncgi.com/privacy",
  "/Polara-tos.html": "https://polara.antoncgi.com/terms",
  "/polara": "https://polara.antoncgi.com/",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === POLARA_HOST) {
      if (url.pathname === "/Polara.html") {
        return Response.redirect(`${url.origin}/`, 301);
      }

      const rewritePath = POLARA_REWRITES[url.pathname];
      if (rewritePath) {
        const assetUrl = new URL(request.url);
        assetUrl.pathname = rewritePath;
        return env.ASSETS.fetch(new Request(assetUrl, request));
      }
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
