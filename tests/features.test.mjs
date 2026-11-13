import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { createDestinationMission } from '../dist/worlds.js';
import { AstronomicalWorld } from '../dist/astronomy-world.js';
import { Circuit } from '../dist/engine.js';
import { buildRecapQuiz, scoreRecap } from '../dist/recap-quiz.js';
import { PuzzleTimer, puzzleTimeLimit, OXYGEN_MINUTES_PER_OVERTIME_SECOND } from '../dist/puzzle-timer.js';
import { chooseWeather, stageWeather, CONDITIONS, WeatherEffects } from '../dist/weather.js';
import { installColorGrade } from '../dist/grading.js';
import { createAstronaut, makeMaterials, SUIT_ACCENTS } from '../dist/models.js';
import { rendererFixture } from './renderer-fixture.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL('../dist/data/' + name + '.json', import.meta.url)));
const files = { terrain: 'terrain', config: 'mission', ephemerides: 'ephemerides', academy: 'academy', marsTerrain: 'terrain-mars', solar: 'solar-system', tranquillitatis: 'terrain-tranquillitatis', astronomy: 'astronomy', stars: 'stars', scenarios: 'scenarios' };
const pack = Object.fromEntries(Object.entries(files).map(([k, n]) => [k, read(n)]));
const storage = () => { const d = new Map(); return { getItem: k => d.get(k) ?? null, setItem: (k, v) => d.set(k, v) }; };
const mission = (world, mode) => createDestinationMission(pack, world, storage(), mode, new AstronomicalWorld(pack.astronomy, pack.stars));

test('recap quiz: flight-school questions come from this lesson, place and run', () => {
  const m = mission('mars', 'training'), d = { ...m.debrief(), success: true, oxygenPercent: 83, journal: [{ type: 'scan', message: 'Terrain observation recorded at the beacon.' }] };
  const quiz = buildRecapQuiz(m, d, { seed: 7 });
  assert.ok(quiz.questions.length >= 3 && quiz.questions.length <= 4);
  for (const q of quiz.questions) { assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id + ' has a valid answer'); assert.equal(new Set(q.options).size, q.options.length, 'no duplicate options'); }
  const by = id => quiz.questions.find(q => q.id === id);
  assert.equal(by('skill').options[by('skill').answer], m.lesson.skill);
  assert.equal(by('site').options[by('site').answer], 'Jezero Crater on Mars');
  assert.equal(by('event').options[by('event').answer], 'Terrain observation recorded at the beacon.');
  assert.equal(by('oxygen').options[by('oxygen').answer], 'Between 70% and 90%');
  assert.equal(scoreRecap(quiz, quiz.questions.map(q => q.answer)), quiz.questions.length);
});

test('recap quiz: expedition questions ask about the decisions the player really made', () => {
  const m = mission('moon', 'expedition'), stage = pack.scenarios.moon.stages[0], option = stage.options[1];
  const d = { ...m.debrief(), success: true, decisions: [{ stage: stage.id, title: stage.title, choice: option.id, label: option.label }], journal: [], oxygenPercent: 40 };
  const quiz = buildRecapQuiz(m, d, { seed: 3, scenarios: pack.scenarios }), q = quiz.questions.find(q => q.id === 'decision-0');
  assert.ok(q, 'decision question exists');
  assert.equal(q.options[q.answer], option.label);
  for (const other of stage.options.filter(o => o !== option)) assert.ok(q.options.includes(other.label), 'other plans of that stage are the distractors');
  assert.equal(quiz.questions.find(q => q.id === 'goal').options[quiz.questions.find(q => q.id === 'goal').answer], pack.scenarios.moon.skill);
});

test('puzzle timer: time up scrambles and restarts unless oxygen overtime is switched on', () => {
  assert.equal(puzzleTimeLimit('relay'), 60); assert.equal(puzzleTimeLimit('outpost', true), 135);
  const t = new PuzzleTimer(10);
  assert.equal(t.update(4).type, 'running'); assert.equal(t.label(), '0:06'); assert.equal(t.level, 'ok');
  t.update(4); assert.equal(t.level, 'warning');
  assert.equal(t.update(3).type, 'reset', 'default: the bus trips'); assert.equal(t.remaining, 10); assert.equal(t.resets, 1);
  t.update(9.5); const over = t.update(1.5, { useOxygen: true });
  assert.equal(over.type, 'overtime'); assert.ok(Math.abs(over.oxygenMinutes - 1 * OXYGEN_MINUTES_PER_OVERTIME_SECOND) < 1e-9, 'only the seconds past zero cost oxygen');
  assert.match(t.label(), /^\+0:01 overtime$/);
  assert.equal(t.update(.5, { useOxygen: false }).type, 'reset', 'switching the toggle off in overtime trips the bus');
  assert.equal(t.update(5, { paused: true }).type, 'running'); assert.equal(t.remaining, 10, 'hidden page pauses the clock');
});

test('circuit scramble never leaves the puzzle solved, and overtime oxygen can end the mission', () => {
  const c = new Circuit(42);
  for (let s = 1; s < 60; s++) { c.scramble(s); assert.equal(c.connected(), false); assert.equal(c.moves, 0); }
  const m = mission('moon', 'training'); m.state.status = 'repair'; m.circuit = c; const before = m.state.oxygen;
  m.spendOxygen(5); assert.equal(m.state.oxygen, before - 5); assert.equal(m.state.status, 'repair');
  m.spendOxygen(1e6); assert.equal(m.state.oxygen, 0); assert.equal(m.state.status, 'failed'); assert.match(m.state.failureReason, /Oxygen reserve exhausted during repair overtime/);
});

