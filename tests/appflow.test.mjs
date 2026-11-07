import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { Mission, clamp } from '../dist/engine.js';
import { TrainingMission } from '../dist/academy.js';
import { AcademyGuide } from '../dist/academy-guide.js';
import { Soundtrack } from '../dist/audio.js';
import { readPreference, writePreference } from '../dist/preferences.js';
import { MovablePanel } from '../dist/panels.js';
import { resolveRouteRequest, planSurfaceRoute } from '../dist/navigation.js';
import { StorySequence } from '../dist/story.js';
import { FlightSimulation, WORLDS, localSky } from '../dist/voyage.js';
import { AstronomicalWorld } from '../dist/astronomy-world.js';
import { powerBalance } from '../dist/expedition.js';
import { createDestinationMission } from '../dist/worlds.js';
import { loadGameData, connectLocalBackend } from '../dist/local-backend.js';

// A minimal interface test double: verifies controller wiring, not browser layout or playback.
class Element {
  constructor(id = '', tag = 'div') {
    this.id = id; this.tag = tag; this.children = []; this.listeners = {}; this.dataset = {}; this.attributes = {}; this.style = {}; this.hidden = false; this.inert = false; this.open = false; this.value = ''; this.textContent = ''; this.classes = new Set();
    this.classList = { add: x => this.classes.add(x), remove: x => this.classes.delete(x), toggle: (x, on) => { const value = on === undefined ? !this.classes.has(x) : on; value ? this.classes.add(x) : this.classes.delete(x); return value; } };
  }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  fire(name, event = {}) { const e = { target: this, preventDefault() {}, stopPropagation() {}, ...event }; for (const fn of this.listeners[name] || []) fn(e); }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key]; }
  append(...children) { for (const child of children) { if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(c => c !== child); child.parentElement = this; this.children.push(child); } }
  replaceChildren(...children) { this.children.length = 0; this.append(...children); }
  getClientRects() { return this.hidden ? [] : [{}]; }
  getBoundingClientRect() {
    const r = this.rect || { width: 1100, height: 900, left: 0, top: 0 };
    return { ...r, left: Number.isFinite(parseFloat(this.style.left)) ? parseFloat(this.style.left) : r.left, top: Number.isFinite(parseFloat(this.style.top)) ? parseFloat(this.style.top) : r.top, height: Math.min(r.height, parseFloat(this.style.maxHeight) || r.height) };
  }
  scrollIntoView() {} focus() { if(this.ownerDocument)this.ownerDocument.activeElement=this; } setPointerCapture() {}
  play(){this.paused=false;return Promise.resolve();} pause(){this.paused=true;}
  closest(selector) {
    if (selector.includes('input') && this.tag === 'input') return this;
    if (selector.includes('[data-floating-panel]')) { for(let n=this;n;n=n.parentElement)if('data-floating-panel' in n.attributes)return n; }
    return null;
  }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
  querySelector(selector) { return this.parts?.[selector] || this.children.find(c=>selector[0]==='.'&&c.className===selector.slice(1)) || new Element(); }
}
class RenderDouble {
  constructor(canvas,mission) { this.mission=mission;if(mission?.astroWorld){this.rocks=[];this.surveys=[];this.pathGroups={};this.ground={visible:true};this.scenery={visible:true};this.player={visible:true};this.camera={fov:72,updateProjectionMatrix(){}};this.surfaceSky={telescope:null,magnification:1,update:()=>{const v=mission.astroWorld.sky(mission.config.world,mission.astroWorld.observerOverride||mission.terrain.geo(mission.state.player));this.surfaceSky.lastView=v;return v.bodies;},get hour(){return mission.astroWorld.utc%86400/3600;},setMagnification(){},aim(){return true;}};}this.zoom = 1.25; this.follow = true; this.mode = 'surface'; this.perspective='third-person';this.elevation = false; this.showLifeline = true; this.effects = [];this.yaw=Math.PI/4;this.pitch=.65;this.lookYaw=this.yaw+Math.PI;this.lookPitch=0; }
  dispose(){}
  trigger(...args) { this.effects.push(args); } clearEffects() { this.effects = []; } resize() {} drawMini() {} draw() {}
  setElevation(value) { this.elevation = value; }
  rotateCamera(yaw,pitch=0){if(this.perspective==='first-person'){this.lookYaw+=yaw;this.lookPitch+=pitch;}else{this.yaw+=yaw;this.pitch+=pitch;}}
  setPerspective(mode){this.perspective=mode;if(mode==='first-person'){this.follow=true;this.cameraPinned=null;}}
  resetCamera(){this.follow=true;this.cameraPinned=null;}
  panCamera(x,y){this.panned={x,y};this.follow=false;this.cameraPinned={x:3,y:4};}
  showObjective(){this.objectiveShown=true;}
  showOverview(){this.setPerspective('third-person');this.overviewShown=true;this.follow=false;}
  fromScreen(){return this.pickPoint;}
  inspectTraining(){this.setPerspective('third-person');this.follow=false;this.cameraPinned={x:3,y:4};}
  demonstrateTraining(){this.demonstration={active:true};}
}
const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8').replace(/^import .+;\n/gm, '').replace(/boot\(\);\s*$/, 'globalThis.bootPromise = boot();');
const data = Object.fromEntries(['terrain', 'mission', 'ephemerides','academy','terrain-mars','solar-system'].map(n => [n === 'mission' ? 'config' : n==='terrain-mars'?'marsTerrain':n==='solar-system'?'solar':n, JSON.parse(fs.readFileSync(new URL('../dist/data/' + n + '.json', import.meta.url)))]));
async function interfaceContext(storage,{skipStory=true,skipFlight=true,scientific=false}={}) {
  const nodes = new Map([...html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/g)].map(m => {
    const el = new Element(m[3],m[1]); el.hidden = /(?:^|\s)hidden(?:\s|$)/.test(m[2]);
    for(const attr of m[2].matchAll(/([\w-]+)="([^"]*)"/g))el.attributes[attr[1]]=attr[2];
    if(m[2].includes('data-floating-panel'))el.attributes['data-floating-panel']='';
    return [m[3],el];
  }));
  nodes.get('tutorial-card').rect = {width:335,height:310,left:753,top:435};
  nodes.get('astra-card').rect = {width:380,height:400,left:1038,top:352};
  nodes.get('astra-form').append(nodes.get('astra-input'));
  nodes.get('astra-card').append(...['astra-drag-handle','astra-position-reset','astra-close','astra-message','astra-form'].map(id=>nodes.get(id)));
  const prompts = [...html.matchAll(/data-question="([^"]+)"/g)].map(m=>{const e=new Element('','button');e.dataset.question=m[1];nodes.get('astra-card').append(e);return e;});
  for (const id of ['oxygen-bar','battery-bar']) new Element().append(nodes.get(id));
  const playfield = new Element('playfield'); playfield.append(nodes.get('tutorial-card'));
  const objectives = Array.from({ length: 3 }, () => { const e = new Element(); e.parts = { '.objective-check': new Element(), '.objective-number': new Element() }; return e; });
  const dialogIds = [...nodes.values()].filter(e=>e.tag==='dialog').map(e=>e.id);
  const classes = Object.fromEntries(['.mission-number','.world-tools','.world-footer>span:first-child','.time-scale'].map(k => [k,new Element()]));
  const documentEvents = new Element();
  const document = {
    body: new Element(), hidden: false, getElementById: id => nodes.get(id), createElement: tag => new Element('',tag), addEventListener: (...args)=>documentEvents.addEventListener(...args), fire: (...args)=>documentEvents.fire(...args),
    querySelector(selector) { if (selector === 'dialog[open]') return dialogIds.map(id => nodes.get(id)).find(e => e.open) || null; if (selector === '.playfield') return playfield; return classes[selector] || null; },
    querySelectorAll(selector) { if (selector === '.objectives li') return nodes.get('objectives').children; if (selector === 'dialog') return dialogIds.map(id => nodes.get(id)); if(selector==='[data-question]')return prompts; return []; }
  };
  for(const e of nodes.values())e.ownerDocument=document;
  const windowEvents = new Element();
  const shared=scientific?{...data,tranquillitatis:JSON.parse(fs.readFileSync(new URL('../dist/data/terrain-tranquillitatis.json',import.meta.url))),astronomy:JSON.parse(fs.readFileSync(new URL('../dist/data/astronomy.json',import.meta.url))),stars:JSON.parse(fs.readFileSync(new URL('../dist/data/stars.json',import.meta.url))),scenarios:JSON.parse(fs.readFileSync(new URL('../dist/data/scenarios.json',import.meta.url)))}:data;
  const ctx = { document, loadGameData, connectLocalBackend, AstronomicalWorld,powerBalance,FlightSimulation,WORLDS,localSky,createDestinationMission,FlightRenderer:class{constructor(r,f,d){this.r=r;this.sim=f;this.data=d;this.rotations=[];this.hits=0;}draw(){}dispose(){}rotate(yaw,pitch){this.rotations.push({yaw,pitch});}hitButton(){this.hits++;return true;}drawSolarSystem(){}rotateSolar(){}}, Mission, TrainingMission, clamp, AcademyGuide, Soundtrack, StorySequence, MovablePanel, resolveRouteRequest, planSurfaceRoute, readPreference, writePreference, Renderer: RenderDouble,
    LUNA_DATA: shared, localStorage: storage, devicePixelRatio: 1, innerWidth:1440, innerHeight:900, matchMedia: () => ({ matches: false }), addEventListener:(...args)=>windowEvents.addEventListener(...args), fire:(...args)=>windowEvents.fire(...args),
    ResizeObserver: class { observe() {} }, console, setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame(fn) { ctx.frame = fn; }
  };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(app, ctx);await ctx.bootPromise;if(skipStory&&nodes.get('story-dialog').open)nodes.get('story-skip').fire('click');if(skipFlight){ctx.luna.flight.enter('surface');ctx.updateUI();}return { ctx, nodes, playfield, document, prompts };
}
function travel(m, point) { assert.equal(m.navigate(point),true); let guard=20000; while(m.route && guard-- > 0)m.update(.1); assert.ok(guard>0); }
function solve(m) { for (let i=0;i<9;i++)while(m.circuit.turns[i])m.circuit.rotate(i); }
test('academy controller restores guidance, keeps Settings reversible, and unlocks level 2 immediately after the field task', async () => {
  const values = new Map([['luna-tutorial-v1', JSON.stringify({completed:true})]]), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key,value) };
  const { ctx, nodes } = (await interfaceContext(storage)), { mission: m, tutorial: guide } = ctx.luna;
  assert.equal(nodes.get('tutorial-card').hidden,false); assert.equal(m.levelIndex,0);
  nodes.get('next-action-button').fire('click'); assert.equal(m.state.status,'playing');
  nodes.get('route-button').fire('click'); let frame=0;
  for(let i=0;i<60;i++)ctx.frame(++frame*1000/60);
  assert.ok(m.state.distanceMetres>0); const progress=[m.state.time,m.state.distanceMetres,m.state.oxygen];
  nodes.get('settings-button').fire('click'); assert.equal(nodes.get('settings-dialog').open,true); assert.equal(m.state.status,'paused');
  for(let i=0;i<60;i++)ctx.frame(++frame*1000/60);
  assert.deepEqual([m.state.time,m.state.distanceMetres,m.state.oxygen],progress);
  nodes.get('music-toggle').fire('click'); assert.equal(ctx.luna.audio.muted,true);
  nodes.get('tutorial-setting-toggle').fire('click'); assert.equal(guide.active,false);
  nodes.get('tutorial-restart').fire('click'); assert.equal(nodes.get('settings-dialog').open,false);assert.equal(guide.active,true);assert.equal(m.state.status,'playing');
  assert.deepEqual([m.state.time,m.state.distanceMetres,m.state.oxygen],progress);
  travel(m,m.practice);ctx.updateUI();assert.equal(m.nextAction().command,'scan');nodes.get('next-action-button').fire('click');assert.deepEqual(m.state.scans,[0]);
  nodes.get('orbit-tab').fire('click');const before=m.state.time;for(let i=0;i<60;i++)ctx.frame(++frame*1000/60);assert.equal(m.state.time,before);
  assert.equal(nodes.get('orbital-tools').hidden,false);nodes.get('return-surface').fire('click');assert.equal(ctx.luna.renderer.mode,'surface');
  travel(m,m.objects.base);ctx.updateUI();nodes.get('interact-button').fire('click');assert.equal(m.state.status,'complete');assert.equal(nodes.get('debrief-dialog').open,true);
  assert.equal(nodes.get('next-level-button').hidden,false);assert.equal(m.xp,300);nodes.get('review-answers').children[1].fire('click');assert.equal(m.unlocked,1);assert.match(nodes.get('review-feedback').textContent,/Try again/);
  nodes.get('review-answers').children[0].fire('click');assert.equal(m.unlocked,1);assert.equal(m.xp,400);assert.equal(nodes.get('next-level-button').hidden,false);
  nodes.get('next-level-button').fire('click');assert.equal(m.levelIndex,1);assert.equal(m.state.status,'ready');assert.equal(guide.active,true);assert.equal(nodes.get('mission-title').textContent,m.lesson.title);
  const reloaded=(await interfaceContext(storage));assert.equal(reloaded.ctx.luna.mission.levelIndex,1);assert.equal(reloaded.ctx.luna.mission.rank,'EVA Cadet');
});
test('systems workbench pauses resources, rejects oversupply, and awards a practical badge before the optional check',async () =>{
  const {ctx,nodes}=(await interfaceContext(null)),m=ctx.luna.mission;m.unlocked=1;m.loadLevel(1);ctx.refreshLesson();nodes.get('start-button').fire('click');nodes.get('next-action-button').fire('click');
  assert.equal(nodes.get('repair-dialog').open,true);solve(m);ctx.renderCircuit();nodes.get('apply-repair').fire('click');assert.equal(m.state.training.powerBus,true);
  nodes.get('next-action-button').fire('click');assert.equal(nodes.get('systems-dialog').open,true);assert.equal(m.state.status,'paused');assert.equal(nodes.get('apply-power').disabled,true);
  for(const [k,v] of [['life',12],['food',3],['comms',2]])nodes.get('power-'+k).value=String(v);nodes.get('power-life').fire('input');assert.equal(nodes.get('apply-power').disabled,true);assert.match(nodes.get('power-feedback').textContent,/Over budget/);
  nodes.get('power-life').value='4';nodes.get('power-life').fire('input');assert.equal(nodes.get('apply-power').disabled,false);nodes.get('apply-power').fire('click');
  assert.equal(nodes.get('systems-dialog').open,false);assert.equal(nodes.get('debrief-dialog').open,true);assert.equal(m.state.status,'complete');assert.equal(m.state.training.power.reserve,3);assert.equal(m.completed.length,1);assert.equal(m.xp,300);
  nodes.get('review-answers').children[1].fire('click');assert.equal(m.completed[0].id,'systems');assert.equal(m.unlocked,2);
});
test('live 3D workbench demonstrates equipment without awarding progress, then continues directly after hands-on alignment',async () =>{
  const {ctx,nodes}=(await interfaceContext(null)),m=ctx.luna.mission,r=ctx.luna.renderer;m.unlocked=9;m.loadLevel(5);ctx.refreshLesson();nodes.get('start-button').fire('click');nodes.get('next-action-button').fire('click');
  assert.equal(nodes.get('training-workbench').hidden,false);assert.equal(m.state.status,'paused');assert.equal(nodes.get('debrief-dialog').open,false);assert.equal(nodes.get('tutorial-card').hidden,true);assert.ok(r.demonstration);
  const state=JSON.stringify(m.state);nodes.get('workbench-demo').fire('click');assert.equal(JSON.stringify(m.state),state);assert.equal(m.completed.length,0);
  const rows=nodes.get('workbench-ranges').children;for(const [i,v]of [[0,35],[1,110]]){const input=rows[i].children[2];input.value=String(v);input.fire('input');}
  assert.equal(r.demonstration,null);assert.equal(m.state.training.drill.tilt,35);assert.equal(m.state.training.drill.bearing,110);assert.equal(nodes.get('workbench-action').disabled,false);
  const yaw=r.yaw,pitch=r.pitch;nodes.get('world').fire('pointerdown',{button:0,pointerId:8,clientX:300,clientY:200});nodes.get('world').fire('pointermove',{pointerId:8,clientX:450,clientY:250});nodes.get('world').fire('pointerup',{pointerId:8});assert.ok(r.yaw!==yaw&&r.pitch!==pitch);assert.ok(r.cameraPinned);
  nodes.get('workbench-action').fire('click');assert.equal(m.state.status,'complete');assert.equal(nodes.get('workbench-next').hidden,false);assert.equal(m.completed[0].id,'solar');assert.equal(m.reviewPassed,false);
  nodes.get('workbench-next').fire('click');assert.equal(m.levelIndex,6);assert.equal(m.state.status,'ready');assert.equal(nodes.get('training-workbench').hidden,true);
});
test('normal mouse and touch dragging looks around without sending a walking route',async () =>{
  const {ctx,nodes}=(await interfaceContext(null)),m=ctx.luna.mission,r=ctx.luna.renderer;
  m.start();let calls=0;m.navigate=()=>{calls++;return true;};r.pickPoint=m.practice;
  const yaw=r.yaw,pitch=r.pitch;nodes.get('orbit-left').fire('click');nodes.get('tilt-up').fire('click');assert.ok(r.yaw<yaw&&r.pitch>pitch);
  for(const pointerType of ['mouse','touch']){
    const before=[r.yaw,r.pitch];nodes.get('world').fire('pointerdown',{button:0,pointerId:9,pointerType,clientX:300,clientY:200});assert.equal(calls,0);
    nodes.get('world').fire('pointermove',{pointerId:9,clientX:400,clientY:160});nodes.get('world').fire('pointerup',{pointerId:9,clientX:400,clientY:160});
    assert.ok(r.yaw!==before[0]&&r.pitch!==before[1]);assert.equal(calls,0);
  }
});
test('only a completed click plots a route; cancelled and right-button gestures do not',async () =>{
  const {ctx,nodes}=(await interfaceContext(null)),m=ctx.luna.mission,r=ctx.luna.renderer;m.start();let calls=0;m.navigate=()=>{calls++;return true;};r.pickPoint=m.practice;const world=nodes.get('world');
  world.fire('pointerdown',{button:0,pointerId:1,clientX:300,clientY:200});assert.equal(calls,0);
  world.fire('pointermove',{pointerId:1,clientX:302,clientY:201});world.fire('pointerup',{pointerId:1,clientX:302,clientY:201});assert.equal(calls,1);
  world.fire('pointerdown',{button:0,pointerId:2,clientX:300,clientY:200});world.fire('pointercancel',{pointerId:2});world.fire('pointerup',{pointerId:2,clientX:300,clientY:200});assert.equal(calls,1);
  world.fire('pointerdown',{button:2,pointerId:3,clientX:300,clientY:200});world.fire('pointerup',{pointerId:3,clientX:300,clientY:200});assert.equal(calls,1);
  world.fire('pointerdown',{button:0,pointerId:4,clientX:300,clientY:200});world.fire('lostpointercapture',{pointerId:4});world.fire('pointerup',{pointerId:4,clientX:300,clientY:200});assert.equal(calls,1);
});
test('pan gestures explore the terrain without turning the camera or walking the astronaut',async () =>{
  const {ctx,nodes}=(await interfaceContext(null)),r=ctx.luna.renderer,m=ctx.luna.mission;const world=nodes.get('world'),before=JSON.stringify(m.state.player),yaw=r.yaw;
  nodes.get('camera-mode-button').fire('click');assert.equal(nodes.get('camera-mode-button').getAttribute('aria-pressed'),'true');
  world.fire('pointerdown',{button:0,pointerId:1,clientX:300,clientY:200});world.fire('pointermove',{pointerId:1,clientX:400,clientY:160});world.fire('pointerup',{pointerId:1});
  assert.equal(r.panned.x,100);assert.equal(r.panned.y,-40);assert.equal(r.yaw,yaw);assert.equal(JSON.stringify(m.state.player),before);assert.equal(m.route,null);
  nodes.get('camera-mode-button').fire('click');r.panned=null;
  world.fire('pointerdown',{button:0,shiftKey:true,pointerId:2,clientX:300,clientY:200});world.fire('pointermove',{pointerId:2,clientX:350,clientY:220});world.fire('pointerup',{pointerId:2});assert.equal(r.panned.x,50);
});
test('astronaut view has a button and keyboard shortcut, keeps look dragging, and restores after equipment practice',async () =>{
  const {ctx,nodes,document}=(await interfaceContext(null)),r=ctx.luna.renderer,m=ctx.luna.mission;nodes.get('first-person-button').fire('click');
  assert.equal(r.perspective,'first-person');assert.equal(nodes.get('first-person-button').getAttribute('aria-pressed'),'true');assert.equal(nodes.get('camera-mode-button').disabled,true);assert.equal(nodes.get('camera-aim').hidden,false);
  const yaw=r.lookYaw,pitch=r.lookPitch;nodes.get('world').fire('pointerdown',{button:0,pointerId:1,clientX:300,clientY:200});nodes.get('world').fire('pointermove',{pointerId:1,clientX:400,clientY:250});nodes.get('world').fire('pointerup',{pointerId:1});assert.ok(r.lookYaw>yaw&&r.lookPitch<pitch);assert.equal(m.route,null);
  nodes.get('inspect-objective').fire('click');assert.equal(r.objectiveShown,true);nodes.get('camera-overview').fire('click');assert.equal(r.perspective,'third-person');assert.equal(r.overviewShown,true);
  nodes.get('camera-home').fire('click');assert.equal(r.perspective,'first-person');assert.equal(nodes.get('camera-aim').hidden,false);
  m.unlocked=9;m.loadLevel(5);ctx.refreshLesson();nodes.get('start-button').fire('click');nodes.get('next-action-button').fire('click');assert.equal(r.perspective,'third-person');
  nodes.get('workbench-close').fire('click');assert.equal(r.perspective,'first-person');assert.equal(m.state.status,'playing');
  document.fire('keydown',{key:'f',target:nodes.get('world')});assert.equal(r.perspective,'third-person');assert.equal(nodes.get('first-person-button').getAttribute('aria-pressed'),'false');
});
test('repair interface follows each apparatus layout and its tutorial points at the actual input and output',async () =>{
  const {ctx,nodes}=(await interfaceContext(null)),m=ctx.luna.mission;m.unlocked=2;m.loadLevel(1);ctx.refreshLesson();nodes.get('start-button').fire('click');nodes.get('next-action-button').fire('click');
  assert.equal(m.circuit.design,'outpost');assert.equal(nodes.get('circuit-frame').dataset.design,'outpost');
  assert.equal(nodes.get('circuit-input').style.gridRow,'1');assert.equal(nodes.get('circuit-output').style.gridRow,'5');
  assert.match(nodes.get('repair-description').textContent,/top-left.*bottom-right/);
  nodes.get('tutorial-action').fire('click');assert.match(nodes.get('tutorial-text').textContent,/top-left.*up.*bottom-right.*down/);
  nodes.get('repair-dialog').close();m.loadLevel(2);ctx.refreshLesson();nodes.get('start-button').fire('click');travel(m,m.objects.relay);m.interact();ctx.processEvents();ctx.updateUI();
  assert.equal(m.circuit.design,'relay');assert.equal(nodes.get('circuit-input').style.gridColumn,'1');assert.equal(nodes.get('circuit-output').style.gridColumn,'5');
  solve(m);m.completeRepair();nodes.get('repair-dialog').close();travel(m,m.state.rover);m.interact();ctx.processEvents();ctx.updateUI();
  assert.equal(m.circuit.design,'rover');assert.equal(nodes.get('circuit-frame').dataset.design,'rover');
  assert.equal(nodes.get('circuit-input').style.gridRow,'5');assert.equal(nodes.get('circuit-output').style.gridRow,'1');
  assert.match(nodes.get('repair-description').textContent,/bottom-left.*top-right/);
});
test('opening ignores the legacy seen flag, runs once per visit and does not replay on mission or tutorial restart',async () =>{
 const values=new Map([['luna-story-seen-v2','true']]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const {ctx,nodes,document}=(await interfaceContext(storage,{skipStory:false})),m=ctx.luna.mission;
 assert.equal(nodes.get('story-dialog').open,true);assert.equal(nodes.get('tutorial-card').hidden,true);
 assert.equal(document.body.classes.has('in-story'),true);
 for(const id of ['game-header','mission-panel','game-footer','astra-button','astra-card']){assert.equal(nodes.get(id).hidden,true,id+' is absent during the opening');assert.equal(nodes.get(id).inert,true,id+' cannot accept opening input');}
 const reserves=[m.state.oxygen,m.state.water,m.state.suitWh];for(let i=0;i<60;i++)ctx.frame(i*1000/60);
 assert.equal(m.state.time,0);assert.deepEqual([m.state.oxygen,m.state.water,m.state.suitWh],reserves);
 for(let i=60;i<350;i++)ctx.frame(1000+i*100);
 assert.equal(nodes.get('story-dialog').open,false);assert.equal(nodes.get('tutorial-card').hidden,false);assert.equal(ctx.luna.story.state,'finished');
 assert.equal(document.body.classes.has('in-story'),false);
 for(const id of ['game-header','mission-panel','game-footer','astra-button']){assert.equal(nodes.get(id).hidden,false,id+' returns after narration');assert.equal(nodes.get(id).inert,false);}
 assert.equal(nodes.get('astra-card').hidden,true,'the closed assistant does not open when the story ends');
 assert.deepEqual([m.state.oxygen,m.state.water,m.state.suitWh],reserves);
 const reloaded=(await interfaceContext(storage,{skipStory:false}));assert.equal(reloaded.nodes.get('story-dialog').open,true);
 nodes.get('tutorial-restart').fire('click');assert.equal(nodes.get('story-dialog').open,false);
 ctx.openStory();assert.equal(nodes.get('story-dialog').open,false);
 m.reset();ctx.refreshLesson();assert.equal(nodes.get('story-dialog').open,false);
 const skipped=(await interfaceContext(null,{skipStory:false}));skipped.nodes.get('story-skip').fire('click');assert.equal(skipped.ctx.luna.story.state,'skipped');assert.equal(skipped.nodes.get('mission-panel').hidden,false);assert.equal(skipped.nodes.get('mission-panel').inert,false);
});
test('opening preference persists while skipping only affects the current visit and toggling never interrupts a mission',async () =>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const {ctx,nodes}=(await interfaceContext(storage,{skipStory:false}));nodes.get('story-skip').fire('click');assert.equal(ctx.luna.story.state,'skipped');
 assert.equal((await interfaceContext(storage,{skipStory:false})).nodes.get('story-dialog').open,true);
 nodes.get('start-button').fire('click');const progress=JSON.stringify(ctx.luna.mission.state);
 nodes.get('opening-toggle').fire('click');assert.equal(ctx.luna.story.enabled,false);assert.equal(nodes.get('opening-toggle').getAttribute('aria-pressed'),'false');assert.equal(JSON.stringify(ctx.luna.mission.state),progress);
 assert.equal((await interfaceContext(storage,{skipStory:false})).nodes.get('story-dialog').open,false);
 nodes.get('opening-toggle').fire('click');assert.equal(nodes.get('story-dialog').open,false);assert.equal(JSON.stringify(ctx.luna.mission.state),progress);
 assert.equal((await interfaceContext(storage,{skipStory:false})).nodes.get('story-dialog').open,true);
});
test('ASTRA previews a calculated path and follows it only when the player chooses Follow route',async () =>{
 const {ctx,nodes}=(await interfaceContext(null)),m=ctx.luna.mission;
 nodes.get('tutorial-skip').fire('click');nodes.get('start-button').fire('click');nodes.get('astra-button').fire('click');
 nodes.get('astra-input').value='route to Echo';nodes.get('astra-form').fire('submit');
 assert.equal(m.route,null);assert.equal(nodes.get('astra-route-card').hidden,false);assert.ok(ctx.luna.renderer.assistedRoute.path.length>1);
 assert.match(nodes.get('astra-message').textContent,/path to Echo/);nodes.get('astra-follow-route').fire('click');
 assert.ok(m.route);assert.equal(nodes.get('astra-card').hidden,true);assert.ok(Math.hypot(m.route.path.at(-1).x-m.state.rover.x,m.route.path.at(-1).y-m.state.rover.y)*m.terrain.cell<=m.config.interactionMetres);
 let guard=20000;while(m.route&&guard-->0)m.update(.1);ctx.updateUI();assert.ok(guard>0);assert.equal(nodes.get('astra-route-status').textContent,'DESTINATION REACHED');
 nodes.get('astra-button').fire('click');nodes.get('astra-clear-route').fire('click');assert.equal(nodes.get('astra-route-card').hidden,true);assert.equal(ctx.luna.renderer.assistedRoute,null);
 nodes.get('astra-pick-point').fire('click');assert.equal(nodes.get('astra-card').hidden,true);
 nodes.get('minimap').fire('pointerdown',{clientX:(m.objects.relay.x+.5)/m.terrain.width*1100,clientY:(m.objects.relay.y+.5)/m.terrain.height*900});
 assert.equal(nodes.get('astra-card').hidden,false);assert.equal(m.route,null);assert.equal(nodes.get('astra-route-destination').textContent,'Selected map point');
 assert.deepEqual(ctx.luna.renderer.assistedRoute.target,{x:m.objects.relay.x,y:m.objects.relay.y});
});

