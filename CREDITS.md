# Data and asset credits

| Dataset / asset | Source, frame / resolution and purpose |
| --- | --- |
| Lunar local elevation | NASA LRO / LOLA `LDEM_1024_00N_15N_000_030`, `LRO-L-LOLA-4-GDR-V1.0`; 1024 pixels/degree, 29.61 m local grid. PDS label, original cell range/hash and projection are in `terrain-tranquillitatis.json` / `tranquillitatis-source.lbl`. |
| Mars elevation | NASA MGS / MOLA `MEGT44N000HB`, version 2, `MGS-M-MOLA-5-MEGDR-L3-V1.0`; native 1/128° topography, signed big-endian metres above GMM3 areoid. `terrain-mars.json` retains the native crop and range hash. |
| Solar-system vectors / local frames | NASA/JPL Horizons; Sun-centred ICRF km/km/s, TDB vectors converted approximately to UTC. Full requests/responses, sampling cadence and validation requests are under `data/astronomy-source/`. |
| Rotation coefficients | NASA NAIF `pck00011.tpc`, Nat Bachman, 2022-12-27; mean IAU RA/DEC/W polynomials used without periodic terms. Original kernel retained. |
| Catalogue stars | Yale Bright Star Catalog, fifth revised edition, hosted by NASA HEASARC BSC5P. J2000 equatorial coordinates, V magnitude, B−V and proper motions. Original TDAT and processed schema/columns/hash retained. |
| Earth map | NASA Blue Marble / MODIS; Robert Simmon and Reto Stöckli. Cached 2048×1024 static global composite; Earth globe. |
| Moon map | NASA Scientific Visualization Studio / LROC CGI Moon Kit; Ernie Wright. Cached 2048×1024 global equirectangular colour map; Moon globe and source reference. |
| Jezero rock reference | NASA/JPL-Caltech, PIA25325, Enchanted Lake; Perseverance image acquired 2022-04-30, published 5120×2880 JPEG. Visual reference for rock shapes/colours, not a mapped game texture. |
| Original legacy terrain and ephemerides | Retained `terrain.json`, `ephemerides.json`, source labels and `data/horizons/`; original south-polar/flight-school data remain for compatibility and reproducibility, while new scientific views use the shared world. |
| Supplied Moon / Mars references | The latest eight Moon images (astronaut eye-level powder and clasts, low ridges, cratered terrain, modular habitats and fault-scarp concepts), earlier lunar references and six Mars images (rover, laminated rock, desert/canyon and orbital concepts). Used as visual direction for authored geometry, colours and module designs; the reference images are not redistributed as game textures or represented as surveys. Stock imagery with a river, plants or a giant Earth is interpreted only as artistic composition. |
| Lunar regolith material tile | `assets/lunar-regolith.png`; new artistic material generated with the built-in image-generation tool, not NASA imagery. Embedded unchanged in the client and offline export. Optical colour is reused as a small micro-height approximation, not measured particle topography. Prompt and use are documented in `MOON-SURFACE.md`. |
| Authored assets | Astronaut, spaceship, rover, lander, habitat, equipment, circuits, crater/dune/scarp/channel/terrace/mesa profiles, layered outcrops, power cables, rover tracks, lunar boot tread masks, deterministic gravel fields, world-space soil variation, material grain, Earth cloud mask, most planetary textures, galactic brightness band, sound/music, opening choreography, labels and scenario content are project reconstructions. System fonts; no external font service. |

Primary links:

- [LRO LOLA PDS archive](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/)
- [MOLA product label](https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/megt44n000hb.lbl)
- [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) and [API](https://ssd-api.jpl.nasa.gov/doc/horizons.html)
- [NAIF orientation kernel](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc)
- [HEASARC BSC5P fields and provenance](https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html)
- [NASA Earth map](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.jpg)
- [NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/)
- [NASA Moon facts: surface and exosphere](https://science.nasa.gov/moon/facts/)
- [NASA/JPL Enchanted Lake context](https://www.jpl.nasa.gov/images/pia25325-enchanted-view-of-jezero-rocks/)

Three.js 0.180.0 and esbuild 0.25.10 are MIT licensed. Source ZIP dependency
licences and third-party notices are included. NASA/JPL credits identify the
source of data and imagery; fictional crew/outposts and mission events are game
content. No NASA endorsement is claimed.

Final approach reuses the authored reference landscape and outpost meshes. The curved 30 km background continues cropped elevations beyond cached coverage; it is an illustrative horizon. Landing exhaust, ballistic grains and added spacecraft panel details are original game assets.


## Merged edition additions

The visible greenhouse was adapted from the supplied Outpost Academy project. Background music uses the original procedural composition in `dist/audio.js`. The game ships no voice recordings or speech synthesis. See `NASA_AND_MODELS.md` for audio and scientific limitations.
