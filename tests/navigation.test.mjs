import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Mission, Terrain } from '../dist/engine.js';
import { resolveRouteRequest, planSurfaceRoute } from '../dist/navigation.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+n+'.json',import.meta.url)));
const mission=()=>new Mission(read('terrain'),read('mission'),read('ephemerides'));
test('ASTRA resolves named destinations, surveys, grid points, and all compass headings without moving the player',()=>{
 const m=mission(),before=JSON.stringify(m.state);
 for(const [q,target] of [['route to Echo',m.state.rover],['go home',m.objects.base],['show a path to the relay',m.objects.relay],['route to survey 2',m.science[1]],['survey 2',m.science[1]]]){
  const request=resolveRouteRequest(m,q);assert.equal(request.target.x,target.x);assert.equal(request.target.y,target.y);
  const plan=planSurfaceRoute(m,request);assert.ok(!plan.error,plan.error);assert.ok(plan.path.length);assert.ok(plan.maxGrade<=m.maxSlope());
  for(let i=1;i<plan.path.length;i++)assert.ok(m.terrain.canStep(plan.path[i-1],plan.path[i],m.maxSlope()));
 }
 const origin=m.terrain.geo(m.state.player);
 for(const d of ['north','south','east','west','north east','north west','south east','south west']){
  const r=resolveRouteRequest(m,`${d} 200 m`);assert.ok(m.terrain.inBounds(r.target.x,r.target.y));
  const geo=m.terrain.geo(r.target),lon=(geo.lon-origin.lon+540)%360-180;
  if(d.includes('north'))assert.ok(geo.lat>origin.lat);
  if(d.includes('south'))assert.ok(geo.lat<origin.lat);
  if(d.includes('east'))assert.ok(lon>0);
  if(d.includes('west'))assert.ok(lon<0);
 }
 assert.deepEqual(resolveRouteRequest(m,'x 25 y 40').target,{x:25,y:40});assert.equal(JSON.stringify(m.state),before);assert.equal(m.route,null);
});
test('ASTRA honours coverage boundaries and separates orbit questions from lunar routes',()=>{
 const m=mission(),r=resolveRouteRequest(m,'north 100 km');assert.equal(r.clipped,true);assert.ok(m.terrain.inBounds(r.target.x,r.target.y));
 assert.ok(resolveRouteRequest(m,'x -3 y 90').error);assert.ok(resolveRouteRequest(m,'north -20 m').error);
 assert.ok(resolveRouteRequest(m,'route to Mars').error);assert.equal(resolveRouteRequest(m,'Where are the satellites and planets?'),null);
 assert.equal(resolveRouteRequest(m,'Is my return reserve safe?'),null);assert.ok(resolveRouteRequest(m,'plot route').error);
});
test('ASTRA reports a real slope barrier instead of fabricating a traversable path',()=>{
 const m=mission();m.terrain=new Terrain({width:9,height:9,cellMetres:40,heights:Array.from({length:81},(_,i)=>i%9>=5?1000:0),projection:{x0:10000,y0:10000,radiusMetres:1737400}});
 m.state.player={x:2,y:4};m.objects.base={x:2,y:4};
 const result=planSurfaceRoute(m,{target:{x:7,y:4},label:'Across the cliff'});assert.match(result.error,/No traversable path/);assert.equal(result.path,undefined);assert.equal(m.route,null);
});
test('journey plus return estimates react to depleted resources and stricter rover equipment',()=>{
 const m=mission(),request=resolveRouteRequest(m,'route to Echo'),walk=planSurfaceRoute(m,request);assert.equal(walk.safe,true);
 m.state.oxygen=.01;assert.equal(planSurfaceRoute(m,request).safe,false);m.state.oxygen=m.config.suit.oxygenMinutes;
 m.state.rover.occupied=true;m.state.rover.wh=m.config.rover.recoveryWh;const drive=planSurfaceRoute(m,request);
 assert.ok(!drive.error,drive.error);assert.ok(drive.maxGrade<=m.config.roverMaxSlopeDegrees);assert.ok(drive.minutes<walk.minutes);assert.ok(drive.roverNeed>0);
});
