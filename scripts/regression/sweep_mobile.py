#!/usr/bin/env python3
"""
sweep_mobile.py - layout sweep of one page across phone-to-desktop widths.

    python3 scripts/regression/sweep_mobile.py --site site_out
    python3 scripts/regression/sweep_mobile.py --site site_out --widths 320,390 --verbose

The regression baselines record VALUES and TEXT, not layout, so a CSS change can break a phone
layout without `regress.py check` noticing. This is the check for that. Run it after any CSS or
markup change to a widget.

It opens PAGE (default /resources/) in touch emulation at each width, opens every <details> inside
ROOT (default .ap-calc), and reports. The pass runs once per build in --builds (default: the page's
default RE build, then Surge 111 and Surge 333, picked through the docked Build toggle), because the
Surge-only rows (the Engraving section's Raid Captain Variables and its Mana Food checkboxes) are not
in the DOM's visible layout under RE and were never measured:

  FAIL  page-scroll   the page itself scrolls sideways
  FAIL  spill         an element pokes outside the viewport with no scroll container to reach it
  FAIL  clipped       an element with overflow hidden / ellipsis is holding content wider than
                      itself (this is the "columns cut off with no way to reach them" bug), OR a
                      piece of text sticks out past the edge of an ancestor that clips it (a card,
                      or a sideways scroller that is not one of the deliberate table scrollers in
                      SCROLL_OK). Text in a card narrower than its own content is cut off even when
                      the card technically scrolls, which is why scrollers count here.
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
# Substrings of an ANCESTOR's signature that are deliberate sideways scrollers: wide tables whose
# columns are meant to be reached by scrolling. Text running past these is not a finding.
SCROLL_OK = ["ap-acc-table-scroll", "ap-brace-compare-body"]
# Ancestors that clip text today and are accepted for now, counted as known-cut instead of failing.
# .ap-gear-cards: Character Data's two cards keep a hard 400px-per-card floor (their Base AP% row is
# ~392px wide) and scroll sideways on a phone. Shrinking that floor is a layout decision, not a sweep
# fix. The number is printed so it cannot grow unnoticed.
KNOWN = ["ap-gear-cards"]
# Selectors where nothing is excused: no SCROLL_OK, no KNOWN, and the box itself is a clip edge.
STRICT = [".ap-gear-card--engr-variables"]

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
  const spill = [], clipped = [], known = [], tap = [], font = [];
  // Text deliberately pushed out of its own box with a text-indent of one box width or more (an icon
  // that keeps a text node for assistive tech while a mask paints the glyph) is not content that is
  // being cut off, so neither the overflow check nor the clip-edge check should read it.
  const textHidden = (e) => {
    const ti = getComputedStyle(e).textIndent;
    const n = parseFloat(ti);
    return n > 0 && (ti.endsWith('%') ? n >= 100 : n >= e.clientWidth);
  };
  const cutBy = (e) => {
    // Extent of e's own text nodes (or, for a form control, its own box) vs every ancestor that clips
    // sideways. Inside args.strict roots nothing is excused, and the root's own border box counts as a
    // clip edge too, so a control poking out of a card is caught even though a card does not clip.
    if (textHidden(e)) return null;
    const rg = document.createRange();
    let l = Infinity, r = -Infinity;
    if (['INPUT', 'SELECT', 'BUTTON'].includes(e.tagName)) {
      const q = e.getBoundingClientRect(); l = q.left; r = q.right;
    } else {
      for (const n of e.childNodes) {
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        rg.selectNodeContents(n);
        for (const q of rg.getClientRects()) { if (q.width > 0) { l = Math.min(l, q.left); r = Math.max(r, q.right); } }
      }
    }
    if (r === -Infinity) return null;
    const strict = args.strict.length ? e.closest(args.strict.join(',')) : null;
    for (let a = e.parentElement; a && a !== root.parentElement; a = a.parentElement) {
      const o = getComputedStyle(a).overflowX;
      if (o === 'visible' && a !== strict) continue;
      const ar = a.getBoundingClientRect();
      if (ar.width === 0) continue;
      if (r > ar.right + 1 || l < ar.left - 1) {
        // A sideways scroller only reaches content that runs off its RIGHT edge. Anything left of its
        // left edge can never be scrolled to, so that is a finding even under SCROLL_OK / KNOWN.
        const reachable = !strict && l >= ar.left - 1;
        const d = sig(a) + ' (' + (a === strict ? 'strict box' : o) + ') ' + (reachable ? 'edge=' + Math.round(ar.right) + ' item-right=' + Math.round(r)
          : 'left-edge=' + Math.round(ar.left) + ' item-left=' + Math.round(l) + ' (unreachable)');
        if (reachable && args.scrollOk.some(x => sig(a).includes(x))) return null;
        return (reachable && args.known.some(x => sig(a).includes(x)) ? 'KNOWN ' : '') + d;
      }
    }
    return null;
  };
  for (const e of root.querySelectorAll('*')) {
    if (!visible(e)) continue;
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if ((r.right > vw + 1 || r.left < -1) && !scroller(e)) spill.push(sig(e) + ' right=' + Math.round(r.right));
    if (e.scrollWidth > e.clientWidth + 2 && (cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') &&
        e.clientWidth > 0 && !['SELECT', 'INPUT'].includes(e.tagName) && !textHidden(e))
      clipped.push(sig(e) + ' content ' + e.scrollWidth + 'px in ' + e.clientWidth + 'px');
    const cut = cutBy(e);
    if (cut) (cut.startsWith('KNOWN ') ? known : clipped).push(sig(e) + ' \"' + e.textContent.trim().slice(0, 28) + '\" cut by ' + cut.replace('KNOWN ', ''));
    if (['INPUT', 'SELECT', 'BUTTON'].includes(e.tagName) && e.type !== 'hidden') {
      // A checkbox/radio is tapped through its label, so the label's box is the target.
      let tr = r;
      if (e.type === 'checkbox' || e.type === 'radio') {
        const lab = e.closest('label') || (e.id && document.querySelector('label[for="' + e.id + '"]'));
        if (lab) tr = lab.getBoundingClientRect();
        else if (e.parentElement) tr = e.parentElement.getBoundingClientRect();
      }
      const min = (e.type === 'checkbox' || e.type === 'radio') ? 24 : 30;  // WCAG 2.5.8 for a label target
      if (tr.height < min || tr.width < min) tap.push(sig(e) + ' ' + Math.round(tr.width) + 'x' + Math.round(tr.height));
      if (['INPUT', 'SELECT'].includes(e.tagName) && e.type !== 'checkbox' && e.type !== 'radio' && parseFloat(cs.fontSize) < 16)
        font.push(sig(e) + ' ' + cs.fontSize);
    }
  }
  // The element scan above only covers the calculator, and a box can widen the page without any
  // element's own rect leaving the viewport (an opacity: 0 tooltip pseudo-element, a nowrap row).
  // So when the page scrolls sideways, find the cause by measurement: from <body> down, hide each
  // child in turn, and descend into the first one whose removal shrinks the page.
  const wide = [];
  if (out.pageScrollW > vw + 1) {
    const doc = document.documentElement;
    const widthWithout = (e) => {
      const old = e.style.getPropertyValue('display'), pri = e.style.getPropertyPriority('display');
      e.style.setProperty('display', 'none', 'important');
      const w = doc.scrollWidth;
      e.style.removeProperty('display');
      if (old) e.style.setProperty('display', old, pri);
      return w;
    };
    let cur = document.body;
    for (let guard = 0; guard < 40 && cur; guard++) {
      let next = null;
      for (const ch of cur.children) {
        const w = widthWithout(ch);
        if (w < out.pageScrollW) { next = ch; wide.push(sig(ch) + ' (page ' + out.pageScrollW + ' -> ' + w + 'px without it)'); break; }
      }
      cur = next;
    }
  }
  const uniq = (a) => [...new Set(a)];
  out.wide = uniq(wide); out.spill = uniq(spill); out.clipped = uniq(clipped); out.known = uniq(known); out.tap = uniq(tap); out.font = uniq(font);
  return out;
}"""


