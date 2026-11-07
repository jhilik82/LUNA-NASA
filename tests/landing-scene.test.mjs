import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {AstronomicalWorld} from '../dist/astronomy-world.js';
import {createDestinationMission} from '../dist/worlds.js';
import {FlightSimulation} from '../dist/voyage.js';
import {Renderer} from '../dist/render-3d.js';
import {FlightRenderer} from '../dist/flight-renderer.js';
import {landingFrame} from '../dist/landing-scene.js';
import {isOccupied} from '../dist/world-layout.js';

const names={terrain:'terrain',config:'mission',ephemerides:'ephemerides',academy:'academy',marsTerrain:'terrain-mars',solar:'solar-system',tranquillitatis:'terrain-tranquillitatis',astronomy:'astronomy',stars:'stars',scenarios:'scenarios'};
const pack=Object.fromEntries(Object.entries(names).map(([k,n])=>[k,JSON.parse(fs.readFileSync(new URL('../dist/data/'+n+'.json',import.meta.url)))]));
function scene(destination){
  const a=new AstronomicalWorld(pack.astronomy,pack.stars),f=new FlightSimulation(pack.solar,a);f.select(destination);a.setMissionUTC(f.departureUTC+600+f.plan.durationSeconds);
  const m=createDestinationMission(pack,destination,null,'expedition',a),ctx=new Proxy({measureText:s=>({width:s.length*8}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})}),createCanvas=(width,height)=>({width,height,getContext:()=>ctx});
  const device={shadowMap:{},setClearColor(){},setPixelRatio(){},setSize(){},dispose(){},render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true);this.rendered=s;this.camera=c;this.atRender?.(s,c);}};
  const r=new Renderer(createCanvas(1404,667),m,{createCanvas,device}),v=new FlightRenderer(r,f,pack.solar);r.resize(1404,667);return {a,m,r,f,v,device};
}

for(const destination of ['moon','mars'])test(destination+' approach renders the real destination, follows altitude and seats each foot on the same terrain',()=>{
  const {m,r,f,v,device}=scene(destination),state=JSON.stringify(m.state),u=r.unitsPerMetre;
  assert.equal(isOccupied(r.landingPoint,[...m.props,...m.naturalColliders],7/m.terrain.cell),false,'landing envelope clears equipment and geology');
  assert.equal(r.apron.userData.extentMetres,30000);assert.equal(r.apron.userData.measured,false);
  assert.equal(v.scene.getObjectByName('arrival-pad-ground'),undefined);
  for(const [phase,elapsed]of [['capture',0],['capture',7.9],['speed',0],['angle',0],['descent',0],['descent',8],['descent',11.5],['landed',0]]){
    f.enter(phase);f.elapsed=elapsed;f.speedLocked=2;f.angleLocked=3;v.draw();
    if(phase==='capture'&&elapsed===0){assert.equal(device.rendered,v.scene,'capture above the surface uses the orbital view');continue;}
    assert.equal(device.rendered,r.scene,'final approach borrows the actual surface scene');
    assert.ok(Math.abs((r.lander.position.y-r.landingOrigin.y)/u+.03-f.telemetry().altitudeM)<1e-8,'visual altitude matches the live instrument');
    assert.equal(r.cinemaGroup.visible,false,'surface-play visibility is restored after rendering');assert.equal(JSON.stringify(m.state),state,'rendering does not drain or mutate the mission');
  }
  for(const leg of r.lander.userData.legs){const pad=leg.getObjectByName('landing-foot'),bottom=pad.localToWorld(new THREE.Vector3(0,-.13,0)),p={x:bottom.x/8+(m.terrain.width-1)/2,y:bottom.z/8+(m.terrain.height-1)/2};assert.ok(Math.abs(bottom.y-r.world(p).y)/u<.001,'each disc touches the terrain instead of floating');const hits=new THREE.Raycaster(bottom.clone().add(new THREE.Vector3(0,3*u,0)),new THREE.Vector3(0,-1,0)).intersectObjects([r.ground,...r.terrainPatches]);assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-bottom.y)/u<.10,'rendered triangles and analytic contact agree');}
  r.showLandedCraft();assert.equal(r.cinemaGroup.visible,true);assert.equal(r.lander.visible,true);assert.equal(isOccupied(r.landingPoint,m.colliders(),m.bodyRadius),true,'surface walking cannot pass through the parked lander');assert.equal(isOccupied(m.state.player,m.colliders(),m.bodyRadius),false);const landing=m.landingColliders[0];r.showLandedCraft();assert.equal(m.landingColliders.length,1,'repeated handoff does not duplicate collision envelopes');assert.deepEqual(m.landingColliders[0],landing);
  v.dispose();r.dispose();
});

