const byId = id => document.getElementById(id);
const date = value => value ? new Date(value).toLocaleString() : 'Not recorded';
const get = async route => { const response = await fetch(route, { cache: 'no-store' }); if (!response.ok) throw new Error('Local backend returned ' + response.status); return response.json(); };
const cell = (row, text) => { const td = document.createElement('td'); td.textContent = text; row.append(td); return td; };
async function refresh() {
  try {
    const [health, manifest, progress, checks] = await Promise.all(['/api/health', '/api/datasets', '/api/progress', '/api/source-checks'].map(get));
    byId('error').hidden = true;
    byId('health').textContent = health.development ? 'Connected · automatic rebuild' : 'Connected · local server';
    byId('version').textContent = manifest.version;
    byId('saved').textContent = progress.updatedAt ? date(progress.updatedAt) : 'No saves yet';
    byId('save-count').textContent = Object.keys(progress.values).length + ' saved LUNA settings and checkpoint records.';
    byId('cloud').textContent = health.supabaseConfigured ? 'Supabase publishing credentials are configured. Run npm run cloud:publish to upload a validated pack.' : 'Supabase is not configured. Local data and saves work without an account.';
    byId('datasets').replaceChildren(...manifest.datasets.map(item => {
      const row = document.createElement('tr');
      cell(row, item.file); cell(row, (item.bytes / 1024).toFixed(1) + ' KB');
      const source = typeof item.source === 'string' ? item.source : item.source?.name || 'Project configuration';
      const details = cell(row, source); const small = document.createElement('small'); small.textContent = item.classification; details.append(small);
      cell(row, item.coverage ? item.coverage.start.slice(0, 10) + ' → ' + item.coverage.stop.slice(0, 10) : item.nativeResolutionMetres ? item.nativeResolutionMetres.toFixed(2) + ' m native cells' : 'See source metadata');
      return row;
    }));
    byId('checked').textContent = checks.checkedAt ? 'Last checked: ' + date(checks.checkedAt) : 'No online source check has been run.';
    byId('sources').replaceChildren(...checks.sources.map(item => {
      const line = document.createElement('div'); line.className = 'source-status';
      line.textContent = item.name + ': ' + item.status + (item.changed ? ' · source headers changed' : '') + (item.error ? ' · ' + item.error : ''); return line;
    }));
  } catch (error) { byId('error').textContent = error.message + '. Keep the local server running.'; byId('error').hidden = false; }
}
byId('refresh').addEventListener('click', refresh);
refresh();
