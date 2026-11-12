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
    return this.measuredHeightAt(x,y)+(this.reference?.height(x,y)||0);
  }
  measuredHeightAt(x, y) {
    x = clamp(x, 0, this.width - 1); y = clamp(y, 0, this.height - 1);
    const i = Math.floor(x), j = Math.floor(y), a = x - i, b = y - j;
    const right = Math.min(i + 1, this.width - 1), down = Math.min(j + 1, this.height - 1);
    const get = (xx, yy) => this.data.heights[yy * this.width + xx];
    return get(i, j) * (1 - a) * (1 - b) + get(right, j) * a * (1 - b) + get(i, down) * (1 - a) * b + get(right, down) * a * b;
  }
  inBounds(x, y) { return x >= 1 && y >= 1 && x <= this.width - 2 && y <= this.height - 2; }
  slope(a, b) {
    const d = distance(a, b) * this.cell;
    if(!d)return 0;
    const n=this.reference?.intersects(a,b)?Math.ceil(d/2.5):1;
    let grade=0,height=this.heightAt(a.x,a.y);
    for(let i=1;i<=n;i++){const f=i/n,next=this.heightAt(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f);grade=Math.max(grade,Math.atan2(Math.abs(next-height),d/n)/rad);height=next;}
    return grade;
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
    if(p.type==='equirectangular')return{lat:p.latitude0-point.y*p.degreesPerCell,lon:p.longitude0+point.x*(p.longitudeDegreesPerCell||p.degreesPerCell),elevation:this.heightAt(point.x,point.y),x:point.x*this.cell,y:-point.y*this.cell};
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

// Circuit repair puzzle.
// Wires point in 8 directions (N, NE, E, SE, S, SW, W, NW = 0..7) and each click turns a tile 45°, so a tile has
// 8 positions instead of 4. Diagonal wires link to diagonal neighbours. The board is generated from the seed and
// grows with difficulty (the level number): a bigger grid, a longer power path, more diagonal links, more branching
// decoy tiles and fewer tiles that start already lined up.
const CIRCUIT_DESIGNS = {
  outpost: { name: 'HAVEN · DISTRIBUTION BUS' },
  relay: { name: 'RELAY · SIGNAL BRIDGE' },
  rover: { name: 'ECHO · MOTOR POWER ROUTE' }
};
export const CIRCUIT_DIRECTIONS = 8;
const STEP = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]; // dx, dy for ports 0..7
const circuitSides = ['top','top-right','right','bottom-right','bottom','bottom-left','left','top-left'];
const circuitDirections = ['up','up-right','right','down-right','down','down-left','left','up-left'];
const ROW_NAMES = { 3: ['top','middle','bottom'], 4: ['top','second','third','bottom'], 5: ['top','second','middle','fourth','bottom'] };
const COLUMN_NAMES = { 3: ['left','centre','right'], 4: ['left','second','third','right'], 5: ['left','second','centre','fourth','right'] };

// Difficulty 0 is the first puzzle a player meets; every level adds to it.
export function circuitSettings(difficulty = 1) {
  const d = Math.max(0, Math.min(12, Math.round(Number(difficulty) || 0)));
  const size = d < 2 ? 3 : d < 5 ? 4 : 5;
  return {
    difficulty: d, cols: size, rows: size,
    minPath: 4 + Math.round(d * .6), maxPath: 6 + Math.round(d * .6), // tiles on the power path
    diagonal: d === 0 ? 0 : Math.min(.65, .12 + d * .06),  // chance that a step of the power path is diagonal
    branches: Math.min(.55, d * .06),                      // share of decoy tiles that are 3-way junctions
    presolved: Math.max(0, .45 - d * .09)                  // share of path tiles that start already lined up
  };
}

