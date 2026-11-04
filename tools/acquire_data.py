"""Acquire a reproducible, small NASA/JPL data pack. Python 3, standard library only.

NASA's IMG is a little-endian signed int16 raster. Decode it with the PDS label's
0.5 m scale, crop it, and average each 2x2 block. Never synthesize missing data.
The original DEM is already interpolated by the LOLA science team.
"""
import concurrent.futures
import datetime
import hashlib
import json
import re
import struct
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "data"
OUT.mkdir(parents=True, exist_ok=True)
BASE = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/"
PRODUCT = "ldem_875s_20m"


def fetch(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=55) as response:
                return response.status, response.read(), dict(response.headers)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise


def terrain():
    if (OUT / "terrain.json").exists():
        print("Reusing the acquired LOLA crop", flush=True)
        return json.loads((OUT / "terrain.json").read_text())
    _, label_bytes, _ = fetch(BASE + PRODUCT + ".lbl")
    label = label_bytes.decode("ascii")
    def number(key):
        return float(re.search(r"^\s*" + re.escape(key) + r"\s*=\s*([-\d.]+)", label, re.M).group(1))
    size = int(number("LINE_SAMPLES"))
    bits = int(number("SAMPLE_BITS"))
    scale = number("SCALING_FACTOR")
    mpp = number("MAP_SCALE")
    offset = number("OFFSET")
    line_offset = number("LINE_PROJECTION_OFFSET")
    sample_offset = number("SAMPLE_PROJECTION_OFFSET")
    if bits != 16 or 'SAMPLE_TYPE           = LSB_INTEGER' not in label:
        raise ValueError("Unsupported raster encoding")
    # Authored crop selection; the measurements within this crop are real.
    row_start, column_start, count, stride = 2594, 4494, 160, 2
    first = row_start * size * 2
    last = (row_start + count) * size * 2 - 1
    status, raw, headers = fetch(BASE + PRODUCT + ".img", {"Range": f"bytes={first}-{last}"})
    if status != 206 or len(raw) != last - first + 1:
        raise ValueError("The server did not return the exact requested raster range")
    rows = []
    for i in range(count):
        start = (i * size + column_start) * 2
        rows.append(struct.unpack_from("<" + "h" * count, raw, start))
    heights = []
    for i in range(0, count, stride):
        for j in range(0, count, stride):
            values = [rows[i + a][j + b] for a in range(stride) for b in range(stride)]
            if any(v == -32768 for v in values):
                raise ValueError("Missing raster samples in selected crop; choose another crop")
            heights.append(round(sum(values) / len(values) * scale, 3))
    payload = {
        "schema": 1, "width": count // stride, "height": count // stride,
        "cellMetres": mpp * stride, "heights": heights,
        "projection": {
            "type": "south-polar-stereographic", "radiusMetres": offset,
            "x0": (column_start + 0.5 - sample_offset) * mpp,
            "y0": (line_offset - row_start - 0.5) * mpp,
            "longitudeDirection": "east", "latitudeType": "planetocentric",
            "frame": "Mean Earth / polar axis of DE421"
        },
        "source": {
            "name": "NASA LRO / LOLA — South polar elevation map",
            "datasetId": "LRO-L-LOLA-4-GDR-V1.0", "product": PRODUCT.upper(),
            "productVersion": "V2.0", "productCreated": "2017-06-15",
            "observationStart": "2009-07-13T17:33:17", "observationStop": "2017-02-02T22:18:35",
            "url": BASE + PRODUCT + ".img", "labelUrl": BASE + PRODUCT + ".lbl",
            "doi": "10.17189/1520642", "nativeResolutionMetres": mpp,
            "processing": "160 x 160 source-pixel crop; 2 x 2 arithmetic averaging to an 80 x 80 grid. Elevation = signed little-endian int16 DN x 0.5 m, relative to a 1737400 m sphere. No synthetic elevations added.",
            "range": {"firstByte": first, "lastByte": last, "rowStartZeroBased": row_start, "columnStartZeroBased": column_start},
            "rasterRangeSha256": hashlib.sha256(raw).hexdigest(),
            "labelSha256": hashlib.sha256(label_bytes).hexdigest(),
            "retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    }
    (OUT / "terrain.json").write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    (OUT / "terrain-source.lbl").write_bytes(label_bytes)
    print("LOLA:", len(heights), "measured elevation cells;", min(heights), "to", max(heights), "m", flush=True)
    return payload


def ephemeris(target):
    name, command = target
    params = {
        "format": "json", "COMMAND": "'" + command + "'", "CENTER": "'500@301'",
        "MAKE_EPHEM": "'YES'", "EPHEM_TYPE": "'VECTORS'", "VEC_TABLE": "'2'",
        "START_TIME": "'2026-10-04 00:00'", "STOP_TIME": "'2026-10-05 00:00'",
        "STEP_SIZE": "'1 min'" if name == "LRO" else "'1 h'", "OUT_UNITS": "'KM-S'", "REF_PLANE": "'FRAME'",
        "REF_SYSTEM": "'ICRF'", "VEC_CORR": "'NONE'", "CSV_FORMAT": "'YES'"
    }
    url = "https://ssd.jpl.nasa.gov/api/horizons.api?" + urllib.parse.urlencode(params)
    cache = OUT / (name.lower() + "-horizons.txt")
    if cache.exists() and name != "LRO":
        result = cache.read_text()
        response = {"result": result}
    else:
        _, raw, _ = fetch(url)
        response = json.loads(raw)
        result = response.get("result", "")
    if "$$SOE" not in result:
        if name == "LRO":
            return {"name": name, "available": False, "reason": "No matching JPL spacecraft ephemeris coverage for the selected mission date.", "url": url}
        raise ValueError(name + ": " + response.get("error", "No ephemeris returned"))
    samples = []
    for line in result.split("$$SOE")[1].split("$$EOE")[0].strip().splitlines():
        fields = [x.strip() for x in line.split(",")]
        samples.append({"jdTdb": float(fields[0]), "x": float(fields[2]), "y": float(fields[3]), "z": float(fields[4]), "vx": float(fields[5]), "vy": float(fields[6]), "vz": float(fields[7])})
    (OUT / (name.lower() + "-horizons.txt")).write_text(result)
    print("JPL:", name, len(samples), "position samples", flush=True)
    return {"name": name, "command": command, "available": True, "samples": samples, "url": url,
            "frame": "Moon-centered ICRF", "units": "km and km/s", "timeScale": "TDB", "samplingSeconds": 60 if name == "LRO" else 3600,
            "correction": "geometric / no light-time correction"}


def astronomy():
    targets = [("Sun", "10"), ("Earth", "399"), ("Mars", "499"), ("LRO", "-85")]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        bodies = list(pool.map(ephemeris, targets))
    payload = {"schema": 1, "source": "NASA/JPL Horizons", "start": "2026-10-04T00:00:00 TDB",
               "stop": "2026-10-05T00:00:00 TDB", "samplingSeconds": 3600,
               "frame": "Moon-centered ICRF", "retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
               "interpolation": "Linear interpolation between geometric vector samples; hourly for Sun/planets and every minute for LRO. Educational use, not navigation.", "bodies": bodies}
    (OUT / "ephemerides.json").write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    return payload


if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(lambda task: task(), [terrain, astronomy]))
    print("Traceable data pack saved to", OUT, flush=True)
