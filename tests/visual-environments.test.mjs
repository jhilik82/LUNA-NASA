import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { AstronomicalWorld } from '../dist/astronomy-world.js';
import { createDestinationMission } from '../dist/worlds.js';
import { FlightSimulation } from '../dist/voyage.js';
import { Renderer } from '../dist/render-3d.js';
import { FlightRenderer, CREW_ENTRY, LAUNCH_COAST } from '../dist/flight-renderer.js';
import { surfaceMaterials } from '../dist/surface-materials.js';

const files={terrain:'terrain',config:'mission',ephemerides:'ephemerides',academy:'academy',marsTerrain:'terrain-mars',solar:'solar-system',tranquillitatis:'terrain-tranquillitatis',astronomy:'astronomy',stars:'stars',scenarios:'scenarios'};
const pack=Object.fromEntries(Object.entries(files).map(([key,name])=>[key,JSON.parse(fs.readFileSync(new URL('../dist/data/'+name+'.json',import.meta.url)))]));
function scene(destination){
  const a=new AstronomicalWorld(pack.astronomy,pack.stars),f=new FlightSimulation(pack.solar,a);f.select(destination);a.setMissionUTC(f.departureUTC+f.plan.durationSeconds+900);
  const m=createDestinationMission(pack,destination,null,'expedition',a),ctx=new Proxy({measureText:s=>({width:s.length*8}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})}),createCanvas=(width,height)=>({width,height,getContext:()=>ctx}),device={shadowMap:{},setClearColor(){},setPixelRatio(){},setSize(){},render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true);},dispose(){}};
  const r=new Renderer(createCanvas(1000,720),m,{createCanvas,device});return{a,f,m,r,v:new FlightRenderer(r,f,pack.solar)};
}

test('Moon and Mars use distinct grain/impact versus ripple/sediment material data, separate from albedo',()=>{
  const lunar=surfaceMaterials('moon',128),martian=surfaceMaterials('mars',128),mean=m=>{const d=m.albedo.image.data,s=[0,0,0];for(let i=0;i<d.length;i+=4)for(let c=0;c<3;c++)s[c]+=d[i+c];return s.map(x=>x/(d.length/4));};
  const moon=mean(lunar),mars=mean(martian);assert.ok(Math.abs(moon[0]-moon[1])<1);assert.ok(mars[0]-mars[2]>45);
  assert.notDeepEqual(lunar.relief.image.data,martian.relief.image.data);assert.notDeepEqual(martian.albedo.image.data,martian.relief.image.data);
  for(const m of [lunar,martian]){assert.equal(m.albedo.colorSpace,THREE.SRGBColorSpace);assert.equal(m.relief.colorSpace,THREE.NoColorSpace);assert.equal(m.albedo.generateMipmaps,true);assert.equal(m.albedo.anisotropy,8);for(const key of ['albedo','relief','roughness','rock','rockRelief'])m[key].dispose();}
});

for(const destination of ['moon','mars'])test(destination+' training arrives in real daylight and aligns reconstructed relief with a readable close surface camera',()=>{
  const {a,f,m,r,v}=scene(destination),sun=a.apparent('Sun',a.observer(destination));assert.ok(sun.altitude>=28&&sun.altitude<85);assert.ok(a.utc<a.stop-3600);assert.equal(f.plan.durationSeconds,(destination==='moon'?3:210)*86400);
  r.draw(1,m.lifeline());assert.ok(r.sun.intensity>1.5);assert.ok(r.camera.position.distanceTo(r.world(m.state.player,1.1*r.unitsPerMetre))/r.unitsPerMetre<10);assert.ok(r.pitch<.4);
  const pos=r.ground.geometry.attributes.position;for(let i=0;i<pos.count;i+=79){const x=pos.getX(i)/8+(m.terrain.width-1)/2,y=pos.getZ(i)/8+(m.terrain.height-1)/2;assert.ok(Math.abs(pos.getY(i)-r.world({x,y}).y)<.0002,'renderer and gameplay sample the same measured-plus-authored surface');}
  assert.notEqual(r.groundMaterial.map,r.groundMaterial.bumpMap);assert.equal(r.apron.userData.measured,false);assert.equal(r.apron.userData.regionalSource,destination==='mars');assert.equal(!!r.scene.fog,destination==='mars');assert.equal(r.surfaceSky.marsSky.visible,destination==='mars');
  r.setElevation(true);r.setElevation(false);assert.deepEqual(r.ground.geometry.attributes.color.array,r.terrainBaseColors);
  a.setMissionUTC(a.utc+(destination==='moon'?15*86400:12*3600));r.draw(2,m.lifeline());assert.ok(r.surfaceSky.lastView.sun.altitude<0);assert.equal(r.sun.intensity,0);assert.ok(r.suitLamp.intensity/(r.unitsPerMetre**2)>=100,'night visibility comes from a suit lamp, not a false daylight Sun');v.dispose();r.dispose();
});

