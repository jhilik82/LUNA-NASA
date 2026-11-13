# What was merged

| Area | Foundation / origin | Merged behavior |
| --- | --- | --- |
| Surface and spacecraft rendering | Local Workspace | Existing Three.js, GLSL, terrain relief, materials, footprints, sky, flight and camera implementation retained |
| Flight journey | Local Workspace | Boarding, cockpit switch, transfer decision, landing retry and explicit disembarking retained; optional steady sliders added |
| Outpost mission | Local Workspace | Seven stages per destination, practical procedures, EVA, safe return and debrief retained |
| Training academy | Local Workspace | Ten practical lessons per destination retained |
| Guidance | Academy approach + Local action state | Each objective pauses for reading; equipment tasks, comparison, review, confirmation and consequence follow real mission state |
| Decision cards | Academy approach | Before/after forecasts from Local's mission state; a separate confirm step; no second turn engine |
| Greenhouse | Academy model adapted to Local | Glass dome, planted rows and lighting at Haven; delayed harvests from the same outpost state |
| Coworkers | Academy behavior approach + Local astronaut models | Three animated coworkers plus the player; collision-aware routes and equipment inspection |
| Music and effects | Local procedural score + effects | Procedural background music from `audio.js`; Local footsteps, engines and repair cues under one controller with separate music/effects switches. No spoken narration (removed in 1.3.1) |
| Earth advice | Academy concept, reimplemented | Power cost and round-trip delay on Local mission time, calculated using cached JPL positions |
| Saves and server | Local Workspace | One Node API, browser storage fallback, atomic JSON backups, separate destination saves |
| NASA data | Local cache + Academy importer | Existing source metadata retained; DONKI archive importer and honest status display added |

The simpler Academy Python/SQLite game engine was not imported. Python prepares data (and optional offline music) only; it is not a second running game server. This keeps the established visual game and avoids incompatible resource clocks.
