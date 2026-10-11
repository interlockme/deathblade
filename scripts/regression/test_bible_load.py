#!/usr/bin/env python3
"""
test_bible_load.py - end-to-end check of the Load Character popover (bible-import.js).

    mkdocs build -d site_out
    python3 scripts/regression/test_bible_load.py --site site_out

lostark.bible is never contacted: the browser's request for the character page is
intercepted and answered with a recorded fixture (fixtures/*.html.gz), so the whole
path runs for real: name parsing, fetch, HTML -> text lines (htmlToLines), buildPayload,
and the calculator's own Import popover.

For every fixture the check loads the character twice and compares the results:
  reference  the importer baseline's payload pushed through the bookmarklet's
             #bible-import= fragment path (the path regress.py already pins)
  loaded     the same character through the popover (fetch route) and through the
             paste-the-page-source route
Status line, warning list and the calculator's Export data must be identical. Because the
reference payload comes from the fixture's real innerText lines, this also proves
htmlToLines reproduces them.

Also covered: a blocked request (CORS failure) opens the paste route, 404, a reply for a
different character, a non-Deathblade page, a page with no character data, invalid input,
a pasted link, the optional proxy, Cancel abandoning a request in flight, Escape, the dismiss
button on the import result card, and the popover's spacing.

Negative controls (each must make the run FAIL, and the script reports whether it did):
  - block tags no longer starting a line, and flex/grid children no longer starting their own
    lines (both of that pair are removed together: either one alone is enough for the fixtures)
  - the name check removed from payloadFromSource
Exit status is non-zero on any failure.
"""
import argparse
import base64
import functools
import gzip
import http.server
import json
import pathlib
import re
import socketserver
import sys
import threading

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FIX = HERE / "fixtures"
BASELINE = json.loads((HERE / "baselines" / "importer.json").read_text())
PAGE = "/resources/"
NAMES = ["ancient-chaos", "ancient-sun-relic-moon-star", "no-raid-loadout", "relic-chaos-star", "relic-chaos-sun-moon", "bracelet-stat-lines"]
OTHER_CLASS_NAMES = ["other-class-support-t4", "other-class-t3-gear"]
CORS = {"access-control-allow-origin": "*", "content-type": "text/html; charset=utf-8"}


def fixture_html(name):
    return gzip.open(FIX / f"{name}.html.gz", "rt", encoding="utf8").read()


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(directory):
    handler = functools.partial(Quiet, directory=str(directory))
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"


class Harness:
    def __init__(self, browser, base):
        self.browser, self.base = browser, base
        self.failures, self.checks = [], 0
        self.errors = []
        self.ctx = self.page = None

    def check(self, ok, label, detail=""):
        self.checks += 1
        if not ok:
            self.failures.append(f"{label}: {detail}" if detail else label)

    def fresh(self, hash_="", routes=None, js_patch=None):
        if self.ctx:
            self.ctx.close()
        self.ctx = self.browser.new_context(viewport={"width": 1400, "height": 1000})
        pg = self.page = self.ctx.new_page()
        self.errors = []
        pg.on("dialog", lambda d: d.accept())
        pg.on("pageerror", lambda e: self.errors.append("pageerror: " + str(e)))

        def route(r):
            url = r.request.url
            if url.startswith(self.base):
                if js_patch and url.split("?")[0].endswith("/bible-import.js"):
                    body = r.fetch().text()
                    for old, new in js_patch:
                        assert old in body, "negative-control patch target missing: " + old
                        body = body.replace(old, new)
                    return r.fulfill(body=body, content_type="application/javascript")
                return r.continue_()
            if routes and "bible" in routes and url.startswith("https://lostark.bible/"):
                return routes["bible"](r)
            if routes and "proxy" in routes and url.startswith("https://proxy.example/"):
                return routes["proxy"](r)
            return r.abort()  # fonts and anything else off-box

        pg.route("**/*", route)
        pg.goto(self.base + PAGE + hash_)
        pg.wait_for_selector(".ap-calc .ap-calc-reset", timeout=20000)
        pg.wait_for_function("document.querySelectorAll('.ap-calc .ap-summary-value').length > 0", timeout=20000)
        pg.wait_for_function("document.querySelector('.ap-calc .bible-load-open')", timeout=8000)
        # The shipped page may carry a real data-proxy; every test starts from the
        # no-proxy state, and the proxy tests set the attribute themselves.
        pg.evaluate("document.querySelector('.bible-import-control').setAttribute('data-proxy','')")
        pg.wait_for_timeout(400)
        return pg

    # --- reading results ---
    def result(self):
        pg = self.page
        status = pg.evaluate("(document.querySelector('.bible-import-status')||{}).textContent||''").strip()
        warns = pg.evaluate("[...document.querySelectorAll('.bible-import-warnings li')].map(l=>l.textContent.trim())")
        pg.click(".ap-calc-export")
        raw = pg.evaluate("document.querySelector('.ap-calc-popover[data-popover=export] textarea').value")
        pg.click(".ap-calc-popover[data-popover=export] .ap-calc-popover-close")
        data = json.loads(raw)["data"]
        return {"status": status, "warnings": warns, "data": data}

    def popover_msg(self):
        return self.page.evaluate("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent").strip()

    def status_text(self):
        return self.page.evaluate("(document.querySelector('.bible-import-status')||{}).textContent||''").strip()

    def open_loader(self):
        self.page.click(".bible-load-open")
        self.page.wait_for_selector(".bible-load-popover:not([hidden])")

    def load(self, text, region=None):
        self.open_loader()
        if region:
            self.page.select_option(".bible-load-region", region)
        self.page.fill(".bible-load-input", text)
        self.page.click(".bible-load-go")

    def settle(self):
        self.page.wait_for_timeout(700)


