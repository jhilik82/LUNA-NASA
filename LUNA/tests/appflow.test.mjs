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

// A minimal interface test double: verifies controller wiring, not browser layout or playback.
class Element {
  constructor(id = '', tag = 'div') {
    this.id = id; this.tag = tag; this.children = []; this.listeners = {}; this.dataset = {}; this.attributes = {}; this.style = {}; this.hidden = false; this.open = false; this.value = ''; this.textContent = ''; this.classes = new Set();
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
  constructor() { this.zoom = 1.25; this.follow = true; this.mode = 'surface'; this.perspective='third-person';this.elevation = false; this.showLifeline = true; this.effects = [];this.yaw=Math.PI/4;this.pitch=.65;this.lookYaw=this.yaw+Math.PI;this.lookPitch=0; }
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
const app = fs.readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8').replace(/^import .+;\n/gm, '');
const data = Object.fromEntries(['terrain', 'mission', 'ephemerides','academy'].map(n => [n === 'mission' ? 'config' : n, JSON.parse(fs.readFileSync(new URL('../dist/data/' + n + '.json', import.meta.url)))]));
function interfaceContext(storage,{skipStory=true}={}) {
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
  const classes = Object.fromEntries(['.mission-number','.world-tools','.world-footer>span:first-child'].map(k => [k,new Element()]));
  const documentEvents = new Element();
  const document = {
    body: new Element(), hidden: false, getElementById: id => nodes.get(id), createElement: tag => new Element('',tag), addEventListener: (...args)=>documentEvents.addEventListener(...args), fire: (...args)=>documentEvents.fire(...args),
    querySelector(selector) { if (selector === 'dialog[open]') return dialogIds.map(id => nodes.get(id)).find(e => e.open) || null; if (selector === '.playfield') return playfield; return classes[selector] || null; },
    querySelectorAll(selector) { if (selector === '.objectives li') return nodes.get('objectives').children; if (selector === 'dialog') return dialogIds.map(id => nodes.get(id)); if(selector==='[data-question]')return prompts; return []; }
  };
  for(const e of nodes.values())e.ownerDocument=document;
  const windowEvents = new Element();
  const ctx = { document, Mission, TrainingMission, clamp, AcademyGuide, Soundtrack, StorySequence, MovablePanel, resolveRouteRequest, planSurfaceRoute, readPreference, writePreference, Renderer: RenderDouble,
    LUNA_DATA: data, localStorage: storage, devicePixelRatio: 1, innerWidth:1440, innerHeight:900, matchMedia: () => ({ matches: false }), addEventListener:(...args)=>windowEvents.addEventListener(...args), fire:(...args)=>windowEvents.fire(...args),
    ResizeObserver: class { observe() {} }, console, setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame(fn) { ctx.frame = fn; }
  };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(app, ctx);if(skipStory&&nodes.get('story-dialog').open)nodes.get('story-skip').fire('click');return { ctx, nodes, playfield, document, prompts };
}
function travel(m, point) { assert.equal(m.navigate(point),true); let guard=20000; while(m.route && guard-- > 0)m.update(.1); assert.ok(guard>0); }
function solve(m) { for (let i=0;i<9;i++)while(m.circuit.turns[i])m.circuit.rotate(i); }
test('academy controller restores guidance, keeps Settings reversible, and unlocks level 2 immediately after the field task', () => {
  const values = new Map([['luna-tutorial-v1', JSON.stringify({completed:true})]]), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key,value) };
  const { ctx, nodes } = interfaceContext(storage), { mission: m, tutorial: guide } = ctx.luna;
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
  const reloaded=interfaceContext(storage);assert.equal(reloaded.ctx.luna.mission.levelIndex,1);assert.equal(reloaded.ctx.luna.mission.rank,'EVA Cadet');
});
test('systems workbench pauses resources, rejects oversupply, and awards a practical badge before the optional check',()=>{
  const {ctx,nodes}=interfaceContext(null),m=ctx.luna.mission;m.unlocked=1;m.loadLevel(1);ctx.refreshLesson();nodes.get('start-button').fire('click');nodes.get('next-action-button').fire('click');
  assert.equal(nodes.get('repair-dialog').open,true);solve(m);ctx.renderCircuit();nodes.get('apply-repair').fire('click');assert.equal(m.state.training.powerBus,true);
  nodes.get('next-action-button').fire('click');assert.equal(nodes.get('systems-dialog').open,true);assert.equal(m.state.status,'paused');assert.equal(nodes.get('apply-power').disabled,true);
  for(const [k,v] of [['life',12],['food',3],['comms',2]])nodes.get('power-'+k).value=String(v);nodes.get('power-life').fire('input');assert.equal(nodes.get('apply-power').disabled,true);assert.match(nodes.get('power-feedback').textContent,/Over budget/);
  nodes.get('power-life').value='4';nodes.get('power-life').fire('input');assert.equal(nodes.get('apply-power').disabled,false);nodes.get('apply-power').fire('click');
  assert.equal(nodes.get('systems-dialog').open,false);assert.equal(nodes.get('debrief-dialog').open,true);assert.equal(m.state.status,'complete');assert.equal(m.state.training.power.reserve,3);assert.equal(m.completed.length,1);assert.equal(m.xp,300);
  nodes.get('review-answers').children[1].fire('click');assert.equal(m.completed[0].id,'systems');assert.equal(m.unlocked,2);
});
test('live 3D workbench demonstrates equipment without awarding progress, then continues directly after hands-on alignment',()=>{
  const {ctx,nodes}=interfaceContext(null),m=ctx.luna.mission,r=ctx.luna.renderer;m.unlocked=9;m.loadLevel(5);ctx.refreshLesson();nodes.get('start-button').fire('click');nodes.get('next-action-button').fire('click');
  assert.equal(nodes.get('training-workbench').hidden,false);assert.equal(m.state.status,'paused');assert.equal(nodes.get('debrief-dialog').open,false);assert.equal(nodes.get('tutorial-card').hidden,true);assert.ok(r.demonstration);
  const state=JSON.stringify(m.state);nodes.get('workbench-demo').fire('click');assert.equal(JSON.stringify(m.state),state);assert.equal(m.completed.length,0);
  const rows=nodes.get('workbench-ranges').children;for(const [i,v]of [[0,35],[1,110]]){const input=rows[i].children[2];input.value=String(v);input.fire('input');}
  assert.equal(r.demonstration,null);assert.equal(m.state.training.drill.tilt,35);assert.equal(m.state.training.drill.bearing,110);assert.equal(nodes.get('workbench-action').disabled,false);
  const yaw=r.yaw,pitch=r.pitch;nodes.get('world').fire('pointerdown',{button:0,pointerId:8,clientX:300,clientY:200});nodes.get('world').fire('pointermove',{pointerId:8,clientX:450,clientY:250});nodes.get('world').fire('pointerup',{pointerId:8});assert.ok(r.yaw!==yaw&&r.pitch!==pitch);assert.ok(r.cameraPinned);
  nodes.get('workbench-action').fire('click');assert.equal(m.state.status,'complete');assert.equal(nodes.get('workbench-next').hidden,false);assert.equal(m.completed[0].id,'solar');assert.equal(m.reviewPassed,false);
  nodes.get('workbench-next').fire('click');assert.equal(m.levelIndex,6);assert.equal(m.state.status,'ready');assert.equal(nodes.get('training-workbench').hidden,true);
});
test('normal mouse and touch dragging looks around without sending a walking route',()=>{
  const {ctx,nodes}=interfaceContext(null),m=ctx.luna.mission,r=ctx.luna.renderer;
  m.start();let calls=0;m.navigate=()=>{calls++;return true;};r.pickPoint=m.practice;
  const yaw=r.yaw,pitch=r.pitch;nodes.get('orbit-left').fire('click');nodes.get('tilt-up').fire('click');assert.ok(r.yaw<yaw&&r.pitch>pitch);
  for(const pointerType of ['mouse','touch']){
    const before=[r.yaw,r.pitch];nodes.get('world').fire('pointerdown',{button:0,pointerId:9,pointerType,clientX:300,clientY:200});assert.equal(calls,0);
    nodes.get('world').fire('pointermove',{pointerId:9,clientX:400,clientY:160});nodes.get('world').fire('pointerup',{pointerId:9,clientX:400,clientY:160});
    assert.ok(r.yaw!==before[0]&&r.pitch!==before[1]);assert.equal(calls,0);
  }
});
test('only a completed click plots a route; cancelled and right-button gestures do not',()=>{
  const {ctx,nodes}=interfaceContext(null),m=ctx.luna.mission,r=ctx.luna.renderer;m.start();let calls=0;m.navigate=()=>{calls++;return true;};r.pickPoint=m.practice;const world=nodes.get('world');
  world.fire('pointerdown',{button:0,pointerId:1,clientX:300,clientY:200});assert.equal(calls,0);
  world.fire('pointermove',{pointerId:1,clientX:302,clientY:201});world.fire('pointerup',{pointerId:1,clientX:302,clientY:201});assert.equal(calls,1);
  world.fire('pointerdown',{button:0,pointerId:2,clientX:300,clientY:200});world.fire('pointercancel',{pointerId:2});world.fire('pointerup',{pointerId:2,clientX:300,clientY:200});assert.equal(calls,1);
  world.fire('pointerdown',{button:2,pointerId:3,clientX:300,clientY:200});world.fire('pointerup',{pointerId:3,clientX:300,clientY:200});assert.equal(calls,1);
  world.fire('pointerdown',{button:0,pointerId:4,clientX:300,clientY:200});world.fire('lostpointercapture',{pointerId:4});world.fire('pointerup',{pointerId:4,clientX:300,clientY:200});assert.equal(calls,1);
});
test('pan gestures explore the terrain without turning the camera or walking the astronaut',()=>{
  const {ctx,nodes}=interfaceContext(null),r=ctx.luna.renderer,m=ctx.luna.mission;const world=nodes.get('world'),before=JSON.stringify(m.state.player),yaw=r.yaw;
  nodes.get('camera-mode-button').fire('click');assert.equal(nodes.get('camera-mode-button').getAttribute('aria-pressed'),'true');
  world.fire('pointerdown',{button:0,pointerId:1,clientX:300,clientY:200});world.fire('pointermove',{pointerId:1,clientX:400,clientY:160});world.fire('pointerup',{pointerId:1});
  assert.equal(r.panned.x,100);assert.equal(r.panned.y,-40);assert.equal(r.yaw,yaw);assert.equal(JSON.stringify(m.state.player),before);assert.equal(m.route,null);
  nodes.get('camera-mode-button').fire('click');r.panned=null;
  world.fire('pointerdown',{button:0,shiftKey:true,pointerId:2,clientX:300,clientY:200});world.fire('pointermove',{pointerId:2,clientX:350,clientY:220});world.fire('pointerup',{pointerId:2});assert.equal(r.panned.x,50);
});
test('astronaut view has a button and keyboard shortcut, keeps look dragging, and restores after equipment practice',()=>{
  const {ctx,nodes,document}=interfaceContext(null),r=ctx.luna.renderer,m=ctx.luna.mission;nodes.get('first-person-button').fire('click');
  assert.equal(r.perspective,'first-person');assert.equal(nodes.get('first-person-button').getAttribute('aria-pressed'),'true');assert.equal(nodes.get('camera-mode-button').disabled,true);assert.equal(nodes.get('camera-aim').hidden,false);
  const yaw=r.lookYaw,pitch=r.lookPitch;nodes.get('world').fire('pointerdown',{button:0,pointerId:1,clientX:300,clientY:200});nodes.get('world').fire('pointermove',{pointerId:1,clientX:400,clientY:250});nodes.get('world').fire('pointerup',{pointerId:1});assert.ok(r.lookYaw>yaw&&r.lookPitch<pitch);assert.equal(m.route,null);
  nodes.get('inspect-objective').fire('click');assert.equal(r.objectiveShown,true);nodes.get('camera-overview').fire('click');assert.equal(r.perspective,'third-person');assert.equal(r.overviewShown,true);
  nodes.get('camera-home').fire('click');assert.equal(r.perspective,'first-person');assert.equal(nodes.get('camera-aim').hidden,false);
  m.unlocked=9;m.loadLevel(5);ctx.refreshLesson();nodes.get('start-button').fire('click');nodes.get('next-action-button').fire('click');assert.equal(r.perspective,'third-person');
  nodes.get('workbench-close').fire('click');assert.equal(r.perspective,'first-person');assert.equal(m.state.status,'playing');
  document.fire('keydown',{key:'f',target:nodes.get('world')});assert.equal(r.perspective,'third-person');assert.equal(nodes.get('first-person-button').getAttribute('aria-pressed'),'false');
});
test('repair interface follows each apparatus layout and its tutorial points at the actual input and output',()=>{
  const {ctx,nodes}=interfaceContext(null),m=ctx.luna.mission;m.unlocked=2;m.loadLevel(1);ctx.refreshLesson();nodes.get('start-button').fire('click');nodes.get('next-action-button').fire('click');
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
test('opening ignores the legacy seen flag, runs once per visit and does not replay on mission or tutorial restart',()=>{
 const values=new Map([['luna-story-seen-v2','true']]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const {ctx,nodes}=interfaceContext(storage,{skipStory:false}),m=ctx.luna.mission;
 assert.equal(nodes.get('story-dialog').open,true);assert.equal(nodes.get('tutorial-card').hidden,true);
 const reserves=[m.state.oxygen,m.state.water,m.state.suitWh];for(let i=0;i<60;i++)ctx.frame(i*1000/60);
 assert.equal(m.state.time,0);assert.deepEqual([m.state.oxygen,m.state.water,m.state.suitWh],reserves);
 for(let i=60;i<350;i++)ctx.frame(1000+i*100);
 assert.equal(nodes.get('story-dialog').open,false);assert.equal(nodes.get('tutorial-card').hidden,false);assert.equal(ctx.luna.story.state,'finished');
 assert.deepEqual([m.state.oxygen,m.state.water,m.state.suitWh],reserves);
 const reloaded=interfaceContext(storage,{skipStory:false});assert.equal(reloaded.nodes.get('story-dialog').open,true);
 nodes.get('tutorial-restart').fire('click');assert.equal(nodes.get('story-dialog').open,false);
 ctx.openStory();assert.equal(nodes.get('story-dialog').open,false);
 m.reset();ctx.refreshLesson();assert.equal(nodes.get('story-dialog').open,false);
 const skipped=interfaceContext(null,{skipStory:false});skipped.nodes.get('story-skip').fire('click');assert.equal(skipped.ctx.luna.story.state,'skipped');
});
test('opening preference persists while skipping only affects the current visit and toggling never interrupts a mission',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const {ctx,nodes}=interfaceContext(storage,{skipStory:false});nodes.get('story-skip').fire('click');assert.equal(ctx.luna.story.state,'skipped');
 assert.equal(interfaceContext(storage,{skipStory:false}).nodes.get('story-dialog').open,true);
 nodes.get('start-button').fire('click');const progress=JSON.stringify(ctx.luna.mission.state);
 nodes.get('opening-toggle').fire('click');assert.equal(ctx.luna.story.enabled,false);assert.equal(nodes.get('opening-toggle').getAttribute('aria-pressed'),'false');assert.equal(JSON.stringify(ctx.luna.mission.state),progress);
 assert.equal(interfaceContext(storage,{skipStory:false}).nodes.get('story-dialog').open,false);
 nodes.get('opening-toggle').fire('click');assert.equal(nodes.get('story-dialog').open,false);assert.equal(JSON.stringify(ctx.luna.mission.state),progress);
 assert.equal(interfaceContext(storage,{skipStory:false}).nodes.get('story-dialog').open,true);
});
test('ASTRA previews a calculated path and follows it only when the player chooses Follow route',()=>{
 const {ctx,nodes}=interfaceContext(null),m=ctx.luna.mission;
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

test('ASTRA opens on demand, answers questions, retains its moved position, and leaves game controls isolated', () => {
  const values = new Map(), storage = { getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value) };
  const { ctx, nodes, document, prompts }=interfaceContext(storage), m=ctx.luna.mission;
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
  const reloaded=interfaceContext(storage); reloaded.nodes.get('astra-button').fire('click'); assert.deepEqual([reloaded.nodes.get('astra-card').style.left,reloaded.nodes.get('astra-card').style.top],position);
  ctx.openDialog(nodes.get('help-dialog')); assert.equal(nodes.get('astra-card').hidden,true); assert.equal(nodes.get('help-dialog').open,true);
  nodes.get('help-dialog').close(); document.fire('keydown',{target:nodes.get('world'),key:'w'});
  for(let i=21;i<=40;i++)ctx.frame(i*1000/60);
  assert.ok(m.state.player.x!==start.x||m.state.player.y!==start.y);
});
