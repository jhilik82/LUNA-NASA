import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const files = [];
for (const directory of ['dist', 'backend', 'tools', 'workspace']) {
  for (const item of fs.readdirSync(directory, { recursive: true, withFileTypes: true })) {
    const parent = item.parentPath || item.path;
    if (item.isFile() && /\.(js|mjs)$/.test(item.name) && !parent.includes('backend/data')) files.push(parent + '/' + item.name);
  }
}
for (const file of files) { const r = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status || 1); }
console.log('Game, backend, tools and workspace JavaScript passed syntax checks.');
