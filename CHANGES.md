# Changes in 1.3.1

**Narration removed.** The game no longer speaks. All guidance (ASTRA, tutorial, equipment tasks, decision review) remains as on-screen text.

| File | Change |
| --- | --- |
| `dist/narration.js`, `dist/voice-clips.js`, `dist/assets/audio/` (51 voice MP3s) | Deleted. |
| `tools/record_narration.py`, `tools/narration-script.json` | Deleted (only used to prepare the voice clips). |
| `dist/mission-audio.js` | `MissionAudio` no longer owns a narration queue: `say()`, `cancelNarration()`, ducking and the `voiceOn`/`voiceVolume`/`voiceURI` settings are gone. Old saved voice preferences are dropped on load. Music and effects channels are unchanged. |
| `dist/story.js` | `StorySequence` advances each chapter after its reading time instead of waiting for speech. Reading time now follows the wall clock (up to 0.5 s per frame), so captions no longer linger on low-frame-rate machines. |
| `dist/app.js` | Removed every speech call (tutorial steps, ASTRA answers, equipment hints, decision review/consequence) and the voice settings handlers. |
| `dist/index.html`, `dist/styles.css` | Removed Narration on/off, Narration volume, Narrator selector, Preview voice and the floating “latest spoken caption” panel. |
| `tools/export-game.mjs` | No longer embeds voice clips or `quiet-orbit.mp3`. |

**Bug fixes.**

| Problem | Fix |
| --- | --- |
| `npm run build` crashed: `export-game.mjs` read `dist/assets/audio/quiet-orbit.mp3`, which had been deleted when music moved to the procedural `audio.js` score. | Export no longer reads it. |
| The served `dist/game.js` and `dist/luna-playable.html` were built before the latest edits to `app.js`, `render-3d.js`, `greenhouse.js`, `world-layout.js` and `mission-audio.js`, and the old bundle requested the missing MP3 (404). | Both rebuilt from current source. |
| 22 controller tests failed because `dist/app.js` had Windows (CRLF) line endings and the test loader only stripped `import` lines ending in LF. | `app.js` normalised to LF; the loader now accepts CRLF; `.gitattributes` and VS Code `files.eol` keep files LF. |
| “Walk to the greenhouse” announced “Walking…” even when no route could be planned or the mission was paused. | Only announces when a route starts; otherwise explains why. |
| Greenhouse plant growth in 3D used a hard-coded 6-hour cycle, ignoring `cropCycleHours` in `scenarios.json`. | Uses the configured cycle. |
| (1.3.1 hotfix) The opening 3D cinematic stopped drawing because a comment added in `animate()` swallowed the `cinematicFrame` call. | Fixed; `appflow.test.mjs` now asserts the cinematic is drawn on every story frame. |
| Docs referred to the removed MP3 score, the old story button labels and a 136/136 pass that no longer held. | Updated. |

Tests: two narration tests replaced by a reading-time story test and a “narration fully removed” test; the voice assertion in `appflow.test.mjs` now checks effects.

---

# File-by-file changes · merged edition 1.3.0 (previous release)

Local Workspace is the baseline. Existing files not listed in the inventory below are retained byte-for-byte, except generated/runtime exclusions.

