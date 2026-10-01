# Deathblade Class Guide

MkDocs Material site, deploys to GitHub Pages on push to `main`. Just markdown + images, no separate application build system; GitHub Actions builds, checks and publishes it for you (see "What CI does on push" below). Not real code, just what works for me and it's prettier than google docs.

## Forking this for your own spin

Fork the repo, edit `docs/*.md` in a text editor (I use VS Code with MkDocs preview extension, but plain markdown preview or Obsidian work too). Push/save and the site rebuilds itself in a minute.

Only extra step: in your fork's Settings > Pages, set it to deploy from `gh-pages`. That branch doesn't exist till you push once.

If you're genuinely lost, upload the .zip of this entire project to claude on free plan and tell it to strip anything you don't need and to help fill it out with your own class info.

### If you're just swapping content (still Deathblade, your own numbers/wording)

Edit `docs/*.md` directly, that's it. Every build page and both essentials pages have little HTML comments above the skill codes, Ark Setup, Skill Setup, Gems, and Rotation blocks explaining what each one does. If you need the full details on any of them, the comment points you at the matching file in `docs/javascripts/`. You shouldn't need to actually open that folder though.

### If you're forking for a different class

This one's more work, since the class's skills, identity mechanic, and Ark Passive nodes aren't just in the markdown, they're baked into `docs/javascripts/` too. To make this less painful I went through and tagged every file there with what to do with it. Look for a `// FORK GUIDE:` comment at the top of each file:

- **DATA** files (`skill-names.js`, `skill-data.js`, `ap-node-names.js`, `build-data.js`) are just your class's info in a big object. Rewrite these with your own skills, nodes, and builds. `ap-node-names.js` has a note on which nodes are shared across all classes (keep those) vs Deathblade-only (swap those out).
- **ENGINE** files (most of the rest, like `rotation-line.js`, `skill-setup.js`, `gem-priority.js`, `pentagon-badge.js`, etc.) just render whatever's in the data files above. Leave these alone, nothing to change.
- **INFRA** files (`site-utils.js`, `bid-calculator.js`, `image-lightbox.js`, `extra.js`) are generic site stuff with nothing class-specific in them either, also fine to leave alone. `extra.js` has one small exception noted in its comment (a 333 Blitz easter egg you'll probably want to cut).
- **DEATHBLADE-SPECIFIC** files (`ark-passive-calculator.js`, `cpm-calculator.js`) are hardcoded to Deathblade's own numbers and mechanics. Don't try to just edit the data in these, either delete them or rewrite the math for your class.

If you end up adding/removing/reordering scripts, there's a comment above `extra_javascript` in `mkdocs.yml` explaining the load order (a few widgets need a data file or `site-utils.js` loaded before they run). Note that the five calculator files aren't listed there at all: they're only used by `resources.md`, so `lazy-calculators.js` pulls them in on demand instead of on every page. Their order lives in that file.

### Other stuff to change

- `mkdocs.yml` - `site_name`, `site_url` (→ `https://you.github.io/your-repo/`), and the `nav:` list
- `docs/stylesheets/extra.css` - there's a rule excluding links to `interlockme.github.io` (my domain) from the external-link icon, swap that or delete it
- if you keep and adapt `ark-passive-calculator.js` or `cpm-calculator.js`, they save data under storage keys with "deathblade" hardcoded in the name (like `ap-calc-deathblade-v1`), rename those so your fork isn't quietly saving under my class's name
- everything in `docs/` obviously, edit text to match your stuff and replace image assets with your own, maxroll builder and lost ark codex are useful sources

## Local preview

```
pip install mkdocs-material
mkdocs serve
```
`localhost:8000`. Probably don't need this if you're already using the VS Code Mkdocs preview extension.

Nothing in the GitHub Actions deploy has to be installed locally. There are **no
extra mkdocs plugins** (`plugins:` is still just `search` and `privacy`), so
`mkdocs serve` needs exactly what it always needed. The deploy's extra steps are
plain standard-library Python scripts that run in CI against the *built* output,
never against `docs/`.

## What CI does on push

`.github/workflows/deploy.yml` runs, in order:

1. `scripts/check_ids.py` - every id referenced in markdown resolves against the DATA files.
2. `scripts/check_content.py` - dates aren't in the future, `id`/`class` still match on calculator fields, display text hasn't drifted from the DATA files, every JSON block has the shape its widget reads, no tab group has more than 8 tabs.
3. `mkdocs build`
4. `scripts/minify_assets.py site --verify` - strips comments from the built css/js. `docs/` keeps every comment; only what ships gets stripped. Takes a guide page from ~237 KB to ~57 KB gzipped.
5. `scripts/hash_assets.py site` - adds a content hash to every own css/js URL (`?v=<hash>`), including the lazy calculator files. Nothing to bump by hand; it runs after minifying so the hash is of the bytes that ship.
6. `ghp-import` to `gh-pages` (identical to what `mkdocs gh-deploy --force --no-history` does internally).

Both checks can be run locally too, they need nothing installed:

```
python3 scripts/check_ids.py
python3 scripts/check_content.py
```

If a check fails the deploy stops before publishing, so a broken id or a block in an old JSON shape can't reach the live site.