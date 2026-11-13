# LUNA — Beyond the Lifeline

A playable 3D junior-astronaut academy built on NASA lunar elevation data and
cached JPL ephemerides. Release 0.9 contains ten connected practical missions:

1. EVA navigation: walk to a training beacon, scan the terrain and check in at Haven.
2. Outpost systems: reconnect Haven's circuit and balance a finite power supply.
3. Rover recovery: repair the relay and Echo, board the rover and dock at Haven.
4. Scientific navigation: scan two survey sites, inspect Earth and LRO, and return.
5. Shelter response: reach Haven, seal the shelter and balance emergency power.
6. Solar calibration: rotate the array's two axes and commission its modeled output.
7. EVA preparation: check suit reserves, seal the inner hatch, vent and open the outer hatch.
8. Sample handling: collect a fictional specimen, preserve its actual site record, seal and stow it.
9. Communications: point the physical dish and establish an authored training link.
10. Logistics: load a visible crate, drive Echo to the field station, unload and return.

Release 0.7.1 gives each circuit repair a distinct route and terminal orientation:
Haven runs from top-left to bottom-right through a winding distribution bus;
the relay bridges the middle-left input to the middle-right output across the
top row; Echo climbs from its bottom-left input to its top-right output. ASTRA's
instructions and hints follow the active circuit. Initial tile rotations are
seeded and each layout is guaranteed solvable.

Each mission states its learning goal and shows the current task. Finishing the
practical task immediately earns its named badge, 300 XP and the next level.
The debrief's optional knowledge check adds 100 XP; wrong answers never block advancement.
Rank advances from Junior Cadet to Qualified Junior Astronaut. Badges, unlocked
levels and the selected lesson persist locally when browser storage is available.
Field checkpoints remain session-only; a refresh begins the selected briefing.
Replay never removes earned badges or adds duplicate XP.

The permanent Next action card explains what to do and supplies the relevant
Start, Go to objective, Scan, Interact, Orbital or Continue action. ASTRA's
movable tutorial follows actual actions in each lesson. It starts enabled for
existing players migrating from the old recovery tutorial. The visible Tutorial
and Settings buttons can hide or restore guidance without resetting the mission.
Settings also offers music/effects mute, volume, reduced motion, world labels,
camera reset and companion-position reset. Preferences persist in this browser.

Surface is the main playable view. Dark, opaque text panels and labels preserve
contrast against white terrain and structures. YOU identifies the active suit or
rover; the objective marker includes distance and an off-screen direction. The
surface tracker also labels YOU. A normal mouse or one-finger drag now looks
around by default; it never starts a walking route. Only a click or tap released
without dragging plots a route. Right drag also looks around. Pan terrain enables
one-finger/left-button panning; Shift-drag or middle-drag pans without changing the
mode. Panning moves the camera focus within the playable crop without moving the
astronaut. The wider zoom range lets you inspect near and distant terrain.
Show objective frames the current mission target, and dragging then orbits that
point. Overview frames the astronaut and destination together, including their
height difference, at desktop and phone aspect ratios. Follow astronaut restores
the moving view. Visible direction buttons, [ / ] and , / . also turn and tilt.

Astronaut view (F) places the camera at the actual visor height with a wider
72-degree field of view. Drag through a full horizontal turn and look up/down;
WASD follows the helmet's horizontal direction. Show objective turns the helmet
toward the current target without moving the player. The player's own suit is
hidden to keep the opaque visor out of the camera; surrounding equipment retains
normal depth occlusion. When boarded, the same view uses Echo's roof-mounted
driving camera. Orbit zoom and panning are disabled in helmet view. Your chosen
perspective is retained between lessons and restored after equipment practice.
Equipment demonstrations use the orbit camera so the apparatus stays visible.

WASD and arrow keys follow the camera. E interacts; Q records a nearby survey.
Go to objective and ASTRA calculate routes through the actual terrain graph,
respecting slope limits and solid equipment footprints. Manual movement takes over.

The orbital observation view uses dark-backed captions and leader lines, separate
Inspect Earth/LRO actions and a Return to play button. It pauses mission time
while being studied. Its canvas texture uses sRGB without filmic tone mapping so
its dark background and text contrast are retained. The vectors are dated
04–05 October 2026, Moon-centred ICRF samples, not live spacecraft telemetry.

Three.js renders the measured NASA LOLA height grid and solid astronaut, outpost,
relay, solar-array and rover models. They share a depth buffer; foreground
structures occlude the astronaut. Boarding hides the suit, and dismounting places
it outside Echo. Equipment footprints also block walking and route planning.
Models, structure placement, sunlight, sky, particles and relief exaggeration are
artistic or authored content, not observed lunar installations. The Lifeline
compares a calculated return route with actual remaining oxygen, water and energy.