| File | Functions/classes and concrete changes |
| --- | --- |
| `dist/expedition.js` | `simulateOutpost`: powered, delayed crop harvests with floating-point-safe boundaries. `advanceState`: common action/time update; movement charges suit consumption only once. `preview`/`choose`: pure forecast, before/after report, explicit expected-stage validation and single commit. `earthDelay`/`askEarth`: cached-geometry round-trip advice and one energy charge per stage. `acknowledgeGuide`/`replayCheckpoint`: persistent current-step guidance and schema-2 defaults. `astra`: experimental powered-shield terminology. |
| `dist/data/scenarios.json` | Editable crop cycle/harvest and radio energy rates; crop counters; experimental shielding labels. Four crew retained. |
| `dist/academy-guide.js` | `step`, `holdsTime`, `sync`: read each expedition objective, pause reading, track task phases from state, keep expedition guidance through the debrief. Existing practical academy guide retained. |
| `dist/app.js` | `syncSettings`, `syncTutorial`, `performAction`, `animate`: independent audio controls, narration, reading/hidden-page pauses and observed frame measurements. `renderDecision`, `forecastText`, `confirmDecision`: compare → review → confirm → actual consequence. `renderMessages`, `inspectGreenhouse`, `loadDonkiContext`: radio timing, garden inspection and honest archive display. `openStory`/`updateStoryCaption`/event handlers: gesture, captions-only entry, replay and sentence completion. `setupExpeditionEvents`/`syncFlight`: steady landing controls. |
| `dist/story.js` | `StorySequence`: four rewritten opening chapters, explicit audio start, narration completion gate, hidden-page pause, skip and replay. No incorrect south-pole claim. |
| `dist/narration.js` | `NarrationQueue`, `preferredVoice`: one channel, recorded-clip playback, device fallback, pending-hint replacement, captions, pause/resume, watchdog and explicit cancellation. |
| `dist/mission-audio.js` | `MissionAudio`: single controller for quiet-orbit MP3, Local effects and narration; smooth music ducking and separate music/voice/effects preferences. Original `Soundtrack` remains reusable for effects. |
| `dist/voice-clips.js`, `dist/assets/audio/voice/*.mp3` | Caption-to-file mapping and 51 bundled neural speech clips. |
| `dist/assets/audio/quiet-orbit.mp3` | Academy's original soothing ambient score. |
| `dist/greenhouse.js` | `createGreenhouse`: glazed dome, ribs, crop rows, plants, lights and door adapted to Local materials/coordinates. |
| `dist/companion-crew.js` | `CompanionCrew`: three coworkers, equipment stations, collision-aware routes, turning, boot contact and work poses using Local astronaut rigs. No hidden mission effects. |
| `dist/world-layout.js` | `createWorldLayout`: physical greenhouse placement/collider, positioned clear of the established rover route. |
| `dist/render-3d.js` | Constructor/`buildScenery`/`updateActors`: greenhouse and companion integration, visible growth and light intensity. Existing graphics, camera, terrain and sky retained. |
| `dist/voyage.js` | `setLandingTarget`, `gauges`, flight resets: optional steady inputs use the original landing lock, go-around and disembark validation. |
| `dist/index.html`, `dist/styles.css` | Three core habitat indicators, expandable advanced readings, review/result panels, greenhouse/radio controls, audio selectors/captions, replay and narrow-screen rules. |
| `backend/server.mjs` | MP3 and WAV response types for bundled audio. Local API/save architecture retained. |
| `tools/export-game.mjs` | Embeds the ambient score, all speech clips and DONKI archive into offline HTML along with the existing data/client. |
| `tools/compose_ambience.py` | Editable original ambient music composer, adapted tool path. |
| `tools/record_narration.py`, `tools/narration-script.json` | Optional online preparation of offline speech assets; exact editable text, natural voice and playback manifest. |
| `tools/fetch_donki.py`, `dist/data/donki_archive.json` | Dated real NASA flare import, original-response preservation and explicit empty/not-live state. No flare-to-dose conversion. |
| `tests/merged.test.mjs` | Ten focused merge tests for forecasts, charging, delays, guides, crops, migration, landing and audio. |
| `tests/appflow.test.mjs`, `tests/three-world.test.mjs` | Controller expectations updated for independent audio, explicit story start/replay and two-step decision confirmation. Existing coverage retained. |
| `package.json`, `package-lock.json` | Release version 1.3.0-merged; existing Three.js/esbuild stack retained. |
| `README.md`, `README-START-HERE.md`, `HOW_TO_PLAY.md`, `FEATURE_ORIGINS.md`, `NASA_AND_MODELS.md`, `QA_REPORT.md`, `CREDITS.md` | Setup, walkthrough, feature origins, data/model/audio provenance and honest test scope. |
| `dist/game.js`, `dist/luna-playable.html` | Generated delivery builds. Edit source modules and run `npm run build`. |

## Complete changed-file inventory

This includes retained documentation whose old branding was removed. Runtime `backend/data`, dependencies and Python caches are excluded from distribution.

