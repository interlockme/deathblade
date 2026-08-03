# Deathblade Class Guide

MkDocs Material site, deploys to GitHub Pages on push to `main`. Just markdown + images, no real build step. Not real code, just what works for me and it prettier than google docs.

## Forking this for your own spin

Fork the repo, edit `docs/*.md` in a text editor (I use VS Code with MkDocs preview extension, but plain markdown preview or Obsidian work too). Push/save and the site rebuilds itself in a minute.

Only extra step: in your fork's Settings > Pages, set it to deploy from `gh-pages`. That branch doesn't exist till you push once.

If you're genuinely lost, upload the .zip of this entire project to claude on free plan and tell it to strip anything you don't need and to help fill it out with your own class info.

### Change this

- `mkdocs.yml` — `site_name`, `site_url` (→ `https://you.github.io/your-repo/`), and the `nav:` list
- `docs/stylesheets/extra.css` — bottom of the file excludes my repo from the external-link icon, swap or delete
- everything in `docs/` obviously, edit text to match your stuff and replace image assets with your own, maxroll builder and lost ark codex are useful sources

## Local preview

```
pip install "mkdocs-material[imaging]"
mkdocs serve
```
`localhost:8000`. Probably don't need this if you're already using the VS Code Mkdocs preview extension.