test('weather: every place has conditions; choice is stable, overridable and follows expedition stages', () => {
  for (const place of ['earth', 'mars', 'moon', 'space']) assert.ok(CONDITIONS[place].length >= 2, place);
  assert.equal(chooseWeather('mars', 1000), chooseWeather('mars', 2000), 'same six-hour window, same weather');
  const seen = new Set(); for (let h = 0; h < 400; h++) seen.add(chooseWeather('earth', h * 21600).id); assert.ok(seen.size >= 3, 'weather changes over time');
  assert.equal(chooseWeather('earth', 0, 'storm').id, 'storm'); assert.equal(chooseWeather('mars', 0, 'storm').id, 'storm'); assert.equal(chooseWeather('moon', 0, 'storm').id, 'solar-storm');
  assert.equal(chooseWeather('moon', 0, 'clear').id, 'quiet');
  assert.equal(stageWeather('moon', 'shelter'), 'solar-storm'); assert.equal(stageWeather('mars', 'shelter'), 'storm');
  assert.ok(!CONDITIONS.moon.some(c => c.wind || c.rain || c.dust), 'no wind, rain or blowing dust on the airless Moon');
});

test('weather effects: each condition shows only its own visuals and returns light modifiers', () => {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(); camera.position.set(10, 2, 5); camera.updateMatrixWorld(true);
  const earth = new WeatherEffects(scene, { place: 'earth' });
  earth.setCondition(CONDITIONS.earth.find(c => c.id === 'clear')); let w = earth.update(.1, camera);
  assert.equal(earth.rain.visible, false); assert.equal(w.sun, 1);
  earth.setCondition(CONDITIONS.earth.find(c => c.id === 'storm')); earth.nextStrike = 0; w = earth.update(.1, camera, { groundY: 0 });
  assert.equal(earth.rain.visible, true); assert.ok(w.sun < .5); assert.ok(w.flash > 0, 'lightning flash'); assert.ok(w.fogDensity > 0);
  const mars = new WeatherEffects(scene, { place: 'mars', scale: 4 });
  mars.setCondition(CONDITIONS.mars.find(c => c.id === 'devils')); mars.update(.1, camera, { groundY: 0 }); assert.equal(mars.devils.visible, true);
  mars.setCondition(CONDITIONS.mars.find(c => c.id === 'storm')); w = mars.update(.1, camera, { groundY: 0 });
  assert.equal(mars.dust.visible, true); assert.ok(Math.abs(w.fogDensity - 1.4 / (220 * 4)) < 1e-12, 'dust-storm visibility ~220 m');
  const moon = new WeatherEffects(scene, { place: 'moon' });
  moon.setCondition(CONDITIONS.moon.find(c => c.id === 'solar-storm')); moon.update(.1, camera);
  assert.equal(moon.flashes.visible, true); assert.equal(moon.rain.visible, false); assert.equal(moon.dust.visible, false);
  moon.update(.1, camera, { reducedMotion: true }); assert.equal(moon.flashes.visible, false, 'reduced motion hides flashing particles');
  for (const fx of [earth, mars, moon]) fx.dispose();
  assert.equal(scene.children.length, 0);
});

test('colour grade is installed in the shared tone-mapping shader and used by the surface renderer', () => {
  assert.equal(installColorGrade(), true);
  assert.match(THREE.ShaderChunk.tonemapping_pars_fragment, /LUNA colour grade/);
  assert.match(THREE.ShaderChunk.tonemapping_pars_fragment, /ACESFilmicToneMapping\( color \)/);
  const r = rendererFixture(mission('moon', 'training'));
  assert.equal(r.device.toneMapping, THREE.CustomToneMapping);
  assert.ok(r.weather, 'surface world has weather');
});

test('spacesuits: white suits with bold accent panels, a different colour for each crew member', () => {
  const mat = makeMaterials(), a = createAstronaut(mat), b = createAstronaut(mat, { accent: SUIT_ACCENTS.botanist });
  const accents = model => { const set = new Set(); model.traverse(o => { if (o.isMesh && mat.suitAccents && [...mat.suitAccents.values()].includes(o.material)) set.add(o.material.color.getHexString()); }); return set; };
  assert.deepEqual([...accents(a)], [SUIT_ACCENTS.player.slice(1)]);
  assert.deepEqual([...accents(b)], [SUIT_ACCENTS.botanist.slice(1)]);
  for (const name of ['shoulder-cap', 'thigh-stripe', 'knee-cap', 'toe-cap', 'helmet-side-stripe']) assert.ok(a.getObjectByName(name), name);
  const r = rendererFixture(mission('moon', 'training'));
  const crew = new Set(r.crew.actors.map(x => { let c = null; x.model.traverse(o => { if (o.isMesh && [...mat.suitAccents.values()].length && o.material?.emissiveIntensity === .06) c = o.material.color.getHexString(); }); return c; }));
  assert.equal(crew.size, 3, 'three crewmates, three suit colours');
});