def fulfill_html(html, status=200):
    def h(r):
        r.fulfill(status=status, headers=CORS, body=html)
    return h


def reference(h, name):
    payload = BASELINE["fixtures"][name]["payload"]
    frag = "#bible-import=" + base64.b64encode(json.dumps(payload, ensure_ascii=False).encode("utf8")).decode("ascii")
    h.fresh(hash_=frag)
    h.page.wait_for_function("(document.querySelector('.bible-import-status')||{}).textContent", timeout=8000)
    return h.result(), payload["characterName"]


# The fetch and paste routes decode the page's own raid loadout (bible-decode.js); the bookmarklet
# (fragment) route reads the visible tab. When the last raid snapshot has no gems (or there is no
# snapshot) the decoder uses Bible's estimated loadout on purpose, so those fixtures may differ from
# the fragment route in exactly these fields, and the first warning must say so.
ESTIMATED_MAY_DIFFER = {"ap-gear-gem-base-ap", "ap-gear-main-stat", "ap-crit-stat", "ap-evo-karma", "ap-gear-wp", "ap-gear-wp-karma-lv"}
ESTIMATED_NOTE = "Used Bible's estimated raid loadout because"


# Main Stat % is not in the page text, so the fragment route leaves the calculator's own value
# (the result lists every field, default included) while the fetch and paste routes write the
# decoded multiplier. It must equal the decoder's value and is then ignored in the equality below.
MAIN_STAT_PCT = "ap-gear-main-stat-pct"


def route_matches(h, html, got, ref):
    info = h.page.evaluate("(html) => { const d = window.BibleDecode && window.BibleDecode.decode(html); return d && d.ok ? { kind: d.kind, pct: d.hydration.mainStatPct } : { kind: 'none', pct: null }; }", html)
    kind = info["kind"]
    if info["pct"] is None or float(got["data"].get(MAIN_STAT_PCT, "nan")) != float(info["pct"]):
        return False
    got = {**got, "data": {k: v for k, v in got["data"].items() if k != MAIN_STAT_PCT}}
    ref = {**ref, "data": {k: v for k, v in ref["data"].items() if k != MAIN_STAT_PCT}}
    if kind == "raid":
        return got == ref
    if kind != "estimated":
        return False
    diff = {k for k in got["data"] if got["data"][k] != ref["data"].get(k)} | {k for k in ref["data"] if k not in got["data"]}
    return bool(got["warnings"]) and got["warnings"][0].startswith(ESTIMATED_NOTE) and diff <= ESTIMATED_MAY_DIFFER


