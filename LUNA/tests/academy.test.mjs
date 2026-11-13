import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TrainingMission } from '../dist/academy.js';
import { AcademyGuide } from '../dist/academy-guide.js';
import { isOccupied } from '../dist/world-layout.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+name+'.json',import.meta.url)));
const data=['terrain','mission','ephemerides','academy'].map(read);
const create=storage=>new TrainingMission(...data,storage);
function travel(m,point) {
  assert.equal(m.navigate(point),true,'A real terrain route must exist to '+(point.name||'destination'));
  let guard=20000;while(m.route&&guard-->0)m.update(.1);
  assert.ok(guard>0);assert.equal(m.state.status,'playing');assert.equal(isOccupied(m.state.player,m.colliders()),false);
}
function repair(m) {
  m.interact();assert.equal(m.state.status,'repair');
  for(let i=0;i<9;i++)while(m.circuit.turns[i])m.circuit.rotate(i);
  assert.equal(m.completeRepair(),true);
}
function performLesson(m) {
  const id=m.lesson.id;m.start();
  if(id==='eva') {
    travel(m,m.practice);assert.ok(m.state.distanceMetres>=40);assert.equal(m.nextAction().command,'scan');m.scanNearby();
    assert.deepEqual(m.state.scans,[0]);travel(m,m.objects.base);m.interact();
  }
  if(id==='systems') {
    repair(m);assert.equal(m.state.training.powerBus,true);m.interact();
    assert.equal(m.applyPower({life:12,food:3,comms:2}),false);
    assert.equal(m.applyPower({life:3,food:3,comms:2}),false);
    assert.equal(m.applyPower({life:4,food:3,comms:2}),true);assert.equal(m.state.training.power.reserve,3);
  }
  if(id==='recovery') {
    travel(m,m.objects.relay);repair(m);travel(m,m.state.rover);repair(m);m.interact();assert.equal(m.state.rover.occupied,true);
    travel(m,m.objects.base);m.interact();
  }
  if(id==='science') {
    m.interact();assert.equal(m.state.rover.occupied,true);
    for(const site of m.science){travel(m,site);m.scanNearby();}
    assert.equal(m.state.scans.length,2);assert.equal(m.state.training.phase,'track');
    assert.equal(m.inspect('Mars'),false);assert.equal(m.inspect('Earth'),true);assert.equal(m.inspect('LRO'),true);
    assert.deepEqual(m.state.training.inspected,['Earth','LRO']);assert.equal(m.state.training.phase,'return');
    travel(m,m.objects.base);m.interact();
  }
  if(id==='shelter') {
    assert.equal(m.applyPower({life:4,food:2,comms:1},true),false,'Shelter control is unavailable from the field');
    travel(m,m.objects.base);m.interact();assert.ok(m.events.some(e=>e.type==='systems'&&e.emergency));
    assert.equal(m.applyPower({life:4,food:2,comms:1},false),false,'Crew must seal the shelter');
    assert.equal(m.applyPower({life:4,food:3,comms:1},true),false,'One kW reserve is required');
    assert.equal(m.applyPower({life:4,food:2,comms:1},true),true);
  }
  if(id==='solar'||id==='comms'){
    if(id==='comms')travel(m,m.objects.relay);
    assert.equal(m.performDrill('connect-'+id),false,'Misaligned equipment cannot be commissioned');
    assert.equal(m.adjustDrill('tilt',id==='solar'?35:32),true);assert.equal(m.adjustDrill('bearing',id==='solar'?110:72),true);
    assert.equal(m.performDrill('connect-'+id),true);
  }
  if(id==='airlock'){
    assert.equal(m.performDrill('open-outer'),false);assert.equal(m.performDrill('vent'),false);
    for(const action of ['check-suit','seal-inner','vent','open-outer'])assert.equal(m.performDrill(action),true,action);
    assert.equal(m.state.training.drill.pressure,0);assert.equal(m.state.training.inside,false);
  }
  if(id==='samples'){
    assert.equal(m.performDrill('tag-sample'),false);travel(m,m.practice);m.interact();assert.equal(m.state.training.drill.collected,true);
    assert.equal(m.performDrill('tag-sample'),false,'The laboratory is out of reach in the field');travel(m,m.objects.base);
    assert.equal(m.performDrill('stow-sample'),false);for(const action of ['tag-sample','seal-sample','stow-sample'])assert.equal(m.performDrill(action),true);
    assert.ok(Number.isFinite(m.state.training.drill.site.elevation));
  }
  if(id==='logistics'){
    assert.equal(m.performDrill('load-cargo'),true);travel(m,m.state.rover);m.interact();assert.equal(m.state.rover.occupied,true);
    travel(m,m.practice);assert.equal(m.nearby().type,'cargo-delivery');m.interact();assert.equal(m.state.training.drill.delivered,true);assert.equal(m.state.status,'playing');
    travel(m,m.objects.base);assert.equal(m.nearby().type,'training-dock');m.interact();
  }
  assert.equal(m.state.status,'complete',id+' field task completes');
}
test('all ten lessons complete through real field and equipment actions, unlocking the next lesson without a quiz',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},m=create(storage),guide=new AcademyGuide(m,storage);
  assert.equal(m.loadLevel(1),false);assert.equal(m.qualify(0).correct,false);
  for(let i=0;i<10;i++) {
    assert.equal(m.levelIndex,i);assert.equal(isOccupied(m.state.player,m.colliders()),false);guide.forLevel();assert.equal(guide.active,true);
    performLesson(m);guide.sync(m);assert.equal(guide.active,false);
    assert.equal(m.completed.length,i+1);assert.equal(m.xp,(i+1)*300);assert.equal(m.unlocked,Math.min(9,i+1));
    assert.equal(m.qualify((m.lesson.correct+1)%3).correct,false);assert.equal(m.unlocked,Math.min(9,i+1));
    assert.equal(m.nextAction().command,'advance');
    if(i<9)assert.equal(m.nextLevel(),true);
  }
  assert.equal(m.courseComplete,true);assert.equal(m.rank,'Qualified Junior Astronaut');assert.equal(m.nextLevel(),false);
  const restored=create(storage);assert.equal(restored.levelIndex,9);assert.equal(restored.unlocked,9);assert.equal(restored.rank,m.rank);assert.equal(restored.xp,3000);
  assert.equal(restored.loadLevel(0),true);assert.equal(restored.rank,'Qualified Junior Astronaut','Replaying a beginner lesson does not demote the cadet');
});
test('optional review adds its bonus once and replay does not duplicate a field award',()=>{
  const m=create(null);performLesson(m);assert.equal(m.xp,300);
  assert.equal(m.qualify(m.lesson.correct).correct,true);assert.equal(m.xp,400);
  m.qualify(m.lesson.correct);assert.equal(m.xp,400);
  m.reset();performLesson(m);assert.equal(m.xp,400);assert.equal(m.completed.length,1);assert.equal(m.nextLevel(),true);
});
test('equipment controls reject remote actions, invalid angles and out-of-order sample and airlock procedures',()=>{
  const m=create(null);m.unlocked=9;m.loadLevel(5);m.start();
  for(const [k,v]of [['tilt',NaN],['tilt',86],['bearing',361],['bearing',-1]])assert.equal(m.adjustDrill(k,v),false);
  travel(m,m.practice);assert.equal(m.adjustDrill('tilt',35),false);assert.equal(m.performDrill('connect-solar'),false);
  m.loadLevel(6);m.start();m.state.oxygen=0;assert.equal(m.performDrill('check-suit'),false);assert.equal(m.performDrill('seal-inner'),false);
  m.loadLevel(7);m.start();assert.equal(m.performDrill('seal-sample'),false);assert.equal(m.performDrill('stow-sample'),false);
  m.loadLevel(9);m.start();travel(m,m.practice);assert.notEqual(m.nearby()?.type,'cargo-delivery');assert.equal(m.state.training.drill.delivered,false);
});
test('failure replay retains the current lesson and its real resources while tutorial can be restored independently',()=>{
  const m=create(null),guide=new AcademyGuide(m);m.start();m.state.oxygen=.001;m.update(.1);assert.equal(m.state.status,'failed');guide.sync(m);assert.equal(guide.active,false);
  m.replayCheckpoint();guide.restart();assert.equal(m.levelIndex,0);assert.equal(m.state.status,'playing');assert.equal(m.state.oxygen,m.config.suit.oxygenMinutes);assert.equal(m.state.training.phase,'walk');
  const before=JSON.stringify(m.state);guide.disable();guide.restart();assert.equal(JSON.stringify(m.state),before);assert.equal(guide.active,true);
});
test('power plans reject invalid inputs, uncovered essential loads and insufficient reserve',()=>{
  const m=create(null);m.unlocked=4;m.loadLevel(1);
  for(const values of [{life:-1,food:3,comms:2},{life:NaN,food:3,comms:2},{life:4,food:2,comms:2},{life:8,food:3,comms:2},{life:7,food:3,comms:2}])assert.equal(m.powerPlan(values).valid,false);
  assert.equal(m.powerPlan({life:4,food:3,comms:2}).valid,true);
  m.loadLevel(4);assert.equal(m.powerPlan({life:4,food:2,comms:1},true).valid,true);assert.equal(m.powerPlan({life:4,food:2,comms:1},false).valid,false);
});