test('ASTRA opens on demand, answers questions, retains its moved position, and leaves game controls isolated', async () => {
  const values = new Map(), storage = { getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value) };
  const { ctx, nodes, document, prompts }=(await interfaceContext(storage)), m=ctx.luna.mission;
  assert.equal(nodes.get('astra-card').hidden,true); assert.equal(nodes.get('astra-button').getAttribute('aria-expanded'),'false');
  nodes.get('tutorial-skip').fire('click'); nodes.get('start-button').fire('click');
  nodes.get('astra-button').fire('click');
  assert.equal(nodes.get('astra-card').hidden,false); assert.equal(nodes.get('astra-button').getAttribute('aria-expanded'),'true'); assert.equal(document.activeElement,nodes.get('astra-input'));
  const start={...m.state.player}; document.fire('keydown',{target:nodes.get('astra-input'),key:'w'});
  for(let i=1;i<=20;i++)ctx.frame(i*1000/60);
  assert.equal(m.state.player.x,start.x); assert.equal(m.state.player.y,start.y);
  prompts[1].fire('click'); assert.equal(nodes.get('astra-message').textContent,m.astra(prompts[1].dataset.question));
  nodes.get('astra-input').value='How do I move?'; nodes.get('astra-form').fire('submit');
  assert.equal(nodes.get('astra-message').textContent,m.astra('How do I move?')); assert.equal(nodes.get('astra-input').value,'');
  const handle=nodes.get('astra-drag-handle');handle.fire('pointerdown',{button:0,pointerId:5,clientX:1080,clientY:380});ctx.fire('pointermove',{pointerId:5,clientX:150,clientY:160});ctx.fire('pointerup',{pointerId:5});
  const position=[nodes.get('astra-card').style.left,nodes.get('astra-card').style.top];
  nodes.get('astra-card').fire('keydown',{key:'Escape'}); assert.equal(nodes.get('astra-card').hidden,true); assert.equal(document.activeElement,nodes.get('astra-button'));
  nodes.get('astra-button').fire('click'); assert.deepEqual([nodes.get('astra-card').style.left,nodes.get('astra-card').style.top],position);
  const reloaded=(await interfaceContext(storage)); reloaded.nodes.get('astra-button').fire('click'); assert.deepEqual([reloaded.nodes.get('astra-card').style.left,reloaded.nodes.get('astra-card').style.top],position);
  ctx.openDialog(nodes.get('help-dialog')); assert.equal(nodes.get('astra-card').hidden,true); assert.equal(nodes.get('help-dialog').open,true);
  nodes.get('help-dialog').close(); document.fire('keydown',{target:nodes.get('world'),key:'w'});
  for(let i=21;i<=40;i++)ctx.frame(i*1000/60);
  assert.ok(m.state.player.x!==start.x||m.state.player.y!==start.y);
});

