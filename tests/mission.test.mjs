import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Mission, Terrain, Circuit, distance } from '../dist/engine.js';
import { isOccupied } from '../dist/world-layout.js';
const read = name => JSON.parse(fs.readFileSync(new URL('../dist/data/' + name, import.meta.url)));
const terrain = read('terrain.json'), config = read('mission.json'), ephemerides = read('ephemerides.json');
const create = () => new Mission(terrain, config, ephemerides);
function arrive(mission, point) {
  assert.equal(mission.navigate(point), true, 'Destination must have a traversable route');
  let guard = 20000;
  while (mission.route && mission.state.status === 'playing' && guard-- > 0) mission.update(0.1);
  assert.ok(guard > 0, 'Route should finish within a bounded number of steps');
  assert.equal(mission.state.status, 'playing', 'Configured reserves should support this route');
  assert.ok(distance(mission.state.player, point) * terrain.cellMetres <= config.interactionMetres, 'Route should reach clear ground within interaction range');
  assert.equal(isOccupied(mission.state.player,mission.colliders()),false,'Walking must finish outside solid equipment');
}
function repair(mission) {
  mission.interact();
  assert.equal(mission.state.status, 'repair');
  assert.equal(mission.completeRepair(), false, 'An unconnected circuit cannot repair the equipment');
  for (let i = 0; i < 9; i++) while (mission.circuit.turns[i] !== 0) mission.circuit.rotate(i);
  assert.equal(mission.circuit.connected(), true);
  assert.equal(mission.completeRepair(), true);
}
test('NASA terrain pack has valid measurements, source provenance and lunar coordinates', () => {
  assert.equal(terrain.heights.length, 6400);
  assert.equal(terrain.source.datasetId, 'LRO-L-LOLA-4-GDR-V1.0');
  assert.equal(terrain.source.nativeResolutionMetres, 20);
  assert.equal(terrain.cellMetres, 40);
  assert.match(terrain.source.rasterRangeSha256, /^[0-9a-f]{64}$/);
  const t = new Terrain(terrain);
  for (const point of [{ x: 0, y: 0 }, { x: 79, y: 79 }, { x: 22, y: 52 }]) {
    const geo = t.geo(point);
    assert.ok(geo.lat < -87.5 && geo.lat > -90);
    assert.ok(geo.lon > 0 && geo.lon < 360);
    assert.ok(geo.elevation >= t.min && geo.elevation <= t.max);
  }
  assert.throws(() => new Terrain({ ...terrain, heights: [1, NaN] }), /invalid/);
});
test('route finding respects equipment slope limits and never leaves the terrain', () => {
  const synthetic = { width: 8, height: 8, cellMetres: 40, heights: Array.from({ length: 64 }, (_, i) => (i % 8 >= 4 ? 18 : 0)), projection: terrain.projection };
  const t = new Terrain(synthetic), a = { x: 2, y: 3 }, b = { x: 5, y: 3 };
  assert.equal(t.route(a, b, 20), null, 'A rover cannot cross the steep boundary');
  assert.ok(t.route(a, b, 32), 'The walking equipment can cross this boundary');
  assert.equal(t.route(a, { x: 0, y: 3 }, 32), null);
});
test('mission completes through navigation, two repairs, boarding and docking', () => {
  const m = create(); m.start();
  arrive(m, m.objects.relay); repair(m);
  assert.equal(m.state.phase, 'recover'); assert.equal(m.state.relayOnline, true);
  arrive(m, m.state.rover); repair(m);
  assert.equal(m.state.phase, 'return'); assert.equal(m.state.rover.repaired, true);
  m.interact(); assert.equal(m.state.rover.occupied, true);
  const initialBattery = m.state.rover.wh;
  arrive(m, m.objects.base); m.interact();
  assert.equal(m.state.status, 'complete'); assert.ok(m.state.rover.wh < initialBattery);
  assert.ok(m.state.oxygen > 0); assert.ok(m.state.distanceMetres > 3000);
  assert.equal(m.debrief().repairs, 2); assert.equal(m.debrief().success, true);
});
test('optional observations can all be collected and the rover still returned', () => {
  const m = create(); m.start();
  arrive(m, m.objects.relay); repair(m);
  for (const site of m.science) { arrive(m, site); m.scanNearby(); }
  assert.equal(m.state.scans.length, 3);
  arrive(m, m.state.rover); repair(m); m.interact();
  arrive(m, m.objects.base); m.interact();
  assert.equal(m.state.status, 'complete');
  assert.equal(m.debrief().rank, 'SCIENCE COMMANDER');
});
test('briefing, pause and the repair puzzle freeze time and all resources', () => {
  const m = create();
  const before = JSON.stringify(m.state); m.update(0.1, { dx: 1, dy: 0 }); assert.equal(JSON.stringify(m.state), before);
  m.start(); m.pause();
  const paused = JSON.stringify(m.state); m.update(0.1, { dx: 1, dy: 0 }); assert.equal(JSON.stringify(m.state), paused);
  m.pause(); arrive(m, m.objects.relay); m.interact();
  const repairing = JSON.stringify(m.state); m.update(0.1, { dx: 1, dy: 0 }); assert.equal(JSON.stringify(m.state), repairing);
});
test('checkpoint replay restores real reserves, positions, progress and time', () => {
  const m = create(); m.start(); arrive(m, m.objects.relay); repair(m);
  const snapshot = JSON.parse(JSON.stringify(m.state));
  arrive(m, m.state.rover); repair(m);
  assert.ok(m.state.oxygen < snapshot.oxygen);
  m.replayCheckpoint();
  assert.equal(m.state.phase, 'recover'); assert.equal(m.state.rover.repaired, false);
  assert.equal(m.state.time, snapshot.time); assert.equal(m.state.oxygen, snapshot.oxygen);
  assert.deepEqual(m.state.player, snapshot.player);
});
test('Lifeline responds to oxygen, rover energy and water rather than canned status', () => {
  const m = create(); m.start(); arrive(m, m.objects.relay);
  assert.equal(m.lifeline().safe, true);
  const oxygen = m.state.oxygen; m.state.oxygen = 0.1; assert.equal(m.lifeline().safe, false);
  m.state.oxygen = oxygen; m.state.water = 0; assert.equal(m.lifeline().safe, false);
  m.state.water = config.suit.waterLitres; repair(m); arrive(m, m.state.rover); repair(m); m.interact();
  assert.equal(m.lifeline().safe, true); m.state.rover.wh = 1; assert.equal(m.lifeline().safe, false);
});
test('resource exhaustion aborts safely and replay returns to a viable checkpoint', () => {
  const m = create(); m.start(); m.state.oxygen = 0.0001; m.update(0.1);
  assert.equal(m.state.status, 'failed'); assert.equal(m.debrief().success, false);
  m.replayCheckpoint(); assert.equal(m.state.status, 'playing'); assert.equal(m.state.oxygen, config.suit.oxygenMinutes);
});
test('ASTRA changes its guidance with mission phase and calculated reserves', () => {
  const m = create(); m.start(); assert.match(m.astra('next'), /surface relay/);
  arrive(m, m.objects.relay); repair(m); assert.match(m.astra('next'), /relay is online/);
  m.state.oxygen = 1; assert.match(m.astra('oxygen'), /insufficient/);
  assert.match(m.astra('data'), /NASA LRO\/LOLA/);
});
test('celestial tracking uses acquired samples, correct units and coverage', () => {
  const m = create(), actual = m.astronomy();
  assert.deepEqual(actual.map(b => b.name).sort(), ['Earth', 'LRO', 'Mars', 'Sun']);
  const earth = actual.find(b => b.name === 'Earth');
  const reference = ephemerides.bodies.find(b => b.name === 'Earth').samples[12];
  assert.ok(Math.abs(earth.x - reference.x) < 0.001);
  assert.ok(earth.distanceKm > 300000 && earth.distanceKm < 450000);
  const lro = actual.find(b => b.name === 'LRO');
  assert.equal(lro.samplingSeconds, 60); assert.ok(lro.distanceKm > 1737 && lro.distanceKm < 2100);
  m.state.time = 25 * 3600; assert.ok(m.astronomy().every(b => !b.inCoverage));
});
test('circuit graph rejects disconnected ports and accepts a complete path', () => {
  for (const seed of [1, 22, 47037, 47063]) {
    const circuit = new Circuit(seed); assert.equal(circuit.connected(), false);
    for (let i = 0; i < 9; i++) while (circuit.turns[i] !== 0) circuit.rotate(i);
    assert.equal(circuit.connected(), true);
    circuit.rotate(circuit.input.index); assert.equal(circuit.connected(), false);
  }
});
test('HTML has every referenced application element and no remote runtime dependencies', () => {
  const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  for (const match of app.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.has(match[1]), 'Missing element: ' + match[1]);
  assert.equal((html.match(/id="([^"]+)"/g) || []).length, ids.size, 'HTML ids must be unique');
  assert.doesNotMatch(html, /(?:src|href)="https:\/\/[^\"]+\.(?:js|css)/);
});