def run_all(h, label=""):
    """Everything except the negative controls. Returns nothing; results land in h.failures."""
    bad = lines_equal_fixtures(h)
    h.check(not bad, "htmlToLines equals each fixture's recorded lines", str(bad))
    for name in NAMES:
        ref, char = reference(h, name)
        html = fixture_html(name)
        seen = []

        def bible(r, html=html):
            seen.append(r.request.url)
            r.fulfill(status=200, headers=CORS, body=html)

        h.fresh(routes={"bible": bible})
        h.load(char)
        h.page.wait_for_function("(document.querySelector('.bible-import-status')||{}).textContent", timeout=8000)
        got = h.result()
        h.check(seen == [f"https://lostark.bible/character/NA/{char}"], f"{name}: requested URL", str(seen))
        h.check(route_matches(h, html, got, ref), f"{name}: fetch route equals fragment route",
                json.dumps({k: (got[k], ref[k]) for k in got if got[k] != ref[k]})[:600])
        h.check(h.page.evaluate("document.querySelector('.bible-load-popover').hidden"), f"{name}: popover closes after import")

        h.fresh()
        h.open_loader()
        h.page.evaluate("document.querySelector('.bible-load-manual').open = true")
        h.page.fill(".bible-load-source", html)
        h.page.click(".bible-load-paste")
        h.page.wait_for_function("(document.querySelector('.bible-import-status')||{}).textContent", timeout=8000)
        got2 = h.result()
        h.check(route_matches(h, html, got2, ref), f"{name}: paste route equals fragment route")
    h.check(not h.errors, "no page errors", str(h.errors))


def lines_function_source(patch=None):
    src = (HERE.parent.parent / "docs" / "javascripts" / "bible-import.js").read_text(encoding="utf8")
    start = src.index("  function htmlToLines(html) {")
    end = src.index("  // Turns the box's text into")
    body = src[start:end].rstrip()
    for old, new in patch or []:
        assert old in body, "negative-control patch target missing: " + old
        body = body.replace(old, new)
    return body


def lines_equal_fixtures(h, patch=None):
    """htmlToLines (extracted from the shipped file) against each fixture's recorded innerText lines."""
    h.fresh()
    bad = []
    fn = lines_function_source(patch)
    for name in NAMES:
        want = json.loads((FIX / f"{name}.lines.json").read_text(encoding="utf8"))
        got = h.page.evaluate("([src, html]) => new Function('return (' + src + ')')()(html)", [fn, fixture_html(name)])
        if got != want:
            bad.append(name)
    return bad