for(const world of ['moon','mars'])test(world+' flight controller connects destination selection, E launch, sequential Space locks and surface training',async () =>{
 const {ctx,nodes,document}=(await interfaceContext(null,{skipFlight:false}));const f=ctx.luna.flight;
 assert.equal(f.phase,'briefing');assert.equal(nodes.get('flight-deck').hidden,false);nodes.get('destination-'+world).fire('click');assert.equal(f.destination,world);assert.equal(ctx.luna.mission.config.world,world,'the destination terrain is loaded before launch');assert.match(nodes.get('journey-distance').textContent,new RegExp(world==='moon'?'Moon':'Mars'));
 nodes.get('board-spaceship').fire('click');for(let i=0;i<65;i++)f.update(.1);ctx.syncFlight();assert.equal(f.phase,'cockpit');assert.equal(nodes.get('launch-spacecraft').hidden,false);
 const canvas=nodes.get('world');document.fire('keydown',{key:'e',target:canvas});assert.equal(f.phase,'ignition');document.fire('keydown',{key:'e',target:canvas,repeat:true});assert.equal(f.flightCount,1);
 let guard=1000;while(f.phase!=='speed'&&guard-->0)f.update(.1);assert.ok(guard>0);for(let i=0;i<6;i++)f.update(.1);
 ctx.syncFlight();assert.equal(nodes.get('flight-deck').dataset.phase,'speed');nodes.get('landing-camera-view').fire('click');assert.equal(f.cabinFlight,true);assert.equal(nodes.get('landing-camera-view').textContent,'Exterior view · F');document.fire('keydown',{key:'f',target:canvas});assert.equal(f.cabinFlight,false);
 document.fire('keydown',{key:' ',target:canvas});assert.equal(f.phase,'angle');document.fire('keydown',{key:' ',target:canvas,repeat:true});assert.equal(f.phase,'angle');document.fire('keydown',{key:' ',target:canvas});assert.equal(f.phase,'descent');document.fire('keydown',{key:'f',target:canvas});assert.equal(f.cabinFlight,true);document.fire('keydown',{key:'f',target:canvas});assert.equal(f.cabinFlight,false);
 for(let i=0;i<125;i++)f.update(.1);assert.equal(f.phase,'landed');ctx.syncFlight();assert.equal(nodes.get('disembark-spacecraft').hidden,false);nodes.get('disembark-spacecraft').fire('click');
 assert.equal(ctx.luna.mission.config.world,world);assert.equal(f.phase,'surface');assert.equal(nodes.get('flight-deck').hidden,true);assert.equal(ctx.luna.mission.state.status,'ready');assert.equal(nodes.get('tutorial-card').hidden,false);
 nodes.get('next-action-button').fire('click');assert.equal(ctx.luna.mission.state.status,'playing');nodes.get('journey-button').fire('click');assert.equal(f.phase,'briefing');nodes.get('continue-surface').fire('click');assert.equal(f.phase,'surface');assert.equal(ctx.luna.mission.state.status,'playing');
});
test('opening finishes before destination selection and settings do not advance flight or drain EVA reserves',async () =>{
 const {ctx,nodes}=(await interfaceContext(null,{skipFlight:false,skipStory:false})),f=ctx.luna.flight,m=ctx.luna.mission;
 assert.equal(ctx.luna.story.active,true);assert.equal(nodes.get('flight-deck').hidden,true);nodes.get('story-skip').fire('click');assert.equal(nodes.get('flight-deck').hidden,false);
 nodes.get('board-spaceship').fire('click');let frame=0;for(let i=0;i<70;i++)ctx.frame(++frame*100);assert.equal(f.phase,'cockpit');nodes.get('launch-spacecraft').fire('click');
 const before=[f.phase,f.elapsed,m.state.oxygen,m.state.time];nodes.get('settings-button').fire('click');for(let i=0;i<70;i++)ctx.frame(++frame*100);assert.deepEqual([f.phase,f.elapsed,m.state.oxygen,m.state.time],before);
 nodes.get('settings-dialog').close();for(let i=0;i<30;i++)ctx.frame(++frame*100);assert.equal(f.phase,'ascent');
});

