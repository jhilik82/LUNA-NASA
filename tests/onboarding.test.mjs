import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Mission } from '../dist/engine.js';
import { Tutorial, tutorialSteps } from '../dist/tutorial.js';
import { Soundtrack } from '../dist/audio.js';
const read = name => JSON.parse(fs.readFileSync(new URL('../dist/data/' + name, import.meta.url)));
const create = () => new Mission(read('terrain.json'), read('mission.json'), read('ephemerides.json'));
function memory() { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }; }
function travel(mission, point, guide, seen) {
  assert.equal(mission.navigate(point), true);
  let guard = 20000;
  while (mission.route && guard-- > 0) {
    guide.sync(mission); seen.add(guide.step.id);
    if (guide.holdsTime) { const before = JSON.stringify(mission.state); guide.sync(mission); assert.equal(JSON.stringify(mission.state), before); guide.next(); }
    else mission.update(0.1);
  }
  assert.ok(guard > 0); guide.sync(mission);
}
function repair(m, guide) { m.interact(); guide.sync(m); assert.equal(guide.step.command, 'hint'); for (let i = 0; i < 9; i++) while (m.circuit.turns[i]) m.circuit.rotate(i); m.completeRepair(); guide.sync(m); }
test('first-play guide follows a real recovery mission and permanently disables on docking', () => {
  const store = memory(), guide = new Tutorial(store), m = create(), seen = new Set();
  assert.equal(guide.active, true); assert.equal(guide.step.id, 'welcome');
  m.start(); guide.sync(m); assert.equal(guide.step.id, 'move');
  travel(m, m.objects.relay, guide, seen); assert.equal(guide.step.id, 'relay-arrive'); repair(m, guide);
  travel(m, m.state.rover, guide, seen); assert.equal(guide.step.id, 'echo-arrive'); repair(m, guide);
  assert.equal(guide.step.id, 'board'); m.interact(); guide.sync(m); assert.equal(guide.step.id, 'orbital'); assert.equal(guide.holdsTime, true); guide.next();
  travel(m, m.objects.base, guide, seen); assert.equal(guide.active, true); m.interact(); guide.sync(m);
  assert.equal(m.state.status, 'complete'); assert.equal(guide.active, false); assert.equal(guide.reason, 'completed');
  assert.equal(new Tutorial(store).active, false, 'Reloading must not replay a completed guide');
  assert.ok(seen.has('reserves')); assert.ok(seen.has('astra')); assert.ok(seen.has('home'));
});
test('skipping persists across visits and explicit restart re-enables the first step', () => {
  const store = memory(), guide = new Tutorial(store); guide.disable();
  const nextVisit = new Tutorial(store); assert.equal(nextVisit.active, false);
  nextVisit.restart(); assert.equal(nextVisit.active, true); assert.equal(nextVisit.index, 0);
  assert.equal(new Tutorial(store).active, true);
});
test('blocked or malformed preference storage never stops the expedition', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const guide = new Tutorial(blocked); assert.equal(guide.active, true); assert.doesNotThrow(() => guide.disable());
  const malformed = { getItem: () => '{invalid', setItem() {} }; assert.equal(new Tutorial(malformed).active, true);
  const soundtrack = new Soundtrack(blocked); assert.equal(soundtrack.volume, 0.45); assert.doesNotThrow(() => soundtrack.setMuted(true));
});
test('tutorial targets exist and reading steps are distinct from mission action steps', () => {
  const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  for (const step of tutorialSteps) assert.ok(html.includes('id="' + step.target + '"'), 'Missing target: ' + step.target);
  assert.deepEqual(tutorialSteps.filter(s => s.hold).map(s => s.id), ['reserves', 'astra', 'orbital']);
});
class AudioParam { constructor(value = 0) { this.value = value; } setTargetAtTime(value) { this.value = value; } setValueAtTime(value) { this.value = value; } exponentialRampToValueAtTime(value) { this.value = value; } }
class AudioNode { constructor(context) { this.context = context; this.gain = new AudioParam(); this.frequency = new AudioParam(); this.detune = new AudioParam(); this.delayTime = new AudioParam(); } connect() {} disconnect() { this.disconnected = true; } start() {} stop(at = this.context.currentTime) { this.ends = at; } }
class FakeAudioContext {
  constructor() { this.currentTime = 0; this.state = 'suspended'; this.destination = {}; this.oscillators = []; }
  createGain() { return new AudioNode(this); } createDelay() { return new AudioNode(this); } createDynamicsCompressor() { return new AudioNode(this); }
  createOscillator() { const node = new AudioNode(this); this.oscillators.push(node); return node; }
  async resume() { this.state = 'running'; } close() { this.state = 'closed'; }
  advance(seconds) { this.currentTime += seconds; for (const n of this.oscillators) if (n.ends <= this.currentTime && !n.done) { n.done = true; n.onended?.(); } }
}
test('audio waits for activation, adapts to real mission phases and keeps scheduled voices bounded', async () => {
  const track = new Soundtrack(memory(), FakeAudioContext), m = create();
  assert.equal(track.context, null); assert.equal(await track.activate(), true); m.start();
  for (let i = 0; i < 600; i++) { track.context.advance(0.1); track.update(m.state, { safe: true }); assert.ok(track.activeVoices < 64); }
  assert.ok(track.context.oscillators.length > 100, 'Music must keep composing, not play one launch beep');
  track.update({ ...m.state, status: 'repair' }, { safe: true }); assert.equal(track.mode, 'repair');
  track.update({ ...m.state, rover: { occupied: true } }, { safe: true }); assert.equal(track.mode, 'drive');
  track.update(m.state, { safe: false }); assert.equal(track.mode, 'tension');
  track.update({ ...m.state, status: 'complete' }, { safe: true }); assert.equal(track.mode, 'home');
  track.setHidden(true); assert.equal(track.master.gain.value, 0); const before = track.beat; track.update(m.state, { safe: true }); assert.equal(track.beat, before);
  track.setHidden(false); track.setMuted(true); assert.equal(track.master.gain.value, 0); track.dispose(); assert.equal(track.context.state, 'closed');
});
test('audio volume and mute persist across visits and unsupported audio stays optional', async () => {
  const store = memory(), track = new Soundtrack(store, FakeAudioContext); track.setVolume(0.22); track.setMuted(true);
  const returning = new Soundtrack(store); assert.equal(returning.volume, 0.22); assert.equal(returning.muted, true);
  assert.equal(await returning.activate(), false); assert.equal(returning.context, null);
});
test('opening sound cues run once at their scene beats and respect mute, activation and backgrounding',async()=>{
  const track=new Soundtrack(memory(),FakeAudioContext),cues=[];track.cue=name=>cues.push(name);
  track.updateOpening(0);assert.equal(track.context,null);await track.activate();
  for(let i=1;i<=260;i++){track.context.advance(.1);track.updateOpening(i/10);assert.ok(track.activeVoices<64);}
  assert.deepEqual(cues,['landing','radio','ready']);assert.equal(track.mode,'opening');
  track.setMuted(true);track.lastOpeningTime=4;track.updateOpening(4.2);assert.equal(cues.length,3);
  track.setMuted(false);track.setHidden(true);track.lastOpeningTime=8.7;track.updateOpening(8.9);assert.equal(cues.length,3);track.dispose();
});
