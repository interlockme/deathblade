#!/usr/bin/env python3
"""Calculator Import must validate what it is given before it changes anything.

Importing resets every field to its default and then applies the data, so a paste that cannot
import anything (wrong shape, another tool's JSON, a nested value, a checkbox given a string,
a file over the size cap) must be refused with the preset exactly as it was. Valid imports
(Export's own envelope, an envelope without format/version, a bare field map, numbers for
text fields, unknown fields next to known ones) must keep working. The file chooser must
survive a repeat pick of the same file.

    mkdocs build -d site_out
    python3 scripts/regression/test_import_validation.py --site site_out

Each negative control patches a copy of the built site to remove one safeguard and expects the
suite to fail, so a check that cannot fail is caught.
"""
import argparse
import json
import pathlib
import shutil
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from test_bible_load import Harness, serve  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

IMPORT = ".ap-calc-popover[data-popover=import]"
EXPORT = ".ap-calc-popover[data-popover=export]"
ASTRO = ".ap-astrogem-lv"
SCRIPT = "javascripts/ark-passive-calculator.js"


def set_field(h, selector, value):
    h.page.evaluate(
        """([sel, v]) => { const e = document.querySelector(sel); e.value = v;
        e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); }""",
        [selector, value],
    )


def value(h, selector=ASTRO):
    return h.page.evaluate("(s) => document.querySelector(s).value", selector)


def export_text(h):
    h.page.click(".ap-calc-export")
    text = h.page.input_value(EXPORT + " textarea")
    h.page.click(EXPORT + " .ap-calc-popover-close")
    return text


def state(h):
    return json.loads(export_text(h))["data"]


def message(h):
    return h.page.evaluate("(s) => document.querySelector(s + ' .ap-calc-popover-msg').textContent", IMPORT)


def do_import(h, text):
    h.page.click(".ap-calc-import")
    h.page.fill(IMPORT + " textarea", text)
    h.page.click(IMPORT + " .ap-calc-popover-load")
    return message(h)


def start(h):
    h.fresh()
    set_field(h, ASTRO, "33")


def accepts(h, label, text, field_expect, msg_has=None):
    start(h)
    msg = do_import(h, text)
    h.check(value(h) == field_expect and msg.startswith("Imported into Preset") and (msg_has is None or msg_has in msg),
            f"accepts {label}", f"astrogem={value(h)!r} msg={msg[:120]!r}")


def refuses(h, label, text, msg_has):
    start(h)
    before = state(h)
    msg = do_import(h, text)
    after = state(h)
    h.check(msg_has in msg and before == after and value(h) == "33",
            f"refuses {label} and changes nothing", f"msg={msg[:140]!r} unchanged={before == after} astrogem={value(h)!r}")