def run_behaviour(h):
    ac = fixture_html("ancient-chaos")
    char = BASELINE["fixtures"]["ancient-chaos"]["payload"]["characterName"]

    # blocked request (what a CORS refusal looks like to the page)
    h.fresh(routes={"bible": lambda r: r.abort("failed")})
    h.load(char)
    h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.includes('blocked')", timeout=8000)
    h.check(h.page.evaluate("document.querySelector('.bible-load-manual').open"), "blocked: paste route opens")
    h.check(h.status_text() == "", "blocked: nothing imported")
    h.check(h.page.evaluate("!document.querySelector('.bible-load-go').disabled"), "blocked: Load usable again")
    h.check(char in h.page.evaluate("document.querySelector('.bible-load-page-link').href"), "blocked: page link points at the character")

    # 404
    h.fresh(routes={"bible": lambda r: r.fulfill(status=404, headers=CORS, body="nope")})
    h.load("Nobody")
    h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.includes('no character')", timeout=8000)
    h.check(h.status_text() == "", "404: nothing imported")

    # 429
    h.fresh(routes={"bible": lambda r: r.fulfill(status=429, headers=CORS, body="slow down")})
    h.load("Nobody")
    h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.includes('limiting')", timeout=8000)

    # reply is for a different character than asked
    h.fresh(routes={"bible": fulfill_html(ac)})
    h.load("SomeoneElse")
    h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.includes('instead of')", timeout=8000)
    h.check(h.status_text() == "", "name mismatch: nothing imported")
    h.check(not h.page.evaluate("document.querySelector('.bible-load-popover').hidden"), "name mismatch: popover stays open")

    # same name, other letter case: accepted
    h.fresh(routes={"bible": fulfill_html(ac)})
    h.load(char.upper())
    h.page.wait_for_function("(document.querySelector('.bible-import-status')||{}).textContent", timeout=8000)
    h.check(h.status_text().startswith("Imported " + char), "case-insensitive name match", h.status_text())

    # not a Deathblade
    h.fresh(routes={"bible": fulfill_html(ac.replace("Deathblade", "Berserker"))})
    h.load(char)
    h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.length>0", timeout=8000)
    h.check("Deathblade" in h.popover_msg(), "wrong class message", h.popover_msg())

    # real pages of other classes: a T3-gear character the decoder reads and a support the decoder
    # refuses (an unknown bracelet stat). Both must end at the class message with nothing imported,
    # never at a decoder refusal warning.
    for other in OTHER_CLASS_NAMES:
        h.fresh(routes={"bible": fulfill_html(fixture_html(other))})
        h.load("Fixture-" + other)
        h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.length>0", timeout=8000)
        h.check("Deathblade" in h.popover_msg(), f"{other}: class message", h.popover_msg())
        h.check(h.status_text() == "", f"{other}: nothing imported", h.status_text())

    # reply with no character data (an error or verification page)
    h.fresh(routes={"bible": fulfill_html("<html><body>Just a moment...</body></html>")})
    h.load(char)
    h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.length>0", timeout=8000)
    h.check("No character data" in h.popover_msg(), "no-data message", h.popover_msg())

    # invalid input never reaches the network
    reqs = []
    h.fresh(routes={"bible": lambda r: (reqs.append(r.request.url), r.abort())[1]})
    for bad in ["", "   ", "a/b", "name?x=1", "https://evil.example/character/NA/Foo", "https://lostark.bible/roster/Foo",
                "https://lostark.bible.evil.example/character/NA/Foo", "x" * 41]:
        h.load(bad)
        h.page.wait_for_timeout(100)
        h.check(h.popover_msg() != "" and "Loading" not in h.popover_msg(), f"invalid input rejected: {bad[:30]!r}", h.popover_msg())
    h.check(reqs == [], "invalid input sends no request", str(reqs))

    # a pasted link: region and name come from the link, extra path and query are ignored
    seen = []
    def bible(r):
        seen.append(r.request.url)
        r.fulfill(status=200, headers=CORS, body=ac)
    h.fresh(routes={"bible": bible})
    h.load(f"https://lostark.bible/character/CE/{char}/__data.json?x-sveltekit-invalidated=011")
    h.page.wait_for_timeout(800)
    h.check(seen == [f"https://lostark.bible/character/CE/{char}"], "pasted link requests the CE page", str(seen))
    h.check(h.page.evaluate("document.querySelector('.bible-load-region').value") == "CE", "region selector shows the region used")

    # a name with characters that need encoding is percent-encoded as one path segment
    seen.clear()
    h.fresh(routes={"bible": bible})
    h.load("Bläde")
    h.page.wait_for_timeout(500)
    h.check(seen == ["https://lostark.bible/character/NA/Bl%C3%A4de"], "name is encoded", str(seen))

    # optional proxy
    pseen = []
    def proxy(r):
        pseen.append(r.request.url)
        r.fulfill(status=200, headers=CORS, body=ac)
    h.fresh(routes={"proxy": proxy, "bible": lambda r: r.abort()})
    h.page.evaluate("document.querySelector('.bible-import-control').setAttribute('data-proxy','https://proxy.example/char')")
    h.load(char, region="CE")
    h.page.wait_for_function("(document.querySelector('.bible-import-status')||{}).textContent", timeout=8000)
    h.check(pseen == [f"https://proxy.example/char?region=CE&name={char}"], "proxy URL", str(pseen))
    # a non-https proxy value is ignored
    h.fresh(routes={"bible": bible})
    h.page.evaluate("document.querySelector('.bible-import-control').setAttribute('data-proxy','http://insecure.example/')")
    seen.clear()
    h.load(char)
    h.page.wait_for_timeout(600)
    h.check(seen and seen[0].startswith("https://lostark.bible/"), "http proxy ignored", str(seen))

    # Cancel while a request is out: the late reply is dropped
    gate = threading.Event()
    held = []
    def slow(r):
        held.append(r)
    h.fresh(routes={"bible": slow})
    h.load(char)
    h.page.wait_for_function("document.querySelector('.bible-load-go').disabled", timeout=4000)
    h.check(h.page.evaluate("document.querySelector('.bible-load-input').readOnly"), "busy: input locked")
    h.page.click(".bible-load-popover .ap-calc-popover-close")
    h.page.wait_for_timeout(300)
    h.check(h.page.evaluate("!document.querySelector('.bible-load-go').disabled"), "cancel: Load usable again")
    h.check(h.status_text() == "", "cancel: nothing imported")

    # Escape closes the popover
    h.fresh(routes={"bible": fulfill_html(ac)})
    h.open_loader()
    h.page.keyboard.press("Escape")
    h.check(h.page.evaluate("document.querySelector('.bible-load-popover').hidden"), "Escape closes the popover")

    # opening Export hides the loader (one popover at a time)
    h.fresh()
    h.open_loader()
    h.page.click(".ap-calc-export")
    h.check(h.page.evaluate("document.querySelector('.bible-load-popover').hidden"), "Export closes the loader")

    # Enter submits
    h.fresh(routes={"bible": fulfill_html(ac)})
    h.open_loader()
    h.page.fill(".bible-load-input", char)
    h.page.press(".bible-load-input", "Enter")
    h.page.wait_for_function("(document.querySelector('.bible-import-status')||{}).textContent", timeout=8000)
    h.check(h.status_text().startswith("Imported"), "Enter submits")

    # region is remembered between visits
    h.page.evaluate("localStorage.getItem('bibleLoadRegion')")
    h.check(h.page.evaluate("localStorage.getItem('bibleLoadRegion')") == "NA", "region remembered after a successful load")

    # the bookmarklet's fragment route still works and still reports a bad fragment
    h.fresh(hash_="#bible-import=%%%")
    h.page.wait_for_timeout(300)
    h.check("Couldn't read that import link" in h.status_text(), "bad fragment message", h.status_text())
    h.check(not h.errors, "behaviour: no page errors", str(h.errors))


