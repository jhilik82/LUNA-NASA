import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const read=n=>fs.readFileSync(path.join(dist,n),'utf8');
const pack={terrain:JSON.parse(read('data/terrain.json')),config:JSON.parse(read('data/mission.json')),ephemerides:JSON.parse(read('data/ephemerides.json')),academy:JSON.parse(read('data/academy.json')),marsTerrain:JSON.parse(read('data/terrain-mars.json')),solar:JSON.parse(read('data/solar-system.json')),tranquillitatis:JSON.parse(read('data/terrain-tranquillitatis.json')),astronomy:JSON.parse(read('data/astronomy.json')),stars:JSON.parse(read('data/stars.json')),scenarios:JSON.parse(read('data/scenarios.json'))};
const escaped=s=>s.replace(/<\/script/gi,'<\\/script');
let html=read('index.html').replace(/<link rel="stylesheet" href="styles\.css(?:\?[^"]*)?">/,()=>'<style>'+read('styles.css')+'</style>');
// A callback preserves literal $& / $` / $' sequences in minified JavaScript.
// String replacement interprets them as match substitutions and corrupts code.
html=html.replace(/<script src="game\.js(?:\?[^\"]*)?" defer><\/script>/,()=>'<script>window.LUNA_DATA='+JSON.stringify(pack).replace(/</g,'\\u003c')+';</script>\n<script>'+escaped(read('game.js'))+'</script>');
<<<<<<< HEAD
html=html.replace('<script>window.LUNA_DATA=',()=>'<script>window.LUNA_DONKI='+read('data/donki_archive.json')+';window.LUNA_DATA=');
=======
>>>>>>> origin/main
const destination=path.join(dist,'luna-playable.html');fs.writeFileSync(destination,html);
console.log(JSON.stringify({file:destination,bytes:Buffer.byteLength(html),offline:true,renderer:'WebGL 2',embeddedData:true}));