| Status | Path |
| --- | --- |
| Modified | `CREDITS.md` |
| Added | `FEATURE_ORIGINS.md` |
| Added | `HOW_TO_PLAY.md` |
| Added | `NASA_AND_MODELS.md` |
| Added | `QA_REPORT.md` |
| Modified | `README-START-HERE.md` |
| Modified | `README.md` |
| Modified | `backend/server.mjs` |
| Modified | `dist/academy-guide.js` |
| Modified | `dist/app.js` |
| Added | `dist/assets/audio/quiet-orbit.mp3` |
| Added | `dist/assets/audio/voice/001d3d45daf0d355.mp3` |
| Added | `dist/assets/audio/voice/073607c278e2fa08.mp3` |
| Added | `dist/assets/audio/voice/082568781e3ec1bc.mp3` |
| Added | `dist/assets/audio/voice/1045d8c6c2ec3627.mp3` |
| Added | `dist/assets/audio/voice/13d320eb0cbcb1a2.mp3` |
| Added | `dist/assets/audio/voice/16ed8ae7751fd415.mp3` |
| Added | `dist/assets/audio/voice/1f647df4ea07d62b.mp3` |
| Added | `dist/assets/audio/voice/21b1afd432a59dc0.mp3` |
| Added | `dist/assets/audio/voice/22d0c0e346d1675f.mp3` |
| Added | `dist/assets/audio/voice/2437a7b64fc0e7be.mp3` |
| Added | `dist/assets/audio/voice/30bceb2adc3ca762.mp3` |
| Added | `dist/assets/audio/voice/32a44eec5bb4a391.mp3` |
| Added | `dist/assets/audio/voice/368f382d2fe019c7.mp3` |
| Added | `dist/assets/audio/voice/38c926f55a441f3d.mp3` |
| Added | `dist/assets/audio/voice/38f0d9edeffe86be.mp3` |
| Added | `dist/assets/audio/voice/445196d9070bbd25.mp3` |
| Added | `dist/assets/audio/voice/4ccf6252c66c7076.mp3` |
| Added | `dist/assets/audio/voice/5a12e0f62b18b965.mp3` |
| Added | `dist/assets/audio/voice/5d1e02aa4e891673.mp3` |
| Added | `dist/assets/audio/voice/63be0d8535dbfca7.mp3` |
| Added | `dist/assets/audio/voice/6ecd10e320c09943.mp3` |
| Added | `dist/assets/audio/voice/789d519b7bd63325.mp3` |
| Added | `dist/assets/audio/voice/7ebeb499533e0bb3.mp3` |
| Added | `dist/assets/audio/voice/8b10c9e2b54bb3d3.mp3` |
| Added | `dist/assets/audio/voice/8e95aa85f3367720.mp3` |
| Added | `dist/assets/audio/voice/8fa8179b0cd9282b.mp3` |
| Added | `dist/assets/audio/voice/909433345d2729e9.mp3` |
| Added | `dist/assets/audio/voice/9e5e8c4e2c7bddce.mp3` |
| Added | `dist/assets/audio/voice/a0e7984ffdf1dd5d.mp3` |
| Added | `dist/assets/audio/voice/a373635109c9dca4.mp3` |
| Added | `dist/assets/audio/voice/a3b59240649fd90d.mp3` |
| Added | `dist/assets/audio/voice/a515869c7b4456bb.mp3` |
| Added | `dist/assets/audio/voice/aa0e151160172b9c.mp3` |
| Added | `dist/assets/audio/voice/aa1b2ce6b5790915.mp3` |
| Added | `dist/assets/audio/voice/aade2f4405e419a5.mp3` |
| Added | `dist/assets/audio/voice/aaf33a018211fc4e.mp3` |
| Added | `dist/assets/audio/voice/b2d0a72032fd791a.mp3` |
| Added | `dist/assets/audio/voice/b825ab832b92443d.mp3` |
| Added | `dist/assets/audio/voice/bc8161bd5642853f.mp3` |
| Added | `dist/assets/audio/voice/bc94ce049b3de270.mp3` |
| Added | `dist/assets/audio/voice/bd27ea656f16c7ef.mp3` |
| Added | `dist/assets/audio/voice/d336cd0d732115ba.mp3` |
| Added | `dist/assets/audio/voice/d71f34a3c440c25a.mp3` |
| Added | `dist/assets/audio/voice/d846af5c6549ac48.mp3` |
| Added | `dist/assets/audio/voice/dc8e8c4a7f581836.mp3` |
| Added | `dist/assets/audio/voice/e03961c55f2b3ba3.mp3` |
| Added | `dist/assets/audio/voice/e66280e6088499de.mp3` |
| Added | `dist/assets/audio/voice/f13766915698c4c8.mp3` |
| Added | `dist/assets/audio/voice/f45cb5fb86791483.mp3` |
| Added | `dist/assets/audio/voice/f701f0996acc7ded.mp3` |
| Added | `dist/assets/audio/voice/fae2ebb60d2136ff.mp3` |
| Added | `dist/companion-crew.js` |
| Added | `dist/data/donki_archive.json` |
| Modified | `dist/data/scenarios.json` |
| Modified | `dist/expedition.js` |
| Modified | `dist/game.js` |
| Added | `dist/greenhouse.js` |
| Modified | `dist/index.html` |
| Modified | `dist/luna-playable.html` |
| Added | `dist/mission-audio.js` |
| Added | `dist/narration.js` |
| Modified | `dist/render-3d.js` |
| Modified | `dist/story.js` |
| Modified | `dist/styles.css` |
| Added | `dist/voice-clips.js` |
| Modified | `dist/voyage.js` |
| Modified | `dist/world-layout.js` |
| Modified | `package-lock.json` |
| Modified | `package.json` |
| Modified | `tests/appflow.test.mjs` |
| Added | `tests/merged.test.mjs` |
| Modified | `tests/three-world.test.mjs` |
| Added | `tools/compose_ambience.py` |
| Modified | `tools/export-game.mjs` |
| Added | `tools/fetch_donki.py` |
| Added | `tools/narration-script.json` |
| Added | `tools/record_narration.py` |
| Added | `CHANGES.md` |
