#!/usr/bin/env python3
"""
smoke.py - sitewide interaction smoke test for everything that is NOT the calculator.

    python3 scripts/regression/smoke.py --site site_out
    python3 scripts/regression/smoke.py --site site_out --pages /surge/111-classic/ --verbose

regress.py pins the calculator and the importer. The sitewide handlers (extra.js, the tooltip
engine, rotation-practice.js, image-lightbox.js, Material's tabs and <details>) had no test at all,
and three bugs in one session came from there (every tab dead because the anchor handler swallowed
the click, practice-mode Space advancing a step on the focused Exit button, the title permalink
losing its hash). This drives each of them like a visitor would and asserts on the result.

Per page, at desktop width:
  load       no JS errors, no failed local requests, no sideways page scroll, every widget wrapper
             (skill-setup, ark-passives, gem-priority, ...) holds content
  tabs       click every tab label of every tab group, nested groups included: its radio becomes
             checked and its panel shows
  details    click every <details> summary open and shut
  anchors    click heading permalinks, quick-jump pills, TOC links: the hash
             lands, the page is not refetched, the heading sits under the sticky header
  skip-links Tab to a section's skip link (shown on focus), Enter: focus lands on the next heading and the
             next Tab continues inside that section
  tooltips   hover, click and keyboard-focus a sample of triggers: panel shows with content and stays
             inside the viewport, a mouse click does not pin it, it closes again
  ark cores  hover opens, click does not pin
  lightbox   click and Enter open, Escape closes and returns focus, scroll lock comes and goes
  practice   toggle, Space advances, Space on the focused button exits, Escape exits, Space is left
             alone when the line is scrolled off-screen
At 390px with touch emulation: no sideways scroll, anchors, and tap open / tap close / swap /
tap-outside on tooltips and Ark Cores.
Then a run of instant-navigation hops: no refetch, widgets re-render, exactly one pill row, no orphaned tooltip panels.

Only FAIL lines set a non-zero exit code. Serves the built site itself.
Needs: pip install playwright && playwright install chromium
"""
import argparse
import functools
import http.server
import pathlib
import re
import socketserver
import sys
import threading

# Widget wrappers that must never be empty after render. A broken parser leaves the wrapper in the
# DOM with nothing in it, which a "does the element exist" check cannot see.
WIDGETS = [
    ".skill-setup[data-family]",
    ".ark-passives",
    ".ark-cores",
    ".gem-priority",
    ".dps-chart[data-values]",
    ".skills-table[data-family]",
    ".build-compare[data-family]",
    ".rotation-line",
]

MOUSE_PARK = (2, 2)
HOVER_WAIT = 350       # tooltip hover-open settle
CLOSE_WAIT = 480       # HOVER_CLOSE_DELAY_MS (250) plus the 0.15s visibility delay, with margin
MAX_TIPS = 6           # tooltip triggers sampled per page


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def site_prefix(site):
    """Path the site is published under (/deathblade for https://x.github.io/deathblade/), read from
    sitemap.xml. Material's instant navigation only intercepts a link whose path is in the sitemap, so
    serving a project-page site from / would silently turn every hop into a full page load."""
    sm = pathlib.Path(site) / "sitemap.xml"
    if sm.exists():
        m = re.search(r"<loc>https?://[^/<]+(/[^<]*?)/?</loc>", sm.read_text(encoding="utf-8"))
        if m:
            return m.group(1).rstrip("/")
    return ""


def serve(site):
    prefix = site_prefix(site)

    sm_origin = None
    sm = pathlib.Path(site) / "sitemap.xml"
    if sm.exists():
        m = re.search(r"<loc>(https?://[^/<]+)", sm.read_text(encoding="utf-8"))
        sm_origin = m.group(1) if m else None

    class Handler(_Quiet):
        def do_GET(self):
            # Material builds its instant-navigation allow-list from sitemap.xml and matches it by full
            # URL, so a sitemap naming the production origin never matches a local link. Point it here.
            if sm_origin and self.path.split("?")[0] == prefix + "/sitemap.xml":
                host, port = self.server.server_address[:2]
                body = sm.read_text(encoding="utf-8").replace(sm_origin, f"http://{host}:{port}").encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/xml")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            super().do_GET()

        def translate_path(self, path):
            if prefix and path.startswith(prefix):
                path = path[len(prefix):] or "/"
            return super().translate_path(path)

    handler = functools.partial(Handler, directory=str(site))
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}{prefix}"


def find_pages(site):
    out = []
    for idx in sorted(pathlib.Path(site).rglob("index.html")):
        rel = idx.parent.relative_to(site).as_posix()
        out.append("/" if rel == "." else "/" + rel + "/")
    return [p for p in out if not p.startswith("/search") and not p.startswith("/assets")]


