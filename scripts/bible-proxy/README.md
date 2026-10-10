# Optional Bible proxy

The Load Character box asks lostark.bible for a character's page straight from the visitor's
browser. That works only if Bible's server allows other sites to read its pages (CORS). If the
popover says the browser blocked the request, a small server-side relay is the only fix that keeps
the one-box experience; a static site cannot work around it. `worker.js` is that relay for
Cloudflare Workers (free tier is plenty).

Check first whether you need it: open the calculator page, open the browser console and run

    fetch("https://lostark.bible/character/NA/SomeName").then(r => r.text()).then(t => console.log(t.length, t.includes("loadouts:["))).catch(e => console.error(e))

A number and `true` means direct loading works and you do not need this. A CORS error or
`Failed to fetch` means you do.

## Deploy

1. Cloudflare dashboard, Workers & Pages, Create, Hello World, paste `worker.js`, deploy.
2. Edit `ALLOWED_ORIGINS` in the script if the site is not at https://interlockme.github.io. It also lists `http://127.0.0.1:8000` and `http://localhost:8000` (`mkdocs serve`); add a LAN origin such as `http://192.168.1.20:8000` to test from a phone.
3. Put the Worker's URL in `docs/resources.md`: `data-proxy="https://<name>.<account>.workers.dev/"`
   on the `.bible-import-control` span. Empty means "ask Bible directly".
4. The Worker has no per-IP limit of its own, and a `workers.dev` Worker has no zone, so dashboard rate limiting rules do not apply to it. What limits it is the 15 second edge cache and the free plan's daily request limit.

## Things to know

- Bible's terms and bot protection are not something this repo can check. The Worker identifies
  itself in its User-Agent, caches each character for 15 seconds at the edge (never in the browser), and sends one request per load,
  but Bible may still block it (a Cloudflare challenge page comes back as "No character data").
  Consider asking Bible's developers before pointing real traffic at it.
- It forwards nothing from the visitor (no cookies, no headers) and returns only the character page.
- Without the Worker, the paste-the-page-source route in the popover still works for everyone.