test('boarding follows the hatch centre, keeps boots on the gantry, and fully clears the pressure shell before the door closes',()=>{
  const {f,r,v}=scene('moon'),e=CREW_ENTRY;f.enter('boarding');let previous=e.startX;
  for(let i=0;i<=59;i++){f.elapsed=i*.1;v.draw();const x=v.cadet.position.x;assert.ok(x>=previous-1e-8);previous=x;assert.equal(v.cadet.position.z,e.z);const box=new THREE.Box3().setFromObject(v.cadet);assert.ok(Math.abs(box.min.y-e.floorY)<.04,'suit soles align with the walkway');assert.ok(box.max.y<e.ceilingY-.08,'helmet fits through the hatch');}
  const shell=v.ship.getObjectByName('command-capsule');for(const y of [.2,1,1.8])for(const z of [-.35,0,.35]){const origin=new THREE.Vector3(-6,e.floorY+y,z),hits=new THREE.Raycaster(origin,new THREE.Vector3(1,0,0)).intersectObject(shell,true);assert.ok(!hits.length||hits[0].distance>6,'entry has a true shell opening, not a painted door');}
  assert.ok(new THREE.Box3().setFromObject(v.cadet).min.x>-1.5,'backpack is inside the capsule before closure');assert.equal(v.cadet.visible,true);assert.ok(v.ship.userData.crewHatch.pivot.quaternion.angleTo(new THREE.Quaternion())<.4);
  const torso=v.cadet.localToWorld(new THREE.Vector3(0,2.7,0)),hits=new THREE.Raycaster(v.camera.position,torso.sub(v.camera.position).normalize()).intersectObjects([v.ship,v.cadet],true);assert.ok(hits.length>0);let ancestor=hits[0].object;while(ancestor.parent!==v.scene)ancestor=ancestor.parent;assert.equal(ancestor,v.ship,'closed capsule physically occludes the cadet');
  f.elapsed=3.8;for(const [width,height]of[[1366,680],[390,844]]){r.resize(width,height);v.draw();const torso=v.cadet.localToWorld(new THREE.Vector3(0,2.7,0)).project(v.camera);assert.ok(Math.abs(torso.x)<.8&&Math.abs(torso.y)<.8,'boarding astronaut stays in the camera');}
  f.elapsed=5.5;v.draw();assert.ok(v.ship.userData.crewHatch.pivot.quaternion.angleTo(new THREE.Quaternion())>1,'door stays open until entry finishes');v.dispose();r.dispose();
});

test('departure and boarding cameras orbit through every azimuth without changing cinematic distance or flight progress',()=>{
  const {a,f,m,r,v}=scene('moon');a.setMissionUTC(f.departureUTC);const before=JSON.stringify(m.state);
  for(const phase of ['briefing','boarding']){
    f.enter(phase);f.elapsed=phase==='boarding'?2.7:0;v.lookYaw=v.lookPitch=0;v.draw();
    const x=v.cadet.position.x,target=phase==='briefing'?new THREE.Vector3(0,18,0):new THREE.Vector3(x+1.2,CREW_ENTRY.floorY+1.1,0),initial=v.camera.position.clone(),radius=initial.distanceTo(target),offset=initial.clone().sub(target);
    for(const yaw of [0,Math.PI/2,Math.PI,3*Math.PI/2,Math.PI*2]){
      v.lookYaw=yaw;v.draw();const expected=offset.clone().applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(target);
      assert.ok(v.camera.position.distanceTo(expected)<1e-7,'full orbit follows spherical geometry');assert.ok(Math.abs(v.camera.position.distanceTo(target)-radius)<1e-7);
      assert.ok(v.camera.getWorldDirection(new THREE.Vector3()).dot(target.clone().sub(v.camera.position).normalize())>.99999,'camera keeps its subject in view');
      assert.equal(f.phase,phase);assert.equal(f.elapsed,phase==='boarding'?2.7:0);
    }
    v.rotate(0,.35);v.draw();assert.ok(v.camera.position.y>initial.y);assert.ok(Math.abs(v.camera.position.distanceTo(target)-radius)<1e-7);
  }
  assert.equal(JSON.stringify(m.state),before);v.dispose();r.dispose();
});

