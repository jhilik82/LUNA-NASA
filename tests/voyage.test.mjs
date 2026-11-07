import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { FlightSimulation, makeFlightPlan, WORLDS, localSky, skyDirection } from '../dist/voyage.js';
import { createDestinationMission,marsTrainingTerrain } from '../dist/worlds.js';
import { Renderer } from '../dist/render-3d.js';
import { FlightRenderer } from '../dist/flight-renderer.js';
const data=n=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+n+'.json',import.meta.url)));
const pack={terrain:data('terrain'),config:data('mission'),ephemerides:data('ephemerides'),academy:data('academy'),marsTerrain:data('terrain-mars'),solar:data('solar-system')};
const tickUntil=(f,p)=>{let n=2000;while(f.phase!==p&&n-->0)f.update(.1);assert.ok(n>0,'Reached '+p);};
const storage=()=>{const v=new Map();return{getItem:k=>v.get(k)??null,setItem:(k,x)=>v.set(k,x)};};
function actualScene(world='moon'){
 const m=createDestinationMission(pack,world,null),ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})}),createCanvas=(width,height)=>({width,height,getContext:()=>ctx});
 const device={shadowMap:{},setClearColor(){},setPixelRatio(){},setSize(){},render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true);},dispose(){}};
 const r=new Renderer(createCanvas(1000,720),m,{createCanvas,device}),f=new FlightSimulation(pack.solar),v=new FlightRenderer(r,f,pack.solar);return{m,r,f,v};
}
test('NASA MOLA and LOLA worlds have distinct measurements, coordinates and gravity',()=>{
 assert.notDeepEqual(pack.terrain.heights,pack.marsTerrain.heights);const playable=marsTrainingTerrain(pack.marsTerrain);assert.equal(playable.cellMetres,40);assert.equal(playable.source.nativeResolutionMetres,pack.marsTerrain.cellMetres);
 const moon=createDestinationMission(pack,'moon'),mars=createDestinationMission(pack,'mars');
 assert.equal(moon.config.physics.surfaceGravityMetresPerSecondSquared,1.62);assert.equal(mars.config.physics.surfaceGravityMetresPerSecondSquared,3.73);
 const geo=mars.terrain.geo({x:39.5,y:39.5});assert.ok(Math.abs(geo.lat-18.44)<.01);assert.ok(Math.abs(geo.lon-77.45)<.01);
 assert.equal(pack.marsTerrain.source.product,'MEGT44N000HB');assert.ok(pack.marsTerrain.source.rasterRangeSha256.length===64);
 moon.start();mars.start();for(let i=0;i<10;i++){moon.update(.1,{jump:i===0});mars.update(.1,{jump:i===0});}assert.ok(moon.state.player.jump>mars.state.player.jump);
});
test('route distances derive from dated vector geometry and distinguish separation from a planned path',()=>{
 const moon=makeFlightPlan(pack.solar,'moon'),mars=makeFlightPlan(pack.solar,'mars');assert.ok(moon.separationKm>350000&&moon.separationKm<410000);assert.ok(mars.separationKm>200e6);
 assert.ok(moon.totalKm>moon.separationKm);assert.ok(mars.totalKm>mars.separationKm);assert.equal(moon.distance(0),400);
 assert.ok(Math.abs(moon.distance(1)+20-moon.totalKm)<1e-6);assert.throws(()=>makeFlightPlan(pack.solar,'jupiter'));
});
test('local horizon vectors wrap azimuth, mask the horizon and retain genuine apparent diameters',()=>{
 for(const w of ['moon','mars'])for(let h=0;h<=24;h+=.25)for(const b of localSky(pack.solar,w,h)){const d=skyDirection(b);assert.ok(Math.abs(Math.hypot(d.x,d.y,d.z)-1)<1e-10);assert.equal(Math.sign(d.y),Math.sign(b.altitude));assert.ok(b.distanceKm>0);assert.ok(b.diameterArcsec>0);}
 const earthMoon=localSky(pack.solar,'moon',12).find(b=>b.name==='Earth'),earthMars=localSky(pack.solar,'mars',12).find(b=>b.name==='Earth');assert.ok(earthMoon.diameterArcsec>6000);assert.ok(earthMars.diameterArcsec<20);
});
for(const world of ['moon','mars'])test(world+' journey waits for a physical launch action, freezes when hidden, and lands with locked parameters',()=>{
 const f=new FlightSimulation(pack.solar);f.select(world);assert.equal(f.launch(),false);assert.equal(f.board(),true);assert.equal(f.select('moon'),false);tickUntil(f,'cockpit');
 const t=f.elapsed;for(let i=0;i<80;i++)f.update(.1,true);assert.equal(f.elapsed,t);assert.equal(f.phase,'cockpit');assert.equal(f.telemetry().ready,true);
 assert.equal(f.launch(),true);assert.equal(f.launch(),false);tickUntil(f,'ascent');let d=0,lastG=10;
 while(f.phase==='ascent'){const x=f.telemetry();assert.ok(x.distanceKm>=d);assert.ok(x.gravityMps2<=lastG);d=x.distanceKm;lastG=x.gravityMps2;f.update(.1);}
 while(f.phase==='transfer'){const x=f.telemetry();assert.ok(x.distanceKm>=d);d=x.distanceKm;assert.equal(x.cabinPressureKpa,101.325);assert.equal(x.exteriorPressureKpa,0);assert.ok(Number.isFinite(x.gravityMps2));f.update(.1);}
 tickUntil(f,'speed');for(let i=0;i<6;i++)f.update(.1);assert.ok(f.gauges.speed>=1&&f.gauges.speed<=3);f.lock();const held=f.speedLocked;f.update(.1);assert.equal(f.gauges.speed,held);assert.equal(f.phase,'angle');assert.ok(Math.abs(f.gauges.angle)<5);f.lock();assert.equal(f.phase,'descent');
 tickUntil(f,'landed');const x=f.telemetry();assert.equal(x.distanceKm,f.plan.totalKm);assert.equal(x.altitudeM,0);assert.equal(x.velocityMps,0);assert.equal(x.gravityMps2,WORLDS[world].gravity);assert.equal(x.exteriorPressureKpa,WORLDS[world].pressureKpa);
 assert.equal(f.disembark(),true);assert.equal(f.active,false);const state=[f.phase,f.elapsed];f.update(.1);assert.deepEqual([f.phase,f.elapsed],state);assert.equal(f.flightCount,1);
});
test('unsafe velocity commands a go-around and unlocks a retry without replaying the journey',()=>{
 const f=new FlightSimulation(pack.solar);f.enter('speed');for(let i=0;i<22;i++)f.update(.1);f.lock();f.lock();assert.equal(f.phase,'go-around');assert.match(f.feedback,/fast/);tickUntil(f,'speed');assert.equal(f.speedLocked,null);assert.equal(f.angleLocked,null);assert.equal(f.attempts,1);
});
test('the actual cockpit switch is raycastable, occlusion stays enabled and every flight phase renders without changing surface progress',()=>{
 const {m,r,f,v}=actualScene(),before=JSON.stringify(m.state);r.resize(1200,800);f.enter('cockpit');v.draw();
 const target=v.button.getWorldPosition(new THREE.Vector3()).project(v.camera);assert.ok(Math.abs(target.x)<1&&Math.abs(target.y)<1);assert.ok(v.hitButton((target.x*.5+.5)*r.width,(-target.y*.5+.5)*r.height));
 r.resize(390,1050);v.draw();const phone=v.button.getWorldPosition(new THREE.Vector3()).project(v.camera);assert.ok(Math.abs(phone.x)<.8&&Math.abs(phone.y)<.8,'Phone viewport keeps the switch visible');r.resize(1200,800);v.draw();v.hitButton((target.x*.5+.5)*r.width,(-target.y*.5+.5)*r.height);
 let count=0;v.cockpit.traverse(o=>{if(o.isMesh&&!o.material.transparent){assert.equal(o.material.depthTest,true);assert.equal(o.material.depthWrite,true);count++;}});assert.ok(count>0);const nearest=v.ray.intersectObjects(v.cockpit.children,true).find(hit=>hit.object.isMesh&&!hit.object.material.transparent);assert.equal(nearest?.object.name,v.button.name,'The physical switch is visible from the cockpit camera');
 for(const p of ['briefing','boarding','ignition','ascent','transfer','capture','speed','angle','descent','go-around','landed']){f.enter(p);f.elapsed=1;f.speedLocked=2;f.angleLocked=0;v.draw();assert.ok(v.camera.position.toArray().every(Number.isFinite));}
 v.drawSolarSystem();v.rotateSolar(Math.PI*2,.3);v.drawSolarSystem();assert.equal(v.solarBodies.size,10);assert.equal(JSON.stringify(m.state),before);
});
test('surface sky masks bodies below the horizon, points the helmet precisely and offers explicit telescope magnification',()=>{
 const {r}=actualScene('mars');r.surfaceSky.hour=12;const list=r.surfaceSky.update();for(const b of list)assert.equal(r.surfaceSky.bodies.get(b.name).visible,b.altitude>-.4);
 const earth=list.find(b=>b.name==='Earth');assert.ok(earth.altitude<0);assert.equal(r.surfaceSky.aim('Earth'),false);const hour=pack.solar.observers.mars.bodies.Earth.samples.find(s=>s.altitude>10).hour;
 r.surfaceSky.hour=hour;r.surfaceSky.update();assert.equal(r.surfaceSky.aim('Earth',true),true);assert.ok(r.camera.fov<1);const d=skyDirection(localSky(pack.solar,'mars',hour).find(b=>b.name==='Earth'));assert.ok(r.camera.getWorldDirection(new THREE.Vector3()).dot(new THREE.Vector3(d.x,d.y,d.z))>.999);
});
test('separate Moon and Mars advancement survives world switching without overwriting badges',()=>{
 const s=storage(),moon=createDestinationMission(pack,'moon',s),mars=createDestinationMission(pack,'mars',s);moon.completed=[{id:moon.lesson.id,qualified:true,xp:300}];moon.save();assert.equal(createDestinationMission(pack,'moon',s).xp,300);assert.equal(createDestinationMission(pack,'mars',s).xp,0);mars.completed=[{id:mars.lesson.id,qualified:true,xp:400}];mars.save();assert.equal(createDestinationMission(pack,'moon',s).xp,300);assert.equal(createDestinationMission(pack,'mars',s).xp,400);
});