# ---------------------------------------------------------------------------------------------
# In-page helpers
# ---------------------------------------------------------------------------------------------
TIP_STATE_JS = r"""(el) => {
  const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  const tips = ids.map(i => document.getElementById(i)).filter(Boolean);
  const vw = document.documentElement.clientWidth;
  let best = null;
  for (const t of tips) {
    const cs = getComputedStyle(t), r = t.getBoundingClientRect();
    const shown = cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.9 && r.width > 0 && r.height > 0;
    const s = { shown, text: (t.textContent || '').trim().length, left: r.left, right: r.right, vw, tips: tips.length };
    if (!best || shown) best = s;
  }
  return best || { shown: false, text: 0, left: 0, right: 0, vw, tips: 0 };
}"""

VISIBLE_JS = r"""(el) => {
  const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
  const vw = document.documentElement.clientWidth;
  return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.right > 0 && r.left < vw;
}"""


class Run:
    def __init__(self, base, verbose):
        self.base = base
        self.verbose = verbose
        self.fails = []
        self.notes = []
        self.counts = {}

    def fail(self, page, msg):
        self.fails.append(f"FAIL  {page}  {msg}")

    def ok(self, key, n=1):
        self.counts[key] = self.counts.get(key, 0) + n

    def note(self, msg):
        if self.verbose:
            self.notes.append("      " + msg)


def attach_listeners(pg, run, path):
    def on_err(e):
        run.fail(path, f"JS error: {str(e)[:160]}")

    def on_console(m):
        if m.type == "error" and "Failed to load resource" not in m.text:
            run.fail(path, f"console error: {m.text[:160]}")

    def on_failed(req):
        if req.url.startswith(run.base):
            run.fail(path, f"request failed: {req.url.replace(run.base, '')}")

    pg.on("pageerror", on_err)
    pg.on("console", on_console)
    pg.on("requestfailed", on_failed)
    pg.on("response", lambda r: run.fail(path, f"HTTP {r.status}: {r.url.replace(run.base, '')}")
          if r.url.startswith(run.base) and r.status >= 400 else None)


CENTER_JS = "e => e.scrollIntoView({block: 'center', inline: 'nearest'})"


def center(el):
    """Scroll an element to mid-screen: Playwright's own scroll can leave it under the sticky header."""
    try:
        el.evaluate(CENTER_JS)
    except Exception:
        pass


def visible(el):
    try:
        return el.evaluate(VISIBLE_JS)
    except Exception:
        return False


def tip_state(el):
    return el.evaluate(TIP_STATE_JS)


# ---------------------------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------------------------
def check_load(pg, run, path, tag):
    sw = pg.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
    if sw[0] > sw[1] + 1:
        run.fail(path, f"[{tag}] page scrolls sideways ({sw[0]}px in {sw[1]}px)")
    else:
        run.ok("no-sideways-scroll")
    blank = pg.evaluate("""(sels) => {
      const out = [];
      for (const s of sels) document.querySelectorAll(s).forEach((e, i) => {
        const has = (e.textContent || '').trim().length > 0 || e.querySelector('svg, img');
        if (!has) out.push(s + ' #' + i);
      });
      return out;
    }""", WIDGETS)
    for b in blank:
        run.fail(path, f"[{tag}] widget rendered blank: {b}")
    run.ok("widgets-nonblank", len(WIDGETS) - len(blank))


def check_tabs(pg, run, path):
    n_sets = pg.locator(".tabbed-set").count()
    if not n_sets:
        return
    done = set()

    def test_set(i):
        done.add(i)
        ts = pg.locator(".tabbed-set").nth(i)
        labels = ts.locator(":scope > .tabbed-labels > label")
        n = labels.count()
        for j in range(n):
            lab = labels.nth(j)
            if not visible(lab):
                run.note(f"tab set {i} label {j} not visible, skipped")
                continue
            lab.click()
            pg.wait_for_timeout(60)
            checked = ts.locator(":scope > input").nth(j).evaluate("e => e.checked")
            block = ts.locator(":scope > .tabbed-content > .tabbed-block").nth(j)
            if not checked:
                run.fail(path, f"tab {j + 1} of group {i + 1} did not switch when clicked ({lab.inner_text()[:30]!r})")
            elif not visible(block):
                run.fail(path, f"tab {j + 1} of group {i + 1} is checked but its panel is not showing")
            else:
                run.ok("tabs")
            for k in range(n_sets):
                if k not in done and visible(pg.locator(".tabbed-set").nth(k).locator(":scope > .tabbed-labels > label").first):
                    test_set(k)
        if n and visible(labels.first):
            labels.first.click()

    for i in range(n_sets):
        if i not in done and visible(pg.locator(".tabbed-set").nth(i).locator(":scope > .tabbed-labels > label").first):
            test_set(i)


