# LUNA — merged edition 1.3.1

This is the complete editable game, using Local Workspace as the foundation and adding Academy's guidance, greenhouse and audio approach. Start with the story, select Moon or Mars, fly and land Odyssey, then operate Haven. Four crew share one outpost. The separate ten-lesson academy remains available on each world.

## Windows: quick play

1. Install Node.js 22 or newer if it is not installed.
2. Extract the ZIP using **Extract All**. Open the extracted **LUNA-Merged** folder in VS Code. `package.json` must be directly inside the folder you open.
3. Open **Terminal → New Terminal** and run:

```powershell
npm.cmd start
```

4. Open **http://localhost:3000** in Chrome, Edge or Firefox with WebGL 2 available. Leave the terminal running. Stop with **Ctrl+C**.
5. Click **Begin story with music** to unlock audio. Or choose **Watch without music** / **Skip story →**. Browsers require this click before sound starts. There is no voice-over; read the captions.

The prepared bundle needs no `npm install` for quick play. Python is not required to play. The existing game requires WebGL 2; unsupported browsers display an explanation rather than a software substitute.

## Windows: edit the source

From the same folder:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open **http://localhost:3000**. Saving client code triggers a rebuild and reload. A reload restarts the story/flight; completed outpost decisions and saved checkpoints remain available. Restart the terminal process after changing backend code.

To make a distributable bundle after editing:

```powershell
npm.cmd run build
npm.cmd start
```

Use `.cmd` in PowerShell to avoid an `npm.ps1` execution-policy problem. No policy change is needed. On macOS/Linux use `npm` instead of `npm.cmd`.

## Verify

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run data:test
```

The last command requires Python 3. It tests data preparation, not online NASA availability.

## Included guides

- `HOW_TO_PLAY.md`: beginner walkthrough and controls.
- `CHANGES.md`: exact changed files and relevant functions/classes.
- `FEATURE_ORIGINS.md`: features preserved from Local and adapted from Academy.
- `NASA_AND_MODELS.md`: sources, editable assumptions and scientific limits.
- `QA_REPORT.md`: actual tests and unverified graphics/audio checks.
- `backend/README.md`: local API, data versions, save backups and optional cloud setup.

The editable source lives in `dist/`, matching the original project's layout. Do not directly edit generated `dist/game.js` or `dist/luna-playable.html`.

## Offline play and saves

`dist/luna-playable.html` contains the client and datasets; music is generated live in the browser. It can be opened directly; using `npm.cmd start` is recommended because it also provides the local save API and workspace dashboard at **http://localhost:3000/workspace**. Some browsers restrict local-file storage.

Moon and Mars checkpoints retain their existing schema-2 keys. Older saves receive empty message/guide histories and a zero crop-progress counter when loaded; resources and stage are preserved. Academy's separate Python-engine saves cannot be imported because its turns and crew assumptions differ. This merge does not run that second engine.

The local Node server creates `backend/data/` on first start. Keep that folder and the same browser profile to retain progress. It is excluded from this release to avoid shipping developer test saves. Back it up before replacing an older installation.
