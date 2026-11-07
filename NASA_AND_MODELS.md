# NASA data and teaching models

The sources shipped with Local Workspace are retained. Open **Data & science** in the game and consult `CREDITS.md`, `SCIENTIFIC-ACCURACY.md`, `DATA-INTEGRATION.md` and the source metadata in `dist/data/` for original URLs, processing details, grids and epochs.

| Content | Classification | Use |
| --- | --- | --- |
| Lunar LOLA elevation | Cached NASA/LRO data, resampled | Terrain heights and traversability; current lunar expedition is Mare Tranquillitatis |
| Mars MOLA elevation | Cached NASA/MGS data, resampled | Jezero region terrain; not rover-resolution topography |
| NASA imagery/reference assets | Cached, attributed imagery | Reference, surface textures and astronomical appearance where specified |
| JPL Horizons vectors and observer frames | Cached dated ephemerides | Shared surface sky, navigation/astronomy and Earth signal distance |
| Star catalogue | Cached catalogue | Existing stellar field; see catalogue metadata |
| Fine rocks, craters, structures, astronauts, plants | Authored geometry / reconstruction | Gameplay readability and visual detail, not measured individual objects |
| Consumption, hazards, health and shielding | Editable educational rules | Show coupled trade-offs; not mission-certified rates or dosimetry |
| Food growth | Accelerated educational model | Delay between electricity/water spending and later food harvest |
| Landing | Educational control exercise | 1–3 m/s and ±5° bands, time compression and go-around behavior; not flight qualification |

The shared astronomy cache covers 2026-10-03 through 2027-05-05. Simulated mission dates and time acceleration are shown in the UI. The app does not label these positions live. The narrative before destination selection describes both possible destinations; destination briefing and touchdown identify the actual selected site.

## Editable resource assumptions

Edit `dist/data/scenarios.json`, then rebuild. `crew` is four. Its `rates` object includes crew consumption, minimum life power, EVA reserve targets, resupply horizon, radiation/health teaching coefficients, `cropCycleHours`, `cropHarvestPortions` and `earthMessageEnergyKwh`. Stage options specify elapsed minutes and immediate effects. Suit-specific rates remain in the destination configuration.

`simulateOutpost` advances habitat quantities in at most one-minute steps. Growth accumulates only while the outpost has electrical supply and water, at `max(0, foodKw - 1)` progress-hours per mission hour. At six progress-hours, the default harvest adds two portions. Food consumption continues throughout. This is a deliberate compressed teaching rule, not a claim that crops mature in two hours.

Forecasts copy mission state and apply the same action/time calculation as confirmation. They hold the current sunlight and hazard rates while simulating the action. A new stage can introduce a separately scripted hazard after commitment. Forecasts are not weather predictions. Suit and habitat inventories remain distinct.

The powered shield is labelled **experimental**. Its dose reductions are fictional teaching coefficients; it is not established deployed astronaut protection. Passive shielding also uses simplified factors. Do not interpret a game health number or dose as a medical risk estimate.

## Optional real DONKI archive

No DONKI records are bundled by default. The in-game source card says so. To import a historical interval, with Python 3 and an optional NASA key:

```powershell
$env:NASA_API_KEY = "YOUR_KEY"
py -3 tools/fetch_donki.py --start 2024-05-10 --end 2024-05-12
npm.cmd run build
```

Without a key the utility uses NASA's DEMO_KEY. Network availability and service limits apply. The importer saves original response records and a dated curated archive, retaining old files on failure. The game displays the record count, retrieval date and example events only when records exist. The archive is context, not a live radiation alert. Flare class is never converted into astronaut dose. OSDR research has not been integrated; no such claim is made.

## Audio provenance

Background music is generated live in the browser by the original procedural composition in `dist/audio.js`, routed through `dist/mission-audio.js` with separate music and effects channels. No music or voice files are bundled. `tools/compose_ambience.py` remains as an optional, editable offline composer (MP3 export needs FFmpeg); the game does not use its output.

The game has no spoken narration: the recorded ASTRA clips, the device-voice fallback and their preparation tools were removed in 1.3.1. All guidance is on-screen text.
