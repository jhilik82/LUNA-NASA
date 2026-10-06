import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await build({entryPoints:[path.join(root,'dist/app.js')],outfile:path.join(root,'dist/game.js'),bundle:true,minify:true,format:'iife',platform:'browser',target:['es2020'],legalComments:'inline'});
const file=path.join(root,'dist/game.js');fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/[ \t]+$/gm,''));
console.log('Built the self-contained 3D game client.');
