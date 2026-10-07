#!/usr/bin/env python3
"""Behaviour probe for the CPM and Bid calculators on /resources/.

regress.py and smoke.py do not drive these two widgets, so a restyle of them is
invisible to the regression baseline. This script drives every input and records
every output text, so the same run before and after a markup or CSS change can be
diffed: outputs must be identical, only layout may change.

  python3 scripts/regression/calc_probe.py --site site_out --out probe.json
  python3 scripts/regression/calc_probe.py --site site_out --check scripts/regression/baselines/calc_probe.json

The probe reads only behaviour hooks (classes the scripts query), never styling
classes, so a pure restyle that keeps those hooks leaves the output unchanged.
"""
import argparse
import functools
import http.server
import json
import sys
import threading

from playwright.sync_api import sync_playwright


def serve(site):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k):
            pass

    handler = functools.partial(Quiet, directory=site)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def txt(pg, sel):
    return pg.evaluate(
        "s => { const e = document.querySelector(s); return e ? e.textContent.trim() : null }", sel
    )


def cpm_row_state(pg, i):
    return pg.evaluate(
        """i => {
          const r = document.querySelectorAll('.cpm-calc-row')[i];
          const q = s => { const e = r.querySelector(s); return e ? e.textContent.trim() : null };
          const v = s => { const e = r.querySelector(s); return e ? e.value : null };
          return {
            build: r.dataset.build,
            meta: q('.cpm-calc-row-meta'),
            tag: q('.cpm-calc-row-tag'),
            raid: v('.cpm-calc-raidcpm'),
            ba: v('.cpm-calc-ba-input'),
            base: v('.cpm-calc-basemult-input'),
            rate: q('.cpm-calc-ba-rate'),
            adj: q('.cpm-calc-adj-value'),
            final: q('.cpm-calc-result-value'),
            bar: r.querySelector('.cpm-calc-bar-fill').style.width,
            best: r.classList.contains('cpm-calc-row-best'),
            recent: [...r.querySelectorAll('.cpm-calc-recent-chip')].map(c => c.textContent.trim()),
            recentHidden: r.querySelector('.cpm-calc-recent') ? r.querySelector('.cpm-calc-recent').hidden : null,
          };
        }""",
        i,
    )


def cpm_all(pg):
    return [cpm_row_state(pg, i) for i in range(3)]


def cpm_rate_state(pg):
    return pg.evaluate(
        """() => {
          const w = document.querySelector('.cpm-rate-calc');
          return {
            time: w.querySelector('.cpm-rate-calc-time').value,
            count: w.querySelector('.cpm-rate-calc-count').value,
            out: w.querySelector('.cpm-rate-calc-result-value').textContent.trim(),
            empty: w.querySelector('.cpm-rate-calc-result-value').classList.contains('cpm-rate-calc-output-empty'),
            invalid: w.querySelector('.cpm-rate-calc-time').classList.contains('cpm-rate-calc-input-invalid'),
          };
        }"""
    )


