# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Amelda is a self-contained, offline-first, client-side notetaking/journaling PWA. Everything —
data storage, rendering, note graph logic — runs in the browser. There is no backend database and
no server-side application logic; user data never leaves the device unless the user explicitly
exports it. Public site: https://www.amelda.net/

## Running it locally

There's no build step and no dependency manifest (no `requirements.txt`/`package.json`) — this is
intentionally a zero-toolchain project. Two ways to run it:

- **Static file serving** (matches production/GitHub Pages): serve `src/static/` with any static
  file server and open `index.html`.
- **Via the FastAPI dev server** ([src/main.py](src/main.py)): requires `fastapi` and an ASGI
  server (e.g. `uvicorn`) installed manually, then run from `src/`:
  ```
  uvicorn main:app --reload
  ```
  `main.py` only mounts static file routes (`/`, `/static`, `/js`, `/css`, plus a few named files
  like `sw.js`, `manifest.json`, `amelda-default.json`, `menu.png`) — it has no API endpoints or
  database logic. Treat it as a thin static-file host, not an application server.

There is no test suite, linter, or CI check beyond the deploy workflow — verify changes by loading
the app in a browser.

## Deployment

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) deploys `src/static/` directly to
GitHub Pages on every push to the `ipad-pwa` branch. Anything outside `src/static/` (including
`main.py`) is not part of the deployed site.

## Architecture

All application logic lives in three files under `src/static/`:

- **[index.html](src/static/index.html)** — static shell defining the fixed panel layout (a 3×3
  grid: top/middle/bottom rows, each with left/center/right regions) plus the hamburger menu.
- **[js/app.js](src/static/js/app.js)** — the entire application: persistence, state, rendering,
  and note-graph logic. No framework, no imports/modules, no build step — one script, loaded
  directly.
- **[css/style.css](src/static/css/style.css)** — theming (dark/light via `.light-theme` on
  `<body>`) and the responsive/mobile layout (panels become slide-in overlays below a breakpoint;
  see the "Mobile layout" section at the bottom of the file).

### Data model: a note graph

Notes are **nodes** (`{id, text_content, node_type, creator, created_at, updated_at, is_deleted}`)
connected by **edges** (`{id, from_id, to_id, relationship_type, weight, ...}`). Deletes are
soft (`is_deleted` flag), never physical removal. Three `relationship_type`s drive three
different UI behaviors:

- `sequence` — directed, temporal/linear chain (think: "next note in this train of thought").
  Rendered top/bottom of the focused note. A node can only have one *effective* outgoing/incoming
  sequence edge at a time — `mostRecent()` in app.js picks a winner when branching exists (most
  recently created edge wins). `buildChain()` walks a node's full sequence chain in both
  directions to compute position (`"3/7"` labels) and chain endpoints for the `«`/`»` jump glyphs.
- `auto` — weighted, computed connections (weight = `log(sharedWordCount + 1)`; see
  `extractWords`/`STOP_WORDS` for the naive keyword-overlap scoring). Shown as "Suggested
  Connections" in the left panel; the user can promote one to a `user` edge with the `+` button.
- `user` — explicit, user-created connections (weight fixed at `1.0`). Shown in the right panel
  ("Connections"), with search-to-connect and note creation inline.

### Two persistence backends behind one `api` object

`app.js` defines a single `api` object (getNodes/getEdges/createNode/updateNode/createEdge/
deleteEdge/deleteNode/getNode/getState/setState) that every UI function calls through. Internally
it branches on a module-level `fileGraph` variable:

- `fileGraph === null` → **IndexedDB mode** (default). Data persists in the browser's IndexedDB
  (`amelda` DB, `nodes`/`edges` object stores; see `openIDB`/`idbGet*`/`idbPut`). Current
  focus/mode state persists to `localStorage` (`amelda_state`) so a refresh restores the same view.
- `fileGraph !== null` → **external file mode**. Triggered by "Open Graph…", which loads a
  user-picked `.json` file (`{nodes: [], edges: []}`) entirely into memory — IndexedDB is never
  touched while a file is open. "Save Graph" downloads the in-memory graph back out; "Close Graph"
  discards it (with a confirm if dirty) and restores whatever was focused before the file was
  opened (`_preFileState`). This mode exists so users can carry a graph on a USB stick / share a
  subset of notes without exposing their whole local IndexedDB store.

When adding a new mutation to the graph, add it to `api` and implement both branches — UI code
must never touch IndexedDB or `fileGraph` directly.

### Rendering model

`render()` = `renderFocusedPanel()` + `renderGraphPanels()`, called after every state change via
`setAppState()` (the single point of mutation for `currentNote`/`mode` — always go through it
rather than assigning those globals directly, since it also persists state and re-renders).

- `renderFocusedPanel()` builds the center panel's editor/viewer based on `mode` (`"new"` |
  `"view"` | `"edit"`).
- `renderGraphPanels()` is `async` and re-fetches nodes/edges from `api` on every call; it uses a
  version counter (`_graphPanelVersion`) to discard stale results if a newer render started before
  a slower one resolved (race-guard against out-of-order async fetches).
- Left/right side panels are recomputed from graph edges every render — there is no separate
  "history" of what was previously shown; older/newer and related notes are always derived live
  from the current sequence/auto/user edges.

### PWA/offline behavior

[sw.js](src/static/sw.js) is a cache-first service worker with a small static `PRECACHE` list
(index, css, app.js, manifest, default seed graph, menu icon). **Bump `CACHE_NAME`
(currently `"amelda-v12"`) whenever any precached file changes**, or returning visitors will keep
serving stale assets — the activate handler only deletes caches whose name differs from the
current `CACHE_NAME`.

[static/amelda-default.json](src/static/amelda-default.json) is the seed graph shown to
first-time users (a short in-app tutorial written as a connected note chain). It's loaded once, on
first launch when IndexedDB is empty (`seedDatabase()` in `init()`).

### Relationship to the `main` branch

`main` is the original implementation this project started as: a FastAPI + SQLite backend
(`db.py`, `models.py`, `word_match.py`, `api/{nodes,edges,export,state}.py`, `amelda.db`) with
`requirements.txt` = `fastapi` + `uvicorn[standard]`. `ipad-pwa` branched off `main` at commit
`fca1953` ("binary changes") and, in `4b4eb12` ("Removed python files not necessary in this
branch"), ripped out the server-side code entirely in favor of the current pure-client-side
IndexedDB rewrite — `app.js`'s `extractWords`/`STOP_WORDS` and `exportConnected` are explicit
ports of `main`'s `word_match.py` and `api/export.py` logic into JS. `src/__pycache__/*.pyc` in
this working tree is leftover bytecode from a past run on `main`; harmless, safe to ignore or
delete.

`main` has not been touched since `e689791` (a README update) while `ipad-pwa` has had continuous
active development since — treat `ipad-pwa` as the actively maintained line and `main` as
effectively superseded/frozen, not a parallel implementation to keep in sync with.
