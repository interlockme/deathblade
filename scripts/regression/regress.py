#!/usr/bin/env python3
"""
regress.py - scripted version of the verification playbook in project-context.md.

    python3 scripts/regression/regress.py snapshot --site SITE_DIR --out DIR
    python3 scripts/regression/regress.py check    --site SITE_DIR
    python3 scripts/regression/regress.py baseline --site SITE_DIR
    python3 scripts/regression/regress.py diff OLD.json[.gz] NEW.json[.gz]

SITE_DIR is a built site (`mkdocs build -d SITE_DIR`). This script serves it itself on a
free localhost port, so there is no server to start or keep alive.

  snapshot   drive the calculator and run the importer, write calculator.json.gz and
             importer.json into --out
  check      snapshot into a temp dir, then diff against baselines/. Exit 1 on ANY
             difference. Every difference is a line you must either explain (you meant
             it) or fix. That is the playbook's "name every single one" rule.
  baseline   snapshot straight into baselines/ (do this only after you have explained
             every difference `check` reported)
  diff       compare any two snapshot files

WHAT THE CALCULATOR PASS DOES (all against the .ap-calc block on /resources/)
  Every input/select/checkbox and every readout is dumped, keyed by id, or by class
  signature plus position for the id-less sandbox fields (Setup A/B, Bracelet A/B,
  Ability Stone). Full dumps are taken at these states:
    defaults, all numbers changed, all selects at their last option, all checkboxes
    toggled (this turns Support off for every state after it), after reload
    (localStorage round trip), after Reset, after Import of the earlier Export, each of
    presets 2/3/1/2, after Reset again, then Support on with hand-set inputs (plus its own
    reload and Export -> Reset -> Import round trip), and after each Bible import fixture
    (the bookmarklet's #bible-import= fragment path).
  Plus one PROBE per control, each from a fresh page at defaults: change just that one
  control and store only what changed. That is what makes the diff name the control.
  `checks` records the round-trip facts the playbook asks for: which fields did not
  survive a reload, and which did not survive Export -> Reset -> Import. That second list
  is expected to be non-empty (the id-less sandbox fields); what matters is that it is
  IDENTICAL before and after your change, and `check` diffs it like everything else.

Needs: pip install playwright && playwright install chromium ; node for the importer half.
"""
import argparse
import base64
import functools
import gzip
import http.server
import json
import pathlib
import socketserver
import subprocess
import sys
import tempfile
import threading

HERE = pathlib.Path(__file__).resolve().parent
BASELINES = HERE / "baselines"
FIXTURES = HERE / "fixtures"
PAGE_PATH = "/resources/"

# Support is on at defaults (the Passionate Dance checkbox is checked), but the checkbox pass
# turns it off for every state after it. These hand-picked values, set with Support on, pin the
# support math (AP buff uptime, orb uptimes, both bracelet lines) and its reload / Export / Import
# round trip independently of how the earlier passes happen to be ordered.
SUPPORT_ON_INPUTS = [
    ("input#ap-gear-support-uptime:0", 60),
    ("input#ap-gear-strength-orb-uptime:0", 25),
    ("input#ap-flash-orb-uptime:0", 25),
    ("select#ap-support-crit-rate-bracelet:0", "Mid"),
    ("select#ap-support-crit-dmg-bracelet:0", "Mid"),
]

