// This adapter is optional: an exported offline HTML still uses localStorage.
const validKey = key => /^luna-[a-z0-9-]{1,100}$/.test(key);
async function request(fetcher, url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetcher(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error('Local backend returned ' + response.status);
    return response.json();
  } finally { clearTimeout(timer); }
}

export async function loadGameData(fetcher = globalThis.fetch) {
  let manifest = null;
  try {
    manifest = await request(fetcher, '/api/datasets');
    if (manifest.schema !== 1 || !Array.isArray(manifest.datasets)) manifest = null;
  } catch { /* Static hosting has no local API; use its bundled assets. */ }
  const pack = {};
  await Promise.all(Object.entries(PACK_FILES).map(async ([key, file]) => {
    const item = manifest?.datasets.find(row => row.file === file);
    if (manifest && (!item || !/^\/api\/data\/[a-f0-9]{64}\/[a-z-]+\.json$/.test(item.url))) throw new Error('Incomplete validated data manifest: ' + file);
    const response = await fetcher(item?.url || 'data/' + file, { cache: item ? 'default' : 'no-cache' });
    if (!response.ok) throw new Error('Could not load ' + file);
    pack[key] = await response.json();
  }));
  pack.localDatasetVersion = manifest?.version || null;
  return pack;
}

export async function connectLocalBackend(storage, { fetcher = globalThis.fetch, protocol = globalThis.location?.protocol, debounceMs = 350 } = {}) {
  const connection = { storage, connected: false, lastSavedAt: null, error: null, flush: async () => false };
  if (!storage || !/^https?:$/.test(protocol || '')) return connection;
  let remote;
  try {
    remote = await request(fetcher, '/api/progress');
    if (!remote?.values || typeof remote.values !== 'object') return connection;
    for (const [key, value] of Object.entries(remote.values)) {
      if (validKey(key) && typeof value === 'string' && storage.getItem(key) === null) storage.setItem(key, value);
    }
  } catch { return connection; }
  connection.connected = true;
  connection.lastSavedAt = remote.updatedAt || null;
  const dirty = new Map();
  let timer = null, active = null;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => connection.flush(), debounceMs); };
  connection.flush = async () => {
    clearTimeout(timer);
    if (active) { await active; if (dirty.size) return connection.flush(); return true; }
    if (!dirty.size) return true;
    const values = Object.fromEntries(dirty); dirty.clear();
    active = request(fetcher, '/api/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values }), keepalive: true })
      .then(result => { connection.lastSavedAt = result.updatedAt; connection.error = null; return true; })
      .catch(error => {
        for (const [key, value] of Object.entries(values)) if (!dirty.has(key)) dirty.set(key, value);
        connection.error = error.message;
        return false;
      });
    const success = await active; active = null;
    if (success && dirty.size) schedule();
    return success;
  };
  connection.storage = {
    getItem: key => storage.getItem(key),
    setItem: (key, value) => {
      storage.setItem(key, value);
      if (validKey(key)) { dirty.set(key, String(value)); schedule(); }
    },
    removeItem: key => {
      storage.removeItem(key);
      if (validKey(key)) { dirty.set(key, null); schedule(); }
    }
  };
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && validKey(key) && storage.getItem(key) !== remote.values[key]) dirty.set(key, storage.getItem(key));
  }
  if (dirty.size) schedule();
  globalThis.addEventListener?.('pagehide', () => connection.flush());
  return connection;
}
const PACK_FILES = { terrain: 'terrain.json', config: 'mission.json', ephemerides: 'ephemerides.json', academy: 'academy.json', marsTerrain: 'terrain-mars.json', solar: 'solar-system.json', tranquillitatis: 'terrain-tranquillitatis.json', astronomy: 'astronomy.json', stars: 'stars.json', scenarios: 'scenarios.json' };
