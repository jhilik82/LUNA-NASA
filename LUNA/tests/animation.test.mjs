import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { TrainingMission } from '../dist/academy.js';
import { Renderer } from '../dist/render-3d.js';
import { openingMotion, astronautPose, ballisticDust } from '../dist/animation.js';

test('opening motion lands smoothly, brakes to a stop and lets the cadet check the wrist display',()=>{
  assert.equal(openingMotion(0).landerHeight,27);assert.equal(openingMotion(4.15).landerHeight,0);assert.equal(openingMotion(5).engine,0);
  const travel=t=>openingMotion(t).roverTravel;
  assert.ok(travel(6.5)>travel(6));assert.ok(travel(6.5)-travel(6)>travel(9)-travel(8.5));assert.equal(travel(9.5),travel(12));
  assert.equal(openingMotion(19).cadetStride,0);assert.equal(openingMotion(26).cadetStride,0);assert.ok(openingMotion(21).cadetStride>.9);
  assert.ok(openingMotion(24).wristCheck>.9);assert.equal(openingMotion(26).wristCheck,0);
  for(const t of [0,4.15,6,12,19,23.2,26])for(const [key,value] of Object.entries(openingMotion(t))){assert.ok(Number.isFinite(value),key);assert.ok(Math.abs(value-openingMotion(t+.00001)[key])<.01,key+' jumps');}
});

test('reduced motion keeps the models and poses still throughout each shot',()=>{
  assert.deepEqual(openingMotion(0,true),openingMotion(26,true));
  assert.deepEqual(astronautPose(0,0,1,1,true),astronautPose(50,26,0,0,true));
  const pose=astronautPose(Math.PI/2,2,1);assert.ok(pose.knees[1]>0&&pose.hips[1]<0);assert.equal(pose.knees[0],0);
  const check=astronautPose(0,24,0,1);assert.ok(check.elbows[0]<-.9&&check.headPitch>0);
});

test('lunar dust rises and falls under gravity while its horizontal travel remains ballistic',()=>{
  assert.equal(ballisticDust(0,4,1).height,0);assert.ok(ballisticDust(.5,4,1).height>ballisticDust(.1,4,1).height);
  assert.equal(ballisticDust(2,4,1).height,0);assert.equal(ballisticDust(2,4,1).distance,8);
});

function scene(){
  const data=n=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+n+'.json',import.meta.url)));
  const mission=new TrainingMission(data('terrain'),data('mission'),data('ephemerides'),data('academy'));
  // Scene geometry is real Three.js; only the canvas texture drawing and GPU device are doubled.
  const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})}),createCanvas=(width,height)=>({width,height,getContext:()=>ctx});
  const device={shadowMap:{},setClearColor(){},setPixelRatio(){},setSize(){},render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true);},dispose(){}};
  return new Renderer(createCanvas(1000,720),mission,{createCanvas,device});
}

test('the actual opening scene preserves mission state, reuses dust meshes and restores gameplay even when skipped',()=>{
  const r=scene(),state=JSON.stringify(r.mission.state),dust=r.cinemaDust.map(p=>p.mesh.uuid),pitch=r.rover.rotation.x;
  r.setPerspective('first-person');
  for(const [time,shot] of [[1,'arrival'],[3.6,'arrival'],[4.4,'arrival'],[7,'echo'],[8.5,'echo'],[13,'relay'],[20,'astronaut'],[24,'astronaut']]){
    r.cinematicFrame(time,shot);assert.equal(JSON.stringify(r.mission.state),state);
    r.scene.traverse(o=>{assert.ok([...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()].every(Number.isFinite),o.name);});
    assert.deepEqual(r.cinemaDust.map(p=>p.mesh.uuid),dust);
  }
  r.cinematicFrame(8.5,'echo');assert.ok(r.rover.rotation.x!==pitch);r.endCinematic();
  assert.equal(r.cinemaGroup.visible,false);assert.equal(r.engineLight.intensity,0);assert.equal(r.camera.view.enabled,false);
  assert.equal(r.camera.fov,72);assert.equal(r.player.visible,false);assert.equal(r.rover.rotation.x,pitch);
  assert.equal(r.perspective,'first-person');assert.equal(JSON.stringify(r.mission.state),state);
  assert.ok(r.camera.position.distanceTo(r.world(r.mission.state.player,4.25))<1e-8);
});

test('cadet stays in frame on desktop and phone; reduced motion holds the camera within the same chapter',()=>{
  const r=scene();
  for(const [width,height] of [[1000,720],[390,650]]){
    r.resize(width,height);r.cinematicFrame(24,'astronaut');
    const head=r.player.position.clone().add(new THREE.Vector3(0,4.25,0)).project(r.camera);
    assert.ok(Math.abs(head.x)<.9&&Math.abs(head.y)<.9&&head.z<1&&head.z>-1);
    r.endCinematic();r.reducedMotion=true;r.cinematicFrame(20,'astronaut');const position=r.camera.position.clone(),pose=r.player.userData.helmet.quaternion.clone();
    r.cinematicFrame(25,'astronaut');assert.ok(r.camera.position.distanceTo(position)<1e-8);assert.equal(r.player.userData.helmet.quaternion.angleTo(pose),0);r.endCinematic();r.reducedMotion=false;
  }
});
