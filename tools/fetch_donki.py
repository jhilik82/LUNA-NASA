"""Download a real, dated NASA DONKI solar-flare archive without third-party packages.
No event is treated as a measured outpost dose or mapped to biological harm.
"""
import argparse
from datetime import date, datetime, timezone
import json
import os
from pathlib import Path
import sys
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--start', required=True, help='YYYY-MM-DD')
    parser.add_argument('--end', required=True, help='YYYY-MM-DD (at most 30 days after start)')
    args = parser.parse_args()
    try:
        start, end = date.fromisoformat(args.start), date.fromisoformat(args.end)
        if not 0 <= (end-start).days <= 30:
            raise ValueError('Choose a date interval of 0–30 days.')
        if end > datetime.now(timezone.utc).date():
            raise ValueError('An archive cannot end in the future.')
        api_key = os.environ.get('NASA_API_KEY', 'DEMO_KEY')
        query = urlencode({'startDate': args.start, 'endDate': args.end, 'api_key': api_key})
        url = 'https://api.nasa.gov/DONKI/FLR?' + query
        with urlopen(Request(url, headers={'User-Agent':'LUNA-Outpost-Academy/1.0'}), timeout=25) as response:
            records = json.load(response)
        if not isinstance(records, list):
            raise ValueError('NASA did not return an event list. Existing data was kept.')
        selected = []
        for record in records:
            if not isinstance(record, dict) or not record.get('flrID'):
                continue
            selected.append({k: record.get(k) for k in ('flrID', 'beginTime', 'peakTime', 'endTime', 'classType', 'sourceLocation', 'activeRegionNum', 'link')})
        out = {'loaded': bool(selected), 'live': False, 'publisher': 'NASA CCMC / DONKI',
               'endpoint': 'https://api.nasa.gov/DONKI/FLR', 'startDate': args.start, 'endDate': args.end,
               'retrievedAt': datetime.now(timezone.utc).isoformat(), 'events': selected,
               'message': 'An archived solar-flare record provides context only. Game hazards are designed training values, not observed radiation doses.'}
        target = ROOT / 'dist/data/donki_archive.json'
        temp = target.with_suffix('.tmp')
        temp.write_text(json.dumps(out, indent=2), encoding='utf-8')
        temp.replace(target)
        # Keep original response for a judge/researcher to verify every retained field.
        raw = ROOT / 'dist/data/donki_raw.json'
        raw.write_text(json.dumps(records, indent=2), encoding='utf-8')
        print(f'Saved {len(selected)} archived NASA records. Reload LUNA to see the source card.')
        if not selected:
            print('No flares were returned for this interval. The game will retain its practice labels.')
        return 0
    except (ValueError, OSError, URLError, HTTPError, TimeoutError) as exc:
        # Avoid reflecting the request URL: it could contain the user's API key.
        print(f'Import failed ({type(exc).__name__}). Existing game data was kept. Check the date interval, connection and NASA API key.', file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())