# ---------------------------------------------------------------------------------
# In-page helpers. `keyed()` gives every control a stable key; dump() and the drivers
# share it so a key always names the same element.
# ---------------------------------------------------------------------------------
PAGE_JS = r"""
(() => {
  const SKIP = /(active|open|disabled|hidden|invalid|dim|unused|selected|current|expanded|collapsed|wired|^is-|^has-)/;
  const root = () => document.querySelector('.ap-calc');
  const scopes = () => { const s = new Set([root()]); document.querySelectorAll('.ap-build-dock').forEach(e => s.add(e)); return [...s].filter(Boolean); };
  const inPopover = (e) => !!e.closest('.ap-calc-popover');
  const sig = (e) => {
    if (e.id) return e.tagName.toLowerCase() + '#' + e.id;
    const cls = [...e.classList].filter(c => c.startsWith('ap-') && !SKIP.test(c));
    return e.tagName.toLowerCase() + '.' + (cls.join('.') || '_');
  };
  const withOrdinals = (els) => {
    const seen = {};
    return els.map(e => { const s = sig(e); seen[s] = (seen[s] || 0); const k = s + ':' + seen[s]++; return { e, k }; });
  };
  const hidden = (e) => !e.getClientRects().length;
  const ctrls = () => withOrdinals([...root().querySelectorAll('input,select')].filter(e => !inPopover(e) && e.type !== 'file'));
  const tick = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))));

  window.__rg = {
    meta() {
      return ctrls().map(({ e, k }, i) => ({
        i, k, tag: e.tagName.toLowerCase(), type: e.type, min: e.min, max: e.max, step: e.step,
        options: e.tagName === 'SELECT' ? [...e.options].map(o => o.value) : null,
        disabled: e.disabled, value: e.value,
      }));
    },
    dump() {
      const c = {}, r = {};
      for (const { e, k } of ctrls()) {
        const v = e.type === 'checkbox' ? (e.checked ? '1' : '0') : e.value;
        c[k] = v + (e.disabled ? '|D' : '') + (hidden(e) ? '|H' : '');
      }
      const all = [];
      for (const s of scopes()) for (const e of s.querySelectorAll('*')) if (!all.includes(e)) all.push(e);
      const cand = all.filter(e =>
        !['INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'SCRIPT', 'STYLE'].includes(e.tagName) &&
        !inPopover(e) && !e.closest('.bible-import-warnings') &&
        [...e.classList].some(c => c.startsWith('ap-')));
      const leaf = cand.filter(e => !cand.some(o => o !== e && e.contains(o)));
      for (const { e, k } of withOrdinals(leaf)) {
        const text = e.textContent.replace(/\s+/g, ' ').trim();
        const st = ['aria-pressed', 'aria-selected', 'aria-expanded'].map(a => e.getAttribute(a)).filter(x => x != null).join(',');
        const act = [...e.classList].some(c => /active/.test(c)) ? '[on]' : '';
        if (!text && !st && !act) continue;
        r[k] = text + (st ? ' {' + st + '}' : '') + act + (hidden(e) ? '|H' : '');
      }
      return { c, r };
    },
    async setNumber(i) {
      const e = ctrls()[i].e; if (e.disabled) return false;
      const lo = e.min !== '' ? +e.min : null, hi = e.max !== '' ? +e.max : null, step = +e.step > 0 ? +e.step : 1;
      let v;
      if (lo !== null && hi !== null) { v = lo + Math.round(((hi - lo) * 0.37) / step) * step; }
      else v = Math.round((+e.value || 1) * 1.13);
      v = Math.round(v * 1e6) / 1e6;
      e.value = String(v);
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
      await tick(); return true;
    },
    async setSelect(i, value) {
      const e = ctrls()[i].e; if (e.disabled) return false;
      e.value = value;
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
      await tick(); return true;
    },
    async toggle(i) {
      const e = ctrls()[i].e; if (e.disabled) return false;
      e.click(); await tick(); return true;
    },
    async setByKey(k, value) {
      const hit = ctrls().find(x => x.k === k); if (!hit || hit.e.disabled) return false;
      hit.e.value = String(value);
      hit.e.dispatchEvent(new Event('input', { bubbles: true })); hit.e.dispatchEvent(new Event('change', { bubbles: true }));
      await tick(); return true;
    },
    chipEls() { return [...document.querySelectorAll('.ap-build-chip')].filter(b => b.closest('.ap-calc, .ap-build-dock')); },
    chips() { return window.__rg.chipEls().map(b => b.textContent.trim()); },
    async clickChip(n) { const b = window.__rg.chipEls()[n]; if (!b) return false; b.click(); await tick(); return true; },
    async clickSel(sel) { const b = document.querySelector(sel); if (!b) return false; b.click(); await tick(); return true; },
    popoverText(which) { const p = root().querySelector('.ap-calc-popover[data-popover="' + which + '"]'); return p ? p.querySelector('.ap-calc-popover-textarea').value : null; },
    popoverMsg(which) { const p = root().querySelector('.ap-calc-popover[data-popover="' + which + '"]'); const m = p && p.querySelector('.ap-calc-popover-msg'); return m ? m.textContent.trim() : null; },
    importStatus() {
      const s = root().querySelector('.bible-import-status');
      return { status: s ? s.textContent.trim() : null, warnings: [...root().querySelectorAll('.bible-import-warnings li')].map(l => l.textContent.trim()) };
    },
    async fillImport(text) {
      const p = root().querySelector('.ap-calc-popover[data-popover="import"]');
      p.querySelector('.ap-calc-popover-textarea').value = text; await tick(); return true;
    },
  };
  return true;
})()
"""


