import { createWorldLayout, isOccupied, segmentBlocked, roverCollider, BODY_RADIUS } from './world-layout.js';
// LUNA's deterministic mission model. No DOM, network calls, or canned telemetry.
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const copy = value => JSON.parse(JSON.stringify(value));
const rad = Math.PI / 180;

export function randomGenerator(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

class Heap {
  constructor() { this.items = []; }
  push(item) {
    const a = this.items; a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].priority <= item.priority) break;
      a[i] = a[p]; i = p;
    }
    a[i] = item;
  }
  pop() {
    const a = this.items; const result = a[0]; const tail = a.pop();
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let child = i * 2 + 1;
        if (child + 1 < a.length && a[child + 1].priority < a[child].priority) child++;
        if (a[child].priority >= tail.priority) break;
        a[i] = a[child]; i = child;
      }
      a[i] = tail;
    }
    return result;
  }
  get size() { return this.items.length; }
}

export class Terrain {
  constructor(data) {
    if (!Number.isInteger(data.width) || !Number.isInteger(data.height) || data.width < 3 || data.height < 3 ||
        data.heights.length !== data.width * data.height || !data.heights.every(Number.isFinite) || !(data.cellMetres > 0)) {
      throw new Error('The elevation data pack is invalid.');
    }
    this.data = data; this.width = data.width; this.height = data.height; this.cell = data.cellMetres;
    this.min = Math.min(...data.heights); this.max = Math.max(...data.heights);
  }
  heightAt(x, y) {
    x = clamp(x, 0, this.width - 1); y = clamp(y, 0, this.height - 1);
    const i = Math.floor(x), j = Math.floor(y), a = x - i, b = y - j;
    const right = Math.min(i + 1, this.width - 1), down = Math.min(j + 1, this.height - 1);
    const get = (xx, yy) => this.data.heights[yy * this.width + xx];
    return get(i, j) * (1 - a) * (1 - b) + get(right, j) * a * (1 - b) + get(i, down) * (1 - a) * b + get(right, down) * a * b;
  }
  inBounds(x, y) { return x >= 1 && y >= 1 && x <= this.width - 2 && y <= this.height - 2; }
  slope(a, b) {
    const d = distance(a, b) * this.cell;
    return d ? Math.atan2(Math.abs(this.heightAt(a.x, a.y) - this.heightAt(b.x, b.y)), d) / rad : 0;
  }
  canStep(a, b, maxSlope) {
    if (!this.inBounds(b.x, b.y) || this.slope(a, b) > maxSlope) return false;
    if (this.blocksSegment?.(a, b)) return false;
    const dx = b.x - a.x, dy = b.y - a.y;
    // Do not cut a diagonal between two blocked edges.
    if (Math.abs(dx) > 0.5 && Math.abs(dy) > 0.5) {
      if (this.slope(a, { x: b.x, y: a.y }) > maxSlope || this.slope(a, { x: a.x, y: b.y }) > maxSlope) return false;
    }
    return true;
  }
  geo(point) {
    const p = this.data.projection;
    const x = p.x0 + point.x * this.cell, y = p.y0 - point.y * this.cell;
    const rho = Math.hypot(x, y);
    const lat = -90 + 2 * Math.atan(rho / (2 * p.radiusMetres)) / rad;
    const lon = (Math.atan2(x, y) / rad + 360) % 360;
    return { lat, lon, elevation: this.heightAt(point.x, point.y), x, y };
  }
  route(from, to, maxSlope = 32) {
    const start = { x: Math.round(from.x), y: Math.round(from.y) };
    const end = { x: Math.round(to.x), y: Math.round(to.y) };
    if (!this.inBounds(start.x, start.y) || !this.inBounds(end.x, end.y)) return null;
    const key = p => p.y * this.width + p.x;
    const sk = key(start), ek = key(end), n = this.width * this.height;
    const costs = new Float64Array(n).fill(Infinity), parent = new Int32Array(n).fill(-1);
    const visited = new Uint8Array(n), heap = new Heap();
    costs[sk] = 0; heap.push({ key: sk, priority: distance(start, end) });
    while (heap.size) {
      const current = heap.pop();
      if (visited[current.key]) continue;
      visited[current.key] = 1;
      if (current.key === ek) {
        const path = []; let k = ek;
        while (k !== -1) { path.push({ x: k % this.width, y: Math.floor(k / this.width) }); k = parent[k]; }
        path.reverse();
        if (path.length) path[0] = { x: from.x, y: from.y };
        let metres = 0, maxGrade = 0;
        for (let i = 1; i < path.length; i++) { metres += distance(path[i - 1], path[i]) * this.cell; maxGrade = Math.max(maxGrade, this.slope(path[i - 1], path[i])); }
        return { path, metres, maxGrade };
      }
      const a = { x: current.key % this.width, y: Math.floor(current.key / this.width) };
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const b = { x: a.x + dx, y: a.y + dy };
        if (!this.canStep(a, b, maxSlope)) continue;
        const bk = key(b), grade = this.slope(a, b);
        const cost = costs[current.key] + distance(a, b) * (1 + 0.65 * grade / maxSlope);
        if (cost < costs[bk]) { costs[bk] = cost; parent[bk] = current.key; heap.push({ key: bk, priority: cost + distance(b, end) }); }
      }
    }
    return null;
  }
  largestComponent(maxSlope) {
    const visited = new Uint8Array(this.width * this.height); let largest = [];
    for (let y = 2; y < this.height - 2; y += 2) for (let x = 2; x < this.width - 2; x += 2) {
      const start = y * this.width + x;
      if (visited[start]) continue;
      const queue = [{ x, y }]; visited[start] = 1;
      for (let index = 0; index < queue.length; index++) {
        const a = queue[index];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const b = { x: a.x + dx, y: a.y + dy }, k = b.y * this.width + b.x;
          if (!this.inBounds(b.x, b.y) || visited[k] || !this.canStep(a, b, maxSlope)) continue;
          visited[k] = 1; queue.push(b);
        }
      }
      if (queue.length > largest.length) largest = queue;
    }
    return largest;
  }
}

