# Release validation · 1.3.1 — 7 November 2026

## Completed

- **135 Node tests passed, 0 failed** (`npm test`, about 220 seconds on Linux with Node 22). The previous 136 tests minus the three narration/voice-clip tests, plus two new ones: the story holds each caption for its reading time, and narration is fully removed (no speech API, voice settings or bundled clips).
- **3 Python data tests passed** (`npm run data:test`). The expected mocked failure still prints `lola: failed`; the assertions check that a failed update keeps the previous data.
- JavaScript syntax check passed (`npm run check`).
- `dist/game.js` and `dist/luna-playable.html` rebuilt from current source. `npm run build` no longer needs `quiet-orbit.mp3` or voice clips.
- Headless Chromium (software WebGL) smoke test of both the served game and the offline HTML: the page boots, the opening story advances by reading time without narration, Skip → Moon → Board the spaceship reaches the boarding phase, no voice controls remain, and there were no page errors, console errors or failed requests.

## Verification limits

- The headless browser renders WebGL in software at about 2 frames per second. It confirms the code runs, not how the game looks. Final GPU lighting, shadows, greenhouse and crew appearance, frame rate and phone layout still need checking on a real WebGL 2 browser.
- Audio was not listening-tested. Music and effects channels are covered by controller tests only.
- The local bundle was built with esbuild 0.28.2 (the pinned 0.25.10 Windows binary in `node_modules` cannot run on Linux). Running `npm.cmd run build` on Windows rebuilds with the pinned version.
- The software renderer logged a `glTexSubImage2D: Offset overflows texture dimensions` warning at start-up. It comes from inside Three.js, not from game code, and may be specific to software rendering. Check the browser console on real hardware.

## Recommended machine check

On Windows, run `npm.cmd start` and open http://localhost:3000. Watch the four-chapter opening (no voice-over) and check that each caption stays long enough to read. Change music/effects settings. Select Moon, board, launch, try one unsafe and one safe landing, and disembark. Complete the seven equipment stages, inspect the greenhouse and use *Walk to the greenhouse*, send Earth a request and reload a checkpoint. Repeat for Mars and at phone width.

## Deliberate limitations

Procedural character models and reconstructed terrain keep the supplied game's identity; this is not a photorealistic production. Companions walk and inspect but do not make resource decisions. The opening is a real-time 3D cinematic with on-screen captions. ASTRA's advice comes from contextual rules, not a cloud language model. The client owns the simulation and Node only stores data and saves, so this is not multiplayer and has no anti-cheat server.
