# LUNA + ASTRA performance audit

Audit date: 4 November 2026

## Findings and order of work

1. **Apply the selected quality preset during startup (fixed).** Settings saved
   `balanced`, but startup never called `applyGraphics()`. The renderer therefore
   kept its constructor default of a 2048² directional shadow map until the player
   changed destinations, changed the setting, or rebuilt the surface. Startup now
   applies the selected preset. Balanced uses 1024² and High uses 2048², matching
   the Settings labels. Balanced now shades one quarter as many shadow-map texels
   per pass as the previous 2048² map (1,048,576 vs. 4,194,304).
2. **Avoid duplicate scene matrix walks (fixed).** Surface, cinematic and flight
   render paths explicitly forced `scene.updateMatrixWorld(true)` immediately
   before `WebGLRenderer.render()`. Three.js updates scene matrices in its render
   path, so this forced another full scene traversal each frame. The redundant
   walks are removed; render still performs the required update.
3. **Reduce per-frame particle bookkeeping (fixed).** Particle updates copied the
   particle array and used `indexOf` before each removal. They now iterate backward
   and remove by index without allocating a frame-local copy.
4. **Profile on a hardware accelerated browser next.** Chrome was available in
   headless mode, but only with SwiftShader software WebGL in this environment.
   It is useful for exercising WebGL 2 startup, not for judging integrated-GPU
   frame rate. The software profile was too erratic to use as a before/after FPS
   claim, and no GPU timer query was available.

## Measurements collected

The first headless Chrome sample used a 1280 × 503 WebGL 2 canvas, Balanced UI
selection, 235 draw calls, 43,882 triangles, 1,011 Three.js geometries and 16
textures. It produced only five frame intervals in the 5.5 second sample, with a
0.9 FPS arithmetic average and a 2.55 second 95th-percentile interval. A later
sample produced seven intervals, 1.2 FPS and a 2.12 second 95th-percentile
interval, while reporting 801 geometries. Those samples included software shader
compilation and severe frame stalls, so they are diagnostics of this headless
SwiftShader setup, not a valid laptop game benchmark. They do not support an FPS
improvement claim.

The first browser inspection also confirmed the Balanced setting still held a
2048 shadow map at startup. After applying the preset during boot, Chrome DevTools
reported the expected 1024 map, a 1× headless device pixel ratio, and WebGL 2.

Three.js draw, triangle, geometry and texture counters are scene counters, not
GPU timing or total VRAM measurements. The browser does not expose a reliable
per-frame GPU duration here. A hardware accelerated Chrome/Edge/Firefox run on an
ordinary laptop is still required for representative FPS, 1% lows, GPU duration,
thermal behavior and visual review.

## Other inspected costs

- The scene has many real terrain and environment meshes, but current scene
  geometry is built once per world and is disposed on world replacement. This
  audit did not remove scene detail or alter measured terrain.
- The normal animation loop throttles HUD updates to 4 Hz and pauses mission
  simulation while dialogs/tutorials hold time. Draw and cinematic animation
  continue while their scene is visible, as expected.
- The standalone offline HTML is about 21 MB because it embeds its required data,
  textures and game code. The hosted page loads individual assets; the offline
  export is not part of normal game startup.
- The roughly 7.2 MB Moon/Mars/Earth image assets are candidates for
  loading and decode profiling, but no asset was reduced without browser evidence
  of a load-time or GPU-memory bottleneck.

## Verification

`npm test` passed all 127 tests. The focused Three.js world, landing scene and
Moon/Mars environment tests also passed after the renderer changes. `npm run
check` and `npm run build` passed. Startup was checked in headless Chrome: WebGL 2
initialized and Balanced selected a 1024² shadow map after startup preset
application. Full interactive review and representative hardware-GPU frame
timing remain outstanding.
