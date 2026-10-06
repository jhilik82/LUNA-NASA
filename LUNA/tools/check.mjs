import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
for(const file of fs.readdirSync('dist').filter(n=>n.endsWith('.js'))){const r=spawnSync(process.execPath,['--check','dist/'+file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
console.log('All game JavaScript passed syntax checks.');