class Session:
    """One browser context/page. Each `fresh()` starts from clean or supplied localStorage."""

    def __init__(self, browser, base_url, errors):
        self.browser, self.base, self.errors = browser, base_url, errors
        self.ctx = self.page = None

    def fresh(self, ls=None, hash_=""):
        if self.ctx:
            self.ctx.close()
        origin = "/".join(self.base.split("/")[:3])
        state = {"cookies": [], "origins": [{"origin": origin, "localStorage": [{"name": k, "value": v} for k, v in (ls or {}).items()]}]}
        self.ctx = self.browser.new_context(storage_state=state, viewport={"width": 1400, "height": 1000})
        self.page = self.ctx.new_page()
        # Google Fonts and anything else off-box just slow the page down (and 403 in a sandbox)
        self.page.route("**/*", lambda r: r.continue_() if r.request.url.startswith("http://127.0.0.1") else r.abort())
        self.page.on("dialog", lambda d: d.accept())
        self.page.on("pageerror", lambda e: self.errors.append("pageerror: " + str(e)))
        self.page.on("console", lambda m: self.errors.append("console.error: " + m.text)
                     if m.type == "error" and "Failed to load resource" not in m.text else None)
        self.page.goto(self.base + PAGE_PATH + hash_)
        self.ready()
        return self.page

    def ready(self, settle_ms=500):
        pg = self.page
        pg.wait_for_selector(".ap-calc .ap-calc-reset", timeout=20000)
        pg.wait_for_function("document.querySelectorAll('.ap-calc .ap-summary-value').length > 0", timeout=20000)
        # bible-import.js loads after the calculator (ordered lazy bundle); its control marks readiness
        try:
            pg.wait_for_function("document.querySelector('.ap-calc [class*=\"bible-import\"]')", timeout=8000)
        except Exception:
            pass
        pg.evaluate(PAGE_JS)
        pg.wait_for_timeout(settle_ms)

    def reset(self):
        """Back to a clean first visit on the same page: wipe storage, reload."""
        self.page.evaluate("localStorage.clear()")
        self.page.reload()
        self.ready(settle_ms=100)

    def ev(self, expr, *args):
        return self.page.evaluate(expr, *args) if args else self.page.evaluate(expr)

    def dump(self):
        return self.ev("window.__rg.dump()")

    def local_storage(self):
        return self.ev("Object.fromEntries(Object.entries(localStorage))")

    def click(self, sel):
        self.page.click(sel)
        self.page.wait_for_timeout(250)

    def reload(self):
        self.page.reload()
        self.ready()


def delta(base, after):
    """Only what differs, as new values (None = disappeared)."""
    out = {}
    for part in ("c", "r"):
        d = {}
        for k in set(base[part]) | set(after[part]):
            if base[part].get(k) != after[part].get(k):
                d[k] = after[part].get(k)
        if d:
            out[part] = dict(sorted(d.items()))
    return out


