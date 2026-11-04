# LUNA — start here in Visual Studio Code

This folder contains the latest Moon/Mars game, an automatic development build,
a working localhost data/save backend, NASA update tools and optional Supabase
publishing configuration. Version: **1.2.3-local**, with a full-window opening, draggable launch/boarding views,
coherent launch lighting and a corrected coastline.

## First run

1. Install Node.js 22 or newer. Node.js 24 LTS is a suitable choice.
2. Extract the ZIP. Open the inner **LUNA** folder in VS Code; it contains
   `package.json`. You can also open `LUNA.code-workspace`.
3. Open **Terminal → New Terminal** and run:

```sh
npm ci
npm run dev
```

4. Open **http://localhost:3000** to play.
5. Open **http://localhost:3000/workspace** to inspect local data and save backups.

Keep the terminal running. Save a source edit and the client rebuilds; after a
successful build, the browser reloads. Stop the server with **Ctrl+C**. A reload
restarts the opening/flight session; outpost checkpoint saves remain available.

For a quick run of the supplied prepared game, `npm start` works without installing
dependencies. It includes the local backend but does not watch code edits.

If PowerShell blocks `npm.ps1`, use `npm.cmd ci` and `npm.cmd run dev`, or select
Command Prompt as the VS Code terminal profile. No execution-policy change is needed.

## Where to edit

The established game source lives directly in `dist/`. The name is retained to
avoid moving and breaking the existing multi-file project.

| Location | Edit here for |
| --- | --- |
| `dist/app.js` | Screens, controls, interactions and application flow |
| `dist/styles.css`, `dist/index.html` | Visual layout and styling |
| `dist/models.js`, `dist/render-3d.js` | 3D models, cameras and surface rendering |
| `dist/flight-renderer.js`, `dist/landing-scene.js` | Departure, boarding, cockpit and landing scenes |
| `dist/reference-landscape.js`, `dist/reference-geometry.js` | Moon/Mars authored relief |
| `dist/lunar-surface.js`, `dist/surface-materials.js` | Lunar dust, rocks, tread impressions and material shaders |
| `dist/expedition.js`, `dist/data/scenarios.json` | Outpost missions and teaching rules |
| `dist/data/*.json` | Terrain, astronomy, catalogue and mission inputs |
| `backend/` | Local API, validation, persistence and Supabase setup |
| `tools/` | Development server, build, data acquisition and updates |

`dist/game.js` and `dist/luna-playable.html` are generated files. Make changes in
source files and rebuild them. Backend or tool edits require a server restart.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build, serve and reload the client while editing |
| `npm start` | Run the prepared game and localhost backend |
| `npm test` | Run game and backend tests |
| `npm run check` | Check JavaScript syntax |
| `npm run build` | Generate the client bundle and standalone offline game |
| `npm run data:register` | Validate and publish local data changes |
| `npm run data:check` | Check NASA source release headers; Python required |
| `npm run data:watch` | Repeat source checks while the terminal stays open |
| `npm run data:refresh` | Download supported inputs into a staging pack, then validate |
| `npm run cloud:publish` | Publish prepared assets to your configured Supabase project |

After `npm ci`, press **F5** and select **LUNA: develop and open browser** to run
through VS Code's debugger. The supplied tasks also appear in **Terminal → Run Task**.

## Local saves and configuration

The server creates `backend/data/` on first run. Preserve it when updating the
project. It contains disk backups of settings and checkpoints, immutable data
objects and pack manifests. The local backend supports one local profile; browser
storage remains the offline fallback.

Cloud credentials are optional. Copy `.env.example` to `.env` only when changing
ports, Python settings, NASA scheduling or configuring Supabase. The included SQL
and publisher prepare the cloud data store; cloud login/progress sync remains a
separate integration. Read `backend/README.md` for the exact setup and boundaries.

## Keep your local code updated

Work in this same folder and use `npm run dev` while editing. The server uses the
local files you save; downloading another ZIP does not automatically merge it
with your edits. Use Git commits for source history if desired. `.gitignore`
excludes dependencies, credentials and local save files.

Before replacing the folder with a future version, stop the server and preserve
`backend/data/` and your own `.env`. After a source update, run `npm ci`, the checks
and `npm run dev` again. Open `README.md` for the game controls and
`DATA-INTEGRATION.md` for scientific data formats.
