"""Source checks and staged NASA refreshes. Python 3 standard library only.

Online refresh uses the existing acquisition adapter and fixed mission coverage.
New challenge formats need an adapter; this script does not invent missing data.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_HOSTS = {'pds-geosciences.wustl.edu', 'pds-atmospheres.nmsu.edu'}


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def safe_url(url):
    parts = urllib.parse.urlparse(url)
    host = (parts.hostname or '').lower()
    if parts.scheme != 'https' or not (host.endswith('.nasa.gov') or host == 'nasa.gov' or host in ALLOWED_HOSTS):
        raise ValueError('Use a primary NASA or documented PDS HTTPS source')
    return url


def write_json(file, value):
    file.parent.mkdir(parents=True, exist_ok=True)
    temporary = file.with_name(file.name + '.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, file)


def check_sources(data_dir, sources):
    report_file = data_dir / 'source-checks.json'
    try:
        previous = json.loads(report_file.read_text(encoding='utf-8'))
    except FileNotFoundError:
        previous = {'sources': []}
    old = {row['id']: row for row in previous.get('sources', [])}
    report = {'checkedAt': utc_now(), 'note': 'Checks refer to upstream publication headers, not the observation date or live weather.', 'sources': []}
    for source in sources:
        item = {**source, 'lastCheckedAt': utc_now()}
        try:
            request = urllib.request.Request(safe_url(source['url']), method='HEAD', headers={'User-Agent': 'LUNA-Educational-Data-Check/1.0'})
            with urllib.request.urlopen(request, timeout=20) as response:
                item.update(status='ok', etag=response.headers.get('ETag'), lastModified=response.headers.get('Last-Modified'), lastSuccessfulCheckAt=utc_now())
            prior = old.get(source['id'], {})
            item['changed'] = bool(prior.get('lastSuccessfulCheckAt') and any(item.get(k) != prior.get(k) for k in ['etag', 'lastModified']))
            if not item['etag'] and not item['lastModified']:
                item['note'] = 'Source does not expose a version header; unchanged content cannot be established by this check.'
        except Exception as error:
            item.update(status='failed', error=str(error), lastSuccessfulCheckAt=old.get(source['id'], {}).get('lastSuccessfulCheckAt'))
        print(source['id'] + ': ' + item['status'], flush=True)
        report['sources'].append(item)
    write_json(report_file, report)
    return report


def bounded_download(url, headers=None, maximum=10 * 1024 * 1024):
    request = urllib.request.Request(safe_url(url), headers=headers or {})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read(maximum + 1)
        if len(data) > maximum:
            raise ValueError('Source exceeds this adapter\'s expected size')
        return response.status, data


def decode_mola(label, raster, old):
    match = re.search(r'^\s*LINE_SAMPLES\s*=\s*(\d+)', label, re.M)
    if not match or 'MSB_INTEGER' not in label:
        raise ValueError('MOLA product schema changed; revise the adapter')
    width = int(match.group(1))
    height, count = old['height'], old['width']
    column = old['source']['range']['columnStartZeroBased']
    expected = height * width * 2
    if len(raster) != expected or column + count > width:
        raise ValueError('MOLA range has unexpected dimensions')
    values = []
    for row in range(height):
        values.extend(struct.unpack_from('>' + str(count) + 'h', raster, (row * width + column) * 2))
    if -32768 in values:
        raise ValueError('MOLA contains missing elevations')
    return values


def refresh_mars(stage):
    file = stage / 'dist/data/terrain-mars.json'
    old = json.loads(file.read_text(encoding='utf-8'))
    _, label = bounded_download(old['source']['labelUrl'], maximum=200000)
    region = old['source']['range']
    first, last = region['firstByte'], region['lastByte']
    status, raster = bounded_download(old['source']['url'], {'Range': 'bytes=' + str(first) + '-' + str(last)})
    if status != 206 or len(raster) != last - first + 1:
        raise ValueError('MOLA server did not return the required exact byte range')
    old['heights'] = decode_mola(label.decode('ascii'), raster, old)
    old['source']['rasterRangeSha256'] = hashlib.sha256(raster).hexdigest()
    old['source']['retrievedAt'] = utc_now()
    file.write_text(json.dumps(old, separators=(',', ':')) + '\n', encoding='utf-8')
    (stage / 'dist/data/mars-terrain-source.lbl').write_bytes(label)


def refresh_data(node, data_dir):
    # Partial downloads never overwrite the playable pack.
    data_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='luna-stage-', dir=data_dir) as directory:
        stage = Path(directory)
        shutil.copytree(ROOT / 'dist/data', stage / 'dist/data')
        (stage / 'tools').mkdir(parents=True)
        (stage / 'dist/assets').mkdir(parents=True)
        shutil.copy2(ROOT / 'tools/acquire-astronomy.py', stage / 'tools/acquire-astronomy.py')
        reference = ROOT / 'dist/assets/jezero-reference.jpg'
        if reference.exists():
            shutil.copy2(reference, stage / 'dist/assets/jezero-reference.jpg')
        cache = stage / 'dist/data/astronomy-source'
        for file in cache.glob('*.txt'):
            if file.name.startswith(('icrf-', 'padding-', 'frame-', 'check-')):
                file.unlink()
        for file in [cache / 'pck00011.tpc', stage / 'dist/data/stars.json', stage / 'dist/data/terrain-tranquillitatis.json']:
            file.unlink(missing_ok=True)
        subprocess.run([os.sys.executable, str(stage / 'tools/acquire-astronomy.py')], check=True, cwd=stage)
        refresh_mars(stage)
        # Node validates ALL ten assets and publishes an immutable pack atomically.
        subprocess.run([node, str(ROOT / 'tools/register-data.mjs'), '--from', str(stage / 'dist/data')], check=True, cwd=ROOT)
        for file in (stage / 'dist/data').iterdir():
            if file.is_file():
                temporary = ROOT / 'dist/data' / (file.name + '.tmp')
                shutil.copy2(file, temporary)
                os.replace(temporary, ROOT / 'dist/data' / file.name)
        shutil.copytree(cache, ROOT / 'dist/data/astronomy-source', dirs_exist_ok=True)
        print('Published validated NASA pack. Restart the mission to use it; npm run build updates the standalone offline export.', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Check upstream release headers; retain the current playable data')
    parser.add_argument('--refresh', action='store_true', help='Download and stage the supported NASA sources; can take a long time')
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    data_dir = Path(os.environ.get('LUNA_DATA_DIR', ROOT / 'backend/data'))
    if not data_dir.is_absolute():
        data_dir = ROOT / data_dir
    if args.refresh:
        refresh_data(args.node, data_dir)
    else:
        sources = json.loads((ROOT / 'backend/sources.json').read_text(encoding='utf-8'))['sources']
        report = check_sources(data_dir, sources)
        if any(row['status'] == 'failed' for row in report['sources']):
            raise SystemExit(1)


if __name__ == '__main__':
    main()
