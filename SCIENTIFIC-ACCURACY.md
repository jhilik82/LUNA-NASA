# Scientific accuracy · LUNA + ASTRA 1.2.1-local

**Measured/cached foundations:** NASA LOLA and MOLA elevations, NASA Earth/Moon
map imagery, NASA/JPL Horizons position/velocity and observer tables, NASA NAIF
mean IAU rotation coefficients, and the Yale Bright Star Catalog via HEASARC.
**Reconstructions/models:** reference-inspired terrain relief, near-field material grain, rocks, cloud pattern,
vehicles/outposts, weather, hazards, consumption, health, dose and flight dynamics.
This is a playable scientific visualization prototype, not a surveyed site or
operational mission simulator.

| Item | Implementation and limit |
| --- | --- |
| Moon site | Mare Tranquillitatis, about 0.67408°N, 23.47297°E. Original 80×80 LOLA cells at 29.61 m; radius elevations relative to a 1,737,400 m reference sphere, Mean Earth/polar axis of DE421. No vertical exaggeration. |
| Mars site | Jezero, about 18.44°N, 77.45°E. MOLA native 1/128° (~463 m), GMM3 areoid elevations. A 3.2 km crop is bilinearly sampled at 40 m for play; this adds no measured detail. Planetocentric east-positive terrain coordinates are converted toward the geodetic observer normal. Areoid height is treated as local ellipsoid height for sky geometry. |
| Terrain detail | The latest eight lunar references and earlier six Martian references guide authored crater/rim/scarp versus dune/channel/terrace/mesa profiles and boulder/laminated-outcrop meshes. These profiles are separate from the original NASA height arrays. `measuredHeightAt` returns the DEM; `heightAt` adds reconstructed relief for rendering, walking, rover placement, picking, slope checks and local horizon sampling. Lunar patches use a globally aligned pitch of about 0.99 m, including distant impact bowls; Mars patches retain about 1.25 m pitch. These subdivisions are artistic detail, not new measured resolution. Actor placement uses barycentric heights on the rendered triangles to avoid boot/terrain gaps. Large rocks have solid colliders; equipment pads and main approaches are protected. The outer Mars horizon samples regional MOLA inside its cached bounds and continues edge elevations illustratively beyond them; outer lunar ground continues the crop edges illustratively. Both have a curved 30 km apron for final approach. This apron is not entirely measured terrain. The stock river/vegetation scene and oversized Earth image supply composition cues only: no flowing water, plants or enlarged Earth is introduced. |
| Astronomy | One Sun-centred ICRF model, km and UTC seconds. Cubic Hermite interpolation; planets mostly 6 h, major moons 3 h, Phobos 20 min, Deimos 1 h. UTC/TDB conversion uses a 69.184 s approximation. Usable coverage: 2026-10-03 00:00 UTC to 2027-05-05 23:00 UTC, with earlier vector padding for light time. |
| Apparent sky | Three light-time iterations and first-order observer-velocity aberration. Hourly apparent Sun/Earth directions anchor observer ENU frames. Terrain horizon includes the cached DEM, eye height and curvature. Full-body occultations are calculated; fine eclipse/contact geometry and gravitational light deflection are not. |
| Rotation and appearance | Mean NAIF RA/DEC/W polynomials where available; periodic libration/nutation omitted. Moon/Mars surface axes follow observer frames. Earth/Moon imagery is static; Earth cloud mask is reconstructed. Most other maps and small-body shapes are approximate. Fabric, metal detail and optical reflection patterns are authored. No claim of date-matched weather or high-accuracy Earth orientation. |
| Disk scale and telescope | Angular diameter uses radius and distance; scientific disks have no minimum enlargement. Unresolved bodies use optical points. Earth is roughly 1.9° from the lunar near side and remains unresolved without optics from Mars. Telescope FOV is 1–160× with simplified 80 mm / 1.7″ blur, not a full diffraction/noise simulation. |
| Stars/exposure | 8,404 BSC5P stars through V=6.5; J2000/FK5 treated as ICRF at game precision, proper motion and approximate B−V colours. Daylight, dust, solar glare and exposure suppress stars. Eye adaptation is compressed to a few seconds. Planet photometry uses reference magnitudes/Lambert phases; small-body albedo and the Milky Way brightness are approximate. |
| Environment | Moon black sky, negligible atmospheric scattering, no wind or atmospheric haze; g=1.62 m/s². Neutral training fill and suit-lamp lighting are authored visibility aids, not a complete lunar reflectance/earthshine model. Mars g=3.73, thin-atmosphere pressure model, dust attenuation, restrained drift and localized blue sunset approximation. Weather is scenario-driven, not a forecast. Daylight training arrival windows are selected using the shared Sun geometry. Higher Martian atmospheric fill and a night suit lamp aid visibility; the lunar sky remains black. Weak Earthshine follows visible Earth geometry. |
| Flight | Earth g=9.80 m/s². The 3-day lunar / 210-day Martian duration is explicitly time-compressed. Initial departures differ by destination to put arrival in local daylight, and the route uses those actual dated endpoints. The curve joins dated departure and arrival endpoints; it is not a propagated transfer. Local practice uses a body-fixed circular illustration and gravity-derived period. Ascent/capture/landing profiles, exhaust, temperatures, fuel and bands are teaching models. Gravity instruments show a simplified field magnitude, not felt acceleration in free fall. |
| Landing visuals | Below 180 m, descent renders the same local terrain and sky as surface play. The lander body altitude follows the teaching telemetry; four leg heights sample the shared surface at their pads. Site selection avoids equipment/rocks and favours low local relief. Exhaust is an authored visual; small ballistic grains use destination gravity. External camera framing avoids the landing HUD; the cockpit is reused for pilot view. These geometry checks do not establish photographic realism or validate GPU rendering. |
| Outpost/EVA | All forecasts and decisions use the same game state. Rates, dose/health relationships and reserves are editable assumptions. The map uses conservative distance estimates; the return readout uses a route on the shared measured-plus-authored surface. Forecasts hold current daylight/weather/settings fixed. |

