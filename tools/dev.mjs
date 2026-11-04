import { context } from 'esbuild';
import { watch } from 'node:fs';
import path from 'node:path';
import { createLunaServer, listen, loadEnvironment, PROJECT_ROOT } from '../backend/server.mjs';
import { registerDatasets } from '../backend/datasets.mjs';

await loadEnvironment();
const { server, store, notifyReload, closeConnections } = await createLunaServer({ dev: true });
let initialBuild = true;
const builder = await context({
  entryPoints: [path.join(PROJECT_ROOT, 'dist/app.js')], outfile: path.join(PROJECT_ROOT, 'dist/game.js'),
  bundle: true, sourcemap: 'inline', format: 'iife', platform: 'browser', target: ['es2020'],
  plugins: [{ name: 'luna-browser-reload', setup(build) {
    build.onEnd(result => {
      if (result.errors.length) { console.error('Fix the build errors above; the last successful game remains available.'); return; }
      if (!initialBuild) { console.log('Client rebuilt. Reloading browser.'); notifyReload(); }
      initialBuild = false;
    });
  } }]
});
await builder.rebuild();
await builder.watch();
const watchers = []; let timer = null, dataChanged = false;
for (const directory of ['dist', 'dist/data', 'workspace']) {
  watchers.push(watch(path.join(PROJECT_ROOT, directory), (_event, file) => {
    if (!file || /game\.js|luna-playable\.html|\.tmp$/.test(String(file))) return;
    if (!/\.(html|css|json)$/.test(String(file)) && !(directory === 'workspace' && String(file).endsWith('.js'))) return;
    if (directory === 'dist/data') dataChanged = true;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        if (dataChanged) { await registerDatasets(path.join(PROJECT_ROOT, 'dist/data'), store); dataChanged = false; }
        console.log('Assets changed. Reloading browser.'); notifyReload();
      } catch (error) { console.error('Data validation failed; keeping the last published pack: ' + error.message); }
    }, 250);
  }));
}
await listen(server);
console.log('Edit dist/*.js, index.html, styles.css or data/*.json. Successful changes reload automatically.');
const shutdown = async () => {
  clearTimeout(timer); watchers.forEach(watcher => watcher.close());
  closeConnections(); await builder.dispose(); server.close(() => process.exit(0));
};
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