def select_build(pg, build):
    """Pick a build (re-111, surge-111, ...) through the docked Build toggle, the way a visitor does.

    At phone widths the toggle sits behind a trigger pill that closes again after each choice, so it
    is re-opened before every click. The family chip comes first because the variant chips of the
    other family are hidden.
    """
    family = build.split("-")[0]
    # The dock is display:none while the calculator is scrolled out of view (.ap-build-dock--offscreen),
    # and at 320px the intro wraps enough to push the calculator below the first screen.
    pg.evaluate("document.querySelector('.ap-calc').scrollIntoView({block: 'start'})")
    pg.wait_for_timeout(500)
    for sel in (f'.ap-build-family-chip[data-family="{family}"]', f'.ap-build-variant-chip[data-build="{build}"]'):
        trig = pg.query_selector(".ap-build-dock-trigger")
        if trig and trig.is_visible() and trig.get_attribute("aria-expanded") != "true":
            trig.click()
            pg.wait_for_timeout(300)
        pg.click(sel)
        pg.wait_for_timeout(500)
    pg.wait_for_timeout(700)


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", required=True, help="built site directory (mkdocs build -d ...)")
    ap.add_argument("--page", default="/resources/")
    ap.add_argument("--root", default=".ap-calc")
    ap.add_argument("--widths", default="320,360,390,430,600,768,1024,1400")
    ap.add_argument("--builds", default="default,surge-111,surge-333",
                    help="comma list of builds to sweep in order: default (as loaded) or a data-build id")
    ap.add_argument("--verbose", action="store_true", help="list every finding, not just the first few")
    a = ap.parse_args()
    builds = [x.strip() for x in a.builds.split(",") if x.strip()]
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
        widths = [int(x) for x in a.widths.split(",")]
        for w in widths:
            touch = w < 800
            ctx = browser.new_context(viewport={"width": w, "height": 900}, has_touch=touch, is_mobile=touch)
            pg = ctx.new_page()
            pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith("http://127.0.0.1") else r.abort())
            pg.goto(base + a.page)
            pg.wait_for_selector(a.root, timeout=20000)
            pg.wait_for_timeout(1500)
            if w == widths[0] and not pg.evaluate("[...document.fonts].some(f => f.family.includes('Poppins') && f.status === 'loaded')"):
                print("note: Poppins did not load, so text is measured in a fallback font and runs narrower than in production "
                      "(the privacy plugin only self-hosts the font on a build with network access)")
            for build in builds:
                if build != "default":
                    select_build(pg, build)
                r = pg.evaluate(JS, {"root": a.root, "scrollOk": SCROLL_OK, "known": KNOWN, "strict": STRICT})
                if r.get("missing"):
                    sys.exit(f"root selector {a.root} not found on {a.page}")
                clipped = [c for c in r["clipped"] if not any(x in c for x in ALLOW)]
                page_scroll = r["pageScrollW"] > r["vw"] + 1
                bad = page_scroll or r["spill"] or clipped
                failed |= bool(bad)
                print(f"{'FAIL' if bad else 'ok  '} {w:>4}px {build:<10} page-scroll={'YES' if page_scroll else 'no'}  "
                      f"spill={len(r['spill'])}  clipped={len(clipped)}  known-cut={len(r['known'])}  small-font={len(r['font'])}  small-tap={len(r['tap'])}")
                if r["wide"]:
                    print(f"        page-wide cause: {r['wide'][-1]}")
                    print(f"        page-wide path:  " + " > ".join(x.split(" (page ")[0] for x in r["wide"]))
                limit = None if a.verbose else 5
                for label, items in (("spill", r["spill"]), ("clipped", clipped)):
                    for it in items[:limit]:
                        print(f"        {label}: {it}")
                if a.verbose:
                    for label, items in (("small-font", r["font"]), ("small-tap", r["tap"])):
                        for it in items:
                            print(f"        {label}: {it}")
                    for it in r["known"]:
                        print(f"        known-cut: {it}")
            ctx.close()
        browser.close()
    srv.shutdown()
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
