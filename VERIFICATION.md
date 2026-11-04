# Verification for the local workspace · 1.2.3

Verified on Linux with Node.js 24:

- Dependency versions remain pinned in the included package lock.
- All **126 JavaScript game and backend tests pass**.
- All **three offline Python data-adapter tests pass**.
- Game, backend, tool and workspace JavaScript syntax checks pass.
- The game bundle and standalone offline HTML export build successfully. Both
  embedded offline scripts parse, with all Moon/Mars data inside the file.
- Narration completion and Skip story restore gameplay chrome and its input
  state. The controller accepts mouse/touch flight dragging; drags, cancellations,
  right clicks and Settings cannot accidentally press the launch switch.
- Departure and boarding cameras match a spherical orbit at five bearings from
  0° to 360°, retain distance and aim, and leave flight/mission progress unchanged.
  The original boarding-floor, helmet-clearance and closed-hull occlusion checks pass.
- Vertical rays across both sides of the launch coast intersect one ground
  object per footprint. Sixty boarding frames reuse stable geometry and the
  exterior depth range; close cockpit controls retain the original near plane.
- Both default Earth departures and destination daylight arrivals use the
  shared astronomical Sun. Earth sky brightness, direct Sun and work lights
  agree at each departure; changing the same clock can make the Mars route's
  Earth pad daylight too.
- The exact new Earth sky shaders compile, link and render at 640×360 on Mesa
  software OpenGL ES 3.2 (llvmpipe). The day and night frames cover the viewport
  without depth holes and differ in mean pixel brightness as expected. This is
  a shader/background check, not a full interactive-browser render.
- Detailed lunar impact meshes are pickable; actor placement matches their
  triangles. Small gravel follows EVA routes and regenerates identically when
  returning; large rocks retain solid collision envelopes.
- A late-decoded lunar tile updates close and distant terrain together; disposal
  prevents an image load from reviving released textures. The Sun shadow map
  covers terrain 40 m ahead at all eight tested viewing bearings while retaining
  the physical Sun direction and 1.7 m eye height.
- Both physical-scale ten-lesson courses and seven-stage expeditions complete
  with the updated lunar relief and a parked lander.
- The unchanged 1.2.2 lunar soil, shadowed-soil and instanced-rock shaders were
  compiled and linked on Mesa software OpenGL ES 3.2. The actual terrain geometry,
  authored texture and dated Sun render at 1280×720 from a surface and crater-rim
  viewpoint; terrain-only previews are included under `docs/`.
- All 107 original files under `dist/data/`, the lunar regolith image and the Mars
  reference image match the 1.2.2 workspace byte for byte.
- A clean extracted ZIP starts with `npm start` without installed dependencies;
  the client, workspace, lunar image, all ten data assets and offline export load.
- The local API serves the actual ten-asset NASA/game pack and restores saved
  progress after a server restart.
- Invalid data does not replace the current published pack; old objects remain
  unchanged and available.
- The development server starts, adds the browser-reload script, and emits a
  reload event after a saved source edit successfully rebuilds.
- The optional Supabase publisher is tested with mocked HTTP responses.

Not exercised against live external services: Supabase publishing/authentication
and a complete new NASA download. Cloud login/save UI is not implemented. The
existing terrain, astronomy and authored educational rules are preserved.

Interactive browser rendering, audible playback and native Windows execution
were not verified in this environment. Software sky/terrain renders are not full
browser screenshots or performance measurements. The renderer/controller tests
exercise both worlds, complete missions, boarding, landing and cameras. The
coastline checks remove the identified depth conflict; they do not constitute
an on-device visual check of the user's flickering.