def probe_cpm(pg):
    out = {}
    pg.evaluate("localStorage.clear()")
    pg.reload()
    pg.wait_for_timeout(1500)
    out["initial"] = cpm_all(pg)
    out["rate_initial"] = cpm_rate_state(pg)

    rows = pg.locator(".cpm-calc-row")

    def setrow(i, raid=None, ba=None, base=None, blur=True):
        r = rows.nth(i)
        if raid is not None:
            r.locator(".cpm-calc-raidcpm").fill(raid)
        if ba is not None:
            r.locator(".cpm-calc-ba-input").fill(ba)
        if base is not None:
            r.locator(".cpm-calc-basemult-input").fill(base)
        if blur:
            pg.evaluate("document.activeElement && document.activeElement.blur()")
        pg.wait_for_timeout(80)

    seq = {}
    setrow(0, "9.5", "80")
    seq["one_row_filled"] = cpm_all(pg)
    setrow(1, "6.5", "92")
    seq["two_rows_best"] = cpm_all(pg)
    setrow(2, "7", "84")
    seq["three_rows_best"] = cpm_all(pg)
    setrow(2, "0", None)
    seq["raid_zero"] = cpm_row_state(pg, 2)
    setrow(2, "25", None)
    seq["raid_over_max"] = cpm_row_state(pg, 2)
    setrow(2, "7", "101")
    seq["ba_over_max"] = cpm_row_state(pg, 2)
    setrow(2, "7", "0")
    seq["ba_zero"] = cpm_row_state(pg, 2)
    setrow(2, "7", "84", base="3")
    seq["base_over_max"] = cpm_row_state(pg, 2)
    setrow(2, None, None, base="1.4")
    seq["base_custom"] = cpm_row_state(pg, 2)
    setrow(2, None, None, base="")
    seq["base_blank_falls_back"] = cpm_row_state(pg, 2)
    setrow(0, "", "")
    seq["row0_cleared"] = cpm_all(pg)
    out["sequence"] = seq

    # history: chip click refills, dedupe, max 4, Clear
    hist = {}
    pg.evaluate("localStorage.clear()")
    pg.reload()
    pg.wait_for_timeout(1500)
    for cpm, ba in [("5", "70"), ("6", "71"), ("7", "72"), ("8", "73"), ("9", "74"), ("9", "74")]:
        setrow(0, cpm, ba)
    hist["after_six_entries"] = cpm_row_state(pg, 0)["recent"]
    setrow(0, "", "")
    pg.locator(".cpm-calc-row").nth(0).locator(".cpm-calc-recent-chip").nth(1).click()
    hist["after_chip_click"] = cpm_row_state(pg, 0)
    pg.locator(".cpm-calc-row").nth(0).locator(".cpm-calc-recent-clear").click()
    hist["after_clear"] = cpm_row_state(pg, 0)
    out["history"] = hist

    # rate widget
    rate = {}
    t = pg.locator(".cpm-rate-calc-time")
    c = pg.locator(".cpm-rate-calc-count")
    for name, time, count in [
        ("min_sec", "2m 3s", "31"),
        ("bare_seconds", "123", "31"),
        ("colon", "2:03", "31"),
        ("hms", "1:02:03", "100"),
        ("hours", "1h 1m", "50"),
        ("garbage", "abc", "31"),
        ("zero_time", "0", "31"),
        ("no_count", "2m", ""),
        ("count_zero", "2m", "0"),
        ("over_max_time", "130m", "10"),
        ("count_over_max", "2m", "5000"),
    ]:
        t.fill(time)
        c.fill(count)
        pg.evaluate("document.activeElement && document.activeElement.blur()")
        pg.wait_for_timeout(60)
        rate[name] = cpm_rate_state(pg)
    out["rate"] = rate
    return out


def bid_state(pg):
    return pg.evaluate(
        """() => {
          const r = document.querySelector('.bid-calc');
          const q = s => { const e = r.querySelector(s); return e ? e.textContent.trim() : null };
          const cls = (s, c) => { const e = r.querySelector(s); return e ? e.classList.contains(c) : null };
          const active = g => [...r.querySelectorAll(g + ' .ap-build-chip-active')].map(b => b.dataset.value);
          const copy = r.querySelector('.bid-calc-copy-btn');
          return {
            price: r.querySelector('.bid-market-price').value,
            priceInvalid: cls('.bid-market-price', 'bid-calc-input-invalid'),
            size: active('.bid-calc-toggle'),
            customDisabled: r.querySelector('.bid-custom-raid-size').disabled,
            customVal: r.querySelector('.bid-custom-raid-size').value,
            customInvalid: cls('.bid-custom-raid-size', 'bid-calc-input-invalid'),
            intent: active('.bid-calc-intent'),
            result: q('.bid-calc-result-value'),
            resultEmpty: cls('.bid-calc-result-value', 'bid-calc-result-empty'),
            rawBid: r.querySelector('.bid-calc-result-value').dataset.rawBid || null,
            copyDisabled: copy ? copy.disabled : null,
            youBid: q('.bid-calc-you-bid'), youProfit: q('.bid-calc-you-profit'), youParty: q('.bid-calc-you-party'),
            nextBid: q('.bid-calc-next-bid'), nextProfit: q('.bid-calc-next-profit'), nextParty: q('.bid-calc-next-party'),
            tableEmpty: cls('.bid-calc-table', 'bid-calc-table-empty'),
            nextRisk: cls('.bid-calc-row-next', 'bid-calc-row-next-risk'),
          };
        }"""
    )