**Validation achieved:** independent observer targets, not used to derive local
frames, were compared at 49 hourly timestamps per site near departure and again
near the actual Moon/Mars arrival dates. Tested Moon→Mars elevation error was
below 0.000002°; Mars→Jupiter below 0.0011°. Maximum azimuth discrepancies were
below 0.00005° and 0.020° respectively; azimuth is ill-conditioned near zenith.
Range differences were below 14 km for these distant targets; relative disk-size
differences below 0.00002%. These bounds describe the tested targets/dates,
not every moon, body, observer location or viewing time.

Automated checks also cover metre-scale geometry, Earth size/far-side hiding,
phases, catalogue/exposure, gravity, cockpit contact, both full outpost missions,
controller transitions, independent saves and state-safe ASTRA. Native Three
scene checks validate geometry and camera projections. Lunar material variants compile and link on Mesa software OpenGL ES 3.2.
Browser layout, interactive GPU output, visual performance and audio playback
remain unverified in the build environment. Source imagery is supplied for comparison; there is no
pixel-matched or photogrammetric terrain validation claim.

Visual references for the reconstructed materials and landforms include the latest eight supplied Moon images and earlier six Mars images, plus NASA's [Apollo terrain account](https://history.nasa.gov/wp-content/uploads/static/history/alsj/WOTM/WOTM-Terrain.html), [Jezero landing-site description](https://science.nasa.gov/resource/jezero-crater-mars-2020-rover-landing-site/), and the supplied Jezero layered-rock reference photograph. These guide surface appearance; no crater positions, ripple shapes or clast placements are claimed to be measured.

The newer lunar references guide neutral grey powder, irregular impact rims, angular clasts, low broken ridges, tread impressions and sharp direct-light shadows. Concept art is treated as visual direction; polar-looking scarps and fictional habitats do not establish surveyed geography at the mare site. The measured height arrays are unchanged.