for(const destination of ['moon','mars'])test(destination+' landing camera orbits all sides, frames the complete craft and reuses the physical cockpit',()=>{
  const {m,r,f,v,device}=scene(destination),state=JSON.stringify(m.state);f.enter('speed');const skyCamera=r.surfaceSky.camera,skyView=r.surfaceSky.getView,cockpitParent=v.cockpit.parent,cockpitPosition=v.cockpit.position.clone(),cockpitScale=v.cockpit.scale.clone();
  for(const [width,height]of [[1404,667],[1000,720],[1000,490],[390,900],[390,650],[390,500]]){
    r.resize(width,height);const frame=landingFrame(width,height);
    for(const pitch of [-.65,0,.9])for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI*2]){
      v.lookYaw=yaw;v.lookPitch=pitch;v.draw();const bounds=new THREE.Box3().setFromObject(r.lander);
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const p=new THREE.Vector3(x,y,z).project(v.camera),px=(p.x+1)*width/2,py=(1-p.y)*height/2;
        assert.ok(px>=frame.left&&px<=frame.right&&py>=frame.top&&py<=frame.bottom,`${width}×${height} yaw ${yaw}: craft at ${px.toFixed(0)},${py.toFixed(0)} escapes ${JSON.stringify(frame)}`);
      }
    }
    v.lookYaw=0;v.draw();const before=v.camera.position.clone();v.rotate(Math.PI,.1);v.draw();assert.ok(before.distanceTo(v.camera.position)>20*r.unitsPerMetre);
  }
  r.resize(1404,667);v.lookYaw=v.lookPitch=0;f.cabinFlight=true;v.pilotView=true;
  for(const phase of ['speed','angle','descent','landed']){f.enter(phase);device.atRender=()=>{assert.equal(v.cockpit.parent,r.scene);assert.equal(v.cockpit.visible,true);assert.equal(v.pilot.userData.helmet.visible,false);assert.equal(r.lander.visible,false,'external pressure hull cannot cover the pilot viewport');};v.draw();assert.equal(v.cockpit.parent,cockpitParent);assert.ok(v.cockpit.position.equals(cockpitPosition));assert.ok(v.cockpit.scale.equals(cockpitScale));assert.equal(r.surfaceSky.camera,skyCamera);assert.equal(r.surfaceSky.getView,skyView);}
  assert.equal(JSON.stringify(m.state),state);device.atRender=null;f.enter('cockpit');v.draw();assert.equal(v.camera.near,.035,'launch clipping planes restore after a landing view');v.dispose();r.dispose();
});

test('landing effects use selected-world gravity and stop thrust at touchdown',()=>{
  for(const destination of ['moon','mars']){const {r,f,v,device}=scene(destination);device.atRender=()=>{assert.equal(v.surfaceLanding.effects.visible,true);assert.equal(v.surfaceLanding.plume.visible,f.phase!=='landed');};f.enter('descent');f.elapsed=9;v.draw();assert.ok(v.surfaceLanding.grains.count>0);assert.equal(v.surfaceLanding.grains.userData.gravity,destination==='moon'?1.62:3.73);const geometry=v.surfaceLanding.grains.geometry;r.reducedMotion=true;v.draw();assert.equal(v.surfaceLanding.grains.visible,false);assert.equal(v.surfaceLanding.grains.geometry,geometry);f.enter('landed');v.draw();v.dispose();r.dispose();}
});
