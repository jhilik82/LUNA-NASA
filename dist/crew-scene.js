import * as THREE from 'three';
import { createAstronaut } from './models.js';
import { batchStaticMeshes } from './static-batch.js';
import { activeDishes, CREW_STAGES } from './crew-rules.js';

// Draws the other crewmates of a multiplayer crew mission (in their own suit colours, with name tags) and the
// mission stations: breakers, relay dishes, the power cell and Haven's airlock zone. Positions come from the
// game server a few times a second and are smoothed here so teammates move fluidly.

function nameTag(text, color) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
  const g = canvas.getContext('2d');
  g.fillStyle = 'rgba(4,10,16,.78)'; g.beginPath(); g.roundRect?.(4, 8, 248, 48, 22); g.fill();
  g.fillStyle = color; g.beginPath(); g.arc(30, 32, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f2f7f6'; g.font = '600 26px system-ui, sans-serif'; g.textBaseline = 'middle'; g.fillText(text.slice(0, 14), 48, 33);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false, transparent: true }));
  sprite.raycast = () => {}; sprite.renderOrder = 20; return sprite;
}

function beacon(color, label) {
  const group = new THREE.Group(), c = new THREE.Color(color);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.94, 1, 64), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .6, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .04;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .28, depthWrite: false }));
  beam.position.y = .5;
  const fill = new THREE.Mesh(new THREE.CircleGeometry(.94, 64), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  fill.rotation.x = -Math.PI / 2; fill.position.y = .03;
  const tag = nameTag(label, color); tag.position.y = 1.15;
  for (const m of [ring, beam, fill]) m.raycast = () => {};
  group.add(ring, beam, fill, tag); group.userData = { ring, beam, fill, tag }; return group;
}