test('launch and boarding accept mouse and touch look gestures without panning or moving the surface astronaut',async ()=>{
 const {ctx,nodes}=(await interfaceContext(null,{skipFlight:false})),f=ctx.luna.flight,r=ctx.luna.renderer,canvas=nodes.get('world'),v=vm.runInContext('flightRenderer',ctx),before=JSON.stringify(ctx.luna.mission.state);
 for(const [phase,button,pointerType]of [['briefing',0,'mouse'],['briefing',1,'mouse'],['boarding',0,'touch'],['ignition',0,'mouse']]){
  f.enter(phase);ctx.syncFlight();const n=v.rotations.length;
  canvas.fire('pointerdown',{button,pointerId:8,pointerType,shiftKey:true,clientX:300,clientY:200});canvas.fire('pointermove',{pointerId:8,clientX:450,clientY:150});canvas.fire('pointerup',{pointerId:8,clientX:450,clientY:150});
  assert.equal(v.rotations.length,n+1,phase+' applies dragging');assert.ok(v.rotations.at(-1).yaw>0&&v.rotations.at(-1).pitch>0);assert.equal(f.phase,phase);
 }
 assert.equal(r.panned,undefined);assert.equal(ctx.luna.mission.route,null);assert.equal(JSON.stringify(ctx.luna.mission.state),before);assert.equal(v.hits,0);
});

