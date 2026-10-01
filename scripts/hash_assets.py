#!/usr/bin/env python3
"""
hash_assets.py - cache-busts this site's OWN css/js with a content hash. CI-only, run after
`mkdocs build` and after minify_assets.py, against the BUILT site directory, never docs/.

    python3 scripts/hash_assets.py site

WHY
Returning visitors keep a cached copy of a script until its URL changes. This used to be a
hand-bumped ?v=N on 31 entries in mkdocs.yml plus the five lazy files inside LAZY_BUNDLE, with a
CI gate (check_cachebust.py) to catch a missed bump, and a bump that cascaded: changing a lazy file
did nothing unless lazy-calculators.js was ALSO bumped. A missed bump shipped stale code to
returning visitors at least once. Now the URL carries a hash of the bytes that are actually
served, so there is nothing to remember and nothing to forget.

WHAT IT DOES
  1. Hashes every own file under javascripts/ and stylesheets/ (not assets/, which is Material's
     own and already content-named).
  2. Rewrites the file list inside lazy-calculators.js's LAZY_BUNDLE so each entry reads
     "name.js?v=<hash>". The hash is of that lazy file's final bytes.
  3. Re-hashes lazy-calculators.js AFTER step 2. This is the cascade: edit a lazy file and its
     hash changes, which changes lazy-calculators.js's bytes, which changes the hash in every
     page's <script> tag, so returning visitors refetch the loader and then the file.
  4. Rewrites every reference in every built .html to ?v=<hash>.
Sources carry no ?v= at all. A leftover ?v=N is replaced, not doubled.

ORDER MATTERS
Run it LAST, after minify_assets.py, so the hash is of the shipped bytes (comment-stripped), not of
the file in docs/. Running it before minification would hash bytes nobody receives.

SAFETY
It exits 1 (and writes nothing) if an html file references an own asset that is not in the build,
if LAZY_BUNDLE names a file that is not in the build, or if a stale ?v=<digits> survives the
rewrite. Stdlib only, so it needs no installs and does not touch `mkdocs serve`.
"""
import hashlib
import pathlib
import re
import sys

OWN_DIRS = ("javascripts", "stylesheets")
HASH_LEN = 10
LAZY_LOADER = "lazy-calculators.js"

# Matches a reference to an own asset (not under assets/), with or without an existing ?v=.
REF = re.compile(
    r"(?<!assets/)(?P<dir>javascripts|stylesheets)/(?P<name>[A-Za-z0-9._-]+\.(?:js|css))"
    r"(?P<q>\?v=[^\"'\s>]*)?(?=[\"'])"
)
LAZY_ARRAY = re.compile(r"(var\s+LAZY_BUNDLE\s*=\s*\[)(.*?)(\])", re.S)
LAZY_ENTRY = re.compile(r"\"([A-Za-z0-9._-]+\.js)(?:\?v=[^\"]*)?\"")


def digest(data):
    return hashlib.sha256(data).hexdigest()[:HASH_LEN]


def collect(site):
    """{(dir, name): Path} for every own css/js in the build."""
    out = {}
    for d in OWN_DIRS:
        base = site / d
        if base.is_dir():
            for p in sorted(base.iterdir()):
                if p.is_file() and p.suffix in (".js", ".css") and ".min." not in p.name:
                    out[(d, p.name)] = p
    return out


def rewrite_lazy_bundle(text, hashes):
    """Return (new_text, [missing names]) with every LAZY_BUNDLE entry given its content hash."""
    m = LAZY_ARRAY.search(text)
    if not m:
        return text, ["LAZY_BUNDLE array not found"]
    missing = []

    def sub(e):
        name = e.group(1)
        h = hashes.get(("javascripts", name))
        if h is None:
            missing.append(name)
            return e.group(0)
        return f'"{name}?v={h}"'

    body = LAZY_ENTRY.sub(sub, m.group(2))
    return text[: m.start(2)] + body + text[m.end(2):], missing


def process(site_dir):
    site = pathlib.Path(site_dir)
    if not site.is_dir():
        print(f"hash_assets.py: '{site_dir}' is not a directory", file=sys.stderr)
        return 1
    files = collect(site)
    if not files:
        print(f"hash_assets.py: no javascripts/ or stylesheets/ files under {site_dir}", file=sys.stderr)
        return 1

    hashes = {k: digest(p.read_bytes()) for k, p in files.items()}

    # Steps 2 + 3: lazy bundle first, then re-hash the loader itself.
    loader_key = ("javascripts", LAZY_LOADER)
    loader_new = None
    if loader_key in files:
        text = files[loader_key].read_text(encoding="utf-8")
        loader_new, missing = rewrite_lazy_bundle(text, hashes)
        if missing:
            print("hash_assets.py: LAZY_BUNDLE problem, nothing written: " + ", ".join(missing), file=sys.stderr)
            return 1
        hashes[loader_key] = digest(loader_new.encode("utf-8"))

    # Step 4: every html reference.
    html_new, problems, refs = {}, [], 0
    for page in sorted(site.rglob("*.html")):
        src = page.read_text(encoding="utf-8")

        def sub(m):
            nonlocal refs
            key = (m.group("dir"), m.group("name"))
            if key not in hashes:
                problems.append(f"{page.relative_to(site)}: references {key[0]}/{key[1]}, which is not in the build")
                return m.group(0)
            refs += 1
            return f"{key[0]}/{key[1]}?v={hashes[key]}"

        out = REF.sub(sub, src)
        if out != src:
            html_new[page] = out
    if problems:
        print("hash_assets.py: nothing written:\n  " + "\n  ".join(sorted(set(problems))), file=sys.stderr)
        return 1

    if loader_new is not None:
        files[loader_key].write_text(loader_new, encoding="utf-8")
    for page, out in html_new.items():
        page.write_text(out, encoding="utf-8")

    # Verify: nothing numeric-looking is left behind.
    stale = []
    for page in html_new:
        for m in re.finditer(r"(?:javascripts|stylesheets)/[A-Za-z0-9._-]+\.(?:js|css)\?v=(\d{1,4})(?=[\"'])", page.read_text(encoding="utf-8")):
            stale.append(f"{page.relative_to(site)}: {m.group(0)}")
    if stale:
        print("hash_assets.py: stale numeric ?v= survived:\n  " + "\n  ".join(stale), file=sys.stderr)
        return 1

    print(f"hash_assets.py: {len(files)} asset(s) hashed, {refs} reference(s) in {len(html_new)} page(s) rewritten"
          + (", LAZY_BUNDLE rewritten" if loader_new is not None else ""))
    return 0


if __name__ == "__main__":
    sys.exit(process(sys.argv[1] if len(sys.argv) > 1 else "site"))