def dismiss_checks(h, js_patch=None):
    """The corner button on the import result card empties the status and the warning list, hides
    the card and hands focus to Load Character. Returns the failures these checks added, so a
    negative control can run them under a patched bible-import.js."""
    before = len(h.failures)
    name = "no-raid-loadout"  # the one fixture whose import carries a warning
    char = BASELINE["fixtures"][name]["payload"]["characterName"]
    h.fresh(routes={"bible": fulfill_html(fixture_html(name))}, js_patch=js_patch)
    h.load(char)
    h.page.wait_for_function("(document.querySelector('.bible-import-status')||{}).textContent", timeout=8000)
    shown = h.page.evaluate("({display: getComputedStyle(document.querySelector('.ap-calc-notice')).display, lis: document.querySelectorAll('.bible-import-warnings li').length})")
    h.check(shown["display"] != "none" and shown["lis"] > 0, "dismiss: card shows a status and a warning before it is cleared", str(shown))
    h.page.click(".bible-import-clear")
    state = h.page.evaluate("({display: getComputedStyle(document.querySelector('.ap-calc-notice')).display, status: document.querySelector('.bible-import-status').textContent, lis: document.querySelectorAll('.bible-import-warnings li').length, warnHidden: document.querySelector('.bible-import-warnings').hidden, focus: document.activeElement.className})")
    h.check(state["display"] == "none", "dismiss: card is hidden after the button is clicked", str(state))
    h.check(state["status"] == "" and state["lis"] == 0 and state["warnHidden"], "dismiss: status and warning list are emptied", str(state))
    h.check("bible-load-open" in state["focus"], "dismiss: focus moves to Load Character", str(state))
    return h.failures[before:]