test('a cockpit drag, cancelled pointer, right click or open dialog cannot press the physical launch switch',async ()=>{
 const {ctx,nodes}=(await interfaceContext(null,{skipFlight:false})),f=ctx.luna.flight,canvas=nodes.get('world'),v=vm.runInContext('flightRenderer',ctx);f.enter('cockpit');ctx.syncFlight();
 const down=(button=0)=>canvas.fire('pointerdown',{button,pointerId:9,clientX:400,clientY:300}),up=(x=400)=>canvas.fire('pointerup',{pointerId:9,clientX:x,clientY:300});
 down();canvas.fire('pointermove',{pointerId:9,clientX:500,clientY:330});up();assert.equal(f.phase,'cockpit','returning to the switch after a drag is not a click');
 down();up(440);assert.equal(f.phase,'cockpit','a release displaced from the press is not a click');
 down(2);up();assert.equal(f.phase,'cockpit');
 for(const name of ['pointercancel','lostpointercapture']){down();canvas.fire(name,{pointerId:9});up();assert.equal(f.phase,'cockpit');}
 down();ctx.openDialog(nodes.get('settings-dialog'));up();assert.equal(f.phase,'cockpit');nodes.get('settings-dialog').close();assert.equal(v.hits,0,'invalid gestures never raycast the launch switch');
 down();const rotations=v.rotations.length;ctx.openDialog(nodes.get('settings-dialog'));canvas.fire('pointermove',{pointerId:9,clientX:500,clientY:400});up();nodes.get('settings-dialog').close();assert.equal(v.rotations.length,rotations,'opening Settings cancels a captured look gesture');assert.equal(f.phase,'cockpit');
 down();up();assert.equal(v.hits,1);assert.equal(f.phase,'ignition');assert.equal(f.flightCount,1);
});

