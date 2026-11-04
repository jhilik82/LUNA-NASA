import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { PROJECT_ROOT, loadEnvironment } from '../backend/server.mjs';
await loadEnvironment();
let executable = process.env.PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
let prefix = process.platform === 'win32' && !process.env.PYTHON ? ['-3'] : [];
if (spawnSync(executable, [...prefix, '--version'], { stdio: 'ignore' }).error) { executable = 'python'; prefix = []; }
const args = process.argv.includes('--test') ? ['-m', 'unittest', 'discover', '-s', 'backend/tests', '-p', 'test_*.py'] : [path.join(PROJECT_ROOT, 'tools/update-data.py'), '--node', process.execPath, ...process.argv.slice(2)];
const child = spawn(executable, [...prefix, ...args], { cwd: PROJECT_ROOT, stdio: 'inherit', env: process.env });
child.on('error', () => { console.error('Python 3 was not found. Install Python 3 or set PYTHON in .env. The game itself runs without Python.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
process.once('SIGINT', () => child.kill('SIGINT'));
process.once('SIGTERM', () => child.kill('SIGTERM'));
