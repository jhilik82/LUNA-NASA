# LUNA — Beyond the Lifeline

LUNA is a playable Moon and Mars mission game that combines a cinematic story flow, flight and landing simulation, outpost operations, habitat management, and a mission-guidance layer inspired by both the Local Workspace project and the Academy teaching material.

This repository is the merged 1.3.1 release and includes the core game, supporting data and local backend tooling, as well as documentation describing the updated behaviors and scientific assumptions.

## Highlights of this update

- Story-first mission flow with Moon and Mars destinations
- Seven-stage guided outpost mission and a separate 10-lesson academy course
- Review/confirm decision workflow before actions are committed
- Visible greenhouse with crop growth, delayed harvests, and configurable cycle timing
- Three animated coworker units integrated into the world scene
- Earth communication delays and "Ask Earth" responses with time-based realism
- No spoken narration: all guidance remains on-screen text
- Quiet procedural ambient music and separate music/effects controls
- Local JSON-based save system and workspace dashboard
- Optional NASA data refresh tooling and Supabase publishing support

## Quick start

Requirements:

- Node.js 22 or newer
- A modern browser with WebGL 2 enabled
- Optional: Python 3 for the NASA data refresh and test commands

Run the game:

```bash
npm install
npm start
```

Then open:

- http://localhost:3000

For development with rebuilds while editing:

```bash
npm run dev
```

For Windows/VS Code instructions, see [README-START-HERE.md](README-START-HERE.md).

## Common commands

```bash
npm start          # serve the game and local API
npm run dev        # rebuild client on source changes
npm test           # run the test suite
npm run check      # run repository validation checks
npm run build      # build distributable client bundles
npm run data:test  # offline data validation tests
npm run data:check # check NASA publication headers
npm run data:refresh # stage and publish refreshed data pack
npm run cloud:publish # upload prepared data to Supabase
```

## What is included

### Game and simulation

- Story intro, destination selection, boarding, launch, cruise transfer, and landing phases
- Moon and Mars mission branches using the existing LUNA world layout
- Science, power, oxygen, crew, habitat and mission-stage management
- Action-aware guidance, objective tracking, and checkpoints
- Greenhouse operations and crop planning with delayed harvest timing

### Local backend

The project includes a lightweight local backend that stores runtime state and gameplay progress using atomic JSON files.

Key behaviors:

- Local data pack validation and versioned asset publishing
- Save progress and backup files under `backend/data/`
- Progress API and workspace UI at http://localhost:3000/workspace
- Optional cloud publishing pipeline for a Supabase project

### Data and scientific context

The project includes optional NASA-informed refresh steps and a documentation set describing the scope and limitations of the dataset assumptions.

## Repository layout

```text
LUNA-NASA/
├── backend/              # local API, save files, and optional cloud publishing
├── dist/                 # editable source modules and generated game bundles
├── docs/                 # supporting project docs and references
├── tests/                # automated test coverage
├── tools/                # build, data refresh, and export helpers
├── README.md             # main entry point
├── README-START-HERE.md  # Windows-focused quick start
├── HOW_TO_PLAY.md        # player walkthrough and controls
├── CHANGES.md            # detailed change log and file inventory
├── FEATURE_ORIGINS.md    # preserved vs adapted features
├── NASA_AND_MODELS.md    # source assumptions and scientific limits
├── QA_REPORT.md          # validation scope and current checks
├── package.json          # project scripts and dependencies
├── .env.example          # environment template for optional integrations
└── ...
```

## Important notes

- The source files live in `dist/`; generated files such as `dist/game.js` and `dist/luna-playable.html` are produced by the build process.
- The game intentionally does not use a second engine or separate online service for normal play.
- The project preserves the Local Workspace foundation while adding the merged feature set and updated integration structure.
- Some optional NASA refresh and cloud-publishing workflows require Python and/or a Supabase project and credentials.
- The game is designed for browser-based play, and final visual polish should still be checked in a supported GPU-enabled browser.

## Documentation map

For deeper context, read these in order:

- [README-START-HERE.md](README-START-HERE.md) — Windows and VS Code quick start
- [HOW_TO_PLAY.md](HOW_TO_PLAY.md) — gameplay walkthrough and controls
- [CHANGES.md](CHANGES.md) — updated behaviors and file-by-file changes
- [FEATURE_ORIGINS.md](FEATURE_ORIGINS.md) — preserved and adapted features
- [NASA_AND_MODELS.md](NASA_AND_MODELS.md) — NASA sources and model assumptions
- [QA_REPORT.md](QA_REPORT.md) — current test coverage and open checks
- [backend/README.md](backend/README.md) — local backend, data packs, save recovery, and optional cloud publishing

## Validation status

Current validation is documented in [QA_REPORT.md](QA_REPORT.md). The report describes the test suite, known verification limits, and the browser/WebGL checks that still require a real supported GPU environment.

## License and credits

This project includes third-party content and project credits described in the repository documentation. See the project files for licensing and attribution details.

---

If you want to jump directly into the game, use:

```bash
npm start
```

Then open http://localhost:3000 and begin the mission.
