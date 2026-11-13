// Multiplayer rooms for the crew mission.
// A room has a short code, 2 to 6 players and one shared crew mission. Players send their position a few times a
// second; the server runs the mission rules (dist/crew-rules.js) and streams the room to every player with
// server-sent events, which work through home Wi-Fi, phone hotspots, tunnels and online hosts alike.
import { randomBytes, randomUUID } from 'node:crypto';
import { CREW_MIN, CREW_MAX, CREW_COLORS, createCrewState, stepCrew, validLayout } from '../dist/crew-rules.js';

const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_IDLE_MS = 2 * 60 * 60 * 1000, OFFLINE_MS = 12000, LOBBY_DROP_MS = 5 * 60 * 1000, MAX_ROOMS = 200, TICK_MS = 200;
const cleanName = name => String(name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || 'Astronaut';
const finite = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi ? v : null;
const httpError = (status, message) => Object.assign(new Error(message), { status });

export class RoomHub {
  constructor({ now = () => Date.now(), autoTick = true } = {}) {
    this.rooms = new Map(); this.now = now;
    if (autoTick) { this.timer = setInterval(() => this.tick(TICK_MS / 1000), TICK_MS); this.timer.unref?.(); }
  }
  close() { clearInterval(this.timer); for (const room of this.rooms.values()) for (const s of room.streams) s.end(); this.rooms.clear(); }

  newCode() {
    for (let i = 0; i < 1000; i++) {
      const bytes = randomBytes(4), code = [...bytes].map(b => CODE_LETTERS[b % CODE_LETTERS.length]).join('');
      if (!this.rooms.has(code)) return code;
    }
    throw httpError(503, 'No room codes left; try again later');
  }
  room(code) {
    const room = this.rooms.get(String(code || '').toUpperCase());
    if (!room) throw httpError(404, 'That crew code does not exist (or the room has closed).');
    return room;
  }
  player(room, id, token) {
    const p = room.players.get(id);
    if (!p || p.token !== token) throw httpError(403, 'Not a member of this crew');
    p.lastSeen = this.now(); return p;
  }
  addPlayer(room, name) {
    const used = new Set([...room.players.values()].map(p => p.slot)), slot = [...Array(CREW_MAX).keys()].find(i => !used.has(i));
    const player = { id: randomUUID().slice(0, 8), token: randomUUID(), name: cleanName(name), slot, color: CREW_COLORS[slot], lastSeen: this.now(), streams: 0, x: null, y: null, heading: 0, jump: 0, moving: false, rover: false, oxygen: 100 };
    room.players.set(player.id, player); room.touched = this.now(); return player;
  }

  create({ name, world }) {
    if (this.rooms.size >= MAX_ROOMS) this.expire();
    if (this.rooms.size >= MAX_ROOMS) throw httpError(503, 'The server has too many crews right now');
    const room = { code: this.newCode(), world: world === 'mars' ? 'mars' : 'moon', status: 'lobby', hostId: null, players: new Map(), streams: new Set(), crew: null, layout: null, events: [], seq: 0, created: this.now(), touched: this.now() };
    const host = this.addPlayer(room, name); room.hostId = host.id; this.rooms.set(room.code, room);
    return { code: room.code, world: room.world, playerId: host.id, token: host.token };
  }
  join(code, { name, playerId, token } = {}) {
    const room = this.room(code);
    if (playerId && token) { const p = this.player(room, playerId, token); if (name) p.name = cleanName(name); return { code: room.code, world: room.world, playerId: p.id, token: p.token, rejoined: true }; }
    if (room.status !== 'lobby') throw httpError(409, 'This crew has already started its mission. Ask the host to start a new round.');
    if (room.players.size >= CREW_MAX) throw httpError(409, 'This crew is full (6 astronauts).');
    const p = this.addPlayer(room, name); this.event(room, p.name + ' joined the crew.');
    return { code: room.code, world: room.world, playerId: p.id, token: p.token };
  }
  update(code, { playerId, token, x, y, heading, jump, moving, rover, oxygen }) {
    const room = this.room(code), p = this.player(room, playerId, token);
    p.x = finite(x, -1e6, 1e6); p.y = finite(y, -1e6, 1e6); p.heading = finite(heading, -10, 10) ?? 0;
    p.jump = finite(jump, 0, 10) ?? 0; p.moving = !!moving; p.rover = !!rover; p.oxygen = finite(oxygen, 0, 100) ?? p.oxygen;
    room.touched = this.now(); return { ok: true };
  }
  action(code, { playerId, token, type, layout, name }) {
    const room = this.room(code), p = this.player(room, playerId, token), host = p.id === room.hostId;
    if (type === 'start') {
      if (!host) throw httpError(403, 'Only the crew host can start the mission');
      const online = this.online(room);
      if (online.length < CREW_MIN) throw httpError(409, 'The crew mission needs at least ' + CREW_MIN + ' astronauts. Share the link and wait for a crewmate.');
      if (!validLayout(layout) || layout.dishes.length !== Math.min(CREW_MAX, online.length)) throw httpError(400, 'Invalid mission layout');
      room.layout = layout; room.crew = createCrewState(layout); room.status = 'playing'; room.seq++;
      this.event(room, 'Mission started with ' + online.length + ' astronauts. ' + room.crew.message);
    } else if (type === 'lobby') {
      if (!host) throw httpError(403, 'Only the crew host can start a new round');
      room.status = 'lobby'; room.crew = null; room.layout = null; room.seq++; this.event(room, 'Back in the crew lobby.');
    } else if (type === 'leave') {
      room.players.delete(p.id); this.event(room, p.name + ' left the crew.');
      if (room.hostId === p.id) room.hostId = [...room.players.values()].sort((a, b) => a.slot - b.slot)[0]?.id || null;
      if (!room.players.size) this.closeRoom(room);
    } else if (type === 'rename') { p.name = cleanName(name); }
    else throw httpError(400, 'Unknown action');
    room.touched = this.now(); this.broadcast(room); return { ok: true };
  }

  online(room) { const now = this.now(); return [...room.players.values()].filter(p => p.streams > 0 || now - p.lastSeen < OFFLINE_MS); }
  event(room, message) { room.events.push({ at: this.now(), message }); if (room.events.length > 30) room.events.shift(); }
  snapshot(room) {
    const online = new Set(this.online(room).map(p => p.id));
    return {
      code: room.code, world: room.world, status: room.crew?.status === 'complete' || room.crew?.status === 'failed' ? room.crew.status : room.status, hostId: room.hostId, seq: room.seq,
      players: [...room.players.values()].sort((a, b) => a.slot - b.slot).map(p => ({ id: p.id, name: p.name, slot: p.slot, color: p.color, online: online.has(p.id), x: p.x, y: p.y, heading: p.heading, jump: p.jump, moving: p.moving, rover: p.rover, oxygen: p.oxygen })),
      crew: room.crew, layout: room.layout, events: room.events.slice(-6)
    };
  }
  stream(code, { playerId, token }, res) {
    const room = this.room(code), p = this.player(room, playerId, token);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n'); p.streams++; room.streams.add(res); res.write('data: ' + JSON.stringify(this.snapshot(room)) + '\n\n');
    res.on('close', () => { room.streams.delete(res); p.streams = Math.max(0, p.streams - 1); p.lastSeen = this.now(); });
  }
  broadcast(room) {
    if (!room.streams.size) return;
    const data = 'data: ' + JSON.stringify(this.snapshot(room)) + '\n\n';
    for (const res of room.streams) res.write(data);
  }
  closeRoom(room) { for (const s of room.streams) s.end(); this.rooms.delete(room.code); }
  expire() {
    const now = this.now();
    for (const room of [...this.rooms.values()]) {
      if (now - room.touched > ROOM_IDLE_MS) { this.closeRoom(room); continue; }
      if (room.status === 'lobby') for (const p of [...room.players.values()]) if (!p.streams && now - p.lastSeen > LOBBY_DROP_MS && p.id !== room.hostId) room.players.delete(p.id);
    }
  }
  tick(dt) {
    this.expire();
    for (const room of this.rooms.values()) {
      if (room.status === 'playing' && room.crew) {
        const online = new Set(this.online(room).map(p => p.id));
        const players = [...room.players.values()].map(p => ({ id: p.id, x: p.x, y: p.y, online: online.has(p.id) }));
        for (const message of stepCrew(room.crew, room.layout, players, dt)) this.event(room, message);
        if (room.crew.status !== 'playing') room.status = room.crew.status;
      }
      this.broadcast(room);
    }
  }
}