def layout_checks(h, css=""):
    """Load Character popover geometry: the \"Load not working?\" row stays put and keeps its
    opacity when opened, an empty message line takes no room, and the space under the last button
    matches the space between the bookmarklet and the divider below it. `css` is injected by a
    negative control to put one of the rules back to the sitewide behaviour."""
    before = len(h.failures)
    h.fresh()
    if css:
        h.page.add_style_tag(content=css)
    h.open_loader()
    probe = """() => {
      const sm = document.querySelector('.bible-load-manual > summary');
      const rg = document.createRange(); rg.selectNodeContents(sm.lastChild);
      return {textTop: rg.getBoundingClientRect().top, opacity: getComputedStyle(document.querySelector('.bible-load-manual')).opacity};
    }"""
    closed = h.page.evaluate(probe)
    h.page.click(".bible-load-manual > summary")
    h.page.wait_for_timeout(300)
    opened = h.page.evaluate(probe)
    h.check(abs(closed["textTop"] - opened["textTop"]) < 0.5, "layout: Load not working? text does not move when opened", f"{closed['textTop']:.1f} -> {opened['textTop']:.1f}")
    h.check(closed["opacity"] == "1" and opened["opacity"] == "1", "layout: Load not working? is not dimmed while closed", f"{closed['opacity']} / {opened['opacity']}")
    gaps = h.page.evaluate("""() => {
      const r = s => document.querySelector(s).getBoundingClientRect();
      const routes = [...document.querySelectorAll('.bible-load-route')].map(e => e.getBoundingClientRect());
      return {
        msg: r('.bible-load-info > .ap-calc-popover-msg').height,
        buttonsToNote: r('.bible-load-note').top - r('.bible-load-popover > .ap-calc-popover-actions').bottom,
        above: routes[1].top - r('.bible-import-bookmarklet').bottom,
        below: r('.bible-load-popover').bottom - r('.bible-load-paste').bottom,
      };
    }""")
    h.check(gaps["buttonsToNote"] < 9, "layout: the note sits right under the Load / Cancel buttons", str(gaps))
    h.page.evaluate("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent = 'Loading Example from Bible...'")
    h.page.wait_for_timeout(100)
    shifted = h.page.evaluate("document.querySelector('.bible-load-manual').getBoundingClientRect().top")
    h.page.evaluate("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent = ''")
    h.page.wait_for_timeout(100)
    rest = h.page.evaluate("document.querySelector('.bible-load-manual').getBoundingClientRect().top")
    h.check(abs(shifted - rest) < 0.5, "layout: a short message does not move the Load not working? row", f"{rest:.1f} -> {shifted:.1f}")
    h.check(abs(gaps["above"] - gaps["below"]) < 1.5, "layout: space under the Import button matches the space above the divider", str(gaps))
    return h.failures[before:]


def fold_checks(h, js_patch=None):
    """Messages and the bookmarklet route inside the Load Character popover. Returns the failures
    these checks added, so a negative control can run them under a patched bible-import.js."""
    before = len(h.failures)
    char = BASELINE["fixtures"]["ancient-chaos"]["payload"]["characterName"]

    # no proxy: the blocked message names the real cause (Bible sends no CORS headers)
    h.fresh(routes={"bible": lambda r: r.abort("failed")}, js_patch=js_patch)
    h.load(char)
    h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.includes('blocked')", timeout=8000)
    h.check("CORS" in h.popover_msg(), "no proxy: blocked message mentions CORS", h.popover_msg())

    # the bookmarklet is a real javascript: link, and a plain click neither navigates nor runs it here
    href = h.page.evaluate("document.querySelector('.bible-import-bookmarklet').getAttribute('href')")
    h.check(href.startswith("javascript:"), "bookmarklet href is a javascript: URL", href[:40])
    url_before = h.page.url
    h.page.click(".bible-import-bookmarklet")
    h.page.wait_for_timeout(200)
    h.check(h.page.url == url_before, "bookmarklet click leaves the URL alone", h.page.url)
    h.check("Drag this link" in h.popover_msg(), "bookmarklet click writes the drag hint to the popover", h.popover_msg())
    h.check(h.status_text() == "", "bookmarklet click writes nothing to the status line", h.status_text())
    h.check(h.page.evaluate("!!document.querySelector('.bible-load-manual .bible-load-route').querySelector('.bible-import-bookmarklet')"), "bookmarklet route comes first in the fallback list")

    # Bible not answering through the relay (504) is not reported as Bible answering with an error
    h.fresh(routes={"bible": lambda r: r.fulfill(status=504, headers=CORS, body="timeout")}, js_patch=js_patch)
    h.load(char)
    h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.length>0", timeout=8000)
    h.check("in time" in h.popover_msg(), "504: says Bible did not answer in time", h.popover_msg())

    # with a proxy: the blocked message names the relay instead
    h.fresh(routes={"proxy": lambda r: r.abort("failed"), "bible": lambda r: r.abort("failed")}, js_patch=js_patch)
    h.page.evaluate("document.querySelector('.bible-import-control').setAttribute('data-proxy','https://proxy.example/char')")
    h.load(char)
    h.page.wait_for_function("document.querySelector('.bible-load-popover .ap-calc-popover-msg').textContent.includes('blocked')", timeout=8000)
    h.check("relay" in h.popover_msg() and "CORS" not in h.popover_msg(), "proxy set: blocked message names the relay", h.popover_msg())
    return h.failures[before:]


