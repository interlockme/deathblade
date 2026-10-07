# Regression snapshots

The verification playbook in `project-context.md`, as a script. It answers one question: did anything the calculator or the Bible importer shows or produces change, and if so, what exactly?

It needs Playwright and Chromium, so it is not part of the deploy path: the `check_*.py` scripts in `scripts/` are the fast gates in `deploy.yml`. The slow browser checks run in their own workflow, `.github/workflows/verify.yml`, on every push to `main` (and pull request) that touches the site or the tooling, and on demand from the Actions tab (Run workflow, with an optional `--fast` box). It runs `regress.py`, `smoke.py` and `sweep_mobile.py`, fails on any difference, and uploads `regress-diff.txt` plus the candidate new baseline (`regress-out/`) as an artifact. If every diff line is intended, copy those files over `baselines/` and commit them with the code change.

## Setup

    pip install -r requirements-verify.txt
    playwright install chromium

Node is needed for the importer half.

## Everyday use

    mkdocs build -d site_out
    python3 scripts/regression/regress.py check --site site_out

`check` exits 0 and prints `IDENTICAL to baseline`, or exits 1 and prints one line per difference:

    [calculator.json.gz] 3 difference(s)
      probes / select#ap-adrenaline:0 =3 Nodes / r / ap-summary-base-critrate:0: "77.38%" -> "77.41%"

Every line must be either something you meant or a bug. When all of them are explained, accept the new behaviour:

    python3 scripts/regression/regress.py baseline --site site_out

and commit the changed files in `baselines/` together with the code change, so the diff of the baseline files is the reviewable record of what the change did.

The serve step is built in: the script serves the site directory on a free localhost port itself, so there is no detached server to start.

## What is covered

Calculator (`baselines/calculator.json.gz`):

- Full dumps of every input, select, checkbox and readout at defaults, after changing all numbers, after setting all selects to their last option, after toggling all checkboxes, after reload, after Reset, after Import of an earlier Export, through presets 2/3/1/2, and after Reset again. Then Support on with hand-set inputs (`SUPPORT_ON_INPUTS` in `regress.py`), with its own reload and Export/Import round trip. Support is on at defaults, but the checkbox pass turns it off for the states after it, so this state is what pins the support math through those paths.
- One probe per control (change only that control, from clean defaults, store only what moved). This is what lets a diff name the control responsible.
- Header/dock chips and the dock trigger.
- `checks`: fields that did not survive reload, fields that did not survive Export, Reset, Import (expected to be non-empty: the id-less Setup A/B, Bracelet A/B and Ability Stone sandbox fields; what matters is that the list does not change), the Export document minus its timestamp, and any JavaScript errors.
- Every Bible import fixture pushed through the real `#bible-import=` fragment path into the calculator.

Importer (`baselines/importer.json`):

- The real `buildPayload` from `docs/javascripts/bible-import.js` run against each fixture in `fixtures/`, with the payload, warnings, Chaos grade decode debug, and a `structured` section read straight from the page's hydration data (core ids and points, gem values, stone nodes, accessory roll lines, icon-gradient grades). The importer does not use `structured`; it exists so importer changes can be checked against the page's own data.
- Run just this half, quickly and without a browser: `node scripts/regression/import_snapshot.mjs`.

Id-less fields are keyed `tag.classes:ordinal` (position among fields with the same signature), so adding or removing an id-less field shifts the ordinals after it and shows up as a diff. That is intended.

## Adding an importer fixture

Save a Bible character page and turn it into a fixture:

    python3 scripts/regression/make_fixture.py some-name "path/to/Saved Page.html"

Save it right: open the character URL directly in a fresh tab (or hard-reload) and let it finish, then Save As. Do not arrive by searching from another Bible page. Bible is a client-side app; after in-site navigation the text on screen is the new character but the embedded hydration data is still the previous one. `make_fixture.py` refuses a page whose hydration is identical to an existing fixture's.

Useful fixtures to add: a character with a Relic Chaos Sun or Moon core, one with no `most_recent_raid` loadout, a non-Deathblade, a support class, and one with a bracelet using two rerollable lines.

`no-raid-loadout` is derived, not a real page: `make_fixture.py --derive-no-raid no-raid-loadout ancient-sun-relic-moon-star` copies a fixture and relabels its most_recent_raid loadout. It pins the importer's fallback path (icon-color grades, the no-snapshot warning). Replace it with a real page if one turns up.

Name the fixture for what it exercises (`relic-chaos-star`, `no-raid-loadout`), not for the character. `make_fixture.py` anonymizes the page before writing it: the character, guild and stronghold names are replaced with placeholders everywhere they occur (text, URLs, hydration data), and the script refuses to write a fixture that still contains one. Look at the `anonymized:` line it prints, since guild and stronghold names are matched as whole words and a very common word could over-match.

Then run `baseline` and commit `fixtures/` and `baselines/`.

## When the snapshot itself changes

If a change to the calculator's markup makes the harness miss or misread controls (a renamed wrapper class, controls moved outside `.ap-calc`), everything will show as a diff. Fix `PAGE_JS` at the top of `regress.py`, rerun `baseline` on the OLD code first, then `check` on the new code.

## Layout sweep (phone widths)

The baselines record values and text, not layout, so a CSS change can break a phone layout without `check` noticing. For that:

    python3 scripts/regression/sweep_mobile.py --site site_out
    python3 scripts/regression/sweep_mobile.py --site site_out --widths 320,390 --verbose

It opens /resources/ in touch emulation at 320 to 1400px, opens every `<details>` in the calculator, and fails (exit 1) if the page scrolls sideways, an element spills outside the viewport with no scroll container, or an overflow-hidden element is holding content wider than itself (columns cut off with no way to reach them). Small text (under 16px, which makes iOS Safari zoom on focus) and small tap targets are counted as warnings and listed with `--verbose`. Takes about a minute. Use `--page` / `--root` for another widget, and the `ALLOW` list at the top of the script for clipping you have decided is fine.

For the CPM and Bid calculators pass `--root .cpm-calc` or `--root .bid-calc` with `--builds default` (the build switch is Ark-specific).

## calc_probe.py: CPM and Bid calculators

Neither smoke.py nor regress.py drives these two widgets, and the regress dump only reads `.ap-calc`. `calc_probe.py` drives every input, chip, the copy button, the recent-input chips and the rate converter, and records each output text:

    python3 scripts/regression/calc_probe.py --site site_out --check scripts/regression/baselines/calc_probe.json

It prints `IDENTICAL to baseline` or the differing paths (exit 1). It reads only the classes the two scripts query, so a pure restyle that keeps them must not change it. When an output is meant to change, name every difference, then rewrite the baseline with `--out scripts/regression/baselines/calc_probe.json`.

## smoke.py: everything that is not the calculator

`regress.py` pins the calculator and the importer. `smoke.py` drives the sitewide behaviour they cannot see: tabs, `<details>`, permalinks and jump links, tooltips (hover, click, keyboard, phone taps), Ark Cores, the lightbox, practice mode, and instant navigation between pages.

    mkdocs build -d site_out
    python3 scripts/regression/smoke.py --site site_out --workers 4

Prints `OK` or one `FAIL` line per problem and exits 1. `--pages /surge/111-classic/` limits it to chosen pages, `--verbose` adds notes. It serves the site under the production path and rewrites `sitemap.xml` to the local origin, because Material only does instant navigation for links listed in the sitemap.
