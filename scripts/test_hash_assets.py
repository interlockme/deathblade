#!/usr/bin/env python3
"""
test_hash_assets.py - self-test for hash_assets.py. Builds tiny fake sites in a temp dir; needs no
mkdocs, no browser, no installs.

    python3 scripts/test_hash_assets.py

Covers the property the whole script exists for: a change to a lazy file must change the URL of
the loader on every page (the cascade that used to be a manual two-place bump).
"""
import pathlib
import re
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import hash_assets  # noqa: E402

LOADER = 'var LAZY_BUNDLE = [\n  "calc.js?v=9",\n  "import.js",\n];\n'
PAGE = (
    '<link href="../stylesheets/extra.css?v=100" rel="stylesheet">'
    '<script src="../assets/javascripts/bundle.abc123.min.js"></script>'
    '<script src="../javascripts/site.js"></script>'
    '<script src="../javascripts/lazy-calculators.js?v=23"></script>'
)


def make(root, calc="calc v1", site="site v1", css="a{}", page=PAGE):
    root = pathlib.Path(root)
    (root / "javascripts").mkdir(parents=True)
    (root / "stylesheets").mkdir()
    (root / "assets" / "javascripts").mkdir(parents=True)
    (root / "javascripts" / "lazy-calculators.js").write_text(LOADER)
    (root / "javascripts" / "calc.js").write_text(calc)
    (root / "javascripts" / "import.js").write_text("import")
    (root / "javascripts" / "site.js").write_text(site)
    (root / "stylesheets" / "extra.css").write_text(css)
    (root / "assets" / "javascripts" / "bundle.abc123.min.js").write_text("material")
    (root / "index.html").write_text(page)
    return root


def snapshot(root):
    root = pathlib.Path(root)
    html = (root / "index.html").read_text()
    loader = (root / "javascripts" / "lazy-calculators.js").read_text()
    return {
        "html": html,
        "loader": loader,
        "loader_url": re.search(r"lazy-calculators\.js\?v=(\w+)", html).group(1),
        "site_url": re.search(r"site\.js\?v=(\w+)", html).group(1),
        "css_url": re.search(r"extra\.css\?v=(\w+)", html).group(1),
        "calc_url": re.search(r'"calc\.js\?v=(\w+)"', loader).group(1),
    }


def run(**kw):
    with tempfile.TemporaryDirectory() as d:
        root = make(pathlib.Path(d) / "s", **kw)
        code = hash_assets.process(str(root))
        return code, (snapshot(root) if code == 0 else None)


FAILS = []


def check(cond, label):
    print(("ok    " if cond else "FAIL  ") + label)
    if not cond:
        FAILS.append(label)


def main():
    code, a = run()
    check(code == 0, "runs clean on a normal site")
    check(a["site_url"] != "100" and not a["site_url"].isdigit(), "no-version reference gets a hash")
    check(a["css_url"] != "100", "stale numeric ?v= is replaced, not kept")
    check("?v=23" not in a["html"] and "?v=?v" not in a["html"], "no stale or doubled ?v=")
    check("bundle.abc123.min.js?v" not in a["html"], "Material's own assets/ bundle is left alone")
    check(re.search(r'"import\.js\?v=\w+"', a["loader"]) is not None, "LAZY_BUNDLE entry without ?v= gets one")
    check(a["calc_url"] != "9", "LAZY_BUNDLE entry with a stale ?v= is replaced")

    _, b = run()
    check(a == b, "same input gives identical output (deterministic)")

    _, c = run(site="site v2")
    check(c["site_url"] != a["site_url"], "editing a file changes that file's URL")
    check(c["css_url"] == a["css_url"] and c["calc_url"] == a["calc_url"], "other files keep their URL")
    check(c["loader_url"] == a["loader_url"], "an unrelated edit leaves the loader URL alone")

    _, d = run(calc="calc v2")
    check(d["calc_url"] != a["calc_url"], "editing a lazy file changes its LAZY_BUNDLE hash")
    check(d["loader_url"] != a["loader_url"],
          "CASCADE: editing a lazy file changes the loader's URL in every page")

    _, e = run(css="a{color:red}")
    check(e["css_url"] != a["css_url"], "editing the stylesheet changes its URL")

    code, _ = run(page=PAGE + '<script src="../javascripts/missing.js"></script>')
    check(code == 1, "a reference to a file that is not in the build fails")

    with tempfile.TemporaryDirectory() as dd:
        root = make(pathlib.Path(dd) / "s")
        (root / "javascripts" / "lazy-calculators.js").write_text(LOADER.replace('"import.js"', '"gone.js"'))
        before = (root / "index.html").read_text()
        code = hash_assets.process(str(root))
        check(code == 1, "LAZY_BUNDLE naming a missing file fails")
        check((root / "index.html").read_text() == before, "a failed run writes nothing")

    print()
    if FAILS:
        print(f"{len(FAILS)} FAIL")
        return 1
    print("all hash_assets tests pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