def run_calculator(base_url, payloads, fast=False):
    from playwright.sync_api import sync_playwright
    errors = []
    snap = {"meta": {}, "states": {}, "probes": {}, "checks": {}}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        s = Session(browser, base_url, errors)

        # ---- full-state walk -----------------------------------------------------
        s.fresh()
        meta = s.ev("window.__rg.meta()")
        snap["meta"] = {"controls": len(meta), "keys": [m["k"] for m in meta]}
        S = snap["states"]
        S["defaults"] = s.dump()

        for m in meta:
            if m["type"] == "number":
                s.ev("i => window.__rg.setNumber(i)", m["i"])
        S["all_numbers_changed"] = s.dump()

        for m in meta:
            if m["tag"] == "select" and m["options"]:
                s.ev("([i, v]) => window.__rg.setSelect(i, v)", [m["i"], m["options"][-1]])
        S["all_selects_last_option"] = s.dump()

        for m in meta:
            if m["type"] == "checkbox":
                s.ev("i => window.__rg.toggle(i)", m["i"])
        S["all_checkboxes_toggled"] = s.dump()

        s.reload()
        S["after_reload"] = s.dump()
        snap["checks"]["not_persisted_across_reload"] = sorted(
            k for k in S["all_checkboxes_toggled"]["c"] if S["all_checkboxes_toggled"]["c"][k] != S["after_reload"]["c"].get(k))

        s.click(".ap-calc-export")
        exported = s.ev("window.__rg.popoverText('export')")
        try:
            ex = json.loads(exported)
            ex.pop("exportedAt", None)
        except Exception:
            ex = {"unparseable": exported}
        snap["checks"]["export"] = ex
        s.click(".ap-calc-popover[data-popover=export] .ap-calc-popover-close")

        s.click(".ap-calc-reset")
        S["after_reset_before_import"] = s.dump()
        s.click(".ap-calc-import")
        s.ev("t => window.__rg.fillImport(t)", exported)
        s.click(".ap-calc-popover[data-popover=import] .ap-calc-popover-load")
        snap["checks"]["import_message"] = s.ev("window.__rg.popoverMsg('import')")
        S["after_import_of_export"] = s.dump()
        snap["checks"]["not_restored_by_export_import"] = sorted(
            k for k in S["after_reload"]["c"] if S["after_reload"]["c"][k] != S["after_import_of_export"]["c"].get(k))
        s.click(".ap-calc-popover[data-popover=import] .ap-calc-popover-close")

        # ---- presets: 2 gets a change, 3 stays empty, then back around ---------------
        s.click('.ap-calc-preset[data-preset="2"]')
        S["preset2_fresh"] = s.dump()
        s.ev("([k, v]) => window.__rg.setByKey(k, v)", ["input#ap-crit-stat:0", 700])
        S["preset2_crit_700"] = s.dump()
        s.click('.ap-calc-preset[data-preset="3"]')
        S["preset3_fresh"] = s.dump()
        s.click('.ap-calc-preset[data-preset="1"]')
        S["preset1_back"] = s.dump()
        s.click('.ap-calc-preset[data-preset="2"]')
        S["preset2_back"] = s.dump()
        snap["checks"]["preset2_kept_crit_700"] = S["preset2_back"]["c"].get("input#ap-crit-stat:0", "").startswith("700")

        s.click(".ap-calc-reset")
        S["after_reset_preset2"] = s.dump()

        # ---- Support on with its inputs set, then reload and Export -> Reset -> Import ----
        applied = [s.ev("([k, v]) => window.__rg.setByKey(k, v)", [k, v]) for k, v in SUPPORT_ON_INPUTS]
        if not all(applied):
            sys.exit("Support-on state: could not set " + ", ".join(k for (k, _), ok in zip(SUPPORT_ON_INPUTS, applied) if not ok)
                     + " (renamed or disabled control?). Update SUPPORT_ON_INPUTS.")
        S["support_on"] = s.dump()
        snap["checks"]["support_on_yearning"] = S["support_on"]["c"].get("input#ap-yearning:0")
        s.reload()
        S["support_on_after_reload"] = s.dump()
        s.click(".ap-calc-export")
        exported_support = s.ev("window.__rg.popoverText('export')")
        s.click(".ap-calc-popover[data-popover=export] .ap-calc-popover-close")
        s.click(".ap-calc-reset")
        s.click(".ap-calc-import")
        s.ev("t => window.__rg.fillImport(t)", exported_support)
        s.click(".ap-calc-popover[data-popover=import] .ap-calc-popover-load")
        S["support_on_after_import"] = s.dump()
        snap["checks"]["support_on_not_restored_by_export_import"] = sorted(
            k for k in S["support_on_after_reload"]["c"] if S["support_on_after_reload"]["c"][k] != S["support_on_after_import"]["c"].get(k))
        s.click(".ap-calc-popover[data-popover=import] .ap-calc-popover-close")

        # ---- Bible import fixtures via the bookmarklet's real fragment path ---------------
        for name in sorted(payloads):
            frag = "#bible-import=" + base64.b64encode(json.dumps(payloads[name], ensure_ascii=False).encode("utf8")).decode("ascii")
            s.fresh(hash_=frag)
            s.page.wait_for_timeout(500)
            S["bible_import:" + name] = s.dump()
            snap["checks"]["bible_import_ui:" + name] = s.ev("window.__rg.importStatus()")

        # ---- probes: one control at a time from clean defaults ----------------------------
        # Pure mode (default): storage wiped and the page reloaded before every probe, so
        # a probe can never see another probe's leftovers. Fast mode: undo the change in place,
        # and only fall back to the reload when the visible state is not back to defaults.
        s.fresh()
        base = s.dump()
        chips = s.ev("window.__rg.chips()")
        skipped = []
        P = snap["probes"]
        stats = {"reloads": 0}

        def restart():
            stats["reloads"] += 1
            s.reset()

        def probe(name, apply, undo=None):
            if not apply():
                return False
            P[name] = delta(base, s.dump())
            if fast and undo:
                undo()
                if s.dump() == base:
                    return True
            restart()
            return True

        for m in meta:
            if m["disabled"]:
                skipped.append(m["k"])
                continue
            i = m["i"]
            if m["type"] == "number":
                orig = m["value"]
                variants = [("changed", lambda i=i: s.ev("i => window.__rg.setNumber(i)", i),
                             lambda i=i, k=m["k"], orig=orig: s.ev("([k, v]) => window.__rg.setByKey(k, v)", [k, orig]))]
            elif m["type"] == "checkbox":
                variants = [("toggled", lambda i=i: s.ev("i => window.__rg.toggle(i)", i),
                             lambda i=i: s.ev("i => window.__rg.toggle(i)", i))]
            elif m["tag"] == "select":
                variants = [("=" + o, lambda i=i, o=o: s.ev("([i, v]) => window.__rg.setSelect(i, v)", [i, o]),
                             lambda i=i, v=m["value"]: s.ev("([i, v]) => window.__rg.setSelect(i, v)", [i, v]))
                            for o in m["options"] if o != m["value"]]
            else:
                continue
            for label, apply, undo in variants:
                if not probe(f"{m['k']} {label}", apply, undo):
                    skipped.append(m["k"] + " " + label)
                    restart()
        for n, label in enumerate(chips):
            probe(f"chip[{n}] {label}", lambda n=n: s.ev("n => window.__rg.clickChip(n)", n))
        probe("dock trigger click", lambda: s.ev("sel => window.__rg.clickSel(sel)", ".ap-build-dock-trigger"))
        snap["checks"]["probe_skipped_disabled_at_defaults"] = sorted(skipped)
        print(f"probes: {len(P)} ({stats['reloads']} page reloads, {'fast' if fast else 'pure'} mode)")

        browser.close()
    snap["checks"]["js_errors"] = sorted(set(errors))
    return snap