def check_details(pg, run, path):
    dets = pg.locator("details")
    for i in range(dets.count()):
        d = dets.nth(i)
        s = d.locator(":scope > summary")
        if not s.count() or not visible(s.first):
            continue
        if s.first.evaluate("e => getComputedStyle(e).pointerEvents === 'none'"):
            continue  # a card that is deliberately always open (e.g. .engraving-card)
        before = d.evaluate("e => e.open")
        center(s.first)
        s.first.click()
        after = d.evaluate("e => e.open")
        if after == before:
            run.fail(path, f"<details> #{i + 1} did not toggle on summary click")
            continue
        if before:  # was open: leave it open
            center(s.first)
            s.first.click()
        run.ok("details")
    # leave everything open so later checks reach nested widgets
    pg.evaluate("() => document.querySelectorAll('details').forEach(d => d.open = true)")


def anchor_click(pg, run, path, el, label, tag):
    """Click a same-page link and assert the three things that have broken before."""
    href_hash = el.evaluate("e => e.hash")
    target_id = href_hash[1:]
    pg.evaluate("() => { window.__smoke = 'same-document'; }")
    pg.evaluate("window.scrollTo(0, 0)")
    pg.wait_for_timeout(50)
    if not visible(el):
        return
    try:
        center(el)
        el.click(timeout=3000)
    except Exception as exc:
        run.fail(path, f"[{tag}] {label}: could not be clicked ({str(exc).splitlines()[0][:80]})")
        return
    pg.wait_for_timeout(500)  # past the 400ms hash restore in handleJumpLinkClick
    state = pg.evaluate("""(id) => {
      const t = document.getElementById(decodeURIComponent(id));
      const h = document.querySelector('.md-header');
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return { marker: window.__smoke, hash: location.hash,
               top: t ? t.getBoundingClientRect().top : null,
               header: h ? h.offsetHeight : 0, atBottom: window.scrollY >= max - 2 };
    }""", target_id)
    if state["marker"] != "same-document":
        run.fail(path, f"[{tag}] {label}: page was refetched instead of scrolled in place")
        return
    if state["hash"] != href_hash:
        run.fail(path, f"[{tag}] {label}: hash is {state['hash']!r}, expected {href_hash!r}")
        return
    if state["top"] is None:
        run.fail(path, f"[{tag}] {label}: no element with id {target_id!r}")
        return
    want = state["header"] + 20
    if not state["atBottom"] and abs(state["top"] - want) > 6:
        run.fail(path, f"[{tag}] {label}: heading at {state['top']:.0f}px, expected about {want}px under the sticky header")
        return
    run.ok("anchors")


def check_anchors(pg, run, path, tag):
    # Heading permalinks (the page title's included), then pills and TOC links.
    links = pg.locator("h1 > .headerlink, h2 > .headerlink, h3 > .headerlink")
    for i in range(min(links.count(), 6)):
        el = links.nth(i)
        heading = el.evaluate("e => e.parentElement.tagName + ' ' + e.parentElement.id")
        el.evaluate("e => e.parentElement.scrollIntoView({block: 'center'})")
        anchor_click(pg, run, path, el, f"permalink {heading}", tag)
    groups = [(".quick-jump-pills a", "quick-jump pill")]
    if tag == "1300":  # at phone width the TOC lives in an off-canvas drawer
        groups.append((".md-sidebar a.md-nav__link[href*='#']", "TOC link"))
    for sel, name in groups:
        els = pg.locator(sel)
        for i in range(min(els.count(), 3)):
            el = els.nth(i)
            if visible(el):
                anchor_click(pg, run, path, el, f"{name} {i + 1}", tag)