def negative(browser, base, patch, label):
    h = Harness(browser, base)
    name = "relic-chaos-star"
    ref, char = reference(h, name)
    h.fresh(routes={"bible": fulfill_html(fixture_html(name))}, js_patch=patch)
    h.load(char)
    h.page.wait_for_timeout(1200)
    try:
        got = h.result()
    except Exception as e:  # no import happened at all counts as a detected break
        return True
    return got != ref


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="site_out")
    args = ap.parse_args()
    srv, base = serve(pathlib.Path(args.site).resolve())
    ok = True
    with sync_playwright() as p:
        browser = p.chromium.launch()
        h = Harness(browser, base)
        run_all(h)
        run_behaviour(h)
        fold_checks(h)
        dismiss_checks(h)
        layout_checks(h)
        print(f"{h.checks} checks, {len(h.failures)} failure(s)")
        for f in h.failures:
            print("  FAIL", f)
        ok = not h.failures

        controls = [
            ("block tags no longer start a line in htmlToLines", [('var display = BLOCK_TAGS[el.tagName] ? "block" : "inline";', 'var display = "inline";')]),
            ("flex and grid children no longer start their own lines", [("if (parentIsFlex) { flush(); cur = n.data; flush(); } else cur += n.data;", "cur += n.data;"), ("var ownLine = startsLine(display) || parentIsFlex;", "var ownLine = startsLine(display);")]),
            ("name check removed", [("payload.characterName.toLowerCase() !== expectedName.toLowerCase()", "false")]),
        ]
        for label, patch in controls:
            if label.startswith("name check"):
                # the control for the name check is the mismatch scenario, not an equality diff
                hh = Harness(browser, base)
                hh.fresh(routes={"bible": fulfill_html(fixture_html("ancient-chaos"))}, js_patch=patch)
                hh.load("SomeoneElse")
                hh.page.wait_for_timeout(1200)
                detected = hh.status_text().startswith("Imported")
            else:
                # detected when either the direct lines check or the payload comparison breaks
                detected = bool(lines_equal_fixtures(Harness(browser, base), patch)) or negative(browser, base, patch, label)
            print(f"negative control ({label}): {'detected' if detected else 'NOT DETECTED'}")
            ok = ok and detected
        fold_controls = [
            ("no-proxy message no longer says CORS", [("(it sends no CORS headers), so the browser", "(it sends no headers), so the browser")]),
            ("bookmarklet click hint removed", [("popoverMsg.textContent = \"Drag this link", "popoverMsg.textContent = \"Use this link")]),
            ("504 reads as a generic error again", [('if (res.status === 504) throw', 'if (false) throw')]),
            ("proxy message no longer names the relay", [("Couldn't reach the relay that loads", "Couldn't reach the server that loads")]),
        ]
        for label, patch in fold_controls:
            hh = Harness(browser, base)
            detected = bool(fold_checks(hh, patch))
            print(f"negative control ({label}): {'detected' if detected else 'NOT DETECTED'}")
            ok = ok and detected
        dismiss_controls = [
            ("dismiss leaves the warning list", [('        warnList.innerHTML = "";\n        warnList.hidden = true;\n      }\n      var openBtn', '      }\n      var openBtn')]),
            ("dismiss does not move focus", [("if (openBtn) openBtn.focus();", "")]),
        ]
        for label, patch in dismiss_controls:
            hh = Harness(browser, base)
            detected = bool(dismiss_checks(hh, patch))
            print(f"negative control ({label}): {'detected' if detected else 'NOT DETECTED'}")
            ok = ok and detected
        layout_controls = [
            ("closed Load not working? row padded and dimmed again", ".md-typeset details.bible-load-manual:not([open]){opacity:.8 !important} .md-typeset details.bible-load-manual:not([open]) > summary{padding:.28rem 0 !important}"),
            ("last route gets Material's bottom margin back", "html .md-typeset details.bible-load-manual > :last-child{margin-bottom:.6rem !important}"),
            ("a message pushes the note down again", ".md-typeset .bible-load-info{display:block !important} .md-typeset .bible-load-info > .ap-calc-popover-msg{min-height:1.2em !important}"),
        ]
        for label, css in layout_controls:
            hh = Harness(browser, base)
            detected = bool(layout_checks(hh, css))
            print(f"negative control ({label}): {'detected' if detected else 'NOT DETECTED'}")
            ok = ok and detected
        browser.close()
    srv.shutdown()
    print("PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
