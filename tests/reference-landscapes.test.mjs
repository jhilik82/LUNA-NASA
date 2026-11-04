import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { Terrain } from '../dist/engine.js';
import { createDestinationMission } from '../dist/worlds.js';
import { AstronomicalWorld } from '../dist/astronomy-world.js';
import { Renderer } from '../dist/render-3d.js';
import { isOccupied, segmentBlocked } from '../dist/world-layout.js';

const names={terrain:'terrain',config:'mission',ephemerides:'ephemerides',academy:'academy',marsTerrain:'terrain-mars',solar:'solar-system',tranquillitatis:'terrain-tranquillitatis',astronomy:'astronomy',stars:'stars',scenarios:'scenarios'};
const pack=Object.fromEntries(Object.entries(names).map(([k,n])=>[k,JSON.parse(fs.readFileSync(new URL('../dist/data/'+n+'.json',import.meta.url)))]));
const mission=world=>createDestinationMission(pack,world,null,'expedition',new AstronomicalWorld(pack.astronomy,pack.stars));
const ctx=new Proxy({measureText:s=>({width:s.length*8}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
const createCanvas=(width,height)=>({width,height,getContext:()=>ctx});
const device=()=>({shadowMap:{},setClearColor(){},setPixelRatio(){},setSize(){},render(){},dispose(){}});

for(const world of ['moon','mars'])test(world+' reference relief leaves source samples intact, preserves equipment pads and blocks solid geology',()=>{
  const m=mission(world),t=m.terrain,l=m.landscape,original=new Terrain(t.data),saved=t.data.heights.slice();
  for(let y=0;y<t.height;y+=4.7)for(let x=0;x<t.width;x+=4.3)assert.equal(t.measuredHeightAt(x,y),original.heightAt(x,y));
  assert.deepEqual(t.data.heights,saved);
  for(const p of m.props)for(const dx of [-1,0,1])for(const dy of [-1,0,1])assert.ok(Math.abs(t.heightAt(p.x+dx*p.halfX,p.y+dy*p.halfY)-t.measuredHeightAt(p.x+dx*p.halfX,p.y+dy*p.halfY))<1e-9,'reference features leave equipment foundations on their measured pads');
  assert.ok(l.clasts.length>30);assert.equal(m.naturalColliders.length,l.clasts.length);
  const c=l.clasts[0],point=l.grid(c);assert.equal(isOccupied(point,m.colliders(),m.bodyRadius),true);
  assert.equal(segmentBlocked(l.grid({x:c.x-c.radius-3,z:c.z}),l.grid({x:c.x+c.radius+3,z:c.z}),m.colliders(),m.bodyRadius),true,'a long step cannot tunnel through an outcrop');
  if(world==='moon'){
    const f=l.features[0],centre=l.grid(f),rim=l.grid({x:f.x+f.r,z:f.z});assert.ok(l.height(centre.x,centre.y)<-2);assert.ok(l.height(rim.x,rim.y)>.8,'crater rim is geometric relief');
    const a=l.grid({x:-90,z:-56}),b=l.grid({x:-90,z:-88}),average=Math.atan2(Math.abs(t.heightAt(a.x,a.y)-t.heightAt(b.x,b.y)),32)*180/Math.PI;
    assert.ok(average<35);assert.ok(t.slope(a,b)>35,'navigation checks interior cliff grades rather than just the endpoints');assert.equal(t.canStep(a,b,35),false);
    assert.ok(!l.features.some(f=>['dune','mesa','channel'].includes(f.kind)));
  }else{
    const channel=l.features.find(f=>f.kind==='channel'),p=l.grid(channel);assert.ok(l.height(p.x,p.y)<-2.7);
    const mesa=l.features.find(f=>f.kind==='mesa'),q=l.grid(mesa);assert.ok(l.height(q.x,q.y)>30);
    assert.ok(l.features.some(f=>f.kind==='dune'));assert.ok(!l.features.some(f=>f.kind==='crater'));
  }
});

for(const world of ['moon','mars'])test(world+' reconstructed meshes are opaque, metre-scaled, pickable and aligned with the same walkable surface',()=>{
  const m=mission(world),r=new Renderer(createCanvas(1000,720),m,{createCanvas,device:device()}),u=r.unitsPerMetre;
  assert.ok(r.terrainPatches.length>=3);assert.ok(r.terrainPatches[0].geometry.attributes.position.count>60000,'near-field landforms have enough vertices to form craters and banks');
  for(const patch of r.terrainPatches){const p=patch.geometry.attributes.position;for(let i=0;i<p.count;i+=301){const x=p.getX(i)/8+(m.terrain.width-1)/2,y=p.getZ(i)/8+(m.terrain.height-1)/2;assert.ok(Math.abs(p.getY(i)-r.world({x,y}).y)<.001);}assert.equal(patch.material.depthWrite,true);assert.equal(patch.material.transparent,false);}
  const point=m.landscape.grid({x:-38,z:30}),ground=r.world(point),hits=new THREE.Raycaster(ground.clone().add(new THREE.Vector3(0,30*u,0)),new THREE.Vector3(0,-1,0)).intersectObjects([r.ground,...r.terrainPatches]);
  assert.ok(hits.length>0);assert.ok(r.terrainPatches.includes(hits[0].object),'the coarse grid has an actual hole under the detailed patch');assert.ok(Math.abs(hits[0].point.y-ground.y)/u<.10);
  r.camera.position.copy(ground).add(new THREE.Vector3(0,30*u,1*u));r.camera.lookAt(ground);r.camera.updateMatrixWorld(true);const screen=r.toScreen(point),pick=r.fromScreen(screen.x,screen.y);assert.ok(pick&&Math.hypot(pick.x-point.x,pick.y-point.y)*m.terrain.cell<.2,'clicking the reconstructed surface plots the right world coordinate');
  assert.equal(r.geology.children.length,m.naturalColliders.length);for(const rock of r.geology.children){assert.equal(rock.material.depthWrite,true);assert.equal(rock.material.transparent,false);assert.ok(rock.userData.collider);}
  if(world==='mars'){const rock=r.geology.children[0],levels=new Set(Array.from(rock.geometry.attributes.position.array).filter((_,i)=>i%3===1).map(x=>x.toFixed(3)));assert.ok(levels.size>=8,'sediment layers have real exposed plate edges');assert.ok(r.rover.getObjectByName('martian-science-mast'));}
  else assert.ok(r.models.get('habitat').getObjectByName('ribbed-lunar-inflatable-module'));
  const habitat=new THREE.Box3().setFromObject(r.models.get('habitat')).getSize(new THREE.Vector3()).divideScalar(u);assert.ok(habitat.x<=16.81&&habitat.z<=11.53,'habitat shells fit their collision envelope');
  r.setElevation(true);r.setElevation(false);for(const patch of r.terrainPatches)assert.deepEqual(patch.geometry.attributes.color.array,patch.userData.baseColors);
  r.dispose();
});