test('launch-site lighting readout describes Earth departure rather than the selected destination surface',async ()=>{
 const {ctx,nodes}=(await interfaceContext(null,{skipFlight:false,scientific:true}));
 assert.match(nodes.get('flight-time').textContent,/Daylight at Earth launch site.*Sun 34\.1°/);
 nodes.get('destination-mars').fire('click');assert.match(nodes.get('flight-time').textContent,/Night at Earth launch site.*Sun -39\.0°/);assert.match(nodes.get('flight-caption').textContent,/Earth launch site.*360°/);
 nodes.get('destination-moon').fire('click');assert.match(nodes.get('flight-time').textContent,/Daylight at Earth launch site/);
});

test('sky inspection and a new flight return from the solar overview to the correct interactive scene',async () =>{
 const {ctx,nodes}=(await interfaceContext(null));
 nodes.get('solar-tab').fire('click');assert.equal(ctx.luna.renderer.mode,'solar');nodes.get('sky-button').fire('click');assert.equal(ctx.luna.renderer.mode,'surface');assert.equal(nodes.get('sky-guide').hidden,false);
 nodes.get('sky-close').fire('click');nodes.get('solar-tab').fire('click');nodes.get('journey-button').fire('click');assert.equal(ctx.luna.renderer.mode,'surface');assert.equal(nodes.get('solar-labels').hidden,true);assert.equal(ctx.luna.flight.phase,'briefing');
});

