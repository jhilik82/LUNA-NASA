import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDestinationMission } from '../dist/worlds.js';
import { ASTRA_TOOLS, ASTRA_TOOL_NAMES, runAstraTool, createAstraMissionView, astraMonitor, createAstraMonitor } from '../dist/astra-tools.js';

const pack={};
for(const [key,file] of Object.entries({terrain:'terrain',config:'mission',ephemerides:'ephemerides',academy:'academy',marsTerrain:'terrain-mars',solar:'solar-system',tranquillitatis:'terrain-tranquillitatis',astronomy:'astronomy',stars:'stars',scenarios:'scenarios'}))pack[key]=JSON.parse(fs.readFileSync(new URL(`../dist/data/${file}.json`,import.meta.url)));
const storage=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};
const create=world=>createDestinationMission(pack,world,storage(),'expedition');

test('ASTRA registry exposes only read, preview and UI capabilities',()=>{
  assert.deepEqual(ASTRA_TOOL_NAMES,['getMissionState','previewDecision','estimateRoute','explainAssumption','highlightObjective','openPanel']);
  for(const tool of Object.values(ASTRA_TOOLS))assert.ok(['read','preview','ui'].includes(tool.kind));
  assert.doesNotMatch(ASTRA_TOOL_NAMES.join(' '),/confirm|apply|complete|setResource|save|checkpoint/i);
  assert.equal(createAstraMissionView(create('moon')).choose,undefined);
});

for(const world of ['moon','mars'])test(`ASTRA tools preserve complete ${world} mission state`,()=>{
  const m=create(world),before=structuredClone(m.state);
  runAstraTool('getMissionState',m);
  runAstraTool('previewDecision',m,{id:m.stage.options[0].id});
  runAstraTool('estimateRoute',m,{target:'route to objective'});
  runAstraTool('explainAssumption',m,{key:'resourceModel'});
  runAstraTool('highlightObjective',m,{id:'objective'});
  runAstraTool('openPanel',m,{id:'astra'});
  assert.deepEqual(m.state,before);
});

test('ASTRA mission facade returns snapshots and never exposes procedure or save methods',()=>{
  const m=create('moon'),view=createAstraMissionView(m),state=view.state;
  assert.equal(view.performTask,undefined);assert.equal(view.completeRepair,undefined);assert.equal(view.choose,undefined);assert.equal(view.saveCheckpoint,undefined);
  state.suit.oxygenMinutes=-1;assert.notEqual(m.state.oxygen,-1);
});

test('monitor thresholds are authored, deduplicable by advisory id and world-specific',()=>{
  const moon=create('moon'),mars=create('mars');
  moon.state.expedition.outpost.energy=1;moon.state.expedition.outpost.radiationRate=4;moon.state.expedition.outpost.shield='none';
  mars.state.expedition.outpost.energy=50;mars.state.expedition.outpost.radiationRate=0;
  const a=astraMonitor(moon,100),b=astraMonitor(mars,100);
  assert.ok(a.some(x=>x.severity==='warning'));assert.notDeepEqual(a.map(x=>x.id),b.map(x=>x.id));
});

test('monitor warns from training suit return margins as well as expedition habitat state',()=>{
  const m=create('moon');m.state.oxygen=0.1;
  assert.ok(astraMonitor(m).some(x=>x.id==='return-margin'&&x.severity==='warning'));
});

test('a preview followed by player confirmation applies the effects exactly once',()=>{
  const m=create('moon');m.start();m.state.player={...m.target()};m.state.expedition.taskDone=true;
  const option=m.stage.options[0],preview=runAstraTool('previewDecision',m,{id:option.id});
  assert.ok(preview);assert.equal(m.state.expedition.decisions.length,0);
  assert.equal(m.choose(option.id),true);
  assert.equal(m.state.expedition.decisions.length,1);
  assert.deepEqual(m.state.expedition.outpost,preview.outpost);
  const after=structuredClone(m.state);assert.equal(m.choose(option.id),false);assert.deepEqual(m.state,after);
});

test('ASTRA cannot advance an ordered task and quiet mode retains only warnings',()=>{
  const m=create('mars'),phase=m.state.expedition.taskPhase,monitor=createAstraMonitor({cooldownMs:1000});
  runAstraTool('getMissionState',m);runAstraTool('explainAssumption',m,{key:'resourceModel'});
  assert.equal(m.state.expedition.taskPhase,phase);
  assert.deepEqual(monitor.check(m,0,{guidance:'quiet'}).filter(x=>x.severity!=='warning'),[]);
  m.state.expedition.outpost.energy=1;
  const first=monitor.check(m,10,{guidance:'quiet'}),second=monitor.check(m,11,{guidance:'quiet'});
  assert.ok(first.some(x=>x.severity==='warning'));assert.deepEqual(second,[]);
  assert.ok(monitor.check(m,2000,{guidance:'quiet'}).some(x=>x.severity==='warning'));
});
