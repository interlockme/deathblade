# Regression snapshots

The verification playbook in `project-context.md`, as a script. It answers one question: did anything the calculator or the Bible importer shows or produces change, and if so, what exactly?

It is a local tool, not a CI gate: it needs Playwright and Chromium. The three `check_*.py` scripts in `scripts/` stay the CI gates.

## Setup

    pip install playwright
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
