import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.zip': 'application/zip' };
const server = http.createServer((req, res) => {
  let target;
  try { target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (target === root || target.endsWith(path.sep)) target = path.join(target, 'index.html');
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'text/plain', 'Cache-Control': 'no-cache' });
  fs.createReadStream(target).pipe(res);
});
server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log('LUNA is ready at http://localhost:' + server.address().port));