export class CrewScene {
  constructor(renderer) {
    this.renderer = renderer; this.group = new THREE.Group(); this.group.name = 'crew-multiplayer'; renderer.scene.add(this.group);
    this.actors = new Map(); this.stations = []; this.layoutKey = ''; this.room = null; this.selfId = null;
  }
  get scale() { return this.renderer.physical ? this.renderer.unitsPerMetre : 1; }
  setRoom(room, selfId) { this.room = room; this.selfId = selfId; }
  actorFor(player) {
    let a = this.actors.get(player.id);
    if (!a) {
      const model = createAstronaut(this.renderer.mat, { accent: player.color }); batchStaticMeshes(model); model.name = 'crewmate-' + player.name;
      if (this.renderer.physical) model.scale.setScalar(.35 * this.renderer.unitsPerMetre);
      const tag = nameTag(player.name, player.color); tag.scale.set(2.4 * this.scale, .6 * this.scale, 1);
      this.group.add(model, tag);
      a = { model, tag, name: player.name, position: { x: player.x, y: player.y }, jump: 0, heading: 0, phase: 0 };
      this.actors.set(player.id, a);
    }
    return a;
  }
  removeActor(id) { const a = this.actors.get(id); if (!a) return; this.group.remove(a.model, a.tag); a.tag.material.map.dispose(); a.tag.material.dispose(); this.actors.delete(id); }
  buildStations(layout) {
    for (const s of this.stations) this.group.remove(s.group);
    this.stations = [];
    if (!layout) return;
    const add = (kind, index, point, color, label) => { const group = beacon(color, label); this.group.add(group); this.stations.push({ kind, index, point, group }); };
    layout.breakers.forEach((p, i) => add('breaker', i, p, '#ffb347', 'Breaker ' + 'AB'[i]));
    layout.dishes.forEach((p, i) => add('dish', i, p, '#6fe3ff', 'Relay dish ' + (i + 1)));
    add('base', 0, layout.base, '#7dffb0', 'Haven airlock');
    // The power cell: a glowing battery crate.
    const cell = new THREE.Group(), box = new THREE.Mesh(new THREE.BoxGeometry(1.2, .7, .8), new THREE.MeshStandardMaterial({ color: '#2a3138', metalness: .6, roughness: .4 }));
    const glow = new THREE.Mesh(new THREE.BoxGeometry(1.24, .14, .84), new THREE.MeshBasicMaterial({ color: '#ffd23d' }));
    box.position.y = .35; glow.position.y = .45; cell.add(box, glow); const tag = nameTag('Power cell', '#ffd23d'); tag.position.y = 1.4; tag.scale.set(2.4, .6, 1); cell.add(tag);
    this.group.add(cell); this.cell = cell; this.cellPoint = { ...layout.cell };
  }
  update(dt, time) {
    const r = this.renderer, room = this.room;
    this.group.visible = !!room && !r.cinematic && !r.skyOnly;
    if (!room) return;
    // Teammates (not me).
    const seen = new Set();
    for (const p of room.players) {
      if (p.id === this.selfId || !Number.isFinite(p.x) || !p.online) continue;
      seen.add(p.id); const a = this.actorFor(p), k = 1 - Math.exp(-dt * 8);
      const gap = Math.hypot(p.x - a.position.x, p.y - a.position.y);
      if (gap > 40 / r.mission.terrain.cell) a.position = { x: p.x, y: p.y }; // teleport if far behind
      else a.position = { x: a.position.x + (p.x - a.position.x) * k, y: a.position.y + (p.y - a.position.y) * k };
      a.jump += ((p.jump || 0) - a.jump) * k; a.heading = p.heading || 0;
      a.phase += gap * r.mission.terrain.cell * 2.45 * k * (r.mission.gait?.strideFactor || 1);
      a.model.visible = !p.rover; a.model.position.copy(r.world(a.position, a.jump * (r.physical ? r.unitsPerMetre : 1.2)));
      a.model.rotation.y = Math.PI / 2 - a.heading;
      r.poseAstronaut(a.model, a.phase, time, p.moving ? 1 : 0);
      a.tag.position.copy(r.world(a.position, (2.25 + a.jump) * this.scale));
    }
    for (const id of [...this.actors.keys()]) if (!seen.has(id)) this.removeActor(id);
    // Stations.
    const key = room.layout ? JSON.stringify([room.layout.breakers, room.layout.dishes, room.layout.base]) : '';
    if (key !== this.layoutKey) { this.layoutKey = key; this.buildStations(room.layout); }
    if (!room.layout || !room.crew) { for (const s of this.stations) s.group.visible = false; if (this.cell) this.cell.visible = false; return; }
    const crew = room.crew, stage = CREW_STAGES[crew.stage]?.id, live = room.players.filter(p => p.online).length, dishes = activeDishes(room.layout, live).length;
    const pulse = .5 + .5 * Math.sin(time * 4);
    for (const s of this.stations) {
      const active = crew.status === 'playing' && ((stage === 'breakers' && s.kind === 'breaker') || (stage === 'dishes' && s.kind === 'dish' && s.index < dishes) || ((stage === 'cell' || stage === 'return') && s.kind === 'base'));
      s.group.visible = active || (s.kind === 'base');
      const held = active && (stage === 'breakers' || stage === 'dishes') ? !!crew.occupied?.[s.index] : stage === 'return' && s.kind === 'base' && crew.hold > 0;
      const radius = (s.kind === 'base' ? 14 : 7) * this.scale;
      s.group.position.copy(r.world(s.point, 0)); s.group.scale.set(radius, 9 * this.scale, radius);
      s.group.userData.tag.scale.set(2.6 / radius * this.scale, .65 / (9 * this.scale) * this.scale, 1); s.group.userData.tag.position.y = 1.15;
      s.group.userData.fill.material.opacity = held ? .18 + .14 * pulse : 0;
      s.group.userData.ring.material.opacity = active ? .4 + .3 * pulse : .18;
      s.group.userData.beam.visible = active;
    }
    if (this.cell) {
      this.cell.visible = crew.status === 'playing' && (stage === 'cell') || crew.completedStages.includes('cell');
      const k = 1 - Math.exp(-dt * 6);
      this.cellPoint = { x: this.cellPoint.x + (crew.cell.x - this.cellPoint.x) * k, y: this.cellPoint.y + (crew.cell.y - this.cellPoint.y) * k };
      this.cell.position.copy(r.world(this.cellPoint, (crew.carriers?.length ? .5 : 0) * this.scale)); this.cell.scale.setScalar(this.scale);
    }
  }
  dispose() { for (const id of [...this.actors.keys()]) this.removeActor(id); this.renderer.scene.remove(this.group); }
}
