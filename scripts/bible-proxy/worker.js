// Optional proxy for the calculator's Load Character box (Cloudflare Worker).
//
// Needed only if the browser cannot read lostark.bible directly (the Load
// Character popover then says the request was blocked). A page on another
// origin can read a response only when the server sends CORS headers for it;
// this Worker fetches the character page server side and returns it with CORS
// headers for the calculator's own origin. See README.md in this folder.
//
// It is deliberately narrow: GET only, one host, a validated region and name,
// no cookies or caller headers forwarded, response size and time capped, and
// CORS granted only to ALLOWED_ORIGINS. It is not an open proxy.

// Origins allowed to call this Worker (scheme + host, no path). The first is the
// live site; the other two are `mkdocs serve` on its default port, so the copy
// pasted into the dashboard also works while previewing locally.
const ALLOWED_ORIGINS = [
  "https://interlockme.github.io",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
];
const BIBLE_ORIGIN = "https://lostark.bible";
const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 10000;
// Edge copy of a character page, kept briefly so repeat loads of one character do
// not each reach Bible. The browser never keeps its own copy (no-store below).
const EDGE_CACHE_SECONDS = 15;

function cors(origin) {
  return {
    "access-control-allow-origin": origin,
    "vary": "Origin",
  };
}

function reply(status, body, origin, extra) {
  return new Response(body, {
    status,
    headers: Object.assign({ "content-type": "text/plain; charset=utf-8" }, origin ? cors(origin) : {}, extra || {}),
  });
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin");
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : null;
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: Object.assign({ "access-control-allow-methods": "GET" }, allowed ? cors(allowed) : {}) });
    }
    if (request.method !== "GET") return reply(405, "GET only", allowed);
    if (!allowed) return reply(403, "Origin not allowed", null);

    const params = new URL(request.url).searchParams;
    const region = params.get("region") || "";
    const name = params.get("name") || "";
    if (!/^[A-Za-z]{2,4}$/.test(region)) return reply(400, "Bad region", allowed);
    if (!name || name.length > 40 || /[\/\\?#%\u0000-\u001f\u007f]/.test(name)) return reply(400, "Bad name", allowed);

    const target = BIBLE_ORIGIN + "/character/" + region.toUpperCase() + "/" + encodeURIComponent(name);
    let res;
    try {
      res = await fetch(target, {
        method: "GET",
        redirect: "follow",
        headers: { "accept": "text/html", "user-agent": "deathblade-guide-calculator-importer" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cf: { cacheTtl: EDGE_CACHE_SECONDS, cacheEverything: true },
      });
    } catch (e) {
      return reply(504, "Bible did not answer", allowed);
    }
    // A redirect must not leave lostark.bible.
    if (new URL(res.url).origin !== BIBLE_ORIGIN) return reply(502, "Unexpected redirect", allowed);
    if (res.status === 404) return reply(404, "Not found", allowed);
    if (res.status === 429) return reply(429, "Bible is rate limiting", allowed);
    if (!res.ok) return reply(502, "Bible answered " + res.status, allowed);

    const declared = Number(res.headers.get("content-length") || 0);
    if (declared > MAX_BYTES) return reply(502, "Response too large", allowed);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return reply(502, "Response too large", allowed);

    return new Response(buf, {
      status: 200,
      headers: Object.assign({
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      }, cors(allowed)),
    });
  },
};
