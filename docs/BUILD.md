# DaftVino profile README — build & deploy

The `README.md` at the repo root is **generated**. Don't hand-edit it — edit the
sources below and rebuild.

## What this is

A custom GitHub **profile README** (lives in the special `DaftVino/DaftVino`
repo). Design direction: DaftForge's own system (`DESIGN.md` in the website
repo) — "serious tools, dry wit," Forge Red `#C52F3F` + Anvil Ink `#363650`,
mono `// NN ·` kickers, hard 4px geometry, dark stats band.

GitHub strips all CSS from READMEs, so the layout can't be live HTML. Instead
each section is rendered from an HTML/CSS template to a crisp 2× image
(light + dark), and `README.md` assembles those with `<picture>` (theme-aware)
plus real markdown links for the clickable parts.

**Table-free on purpose.** GitHub applies its own stylesheet to HTML `<table>`s
(cell borders + zebra striping), which boxes up a layout. So the README uses **no
layout tables** — sections are images, tiles are inline linked images, and
clickable actions are inline links. The hero (wordmark + divider + name/pitch +
CTA) is a single image so the divider sits left of everything; the CTA is also
reachable via the clickable nav row beneath it.

**Verify like GitHub, not a plain browser.** `scripts/preview.mjs` renders in a
bare browser and will NOT show GitHub's table/link styling. Use
`scripts/gh-preview.mjs` — it sends the README through GitHub's Markdown API and
applies `github-markdown-css`, so `.gh-light.png` / `.gh-dark.png` match what
GitHub actually shows.

## Sources (edit these)

| File | What it controls |
|---|---|
| `data/profile.json` | All copy + links: pitch, capabilities, project cards, badges, in-the-forge, support. |
| `src/template.mjs` | Layout + styling (the design system). Panel IDs captured by the renderer. |
| `scripts/gen-heatmap.mjs` | The "forge heat" contribution heatmap SVG. |
| `assets/brand/` | Logo variants (stacked light/dark, banner white). |

## Generated (don't edit)

- `README.md`
- `assets/panels/*.png` — rendered section images (light + `-dark`)
- `data/stats.json`, `data/calendar.json` — fetched GitHub data

## Rebuild locally

```bash
npm install
# Windows: point Puppeteer at installed Chrome (skips the Chromium download)
#   PowerShell:  $env:PUPPETEER_EXECUTABLE_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
GITHUB_TOKEN=$(gh auth token) npm run build   # fetch stats + render panels + assemble README
GITHUB_TOKEN=$(gh auth token) node scripts/gh-preview.mjs   # accurate GitHub render -> .gh-light.png / .gh-dark.png
```

- `npm run fetch` — refresh `data/stats.json` + `data/calendar.json` only.
- `npm run render` — render panels + assemble `README.md` from existing data.

## Automated refresh

`.github/workflows/refresh.yml` runs daily (and on source changes): fetches
stats, re-renders the data-driven panels (metrics, language bar, forge-heat
heatmap), assembles `README.md`, and commits if anything changed.

**For accurate numbers including private-repo contributions**, add a repo secret
`STATS_TOKEN` = a personal access token with `read:user` (classic) or the
equivalent fine-grained read scope. Without it, the workflow falls back to the
default `GITHUB_TOKEN` and counts reflect **public activity only**.

## Deploy (first time)

1. Create a public repo named exactly **`DaftVino`** under the `DaftVino`
   account (GitHub shows a "special repository" hint — that's the profile
   README repo).
2. Push this project's contents to its `main` branch.
3. Add the `STATS_TOKEN` secret (see above) for private-inclusive stats.
4. The profile at `github.com/DaftVino` now shows the README; GitHub's native
   contribution graph still appears below it.

## Notes / honest-data rules

- CI badges (`ci passing`) are shown only for repos that actually have CI
  (`daftplate`, `daft-gemini-playbook`, `sheetforge`). Keep it that way.
- No star badges (stars are 0) and no fabricated install counts — GreasyFork is
  shown as a "live" link, not a number.
- Language split is byte-weighted across **public** repos, like GitHub.
