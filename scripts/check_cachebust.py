#!/usr/bin/env python3
"""
check_cachebust.py - fails if a css/js file changed without its ?v= number
being bumped in the same push.

WHY
project-context.md calls a missed bump "easy to miss on a multi-file pass",
and it has been missed before: a returning visitor keeps serving a stale
cached copy of a file you just edited, which looks like "my change didn't
deploy" and is almost impossible to diagnose from the outside.

This compares the real before/after of a commit range, so it is exact rather
than heuristic. It runs in CI (the Actions runner has full history) and works
locally too: commit (or use two existing SHAs) and pass them in, e.g.
`python3 scripts/check_cachebust.py HEAD~1 HEAD`. It needs a .git folder; with
no git history there is nothing to diff, so bump ?v= by hand for every
css/js file you touched.

WHERE EACH FILE BUMPS
  - The five lazy calculator files bump in docs/javascripts/lazy-calculators.js
    (its LAZY_BUNDLE array).
  - Everything else, plus lazy-calculators.js itself, bumps in mkdocs.yml.
This script works that out per file, so it can't be fooled by bumping the
wrong one of the two.

USAGE
  python3 scripts/check_cachebust.py <base_sha> <head_sha>

In a push event those are ${{ github.event.before }} and ${{ github.sha }}.
Needs fetch-depth: 0 on actions/checkout so both commits are present. If the
base commit isn't reachable (first push to a branch, force-push, new repo),
the check skips rather than failing the build.

Bumping is always safe - worst case is one unnecessary cache invalidation -
so when this fires, just bump the number.
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LAZY = "docs/javascripts/lazy-calculators.js"

# Files whose ?v= lives in LAZY_BUNDLE rather than mkdocs.yml.
LAZY_OWNED = {
    "cpm-calculator.js",
    "bid-calculator.js",
    "ark-passive-calculator.js",
    "bible-import.js",
    "ap-brace-tooltip.js",
}


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)


def versions_in(text):
    """{filename: version} for every `name.ext?v=N` reference in a blob."""
    return {
        m.group(1): m.group(2)
        for m in re.finditer(r"([A-Za-z0-9._-]+\.(?:js|css))\?v=(\d+)", text)
    }


def blob(sha, path):
    r = git("show", f"{sha}:{path}")
    return r.stdout if r.returncode == 0 else ""


def main(base, head):
    if not base or set(base) == {"0"}:
        print("check_cachebust.py: no usable base commit, skipping.")
        return 0

    if git("cat-file", "-e", f"{base}^{{commit}}").returncode != 0:
        print(f"check_cachebust.py: base commit {base[:8]} not available, skipping.")
        return 0

    changed = git("diff", "--name-only", base, head).stdout.split()
    assets = [
        p for p in changed
        if (p.startswith("docs/javascripts/") and p.endswith(".js"))
        or p == "docs/stylesheets/extra.css"
    ]
    if not assets:
        print("check_cachebust.py: no css/js changed in this push.")
        return 0

    before = {
        "mkdocs.yml": versions_in(blob(base, "mkdocs.yml")),
        LAZY: versions_in(blob(base, LAZY)),
    }
    after = {
        "mkdocs.yml": versions_in(blob(head, "mkdocs.yml")),
        LAZY: versions_in(blob(head, LAZY)),
    }

    problems = []
    for path in sorted(assets):
        name = pathlib.PurePosixPath(path).name
        owner = LAZY if name in LAZY_OWNED else "mkdocs.yml"

        # The lazy bundle is a relatively recent split. Before it existed, the
        # five calculator files were listed in mkdocs.yml like everything else,
        # and they'd still be listed there in a fork that hasn't split them out.
        # If the expected owner has no entry for this file, fall back to the
        # other one rather than reporting a missing entry that never existed.
        if owner == LAZY and name not in after[LAZY] and name in after["mkdocs.yml"]:
            owner = "mkdocs.yml"

        old = before[owner].get(name)
        new = after[owner].get(name)

        if new is None:
            problems.append(f"{path}: changed, but no ?v= entry found in {owner}")
        elif old is None:
            continue  # newly added file, or newly moved between owners
        elif old == new:
            problems.append(
                f"{path}: changed, but its ?v={new} in {owner} was not bumped "
                f"(bump it to {int(new) + 1})"
            )

    if problems:
        print(f"check_cachebust.py: {len(problems)} missed cache-bust(s):\n")
        for p in problems:
            print("  " + p)
        print("\nReturning visitors would keep serving a stale cached copy of the above.")
        return 1

    print(f"check_cachebust.py: all {len(assets)} changed asset(s) had their ?v= bumped.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
