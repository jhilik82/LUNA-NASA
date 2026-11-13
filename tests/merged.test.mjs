import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AstronomicalWorld} from '../dist/astronomy-world.js';
import {createDestinationMission} from '../dist/worlds.js';
import {simulateOutpost} from '../dist/expedition.js';
import {AcademyGuide} from '../dist/academy-guide.js';
import {StorySequence} from '../dist/story.js';
import {MissionAudio} from '../dist/mission-audio.js';
import {FlightSimulation} from '../dist/voyage.js';
const files={terrain:'terrain',config:'mission',ephemerides:'ephemerides',academy:'academy',marsTerrain:'terrain-mars',solar:'solar-system',tranquillitatis:'terrain-tranquillitatis',astronomy:'astronomy',stars:'stars',scenarios:'scenarios'},pack=Object.fromEntries(Object.entries(files).map(([k,n])=>[k,JSON.parse(fs.readFileSync(new URL('../dist/data/'+n+'.json',import.meta.url)))]));
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
function create(world='moon',store=storage()){const a=new AstronomicalWorld(pack.astronomy,pack.stars);a.setMissionUTC(a.utc+(world==='moon'?3:210)*86400+800);return createDestinationMission(pack,world,store,'expedition',a);}
function operate(m){m.state.player={...m.target()};m.state.expedition.taskDone=true;}
for(const world of ['moon','mars'])test(world+' forecast is pure, matches committed resources, and rejects a repeated stage confirmation',()=>{
 const m=create(world);m.start();operate(m);const before=JSON.stringify(m.state),p=m.preview(m.stage.options[0]);assert.equal(JSON.stringify(m.state),before);const t=m.state.time;assert.ok(m.choose(m.stage.options[0].id,0));assert.deepEqual(m.state.expedition.outpost,p.outpost);assert.equal(m.state.time,t+p.minutes*60);assert.deepEqual({oxygen:m.state.oxygen,energy:m.state.suitWh,water:m.state.water},p.suit);const after=JSON.stringify(m.state);assert.equal(m.choose(m.stage.options[0].id,0),false);assert.equal(JSON.stringify(m.state),after);
});
test('messages spend energy once and arrive on mission time, with a longer Mars delay',()=>{
 const moon=create(),mars=create('mars');assert.ok(mars.earthDelay()>moon.earthDelay()*100);for(const m of [moon,mars]){m.start();const energy=m.state.expedition.outpost.energy;assert.equal(m.askEarth(),true);assert.equal(m.askEarth(),false);assert.equal(m.state.expedition.outpost.energy,energy-.15);const reply=m.state.expedition.messages[0];m.consumeTime(reply.due-m.state.time-.1,true);assert.equal(reply.delivered,false);m.consumeTime(.2,true);assert.equal(reply.delivered,true);}
});
test('guide holds reading time, acknowledges objectives and survives toggle without completing a procedure',()=>{
 const m=create(),g=new AcademyGuide(m);m.start();assert.equal(g.holdsTime,true);m.acknowledgeGuide();assert.equal(g.holdsTime,false);g.disable();const s=JSON.stringify(m.state);g.restart();g.sync(m);assert.equal(JSON.stringify(m.state),s);assert.equal(m.state.expedition.taskDone,false);assert.equal(g.holdsTime,false);
});
test('crop harvest is delayed and requires power while more growing power uses water',()=>{
 const m=create(),o={...m.state.expedition.outpost,foodKw:4,arrayOnline:true,leak:false};const short=simulateOutpost(o,60,m.rules);assert.equal(short.harvests,0);const grown=simulateOutpost(o,7200,m.rules);assert.ok(grown.harvests>=1);const dark=simulateOutpost({...o,arrayOnline:false,energy:0,backupKw:0},7200,m.rules);assert.equal(dark.harvests,0);const dim=simulateOutpost({...o,foodKw:1},7200,m.rules);assert.ok(grown.water<dim.water);
});
test('schema-2 saves receive new garden, message and guide fields without losing progress',()=>{
 const store=storage(),m=create('moon',store);m.start();m.state.expedition.stage=2;m.saveCheckpoint();const record=JSON.parse(store.getItem(m.saveKey));for(const k of ['messages','askedStages','guideReadStages','revision'])delete record.state.expedition[k];delete record.state.expedition.outpost.growthHours;store.setItem(m.saveKey,JSON.stringify(record));const next=create('moon',store);assert.ok(next.replayCheckpoint());assert.equal(next.state.expedition.stage,2);assert.deepEqual(next.state.expedition.messages,[]);assert.equal(next.state.expedition.outpost.growthHours,0);
});
test('accessible landing shares unsafe retry checks and requires confirmed touchdown before exit',()=>{
 const f=new FlightSimulation(pack.solar);f.enter('speed');assert.equal(f.disembark(),false);f.setLandingTarget('speed',8);f.lock();f.setLandingTarget('angle',0);f.lock();assert.equal(f.phase,'go-around');for(let i=0;i<51;i++)f.update(.1);f.setLandingTarget('speed',2);f.lock();f.setLandingTarget('angle',0);f.lock();assert.equal(f.phase,'descent');assert.equal(f.disembark(),false);for(let i=0;i<130;i++)f.update(.1);assert.equal(f.phase,'landed');assert.equal(f.disembark(),true);
});
test('story starts on its own and plays every scene continuously with no hold between chapters',()=>{
 const s=new StorySequence();s.attachAudio({});assert.equal(s.start(),true);assert.equal(s.index,0);
 let last=s.elapsed,seen=[];
 while(s.active){s.update(.1);assert.ok(s.elapsed>last||!s.active,'the timeline never freezes');last=s.elapsed;if(seen.at(-1)!==s.chapter.shot)seen.push(s.chapter.shot);}
 assert.deepEqual(seen,['arrival','echo','relay','astronaut']);assert.equal(s.state,'finished');assert.ok(Math.abs(last-26)<1e-6);
 const h=new StorySequence();h.attachAudio({});h.start();h.update(.1);const t=h.elapsed;h.update(.1,true);assert.equal(h.elapsed,t,'hidden page pauses the story');
});
test('narration is fully removed: no speech API, no voice settings and no bundled clips',()=>{
 const a=new MissionAudio(null);assert.equal(typeof a.say,'undefined');assert.equal('voiceOn' in a.settings,false);
 assert.equal(fs.existsSync(new URL('../dist/narration.js',import.meta.url)),false);assert.equal(fs.existsSync(new URL('../dist/assets/audio/voice',import.meta.url)),false);
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/voice-(toggle|volume|select|preview|captions)/);
});
