#!/usr/bin/env python3
"""
check_ids.py - catches the exact failure mode project-context.md's
"AUDITING GOTCHA" section describes: a typo'd id in a build page's JSON
data block (skill-setup, gem-priority, rotation-line, ark-passives) or in
a data-*="..." attribute silently renders blank instead of erroring,
because every widget looks the id up in its matching DATA file and just
skips anything it doesn't recognize.

This script parses every markdown page under docs/ for id-shaped
references and checks each one against the id sets actually defined in
docs/javascripts/*.js. Zero dependencies beyond the standard library -
run it with `python3 scripts/check_ids.py` from the repo root, or wire
it into a CI step before `mkdocs build`.

Exit code is 0 if everything resolves, 1 if anything doesn't (so it can
gate a CI job).

WHAT THIS DOES NOT DO: it doesn't parse JS as JS (no real parser,
regex only) and it doesn't validate JSON *shape* (array-root, etc) -
just id membership. Malformed JSON syntax is still caught by mkdocs
build itself just fine; this catches the specific "valid JSON, wrong
id" case that build doesn't.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / "docs" / "javascripts"
MD = list((ROOT / "docs").glob("**/*.md"))


def keys_from(path, pattern):
    text = (JS / path).read_text()
    return set(re.findall(pattern, text, re.M))


# ---- known-id sets, one per DATA file ----
KNOWN = {
    "skill": (
        keys_from("skill-names.js", r'^\s*([a-zA-Z0-9]+):\s*"')
        | keys_from("skill-data.js", r'^\s*([a-zA-Z0-9]+):\s*\{')
    ),
    "ap_node": keys_from("ap-node-names.js", r'^\s*([a-zA-Z0-9]+):\s*\{'),
    "rune": keys_from("rune-data.js", r'^\s*([a-zA-Z0-9]+):\s*\{'),
    "glossary": keys_from("glossary-data.js", r'^\s*([a-zA-Z0-9]+):\s*\{'),
    "build": keys_from("build-data.js", r'id:\s*"([a-z0-9-]+)"'),
    "core": keys_from("core-options-data.js", r'^\s*([a-zA-Z0-9]+):\s*\{'),
}

# ---- where each kind of reference shows up in markdown, and which
#      known-id set it should resolve against. `lower` = compare
#      case-insensitively (rune-tooltip.js does name.toLowerCase()).
REFERENCE_PATTERNS = [
    # JSON blocks: {"id": "x", ...} inside skill-setup/gem-priority/
    # rotation-line/ark-passives - all share the same "id" key name, so
    # one pattern covers all four block types. ap-passives ids AND
    # skill ids both land in this bucket; checked against the union.
    (r'"id":\s*"([a-zA-Z0-9]+)"', "skill_or_ap", False),
    (r'data-skill-id="([a-zA-Z0-9]+)"', "skill", False),
    (r'data-ap-id="([a-zA-Z0-9]+)"', "ap_node", False),
    (r'data-glossary-id="([a-zA-Z0-9]+)"', "glossary", False),
    (r'data-build="([a-z0-9-]+)"', "build", False),
    (r'data-rune-name="([a-zA-Z]+)"', "rune", True),
]


def check():
    problems = []
    skill_or_ap = KNOWN["skill"] | KNOWN["ap_node"]

    for md_file in MD:
        text = md_file.read_text()
        rel = md_file.relative_to(ROOT)
        is_build_page = rel.parts[1] in ("remaining-energy", "surge") if len(rel.parts) > 1 else False
        for pattern, bucket, lower in REFERENCE_PATTERNS:
            if bucket == "build" and not is_build_page:
                # resources.md's ap-calc build-dock reuses data-build="re-111"
                # etc for its own internal (unrelated) vocabulary - only
                # actual build pages use data-build against build-data.js ids.
                continue
            for m in re.finditer(pattern, text):
                ref = m.group(1)
                key = ref.lower() if lower else ref
                known = skill_or_ap if bucket == "skill_or_ap" else KNOWN[bucket]
                if key not in known:
                    line = text.count("\n", 0, m.start()) + 1
                    problems.append(f"{rel}:{line}: '{ref}' not found in {bucket} data ({m.group(0)})")

    problems += check_missing_ids()
    return problems


# Opening tags that MUST carry an id attribute to get a tooltip at all. The
# id-resolution pass above can only vouch for ids that are present; an
# element that omits the id entirely renders as plain text with no tooltip
# and never trips it (this is how a bare FTF span sat in 333-ceiling.md).
ID_REQUIRED_TAGS = re.compile(
    r'<span\s+class="(?:skill-inline|skill-mention)(?:\s[^"]*)?"([^>]*)>'
)
ID_ATTRS = ("data-skill-id=", "data-glossary-id=", "data-ap-id=", "data-rune-name=")


def check_missing_ids():
    problems = []
    for md_file in MD:
        text = md_file.read_text()
        rel = md_file.relative_to(ROOT)
        for m in ID_REQUIRED_TAGS.finditer(text):
            if not any(a in m.group(1) for a in ID_ATTRS):
                line = text.count("\n", 0, m.start()) + 1
                problems.append(f"{rel}:{line}: tooltip span has no id attribute ({m.group(0)})")
    return problems


if __name__ == "__main__":
    problems = check()
    if problems:
        print(f"check_ids.py: {len(problems)} unresolved id reference(s):\n")
        for p in problems:
            print("  " + p)
        sys.exit(1)
    print("check_ids.py: all id references resolve cleanly.")
    sys.exit(0)
