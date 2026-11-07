import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {AstronomicalWorld,angularDiameter,exposureProfile,terrainHorizon} from '../dist/astronomy-world.js';import {FlightSimulation} from '../dist/voyage.js';import {Terrain} from '../dist/engine.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+name+'.json',import.meta.url))),data=read('astronomy'),stars=read('stars');
test('independent JPL Moon/Mars observer checks agree with the shared vector world',()=>{
 const a=new AstronomicalWorld(data,stars);for(const checks of [data.validation,data.validationArrival])for(const world of ['moon','mars']){const check=checks[world];for(const row of check.samples){a.setMissionUTC(row[0]);const b=a.apparent(check.name,a.observer(world));assert.ok(Math.abs(b.altitude-row[2])<.004);assert.ok(Math.abs(b.distanceKm-row[4])<100);assert.ok(Math.abs(b.diameterArcsec-row[3])/row[3]<.002);}}
});
test('editable UTC is confined to exploration; closing restores the internally consistent mission clock',()=>{
 const a=new AstronomicalWorld(data,stars),start=a.utc;assert.equal(a.setUTC(start+86400),false);a.beginExploration();assert.equal(a.setUTC(start+3*86400),true);a.rate=3600;a.advance(2);assert.equal(a.utc,start+3*86400+7200);assert.equal(a.setUTC('2040-01-01T00:00:00Z'),false);a.endExploration();assert.equal(a.utc,start);assert.equal(a.mode,'mission');
});
test('Earth has a physical disk from the lunar near side and is occulted by the far-side horizon',()=>{
 const a=new AstronomicalWorld(data,stars),near=a.sky('moon').bodies.find(b=>b.name==='Earth'),far=a.sky('moon',{lat:0,lon:203.47297,elevation:0}).bodies.find(b=>b.name==='Earth');assert.ok(near.diameterDeg>1.7&&near.diameterDeg<2.1);assert.ok(near.visible);assert.ok(far.altitude<0);assert.equal(far.visible,false);const mars=a.sky('mars').bodies.find(b=>b.name==='Earth');assert.ok(mars.diameterArcsec<15);assert.equal(mars.resolved,false);assert.ok(angularDiameter(6378.137,384400)>1.8);
});
test('planet phases, angular scales and catalogue exposure respond to observer and UTC',()=>{
 const a=new AstronomicalWorld(data,stars);assert.ok(stars.stars.length>5000);assert.ok(data.bodies.Phobos&&data.bodies.Titan&&data.bodies.Eris&&data.bodies.Halley);const sky=a.sky('moon');for(const b of sky.bodies){assert.ok(b.illuminated>=0&&b.illuminated<=1);assert.ok(b.diameterDeg>0);assert.ok(b.lightSeconds>0);}const dark=exposureProfile({sunAltitude:-20}),day=exposureProfile({sunAltitude:30}),dust=exposureProfile({sunAltitude:-20,dust:1});assert.ok(day.limitingMagnitude<dark.limitingMagnitude);assert.ok(dust.limitingMagnitude<dark.limitingMagnitude);assert.equal(exposureProfile({sunAltitude:30,enhanced:true}).enhanced,true);
});
test('terrain horizon blocks bodies behind a measured ridge and dimensions stay in metres',()=>{
 const terrain=new Terrain({width:5,height:5,cellMetres:10,heights:[0,0,0,0,0,0,30,30,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],projection:{}});assert.ok(terrainHorizon(terrain,{x:2,y:3},0)>20);const lunar=read('terrain-tranquillitatis');assert.ok(lunar.cellMetres>29&&lunar.cellMetres<30);const t=new Terrain(lunar),geo=t.geo({x:39.5,y:39.5});assert.ok(Math.abs(geo.lat-.67408)<.002);assert.ok(Math.abs(geo.lon-23.47297)<.002);
});
test('shared flight follows the UTC world through a real mid-cruise decision and controlled landing',()=>{
 const a=new AstronomicalWorld(data,stars),f=new FlightSimulation(read('solar-system'),a);f.select('mars');assert.match(f.plan.epoch,/2026-10-05/);f.board();for(let i=0;i<61;i++)f.update(.1);assert.equal(f.phase,'cockpit');f.launch();for(let i=0;i<700;i++)f.update(.1);assert.equal(f.phase,'transfer');assert.equal(f.flightEvent.resolved,false);assert.equal(f.skipSegment(),false);assert.equal(f.resolveEvent('backup'),true);assert.equal(f.skipSegment(),true);assert.equal(f.phase,'capture');assert.equal(f.skipSegment(),true);f.elapsed=.63;f.lock();f.elapsed=.23;f.lock();assert.equal(f.phase,'descent');for(let i=0;i<121;i++)f.update(.1);assert.equal(f.phase,'landed');assert.equal(f.disembark(),true);assert.equal(f.flightCount,1);
});
