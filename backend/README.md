# LUNA local backend and optional Supabase publishing

## What works immediately

`npm start` runs the prepared game and its local Node.js API on the same port.
`npm run dev` adds automatic client rebuilds and browser reloads. Neither command
requires Python, Docker, a database installation, a NASA key, or a cloud account.

The local backend uses atomic JSON files, **not PostgreSQL**. It is a development
backend for one local profile. It saves the game's settings, Moon/Mars checkpoints
and training records under `backend/data/`. The browser keeps localStorage as an
offline fallback. Existing browser values take precedence; missing browser values
are restored from the backend. This is not a multi-user cloud-save service.

Open `http://localhost:3000/workspace` to inspect the current dataset pack, source
checks and progress backup. The server binds to localhost, and `.env` and backend
files are not exposed through static hosting.

## Local API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Local status and whether cloud publishing is configured |
| `/api/datasets` | GET | Current validated data manifest |
| `/api/data/{sha256}/{filename}` | GET | Immutable, versioned prepared data |
| `/api/progress` | GET / PUT | Read or merge local LUNA save keys |
| `/api/progress/export` | GET | Download the current save backup |
| `/api/source-checks` | GET | Last recorded NASA publication-header checks |

PUT progress accepts `{"values":{"luna-labels-v1":"true"}}`. Values are strings
because they mirror the game's existing localStorage records. A value of `null`
removes that key. The adapter batches writes; `window.lunaLocal.flush()` can force
a pending checkpoint to disk from the browser console.

## Versioned data and recovery

On startup, all ten `dist/data/*.json` runtime assets are validated and copied into
content-addressed objects. A small manifest pointer selects the current pack.
Each game startup fetches one manifest and uses only that pack's immutable assets.
Active missions do not silently switch data. Old manifests and objects remain
available. Progress and the dataset pointer use different files so a data update
does not overwrite a checkpoint.

`backend/data/state.json` contains the current local progress.
`backend/data/state.backup.json` contains the previous complete save. Preserve
this folder when replacing source files or moving your workspace. Download a save
backup from the workspace page before a major update. To restore it, stop the
server, copy the backup's `values` into `state.json`'s `progress.values`, and clear
only the corresponding LUNA browser storage keys before restarting. Keep a copy
of both files before editing. Existing browser records intentionally win conflicts.

## NASA checks and supported refreshes

Install Python 3 to use these optional commands. The npm wrapper finds Python on
Windows, Linux and macOS; set `PYTHON` in `.env` if it is not on PATH.

```sh
npm run data:check
npm run data:watch
npm run data:refresh
npm run data:register
npm run data:test
```

- `data:check`: check NASA/PDS release headers; record failures without replacing
  usable game data. Header dates are publication metadata, not observation dates.
- `data:watch`: check once on startup and every `NASA_CHECK_HOURS` hours while this
  terminal is running. Default: 24 hours. A detected change is reported. Setting
  `NASA_AUTO_REFRESH=true` permits a staged refresh after a detected header change.
- `data:refresh`: stage fresh LOLA, MOLA, Horizons, catalogue and NAIF inputs, then
  validate and publish the full pack. NASA calls are sequential. This can take a
  long time and requires internet access. A failed download leaves the published
  pack intact. Some upstream hosts omit change headers; those checks cannot prove
  content is unchanged. Ephemerides retain the existing mission time coverage.
- `data:register`: validate and publish local JSON edits without downloading.
- `data:test`: run offline Python adapter tests.

The older acquisition scripts remain available in `tools/`. `acquire-voyage.py`
also uses Pillow if you choose to run it. The new updater uses Python's standard
library. It does not currently ingest MEDA weather or unknown challenge formats;
those need a format-specific adapter once the official resources are selected.
Authored weather, radiation, health and life-support rules remain labelled in the
existing scientific-accuracy notes.

For unattended checks on Windows, configure Task Scheduler to run Node with
arguments `"C:\path\to\LUNA\tools\run-data-job.mjs" --check` and set **Start in**
to your LUNA folder. On a hosted worker, schedule the same command through a cron
service. This package does not create an external schedule or deploy anything.

## Optional Supabase publishing

1. Create your own Supabase project.
2. Run `backend/supabase/schema.sql` in its SQL editor.
3. Copy `.env.example` to `.env` and fill `SUPABASE_URL` and the server-only legacy
   `SUPABASE_SERVICE_ROLE_KEY`. Keep `.env` local; never put this key in `dist/`.
4. Run `npm run cloud:publish`.

The publisher uploads prepared assets to the `luna-datasets` Storage bucket,
upserts dataset metadata and version rows, and publishes a pack manifest after
all uploads succeed. Original downloads remain in your local source cache; the
cloud command publishes the ten prepared runtime JSON assets, not every raw file.

The SQL also provides an authenticated `player_progress` table with per-user
access rules. **Cloud login and cloud progress syncing are not wired into this
local game yet.** The working save adapter currently uses the local API. The
Supabase migration and tested publisher are the foundation for that next step.
Cloud publishing requires your credentials and has not been exercised against a
live account in this deliverable. Keep database and Storage backups separately.

Useful primary documentation:

- https://supabase.com/docs/guides/api
- https://supabase.com/docs/guides/storage
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://ssd-api.jpl.nasa.gov/doc/horizons.html
