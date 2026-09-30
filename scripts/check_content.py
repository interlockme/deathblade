#!/usr/bin/env python3
"""
check_content.py - catches authoring mistakes that build cleanly and render
without an error, so nothing tells you they happened.

Companion to check_ids.py, which covers unresolvable ids. This one covers the
rest of the hand-authored surface: dates, the id/class pairing the calculator
markup depends on, display text that has drifted away from the DATA files,
and a few vocabulary typos. Zero dependencies beyond the standard library.

    python3 scripts/check_content.py

Exit code 0 if clean, 1 if anything failed, so it can gate a CI job.

CHECKS
  1. data-updated dates parse, and are not in the future. A future date
     renders as "Updated Sep 16, 2026" to someone reading on the 15th, which
     reads as a mistake. last-updated.js has no guard for this on purpose
     (it fails quiet on a malformed date), so it has to be caught here.
     A data-update-note must be non-empty and sit next to a data-updated, or
     the tooltip it feeds never renders.
  2. In markdown, any element carrying BOTH id and class must have the id as
     its FIRST class token. ark-passive-calculator.js selects those fields by
     CLASS (".ap-gear-wp") while save/export/import matches by ID
     ("ap-gear-wp"), so the two drifting apart silently half-breaks a field:
     it still renders, still computes, but stops persisting. All 82 current
     fields satisfy this; the check keeps it that way.
  3. Option labels reading "1 Nodes". NOTE: only the visible LABEL is checked.
     The value="1 Nodes" string is a live lookup key in seven tables in
     ark-passive-calculator.js AND in already-saved presets/exports, so it
     must never be "corrected" - see that file's ADRENALINE_TABLE etc.
  4. skill-mention / skill-inline display text vs the DATA files. Deliberate
     short forms are allow-listed below; anything else flags, so renaming a
     skill in skill-names.js surfaces the pages still showing the old name.
  5. setup-note data-kind values that have no matching CSS rule (an unstyled
     note still renders, just with no accent, which is easy to miss).
  6. Every extra_css / extra_javascript entry in mkdocs.yml carries a ?v=.
"""
import datetime
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
JS = DOCS / "javascripts"
MD = sorted(DOCS.glob("**/*.md"))

# Display text that intentionally differs from the DATA file's full name.
# Key is (id, rendered text); add to this rather than widening the check.
ALLOWED_SHORT_FORMS = {
    ("maxmp", "Max MP"),
    ("raidcaptain", "RC"),
    ("massincrease", "MI"),
    ("orbcirculation", "OC 5"),
    ("releasepotential", "RP 4"),
}


def data_names(filename, pattern):
    return dict(re.findall(pattern, (JS / filename).read_text(), re.M))


def check():
    problems = []
    today = datetime.date.today()

    skill_names = data_names("skill-names.js", r'^\s*([a-zA-Z0-9]+):\s*"([^"]+)"')
    ap_names = dict(
        re.findall(
            r'^\s*([a-zA-Z0-9]+):\s*\{[^}]*?name:\s*"([^"]+)"',
            (JS / "ap-node-names.js").read_text(),
            re.M | re.S,
        )
    )

    css = (ROOT / "docs" / "stylesheets" / "extra.css").read_text()
    styled_kinds = set(re.findall(r'setup-note\[data-kind="([^"]+)"\]', css))

    for md in MD:
        text = md.read_text()
        rel = md.relative_to(ROOT)

        def line_of(pos):
            return text.count("\n", 0, pos) + 1

        # 1. dates
        for m in re.finditer(r'data-updated="([^"]*)"', text):
            raw = m.group(1)
            try:
                d = datetime.date.fromisoformat(raw)
            except ValueError:
                problems.append(f"{rel}:{line_of(m.start())}: unparseable data-updated {raw!r} "
                                f"(last-updated.js will silently render no badge)")
                continue
            if d > today:
                problems.append(f"{rel}:{line_of(m.start())}: data-updated {raw} is in the future "
                                f"(today is {today.isoformat()})")

        # 1b. a note needs a badge to hang on
        for m in re.finditer(r'<div\b[^>]*\bdata-update-note="[^"]*"[^>]*>', text):
            tag = m.group(0)
            note = re.search(r'data-update-note="([^"]*)"', tag).group(1)
            if not note.strip():
                problems.append(f"{rel}:{line_of(m.start())}: empty data-update-note "
                                f"(remove it, or write the note)")
            if not re.search(r'\bdata-updated="', tag):
                problems.append(f"{rel}:{line_of(m.start())}: data-update-note without data-updated "
                                f"(no badge renders, so the note is never shown)")

        # 2. id / first-class pairing
        for m in re.finditer(r'id="([^"]+)"\s+class="([^"]+)"', text):
            el_id, cls = m.group(1), m.group(2)
            if cls.split()[0] != el_id:
                problems.append(
                    f"{rel}:{line_of(m.start())}: id={el_id!r} but first class is "
                    f"{cls.split()[0]!r} - JS selects this field by class and persists it by id, "
                    f"so they must match"
                )

        # 3. "1 Nodes" label
        for m in re.finditer(r">1 Nodes<", text):
            problems.append(f"{rel}:{line_of(m.start())}: option label reads '1 Nodes' "
                            f"(fix the LABEL only, never value=\"1 Nodes\")")

        # 4. display-text drift
        for m in re.finditer(r'<span class="skill-(?:mention|inline)"([^>]*)>(.*?)</span>', text, re.S):
            attrs, inner = m.group(1), m.group(2)
            shown = re.sub(r"<[^>]+>", "", inner).strip()
            sid = re.search(r'data-skill-id="([^"]+)"', attrs)
            aid = re.search(r'data-ap-id="([^"]+)"', attrs)
            lvl = re.search(r'data-level="([^"]+)"', attrs)
            if sid and sid.group(1) in skill_names:
                expect = skill_names[sid.group(1)]
                if shown != expect and (sid.group(1), shown) not in ALLOWED_SHORT_FORMS:
                    problems.append(f"{rel}:{line_of(m.start())}: skill '{sid.group(1)}' shows "
                                    f"{shown!r}, skill-names.js says {expect!r}")
            if aid and aid.group(1) in ap_names:
                expect = ap_names[aid.group(1)] + (" " + lvl.group(1) if lvl else "")
                if shown != expect and (aid.group(1), shown) not in ALLOWED_SHORT_FORMS:
                    problems.append(f"{rel}:{line_of(m.start())}: ap node '{aid.group(1)}' shows "
                                    f"{shown!r}, expected {expect!r}")

        # 5. unstyled setup-note kinds
        for m in re.finditer(r'<details class="setup-note"[^>]*data-kind="([^"]+)"', text):
            if m.group(1) not in styled_kinds:
                problems.append(f"{rel}:{line_of(m.start())}: setup-note data-kind="
                                f"{m.group(1)!r} has no matching rule in extra.css "
                                f"(renders with no accent). Known: {sorted(styled_kinds)}")

    # 6. cache-bust present on every listed asset
    mk = (ROOT / "mkdocs.yml").read_text()
    for m in re.finditer(r"^\s*-\s*((?:javascripts|stylesheets)/[A-Za-z0-9._-]+)(\?v=(\d+))?\s*$",
                         mk, re.M):
        if not m.group(2):
            problems.append(f"mkdocs.yml: '{m.group(1)}' has no ?v= cache-bust suffix")

    return problems


if __name__ == "__main__":
    found = check()
    if found:
        print(f"check_content.py: {len(found)} problem(s):\n")
        for p in found:
            print("  " + p)
        sys.exit(1)
    print("check_content.py: all content checks pass.")
    sys.exit(0)
