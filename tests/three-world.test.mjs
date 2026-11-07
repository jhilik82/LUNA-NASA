import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { Mission, Terrain } from '../dist/engine.js';
import { TrainingMission } from '../dist/academy.js';
import { Renderer } from '../dist/render-3d.js';
import { isOccupied, segmentBlocked, BODY_RADIUS } from '../dist/world-layout.js';
import { createAstronaut, createHabitat, createRover, createSolar, createAirlock, createRelay, createTrainingBench, createLander, makeMaterials } from '../dist/models.js';
import { StorySequence, STORY_KEY, STORY_DURATION, storyChapters } from '../dist/story.js';
const data=n=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+n+'.json',import.meta.url)));
const create=()=>new Mission(data('terrain'),data('mission'),data('ephemerides'));

test('manual movement cannot walk through a structure or tunnel across its footprint',()=>{
  const m=create(),p=m.props.find(p=>p.id==='habitat');m.start();
  m.terrain=new Terrain({...data('terrain'),heights:Array(6400).fill(0)});
  m.terrain.blocksSegment=(a,b)=>segmentBlocked(a,b,m.colliders(),BODY_RADIUS);
  Object.assign(m.state.player,{x:p.x-p.halfX-.8,y:p.y});
  for(let i=0;i<90;i++)m.update(.2,{dx:1});
  assert.ok(m.state.player.x < p.x-p.halfX);assert.equal(m.state.blocked,true);assert.equal(isOccupied(m.state.player,m.colliders()),false);
  assert.equal(segmentBlocked({x:p.x-4,y:p.y},{x:p.x+4,y:p.y},m.props),true);
});

test('autopilot and ASTRA-compatible graph route around equipment and end at a reachable repair approach',()=>{
  const m=create();m.start();assert.equal(m.navigate(m.state.rover),true);
  const target=m.route.path.at(-1);assert.equal(isOccupied(target,m.colliders()),false);
  for(let i=1;i<m.route.path.length;i++)assert.equal(segmentBlocked(m.route.path[i-1],m.route.path[i],m.colliders()),false);
  let limit=20000;while(m.route&&limit-->0)m.update(.1);assert.ok(limit>0);
  assert.equal(m.nearby().type,'rover');assert.equal(isOccupied(m.state.player,m.colliders()),false);
});

test('boarding hides EVA occupancy and dismounting places the astronaut outside Echo',()=>{
  const m=create();m.start();m.state.relayOnline=true;m.state.rover.repaired=true;m.state.rover.wh=4200;m.state.phase='return';
  Object.assign(m.state.player,{x:m.state.rover.x+1,y:m.state.rover.y});m.interact();assert.equal(m.state.rover.occupied,true);
  m.interact();assert.equal(m.state.rover.occupied,false);assert.equal(isOccupied(m.state.player,m.colliders()),false);
  assert.ok(Math.hypot(m.state.player.x-m.state.rover.x,m.state.player.y-m.state.rover.y)>.6);
});

test('opaque astronaut and equipment meshes share depth testing without always-on-top drawing',()=>{
  const mat=makeMaterials(),objects=[createAstronaut(mat),createHabitat(mat),createRover(mat),createSolar(mat),createAirlock(mat),createRelay(mat),createTrainingBench(mat),createLander(mat)];let count=0;
  for(const g of objects)g.traverse(o=>{if(o.isMesh){count++;assert.equal(o.material.depthTest,true);assert.equal(o.material.depthWrite,true);assert.equal(o.material.transparent,false);assert.equal(o.renderOrder,0);}});
  assert.ok(count>80);
  const habitat=objects[1],astronaut=objects[0];astronaut.position.set(0,0,-10);
  const scene=new THREE.Scene();scene.add(habitat,astronaut);scene.updateMatrixWorld(true);
  const origin=new THREE.Vector3(0,4.25,22),target=new THREE.Vector3(0,4.25,-9.4);
  const hit=new THREE.Raycaster(origin,target.clone().sub(origin).normalize()).intersectObjects([habitat,astronaut],true)[0];
  let ancestor=hit.object;while(ancestor.parent!==scene)ancestor=ancestor.parent;assert.equal(ancestor,habitat,'Habitat must occlude the astronaut along the viewing ray');
  scene.remove(habitat);assert.ok(new THREE.Raycaster(origin,target.clone().sub(origin).normalize()).intersectObject(astronaut,true).length>0,'The same ray sees the suit after the occluder is removed');
});

