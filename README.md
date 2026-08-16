# Deathblade Class Guide

MkDocs Material site, deploys to GitHub Pages on push to `main`. Just markdown + images, no real build step. Not real code, just what works for me and it's prettier than google docs.

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

If you end up adding/removing/reordering scripts, there's a comment above `extra_javascript` in `mkdocs.yml` explaining the load order (a few widgets need a data file or `site-utils.js` loaded before they run).

### Other stuff to change

- `mkdocs.yml` — `site_name`, `site_url` (→ `https://you.github.io/your-repo/`), and the `nav:` list
- `docs/stylesheets/extra.css` — there's a rule excluding links to `interlockme.github.io` (my domain) from the external-link icon, swap that or delete it
- if you keep and adapt `ark-passive-calculator.js` or `cpm-calculator.js`, they save data under storage keys with "deathblade" hardcoded in the name (like `ap-calc-deathblade-v1`), rename those so your fork isn't quietly saving under my class's name
- everything in `docs/` obviously, edit text to match your stuff and replace image assets with your own, maxroll builder and lost ark codex are useful sources

## Local preview

```
pip install mkdocs-material
mkdocs serve
```
`localhost:8000`. Probably don't need this if you're already using the VS Code Mkdocs preview extension.