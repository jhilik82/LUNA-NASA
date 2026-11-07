# Opening and flight fixes · 1.2.3-local

## What changed

- The opening cinematic owns the whole window. The training panel, header,
  footer, assistant and surface overlays are hidden during narration, including
  on narrow screens. Their prior visibility and input state return on completion
  or Skip story. Music and Skip story remain available in the cinematic itself.
- Mouse and finger dragging now works at destination selection and during
  boarding as well as in the cockpit, cruise and landing. Exterior views orbit
  through a full 360 degrees. Dragging changes the view without moving the
  surface astronaut or advancing the flight.
- A drag, right click, cancelled pointer or open dialog cannot press the physical
  launch switch. Boarding ends with the cockpit facing the console; you can then
  look around it. The boarding path, floor and true hatch opening are preserved.
- Earth sky brightness follows the same dated Sun as the ground. Gantry and pad
  fixtures illuminate nighttime departures. The readout identifies daylight,
  twilight or night at the Earth launch site and reports Sun elevation.
- Land and sea meet at one coastline. They no longer overlap over a large area
  at almost the same height. Exterior depth precision is improved, and the
  atmospheric background follows the camera without writing scene depth.

## Why the two launch screenshots had different lighting

Both screenshots show **Earth**, before takeoff. Selecting a destination loads
its terrain for later, but you remain at Earth's launch pad. The route planner
chooses a dated departure so that the destination arrival is in daylight.
Repeated starts use those same initial mission windows.

| Destination | Default Earth departure, UTC | Sun above Earth pad | Destination arrival Sun |
| --- | --- | --- | --- |
| Moon | 15 October 2026, 20:00 | +34.1°, daylight | +28.4°, daylight |
| Mars | 5 October 2026, 02:00 | −39.0°, night | +31.0°, daylight |

UTC is not local solar time. Lighting comes from Sun direction in the observer's
local horizon frame. Neither Moon nor Mars is assigned permanent day or night.
After landing, use **Sky guide → UTC** to inspect different times inside the
cached astronomy coverage. Closing exploration restores the mission clock.

Previously, Earth ground lighting used that Sun but the launch sky always used a
blue daytime gradient. The updated sky, sunlight and local lights agree.
Sky colours and lights are visual approximations; the Sun direction and elevation
continue to use the shared astronomical data.

## Mathematics used

The exterior camera uses spherical coordinates around its subject. With radius
`r`, yaw `a` and pitch `b`, the offset is:

```text
x = r sin(a) cos(b)
y = r sin(b)
z = r cos(a) cos(b)
```

Dragging changes yaw and pitch while preserving radius and the camera's target.
Yaw is unrestricted, so the view can complete a full turn. Pitch is bounded to
keep the exterior camera above the ground rather than passing below it.

For a perspective depth buffer, an approximate distance resolution at camera
depth `z` is `(far − near) z² / (far · near · 2^bits)`. A 0.035 m near plane was
appropriate for close cockpit controls but gave poor precision at the distant
coast. Exterior views now use 0.5 m, retaining 0.035 m inside. The decisive fix
is removal of the overlapping land/water faces; camera movement does not recreate
either geometry.

The launch sky interpolates day and night with a smoothstep of local Sun
elevation between −8° and +6°. Direct Sun illumination stops below the horizon.
Twilight and nearby work lights preserve a readable night scene. These are
rendering approximations rather than an atmospheric radiative-transfer model.

## Files to update in an existing copy

| File | Purpose |
| --- | --- |
| `dist/app.js` | Cinematic visibility/input restoration, flight drag handling, safe launch clicks and lighting readout |
| `dist/index.html` | Stable header/footer IDs and fresh bundle/style cache keys |
| `dist/styles.css` | Full-window cinematic layout and hidden gameplay overlays |
| `dist/flight-renderer.js` | Spherical exterior cameras, coastline, depth range, Earth sky and night fixtures |
| `dist/game.js` | Rebuilt runnable client |
| `dist/luna-playable.html` | Rebuilt standalone offline game |
| `package.json`, `package-lock.json` | Matching release version |

The regression tests, README files and verification notes are updated too.
NASA/game data, the lunar regolith image, both reconstructed surfaces and saved
mission formats retain their existing content. Keep your own `backend/data/`,
`.env` and local edits when updating an existing installation.

The supplied ZIP is built. Open the inner **LUNA** folder and run `npm start`,
then open `http://localhost:3000`. Reload the tab with **Ctrl+Shift+R** after
replacing old files. If editing source, use `npm ci` followed by `npm run dev`.

## Verification

The tests exercise the actual camera geometry at five orbit bearings, the
boarding hatch/floor alignment, land/water ray intersections, both dated launch
lighting states, completion and Skip story restoration, and launch gesture
handling. Complete courses, expeditions, landing cameras, backend storage and
offline exports remain covered by the full suite. See [VERIFICATION.md](VERIFICATION.md)
for the release results and the limits of rendering checks.
