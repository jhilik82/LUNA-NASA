import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createLunaServer, PROJECT_ROOT } from '../server.mjs';
import { registerDatasets, currentManifest, validateDataset, DATA_FILES } from '../datasets.mjs';
import { LocalStore } from '../store.mjs';
import { loadGameData, connectLocalBackend } from '../../dist/local-backend.js';
import { publishCloud } from '../publish-cloud.mjs';

const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve('http://127.0.0.1:' + server.address().port)));
const stop = server => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
const memoryStorage = () => {
  const data = new Map();
  return { get length() { return data.size; }, key: i => [...data.keys()][i], getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
};

test('local API loads the actual game pack and persists checkpoints across a restart', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'luna-backend-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  let instance = await createLunaServer({ dataDirectory: directory });
  let base = await listen(instance.server);
  t.after(() => stop(instance.server));
  const fetcher = (url, options) => fetch(base + '/' + url.replace(/^\//, ''), options);
  const pack = await loadGameData(fetcher);
  assert.equal(pack.astronomy.source, 'NASA/JPL Horizons');
  assert.equal(pack.academy.levels.length, 10);
  assert.ok(pack.marsTerrain.heights.length > 0);
  assert.match(pack.localDatasetVersion, /^[a-f0-9]{24}$/);
  const response = await fetcher('/api/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: { 'luna-expedition-moon-v1': '{"stage":3}' } }) });
  assert.equal(response.status, 200);
  await stop(instance.server);
  instance = await createLunaServer({ dataDirectory: directory }); base = await listen(instance.server);
  assert.equal((await (await fetcher('/api/progress')).json()).values['luna-expedition-moon-v1'], '{"stage":3}');
  assert.equal((await fetcher('/workspace')).status, 200);
  assert.equal((await fetcher('/workspace/dashboard.js')).status, 200);
});

test('API refuses foreign origins, non-JSON writes and non-LUNA save keys', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'luna-api-'));
  const { server } = await createLunaServer({ dataDirectory: directory }); const base = await listen(server);
  t.after(async () => { await stop(server); await fs.rm(directory, { recursive: true, force: true }); });
  assert.equal((await fetch(base + '/api/progress', { method: 'PUT', headers: { Origin: 'https://example.org', 'Content-Type': 'application/json' }, body: '{"values":{}}' })).status, 403);
  assert.equal((await fetch(base + '/api/progress', { method: 'PUT', body: '{}' })).status, 415);
  assert.equal((await fetch(base + '/api/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"values":{"unrelated":"x"}}' })).status, 400);
  assert.deepEqual((await (await fetch(base + '/api/progress')).json()).values, {});
  assert.equal((await fetch(base + '/backend/data/state.json')).status, 404);
});

<<<<<<< HEAD
=======
test('static serving refuses symlinks that escape the served project tree', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'luna-static-'));
  const secret = path.join(directory, 'private.txt');
  const link = path.join(PROJECT_ROOT, 'workspace', '.test-escape-' + randomUUID());
  await fs.writeFile(secret, 'must not be served');
  await fs.symlink(secret, link);
  t.after(async () => { await fs.rm(link, { force: true }); await fs.rm(directory, { recursive: true, force: true }); });
  const { server } = await createLunaServer({ dataDirectory: path.join(directory, 'store') });
  const base = await listen(server);
  t.after(() => stop(server));
  assert.equal((await fetch(base + '/workspace/' + path.basename(link))).status, 403);
  assert.equal((await fetch(base + '/workspace')).status, 200);
});

>>>>>>> origin/main
test('validation publishes an immutable version, retains old objects and rejects invalid packs', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'luna-packs-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const input = path.join(directory, 'input'); await fs.mkdir(input);
  for (const file of DATA_FILES) await fs.copyFile(path.join(PROJECT_ROOT, 'dist/data', file), path.join(input, file));
  const store = new LocalStore(path.join(directory, 'store'));
  const first = await registerDatasets(input, store);
  const original = first.datasets.find(item => item.file === 'scenarios.json');
  const scenarioFile = path.join(input, 'scenarios.json');
  const scenario = JSON.parse(await fs.readFile(scenarioFile, 'utf8'));
  scenario.classification += ' Test revision'; await fs.writeFile(scenarioFile, JSON.stringify(scenario));
  const second = await registerDatasets(input, store);
  assert.notEqual(first.version, second.version);
  assert.equal(await fs.readFile(path.join(store.directory, 'objects', original.sha256 + '.json'), 'utf8'), await fs.readFile(path.join(PROJECT_ROOT, 'dist/data/scenarios.json'), 'utf8'));
  await fs.writeFile(path.join(input, 'terrain-mars.json'), '{"width":2,"height":2,"cellMetres":1,"heights":[0,null,0,0]}');
  await assert.rejects(registerDatasets(input, store), /invalid elevation/);
  assert.equal((await currentManifest(store)).version, second.version);
  assert.throws(() => validateDataset('astronomy.json', { schema: 2 }), /incomplete/);
});

test('progress writes serialize and recover the previous complete disk backup', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'luna-store-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const store = new LocalStore(directory);
  await Promise.all(Array.from({ length: 12 }, (_, i) => store.update(state => { state.progress.values['luna-record-' + i] = String(i); })));
  assert.equal(Object.keys((await store.read()).progress.values).length, 12);
  await fs.writeFile(store.file, '{incomplete');
  assert.equal(Object.keys((await store.read()).progress.values).length, 11);
});

test('browser sync restores missing saves, keeps local values and flushes later checkpoints', async () => {
  const storage = memoryStorage(); storage.setItem('luna-labels-v1', 'false');
  const writes = [];
  const fetcher = async (_url, options) => {
    if (options.method === 'PUT') { writes.push(JSON.parse(options.body).values); return { ok: true, json: async () => ({ updatedAt: '2026-10-07T00:00:00Z' }) }; }
    return { ok: true, json: async () => ({ values: { 'luna-labels-v1': 'true', 'luna-game-mode-v1': '"expedition"' } }) };
  };
  const connection = await connectLocalBackend(storage, { protocol: 'http:', fetcher, debounceMs: 10000 });
  assert.equal(connection.storage.getItem('luna-labels-v1'), 'false');
  assert.equal(connection.storage.getItem('luna-game-mode-v1'), '"expedition"');
  connection.storage.setItem('luna-expedition-mars-v1', '{"stage":2}');
  assert.equal(await connection.flush(), true);
  assert.equal(writes[0]['luna-expedition-mars-v1'], '{"stage":2}');
  assert.equal(writes[0]['luna-labels-v1'], 'false');
  const offline = await connectLocalBackend(storage, { protocol: 'file:', fetcher: () => { throw new Error('must not fetch'); } });
  assert.equal(offline.storage, storage);
});

test('optional cloud publisher uploads immutable assets before publishing the pack manifest', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'luna-cloud-')); t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const store = new LocalStore(directory); const manifest = await registerDatasets(path.join(PROJECT_ROOT, 'dist/data'), store);
  const requests = [];
  const result = await publishCloud({ manifest, directory, url: 'https://example.supabase.co', key: 'test-only', fetcher: async (url, options) => { requests.push({ url, options }); return { ok: true }; } });
  assert.equal(requests.length, 31);
  assert.ok(requests.at(-1).url.includes('/rest/v1/dataset_packs'));
  assert.ok(result.datasets.every(row => row.url.startsWith('https://example.supabase.co/storage/v1/object/public/')));
  assert.ok(manifest.datasets.every(row => row.url.startsWith('/api/data/')));
});