const CIRCUIT_DESIGNS = {
  outpost: {
    name: 'HAVEN · VERTICAL DISTRIBUTION BUS',
    input: { index: 0, side: 0 }, output: { index: 8, side: 2 },
    ports: [[0,1],[2,3],[0,2],[1,2],[0,3],[0,2],[0,1],[1,3],[2,3]]
  },
  relay: {
    name: 'RELAY · SIGNAL BRIDGE',
    input: { index: 3, side: 3 }, output: { index: 5, side: 1 },
    ports: [[1,2],[1,3],[2,3],[0,3],[0,2],[0,1],[0,1],[0,3],[1,3]]
  },
  rover: {
    name: 'ECHO · MOTOR POWER ROUTE',
    input: { index: 6, side: 2 }, output: { index: 2, side: 0 },
    ports: [[1,3],[0,2],[0,2],[1,2],[1,2],[0,3],[1,2],[0,3],[0,3]]
  }
};
const circuitSides = ['top','right','bottom','left'];
const circuitDirections = ['up','right','down','left'];
const circuitTileName = index => ['top','middle','bottom'][Math.floor(index / 3)]+'-'+['left','centre','right'][index % 3];

export class Circuit {
  constructor(seed, design = null) {
    // Each apparatus has its own solved path and external terminals. N/E/S/W = 0/1/2/3.
    const rng = randomGenerator(seed);
    this.design = CIRCUIT_DESIGNS[design] ? design : Object.keys(CIRCUIT_DESIGNS)[Math.abs(Math.trunc(seed) || 0) % 3];
    const layout = CIRCUIT_DESIGNS[this.design];
    this.name = layout.name; this.input = {...layout.input}; this.output = {...layout.output};
    this.ports = layout.ports.map(ports => [...ports]);
    this.turns = this.ports.map(() => Math.floor(rng() * 4));
    this.moves = 0;
    while (this.connected()) this.turns[this.input.index] = (this.turns[this.input.index] + 1) % 4;
  }
  get instructions() { return 'Power enters the '+circuitSides[this.input.side]+' edge of the '+circuitTileName(this.input.index)+' tile. Rotate the wires to reach the OUTPUT at the '+circuitSides[this.output.side]+' edge of the '+circuitTileName(this.output.index)+' tile.'; }
  hint() { return 'Start at the '+circuitTileName(this.input.index)+' tile: one wire must point '+circuitDirections[this.input.side]+' toward INPUT. Match wire ends on neighbouring tiles. Finish at the '+circuitTileName(this.output.index)+' tile with a wire pointing '+circuitDirections[this.output.side]+' toward OUTPUT. Glowing tiles have power; you do not need to power every tile.'; }
  terminalPosition(endpoint) {
    const row = Math.floor(endpoint.index / 3) + 2, column = endpoint.index % 3 + 2;
    return {row: endpoint.side===0 ? 1 : endpoint.side===2 ? 5 : row, column: endpoint.side===3 ? 1 : endpoint.side===1 ? 5 : column};
  }
  connections(index) { return this.ports[index].map(port => (port + this.turns[index]) % 4); }
  rotate(index) { this.turns[index] = (this.turns[index] + 1) % 4; this.moves++; }
  powered() {
    const seen = new Set();
    if (!this.connections(this.input.index).includes(this.input.side)) return seen;
    const queue = [this.input.index]; seen.add(this.input.index);
    const deltas = [-3, 1, 3, -1];
    for (let i = 0; i < queue.length; i++) {
      const at = queue[i];
      for (const port of this.connections(at)) {
        const x = at % 3, y = Math.floor(at / 3);
        if ((port === 0 && y === 0) || (port === 1 && x === 2) || (port === 2 && y === 2) || (port === 3 && x === 0)) continue;
        const next = at + deltas[port];
        if (this.connections(next).includes((port + 2) % 4) && !seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    return seen;
  }
  connected() { return this.powered().has(this.output.index) && this.connections(this.output.index).includes(this.output.side); }
}

export class Mission {
  constructor(terrainData, config, ephemerides) {
    this.terrain = new Terrain(terrainData); this.config = config; this.ephemerides = ephemerides;
    this.events = []; this.checkpoint = null; this.circuit = null; this.route = null; this.notice = null;
    this.placeObjects(); this.reset();
    this.props = createWorldLayout(this);
    this.terrain.blocksSegment = (a, b) => segmentBlocked(a, b, this.colliders(), this.state.rover.occupied ? .49 : BODY_RADIUS);
  }
  placeObjects() {
    const component = this.terrain.largestComponent(this.config.roverMaxSlopeDegrees);
    if (component.length < 100) throw new Error('The terrain has no suitable recovery sector.');
    const usable = component.filter(p => p.x > 6 && p.y > 6 && p.x < this.terrain.width - 7 && p.y < this.terrain.height - 7);
    const nearest = anchor => usable.reduce((best, p) => distance(p, anchor) < distance(best, anchor) ? p : best, usable[0]);
    const base = nearest({ x: this.terrain.width * 0.28, y: this.terrain.height * 0.65 });
    const rover = nearest({ x: this.terrain.width * 0.73, y: this.terrain.height * 0.28 });
    const path = this.terrain.route(base, rover, this.config.roverMaxSlopeDegrees);
    if (!path || path.metres < 300) throw new Error('Recovery mission positions are not reachable.');
    const relay = path.path[Math.floor(path.path.length * 0.47)];
    this.objects = { base: { ...base, name: this.config.objectNames.base }, relay: { ...relay, name: this.config.objectNames.relay }, rover: { ...rover, name: this.config.objectNames.rover } };
    const anchors = [{ x: 0.34, y: 0.34 }, { x: 0.59, y: 0.69 }, { x: 0.73, y: 0.48 }];
    this.science = anchors.map((a, i) => ({ ...nearest({ x: a.x * this.terrain.width, y: a.y * this.terrain.height }), id: i, name: ['RIDGE SURVEY', 'ELEVATION TRANSECT', 'SLOPE OBSERVATION'][i] }));
  }
  reset() {
    const c = this.config;
    this.state = { status: 'ready', phase: 'relay', time: 0, distanceMetres: 0, walkingMetres: 0, drivingMetres: 0,
      player: { x: this.objects.base.x + 1, y: this.objects.base.y + 1, heading: -Math.PI / 4, jump: 0, jumpVelocity: 0 },
      oxygen: c.suit.oxygenMinutes, water: c.suit.waterLitres, suitWh: c.suit.batteryWh,
      rover: { ...this.objects.rover, repaired: false, wh: 0, occupied: false }, relayOnline: false,
      scans: [], trail: [], journal: [], lastTrail: 0, blocked: false, moving: false, sprinting: false, repairs: 0, failureReason: null };
    this.events = []; this.route = null; this.checkpoint = null; this.circuit = null;
    this.record('briefing', 'Recovery expedition prepared.');
  }
  start() {
    if (this.state.status !== 'ready') return;
    this.state.status = 'playing'; this.record('launch', 'Expedition started.');
    this.events.push({ type: 'started' });
    this.checkpoint = copy(this.state);
  }
  record(type, message, detail = {}) {
    this.state.journal.push({ time: this.state.time, type, message, ...detail });
  }
  notify(message, kind = 'info') { this.events.push({ type: 'notice', message, kind }); }
  pause() {
    if (this.state.status === 'playing') { this.state.status = 'paused'; this.route = null; }
    else if (this.state.status === 'paused') this.state.status = 'playing';
  }
  target() {
    return this.state.phase === 'relay' ? this.objects.relay : this.state.phase === 'recover' ? this.state.rover : this.objects.base;
  }
  maxSlope() { return this.state.rover.occupied ? this.config.roverMaxSlopeDegrees : this.config.walkMaxSlopeDegrees; }
  colliders() { return this.state.rover.occupied ? this.props : [...this.props, roverCollider(this.state.rover)]; }
  accessibleDestination(point) {
    const p = { x: clamp(Math.round(point.x), 1, this.terrain.width - 2), y: clamp(Math.round(point.y), 1, this.terrain.height - 2) };
    const radius = this.state.rover.occupied ? .49 : BODY_RADIUS;
    if (!isOccupied(p, this.colliders(), radius)) return p;
    const nearObject = [this.objects.base, this.objects.relay, this.state.rover].some(o => distance(p, o) < .2);
    if (!nearObject) return null;
    const candidates = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const c = { x: p.x + dx, y: p.y + dy };
      if (distance(c, p) * this.terrain.cell <= this.config.interactionMetres && this.terrain.inBounds(c.x, c.y) && !isOccupied(c, this.colliders(), radius)) candidates.push(c);
    }
    candidates.sort((a, b) => distance(a, this.state.player) - distance(b, this.state.player));
    return candidates.find(c => this.terrain.route(this.state.player, c, this.maxSlope())) || null;
  }
  navigate(point) {
    if (this.state.status !== 'playing') return false;
    const destination = this.accessibleDestination(point);
    if (!destination) { this.notify('That point is occupied by equipment. Select open terrain beside it.', 'warning'); return false; }
    const route = this.terrain.route(this.state.player, destination, this.maxSlope());
    if (!route) { this.notify('That route exceeds your equipment’s slope limit. Try the ridge approach.', 'warning'); return false; }
    this.route = { ...route, index: 1 }; return true;
  }
  update(dt, input = {}) {
    const s = this.state, c = this.config;
    if (s.status !== 'playing') return;
    dt = Math.min(dt, 0.2);
    const elapsed = dt * c.timeScale; s.time += elapsed;
    // Visual jumps retain physical lunar gravity and real-time flight duration.
    if (input.jump && s.player.jump === 0) s.player.jumpVelocity = 2.4;
    s.player.jumpVelocity -= c.physics.moonSurfaceGravityMetresPerSecondSquared * dt;
    s.player.jump = Math.max(0, s.player.jump + s.player.jumpVelocity * dt);
    if (!s.player.jump) s.player.jumpVelocity = 0;
    let dx = input.dx || 0, dy = input.dy || 0;
    if (dx || dy) this.route = null;
    if (!dx && !dy && this.route) {
      const next = this.route.path[this.route.index];
      if (next) { dx = next.x - s.player.x; dy = next.y - s.player.y; }
      else this.route = null;
    }
    const amount = Math.hypot(dx, dy), inRover = s.rover.occupied;
    const sprint = !!input.sprint && !inRover;
    const speed = inRover ? c.roverMetresPerSecond : c.walkMetresPerSecond * (sprint ? c.sprintMultiplier : 1);
    let metres = 0, slope = 0;
    s.blocked = false; s.moving = false; s.sprinting = sprint && amount > 0;
    if (amount && (!inRover || s.rover.wh > 0)) {
      let step = speed * elapsed / this.terrain.cell;
      if (this.route) step = Math.min(step, amount);
      const before = { x: s.player.x, y: s.player.y };
      const after = { x: before.x + dx / amount * step, y: before.y + dy / amount * step };
      if (this.terrain.canStep(before, after, this.maxSlope())) {
        slope = this.terrain.slope(before, after);
        s.player.x = after.x; s.player.y = after.y; s.player.heading = Math.atan2(dy, dx);
        metres = step * this.terrain.cell; s.distanceMetres += metres; s.moving = true;
        if (inRover) { s.drivingMetres += metres; s.rover.x = after.x; s.rover.y = after.y; }
        else s.walkingMetres += metres;
        if (this.route && step >= amount - 0.0001) this.route.index++;
      } else { s.blocked = true; this.route = null; }
    }
    const exertion = s.moving ? (sprint ? c.suit.sprintOxygenMultiplier : 1.12) * (1 + slope / 160) : 1;
    s.oxygen = Math.max(0, s.oxygen - elapsed / 60 * (inRover ? 1 : exertion));
    s.water = Math.max(0, s.water - elapsed / 3600 * c.suit.waterLitresPerHour * exertion);
    s.suitWh = Math.max(0, s.suitWh - elapsed / 3600 * (s.moving && !inRover ? c.suit.movingWatts : c.suit.idleWatts));
    if (inRover) s.rover.wh = Math.max(0, s.rover.wh - elapsed / 3600 * (s.moving ? c.rover.driveWatts : c.rover.idleWatts) - metres * c.rover.consumptionWhPerMetre);
    if (s.time - s.lastTrail >= 30 || !s.trail.length) {
      s.trail.push({ x: s.player.x, y: s.player.y, time: s.time, mode: inRover ? 'rover' : 'EVA', oxygen: s.oxygen });
      s.lastTrail = s.time;
    }
    if (s.oxygen <= 0 || s.suitWh <= 0 || s.water <= 0) {
      s.status = 'failed'; s.failureReason = s.oxygen <= 0 ? 'Oxygen reserve exhausted' : s.suitWh <= 0 ? 'Suit battery exhausted' : 'Water reserve exhausted';
      this.record('abort', s.failureReason); this.events.push({ type: 'ended' });
    }
  }
  nearby() {
    const s = this.state, radius = this.config.interactionMetres / this.terrain.cell;
    if (s.rover.occupied) return distance(s.player, this.objects.base) <= radius ? { type: 'dock', label: 'Dock at Haven', point: this.objects.base } : { type: 'exit', label: 'Leave the rover', point: s.player };
    if (distance(s.player, this.objects.relay) <= radius && !s.relayOnline) return { type: 'relay', label: 'Reconnect the relay', point: this.objects.relay };
    if (distance(s.player, s.rover) <= radius) return { type: s.rover.repaired ? 'board' : 'rover', label: s.rover.repaired ? 'Board Echo' : 'Repair Echo’s power bus', point: s.rover };
    for (const site of this.science) if (!s.scans.includes(site.id) && distance(s.player, site) <= radius) return { type: 'scan', label: 'Record terrain observation', point: site };
    if (distance(s.player, this.objects.base) <= radius) return { type: 'base', label: 'Refill your suit', point: this.objects.base };
    return null;
  }
  interact() {
    if (this.state.status !== 'playing') return;
    const near = this.nearby(), s = this.state;
    if (!near) { this.notify('Move closer to a structure, rover, or survey marker to interact.'); return; }
    if (near.type === 'relay' || near.type === 'rover') {
      if (near.type === 'rover' && !s.relayOnline) { this.notify('Restore the surface relay first. Echo needs the diagnostic uplink.', 'warning'); return; }
      s.status = 'repair'; this.route = null; this.repairType = near.type;
      this.circuit = new Circuit(this.config.seed + (near.type === 'relay' ? 11 : 37), near.type);
      this.events.push({ type: 'repair' });
    } else if (near.type === 'board') {
      s.rover.occupied = true; s.player.x = s.rover.x; s.player.y = s.rover.y;
      this.route = null; this.record('board', 'Boarded Echo.'); this.notify('Echo online. Bring the rover home to Haven.', 'success');
    } else if (near.type === 'exit') {
      const candidates = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:1,y:1},{x:-1,y:-1},{x:1,y:-1},{x:-1,y:1}].map(d => ({x:s.rover.x+d.x,y:s.rover.y+d.y}));
      const exit = candidates.find(p => this.terrain.inBounds(p.x,p.y) && this.terrain.slope(s.rover,p) <= this.config.walkMaxSlopeDegrees && !isOccupied(p,[...this.props,roverCollider(s.rover)],BODY_RADIUS));
      if (!exit) { this.notify('No clear exit here. Drive onto open terrain before leaving Echo.', 'warning'); return; }
      s.rover.occupied = false; Object.assign(s.player,exit); this.route = null; this.record('exit', 'Left Echo.'); this.notify('EVA mode. Echo stays at its last position.');
    } else if (near.type === 'dock') {
      if (s.relayOnline && s.rover.repaired) {
        s.status = 'complete'; this.route = null; this.record('dock', 'Echo and its research returned to Haven.'); this.events.push({ type: 'ended' });
      }
    } else if (near.type === 'scan') this.scan(near.point);
    else if (near.type === 'base') {
      s.oxygen = this.config.suit.oxygenMinutes; s.water = this.config.suit.waterLitres; s.suitWh = this.config.suit.batteryWh;
      this.record('resupply', 'Suit refilled at Haven.'); this.notify('Suit replenished. Follow the orange mission marker.');
    }
  }
  completeRepair() {
    if (this.state.status !== 'repair' || !this.circuit?.connected()) return false;
    const s = this.state; s.repairs++; s.status = 'playing';
    if (this.repairType === 'relay') {
      s.relayOnline = true; s.phase = 'recover';
      this.record('relay', 'Surface relay restored.', { moves: this.circuit.moves });
      this.checkpoint = copy(s);
      this.notify('Signal restored. Echo’s recovery position is now confirmed.', 'success');
    } else {
      s.rover.repaired = true; s.rover.wh = this.config.rover.recoveryWh; s.phase = 'return';
      this.record('repair', 'Echo’s power bus repaired.', { moves: this.circuit.moves });
      this.notify('Echo’s motors are online. Board the rover and return to Haven.', 'success');
    }
    this.circuit = null; this.events.push({ type: 'repaired' }); return true;
  }
  cancelRepair() { if (this.state.status === 'repair') { this.state.status = 'playing'; this.circuit = null; } }
  scan(site) {
    if (this.state.status !== 'playing' || this.state.suitWh < this.config.suit.scanWh) return;
    if (this.state.scans.includes(site.id)) return;
    this.state.scans.push(site.id); this.state.suitWh -= this.config.suit.scanWh;
    this.state.oxygen = Math.max(0, this.state.oxygen - this.config.suit.scanMinutes);
    const geo = this.terrain.geo(site);
    this.record('science', site.name + ' recorded.', { elevation: geo.elevation, latitude: geo.lat, longitude: geo.lon });
    this.notify(`Observation saved: ${Math.round(geo.elevation)} m relative to the lunar reference sphere.`, 'success');
  }
  scanNearby() {
    const near = this.nearby();
    if (near?.type === 'scan') this.scan(near.point);
    else this.notify('Look for the cyan survey markers. Get close, then press Q to record an observation.');
  }
  replayCheckpoint() {
    if (!this.checkpoint) return;
    this.state = copy(this.checkpoint); this.state.status = 'playing'; this.events = []; this.route = null; this.circuit = null;
    this.record('replay', 'Replayed the same mission from the last checkpoint.'); this.events.push({ type: 'replayed' });
  }
  lifeline() {
    const s = this.state, c = this.config;
    const route = this.terrain.route(s.player, this.objects.base, this.maxSlope());
    if (!route) return { safe: false, status: 'NO ROUTE', reason: 'No traversable return route for this equipment.', route: null, seconds: Infinity, oxygenNeed: Infinity, batteryNeed: Infinity };
    const speed = s.rover.occupied ? c.roverMetresPerSecond : c.walkMetresPerSecond;
    const seconds = route.metres / speed;
    const reserve = 1 + c.returnReserveFraction;
    const oxygenNeed = seconds / 60 * (s.rover.occupied ? 1 : 1.12 * (1 + route.maxGrade / 160)) * reserve;
    const suitNeed = seconds / 3600 * (s.rover.occupied ? c.suit.idleWatts : c.suit.movingWatts) * reserve;
    const waterNeed = seconds / 3600 * c.suit.waterLitresPerHour * (s.rover.occupied ? 1 : 1.12 * (1 + route.maxGrade / 160)) * reserve;
    const vehicleNeed = s.rover.occupied ? (seconds / 3600 * c.rover.driveWatts + route.metres * c.rover.consumptionWhPerMetre) * reserve : 0;
    const safe = s.oxygen > oxygenNeed && s.suitWh > suitNeed && s.water > waterNeed && (!s.rover.occupied || s.rover.wh > vehicleNeed);
    const margin = s.oxygen - oxygenNeed;
    return { route, seconds, oxygenNeed, batteryNeed: suitNeed, vehicleNeed, waterNeed, safe, margin, status: !safe ? 'RETURN NOW' : margin < 15 ? 'CAUTION' : 'WITHIN RESERVE', reason: `${(route.metres / 1000).toFixed(2)} km return route · ${(seconds / 60).toFixed(0)} mission min · ${(c.returnReserveFraction * 100).toFixed(0)}% reserve` };
  }
  astronomy() {
    if (!this.ephemerides?.bodies) return [];
    const hour = this.config.startHourTdb + this.state.time / 3600;
    return this.ephemerides.bodies.filter(b => b.available).map(body => {
      const samples = body.samples, jd = samples[0].jdTdb + hour / 24;
      const inCoverage = jd >= samples[0].jdTdb && jd <= samples.at(-1).jdTdb;
      if (!inCoverage) return { name: body.name, inCoverage: false };
      let i = 0;
      while (i < samples.length - 2 && samples[i + 1].jdTdb < jd) i++;
      const a = samples[i], b = samples[i + 1], t = clamp((jd - a.jdTdb) / (b.jdTdb - a.jdTdb), 0, 1);
      const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, z = a.z + (b.z - a.z) * t;
      return { name: body.name, x, y, z, distanceKm: Math.hypot(x, y, z), inCoverage: true, frame: body.frame, timeScale: body.timeScale, samplingSeconds: body.samplingSeconds };
    });
  }
  debrief() {
    const s = this.state;
    return { success: s.status === 'complete', timeMinutes: s.time / 60, distanceKm: s.distanceMetres / 1000,
      walkingKm: s.walkingMetres / 1000, drivingKm: s.drivingMetres / 1000, scans: s.scans.length,
      oxygenPercent: s.oxygen / this.config.suit.oxygenMinutes * 100, repairs: s.repairs, journal: copy(s.journal),
      score: Math.round((s.status === 'complete' ? 500 : 0) + s.scans.length * 100 + (s.status === 'complete' ? s.oxygen * 2 : 0)),
      rank: s.status !== 'complete' ? 'EXPEDITION REVIEW' : s.scans.length === 3 ? 'SCIENCE COMMANDER' : s.oxygen > 50 ? 'MISSION SPECIALIST' : 'LUNAR EXPLORER',
      failureReason: s.failureReason };
  }
  astra(question = 'next') {
    const q = question.toLowerCase(), s = this.state, c = this.config, target = this.target();
    if (/nasa|source|data|real|accur/.test(q)) return 'This terrain is an 80 × 80 crop of NASA LRO/LOLA elevations, averaged from 20 m to 40 m cells. Earth, Sun, Mars and available LRO positions use dated JPL Horizons vectors. Our equipment, structures and recovery story are authored teaching assumptions. Open Data & science for the sources.';
    if (/orbit|planet|earth|satellite|spacecraft|sun|mars/.test(q)) {
      const earth = this.astronomy().find(b => b.name === 'Earth' && b.inCoverage);
      return `Switch to Orbital view to inspect Moon-centred positions at the mission clock. ${earth ? `Earth is ${Math.round(earth.distanceKm).toLocaleString()} km from the Moon’s centre. ` : ''}These are interpolated ephemerides, not live telemetry. Surface positions use a separate lunar body-fixed frame.`;
    }
    if (/oxygen|safe|return|reserve|lifeline/.test(q)) {
      const life = this.lifeline();
      return `You have ${s.oxygen.toFixed(1)} nominal oxygen minutes left. ${life.route ? `The current route to Haven needs about ${life.oxygenNeed.toFixed(1)} minutes including the return reserve. ${life.safe ? 'The modeled supplies cover that route.' : 'At least one modeled reserve is insufficient. Return or resupply before continuing.'}` : life.reason} This is our game model’s estimate.`;
    }
    if (/rover|board|drive|vehicle/.test(q)) return s.rover.repaired ? `Echo has ${(s.rover.wh / c.rover.capacityWh * 100).toFixed(0)}% battery. ${s.rover.occupied ? 'You are driving. Press E near Haven to dock, or elsewhere to dismount.' : 'Get close to Echo and press E to board. Vehicle routes use a stricter slope limit than walking.'}` : 'Restore the surface relay, then approach Echo and reconnect its power bus. Rotate the circuit tiles until power reaches the output. Echo’s position is marked in orange.';
    if (/battery|power|energy|water/.test(q)) return `Suit energy: ${s.suitWh.toFixed(0)} Wh. Water: ${s.water.toFixed(2)} L. Moving and scanning consume energy; sprinting increases modeled oxygen and water use. The repair puzzle freezes mission time while you work. These are fictional equipment settings you can inspect in Data & science.`;
    if (/slope|route|short|navigate|terrain/.test(q)) return `Routes are calculated from the NASA elevation grid. Walking allows up to ${c.walkMaxSlopeDegrees}°; Echo allows up to ${c.roverMaxSlopeDegrees}°. A direct shortcut can be blocked by terrain. Click the mission marker or use Plot route for a traversable route. The return ribbon shows the route to Haven.`;
    if (/control|keyboard|help|jump/.test(q)) return 'WASD or arrows to move; Shift to sprint; Space for a lunar hop; E to interact or board; Q to record a nearby survey; M to switch maps; P to pause. You can also click the ground to navigate and use the on-screen controls.';
    if (/why|learn|science|scan/.test(q)) return 'Cyan markers let you record elevation and coordinates from the real LOLA grid. Each observation costs suit energy. Bring research home while protecting your return reserve. The debrief shows what your choices consumed.';
    if (s.status === 'complete') return 'Echo and its research are home. Review your route and resource use in the debrief, then replay the checkpoint to test another approach.';
    if (s.status === 'failed') return 'The expedition reached a resource limit. Replay the checkpoint and compare a more direct route, fewer detours, or a return to Haven for supplies.';
    const d = distance(s.player, target) * this.terrain.cell;
    return s.phase === 'relay' ? `Your first objective is the surface relay, about ${(d / 1000).toFixed(2)} km away. Follow its orange marker. Get close and press E to reconnect the power path. Cyan surveys are optional.` : s.phase === 'recover' ? `The relay is online. Echo is ${(d / 1000).toFixed(2)} km from your current position. Approach the rover, press E, and reconnect its power bus. Keep an eye on the Lifeline.` : `Echo’s power bus is repaired. ${s.rover.occupied ? 'Drive the rover to Haven and press E to dock.' : 'Get close to Echo and press E to board, then bring it home.'} The white return ribbon leads to the outpost.`;
  }
}
