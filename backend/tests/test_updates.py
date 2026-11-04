import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('luna_updates', Path(__file__).resolve().parents[2] / 'tools/update-data.py')
updates = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updates)


class UpdateTests(unittest.TestCase):
    def test_mola_crop_keeps_original_big_endian_elevations(self):
        raster = struct.pack('>8h', 10, 11, 12, 13, 20, 21, 22, 23)
        old = {'width': 2, 'height': 2, 'source': {'range': {'columnStartZeroBased': 1}}}
        self.assertEqual(updates.decode_mola('LINE_SAMPLES = 4\nSAMPLE_TYPE = MSB_INTEGER', raster, old), [11, 12, 21, 22])
        with self.assertRaises(ValueError):
            updates.decode_mola('LINE_SAMPLES = 4\nSAMPLE_TYPE = MSB_INTEGER', raster[:-1], old)

    def test_failed_source_check_retains_last_success_and_does_not_publish(self):
        with tempfile.TemporaryDirectory() as directory:
            data = Path(directory)
            updates.write_json(data / 'source-checks.json', {'sources': [{'id': 'lola', 'lastSuccessfulCheckAt': '2026-10-01T00:00:00Z'}]})
            with patch.object(updates.urllib.request, 'urlopen', side_effect=OSError('offline')):
                report = updates.check_sources(data, [{'id': 'lola', 'url': 'https://pds-geosciences.wustl.edu/test.lbl'}])
            self.assertEqual(report['sources'][0]['status'], 'failed')
            self.assertEqual(report['sources'][0]['lastSuccessfulCheckAt'], '2026-10-01T00:00:00Z')
            self.assertFalse((data / 'current-manifest.json').exists())

    def test_source_allowlist_rejects_local_and_unrelated_urls(self):
        self.assertEqual(updates.safe_url('https://naif.jpl.nasa.gov/kernel'), 'https://naif.jpl.nasa.gov/kernel')
        for url in ['http://127.0.0.1/data', 'file:///etc/passwd', 'https://nasa.gov.evil.example/data']:
            with self.assertRaises(ValueError):
                updates.safe_url(url)


if __name__ == '__main__':
    unittest.main()
