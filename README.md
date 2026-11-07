# LUNA — Beyond the Lifeline · merged edition 1.3.1

A complete editable Moon/Mars game: story → destination → boarding → launch → transfer → interactive landing → outpost mission.

**Open `README-START-HERE.md` for Windows/VS Code commands.** Quick play: `npm start`, then http://localhost:3000. Editing: `npm ci` then `npm run dev`. Node.js 22+ and a WebGL 2 browser are required. No Python process or account is needed to play.

This merge keeps Local Workspace's flight, surfaces, scientific sky, seven-stage outpost missions and ten-lesson academies. It adds action-aware guidance, review/confirm forecasts, a visible greenhouse with delayed harvests, three animated coworkers, Earth communication delays and quiet procedural ambient music. Version 1.3.1 removes all spoken narration; guidance is on-screen text.

Source is in `dist/`; generated outputs are `dist/game.js` and `dist/luna-playable.html`. Node runs the local API and atomic JSON saves. Three.js/WebGL/GLSL render the game. Python handles optional data import and offline music composition. No second engine/server is required.

Read `HOW_TO_PLAY.md`, `CHANGES.md`, `FEATURE_ORIGINS.md`, `NASA_AND_MODELS.md` and `QA_REPORT.md`. The older scientific and backend documentation remains as detailed reference; these merged-release guides describe the current changes.

**Validation:** see `QA_REPORT.md` for the current test results. The preview browser has WebGL disabled, so final GPU visuals, real playback and phone layout still need checking on a supported browser. See `QA_REPORT.md` for the exact scope.
