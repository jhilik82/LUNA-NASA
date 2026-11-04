import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalStore } from './store.mjs';
import { registerDatasets } from './datasets.mjs';
import { PROJECT_ROOT, loadEnvironment } from './server.mjs';

export async function publishCloud({ manifest, directory, url, key, bucket = 'luna-datasets', fetcher = fetch }) {
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your local .env, then run backend/supabase/schema.sql in your project.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) throw new Error('Supabase must use HTTPS, or a local development URL.');
  if (!/^[a-z0-9-]+$/.test(bucket)) throw new Error('Invalid storage bucket name');
  const base = url.replace(/\/$/, '');
  const send = async (route, value, type = 'application/json') => {
    const response = await fetcher(base + route, { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': type, Prefer: 'resolution=merge-duplicates', 'x-upsert': 'true' }, body: type === 'application/json' && !Buffer.isBuffer(value) ? JSON.stringify(value) : value, signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error('Supabase returned HTTP ' + response.status + '. Check the migration, bucket and server-only key.');
  };
  const cloudManifest = structuredClone(manifest);
  for (const item of cloudManifest.datasets) {
    const objectPath = item.sha256 + '/' + item.file;
    const bytes = await fs.readFile(path.join(directory, 'objects', item.sha256 + '.json'));
    await send('/storage/v1/object/' + bucket + '/' + objectPath, bytes);
    item.url = base + '/storage/v1/object/public/' + bucket + '/' + objectPath;
    await send('/rest/v1/datasets?on_conflict=id', { id: item.id, title: item.file, active_sha256: item.sha256, source: item.source, classification: item.classification, updated_at: new Date().toISOString() });
    await send('/rest/v1/dataset_versions?on_conflict=dataset_id,sha256', { dataset_id: item.id, sha256: item.sha256, object_path: objectPath, metadata: item });
    console.log('Published ' + item.file);
  }
  await send('/rest/v1/dataset_packs?on_conflict=version', { version: manifest.version, manifest: cloudManifest });
  return cloudManifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await loadEnvironment();
  const directory = path.resolve(PROJECT_ROOT, process.env.LUNA_DATA_DIR || 'backend/data');
  const manifest = await registerDatasets(path.join(PROJECT_ROOT, 'dist/data'), new LocalStore(directory));
  try {
    await publishCloud({ manifest, directory, url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY, bucket: process.env.SUPABASE_STORAGE_BUCKET || 'luna-datasets' });
    console.log('Cloud dataset pack published. Player login/cloud-save UI remains a future integration.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
