# Docs → HTML generator

Converts every `docs/markdown/**/*.md` file into a browsable static HTML site
under **`docs/html/`** for easy preview.

Features:
- GitHub-style rendering (tables, code, blockquotes, anchored headings)
- ` ```mermaid ` fenced blocks render as live diagrams (fishbone, ER, use-case…)
- Server-side syntax highlighting (highlight.js)
- `[[wikilinks]]` resolved to sibling pages when a matching `.md` exists
  (unresolved ones — Obsidian vault notes — render as dashed grey text)
- Relative `.md` links rewritten to `.html`
- Left sidebar nav grouped by folder (a drawer below 1024px), an "ในหน้านี้"
  outline with scroll-spy, and an `index.html` landing page
- Styled in Nocturnal Atelier — the same tokens as `docs/pages/index-q.html`,
  kept in sync by `python scripts/check-design-tokens.py`. Light only, like the
  prototype; syntax and mermaid colours use the system palette

## Build

```bash
cd docs/_generator
npm install      # first time only
npm run build
```

Output lands in `docs/html/`. All assets (mermaid, CSS, highlight themes) are
copied into `docs/html/assets/` so the site is fully self-contained.

## Preview

Open `docs/html/index.html`. Mermaid needs to run from a web server (not the
`file://` protocol), so serve the folder:

```bash
# from repo root
python -m http.server 8899 --directory docs/html
# then open http://localhost:8899/
```

Re-run `npm run build` whenever the markdown changes. `docs/html/` is generated
output and is gitignored — **except** hand-made pages with no `.md` source
(`cmas-er-diagram.html`). The build keeps everything listed in `KEEP` in
`build.mjs`; add a file there before dropping another hand-made page into
`docs/html/`, or the next build deletes it with no git copy to recover from.
