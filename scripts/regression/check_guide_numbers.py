#!/usr/bin/env python3
"""Compare numbers quoted in docs/resources/calculator.md with what the real calculator shows.

check_content.py guards quoted CONSTANTS against the JS source. This script covers the
numbers that are computed from several constants: it loads the built site in Chromium at
the default inputs, reads each value off the live page, and fails when the guide does not
quote it. Nothing in the repo is modified.

    mkdocs build -d /tmp/site
    python3 scripts/regression/check_guide_numbers.py /tmp/site

Add a row to CHECKS when the guide quotes a new computed number. Each row is
(build, label, js, template): `js` runs on the page and returns a string or number, and
`template` (with {v}) must appear in the guide text. A row whose js returns null fails, so
a renamed selector cannot silently skip a check.
"""
import argparse, functools, http.server, pathlib, re, socketserver, sys, threading

ROOT = pathlib.Path(__file__).resolve().parents[2]
GUIDE = ROOT / "docs" / "resources" / "calculator.md"

# JS helpers: text of the first match, or the value cell that follows a row label.
H = """
const T = (sel, n = 0) => { const e = document.querySelectorAll(sel)[n]; return e ? e.textContent.trim() : null; };
const afterLabel = (container, labelCls, valCls, re, n = 0) => {
  const labels = [...document.querySelectorAll(container + ' ' + labelCls)].filter(l => re.test(l.textContent.trim()));
  const l = labels[n]; if (!l) return null;
  let e = l.nextElementSibling; while (e && !e.matches(valCls)) e = e.nextElementSibling;
  return e ? e.textContent.trim() : null;
};
const strip = s => s === null ? null : s.replace(/^\\+/, '').replace(/%$/, '');
"""

CHECKS = [
    # (build, label, js expression, text the guide must contain)
    ("re-333", "effective crit with the best setup", "T('.ap-summary-best-crit')", "effective crit rate reads {v} ("),
    ("re-333", "crit rate before the picks", "T('.ap-summary-base-critrate')", "({v} before the picks)"),
    ("re-333", "default bracelet vs no bracelet", "T('.ap-bvb-vs-none')", "The default bracelet reads {v},"),
    ("re-333", "Spec +100 row", "(() => { const l = [...document.querySelectorAll('.ap-brace-row-label')].find(e => /^Spec Stat \\+80/.test(e.textContent.trim())); const v = l && l.parentElement.querySelectorAll('.ap-brace-tier-val')[1]; return v ? v.textContent.trim() : null; })()", "+100 Spec reads {v}."),
    ("re-333", "default bracelet Spec layer", "(1 + parseFloat(T('.ap-bvb-spec-val')) / 100).toFixed(4)", "x {v} x 1.0000 x 1.0000"),
    ("re-333", "Ambush Master engraving row", "afterLabel('.ap-engr-contrib-rows', '.ap-brace-row-label', '.ap-brace-tier-val', /^Ambush Master$/)", "- 1 = {v}."),
    # Crit-layer worked example (the best cell at the defaults).
    ("re-333", "worked example Crit Damage", "(parseFloat(T('.ap-summary-best-critdmg')) / 100).toFixed(3)", "Crit Damage {v},"),
    ("re-333", "worked example Crit Hit Damage", "(1 + parseFloat(T('.ap-summary-best-oncrit')) / 100).toFixed(4)", "Crit Hit Damage {v},"),
    ("re-333", "worked example Evolution", "(parseFloat(T('.ap-summary-best-evodmg')) / 100).toFixed(2)", "Evolution 1 + {v},"),
    ("re-333", "worked example Additional", "(parseFloat(T('.ap-summary-best-adddmg')) / 100).toFixed(4)", "Additional 1 + {v}."),
    # Chaos Core Ancient 20 points, fourth value cell of each row.
    ("re-333", "Smoldering at Ancient 20", "(() => { const l = [...document.querySelectorAll('.ap-brace-row-label')].find(e => e.textContent.trim().startsWith('Smoldering Strike')); return l ? l.parentElement.querySelectorAll('.ap-brace-tier-val')[3].textContent.trim() : null; })()", "- 1 = {v},"),
    ("re-333", "Absorbing at Ancient 20", "(() => { const l = [...document.querySelectorAll('.ap-brace-row-label')].find(e => e.textContent.trim().startsWith('Absorbing Strike')); return l ? l.parentElement.querySelectorAll('.ap-brace-tier-val')[3].textContent.trim() : null; })()", "Absorbing is simply {v},"),
    ("surge-111", "Breaking Moon average Crit Damage (Surge share x 0.25 x 0.6)", "(window.DB_ORDER_CORE_DATA.shares['surge-111'].surge * 0.25 * 0.6).toFixed(3)", "+{v} points"),
    # Top Combinations: the % shows in the readout when a row is clicked, so these run last.
    ("re-333", "Top Combinations rank 2", "(() => { const r = document.querySelectorAll('.ap-calc-result-row .ap-result-combo')[1]; if (!r) return null; r.click(); return T('.ap-result-pct'); })()", "LB2/KS1, Master + Pulverize</td> <td class=\"doc-num\">{v}</td>"),
    ("re-333", "Top Combinations rank 3", "(() => { const r = document.querySelectorAll('.ap-calc-result-row .ap-result-combo')[2]; if (!r) return null; r.click(); return T('.ap-result-pct'); })()", "LB1/KS2, Critical + Pulverize</td> <td class=\"doc-num\">{v}</td>"),
    ("re-333", "Top Combinations rank 4", "(() => { const r = document.querySelectorAll('.ap-calc-result-row .ap-result-combo')[3]; if (!r) return null; r.click(); return T('.ap-result-pct'); })()", "LB3, Master + Pulverize</td> <td class=\"doc-num\">{v}</td>"),
    ("re-333", "Top Combinations rank 5", "(() => { const r = document.querySelectorAll('.ap-calc-result-row .ap-result-combo')[4]; if (!r) return null; r.click(); return T('.ap-result-pct'); })()", "LB1/KS2, Critical + Master</td> <td class=\"doc-num\">{v}</td>"),
    # Optimized Training 1 cost at the defaults; ticks the box, so it runs last.
    ("re-333", "Optimized Training 1 cost", "(async () => { const c = document.querySelector('.ap-calc #ap-ot1'); if (!c.checked) c.click(); await new Promise(r => setTimeout(r, 700)); const t = document.querySelector('.ap-calc .ap-ot1-tag'); return t && !t.hidden ? t.textContent.replace(/ DPS$/, '').trim() : null; })()", "it reads {v} DPS"),
]