test('the launch coastline has one visible surface per footprint and stable exterior depth throughout boarding',()=>{
  const {a,f,r,v}=scene('mars');a.setMissionUTC(f.departureUTC);f.enter('boarding');f.elapsed=2;v.draw();
  const ground=v.padGround,ocean=v.pad.getObjectByName('distant-ocean'),landBox=new THREE.Box3().setFromObject(ground),seaBox=new THREE.Box3().setFromObject(ocean),geometry=ground.geometry;
  assert.ok(Math.abs(landBox.min.z-LAUNCH_COAST.shoreZ)<1e-5);assert.ok(Math.abs(seaBox.max.z-LAUNCH_COAST.shoreZ)<1e-5);assert.ok(landBox.min.z>=seaBox.max.z-1e-5,'land and sea share an edge without overlapping area');
  for(const z of [-800,-500,-325,-315,0,700]){
    const hits=new THREE.Raycaster(new THREE.Vector3(100,40,z),new THREE.Vector3(0,-1,0)).intersectObjects([ground,ocean]);
    assert.ok(hits.length);assert.equal(new Set(hits.map(h=>h.object)).size,1,'a ground footprint cannot alternate between land and ocean');assert.equal(hits[0].object,z<LAUNCH_COAST.shoreZ?ocean:ground);
  }
  for(let i=0;i<60;i++){f.elapsed=i*.1;v.rotate(.1,0);v.draw();assert.equal(ground.geometry,geometry);assert.equal(v.camera.near,.5);assert.ok(v.sky.position.distanceTo(v.camera.position)<1e-7);}
  assert.equal(v.sky.material.depthWrite,false);assert.equal(v.sky.material.depthTest,false);assert.ok(v.sky.renderOrder<ground.renderOrder);
  f.enter('cockpit');v.draw();assert.equal(v.camera.near,.035,'close controls retain their original clipping');v.dispose();r.dispose();
});

test('Earth launch sky, direct sunlight and gantry lamps follow the dated Sun for both destinations',()=>{
  const {a,f,r,v}=scene('moon');
  for(const destination of ['moon','mars']){
    f.select(destination);a.setMissionUTC(f.departureUTC);v.draw();const sun=v.sharedSky.lastView.sun;
    assert.equal(v.sharedSky.lastView.observer.world,'earth','destination selection still shows the Earth pad');
    if(destination==='moon'){assert.ok(sun.altitude>30);assert.equal(v.sky.material.uniforms.day.value,1);assert.ok(v.sun.intensity>3);assert.ok(v.padLights.every(l=>l.intensity===0));}
    else{assert.ok(sun.altitude<-30);assert.equal(v.sky.material.uniforms.day.value,0);assert.equal(v.sun.intensity,0);assert.ok(v.padLights.every(l=>l.intensity>0),'local fixtures make the night pad readable');}
    a.setMissionUTC(f.departureUTC+f.plan.durationSeconds+900);assert.ok(a.apparent('Sun',a.observer(destination)).altitude>28,'both surface arrivals use daylight windows');
  }
  // Moving the same mission clock changes the pad sky; darkness is not a
  // hard-coded property of Mars selection.
  a.setMissionUTC(f.departureUTC+12*3600);v.draw();assert.ok(v.sharedSky.lastView.sun.altitude>0);assert.ok(v.sky.material.uniforms.day.value>.9);assert.ok(v.sun.intensity>0);v.dispose();r.dispose();
});
<<<<<<< HEAD

test('mid-cruise: the ship is lit in deep space, the cruise backdrop shows, and the bus hardware animates fault then repair',()=>{
  const {f,v}=scene('moon');f.enter('transfer');f.elapsed=12;f.routeProgress=.5;v.draw();
  assert.ok(v.sun.intensity>3,'the Sun is always up in deep space');assert.ok(v.fill.intensity>0&&v.ambient.intensity>.3);
  assert.equal(v.cruise.visible,true);assert.equal(v.earth.visible,true);assert.equal(v.moon.visible,true);assert.equal(v.sharedSky.group.visible,false);
  assert.equal(v.spark.visible,true,'unresolved fault arcs at the junction');
  const downlink=v.busLights.filter(l=>l.userData.circuit==='downlink');
  assert.equal(f.resolveEvent('isolate'),true);f.elapsed+=3;v.draw();assert.equal(v.spark.visible,false,'isolating the circuit stops the arc');
  for(const l of downlink)assert.equal(l.material.emissive.getHexString(),'ffb347','isolated downlink stays amber');
  for(const l of v.busLights.filter(l=>l.userData.circuit==='main'))assert.equal(l.material.emissive.getHexString(),'45d483','main bus restored to green');
  f.enter('boarding');f.elapsed=1;v.draw();assert.equal(v.cruise.visible,false);assert.ok(v.scene.fog,'launch-site haze returns on the pad');
});
=======
>>>>>>> origin/main