def run_importer(out_path):
    r = subprocess.run(["node", str(HERE / "import_snapshot.mjs"), "--out", str(out_path)], capture_output=True, text=True)
    if r.returncode:
        sys.exit("import_snapshot.mjs failed:\n" + r.stderr)
    return json.loads(pathlib.Path(out_path).read_text(encoding="utf8"))


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(site):
    handler = functools.partial(_Quiet, directory=str(site))
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"


def write_json(path, obj, gz):
    text = json.dumps(obj, indent=1, sort_keys=True, ensure_ascii=False) + "\n"
    if gz:
        pathlib.Path(path).write_bytes(gzip.compress(text.encode("utf8"), 9, mtime=0))
    else:
        pathlib.Path(path).write_text(text, encoding="utf8")


def read_json(path):
    b = pathlib.Path(path).read_bytes()
    return json.loads((gzip.decompress(b) if str(path).endswith(".gz") else b).decode("utf8"))


def snapshot(site, out, fast=False):
    site = pathlib.Path(site).resolve()
    if not (site / "resources" / "index.html").exists():
        sys.exit(f"{site} does not look like a built site (no resources/index.html). Run: mkdocs build -d {site}")
    out = pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    imp = run_importer(out / "importer.json")
    payloads = {n: f["payload"] for n, f in imp["fixtures"].items() if "data" in f["payload"]}
    srv, url = serve(site)
    try:
        calc = run_calculator(url, payloads, fast)
    finally:
        srv.shutdown()
    write_json(out / "calculator.json.gz", calc, gz=True)
    write_json(out / "importer.json", imp, gz=False)
    n_fields = sum(len(v["c"]) + len(v["r"]) for v in calc["states"].values())
    n_probe = sum(sum(len(x) for x in d.values()) for d in calc["probes"].values())
    print(f"snapshot: {len(calc['states'])} states, {n_fields} field readings, {len(calc['probes'])} probes "
          f"({n_probe} changed readings), {len(imp['fixtures'])} importer fixtures -> {out}")
    if calc["checks"]["js_errors"]:
        print("JS errors seen:", *calc["checks"]["js_errors"], sep="\n  ")
    return out