def run(browser, base):
    h = Harness(browser, base)

    # What Export itself writes must import back exactly.
    h.fresh()
    set_field(h, ASTRO, "40")
    exported = export_text(h)
    set_field(h, ASTRO, "33")
    msg = do_import(h, exported)
    h.check(value(h) == "40" and msg.startswith("Imported into Preset"), "accepts the calculator's own export", f"{value(h)!r} {msg[:100]!r}")

    accepts(h, "an envelope without format and version", '{"data": {"ap-astrogem-lv": "55"}}', "55")
    accepts(h, "a bare field map", '{"ap-astrogem-lv": "55"}', "55")
    accepts(h, "a number for a text field", '{"ap-astrogem-lv": 55}', "55")
    accepts(h, "an unknown field next to a known one", '{"ap-astrogem-lv": "55", "not-a-field": "x"}', "55", "left as-is: not-a-field")
    accepts(h, "a stale option value, reported", '{"ap-astrogem-lv": "55", "ap-bracelet-dmg": "Nonsense"}', "55", "ap-bracelet-dmg")

    refuses(h, "data as an empty array", '{"data": []}', "export")
    refuses(h, "data as an empty object", '{"data": {}}', "export")
    refuses(h, "a top-level array", '[1, 2]', "export")
    refuses(h, "a number", "5", "export")
    refuses(h, "another tool's format marker", '{"format": "other-tool", "version": 1, "data": {"ap-astrogem-lv": "55"}}', "different tool")
    refuses(h, "a newer version", '{"format": "deathblade-ap-calc", "version": 99, "data": {"ap-astrogem-lv": "55"}}', "newer version")
    refuses(h, "a version that is not a whole number", '{"format": "deathblade-ap-calc", "version": "1", "data": {"ap-astrogem-lv": "55"}}', "export")
    refuses(h, "a nested object as a value", '{"data": {"ap-astrogem-lv": {"x": 1}}}', "isn't valid for that field")
    refuses(h, "null as a value", '{"ap-astrogem-lv": null}', "isn't valid for that field")
    refuses(h, "a string for a checkbox", '{"ap-astrogem-lv": "55", "ap-engr-manafood": "false"}', "isn't valid for that field")
    refuses(h, "a boolean for a text field", '{"ap-astrogem-lv": true}', "isn't valid for that field")
    refuses(h, "fields that exist nowhere on this page", '{"name": "x", "data": {"a": "b"}}', "None of the fields")
    refuses(h, "truncated JSON", '{"data": {"ap-astrogem-lv": "55"', "not valid JSON")
    refuses(h, "text over the size cap", "x" * 2_000_001, "too large")

    # The file chooser: a repeat pick of the same file works, and an oversized file is refused.
    start(h)
    h.page.click(".ap-calc-import")
    chooser = IMPORT + " .ap-calc-popover-file"
    good = {"name": "export.json", "mimeType": "application/json", "buffer": b'{"ap-astrogem-lv": "55"}'}
    h.page.set_input_files(chooser, files=[good])
    h.page.wait_for_function("(s) => document.querySelector(s).value === '55'", arg=ASTRO)
    set_field(h, ASTRO, "33")
    h.page.click(".ap-calc-import")
    h.page.set_input_files(chooser, files=[good])
    try:
        h.page.wait_for_function("(s) => document.querySelector(s).value === '55'", arg=ASTRO, timeout=3000)
        again = True
    except Exception:
        again = False
    h.check(again, "choosing the same file twice imports both times", f"astrogem={value(h)!r}")

    # A refused file leaves the popover open; the input must clear so the same file, once fixed and
    # saved again, can be chosen again (a browser fires no change for an unchanged choice).
    start(h)
    h.page.click(".ap-calc-import")
    h.page.set_input_files(chooser, files=[{"name": "bad.json", "mimeType": "application/json", "buffer": b'{"data": []}'}])
    h.page.wait_for_timeout(600)
    h.check("export" in message(h) and h.page.evaluate("(s) => document.querySelector(s).files.length", chooser) == 0,
            "a refused file clears the file input, so the same file can be chosen again", message(h)[:100])

    start(h)
    before = state(h)
    h.page.click(".ap-calc-import")
    h.page.set_input_files(chooser, files=[{"name": "big.json", "mimeType": "application/json", "buffer": b"x" * 2_100_000}])
    h.page.wait_for_timeout(600)
    h.check("too large" in message(h) and state(h) == before, "refuses a file over the size cap and changes nothing", message(h)[:120])
    h.check(len(h.page.input_value(IMPORT + " textarea")) < 1000, "an oversized file is not even loaded into the textarea", str(len(h.page.input_value(IMPORT + " textarea"))))
    h.check(not h.errors, "no page errors", str(h.errors))
    return h


CONTROLS = [
    ("validation removed: reset first, apply whatever", [(
        "    const checked = validateImport(root, parsed);\n    if (checked.error) {",
        "    const checked = { data: (parsed && parsed.data) || parsed };\n    if (false) {")]),
    ("a checkbox accepts a string", [("ok = typeof v === \"boolean\";", "ok = true;")]),
    ("format marker not compared", [("if (\"format\" in parsed && parsed.format !== EXPORT_FORMAT_MARKER) {", "if (false) {")]),
    ("pasted text has no size cap", [("    if (text.length > MAX_IMPORT_CHARS) {", "    if (false) {")]),
    ("file has no size cap", [("            if (file.size > MAX_IMPORT_CHARS) {", "            if (false) {")]),
    ("file input is not cleared", [("            }).then(done, done);", "            });")]),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="site_out")
    args = ap.parse_args()
    site = pathlib.Path(args.site)
    if not (site / SCRIPT).exists():
        sys.exit(f"{site / SCRIPT} not found: run mkdocs build -d {site} first")
    ok = True
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        srv, base = serve(site)
        h = run(browser, base)
        srv.shutdown()
        print(f"{h.checks} checks, {len(h.failures)} failure(s)")
        for f in h.failures:
            print("  FAIL", f)
        ok = not h.failures
        for label, patches in CONTROLS:
            tmp = pathlib.Path(tempfile.mkdtemp())
            copy = tmp / "site"
            shutil.copytree(site, copy)
            target = copy / SCRIPT
            body = target.read_text(encoding="utf8")
            for old, new in patches:
                if old not in body:
                    sys.exit(f"negative control '{label}': patch target not found: {old[:60]}")
                body = body.replace(old, new, 1)
            target.write_text(body, encoding="utf8")
            srv2, base2 = serve(copy)
            try:
                hc = run(browser, base2)
                detected = bool(hc.failures)
            except Exception:
                detected = True
            srv2.shutdown()
            shutil.rmtree(tmp, ignore_errors=True)
            print(f"negative control ({label}): {'detected' if detected else 'NOT DETECTED'}")
            ok = ok and detected
        browser.close()
    print("PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
