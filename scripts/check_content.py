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
  7. The SHAPE of every inline JSON block (ark-passives, ark-cores, skill-setup, gem-priority,
     rotation-line, skills-table): right root type, required keys present, no key the engine does
     not read (a stale pre-simplification key such as "tiers" or "label" on a node), values in range
     (rune tier, core slot, points 0-3, a node level within its max, a tripod 1-3). The engines
     skip what they do not recognise, so a block in an old shape renders blank, and when it sits
     inside a collapsed <details> nobody sees it. check_ids.py only checks id membership.
  8. No tab group with more than 8 tabs. extra.css pairs each tab's input with its label by
     :nth-of-type(1..8) to colour the active tab, so a ninth tab would silently lose its styling.
  9. Comments in docs/ source (markdown <!-- -->, JS // and /* */, CSS /* */) that narrate history
     ("previously", "used to be", "no longer", "formerly", "no more"). Style policy: a comment states
     how the code works now and why a rule exists; what it looked like before belongs in git. Visible
     page text is not scanned, only comments.
  10. The damage shares in docs/javascripts/order-core-data.js match the dps-chart blocks of the build
     pages they are copied from (the Order Core table reads them), and each Order core's relic/ancient
     figures there appear as that pair in its 17P line in core-options-data.js. Fix stale shares by
     running python3 scripts/sync_order_core_shares.py.
"""
import datetime
import json
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
    ("optimizedtraining", "OT 1"),
    ("maxmp", "Max MP"),
    ("raidcaptain", "RC"),
    ("massincrease", "MI"),
    ("orbcirculation", "OC 5"),
    ("releasepotential", "RP 4"),
}


# ---------------------------------------------------------------------------
# 7. JSON block shapes. Allowed keys mirror what each engine actually reads;
# anything else is a stale or mistyped key. Per-node/per-item overrides stay
# allowed (project-context.md, DATA SIMPLIFICATION CONVENTION: the explicit
# field wins over the table lookup).
# ---------------------------------------------------------------------------
JSON_BLOCK = re.compile(
    r'<(\w+)\b([^>]*?\bclass="([^"]*)"[^>]*)>\s*<script type="application/json">(.*?)</script>', re.S)
RUNE_TIERS = {"common", "uncommon", "rare", "epic", "legendary"}
AP_COLUMNS = {"evolution", "enlightenment", "leap"}
CORE_SLOTS = {"sun", "moon", "star"}


def _keys(obj, allowed, required=()):
    """Return problem strings for unknown / missing keys of one object."""
    out = []
    for k in obj:
        if k not in allowed:
            out.append(f"unknown key {k!r} (the engine does not read it; stale or mistyped?)")
    for k in required:
        if k not in obj:
            out.append(f"missing required key {k!r}")
    return out


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def validate_block(kind, data, ap_max):
    """Return a list of 'where: what' strings for one parsed JSON block."""
    errs = []

    def add(where, msg):
        errs.append(f"{where}: {msg}")

    if not isinstance(data, list):
        return [f"root must be an array, got {type(data).__name__}"]

    if kind == "ark-passives":
        for ci, col in enumerate(data):
            w = f"column {ci + 1}"
            if not isinstance(col, dict):
                add(w, "must be an object")
                continue
            for m in _keys(col, {"id", "nodes", "label", "points"}, ("id", "nodes")):
                add(w, m)
            if col.get("id") not in AP_COLUMNS:
                add(w, f"id {col.get('id')!r} is not one of {sorted(AP_COLUMNS)}")
            if not isinstance(col.get("nodes"), list):
                add(w, "'nodes' must be an array")
                continue
            for ni, n in enumerate(col["nodes"]):
                w2 = f"{col.get('id')} node {ni + 1}"
                if not isinstance(n, dict):
                    add(w2, "must be an object")
                    continue
                for m in _keys(n, {"id", "level", "max", "tier", "name"}, ("id", "level")):
                    add(w2, m)
                lvl = n.get("level")
                if not _is_int(lvl) or lvl < 0:
                    add(w2, f"level {lvl!r} must be a whole number, 0 or more")
                    continue
                cap = n.get("max", ap_max.get(n.get("id")))
                if _is_int(cap) and lvl > cap:
                    add(w2, f"{n.get('id')} level {lvl} is above its max {cap}")

    elif kind == "ark-cores":
        for i, c in enumerate(data):
            w = f"core {i + 1}"
            if not isinstance(c, dict):
                add(w, "must be an object")
                continue
            for m in _keys(c, {"core", "label", "points"}, ("core", "points")):
                add(w, m)
            if c.get("core") not in CORE_SLOTS:
                add(w, f"core {c.get('core')!r} is not one of {sorted(CORE_SLOTS)}")
            if not _is_int(c.get("points")) or not 0 <= c.get("points", -1) <= 3:
                add(w, f"points {c.get('points')!r} must be a whole number 0-3")

    elif kind == "skill-setup":
        for i, e in enumerate(data):
            w = f"entry {i + 1} ({e.get('id') if isinstance(e, dict) else '?'})"
            if not isinstance(e, dict):
                add(w, "must be an object")
                continue
            if "subtitle" in e:  # a section header row
                for m in _keys(e, {"id", "subtitle"}, ("id",)):
                    add(w, m)
                continue
            for m in _keys(e, {"id", "level", "rune", "tripods", "name"}, ("id", "level")):
                add(w, m)
            lvl = e.get("level")
            if not _is_int(lvl) or not 1 <= lvl <= 14:
                add(w, f"level {lvl!r} must be a whole number 1-14")
            if "rune" in e:
                r = e["rune"]
                if not isinstance(r, dict):
                    add(w, "'rune' must be an object like {\"tier\": ..., \"name\": ...}")
                else:
                    for m in _keys(r, {"tier", "name"}, ("tier", "name")):
                        add(w + " rune", m)
                    if r.get("tier") not in RUNE_TIERS:
                        add(w + " rune", f"tier {r.get('tier')!r} is not one of {sorted(RUNE_TIERS)}")
            if "tripods" in e:
                t = e["tripods"]
                if not (isinstance(t, list) and 1 <= len(t) <= 3 and all(_is_int(x) and 1 <= x <= 3 for x in t)):
                    add(w, f"tripods {t!r} must be 1-3 whole numbers, each 1-3")

    elif kind == "gem-priority":
        if len(data) != 2:
            add("root", f"must have exactly 2 columns (dmg and cd), has {len(data)}")
        for ci, col in enumerate(data):
            w = f"column {ci + 1}"
            if not isinstance(col, dict):
                add(w, "must be an object")
                continue
            for m in _keys(col, {"col", "items", "label"}, ("col", "items")):
                add(w, m)
            if col.get("col") not in {"dmg", "cd"}:
                add(w, f"col {col.get('col')!r} must be 'dmg' or 'cd'")
            if not isinstance(col.get("items"), list):
                add(w, "'items' must be an array")
                continue
            for ii, it in enumerate(col["items"]):
                w2 = f"{col.get('col')} item {ii + 1}"
                if isinstance(it, str):
                    continue
                if not isinstance(it, dict):
                    add(w2, "must be an id string or an object")
                    continue
                for m in _keys(it, {"id", "alts", "tip", "label", "name"}, ("id",)):
                    add(w2, m)
                alts = it.get("alts", [])
                if not isinstance(alts, list):
                    add(w2, "'alts' must be an array")
                    continue
                for ai, a in enumerate(alts):
                    if isinstance(a, str):
                        continue
                    if not isinstance(a, dict):
                        add(f"{w2} alt {ai + 1}", "must be an id string or an object")
                        continue
                    for m in _keys(a, {"id", "note", "label", "name"}, ("id",)):
                        add(f"{w2} alt {ai + 1}", m)

    elif kind == "rotation-line":
        step_keys = {"id", "swapNext", "situational", "cycleRef", "title", "suffix", "stageLabel", "skills"}
        for i, st in enumerate(data):
            w = f"step {i + 1}"
            if isinstance(st, str):
                continue
            if not isinstance(st, dict):
                add(w, "must be a skill id string or an object")
                continue
            for m in _keys(st, step_keys):
                add(w, m)
            if not ({"id", "cycleRef", "suffix", "stageLabel", "skills"} & set(st)):
                add(w, "object has none of id / cycleRef / suffix / stageLabel / skills, so it renders nothing")
            if "skills" in st and not isinstance(st["skills"], list):
                add(w, "'skills' must be an array")

    elif kind == "skills-table":
        for i, e in enumerate(data):
            w = f"row {i + 1}"
            if not isinstance(e, dict):
                add(w, "must be an object")
                continue
            for m in _keys(e, {"id", "name"}, ("id",)):
                add(w, m)
    return errs


def check_json_blocks(text, rel, line_of, ap_max, problems):
    for m in JSON_BLOCK.finditer(text):
        kind = m.group(3).split()[0]
        if kind not in {"ark-passives", "ark-cores", "skill-setup", "gem-priority", "rotation-line", "skills-table"}:
            continue
        try:
            data = json.loads(m.group(4))
        except ValueError as exc:
            problems.append(f"{rel}:{line_of(m.start())}: {kind} block is not valid JSON ({exc})")
            continue
        for e in validate_block(kind, data, ap_max):
            problems.append(f"{rel}:{line_of(m.start())}: {kind} block, {e}")


# ---------------------------------------------------------------------------
# 8. Tab groups: extra.css styles the active tab for the first 8 only.
# ---------------------------------------------------------------------------
MAX_TABS = 8
TAB_HEADER = re.compile(r'^(\s*)=== "')


def check_tab_limit(text, rel, problems):
    groups = {}  # indent -> tabs counted so far in the group open at that indent
    fence = False
    for n, line in enumerate(text.splitlines(), 1):
        if re.match(r"^\s*(```|~~~)", line):
            fence = not fence
            continue
        if fence or not line.strip():
            continue
        indent = len(line) - len(line.lstrip(" "))
        m = TAB_HEADER.match(line)
        if m:
            for k in [k for k in groups if k > indent]:
                del groups[k]
            groups[indent] = groups.get(indent, 0) + 1
            if groups[indent] == MAX_TABS + 1:
                problems.append(f"{rel}:{n}: tab group has more than {MAX_TABS} tabs; extra.css only styles "
                                f"the active tab for the first {MAX_TABS} (extend the :nth-of-type list, "
                                f"or split the group)")
        else:
            for k in [k for k in groups if k >= indent]:
                del groups[k]


def data_names(filename, pattern):
    return dict(re.findall(pattern, (JS / filename).read_text(), re.M))


HISTORY_WORDS = re.compile(
    r"\bpreviously\b|\bformerly\b|\bno longer\b|\bno more\b|\bused to (?:be|have|sit|work|force|reuse|live|read)\b"
    r"|\bearlier (?:draft|version)\b|\b(?:a )?prior version\b|\braised \d+ ?(?:->|to) ?\d+|\bwas (?:a )?mistranscri",
    re.I)
MD_COMMENT = re.compile(r"<!--(.*?)-->", re.S)
BLOCK_COMMENT = re.compile(r"/\*(.*?)\*/", re.S)
LINE_COMMENT = re.compile(r"^\s*//(.*)$", re.M)


def check_history_comments(text, rel, kind, problems):
    """9. Flag history-narrating wording inside comments only."""
    patterns = {"md": [MD_COMMENT], "js": [BLOCK_COMMENT, LINE_COMMENT], "css": [BLOCK_COMMENT]}[kind]
    for pat in patterns:
        for m in pat.finditer(text):
            hit = HISTORY_WORDS.search(m.group(1))
            if hit:
                line = text.count("\n", 0, m.start(1) + hit.start()) + 1
                problems.append(f"{rel}:{line}: comment narrates history ({hit.group(0)!r}); "
                                "state the current behaviour and why, history belongs in git")


def check_home_rows(problems):
    """11. Each home row names a build in build-data.js, and its link text matches that
    build's name (the row's emoji, words, description and pill are filled from the data)."""
    data = (JS / "build-data.js").read_text()
    names = {}
    for fam, body in re.findall(r'^\s{4}(re|surge): \{(.*?)^\s{4}\},?$', data, re.M | re.S):
        for bid, name in re.findall(r'id: "([^"]+)",\s*name: "([^"]+)"', body):
            names[(fam, bid)] = name
    text = (DOCS / "index.md").read_text()
    for m in re.finditer(r'<div class="home-row"[^>]*data-family="([^"]+)" data-build="([^"]+)"[^>]*>.*?\[([^\]]*)\]\(', text, re.S):
        fam, bid, shown = m.groups()
        line = text.count("\n", 0, m.start()) + 1
        if (fam, bid) not in names:
            problems.append(f"docs/index.md:{line}: home row data-family={fam!r} data-build={bid!r} "
                            f"has no matching build in build-data.js")
            continue
        plain = re.sub(r"<[^>]+>", "", shown).strip()
        plain = re.sub(r"\s+", " ", plain)
        expect = re.sub(r"\s*\((.*)\)$", r" \1", names[(fam, bid)])
        if plain != expect:
            problems.append(f"docs/index.md:{line}: home row link text {plain!r} but build-data.js "
                            f"names it {names[(fam, bid)]!r}")


# Numbers the "How the calculator works" page quotes straight from the calculator's
# constants: (JS constant, text that must appear on the page with {v} filled in from the JS).
# "pct" shows the value x 100. A renamed constant, a changed value or an edited sentence
# fails here, so the page cannot drift from the code unnoticed. Add a row when the page
# quotes a new constant; numbers computed from several constants are read from the real
# calculator by hand instead.
PAGE_CONSTANTS = [
    ("SUPPORT_AP_BUFF_COEFFICIENT", "BaseAP * {v} *", False),
    ("SUPPORT_ETHER_EFFECTIVENESS", "Ether effectiveness of {v}", False),
    ("MAELSTROM_SPEED_BONUS", "Maelstrom adds {v}%", False),
    ("RAID_CAPTAIN_BASE_MOVE_SPEED", "({v} base", False),
    ("RAID_CAPTAIN_MOVE_SPEED_CAP", "capped at {v}%", False),
    ("SUPPORT_PALADIN_MOVE_SPEED", "({v}% at a", False),
    ("SUPPORT_PALADIN_MOVE_SPEED_UPTIME", "{v}% assumed uptime", False),
    ("KBW_EV_MALUS", "times {v} if Keen", False),
    ("BACK_ATTACK_DPS_SHARE", "times the {v} back attack share", False),
    ("STAGGER_DPS_SHARE", "at the {v}% share", True),
    ("CRIT_BASE", "bracelet-free {v}", False),
    ("SPEC_BASE", "(m - 1) / ({v} * m)", False),
    ("SPEC_REF", "reference Spec of {v}", False),
    ("SPEC_SKILL_COEFFICIENT", "m = 1 + ({v} * shareRatio", False),
    ("AWAKENING_COEFFICIENT", "+ {v} * awakeningRatio", False),
    ("RE_AWAKENING_SHARE", "Awakening is {v}% of damage on RE", True),
    ("SURGE_AWAKENING_SHARE", "and {v}% on Surge", True),
    ("MAELSTROM_UPTIME_DEFAULT_RE", "{v}% on RE, ", False),
    ("MAELSTROM_UPTIME_DEFAULT_SURGE", "{v}% on Surge 111 and 333", False),
    ("MAELSTROM_UPTIME_DEFAULT_SURGE_222", "{v}% on Surge 222", False),
    ("RAGE_RUNE_SPEED_BONUS", "Rage Rune ({v} on Surge)", False),
    ("MANA_FOOD_BLEED_DMG", "Maelstrom Bleed rune's +{v}% damage", True),
    ("AMBUSH_MASTER_BACK_DMG", "({v}% times your effective back attack share", True),
    ("GEAR_AP_ASTROGEM_MAX", "level / 120 x {v}%", False),
    ("GEAR_AP_ASTROGEM_MAX_LEVEL", "level / {v} x 4.4%", False),
    ("ADRENALINE_STACKS", "3 of {v} stacks", False),
]

# Literals that are not named constants: (pattern in the JS, whether the value is shown x 100,
# the text the page must contain, a name for the message).
PAGE_LITERALS = [
    (r"const addDmgMaster = addDmgBase \+ ([0-9.]+);", True, "Master adds {v} points", "Master Additional Damage"),
    (r"const T19 = S19 \+ ([0-9.]+);", True, "Pulverize adds {v} points", "Pulverize Evolution Damage"),
]

# Defaults that live in the page markup: (file, pattern, template, name).
PAGE_HTML_DEFAULTS = [
    ("resources.md", r'id="ap-adrenaline-uptime"[^>]*value="([0-9.]+)"', '<td>{v}%</td>\n<td class="doc-num">', "Adrenaline uptime default"),
    ("resources.md", r'id="ap-gear-support-uptime"[^>]*value="([0-9.]+)"', "At the defaults ({v}% uptime)", "Support uptime default"),
]


def _fmt_number(v):
    return str(int(v)) if float(v).is_integer() else repr(round(v, 10))


def check_page_constants(problems):
    page = ROOT / "docs" / "resources" / "calculator.md"
    if not page.exists():
        return
    text = page.read_text()
    js = (JS / "ark-passive-calculator.js").read_text()
    rel = str(page.relative_to(ROOT))
    for name, template, pct in PAGE_CONSTANTS:
        m = re.search(r"^\s*const " + name + r" = (-?[0-9.]+);", js, re.M)
        if not m:
            problems.append(f"{rel}: constant {name} not found in ark-passive-calculator.js (renamed or removed?)")
            continue
        value = float(m.group(1)) * (100 if pct else 1)
        expected = template.format(v=_fmt_number(value))
        if expected not in text:
            problems.append(f"{rel}: expected the text {expected!r} ({name} = {m.group(1)} in the JS)")
    for pattern, pct, template, label in PAGE_LITERALS:
        m = re.search(pattern, js)
        if not m:
            problems.append(f"{rel}: {label} not found in ark-passive-calculator.js (code changed?)")
            continue
        expected = template.format(v=_fmt_number(round(float(m.group(1)) * (100 if pct else 1), 10)))
        if expected not in text:
            problems.append(f"{rel}: expected the text {expected!r} ({label} = {m.group(1)} in the JS)")
    for fname, pattern, template, label in PAGE_HTML_DEFAULTS:
        src = (ROOT / "docs" / fname).read_text()
        m = re.search(pattern, src)
        if not m:
            problems.append(f"docs/{fname}: {label} not found (markup changed?)")
            continue
        expected = template.format(v=_fmt_number(float(m.group(1))))
        if expected not in text:
            problems.append(f"{rel}: expected the text {expected!r} ({label} = {m.group(1)} in {fname})")
    burn = re.search(r"const ARK_SMOLDERING_BURN_TABLE = \{ Relic: ([0-9.]+), Ancient: ([0-9.]+) \}", js)
    if not burn:
        problems.append(f"{rel}: ARK_SMOLDERING_BURN_TABLE not found in ark-passive-calculator.js")
    else:
        relic = float(burn.group(1)) * 100
        ratio = float(burn.group(2)) / float(burn.group(1))
        for expected in (f"It is {_fmt_number(relic)}% of total damage at Relic", f"{_fmt_number(ratio)} times that at Ancient"):
            if expected not in text:
                problems.append(f"{rel}: expected the text {expected!r} (ARK_SMOLDERING_BURN_TABLE in the JS)")


# Dropdowns whose option labels quote a tier table: (select id, table in the JS).
TIER_DROPDOWNS = [
    ("ap-necklace", "NECKLACE_ADD_TABLE"),
    ("ap-ring1-rate", "RING_RATE_TABLE"), ("ap-ring2-rate", "RING_RATE_TABLE"),
    ("ap-ring1-dmg", "RING_DMG_TABLE"), ("ap-ring2-dmg", "RING_DMG_TABLE"),
]
# Candidate-line tables that must hold the same Low/Mid/High figures as the live-field table.
TWIN_TABLES = [("ACC_NECKLACE_ADD_TABLE", "NECKLACE_ADD_TABLE"), ("ACC_RING_DMG_TABLE", "RING_DMG_TABLE")]


def _tier_table(js, name):
    m = re.search(r"const " + name + r" = NONE_LOW_MID_HIGH\(([^)]*)\);", js)
    if m:
        v = [float(x) for x in m.group(1).split(",")]
        return {"None": v[0], "Low": v[1], "Mid": v[2], "High": v[3]}
    m = re.search(r"const " + name + r" = \{([^}]*)\};", js)
    if m:
        return {k: float(v) for k, v in re.findall(r"(\w+):\s*([0-9.]+)", m.group(1))}
    return None


def check_tier_dropdowns(problems):
    """Every tier dropdown label must equal its table value, so a mistyped table cannot hide."""
    js = (JS / "ark-passive-calculator.js").read_text()
    res = (DOCS / "resources.md").read_text()
    for sel_id, table in TIER_DROPDOWNS:
        values = _tier_table(js, table)
        m = re.search(r'<select id="' + sel_id + r'"[^>]*>(.*?)</select>', res, re.S)
        if values is None or not m:
            problems.append(f"docs/resources.md: tier dropdown {sel_id} or table {table} not found")
            continue
        for tier, label in re.findall(r'<option value="(\w+)"[^>]*>([0-9.]+)%</option>', m.group(1)):
            if abs(float(label) - values[tier] * 100) > 1e-9:
                problems.append(f"docs/resources.md: {sel_id} {tier} says {label}% but {table}[{tier}] = {values[tier]}")
    for twin, base in TWIN_TABLES:
        a, b = _tier_table(js, twin), _tier_table(js, base)
        if a is None or b is None:
            problems.append(f"ark-passive-calculator.js: {twin} or {base} not found")
        elif any(abs(a[k] - b[k]) > 1e-9 for k in a):
            problems.append(f"ark-passive-calculator.js: {twin} and {base} hold different figures (tracked apart on purpose, so update the guide if this is intended)")


def check_surge_share_row(problems):
    """The register row quoting each build's Surge share must match order-core-data.js."""
    data = (JS / "order-core-data.js").read_text()
    page = (DOCS / "resources" / "calculator.md").read_text()
    names = [("re-111", "RE 111"), ("re-333", "RE 333"), ("surge-111", "Surge 111"), ("surge-222", "Surge 222"), ("surge-333", "Surge 333")]
    parts = []
    for build, label in names:
        m = re.search(r'"' + build + r'": \{[^}]*?\bsurge: ([0-9.]+)', data)
        if not m:
            problems.append(f"order-core-data.js: no Surge share for {build}")
            return
        parts.append(f"{label} {_fmt_number(float(m.group(1)))}%")
    expected = ", ".join(parts)
    if expected not in page:
        problems.append(f"docs/resources/calculator.md: the Surge share register row should read {expected!r}")


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

    ap_max = {k: int(v) for k, v in re.findall(
        r'^\s*([a-zA-Z0-9]+):\s*\{[^}]*?\bmax:\s*(\d+)', (JS / "ap-node-names.js").read_text(), re.M)}

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
            shown = re.sub(r"<[^>]+>", "", inner)
            # A leading icon written as markdown (an engraving card's name) is
            # not display text.
            shown = re.sub(r"!\[[^\]]*\]\([^)]*\)(\{:[^}]*\})?", "", shown).strip()
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

        # 7 + 8. JSON block shapes, tab limit
        check_json_blocks(text, rel, line_of, ap_max, problems)
        check_tab_limit(text, rel, problems)

        # 5. unstyled setup-note kinds
        for m in re.finditer(r'<details class="setup-note"[^>]*data-kind="([^"]+)"', text):
            if m.group(1) not in styled_kinds:
                problems.append(f"{rel}:{line_of(m.start())}: setup-note data-kind="
                                f"{m.group(1)!r} has no matching rule in extra.css "
                                f"(renders with no accent). Known: {sorted(styled_kinds)}")

    # 9. history-narrating comments (md comments, JS, CSS)
    for path in MD:
        check_history_comments(path.read_text(), str(path.relative_to(ROOT)), "md", problems)
    for path in sorted(JS.glob("*.js")):
        check_history_comments(path.read_text(), str(path.relative_to(ROOT)), "js", problems)
    for path in sorted((DOCS / "stylesheets").glob("*.css")):
        check_history_comments(path.read_text(), str(path.relative_to(ROOT)), "css", problems)

    # 10. Order Core Comparison shares match the build pages
    sys.path.insert(0, str(ROOT / "scripts"))
    import sync_order_core_shares
    problems.extend(sync_order_core_shares.check())

    # 11. home rows match build-data.js
    check_home_rows(problems)
    check_page_constants(problems)
    check_tier_dropdowns(problems)
    check_surge_share_row(problems)

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