export class Circuit {
  constructor(seed, design = null, difficulty = 1) {
    const rng = randomGenerator(seed);
    this.design = CIRCUIT_DESIGNS[design] ? design : Object.keys(CIRCUIT_DESIGNS)[Math.abs(Math.trunc(seed) || 0) % 3];
    this.name = CIRCUIT_DESIGNS[this.design].name;
    const settings = this.settings = circuitSettings(difficulty);
    this.cols = settings.cols; this.rows = settings.rows; this.difficulty = settings.difficulty;
    this.name += ' · LEVEL ' + (settings.difficulty + 1) + ' · ' + this.cols + '×' + this.rows;
    for (let attempt = 0; attempt < 400 && !this.path; attempt++) this.generate(rng, settings);
    if (!this.path) this.generate(rng, { ...settings, maxPath: Infinity });
    this.moves = 0; this.shuffle(rng, settings.presolved);
  }
  // Builds a random power path between two border tiles, then fills the other tiles with decoy wires.
  generate(rng, { cols, rows, minPath, maxPath = Infinity, diagonal, branches }) {
    const count = cols * rows, at = (x, y) => y * cols + x;
    const borderSides = (x, y) => [y === 0 && 0, x === cols - 1 && 2, y === rows - 1 && 4, x === 0 && 6].filter(v => v !== false);
    const pick = list => list[Math.floor(rng() * list.length)];
    const border = []; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (borderSides(x, y).length) border.push([x, y]);
    const [sx, sy] = pick(border), inSide = pick(borderSides(sx, sy));
    // Exit on a different edge of the board, far enough away.
    const exits = border.filter(([x, y]) => Math.max(Math.abs(x - sx), Math.abs(y - sy)) >= Math.min(cols, rows) - 1);
    const [ex, ey] = pick(exits), outSides = borderSides(ex, ey).filter(side => side !== inSide);
    if (!outSides.length) return;
    const outSide = pick(outSides);
    // Random self-avoiding walk with backtracking; diagonal steps are allowed with the level's probability and
    // never cross another diagonal step of the path, so every link is unambiguous.
    const visited = new Set([at(sx, sy)]), path = [[sx, sy]], diagonals = new Set();
    const crossKey = (x, y, d) => { const [dx, dy] = STEP[d]; return Math.min(x, x + dx) + ',' + Math.min(y, y + dy); };
    let steps = 0;
    const acute = (a, b) => Math.min((a - b + 8) % 8, (b - a + 8) % 8) === 1; // a 45° hairpin is hard to read
    const back = () => { if (path.length < 2) return inSide; const [ax, ay] = path.at(-1), [bx, by] = path.at(-2); return STEP.findIndex(([dx, dy]) => dx === bx - ax && dy === by - ay); };
    const walk = (x, y) => {
      if (++steps > 4000) return false;
      if (x === ex && y === ey) return path.length >= minPath;
      if (path.length >= maxPath) return false;
      const options = [];
      for (let d = 0; d < 8; d++) {
        const [dx, dy] = STEP[d], nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || visited.has(at(nx, ny))) continue;
        if (d % 2 && (rng() > diagonal || diagonals.has(crossKey(x, y, d)))) continue;
        if (acute(d, back()) || (nx === ex && ny === ey && acute((d + 4) % 8, outSide))) continue;
        options.push(d);
      }
      for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
      for (const d of options) {
        const [dx, dy] = STEP[d], nx = x + dx, ny = y + dy;
        if (nx === ex && ny === ey && path.length + 1 < minPath) continue;
        visited.add(at(nx, ny)); path.push([nx, ny]); if (d % 2) diagonals.add(crossKey(x, y, d));
        if (walk(nx, ny)) return true;
        visited.delete(at(nx, ny)); path.pop(); if (d % 2) diagonals.delete(crossKey(x, y, d));
      }
      return false;
    };
    if (!walk(sx, sy)) return;
    const ports = Array.from({ length: count }, () => null);
    path.forEach(([x, y], i) => {
      const dirTo = ([ax, ay], [bx, by]) => STEP.findIndex(([dx, dy]) => dx === bx - ax && dy === by - ay);
      const from = i === 0 ? inSide : (dirTo([x, y], path[i - 1]));
      const to = i === path.length - 1 ? outSide : dirTo([x, y], path[i + 1]);
      ports[at(x, y)] = [from, to];
    });
    // Decoys: copies of real wire shapes (so shape alone does not give the path away), some with a third branch.
    const shapes = path.map((_, i) => { const [a, b] = ports[at(...path[i])]; return (b - a + 8) % 8; }).filter(gap => gap !== 0);
    for (let i = 0; i < count; i++) if (!ports[i]) {
      const a = Math.floor(rng() * 8), gap = pick(shapes.length ? shapes : [4]), tile = [a, (a + gap) % 8];
      if (rng() < branches) { const free = [0,1,2,3,4,5,6,7].filter(p => !tile.includes(p) && (p - a + 8) % 8 !== 1 && (a - p + 8) % 8 !== 1); tile.push(pick(free)); }
      ports[i] = tile;
    }
    this.ports = ports; this.path = path.map(([x, y]) => at(x, y));
    this.input = { index: at(sx, sy), side: inSide }; this.output = { index: at(ex, ey), side: outSide };
  }
  // Turns every tile to a random position (keeping a share of path tiles lined up on easy levels); never solved.
  shuffle(rng, presolved = 0) {
    const keep = new Set(this.path.filter(i => i !== this.input.index && rng() < presolved));
    this.turns = this.ports.map((_, i) => keep.has(i) ? 0 : Math.floor(rng() * 8));
    let guard = 0;
    while (this.connected() && guard++ < 64) this.turns[this.input.index] = (this.turns[this.input.index] + 1 + Math.floor(rng() * 6)) % 8;
  }
  tileName(index) {
    const x = index % this.cols, y = Math.floor(index / this.cols);
    const rows = ROW_NAMES[this.rows], cols = COLUMN_NAMES[this.cols];
    return rows && cols ? rows[y] + '-' + cols[x] : 'row ' + (y + 1) + ', column ' + (x + 1);
  }
  get instructions() { return 'Power enters the ' + circuitSides[this.input.side] + ' edge of the ' + this.tileName(this.input.index) + ' tile. Turn the wires (45° per click) to reach the OUTPUT at the ' + circuitSides[this.output.side] + ' edge of the ' + this.tileName(this.output.index) + ' tile. Diagonal wires link to diagonal neighbours.'; }
  hint() {
    const next = this.path.find(i => !this.connections(i).includes(this.ports[i][0]) || !this.connections(i).includes(this.ports[i][1]));
    const lead = 'Start at the ' + this.tileName(this.input.index) + ' tile: one wire must point ' + circuitDirections[this.input.side] + ' toward INPUT. ';
    if (next === undefined) return lead + 'Every tile on the power path is lined up: apply the repair.';
    const powered = this.powered();
    return lead + (powered.size ? 'Power already flows through ' + powered.size + ' tile' + (powered.size === 1 ? '' : 's') + '. ' : '') + 'Next, turn the ' + this.tileName(next) + ' tile. Finish at the ' + this.tileName(this.output.index) + ' tile with a wire pointing ' + circuitDirections[this.output.side] + '. Right-click turns a tile back.';
  }
  terminalPosition(endpoint) {
    const row = Math.floor(endpoint.index / this.cols) + 2, column = endpoint.index % this.cols + 2;
    const side = endpoint.side;
    return { row: side === 0 ? 1 : side === 4 ? this.rows + 2 : row, column: side === 6 ? 1 : side === 2 ? this.cols + 2 : column };
  }
  connections(index) { return this.ports[index].map(port => (port + this.turns[index]) % 8); }
  rotate(index, direction = 1) { this.turns[index] = (this.turns[index] + (direction < 0 ? 7 : 1)) % 8; this.moves++; }
  // A new random position for every tile (used when a level restarts).
  scramble(seed) { this.moves = 0; this.shuffle(randomGenerator(seed), 0); }
  neighbour(index, port) {
    const x = index % this.cols + STEP[port][0], y = Math.floor(index / this.cols) + STEP[port][1];
    return x < 0 || y < 0 || x >= this.cols || y >= this.rows ? -1 : y * this.cols + x;
  }
  powered() {
    const seen = new Set();
    if (!this.connections(this.input.index).includes(this.input.side)) return seen;
    const queue = [this.input.index]; seen.add(this.input.index);
    for (let i = 0; i < queue.length; i++) {
      const at = queue[i];
      for (const port of this.connections(at)) {
        const next = this.neighbour(at, port);
        if (next >= 0 && !seen.has(next) && this.connections(next).includes((port + 4) % 8)) { seen.add(next); queue.push(next); }
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
    this.bodyRadius=config.physicalScale?.35/this.terrain.cell:BODY_RADIUS;
    this.terrain.blocksSegment = (a, b) => segmentBlocked(a, b, this.colliders(), this.state.rover.occupied ? (this.config.physicalScale?2.4/this.terrain.cell:.49) : this.bodyRadius);
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
    const spawn=c.physicalScale?3/this.terrain.cell:1;
    this.state = { status: 'ready', phase: 'relay', time: 0, distanceMetres: 0, walkingMetres: 0, drivingMetres: 0,
      player: { x: this.objects.base.x + spawn, y: this.objects.base.y + spawn, heading: -Math.PI / 4, jump: 0, jumpVelocity: 0 },
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
  colliders() { const solid=[...this.props,...(this.naturalColliders||[]),...(this.landingColliders||[])];return this.state.rover.occupied ? solid : [...solid, {...roverCollider(this.state.rover),...(this.config.physicalScale?{halfX:2.4/this.terrain.cell,halfY:2.4/this.terrain.cell}:{})}]; }
  accessibleDestination(point) {
    const p = { x: clamp(Math.round(point.x), 1, this.terrain.width - 2), y: clamp(Math.round(point.y), 1, this.terrain.height - 2) };
    const radius = this.state.rover.occupied ? (this.config.physicalScale?2.4/this.terrain.cell:.49) : this.bodyRadius;
    if (!isOccupied(p, this.colliders(), radius)) return p;
    if(this.config.physicalScale){
      const radiusM=this.state.rover.occupied?4:3.2;
      const candidates=Array.from({length:16},(_,i)=>({x:point.x+Math.sin(i*Math.PI/8)*radiusM/this.terrain.cell,y:point.y+Math.cos(i*Math.PI/8)*radiusM/this.terrain.cell}));
      return candidates.filter(p=>this.terrain.inBounds(p.x,p.y)&&!isOccupied(p,this.colliders(),radius)).sort((a,b)=>distance(a,this.state.player)-distance(b,this.state.player))[0]||null;
    }
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
    let route = this.terrain.route(this.state.player, destination, this.maxSlope());
    if(this.config.physicalScale){
      const candidates=[];for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){const p={x:Math.round(destination.x)+x,y:Math.round(destination.y)+y};if(this.terrain.inBounds(p.x,p.y)&&this.terrain.canStep(p,destination,this.maxSlope()))candidates.push(p);}
      candidates.sort((a,b)=>distance(a,destination)+distance(a,this.state.player)-distance(b,destination)-distance(b,this.state.player));
      for(const p of candidates){const r=this.terrain.route(this.state.player,p,this.maxSlope());if(r){route={path:distance(p,destination)<.00001?r.path:[...r.path,destination],metres:r.metres+distance(p,destination)*this.terrain.cell};break;}}
    }
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
    s.player.jumpVelocity -= (c.physics.surfaceGravityMetresPerSecondSquared ?? c.physics.moonSurfaceGravityMetresPerSecondSquared) * dt;
    s.player.jump = Math.max(0, s.player.jump + s.player.jumpVelocity * dt);
    if (!s.player.jump) s.player.jumpVelocity = 0;
    let dx = input.dx || 0, dy = input.dy || 0;
    if (dx || dy) this.route = null;
    if (!dx && !dy && this.route) {
      while(this.route&&this.route.index<this.route.path.length&&distance(s.player,this.route.path[this.route.index])<.00001)this.route.index++;
      const next = this.route.path[this.route.index];
      if (next) { dx = next.x - s.player.x; dy = next.y - s.player.y; }
      else this.route = null;
    }
    const amount = Math.hypot(dx, dy), inRover = s.rover.occupied;
    const sprint = !!input.sprint && !inRover;
    const mobility=s.expedition?clamp(1-s.expedition.outpost.fatigue/180,.5,1)/s.expedition.outpost.suitFactor:1;
    const speed = inRover ? c.roverMetresPerSecond : c.walkMetresPerSecond * mobility * (sprint ? c.sprintMultiplier : 1);
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
      this.circuit = new Circuit(this.config.seed + (near.type === 'relay' ? 11 : 37), near.type, this.circuitDifficulty(near.type));
      this.events.push({ type: 'repair' });
    } else if (near.type === 'board') {
      s.rover.occupied = true; s.player.x = s.rover.x; s.player.y = s.rover.y;
      this.route = null; this.record('board', 'Boarded Echo.'); this.notify('Echo online. Bring the rover home to Haven.', 'success');
    } else if (near.type === 'exit') {
      const candidates = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:1,y:1},{x:-1,y:-1},{x:1,y:-1},{x:-1,y:1}].map(d => ({x:s.rover.x+d.x,y:s.rover.y+d.y}));
      const exit = candidates.find(p => this.terrain.inBounds(p.x,p.y) && this.terrain.slope(s.rover,p) <= this.config.walkMaxSlopeDegrees && !isOccupied(p,this.colliders(),this.bodyRadius));
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
  // Suit oxygen spent while working a repair in overtime. Running out ends the mission like any other oxygen loss.
  spendOxygen(minutes, reason = 'repair overtime') {
    const s = this.state; if (!(minutes > 0) || ['failed', 'complete'].includes(s.status)) return s.oxygen;
    s.oxygen = Math.max(0, s.oxygen - minutes);
    if (s.oxygen <= 0) {
      s.status = 'failed'; s.failureReason = 'Oxygen reserve exhausted during ' + reason; this.circuit = null; this.route = null;
      this.record('abort', s.failureReason); this.events.push({ type: 'ended' });
    }
    return s.oxygen;
  }
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
  // How hard the circuit puzzle is (see circuitSettings). Training and expeditions raise it level by level.
  circuitDifficulty(type) { return type === 'rover' ? 2 : 1; }
  // Back to the start of the current level (used when the repair clock runs out after both extensions).
  restartLevel() { this.reset(); return true; }
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
    if(this.config.world==='mars'&&/nasa|source|data|real|accur/.test(q))return 'Mars terrain uses a cached NASA MGS/MOLA elevation crop near Jezero. Local sky directions and sizes use dated NASA/JPL observer tables; Sky guide lets you inspect different hours. Our craft, flight curve and training equipment are authored teaching models.';
    if (/nasa|source|data|real|accur/.test(q)) return 'This terrain is an 80 × 80 crop of NASA LRO/LOLA elevations, averaged from 20 m to 40 m cells. Earth, Sun, Mars and available LRO positions use dated JPL Horizons vectors. Our equipment, structures and recovery story are authored teaching assumptions. Open Data & science for the sources.';
    if (/orbit|planet|earth|satellite|spacecraft|sun|mars/.test(q)) {
      const earth = this.astronomy().find(b => b.name === 'Earth' && b.inCoverage);
      return `Switch to Orbital view to inspect ${this.config.worldName||'Moon'}-centred positions at the mission clock. ${earth ? `Earth is ${Math.round(earth.distanceKm).toLocaleString()} km from the ${this.config.worldName||'Moon'}’s centre. ` : ''}These are interpolated ephemerides, not live telemetry. Sky guide uses separate local-horizon observer data; it also provides telescope inspection.`;
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
