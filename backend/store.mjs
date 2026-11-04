import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function atomicWrite(file, contents) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {
    await fs.writeFile(temporary, contents);
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

// Local development persistence. Supabase's migration is in backend/supabase/.
export class LocalStore {
  constructor(directory) {
    this.directory = directory;
    this.file = path.join(directory, 'state.json');
    this.backup = path.join(directory, 'state.backup.json');
    this.pending = Promise.resolve();
  }
  async read() {
    let primaryFailed = false;
    for (const file of [this.file, this.backup]) {
      try {
        const value = JSON.parse(await fs.readFile(file, 'utf8'));
        if (value.schema !== 1 || !value.progress?.values || typeof value.progress.values !== 'object' || Array.isArray(value.progress.values)) throw new Error('Invalid local store');
        return value;
      } catch (error) {
        if (file === this.file && error.code !== 'ENOENT') primaryFailed = true;
        if (file === this.backup && (error.code !== 'ENOENT' || primaryFailed)) throw new Error('Both local save files are unreadable; restore a backup.');
      }
    }
    return { schema: 1, currentManifest: null, progress: { values: {}, updatedAt: null } };
  }
  update(change) {
    const operation = this.pending.then(async () => {
      const previous = await this.read();
      const next = structuredClone(previous);
      await change(next);
      await atomicWrite(this.backup, JSON.stringify(previous, null, 2) + '\n');
      await atomicWrite(this.file, JSON.stringify(next, null, 2) + '\n');
      return next;
    });
    this.pending = operation.catch(() => {});
    return operation;
  }
}