# ---------------------------------------------------------------------------------
# diff: walk both documents; every leaf that differs is one printed line.
# ---------------------------------------------------------------------------------
def walk_diff(a, b, path, out):
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a:
                out.append((path + [k], "<absent>", b[k]))
            elif k not in b:
                out.append((path + [k], a[k], "<absent>"))
            else:
                walk_diff(a[k], b[k], path + [k], out)
    elif a != b:
        out.append((path, a, b))


def diff_files(old, new, quiet=False):
    total = 0
    for name, gz in (("calculator.json.gz", True), ("importer.json", False)):
        o, n = pathlib.Path(old) / name, pathlib.Path(new) / name
        if not o.exists():
            print(f"[{name}] no baseline at {o}; run `baseline` first")
            total += 1
            continue
        out = []
        walk_diff(read_json(o), read_json(n), [], out)
        # the raw importer source path is not a behaviour change
        out = [d for d in out if d[0] != ["importerSource"]]
        total += len(out)
        print(f"[{name}] {len(out)} difference(s)")
        for path, a, b in out[:400]:
            print("  " + " / ".join(str(x) for x in path) + f": {json.dumps(a, ensure_ascii=False)[:160]} -> {json.dumps(b, ensure_ascii=False)[:160]}")
        if len(out) > 400:
            print(f"  ... {len(out) - 400} more")
    print("IDENTICAL to baseline" if total == 0 else f"{total} difference(s) total: explain each one or fix it")
    return total


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for c in ("snapshot", "check", "baseline"):
        sp = sub.add_parser(c)
        sp.add_argument("--site", required=True)
        if c == "snapshot":
            sp.add_argument("--out", required=True)
        if c != "baseline":
            sp.add_argument("--fast", action="store_true", help="probes undo in place instead of reloading (about 3x quicker; re-run without it before you trust a clean result)")
    sp = sub.add_parser("diff")
    sp.add_argument("old")
    sp.add_argument("new")
    a = ap.parse_args()

    if a.cmd == "snapshot":
        snapshot(a.site, a.out, a.fast)
    elif a.cmd == "baseline":
        BASELINES.mkdir(exist_ok=True)
        snapshot(a.site, BASELINES)
    elif a.cmd == "check":
        with tempfile.TemporaryDirectory() as tmp:
            snapshot(a.site, tmp, a.fast)
            sys.exit(1 if diff_files(BASELINES, tmp) else 0)
    elif a.cmd == "diff":
        o, n = pathlib.Path(a.old), pathlib.Path(a.new)
        if o.is_dir():
            sys.exit(1 if diff_files(o, n) else 0)
        out = []
        walk_diff(read_json(o), read_json(n), [], out)
        for path, x, y in out:
            print(" / ".join(str(p) for p in path) + f": {x} -> {y}")
        print(f"{len(out)} difference(s)")
        sys.exit(1 if out else 0)


if __name__ == "__main__":
    main()