def serve(site):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(site)))
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site", help="built site directory (mkdocs build -d ...)")
    args = ap.parse_args()
    site = pathlib.Path(args.site).resolve()
    if not (site / "resources" / "index.html").exists():
        sys.exit(f"{site} is not a built site")
    guide = re.sub(r"\s+", " ", GUIDE.read_text())
    from playwright.sync_api import sync_playwright
    srv, url = serve(site)
    problems = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1300, "height": 1200})
        pg.goto(url + "/resources/")
        pg.wait_for_selector(".ap-calc .ap-calc-reset")
        pg.wait_for_timeout(1200)
        current = None
        for build, label, js, template in CHECKS:
            if build != current:
                pg.evaluate("(bid)=>{const s=document.querySelector('.ap-brace-spec-build');s.value=bid;s.dispatchEvent(new Event('change',{bubbles:true}));}", build)
                pg.wait_for_timeout(500)
                current = build
            v = pg.evaluate("() => {" + H + " return " + js + "; }")
            if v is None:
                problems.append(f"{label}: the calculator showed nothing for this check (selector changed?)")
                continue
            v = str(v)
            # The page shows "+14.71%" / "92.37%"; the guide template decides which form it quotes.
            candidates = [v, v.lstrip("+"), v.rstrip("%"), v.lstrip("+").rstrip("%")]
            if not any(re.sub(r"\s+", " ", template.format(v=c)) in guide for c in candidates):
                problems.append(f"{label}: the calculator shows {v!r} but the guide has no {template.format(v='<value>')!r} with that value")
        b.close()
    srv.shutdown()
    if problems:
        print("check_guide_numbers.py: the guide and the calculator disagree:")
        for x in problems:
            print("  " + x)
        sys.exit(1)
    print(f"check_guide_numbers.py: {len(CHECKS)} quoted numbers match the calculator.")


if __name__ == "__main__":
    main()
