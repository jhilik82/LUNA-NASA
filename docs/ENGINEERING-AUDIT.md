# Junior Astronaut Mission Trainer · engineering audit

Audit date: 4 November 2026

## Prioritized findings

1. **Harden static file serving against symlink escapes (high; addressed).** The localhost
   server checked that a resolved URL stayed under `dist/` or `workspace/`, but
   then followed filesystem symlinks. A symlink created in either served tree
   could expose a file elsewhere on the machine through the local server. The
   server now checks the canonical filesystem path before serving it, with a
   regression test for an outside symlink.
2. **Add a real browser demonstration pass (high).** The project has extensive
   automated coverage for mission systems, rendering logic and generated offline
   output. The supplied verification notes still identify interactive browser
   rendering, audio playback and on-device performance as unverified. Validate
   the launch-to-EVA flow and narrow-screen HUD in supported browsers before the
   challenge demonstration.
3. **Complete cloud player saves only if multi-user judging needs them (medium).**
   Supabase publishing is optional and the local API intentionally supports one
   profile. Authentication and cloud progress syncing are explicitly outside
   the current implementation; keep the local/offline path as the reliable demo
   mode unless shared accounts are a stated requirement.
4. **Keep generated artifacts reproducible (medium).** The maintained modules
   live in `dist/`, while `dist/game.js` and `dist/luna-playable.html` are
   generated. Continue making source edits in the documented modules and rebuild
   both deliverables together so the hosted and offline experiences stay aligned.
5. **Preserve the scientific boundary (ongoing).** The UI and accuracy notes
   already distinguish measured/cached source data from authored reconstructions
   and educational rules. Keep those labels visible as mission content evolves.

## Architecture and scope

- Frontend: browser ES modules in `dist/`, rendered with Three.js; esbuild
  produces the bundled client and a self-contained offline HTML export.
- Backend: Node HTTP server, local atomic JSON persistence, immutable
  content-addressed dataset packs, and an optional Supabase publisher.
- Data: prepared NASA/JPL and catalogue inputs plus clearly labelled derived or
  authored training content. Python tools check and stage supported updates.
- Existing experience: Moon/Mars flight, landing, EVA, ten practical lessons per
  world, seven-stage outpost expeditions, astronomy views, progress saves, and a
  standalone offline export.

## Checks run

- `npm run check`: passed.
- `npm run build`: passed; standalone offline export generated.
- Backend tests: all seven cases reported success in the full run, including
  API access, dataset integrity, persistence, cloud publisher mocks, and the new
  symlink regression.
- Focused frontend tests (`mission`, `navigation`, `onboarding`): 3 test files
  passed.
- Frontend tests: the full `npm test` process stopped producing output after the
  backend cases and did not yield a final summary. Treat frontend/full-suite
  status as incomplete; run the renderer-heavy suite separately in a normal
  development environment.

## Changes in this audit

The first implementation group closes the static-serving symlink boundary and
adds regression coverage. No mission rules or NASA-derived data are changed.
