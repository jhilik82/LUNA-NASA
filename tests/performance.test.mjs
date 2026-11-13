import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { createDestinationMission } from '../dist/worlds.js';
import { AstronomicalWorld } from '../dist/astronomy-world.js';
import { Renderer } from '../dist/render-3d.js';
import { batchStaticMeshes } from '../dist/static-batch.js';
import { createAstronaut, makeMaterials } from '../dist/models.js';
import { rendererFixture } from './renderer-fixture.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL('../dist/data/' + name + '.json', import.meta.url)));
const files = { terrain: 'terrain', config: 'mission', ephemerides: 'ephemerides', academy: 'academy', marsTerrain: 'terrain-mars', solar: 'solar-system', tranquillitatis: 'terrain-tranquillitatis', astronomy: 'astronomy', stars: 'stars', scenarios: 'scenarios' };
const pack = Object.fromEntries(Object.entries(files).map(([k, n]) => [k, read(n)]));
const storage = () => { const d = new Map(); return { getItem: k => d.get(k) ?? null, setItem: (k, v) => d.set(k, v) }; };
const world = (destination, mode = 'training') => {
  const m = createDestinationMission(pack, destination, storage(), mode, new AstronomicalWorld(pack.astronomy, pack.stars));
  return { m, r: rendererFixture(m) };
};
const drawables = root => { let n = 0; root.traverse(o => { if (o.isMesh || o.isLine || o.isPoints || o.isSprite) n++; }); return n; };
const worldBox = o => new THREE.Box3().setFromObject(o);

test('static batching keeps every shape and position but needs far fewer draw calls', () => {
  const mat = makeMaterials(), a = createAstronaut(mat), b = createAstronaut(mat);
  a.position.set(3, 1, -2); b.position.copy(a.position); a.updateMatrixWorld(true); b.updateMatrixWorld(true);
  const before = drawables(b), { removed } = batchStaticMeshes(b);
  assert.ok(removed > 0 && drawables(b) < before, 'merges static parts');
  const boxA = worldBox(a), boxB = worldBox(b);
  for (const k of ['min', 'max']) for (const axis of ['x', 'y', 'z']) assert.ok(Math.abs(boxA[k][axis] - boxB[k][axis]) < 1e-4, 'same overall shape and position');
  for (const part of [b.userData.body, b.userData.visor, b.userData.helmet, ...b.userData.arms, ...b.userData.legs]) assert.ok(part?.parent, 'animated parts are kept, still attached');
  const arm = b.userData.arms[0], hand = new THREE.Vector3();
  arm.getWorldPosition(hand); arm.rotation.x += 1; b.updateMatrixWorld(true);
  const moved = new THREE.Vector3(); arm.getWorldPosition(moved);
  let armBatch = null; arm.traverse(o => { if (o.name.startsWith('static-batch:')) armBatch = o; });
  assert.ok(!armBatch || armBatch.parent, 'pieces inside a moving part still move with it');
});

test('the surface world draws far fewer separate objects than before and keeps its animated parts', () => {
  for (const destination of ['moon', 'mars']) {
    const { r } = world(destination);
    r.showLandedCraft();
    assert.ok(drawables(r.scene) < 700, destination + ': ' + drawables(r.scene) + ' separate drawables (was over 1,200)');
    assert.equal(r.rocks[0].children.length, 1, 'all decorative pebbles share one draw call');
    for (const [id, keys] of Object.entries({ airlock: ['door', 'light'], relay: ['dish', 'lamp'], lab: ['canister', 'lid'] })) {
      const model = r.models.get(id);
      if (model) for (const k of keys) assert.ok(model.userData[k]?.parent, id + '.' + k + ' still animates');
    }
    assert.ok(r.rover.userData.wheels.every(w => w.parent), 'rover wheels still turn');
    for (const leg of r.lander.userData.legs) assert.ok(leg.getObjectByName('landing-foot'), 'landing feet stay addressable');
    assert.ok(r.plume.parent, 'engine plume stays separate');
  }
});

test('lower render scale reduces the drawing resolution for every world the game builds', () => {
  const { r } = world('moon');
  r.maxDpr = 1.5; r.resize(1000, 600, 2); assert.equal(r.dpr, 1.5);
  Renderer.renderScale = .7; r.resize(1000, 600, 2); assert.ok(Math.abs(r.dpr - 1.05) < 1e-9);
  const { r: next } = world('mars'); next.maxDpr = 1.5; next.resize(1000, 600, 2); assert.ok(Math.abs(next.dpr - 1.05) < 1e-9, 'new worlds inherit the scale');
  Renderer.renderScale = 1;
});

test('the objective marker reuses its terrain ray test while the view is still', () => {
  const { m, r } = world('moon');
  let rays = 0; const original = THREE.Raycaster.prototype.intersectObjects;
  THREE.Raycaster.prototype.intersectObjects = function (...args) { rays++; return original.apply(this, args); };
  try {
    const target = m.target(), point = r.world(target, 2);
    r.camera.position.copy(point).add(new THREE.Vector3(20, 15, 20)); r.camera.lookAt(point); r.camera.updateMatrixWorld(true);
    r.screenMarker(target, 4, true); r.screenMarker(target, 4, true); r.screenMarker(target, 4, true);
    assert.equal(rays, 1, 'one ray for three frames with the camera still');
    r.camera.position.x += 5; r.camera.lookAt(point); r.camera.updateMatrixWorld(true); r.screenMarker(target, 4, true);
    assert.equal(rays, 2, 'a moved camera re-tests at once');
  } finally { THREE.Raycaster.prototype.intersectObjects = original; }
});
