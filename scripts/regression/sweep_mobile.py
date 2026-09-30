#!/usr/bin/env python3
"""
sweep_mobile.py - layout sweep of one page across phone-to-desktop widths.

    python3 scripts/regression/sweep_mobile.py --site site_out
    python3 scripts/regression/sweep_mobile.py --site site_out --widths 320,390 --verbose

The regression baselines record VALUES and TEXT, not layout, so a CSS change can break a phone
layout without `regress.py check` noticing. This is the check for that. Run it after any CSS or
markup change to a widget.

It opens PAGE (default /resources/) in touch emulation at each width, opens every <details> inside
ROOT (default .ap-calc), and reports:

  FAIL  page-scroll   the page itself scrolls sideways
  FAIL  spill         an element pokes outside the viewport with no scroll container to reach it
  FAIL  clipped       an element with overflow hidden / ellipsis is holding content wider than
                      itself (this is the "columns cut off with no way to reach them" bug)
  warn  small-font    input/select text under 16px (iOS Safari zooms the page when one is focused)
  warn  small-tap     input/select/button under 30px in width or height

Only the FAIL lines set a non-zero exit code. The warnings are counted, and listed with --verbose,
because some (tiny decorative controls) are deliberate. Known and accepted clipping (for example an
ellipsized title) goes in ALLOW below, matched against the element signature.

Serves the built site itself. Needs: pip install playwright && playwright install chromium
"""
import argparse
import functools
import http.server
import pathlib
import socketserver
import sys
import threading

ALLOW = []  # substrings of an element signature that are allowed to clip, e.g. "ap-summary-value"

JS = r"""(args) => {
  const root = document.querySelector(args.root);
  if (!root) return { missing: true };
  root.querySelectorAll('details').forEach(d => d.open = true);
  const vw = document.documentElement.clientWidth;
  const out = { vw, pageScrollW: document.documentElement.scrollWidth };
  const scroller = (e) => {
    for (let p = e.parentElement; p && p !== root.parentElement; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === 'auto' || o === 'scroll') return p;
    }
    return null;
  };
  const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const sig = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + [...e.classList].slice(0, 2).join('.');
  const spill = [], clipped = [], tap = [], font = [];
  for (const e of root.querySelectorAll('*')) {
    if (!visible(e)) continue;
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if ((r.right > vw + 1 || r.left < -1) && !scroller(e)) spill.push(sig(e) + ' right=' + Math.round(r.right));
    if (e.scrollWidth > e.clientWidth + 2 && (cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') &&
        e.clientWidth > 0 && !['SELECT', 'INPUT'].includes(e.tagName))
      clipped.push(sig(e) + ' content ' + e.scrollWidth + 'px in ' + e.clientWidth + 'px');
    if (['INPUT', 'SELECT', 'BUTTON'].includes(e.tagName) && e.type !== 'hidden') {
      if (r.height < 30 || r.width < 30) tap.push(sig(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      if (['INPUT', 'SELECT'].includes(e.tagName) && e.type !== 'checkbox' && e.type !== 'radio' && parseFloat(cs.fontSize) < 16)
        font.push(sig(e) + ' ' + cs.fontSize);
    }
  }
  const uniq = (a) => [...new Set(a)];
  out.spill = uniq(spill); out.clipped = uniq(clipped); out.tap = uniq(tap); out.font = uniq(font);
  return out;
}"""


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", required=True, help="built site directory (mkdocs build -d ...)")
    ap.add_argument("--page", default="/resources/")
    ap.add_argument("--root", default=".ap-calc")
    ap.add_argument("--widths", default="320,360,390,430,600,768,1024,1400")
    ap.add_argument("--verbose", action="store_true", help="list every finding, not just the first few")
    a = ap.parse_args()
    site = pathlib.Path(a.site).resolve()
    if not (site / a.page.strip("/") / "index.html").exists():
        sys.exit(f"{site}{a.page}index.html not found; run mkdocs build -d {a.site} first")

    from playwright.sync_api import sync_playwright
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=str(site)))
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}"

    failed = False
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for w in [int(x) for x in a.widths.split(",")]:
            touch = w < 800
            ctx = browser.new_context(viewport={"width": w, "height": 900}, has_touch=touch, is_mobile=touch)
            pg = ctx.new_page()
            pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith("http://127.0.0.1") else r.abort())
            pg.goto(base + a.page)
            pg.wait_for_selector(a.root, timeout=20000)
            pg.wait_for_timeout(1500)
            r = pg.evaluate(JS, {"root": a.root})
            ctx.close()
            if r.get("missing"):
                sys.exit(f"root selector {a.root} not found on {a.page}")
            clipped = [c for c in r["clipped"] if not any(x in c for x in ALLOW)]
            page_scroll = r["pageScrollW"] > r["vw"] + 1
            bad = page_scroll or r["spill"] or clipped
            failed |= bool(bad)
            print(f"{'FAIL' if bad else 'ok  '} {w:>4}px  page-scroll={'YES' if page_scroll else 'no'}  spill={len(r['spill'])}  "
                  f"clipped={len(clipped)}  small-font={len(r['font'])}  small-tap={len(r['tap'])}")
            limit = None if a.verbose else 5
            for label, items in (("spill", r["spill"]), ("clipped", clipped)):
                for it in items[:limit]:
                    print(f"        {label}: {it}")
            if a.verbose:
                for label, items in (("small-font", r["font"]), ("small-tap", r["tap"])):
                    for it in items:
                        print(f"        {label}: {it}")
        browser.close()
    srv.shutdown()
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