The new equipment workbench stays beside the 3D scene. Instructor demonstrations
animate the apparatus without changing tasks or awarding progress; moving a
control stops the demonstration and gives the player control. Array and antenna
axes follow the sliders, the hatch slides, the chamber's pressure column falls,
the canister lid and identity light respond to handling, and cargo moves from
the outpost to Echo to the field station. The suit is hidden while inside the
airlock. Movement and reserves pause while equipment controls are open.

Release 0.9 stages a lander touchdown, ballistic surface dust, a rolling and
braking rover, a deliberate relay alignment, and a cadet walking beside the
instructor before checking a wrist display. The astronaut has separate hip,
knee, shoulder, elbow and helmet pivots, smaller helmet proportions, grounded
boots, subtle idle movement and distance-driven gait. Rover pitch and roll follow
the sampled terrain; wheel rotation follows travel rather than a timer. Fine
surface grain, foil detail, a lower key light, longer shadows, composed camera
tracks, brief cuts and timed original sound cues give the opening more depth.
Dust uses lunar-gravity arcs, with a bounded reusable mesh pool. The cinematic
has no effect on mission positions, resources, tasks or badges. Skipping clears
its lander, crew, dust and lighting effects and restores the chosen camera.
Reduced motion uses still poses and camera positions within each chapter.
These are authored game visuals; the landing and character animation are not
spacecraft engineering or astronaut biomechanics simulations.

The opening is a 26-second animation that runs once each time the game is opened.
It moves automatically into the selected briefing, can be skipped, has no media
playback controls and does not loop or replay when a lesson or tutorial restarts.
Skipping affects only that visit. Settings offers Opening animation on/off for
future visits, remembered under `luna-story-enabled-v1` and enabled by default.
The legacy permanent seen/skip flag is ignored. It stops advancing in a background tab.
Music begins after a player gesture. Reduced motion suppresses camera travel,
walking effects and particles. No runtime CDN or API is required.

The curriculum, power demands, alerts, hardware and skill checks are fictional
educational scenarios stored in `dist/data/academy.json` and `mission.json`.
The greenhouse workbench models power demand, not crop growth; the shelter drill
models procedures and essential loads, not radiation dose or a forecast. Solar
and antenna targets are fictional, not calculated lunar illumination or real
radio predictions. These drills are educational game procedures, not certified
astronaut instruction.
Mission time advances 10× during surface play. Briefings, repairs, power workbenches,
dialogs, pause and the orbital observation view freeze mission time.

NASA PDS terrain: https://pds-geosciences.wustl.edu/missions/lro/lola.htm
NASA/JPL Horizons: https://ssd.jpl.nasa.gov/horizons/

## Development

`dist/engine.js` owns terrain and the recovery model; `dist/academy.js` extends it
with lessons, field tasks, power plans, equipment procedures, optional skill checks
and saved advancement. `dist/training-drills.js` defines controls and authored targets.
`dist/academy-guide.js` supplies action guidance. `dist/world-layout.js` shares
scenery footprints with collisions. `dist/render-3d.js` and `dist/models.js` build
the Three.js scene; `dist/maps.js` draws tracking views. `dist/story.js` owns the
one-time intro; `dist/animation.js` defines deterministic cinematic motion, gait
and dust arcs. `dist/app.js` connects UI, input, audio and movable companions.

```sh
npm install
npm run build
npm start
```

`tools/build-client.mjs` bundles Three.js and the game into `dist/game.js` with its
MIT notice. `tools/export-game.mjs` embeds the bundle, CSS and all four data packs
into `dist/luna-playable.html` for offline play. WebGL 2 and hardware acceleration
are required. Run `npm test` and `npm run check` for validation.
NASA data acquisition can be reproduced with `python tools/acquire_data.py`.

Validation: 62 automated tests cover full ten-level completion, direct advancement,
optional quiz bonuses, persistent badges/ranks, failure recovery, power constraints, controller
wiring, non-destructive tutorial restore, dialog/orbit time protection, NASA data,
routing, circuits, reserves, companions, music logic, collisions, depth occlusion
and per-visit story behavior, equipment sequences, camera drag/click separation,
terrain panning, visor-level first-person movement, objective aiming, and full camera orbit. Native
canvas and software shading check all ten scene refreshes, five equipment demonstrations,
all four story shots, landing and braking phases, wrist and crew poses, camera
projection, tracking labels at desktop and phone sizes,
map raycasts, helmet visibility, objective framing and effects. Browser layout, GPU shader execution,
performance and audible music playback could not be verified in this environment.
Animation checks also cover skip cleanup, static reduced-motion scenes, bounded
dust reuse, timed audio cues, and restoration of first-person view.
