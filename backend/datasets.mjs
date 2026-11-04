import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { atomicWrite } from './store.mjs';

export const DATA_FILES = ['terrain.json', 'mission.json', 'ephemerides.json', 'academy.json', 'terrain-mars.json', 'solar-system.json', 'terrain-tranquillitatis.json', 'astronomy.json', 'stars.json', 'scenarios.json'];
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const finite = x => typeof x === 'number' && Number.isFinite(x);
const requireValue = (valid, message) => { if (!valid) throw new Error(message); };

export function validateDataset(name, value) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), name + ': expected an object');
  if (name.startsWith('terrain')) {
    requireValue(Number.isInteger(value.width) && Number.isInteger(value.height) && value.width > 1 && value.height > 1, name + ': invalid dimensions');
    requireValue(finite(value.cellMetres) && value.cellMetres > 0, name + ': invalid metre spacing');
    requireValue(Array.isArray(value.heights) && value.heights.length === value.width * value.height && value.heights.every(finite), name + ': invalid elevation cells');
    requireValue(value.source && value.projection, name + ': missing source or projection');
  } else if (name === 'astronomy.json') {
    requireValue(value.schema === 2 && value.bodies?.Sun && value.bodies?.Moon && value.bodies?.Mars && value.frames?.moon && value.frames?.mars, name + ': incomplete astronomical world');
    requireValue(Number.isFinite(Date.parse(value.start)) && Date.parse(value.stop) > Date.parse(value.start), name + ': invalid coverage');
    for (const [body, item] of Object.entries(value.bodies)) {
      requireValue(Array.isArray(item.samples) && item.samples.length >= 2, body + ': missing ephemerides');
      requireValue(item.samples.every((row, i, rows) => Array.isArray(row) && row.length === 7 && row.every(finite) && (i === 0 || row[0] > rows[i - 1][0])), body + ': invalid or unordered vectors');
    }
  } else if (name === 'stars.json') {
    requireValue(value.source && Array.isArray(value.stars) && value.stars.length > 100, name + ': missing catalogue');
    requireValue(value.stars.every(row => Array.isArray(row) && row.length >= 5 && row.slice(1).every(finite)), name + ': invalid star entries');
  } else if (name === 'scenarios.json') {
    requireValue(value.moon && value.mars && value.rates && value.classification, name + ': incomplete mission rules');
  } else if (name === 'mission.json') {
    requireValue(value.physics && value.suit && value.rover, name + ': incomplete equipment configuration');
  } else if (name === 'academy.json') {
    requireValue(Array.isArray(value.levels) && value.levels.length >= 2, name + ': missing training levels');
  } else if (name === 'solar-system.json') {
    requireValue(value.vectors && value.assets, name + ': missing solar overview data');
  } else if (name === 'ephemerides.json') {
    requireValue(Array.isArray(value.bodies) && value.bodies.length > 0, name + ': missing observer bodies');
  }
  return value;
}

export async function registerDatasets(dataDirectory, store) {
  // Validate the entire pack before publishing any current-version pointer.
  const prepared = [];
  for (const file of DATA_FILES) {
    const bytes = await fs.readFile(path.join(dataDirectory, file));
    const value = validateDataset(file, JSON.parse(bytes.toString('utf8')));
    const sha256 = hash(bytes);
    prepared.push({ bytes, metadata: {
      id: file.replace('.json', ''), file, sha256, bytes: bytes.length,
      url: '/api/data/' + sha256 + '/' + file,
      source: value.source || null,
      classification: value.classification || (file.startsWith('terrain') || file === 'stars.json' ? 'Measured source data; see embedded source and processing metadata.' : 'Authored educational configuration or derived display data; see project accuracy notes.'),
      coverage: value.start && value.stop ? { start: value.start, stop: value.stop } : null,
      nativeResolutionMetres: value.source?.nativeResolutionMetres || (file === 'terrain-mars.json' ? value.cellMetres : null)
    } });
  }
  const version = hash(JSON.stringify(prepared.map(x => [x.metadata.file, x.metadata.sha256]))).slice(0, 24);
  const manifestFile = path.join(store.directory, 'manifests', version + '.json');
  let manifest;
  try { manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    for (const item of prepared) {
      const file = path.join(store.directory, 'objects', item.metadata.sha256 + '.json');
      try { await fs.access(file); }
      catch { await atomicWrite(file, item.bytes); }
    }
    manifest = { schema: 1, version, publishedAt: new Date().toISOString(), datasets: prepared.map(x => x.metadata) };
    await atomicWrite(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  }
  // Separate pointer and progress files prevent a Python/CLI registration from
  // overwriting a checkpoint saved by the running server at the same time.
  const pointer = path.join(store.directory, 'current-manifest.json');
  let current = null;
  try { current = JSON.parse(await fs.readFile(pointer, 'utf8')).version; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (current !== version) await atomicWrite(pointer, JSON.stringify({ version }) + '\n');
  return manifest;
}

export async function currentManifest(store) {
  const pointer = JSON.parse(await fs.readFile(path.join(store.directory, 'current-manifest.json'), 'utf8'));
  if (!/^[a-f0-9]{24}$/.test(pointer.version)) throw new Error('Invalid dataset version pointer');
  return JSON.parse(await fs.readFile(path.join(store.directory, 'manifests', pointer.version + '.json'), 'utf8'));
}
