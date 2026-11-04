# Data integration and replacement

The game runs offline from cached data. Acquisition is optional, never required
to play. From the project root, `python3 tools/acquire-astronomy.py` uses Python's
standard library to rebuild the shared astronomy pack, star catalogue and lunar
terrain. Cached raw responses make reruns reproducible without repeated queries.
`tools/acquire-voyage.py` retains the original MOLA/image acquisition and requires
Pillow. Rebuild the client/offline export after replacing data.

## Boundary between data and rules

| Input | Contract / replacement point |
| --- | --- |
| `data/astronomy.json` | `schema:2`, usable UTC `start/stop`, epoch, `bodies`, `sites`, `frames`, orientation, assets and independent validation. Body samples: `[utcSeconds,xKm,yKm,zKm,vxKmS,vyKmS,vzKmS]`. Preserve Sun-centred ICRF. |
| Observer frame samples | `frames.moon/mars.Sun/Earth.samples`: `[utc,azDeg,altDeg,diameterArcsec,rangeKm,rangeRateKmS,phaseDeg,apparentRaDeg,apparentDecDeg]`. Supply airless ICRF apparent RA/DEC, UTC, documented datum and east/west longitude convention. Current frames are anchored at Mare Tranquillitatis and Jezero. |
| Vector coverage | Include earlier padding longer than the farthest body's light time. Usable end must precede the last vector sample. Do not silently extrapolate or clamp public clock inputs. Phobos/Deimos need substantially denser sampling than planets. |
| `data/stars.json` | `source` metadata and `stars`: `[name,raDeg,decDeg,Vmag,BminusV,pmRaArcsecYear,pmDecArcsecYear]`. Proper-motion RA is the catalogue's RA×cos(dec) convention. Keep frame/epoch and processing clear. |
| Terrain packs | `width,height,cellMetres,heights` plus projection/datum and source. `heights` are metres; rows run south, columns east. Preserve native resolution. `longitudeDegreesPerCell` supports latitude-adjusted east-west sampling. |
| `data/scenarios.json` | Shared `crew/rates`; Moon/Mars initial state and seven stages. Each stage supplies location, task, description, optional hazard and choices with minutes/effects. This is where partner-verified rates or challenge datasets replace teaching assumptions. |
| `mission.json` | Movement speeds, gravity, suit/rover consumption and equipment limits. These values must match any revised EVA rules and geometry. |
| Assets | Each cached image includes source/credit; add resolution, acquisition date, processing, coordinate registration and purpose. A reference image is not automatically a texture/mesh of the playable location. |

`worlds.js` chooses the destination and constructs the mission.
`reference-landscape.js` layers explicitly authored reference-inspired landforms
over the immutable DEM and adds solid geology colliders. `measuredHeightAt`
returns the original bilinear DEM; `heightAt` is the shared playable surface.
`reference-geometry.js` builds opaque detailed patches and laminated rock meshes.
Navigation samples intermediate grades through the reconstructed features. `AstronomicalWorld`
owns positions, UTC and observer geometry. `ExpeditionMission` owns resources,
choices, checkpoints and rule-based ASTRA. Visual modules read those models;
do not add independent decorative planet positions to scientific scenes.

## Adding terrain or a future challenge dataset

1. Retain the original source product/label or response, source URL, retrieval
   metadata, units, native resolution, datum, processing and checksum.
2. Reproject into the selected body's documented terrain frame. Resolve geodetic
   versus planetocentric latitude, longitude sign and vertical datum explicitly.
   Current Jezero sky heights approximate MOLA areoid as local ellipsoid height.
3. Add a distinct geographical destination and matching observer-frame samples.
   Do not place another region's landmarks around Jezero. A far-side/polar surface
   needs its own measured terrain and horizon; the current far-side feature is sky-only.
4. Convert vehicle, astronaut, collision, dust and camera dimensions through
   `unitsPerMetre`. Keep scientific disk size independent of navigation-map scale.
5. Replace scenario rates only where the supplied dataset supports them. Keep
   emergencies, weather and health assumptions identified. ASTRA must quote the
   actual revised simulation outputs, never fill missing telemetry with guesses.
6. Add independent observer checks not used to construct the frame. Validate
   representative dates near departure and arrival, light-time boundaries,
   Sun/Earth direction, scale, eclipse/horizon and fast moon motion.
7. Run `npm test`, `npm run check`, `npm run build`; test GPU/browser/audio on
   the target computer before claiming those visual or performance results.

More exact astronomy can replace the vector interpolation and frame providers
with a SPICE implementation, full Earth orientation, lunar binary PCK/FK and
relativistic apparent-position corrections. Preserve the same ICRF/UTC interface
and keep free clock editing in exploration mode. More exact terrain needs a
registered LROC/HiRISE/rover product or surveyed mesh; enlarging the current DEM
or repeating a reference photograph cannot create measured detail.