test('scientific controller connects outpost decisions, clock exploration, catalogue controls and saved checkpoints',async () =>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}, {ctx,nodes,playfield}=(await interfaceContext(storage,{scientific:true})),m=ctx.luna.mission,a=ctx.luna.astro;
 assert.equal(m.isExpedition,true);assert.equal(nodes.get('solar-explorer').parentElement,playfield);assert.equal(nodes.get('solar-body').children.length,26);assert.equal(nodes.get('outpost-resources').children.length,12);
 const beforePanel=JSON.stringify(m.state);nodes.get('panel-systems').fire('click');assert.equal(nodes.get('mission-panel').classes.has('show-systems'),true);assert.equal(nodes.get('panel-systems').getAttribute('aria-pressed'),'true');nodes.get('panel-mission').fire('click');assert.equal(nodes.get('mission-panel').classes.has('show-systems'),false);assert.equal(JSON.stringify(m.state),beforePanel,'compact panel navigation keeps mission progress');
 nodes.get('next-action-button').fire('click');assert.equal(m.state.status,'playing');travel(m,m.target());m.interact();ctx.processEvents();assert.equal(nodes.get('repair-dialog').open,true);solve(m);nodes.get('apply-repair').fire('click');assert.equal(nodes.get('decision-dialog').open,true);assert.equal(nodes.get('decision-options').children.length,3);
 nodes.get('decision-options').children[0].children.at(-1).fire('click');assert.equal(m.state.expedition.stage,1);assert.equal(nodes.get('decision-dialog').open,false);assert.equal(m.state.status,'playing');
 const state=JSON.stringify(m.state),utc=a.utc;nodes.get('sky-button').fire('click');assert.equal(a.mode,'exploration');nodes.get('astronomy-utc').value='2027-01-01T12:00';nodes.get('astronomy-utc').fire('change');assert.equal(new Date(a.utc*1000).toISOString(),'2027-01-01T12:00:00.000Z');assert.equal(JSON.stringify(m.state),state);assert.equal(nodes.get('sky-body-list').children.length,25);nodes.get('sky-close').fire('click');assert.equal(a.utc,utc);assert.equal(a.mode,'mission');
 nodes.get('save-checkpoint').fire('click');assert.ok(values.has('luna-expedition-v2-moon'));nodes.get('journey-button').fire('click');assert.equal(ctx.luna.flight.phase,'briefing');assert.equal(nodes.get('continue-surface').hidden,false);nodes.get('continue-surface').fire('click');assert.equal(ctx.luna.mission.state.expedition.stage,1);assert.equal(ctx.luna.mission.state.status,'playing');
});