def probe_bid(pg, ctx):
    out = {}
    pg.reload()
    pg.wait_for_timeout(1500)
    out["initial"] = bid_state(pg)
    price = pg.locator(".bid-market-price")
    grid = {}
    price.fill("")
    price.type("974612")
    grid["typed_price_grouped"] = bid_state(pg)
    for size in ["4", "8", "16"]:
        pg.click(f'.bid-calc-toggle [data-value="{size}"]')
        for intent in ["equal", "punish", "max"]:
            pg.click(f'.bid-calc-intent [data-value="{intent}"]')
            price.fill("")
            price.type("9000")
            grid[f"size{size}_{intent}"] = bid_state(pg)
    pg.click('.bid-calc-toggle [data-value="custom"]')
    grid["custom_empty"] = bid_state(pg)
    cust = pg.locator(".bid-custom-raid-size")
    for v in ["1", "2", "6", "30"]:
        cust.fill(v)
        pg.evaluate("document.activeElement && document.activeElement.blur()")
        pg.wait_for_timeout(60)
        grid[f"custom_{v}"] = bid_state(pg)
    pg.click('.bid-calc-toggle [data-value="8"]')
    grid["custom_back_to_8"] = bid_state(pg)
    for p in ["0", "abc", "1000000000000", "5000000000000"]:
        price.fill("")
        price.type(p)
        pg.evaluate("document.activeElement && document.activeElement.blur()")
        pg.wait_for_timeout(60)
        grid[f"price_{p}"] = bid_state(pg)
    price.fill("")
    price.type("9000")
    out["grid"] = grid

    ctx.grant_permissions(["clipboard-read", "clipboard-write"])
    pg.click('.bid-calc-intent [data-value="punish"]')
    btn = pg.locator(".bid-calc-copy-btn")
    copy = {"label_before": btn.inner_text().strip(), "aria_before": btn.get_attribute("aria-label")}
    btn.click()
    pg.wait_for_timeout(200)
    copy["label_after"] = btn.inner_text().strip()
    copy["aria_after"] = btn.get_attribute("aria-label")
    copy["copied_class"] = "bid-calc-copy-btn-copied" in (btn.get_attribute("class") or "")
    try:
        copy["clipboard"] = pg.evaluate("navigator.clipboard.readText()")
    except Exception as e:  # clipboard read is optional in headless
        copy["clipboard"] = "unreadable"
    pg.wait_for_timeout(1700)
    copy["label_reset"] = btn.inner_text().strip()
    out["copy"] = copy
    return out


def run(site):
    srv = serve(site)
    base = f"http://127.0.0.1:{srv.server_address[1]}"
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1100, "height": 900})
        pg = ctx.new_page()
        pg.goto(base + "/resources/")
        pg.wait_for_timeout(1800)
        result = {"cpm": probe_cpm(pg), "bid": probe_bid(pg, ctx)}
        b.close()
    srv.shutdown()
    return result


def diff(a, b, path=""):
    out = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                out.append(f"{path}/{k}: only in {'new' if k in b else 'baseline'}")
            else:
                out += diff(a[k], b[k], f"{path}/{k}")
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (x, y) in enumerate(zip(a, b)):
            out += diff(x, y, f"{path}[{i}]")
    elif a != b:
        out.append(f"{path}: {a!r} -> {b!r}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="site_out")
    ap.add_argument("--out")
    ap.add_argument("--check")
    args = ap.parse_args()
    res = run(args.site)
    if args.out:
        with open(args.out, "w") as f:
            json.dump(res, f, indent=1, sort_keys=True)
        print("wrote", args.out)
    if args.check:
        with open(args.check) as f:
            base = json.load(f)
        d = diff(base, res)
        if d:
            print(f"{len(d)} differences from baseline:")
            for line in d[:80]:
                print("  ", line)
            sys.exit(1)
        print("IDENTICAL to baseline")
    if not args.out and not args.check:
        print(json.dumps(res, indent=1, sort_keys=True))


if __name__ == "__main__":
    main()
