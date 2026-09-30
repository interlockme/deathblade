#!/usr/bin/env python3
"""
make_fixture.py - turn a "Save page as" lostark.bible character page into an importer fixture.

    python3 scripts/regression/make_fixture.py NAME path/to/saved-page.html
    python3 scripts/regression/make_fixture.py --derive-no-raid NAME SOURCE_FIXTURE_NAME

Writes fixtures/NAME.html.gz and fixtures/NAME.lines.json.

--derive-no-raid writes a DERIVED fixture: a copy of an existing fixture whose
most_recent_raid loadout is relabeled so the importer sees no raid snapshot. It is synthetic
(no real page had that shape), so it pins the fallback path, not Bible's real format.

NAME describes what the fixture exercises (relic-chaos-star, no-raid-loadout), never the
character. The saved page is anonymized before it is written: the character name, guild name
and stronghold name are replaced with placeholders everywhere they occur (page text, URLs,
hydration data) and the script refuses to write a fixture that still contains one.

HOW TO SAVE A GOOD PAGE
  Open the character's URL directly in a fresh tab (or hard-reload with Ctrl+Shift+R)
  and let it finish loading BEFORE saving. Do not reach the page by searching from
  another Bible page: Bible is a client-side app, and after in-site navigation the
  rendered text updates but the embedded hydration data stays the PREVIOUS character's.
  A page saved that way mixes two characters. This script refuses one it can detect.

The lines file mirrors what the bookmarklet passes to buildPayload: document.body.innerText
split on newlines, trimmed, blanks dropped. It is read with JavaScript disabled so the saved
page's own scripts cannot re-render anything.

Needs: pip install playwright && playwright install chromium
"""
import gzip
import json
import pathlib
import re
import sys
import urllib.parse
from html import escape as html_escape

HERE = pathlib.Path(__file__).resolve().parent
FIXTURES = HERE / "fixtures"


def identity(html):
    """The three strings that identify the account: (character, guild, stronghold); None if absent."""
    title = re.search(r"<title>(.*?)</title>", html, re.S)
    char = title.group(1).split("(")[0].strip() if title else None
    guild = re.search(r'guild:\{name:"([^"]+)"', html)
    hold = re.search(r'stronghold:\{[^}]*?name:"([^"]+)"', html)
    return char or None, guild and guild.group(1), hold and hold.group(1)


def variants(word):
    """The spellings a name takes in a saved page: raw, percent-encoded (URLs), HTML-escaped."""
    return sorted({word, urllib.parse.quote(word, safe=""), html_escape(word)}, key=len, reverse=True)


def scrub(html, lines, name):
    """Replace the identifying strings in the page and the text lines. Returns (html, lines, report).

    The character name is replaced wherever it occurs as a substring. Guild and stronghold names
    can be ordinary words, so those are replaced only as whole words."""
    char, guild, hold = identity(html)
    fixed = [(char, "Fixture-" + name, False), (guild, "FixtureGuild", True), (hold, "FixtureStronghold", True)]
    report = []
    for word, repl, whole in fixed:
        if not word:
            continue
        n = 0
        for v in variants(word):
            pat = re.compile((r"(?<!\w)" + re.escape(v) + r"(?!\w)") if whole else re.escape(v))
            html, k = pat.subn(repl, html)
            n += k
            lines = [pat.sub(repl, l) for l in lines]
        report.append(f"{word!r} -> {repl!r} ({n} in page)")
        left = [v for v in variants(word) if v in html or any(v in l for l in lines)]
        if left:
            sys.exit(f"Anonymizing failed: {left} is still present after replacement.")
    return html, lines, report


def derive_no_raid(name, source):
    src_html = FIXTURES / f"{source}.html.gz"
    src_lines = FIXTURES / f"{source}.lines.json"
    if not src_html.exists() or not src_lines.exists():
        sys.exit(f"No fixture named {source!r} in {FIXTURES}.")
    html = gzip.decompress(src_html.read_bytes()).decode("utf8")
    marker = 'classification:"most_recent_raid"'
    if html.count(marker) < 1:
        sys.exit(f"Fixture {source!r} has no most_recent_raid loadout to remove.")
    html = html.replace(marker, 'classification:"removed_for_fixture"')
    (FIXTURES / f"{name}.html.gz").write_bytes(gzip.compress(html.encode("utf8"), 9, mtime=0))
    (FIXTURES / f"{name}.lines.json").write_bytes(src_lines.read_bytes())
    print(f"derived fixture '{name}' from '{source}' (most_recent_raid relabeled)")


def main():
    if len(sys.argv) == 4 and sys.argv[1] == "--derive-no-raid":
        if not re.fullmatch(r"[A-Za-z0-9_-]+", sys.argv[2]):
            sys.exit(__doc__)
        return derive_no_raid(sys.argv[2], sys.argv[3])
    if len(sys.argv) != 3 or not re.fullmatch(r"[A-Za-z0-9_-]+", sys.argv[1]):
        sys.exit(__doc__)
    name, page = sys.argv[1], pathlib.Path(sys.argv[2]).resolve()
    html = page.read_text(encoding="utf8")

    title = re.search(r"<title>(.*?)</title>", html, re.S)
    title_name = title.group(1).split("(")[0].strip() if title else ""
    if "loadouts:[" not in html:
        sys.exit("No hydration data (loadouts:[) in this file; it is not a Bible character page saved after load.")
    # A stale-hydration page still names the NEW character in <title>, but the hydration
    # blob was written for the old one. The blob carries no character name, so the only
    # checkable signal is a second fixture with identical hydration: warn if we see that.
    blob = html[html.index("loadouts:["):][:4000]
    for other in FIXTURES.glob("*.html.gz"):
        if other.stem.removesuffix(".html") == name:
            continue
        other_html = gzip.decompress(other.read_bytes()).decode("utf8")
        if other_html[other_html.index("loadouts:["):][:4000] == blob:
            sys.exit(f"Hydration data is identical to fixture {other.name}, but this page is '{title_name}'. "
                     "This looks like a page saved after in-site navigation (stale hydration). Re-save it from a fresh load.")

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(java_script_enabled=False, viewport={"width": 1400, "height": 2000})
        pg = ctx.new_page()
        pg.goto(page.as_uri())
        text = pg.evaluate("document.body.innerText")
        browser.close()
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    html, lines, report = scrub(html, lines, name)
    title_name = "Fixture-" + name

    FIXTURES.mkdir(exist_ok=True)
    (FIXTURES / f"{name}.html.gz").write_bytes(gzip.compress(html.encode("utf8"), 9, mtime=0))
    (FIXTURES / f"{name}.lines.json").write_text(json.dumps(lines, ensure_ascii=False, indent=0) + "\n", encoding="utf8")
    print(f"fixture '{name}': {len(html):,} bytes html, {len(lines)} text lines")
    print("anonymized: " + "; ".join(report))


if __name__ == "__main__":
    main()
