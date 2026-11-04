import http from 'node:http';
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalStore } from './store.mjs';
import { registerDatasets, currentManifest } from './datasets.mjs';

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.zip': 'application/zip' };
const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
const validKey = key => /^luna-[a-z0-9-]{1,100}$/.test(key);

export function loadEnvironment(root = PROJECT_ROOT) {
  return fs.readFile(path.join(root, '.env'), 'utf8').then(contents => {
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  }).catch(error => { if (error.code !== 'ENOENT') throw error; });
}

async function body(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw Object.assign(new Error('Use application/json'), { status: 415 });
  let size = 0; const buffers = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw Object.assign(new Error('Request exceeds 1 MiB'), { status: 413 });
    buffers.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(buffers).toString('utf8')); }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

export async function createLunaServer({ root = PROJECT_ROOT, dataDirectory, dev = false } = {}) {
  const dist = path.join(root, 'dist');
  const store = new LocalStore(dataDirectory || path.resolve(root, process.env.LUNA_DATA_DIR || 'backend/data'));
  await registerDatasets(path.join(dist, 'data'), store);
  const clients = new Set();
  const notifyReload = () => { for (const response of clients) response.write('event: reload\ndata: changed\n\n'); };
  const server = http.createServer(async (req, res) => {
    try {
      const expectedHost = req.headers.host || '';
      if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(expectedHost)) return json(res, 403, { error: 'Localhost requests only' });
      if (req.headers.origin && req.headers.origin !== 'http://' + expectedHost) return json(res, 403, { error: 'Origin does not match this local workspace' });
      const url = new URL(req.url, 'http://' + expectedHost);
      const route = url.pathname;
      if (route === '/api/health' && req.method === 'GET') {
        const manifest = await currentManifest(store);
        return json(res, 200, { ok: true, storage: 'local-files', development: dev, datasetVersion: manifest.version, supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) });
      }
      if (route === '/api/datasets' && req.method === 'GET') return json(res, 200, await currentManifest(store));
      if (route === '/api/source-checks' && req.method === 'GET') {
        let checks = { checkedAt: null, sources: [] };
        try { checks = JSON.parse(await fs.readFile(path.join(store.directory, 'source-checks.json'), 'utf8')); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        return json(res, 200, checks);
      }
      if (route === '/api/progress' && req.method === 'GET') return json(res, 200, (await store.read()).progress);
      if (route === '/api/progress' && req.method === 'PUT') {
        const input = await body(req);
        if (!input?.values || typeof input.values !== 'object' || Array.isArray(input.values) || Object.keys(input.values).length > 100) return json(res, 400, { error: 'Expected a values object with up to 100 LUNA save keys' });
        for (const [key, value] of Object.entries(input.values)) {
          if (!validKey(key) || (value !== null && (typeof value !== 'string' || value.length > 200000))) return json(res, 400, { error: 'Invalid progress key or value' });
        }
        const updated = await store.update(state => {
          for (const [key, value] of Object.entries(input.values)) {
            if (value === null) delete state.progress.values[key];
            else state.progress.values[key] = value;
          }
          state.progress.updatedAt = new Date().toISOString();
        });
        return json(res, 200, { ok: true, updatedAt: updated.progress.updatedAt });
      }
      if (route === '/api/progress/export' && req.method === 'GET') {
        res.setHeader('Content-Disposition', 'attachment; filename="luna-progress.json"');
        return json(res, 200, (await store.read()).progress);
      }
      if (route.startsWith('/api/data/') && req.method === 'GET') {
        const match = route.match(/^\/api\/data\/([a-f0-9]{64})\/(terrain(?:-mars|-tranquillitatis)?|mission|ephemerides|academy|solar-system|astronomy|stars|scenarios)\.json$/);
        if (!match) return json(res, 404, { error: 'Unknown data asset' });
        const file = path.join(store.directory, 'objects', match[1] + '.json');
        const stats = await fs.stat(file);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': stats.size, 'Cache-Control': 'public, max-age=31536000, immutable', 'ETag': '"' + match[1] + '"' });
        createReadStream(file).pipe(res); return;
      }
      if (route === '/__dev/events' && dev && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        res.write('data: connected\n\n'); clients.add(res);
        const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
        req.on('close', () => { clients.delete(res); clearInterval(heartbeat); }); return;
      }
      if (route === '/__dev/reload.js' && dev) {
        res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
        res.end("const events=new EventSource('/__dev/events');events.addEventListener('reload',()=>location.reload());"); return;
      }
      if (route.startsWith('/api/')) return json(res, 404, { error: 'Unknown API route' });
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });
      const workspace = route === '/workspace' || route.startsWith('/workspace/');
      const base = workspace ? path.join(root, 'workspace') : dist;
      let relative = workspace ? route.replace(/^\/workspace\/?/, '') : route.slice(1);
      relative = decodeURIComponent(relative || 'index.html');
      const file = path.resolve(base, relative);
      if (!file.startsWith(base + path.sep)) return json(res, 403, { error: 'Invalid path' });
      // Lexical containment alone does not stop a symlink inside a served tree
      // from pointing at a secret elsewhere on disk.
      const [realBase, realFile] = await Promise.all([fs.realpath(base), fs.realpath(file)]);
      if (!realFile.startsWith(realBase + path.sep)) return json(res, 403, { error: 'Invalid path' });
      const stats = await fs.stat(realFile);
      if (!stats.isFile()) return json(res, 404, { error: 'Not found' });
      res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-cache'); res.setHeader('X-Content-Type-Options', 'nosniff');
      if (req.method === 'HEAD') { res.end(); return; }
      if (dev && path.extname(file) === '.html') {
        const html = await fs.readFile(realFile, 'utf8');
        res.end(html.replace('</body>', '<script src="/__dev/reload.js" defer></script></body>')); return;
      }
      createReadStream(realFile).pipe(res);
    } catch (error) {
      if (!res.headersSent) json(res, error.status || (error.code === 'ENOENT' ? 404 : 500), { error: error.status ? error.message : error.code === 'ENOENT' ? 'Not found' : 'Local workspace operation failed; check the server terminal' });
      else res.destroy();
      if (!error.status && error.code !== 'ENOENT') console.error(error.message);
    }
  });
  server.on('close', () => { for (const response of clients) response.end(); });
  return { server, store, notifyReload, closeConnections: () => { for (const response of clients) response.end(); } };
}

export function listen(server, port = Number(process.env.PORT || 3000)) {
  return new Promise((resolve, reject) => {
    server.once('error', error => {
      console.error(error.code === 'EADDRINUSE' ? 'Port ' + port + ' is busy. Close the other server or set PORT in .env.' : error.message);
      reject(error);
    });
    server.listen(port, '127.0.0.1', () => {
    const activePort = server.address().port;
    console.log('LUNA game: http://localhost:' + activePort);
    console.log('Local data and saves: http://localhost:' + activePort + '/workspace');
    resolve(activePort);
    });
  });
}
