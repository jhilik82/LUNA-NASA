import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT, loadEnvironment } from '../backend/server.mjs';
await loadEnvironment();
const hours = Number(process.env.NASA_CHECK_HOURS || 24);
if (!Number.isFinite(hours) || hours < 1 || hours > 168) throw new Error('NASA_CHECK_HOURS must be between 1 and 168.');
let active = null, running = false, stopping = false;
const run = mode => new Promise(resolve => {
  active = spawn(process.execPath, [path.join(PROJECT_ROOT, 'tools/run-data-job.mjs'), mode], { cwd: PROJECT_ROOT, stdio: 'inherit', env: process.env });
  active.on('exit', code => { active = null; resolve(code === 0); });
  active.on('error', error => { console.error(error.message); active = null; resolve(false); });
});
const check = async () => {
  if (running || stopping) return;
  running = true;
  try {
    console.log('Checking NASA publication headers: ' + new Date().toISOString());
    if (!await run('--check') || stopping) return;
    const directory = path.resolve(PROJECT_ROOT, process.env.LUNA_DATA_DIR || 'backend/data');
    const report = JSON.parse(await fs.readFile(path.join(directory, 'source-checks.json'), 'utf8'));
    const changed = report.sources.some(source => source.changed);
    if (changed && process.env.NASA_AUTO_REFRESH === 'true') await run('--refresh');
    else if (changed) console.log('An upstream source changed. Run npm run data:refresh to stage and validate a replacement.');
    else console.log('No change detected in the available source headers.');
  } catch (error) { console.error(error.message); }
  finally { running = false; }
};
const timer = setInterval(check, hours * 3600000);
console.log('NASA update checks repeat every ' + hours + ' hours while this terminal remains open.');
check();
const stop = () => { stopping = true; clearInterval(timer); active?.kill(); if (!running) process.exit(0); };
process.once('SIGINT', stop); process.once('SIGTERM', stop);