def check_skip_links(pg, run, path):
    """Section skip links: one before the first section and one after each section's heading except the
    last, hidden at rest, shown on keyboard focus, and activating one moves focus to the target heading
    so the next Tab starts inside that section."""
    info = pg.evaluate("""() => {
      const heads = [...document.querySelectorAll('.md-content__inner > h2[id]')];
      const links = [...document.querySelectorAll('.md-content__inner .section-skip')];
      return { heads: heads.map(h => h.id), links: links.map(a => a.getAttribute('href')),
               firstIsIntro: !!links.length && links[0].parentElement.firstElementChild === links[0] };
    }""")
    n = len(info["heads"])
    if n < 2:
        if info["links"]:
            run.fail(path, f"skip links: {len(info['links'])} links on a page with {n} sections")
        return
    want = ["#" + info["heads"][0]] + ["#" + h for h in info["heads"][1:]]
    if info["links"] != want:
        run.fail(path, f"skip links: expected targets {want}, found {info['links']}")
        return
    if not info["firstIsIntro"]:
        run.fail(path, "skip links: the intro link is not the first element of the article")
    # Hidden at rest: no visible box, no effect on the page width.
    rest = pg.evaluate("""() => { const a = document.querySelector('.section-skip'); const r = a.getBoundingClientRect();
      return { w: r.width, h: r.height, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }; }""")
    if rest["w"] > 2 or rest["h"] > 2:
        run.fail(path, f"skip links: a link is visible at rest ({rest['w']:.0f}x{rest['h']:.0f})")
    if rest["sw"] > rest["cw"]:
        run.fail(path, f"skip links: page scrolls sideways ({rest['sw']}px in {rest['cw']}px)")
    # Drive the middle link (or the first section's when there are two) with the keyboard only.
    i = max(1, n // 2) - 1 if n > 2 else 0
    head_id, next_id = info["heads"][i], info["heads"][i + 1]
    pg.evaluate("(id) => { const h = document.getElementById(id); h.scrollIntoView({block: 'center'}); h.querySelector('.headerlink').focus(); }", head_id)
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(400)  # past the link's colour transition, so fg/bg are the settled values
    st = pg.evaluate("""(id) => { const a = document.activeElement; const r = a.getBoundingClientRect(); const cs = getComputedStyle(a);
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const lum = (c) => { const v = c.match(/[\\d.]+/g).slice(0, 3).map(Number).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
      const l1 = lum(cs.color), l2 = lum(cs.backgroundColor);
      return { cls: a.className, href: a.getAttribute('href'), w: r.width, h: r.height, left: r.left, right: r.right, top: r.top,
               vw: document.documentElement.clientWidth, bg: cs.backgroundColor, fg: cs.color,
               onTop: hit === a, contrast: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) }; }""", head_id)
    if "section-skip" not in st["cls"] or st["href"] != "#" + next_id:
        run.fail(path, f"skip links: Tab from the {head_id} heading did not reach its skip link (got {st['cls']!r} {st['href']!r})")
        return
    if st["w"] < 50 or st["h"] < 20 or st["left"] < 0 or st["right"] > st["vw"] or st["top"] < 0:
        run.fail(path, f"skip links: the focused link is not fully visible ({st['w']:.0f}x{st['h']:.0f} at {st['left']:.0f},{st['top']:.0f})")
    if not st["onTop"]:
        run.fail(path, "skip links: the focused link is covered by another element (stacking context below the header?)")
    if st["contrast"] < 4.5:
        run.fail(path, f"skip links: the focused link text has contrast {st['contrast']:.1f}:1 ({st['fg']} on {st['bg']})")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(500)
    after = pg.evaluate("""(id) => { const t = document.getElementById(id); const r = t.getBoundingClientRect();
      return { onTarget: document.activeElement === t, top: r.top, hash: location.hash }; }""", next_id)
    if not after["onTarget"]:
        run.fail(path, f"skip links: Enter did not move focus to the {next_id} heading")
        return
    if not (0 <= after["top"] <= 260) or after["hash"] != "#" + next_id:
        run.fail(path, f"skip links: after Enter the heading is at {after['top']:.0f}px with hash {after['hash']!r}")
    pg.keyboard.press("Tab")
    nxt = pg.evaluate("""(id) => { const t = document.getElementById(id); const a = document.activeElement;
      return { after: a !== t && !!(t.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING), cls: a.className }; }""", next_id)
    if not nxt["after"]:
        run.fail(path, f"skip links: Tab after the jump did not continue from the {next_id} heading")
        return
    run.ok("skip-links")


def safe(fn, pg, run, path, *a):
    """Run one check; a Playwright timeout or error becomes a FAIL line, not a crash."""
    try:
        fn(pg, run, path, *a)
    except Exception as exc:
        run.fail(path, f"{fn.__name__} crashed: {str(exc).splitlines()[0][:140]}")


def sample(n_total, k):
    if n_total <= k:
        return list(range(n_total))
    return sorted({round(i * (n_total - 1) / (k - 1)) for i in range(k)})


def trigger_sig(el):
    return el.evaluate("e => e.tagName + '.' + [...e.classList].filter(c => !c.startsWith('skill-tip')).slice(0, 2).join('.')")


def check_tooltips_desktop(pg, run, path):
    trig = pg.locator(".skill-tip-wired:not(.ap-calc *)")
    total = trig.count()
    shown = [i for i in range(total) if visible(trig.nth(i))]
    # One per kind first (skill mention, rune chip, AP node, glossary, gem row, ...), then spread.
    picked, seen = [], set()
    for i in shown:
        sig = trigger_sig(trig.nth(i))
        if sig not in seen:
            seen.add(sig)
            picked.append(i)
    for k in sample(len(shown), MAX_TIPS):
        if shown[k] not in picked:
            picked.append(shown[k])
    for i in picked[:8]:
        el = trig.nth(i)
        if not visible(el):
            continue
        center(el)
        sig = trigger_sig(el)
        # hover opens
        try:
            el.hover(timeout=2500)
        except Exception as exc:
            lines = [l.strip() for l in str(exc).splitlines() if l.strip()]
            why = next((l for l in lines if "intercepts pointer events" in l), " | ".join(lines[-3:]))
            run.fail(path, f"could not hover {sig} #{i}: {why[:220]}")
            continue
        pg.wait_for_timeout(HOVER_WAIT)
        st = tip_state(el)
        if not st["shown"]:
            run.fail(path, f"hover did not open the tooltip on {sig} #{i}")
            pg.mouse.move(*MOUSE_PARK)
            pg.wait_for_timeout(CLOSE_WAIT)
            continue
        if st["text"] == 0:
            run.fail(path, f"tooltip on {sig} #{i} opened with no content")
        if st["left"] < -1 or st["right"] > st["vw"] + 1:
            run.fail(path, f"tooltip on {sig} #{i} spills outside the viewport ({st['left']:.0f}..{st['right']:.0f} of {st['vw']})")
        # leaving closes
        pg.mouse.move(*MOUSE_PARK)
        pg.wait_for_timeout(CLOSE_WAIT)
        if tip_state(el)["shown"]:
            run.fail(path, f"tooltip on {sig} #{i} stayed open after the pointer left")
        # a mouse click must not pin it
        el.click()
        # A trigger inside a <summary> toggles its card on click: put the page back, or the next
        # trigger in the same card is hidden and the loop stalls on it.
        pg.evaluate("() => document.querySelectorAll('details').forEach(d => { d.open = true; })")
        pg.mouse.move(*MOUSE_PARK)
        pg.wait_for_timeout(CLOSE_WAIT)
        if tip_state(el)["shown"]:
            run.fail(path, f"mouse click pinned the tooltip on {sig} #{i}")
        # keyboard focus opens
        el.focus()
        pg.keyboard.press("Shift+Tab")
        pg.keyboard.press("Tab")
        pg.wait_for_timeout(HOVER_WAIT)
        if not tip_state(el)["shown"]:
            run.fail(path, f"keyboard focus did not open the tooltip on {sig} #{i}")
        el.evaluate("e => e.blur()")
        pg.wait_for_timeout(CLOSE_WAIT)
        run.ok("tooltips")


ARK_TIP_SHOWN_JS = """(item) => {
  const t = item.querySelector('.ark-core-options-tip');
  if (!t) return false;
  const cs = getComputedStyle(t), r = t.getBoundingClientRect();
  return cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.9 && r.width > 0 && r.height > 0;
}"""


def check_ark_cores_desktop(pg, run, path):
    items = pg.locator(".ark-core-item-tip")
    if not items.count():
        return
    it = items.first
    it.scroll_into_view_if_needed()
    it.hover()
    pg.wait_for_timeout(HOVER_WAIT)
    if not it.evaluate(ARK_TIP_SHOWN_JS):
        run.fail(path, "Ark Core: hover did not open its tooltip")
        return
    pg.mouse.move(*MOUSE_PARK)
    pg.wait_for_timeout(CLOSE_WAIT)
    if it.evaluate(ARK_TIP_SHOWN_JS):
        run.fail(path, "Ark Core: tooltip stayed open after the pointer left")
    it.click()
    pg.mouse.move(*MOUSE_PARK)
    pg.wait_for_timeout(CLOSE_WAIT)
    if it.evaluate(ARK_TIP_SHOWN_JS) or it.evaluate("e => e.classList.contains('skill-tip-open')"):
        run.fail(path, "Ark Core: a mouse click pinned the tooltip")
        return
    run.ok("ark-cores")


def check_lightbox(pg, run, path):
    imgs = pg.locator("img.zoomable-image")
    if not imgs.count():
        return
    img = imgs.first
    if not visible(img):
        # It sits in a tab that is not selected: click tab labels until it shows.
        labs = pg.locator(".tabbed-labels > label")
        for i in range(labs.count()):
            if visible(labs.nth(i)):
                labs.nth(i).click()
                if visible(img):
                    break
    if not visible(img):
        run.fail(path, "lightbox: the zoomable image never became visible, so it could not be tested")
        return
    img.scroll_into_view_if_needed()
    for how in ("click", "enter"):
        if how == "click":
            img.click()
        else:
            img.focus()
            pg.keyboard.press("Enter")
        pg.wait_for_timeout(150)
        st = pg.evaluate("""() => ({ open: !!document.querySelector('.image-lightbox-overlay.is-open'),
                                      lock: document.documentElement.classList.contains('image-lightbox-open') })""")
        if not (st["open"] and st["lock"]):
            run.fail(path, f"lightbox did not open on {how} (open={st['open']}, scroll lock={st['lock']})")
            return
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(150)
        st = pg.evaluate("""() => ({ open: !!document.querySelector('.image-lightbox-overlay.is-open'),
                                      lock: document.documentElement.classList.contains('image-lightbox-open'),
                                      back: document.activeElement && document.activeElement.classList.contains('zoomable-image') })""")
        if st["open"] or st["lock"]:
            run.fail(path, f"lightbox did not close on Escape (open={st['open']}, scroll lock={st['lock']})")
            return
        if not st["back"]:
            run.fail(path, "lightbox: focus did not return to the image after closing")
            return
        run.ok("lightbox")


SPACE_PREVENTED_JS = """() => {
  const e = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true });
  (document.activeElement || document.body).dispatchEvent(e);
  return e.defaultPrevented;
}"""


def check_practice(pg, run, path):
    toggles = pg.locator(".rotation-practice-toggle")
    if not toggles.count():
        return
    t = None
    for i in range(toggles.count()):
        if visible(toggles.nth(i)):
            t = toggles.nth(i)
            break
    if t is None:
        return
    t.scroll_into_view_if_needed()

    def active():
        return pg.evaluate("() => document.querySelectorAll('.practice-mode').length")

    def current():
        return pg.evaluate("""() => { const u = document.querySelector('.practice-mode');
          return u ? [...u.querySelectorAll('.skill, .skill-part')].findIndex(s => s.classList.contains('practice-current')) : -2; }""")

    t.click()
    if not active():
        run.fail(path, "practice: toggle did not enter practice mode")
        return
    start = current()
    # The first Space right after a mouse click on the toggle must advance a step, NOT exit. A mouse
    # click leaves focus on the toggle button, and Space on a focused button activates it, so this
    # only works because rotation-practice.js drops focus after a pointer activation. No blur here:
    # blurring first would hide exactly that bug.
    pg.keyboard.press("Space")
    pg.wait_for_timeout(80)
    if not active():
        run.fail(path, "practice: the first Space after a mouse click on the toggle exited practice mode instead of advancing")
        return
    if current() == start:
        run.fail(path, "practice: the first Space after a mouse click on the toggle did not advance a step")
    second = current()
    # Space with nothing focused advances again and is consumed (page does not scroll)
    pg.evaluate("() => { if (document.activeElement) document.activeElement.blur(); }")
    prevented = pg.evaluate(SPACE_PREVENTED_JS)
    if not prevented:
        run.fail(path, "practice: Space with the line on screen was not consumed")
    if current() == second:
        run.fail(path, "practice: a second Space did not advance a step")
    # Space on the focused toggle must exit, not advance
    t.focus()
    pg.keyboard.press("Space")
    pg.wait_for_timeout(80)
    if active():
        run.fail(path, "practice: Space on the focused toggle did not exit practice mode")
    # Escape exits
    t.click()
    pg.evaluate("() => { if (document.activeElement) document.activeElement.blur(); }")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(80)
    if active():
        run.fail(path, "practice: Escape did not exit practice mode")
    # Space is left alone when the practiced line is scrolled off-screen (so the page can page down)
    t.click()
    pg.evaluate("() => { if (document.activeElement) document.activeElement.blur(); }")
    off = pg.evaluate("""() => { const u = document.querySelector('.practice-mode');
        const r = u.getBoundingClientRect(); window.scrollBy(0, r.bottom + 400); return u.getBoundingClientRect().bottom < 0; }""")
    if off:
        if pg.evaluate(SPACE_PREVENTED_JS):
            run.fail(path, "practice: Space was consumed while the practiced line was scrolled off-screen")
    else:
        run.note("practice: could not scroll the line fully off-screen, skipped that sub-check")
    pg.evaluate("() => document.querySelector('.practice-mode') && window.scrollTo(0, 0)")
    pg.keyboard.press("Escape")
    run.ok("practice")


def check_touch(pg, run, path):
    """Tap behaviour at phone width: open, tap again closes, swap, tap outside closes."""
    # Triggers inside a <summary> (a skill card's rune chips, an expandable gem row) skip tap-to-open
    # on purpose: the tap expands the row instead (see rune-tooltip.js, gem-dps-tooltip.js).
    trig = pg.locator(".skill-tip-wired:not(.ap-calc *):not(summary *):not(summary)")
    vis = [i for i in range(min(trig.count(), 60)) if visible(trig.nth(i))]
    if len(vis) < 2:
        return
    a, b = trig.nth(vis[0]), trig.nth(vis[len(vis) // 2])
    a.scroll_into_view_if_needed()
    a.tap()
    pg.wait_for_timeout(HOVER_WAIT)
    st = tip_state(a)
    if not st["shown"]:
        run.fail(path, "[390 touch] tap did not open the tooltip")
        return
    if st["left"] < -1 or st["right"] > st["vw"] + 1:
        run.fail(path, f"[390 touch] tooltip spills outside the viewport ({st['left']:.0f}..{st['right']:.0f} of {st['vw']})")
    a.tap()
    pg.wait_for_timeout(CLOSE_WAIT)
    if tip_state(a)["shown"]:
        run.fail(path, "[390 touch] tapping the trigger again did not close the tooltip")
    a.tap()
    pg.wait_for_timeout(HOVER_WAIT)
    b.scroll_into_view_if_needed()
    b.tap()
    pg.wait_for_timeout(CLOSE_WAIT)
    if tip_state(a)["shown"]:
        run.fail(path, "[390 touch] tapping another trigger left the first tooltip open")
    if not tip_state(b)["shown"]:
        run.fail(path, "[390 touch] tapping another trigger did not open its tooltip")
    pg.touchscreen.tap(5, 300)
    pg.wait_for_timeout(CLOSE_WAIT)
    if tip_state(b)["shown"]:
        run.fail(path, "[390 touch] tapping outside did not close the tooltip")
    else:
        run.ok("touch-tooltips")


ORPHANS_GONE_JS = """() => {
  const described = new Set();
  document.querySelectorAll('[aria-describedby]').forEach(e => e.getAttribute('aria-describedby').split(/\\s+/).forEach(i => described.add(i)));
  return [...document.querySelectorAll('body > [role=tooltip]')].every(p => described.has(p.id));
}"""


def check_instant_nav(pg, run, base, hops):
    pg.goto(base + hops[0], wait_until="networkidle")
    pg.evaluate("() => { window.__smoke = 'same-document'; }")
    for h in hops[1:]:
        link = pg.locator(f".md-nav a[href$='{h}'], .md-tabs a[href$='{h}']").first
        if not link.count() or not visible(link):
            # fall back to a programmatic click on any matching link
            ok = pg.evaluate("(h) => { const a = [...document.querySelectorAll('a')].find(x => x.pathname.endsWith(h)); if (!a) return false; a.click(); return true; }", h)
            if not ok:
                run.fail("(instant nav)", f"no link to {h} found")
                return
        else:
            link.click()
        pg.wait_for_function("(h) => location.pathname.endsWith(h)", arg=h, timeout=8000)
        # skill-tooltip.js prunes a detached trigger's panel in two passes about 1s apart, so poll for
        # the orphans to disappear instead of sampling once.
        pg.wait_for_timeout(600)
        try:
            pg.wait_for_function(ORPHANS_GONE_JS, timeout=5000)
        except Exception:
            pass
        st = pg.evaluate("""() => {
          const described = new Set();
          document.querySelectorAll('[aria-describedby]').forEach(e => e.getAttribute('aria-describedby').split(/\\s+/).forEach(i => described.add(i)));
          const panels = [...document.querySelectorAll('body > [role=tooltip]')];
          return { marker: window.__smoke, pills: document.querySelectorAll('.quick-jump-pills').length,
                   skips: document.querySelectorAll('.section-skip').length, h2s: document.querySelectorAll('.md-content__inner > h2[id]').length,
                   orphans: panels.filter(p => !described.has(p.id)).length,
                   blank: [...document.querySelectorAll('.skill-setup[data-family], .ark-passives, .gem-priority')].filter(e => !(e.textContent || '').trim()).length };
        }""")
        if st["marker"] != "same-document":
            run.fail("(instant nav)", f"hop to {h} did a full page load (Material instant navigation is off or broken)")
        if st["pills"] > 1:
            run.fail("(instant nav)", f"after hop to {h}: {st['pills']} pill rows (expected at most 1)")
        if st["skips"] > max(st["h2s"], 0):
            run.fail("(instant nav)", f"after hop to {h}: {st['skips']} skip links for {st['h2s']} sections (duplicated?)")
        if st["orphans"]:
            run.fail("(instant nav)", f"after hop to {h}: {st['orphans']} orphaned tooltip panels")
        if st["blank"]:
            run.fail("(instant nav)", f"after hop to {h}: {st['blank']} widgets rendered blank")
        run.ok("instant-nav")
    pg.evaluate("() => history.back()")
    pg.wait_for_timeout(800)
    if pg.evaluate("() => window.__smoke") != "same-document":
        run.fail("(instant nav)", "Back did a full page load")


def run_parallel(args, site, pages):
    import subprocess
    n = min(args.workers, len(pages))
    chunks = [pages[i::n] for i in range(n)]
    base_cmd = [sys.executable, __file__, "--site", str(site)] + (["--verbose"] if args.verbose else [])
    jobs = [base_cmd + ["--pages", ",".join(c), "--no-nav"] for c in chunks]
    jobs.append(base_cmd + ["--pages", ",".join(pages), "--nav-only"])
    procs = [subprocess.Popen(j, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True) for j in jobs]
    code = 0
    for pr in procs:
        out, _ = pr.communicate()
        print(out.rstrip())
        code = code or pr.returncode
    return code


# ---------------------------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", required=True, help="built site directory (mkdocs build -d DIR)")
    ap.add_argument("--pages", default="", help="comma-separated page paths (default: every page in the site)")
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--workers", type=int, default=1, help="run pages in this many parallel processes (default 1)")
    ap.add_argument("--no-nav", action="store_true", help="skip the instant-navigation hops (used by --workers)")
    ap.add_argument("--nav-only", action="store_true", help="run only the instant-navigation hops (used by --workers)")
    args = ap.parse_args()

    site = pathlib.Path(args.site).resolve()
    if not (site / "index.html").exists():
        sys.exit(f"{site} does not look like a built site. Run: mkdocs build -d {args.site}")
    pages = [p.strip() for p in args.pages.split(",") if p.strip()] or find_pages(site)
    if args.workers > 1 and len(pages) > 1 and not args.nav_only:
        sys.exit(run_parallel(args, site, pages))
    if args.nav_only:
        pages_to_test, nav_pages = [], pages
    else:
        pages_to_test, nav_pages = pages, pages

    from playwright.sync_api import sync_playwright
    srv, base = serve(site)
    run = Run(base, args.verbose)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        desk = browser.new_context(viewport={"width": 1300, "height": 900})
        phone = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True, device_scale_factor=2)
        for path in pages_to_test:
            print(f"  {path}", flush=True)
            pg = desk.new_page()
            attach_listeners(pg, run, path)
            pg.goto(base + path, wait_until="networkidle")
            pg.wait_for_timeout(300)
            pg.set_default_timeout(5000)
            safe(check_load, pg, run, path, "1300")
            safe(check_tabs, pg, run, path)
            safe(check_details, pg, run, path)
            safe(check_anchors, pg, run, path, "1300")
            safe(check_skip_links, pg, run, path)
            safe(check_tooltips_desktop, pg, run, path)
            safe(check_ark_cores_desktop, pg, run, path)
            safe(check_lightbox, pg, run, path)
            safe(check_practice, pg, run, path)
            pg.close()

            pg = phone.new_page()
            attach_listeners(pg, run, path)
            pg.goto(base + path, wait_until="networkidle")
            pg.wait_for_timeout(300)
            pg.set_default_timeout(5000)
            safe(check_load, pg, run, path, "390")
            safe(check_details, pg, run, path)
            safe(check_anchors, pg, run, path, "390")
            safe(check_touch, pg, run, path)
            pg.close()

        hops = [h for h in ("/", "/remaining-energy/333-ceiling/", "/surge/111-classic/", "/resources/", "/remaining-energy/essentials/") if h in nav_pages]
        if len(hops) >= 3 and not args.no_nav:
            pg = desk.new_page()
            attach_listeners(pg, run, "(instant nav)")
            pg.set_default_timeout(8000)
            try:
                check_instant_nav(pg, run, base, hops)
            except Exception as exc:
                run.fail("(instant nav)", f"crashed: {str(exc).splitlines()[0][:140]}")
            pg.close()
        browser.close()
    srv.shutdown()

    for n in run.notes:
        print(n)
    print()
    summary = ", ".join(f"{k} {v}" for k, v in sorted(run.counts.items()))
    print(f"passed checks: {summary}")
    # de-duplicate identical failures (the same error can fire on every page load)
    seen, uniq = set(), []
    for f in run.fails:
        if f not in seen:
            seen.add(f)
            uniq.append(f)
    for f in uniq:
        print(f)
    if uniq:
        print(f"\n{len(uniq)} FAIL")
        sys.exit(1)
    print("\nOK")


if __name__ == "__main__":
    main()