for(const world of ['moon','mars'])test(world+' local orbital flight returns to the same outpost and charges elapsed crew resources once',async () =>{
 const values=new Map([['luna-destination-v1',JSON.stringify(world)]]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}, {ctx,nodes}=(await interfaceContext(storage,{scientific:true})),m=ctx.luna.mission,f=ctx.luna.flight,a=ctx.luna.astro;
 assert.equal(m.config.world,world);m.start();travel(m,m.objects.base);ctx.updateUI();a.setMissionUTC(m.utcStart+m.state.time);
 const before={utc:a.utc,time:m.state.time,oxygen:m.state.expedition.outpost.oxygen,fuel:m.state.expedition.outpost.fuel,stage:m.state.expedition.stage,suit:m.state.oxygen};
 nodes.get('local-sortie').fire('click');assert.equal(f.phase,'boarding');assert.equal(m.state.status,'paused');assert.equal(m.state.expedition.outpost.fuel,before.fuel-5);
 f.skipSegment();nodes.get('launch-spacecraft').fire('click');for(let i=0;i<25;i++)f.update(.1);f.skipSegment();assert.equal(f.skipSegment(),false);f.resolveEvent('isolate');f.skipSegment();f.skipSegment();f.elapsed=.63;nodes.get('landing-lock').fire('click');f.elapsed=.23;nodes.get('landing-lock').fire('click');for(let i=0;i<125;i++)f.update(.1);ctx.syncFlight();assert.equal(f.phase,'landed');const elapsed=a.utc-before.utc;
 nodes.get('disembark-spacecraft').fire('click');assert.equal(f.phase,'surface');assert.equal(ctx.luna.mission,m);assert.equal(m.state.status,'playing');assert.equal(m.state.expedition.stage,before.stage);assert.ok(Math.abs(m.state.time-before.time-elapsed)<1e-6);assert.ok(m.state.expedition.outpost.oxygen<before.oxygen);assert.equal(m.state.oxygen,before.suit);
 const resources=JSON.stringify(m.state.expedition.outpost);nodes.get('disembark-spacecraft').fire('click');assert.equal(JSON.stringify(m.state.expedition.outpost),resources);ctx.frame(0);assert.ok(Math.abs(a.utc-m.utcStart-m.state.time)<1e-6);
});