test('story is a one-way timeline per visit, pauses when backgrounded, and persists only an explicit opening preference',()=>{
  const map=new Map([['luna-story-seen-v2','true']]),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const s=new StorySequence(storage);assert.equal(s.start(),true);
  s.update(.1,true);assert.equal(s.elapsed,0);
  const shots=new Set();for(let i=0;i<STORY_DURATION*10+1;i++){shots.add(s.chapter.shot);s.update(.1);}
  assert.equal(s.state,'finished');assert.equal(s.active,false);assert.equal(shots.size,storyChapters.length);assert.equal(s.start(),false);
  assert.equal(new StorySequence(storage).shouldPlay,true);assert.equal(map.has(STORY_KEY),false);
  s.setEnabled(false);assert.equal(new StorySequence(storage).shouldPlay,false);s.setEnabled(true);assert.equal(new StorySequence(storage).shouldPlay,true);assert.equal(s.start(),false);
  const t=new StorySequence({getItem:()=>null,setItem:()=>{throw Error('blocked');}});assert.equal(t.start(),true);t.finish(true);assert.equal(t.state,'skipped');assert.equal(t.start(),false);
  const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/<video\b|id="story-play"|id="story-replay"/);
});
test('camera makes a full 360 degree orbit, changes elevation and retains the equipment inspection target',()=>{
  const m=new TrainingMission(data('terrain'),data('mission'),data('ephemerides'),data('academy'));
  const r=Object.assign(Object.create(Renderer.prototype),{mission:m,camera:new THREE.PerspectiveCamera(49,1,.15,3000),focus:new THREE.Vector3(),sun:new THREE.DirectionalLight(),yaw:0,pitch:.65,zoom:1.2,reducedMotion:true,cameraPinned:{...m.objects.base},routeDistance:54,follow:false});
  const positions=[];for(let i=0;i<8;i++){r.yaw=i*Math.PI/4;r.updateCamera(.1);positions.push(r.camera.position.clone());assert.ok(r.camera.position.toArray().every(Number.isFinite));assert.deepEqual(r.cameraPinned,m.objects.base);}
  const target=r.world(m.objects.base,2.8);assert.ok(positions[0].z>target.z&&positions[4].z<target.z);assert.ok(positions[2].x>target.x&&positions[6].x<target.x);
  r.rotateCamera(0,-100);r.updateCamera(.1);const low=r.camera.position.y;r.rotateCamera(0,100);r.updateCamera(.1);assert.ok(r.camera.position.y>low);assert.ok(r.pitch<Math.PI/2);
  r.resetCamera();assert.equal(r.cameraPinned,null);assert.equal(r.follow,true);
});
function cameraFixture(){
  const m=new TrainingMission(data('terrain'),data('mission'),data('ephemerides'),data('academy'));
  return Object.assign(Object.create(Renderer.prototype),{mission:m,camera:new THREE.PerspectiveCamera(49,1000/720,.15,3000),focus:new THREE.Vector3(),sun:new THREE.DirectionalLight(),yaw:0,pitch:.65,lookYaw:Math.PI,lookPitch:0,perspective:'third-person',zoom:1.2,width:1000,height:720,reducedMotion:true,cameraPinned:null,cameraFocusHeight:2.8,follow:true});
}
test('helmet camera stays at visor height and movement follows all eight viewing bearings',()=>{
  const r=cameraFixture(),m=r.mission;r.setPerspective('first-person');assert.equal(r.camera.fov,72);
  const player=JSON.stringify(m.state.player);
  for(let i=0;i<8;i++){
    r.lookYaw=i*Math.PI/4;r.lookPitch=.3;r.updateCamera(.1);
    assert.ok(r.camera.position.distanceTo(r.world(m.state.player,4.25))<1e-8);
    const direction=r.camera.getWorldDirection(new THREE.Vector3()),forward=r.inputVector(0,-1),right=r.inputVector(1,0);
    assert.ok(direction.x*forward.dx+direction.z*forward.dy>.95);assert.ok(Math.abs(forward.dx*right.dx+forward.dy*right.dy)<1e-8);
    assert.equal(r.follow,true);assert.equal(r.cameraPinned,null);
  }
  r.rotateCamera(Math.PI*4,100);r.updateCamera(.1);assert.ok(r.camera.getWorldDirection(new THREE.Vector3()).y>.98);
  r.rotateCamera(0,-200);r.updateCamera(.1);assert.ok(r.camera.getWorldDirection(new THREE.Vector3()).y<-.98);
  assert.equal(JSON.stringify(m.state.player),player);
  m.state.player.jump=2;r.updateCamera(.1);assert.ok(r.camera.position.distanceTo(r.world(m.state.player,6.65))<1e-8);
  r.setPerspective('third-person');assert.equal(r.camera.fov,49);
});
test('show objective turns the helmet toward the actual target without moving the astronaut',()=>{
  const r=cameraFixture(),m=r.mission;r.setPerspective('first-person');const player=JSON.stringify(m.state.player);r.lookYaw=0;r.lookPitch=-1;r.showObjective();
  const direction=r.world(m.target(),4).sub(r.camera.position).normalize();assert.ok(r.camera.getWorldDirection(new THREE.Vector3()).dot(direction)>.999999);assert.equal(JSON.stringify(m.state.player),player);
  r.setPerspective('third-person');r.showObjective();assert.deepEqual(r.cameraPinned,m.target());r.rotateCamera(Math.PI*2,.1);r.updateCamera(.1);assert.deepEqual(r.cameraPinned,m.target());assert.equal(r.follow,false);
});
test('terrain panning releases follow, stays inside the crop, and does not change mission position',()=>{
  const r=cameraFixture(),player=JSON.stringify(r.mission.state.player);r.updateCamera(0);const focus=r.focus.clone();r.panCamera(200,-100);
  assert.ok(r.focus.distanceTo(focus)>1);assert.equal(r.follow,false);assert.ok(r.cameraPinned);assert.equal(JSON.stringify(r.mission.state.player),player);
  r.panCamera(1e8,1e8);assert.ok(r.mission.terrain.inBounds(r.cameraPinned.x,r.cameraPinned.y));
  r.setPerspective('first-person');const eye=r.camera.position.clone();r.panCamera(200,100);assert.equal(r.cameraPinned,null);assert.ok(r.camera.position.distanceTo(eye)<1e-8);
});
test('overview frames the astronaut and current objective across ten levels at desktop and phone aspect ratios',()=>{
  const r=cameraFixture(),m=r.mission;m.unlocked=9;
  for(let level=0;level<10;level++)for(const aspect of [1000/720,390/650]){
    m.loadLevel(level);r.camera.aspect=aspect;r.camera.updateProjectionMatrix();r.showOverview();r.camera.updateMatrixWorld(true);
    for(const point of [m.state.player,m.target()]){
      const p=r.world(point,3).project(r.camera);assert.ok(Math.abs(p.x)<.7&&Math.abs(p.y)<.7&&p.z>-1&&p.z<1,`Level ${level+1}, aspect ${aspect}: ${p.toArray()}`);
    }
    assert.equal(r.perspective,'third-person');assert.equal(r.follow,false);
  }
});
test('astronaut view hides its own visor while keeping the surrounding opaque equipment visible',()=>{
  const r=cameraFixture(),mat=makeMaterials();Object.assign(r,{mat,player:createAstronaut(mat),rover:createRover(mat),models:new Map([['habitat',createHabitat(mat)]]),marker:new THREE.Object3D(),surveys:[],satellite:new THREE.Object3D(),stepPhase:0,updateTrainingModels(){}});
  r.setPerspective('first-person');r.updateActors(0);assert.equal(r.player.visible,false);assert.equal(r.models.get('habitat').visible,true);
  r.setPerspective('third-person');r.updateActors(0);assert.equal(r.player.visible,true);
});
test('live equipment controls move the actual meshes and demonstrations keep task state unchanged',()=>{
  const m=new TrainingMission(data('terrain'),data('mission'),data('ephemerides'),data('academy'));m.unlocked=9;const mat=makeMaterials();
  const r=Object.assign(Object.create(Renderer.prototype),{mission:m,mat,reducedMotion:true,frameTime:10,models:new Map([['solar',createSolar(mat)],['airlock',createAirlock(mat)],['relay',createRelay(mat)],['lab',createTrainingBench(mat)]]),fieldSample:new THREE.Object3D(),carriedSample:new THREE.Object3D(),roverCargo:new THREE.Object3D(),deliveredCargo:new THREE.Object3D()});
  m.loadLevel(5);m.start();m.adjustDrill('tilt',35);m.adjustDrill('bearing',110);r.updateTrainingModels(0,10);assert.ok(Math.abs(r.models.get('solar').userData.pivot.rotation.x-35*Math.PI/180)<1e-8);
  const state=JSON.stringify(m.state);r.demonstrateTraining();r.updateTrainingModels(.1,13);assert.equal(JSON.stringify(m.state),state);r.updateTrainingModels(.1,18);assert.equal(r.demonstration,null);
  m.loadLevel(6);m.start();for(const a of ['check-suit','seal-inner','vent','open-outer'])m.performDrill(a);r.updateTrainingModels(0,20);assert.equal(r.models.get('airlock').userData.door.position.z,3.4);assert.ok(Math.abs(r.models.get('airlock').userData.pressure.scale.y-.01)<1e-8);
  m.loadLevel(7);m.start();m.state.training.drill.collected=true;m.performDrill('tag-sample');m.performDrill('seal-sample');m.performDrill('stow-sample');r.updateTrainingModels(0,21);assert.equal(r.models.get('lab').userData.canister.visible,true);assert.equal(r.models.get('lab').userData.identity.material,mat.cyan);assert.equal(r.models.get('lab').userData.lid.rotation.x,0);
  m.loadLevel(8);m.start();Object.assign(m.state.player,m.objects.relay);m.adjustDrill('tilt',32);m.adjustDrill('bearing',72);r.updateTrainingModels(0,21);const direction=new THREE.Vector3(0,1,0).applyQuaternion(r.models.get('relay').userData.dish.quaternion);m.adjustDrill('bearing',162);r.updateTrainingModels(0,21);assert.ok(direction.dot(new THREE.Vector3(0,1,0).applyQuaternion(r.models.get('relay').userData.dish.quaternion))<.95,'Bearing must change the physical dish direction, not just spin its symmetric bowl');
  m.loadLevel(9);m.start();m.performDrill('load-cargo');r.updateTrainingModels(0,22);assert.equal(r.roverCargo.visible,true);assert.equal(r.deliveredCargo.visible,false);m.state.training.drill.delivered=true;r.updateTrainingModels(0,23);assert.equal(r.roverCargo.visible,false);assert.equal(r.deliveredCargo.visible,true);
});
