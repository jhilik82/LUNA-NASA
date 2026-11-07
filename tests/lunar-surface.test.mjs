import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { AstronomicalWorld } from '../dist/astronomy-world.js';
import { createDestinationMission } from '../dist/worlds.js';
import { FlightSimulation } from '../dist/voyage.js';
import { rendererFixture } from './renderer-fixture.mjs';
import { installLunarRegolithPixels } from '../dist/lunar-surface.js';

const names={terrain:'terrain',config:'mission',ephemerides:'ephemerides',academy:'academy',marsTerrain:'terrain-mars',solar:'solar-system',tranquillitatis:'terrain-tranquillitatis',astronomy:'astronomy',stars:'stars',scenarios:'scenarios'};
const pack=Object.fromEntries(Object.entries(names).map(([k,n])=>[k,JSON.parse(fs.readFileSync(new URL('../dist/data/'+n+'.json',import.meta.url)))]));
function scene(){const astro=new AstronomicalWorld(pack.astronomy,pack.stars),flight=new FlightSimulation(pack.solar,astro);astro.setMissionUTC(flight.departureUTC+flight.plan.durationSeconds+900);const mission=createDestinationMission(pack,'moon',null,'expedition',astro);return {astro,mission,renderer:rendererFixture(mission)};}

test('lunar gravel follows an EVA and regenerates exactly when returning to the same place',()=>{
  const {mission:m,renderer:r}=scene(),start={...m.state.player};
  const snapshot=()=>r.lunarClasts.batches.map(b=>({count:b.count,matrix:Array.from(b.instanceMatrix.array.slice(0,b.count*16)),colors:Array.from(b.instanceColor.array.slice(0,b.count*3))}));
  const original=snapshot();assert.ok(original.reduce((n,b)=>n+b.count,0)>3000);
  m.state.player.x+=120/m.terrain.cell;r.lunarClasts.update();assert.notDeepEqual(snapshot(),original);
  m.state.player={...start};r.lunarClasts.update();assert.deepEqual(snapshot(),original);
  r.lunarClasts.setQuality('low');r.lunarClasts.update();assert.ok(r.lunarClasts.batches.reduce((n,b)=>n+b.count,0)<original.reduce((n,b)=>n+b.count,0));
  r.dispose();
});

test('lunar impact meshes and boot placement share the pickable surface beyond the outpost',()=>{
  const {mission:m,renderer:r}=scene(),u=r.unitsPerMetre;
  for(const f of m.landscape.features.filter(f=>f.kind==='crater'&&f.r>=4).slice(6,22)){
    const p=m.landscape.grid({x:f.x+f.r*.47,z:f.z+f.r*.26});if(!m.terrain.inBounds(p.x,p.y))continue;
    const ground=r.world(p),ray=new THREE.Raycaster(ground.clone().add(new THREE.Vector3(0,80*u,0)),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObjects([r.ground,...r.terrainPatches])[0];assert.ok(hit);
    assert.ok(Math.abs(hit.point.y-ground.y)/u<.001,'actor stands on the visible triangle, including a distant impact patch');
  }
  r.dispose();
});

test('Moon daylight and night retain the dated Sun while using lunar sky and lamp conditions',()=>{
  const {astro:a,renderer:r}=scene();r.draw(1);
  assert.ok(r.surfaceSky.lastView.sun.altitude>=28);assert.equal(r.scene.fog,null);assert.equal(r.scene.background.getHex(),0);
  const expected=r.surfaceSky.lastView.sun.direction;assert.ok(r.skySunDirection.distanceTo(new THREE.Vector3(expected.x,expected.y,expected.z))<1e-10);
  assert.equal(r.suitLamp.isSpotLight,true);assert.ok(r.suitLamp.intensity/r.unitsPerMetre**2<1);
  a.setMissionUTC(Date.parse(a.data.epoch)/1000);r.draw(2);assert.ok(r.surfaceSky.lastView.sun.altitude<0);assert.equal(r.sun.intensity,0);assert.equal(r.scene.fog,null);assert.ok(r.suitLamp.intensity/r.unitsPerMetre**2>=100);
  r.dispose();
});

test('a decoded lunar tile updates near and distant ground together and cannot revive a disposed scene',()=>{
  const {renderer:r}=scene(),maps=r.surfaceMaps;
  const pixels=new Uint8Array([99,98,97,255,125,124,121,255,88,87,85,255,111,110,108,255]);
  assert.equal(installLunarRegolithPixels(maps,pixels,2,2),true);
  for(const ground of [r.ground,...r.terrainPatches,r.apron]){
    assert.equal(ground.material.map.image.data,pixels);
    assert.equal(ground.material.bumpMap.image.data,pixels);
    assert.equal(ground.material.map.colorSpace,THREE.SRGBColorSpace);
    assert.equal(ground.material.bumpMap.colorSpace,THREE.NoColorSpace);
    assert.ok(ground.material.bumpScale/r.unitsPerMetre<=.0031);
  }
  assert.equal(maps.albedo.wrapS,THREE.RepeatWrapping);
  assert.equal(maps.textureStatus,'authored');
  assert.throws(()=>installLunarRegolithPixels(maps,new Uint8Array(1),2,2),/Invalid/);
  const version=maps.albedo.version;r.dispose();
  assert.equal(installLunarRegolithPixels(maps,pixels,2,2),false);
  assert.equal(maps.albedo.version,version);
});

test('lunar terrain ahead remains inside the Sun shadow map as the astronaut looks around',()=>{
  const {mission:m,renderer:r}=scene(),u=r.unitsPerMetre;
  m.state.player={...m.state.player,...m.landscape.grid({x:3,z:12})};r.setPerspective('first-person');
  assert.equal(r.ground.castShadow,true);assert.equal(r.ground.material.shadowSide,THREE.FrontSide);
  for(let i=0;i<8;i++){
    r.lookYaw=i*Math.PI/4;r.lookPitch=0;r.draw(i+1);
    r.sun.updateMatrixWorld(true);r.sun.shadow.updateMatrices(r.sun);
    const direction=r.camera.getWorldDirection(new THREE.Vector3());
    const point=r.world(m.state.player).addScaledVector(direction,40*u).project(r.sun.shadow.camera);
    assert.ok(Math.abs(point.x)<1&&Math.abs(point.y)<1&&Math.abs(point.z)<1,'terrain 40 m ahead receives local terrain shadows');
    assert.ok(Math.abs((r.camera.position.y-r.world(m.state.player).y)/u-1.7)<1e-8);
    const sunDirection=r.sun.position.clone().sub(r.sun.target.position).normalize();
    assert.ok(sunDirection.distanceTo(r.skySunDirection)<1e-10,'coverage does not move the physical Sun');
  }
  r.dispose();
});
