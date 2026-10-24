# EU4FLO Web — EU4 Fortress Layout Optimizer in the browser

A browser port of [EU4FLO](https://github.com/Krollbotid/EU4FLO). It runs entirely on the
visitor's computer: they pick their own game or mod folder, the page reads the files locally,
renders the map, and solves the fort layout with an exact MILP solver (HiGHS compiled to
WebAssembly). Nothing is uploaded, so there is no server, no database, and no game assets
in the repository — just static files.

## What's in the folder

| File | Purpose |
|---|---|
| `index.html` | The whole app: UI, Clausewitz/CSV/BMP parsers, adjacency builder, renderer, optimizer model |
| `solver-worker.js` | Runs the solver in a background thread so the page stays responsive |
| `highs.js`, `highs.wasm` | HiGHS solver (WebAssembly build from highs-js) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Feature parity with the desktop app

- Map modes: Political, Provinces, Area, Region, Superregion, Forts, Defense, Optimization
- Zoom (wheel / pinch), pan (drag), click a province for its info panel, neighbour list
- Fort editing (kept in the browser; **Download forts.txt** to save it to your map folder)
- Province tree with search
- Export adjacency (same text format), Save map / Save view as PNG
- Optimization with coverage selectors, required / preferred / exceptional forts, groups,
  NoAdjacent / Homebrew / AnyAdjacent modes, "Show on map" previews, save/load config
  (same JSON format as the desktop app — old configs load directly)
- English and Russian UI

## New: your country, savegames, and zones of control

- **Political map at game start.** When the game or mod folder is loaded, the default map
  shows every country's provinces in its own colour, read from `history/provinces`
  (`owner = TAG`) and `common/country_tags` + `common/countries` (`color = { r g b }`).
- **Load a savegame (.eu4)** on the Country tab. The page reads the owner and the fort
  buildings (`fort_15th` … `fort_18th`, and any mod building whose name starts with `fort`)
  of every province, plus each country's map colour, and selects the country you are playing.
  Plain and compressed saves work; Ironman (binary) saves don't — convert them to text first
  (for example with pdx.tools). Everything is read in your browser.
- **My country.** Pick a tag to make its provinces your territory. The Forts map mode then
  shows your territory, your forts (green), other countries' forts (grey) and each fort's
  zone of control (the fort province and its neighbours, hatched).
- **Click tools** in the top bar:
  - *Inspect* — click a province for its details (default).
  - *Mark territory* — click to add or remove a province; drag to paint several.
  - *Mark forts* — click to add or remove a fort; its zone of control appears immediately.
- **Into the optimizer:** *Cover my territory* sets the coverage to `territory, mine`
  (a new selector), *Keep my forts* puts your existing forts into the required list.
- Territory and fort edits are remembered in your browser.

## Terrain priority

Under *Terrain and salt → What counts most*:

- *Balanced* — weighted score (attacker penalty × weight A + local defensiveness % × weight B).
- *Attacker penalty first* — the attacker penalty decides; local defensiveness only breaks ties.
- *Local defensiveness first* — local defensiveness (terrain + salt) decides; attacker penalty only breaks ties.

Terrain that gives both (mountains: −2 and +25%) stays on top in every mode. The number of
forts always stays at the minimum; terrain only chooses between equally small layouts.

## New: terrain and salt

Forts are stronger in defensible provinces, so the optimizer can take that into account:

- **Attacker penalty** (`defence` in `map/terrain.txt`) and **local defensiveness**
  (`local_defensiveness` in `map/terrain.txt`) are read from the game or mod's own files,
  so mods like Anbennar use their own values. A province's terrain comes from the
  `terrain_override` lists in terrain.txt; provinces not listed there are estimated from
  the most common terrain in `terrain.bmp` (the info panel says which).
- **Salt** (+10% local defensiveness) is read from `history/provinces/*.txt`
  (`trade_goods = salt`, start-date value). If `common/tradegoods` is loaded, its
  `local_defensiveness` values are used, so any other defensive trade good a mod adds is
  picked up too.
- **Defense score** = attacker penalty × weight A + local defensiveness % × weight B
  (defaults 10 and 1: mountain 45, hills/highlands 20, salt +10). Both weights are editable.
- **How it's used:** the solver first finds the minimum number of forts (exactly as
  before), then, among all layouts with that same number of forts and the same number of
  preferred forts, picks the one with the highest total defense score. Set
  *Ignore terrain* to get the original behaviour.
- New **Defense** map mode shades provinces by score; the province panel and the results
  table show terrain, salt and score.

To get salt, load the game or mod folder (the one containing `map/` and `history/`),
or load `map/` first and then use **Add history/ folder**.

Same model as the desktop version: minimize forts (×1000) minus preferred forts, every
covered province must have a fort in it or next to it, plus the adjacency/group rules.
Desktop used Google OR-Tools CP-SAT; the web version uses HiGHS. Both are exact; on very
large coverage sets either may stop at the time limit (the time limit is adjustable here).

## Host it for free on GitHub Pages (≈5 minutes)

1. Create a GitHub account if you don't have one, then a **new public repository**,
   e.g. `eu4flo-web`.
2. Upload every file from this folder (including `.nojekyll`) to the repository root —
   on the repo page: **Add file → Upload files**, drag them in, **Commit**.
3. Go to **Settings → Pages**. Under *Build and deployment* choose
   **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/eu4flo-web/`.
   Share that link — anyone can use it.

Any push to `main` redeploys automatically.

### Other free static hosts that work the same way

- **Cloudflare Pages** — connect the repo or drag-and-drop the folder; unlimited bandwidth on the free plan.
- **Netlify** — drag the folder onto app.netlify.com/drop.
- **Vercel** — import the GitHub repo, no build settings needed.

All of them just serve the files; there is nothing to configure.

## Run it locally

The solver runs in a Web Worker, which browsers block for pages opened as `file://`.
Serve the folder instead:

```
cd eu4flo-web
python -m http.server 8000
```

then open http://localhost:8000.

## Browser notes

- Folder picking works in Chrome, Edge, Firefox and Safari on desktop. Chrome/Edge show an
  "Upload files to this site?" prompt — it only grants the page read access; nothing is sent anywhere.
- The vanilla EU4 map is 5632 × 2048 pixels; loading takes a few seconds and ~200 MB of memory.
  Phones can view a loaded map but usually can't pick a folder.

## Licenses

MIT (see `LICENSE`, original work by Krollbotid) — see `THIRD_PARTY_NOTICES.md` for HiGHS.
EU4 content belongs to Paradox Interactive and is never bundled.
