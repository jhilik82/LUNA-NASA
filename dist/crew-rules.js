// Crew mission "Haven Blackout": a co-operative surface mission for 2 to 6 astronauts on their own devices.
// The same rules run on the game server (which decides what happens) and in every browser (which shows it),
// so all players see one shared mission. Positions are terrain grid coordinates; distances are in metres.
//
// Every stage needs several crewmates at once:
//   1. Twin breakers   - two crewmates hold Breaker A and Breaker B (140 m apart) at the same moment.
//   2. Relay array     - one relay dish per crewmate; all dishes must be locked at the same moment.
//   3. Power cell      - the cell only moves while two or more crewmates walk beside it; carry it to Haven.
//   4. Return together - everyone inside Haven's airlock zone at once.

export const CREW_MIN = 2;
export const CREW_MAX = 6;
export const CREW_TIME_LIMIT_SECONDS = 15 * 60;   // real time for the whole mission
export const HOLD_SECONDS = 3;                    // how long a team position must be held
export const STATION_RADIUS_METRES = 7;
export const CELL_GRAB_METRES = 6;
export const BASE_RADIUS_METRES = 14;
export const CELL_MAX_SPEED_METRES = 18;          // per real second (the surface clock runs faster than real time)
export const CREW_COLORS = ['#ff8a3d', '#3dd6c6', '#c86bff', '#ffd23d', '#4d9bff', '#ff5f8f'];

export const CREW_STAGES = [
  { id: 'breakers', title: 'Twin breakers', text: 'Haven is dark. Two crewmates must hold Breaker A and Breaker B at the same moment to restart the main bus.' },
  { id: 'dishes', title: 'Lock the relay array', text: 'Every crewmate stands at a different relay dish. All dishes must lock at the same moment to reach Earth.' },
  { id: 'cell', title: 'Carry the power cell', text: 'The spare power cell is too heavy for one astronaut: it only moves while two or more crewmates walk beside it. Bring it to Haven.' },
  { id: 'return', title: 'Return together', text: 'Everyone back inside Haven’s airlock zone at the same time.' }
];

const clampCount = n => Math.max(CREW_MIN, Math.min(CREW_MAX, Math.round(Number(n) || CREW_MIN)));
const round = p => ({ x: Math.round(p.x * 1000) / 1000, y: Math.round(p.y * 1000) / 1000 });
const metres = (a, b, layout) => Math.hypot(a.x - b.x, a.y - b.y) * layout.metresPerCell;

// Where the stations go. accessible(point) may move a point to the nearest reachable ground (or return null).
export function planCrewLayout(base, playerCount, { metresPerCell, accessible = p => p }) {
  const n = clampCount(playerCount), cells = m => m / metresPerCell;
  const at = (degrees, distance) => { const a = degrees * Math.PI / 180, p = { x: base.x + Math.cos(a) * cells(distance), y: base.y + Math.sin(a) * cells(distance) }; return round(accessible(p) || p); };
  return {
    base: round(base), metresPerCell, playerCount: n,
    breakers: [at(20, 70), at(200, 70)],
    dishes: Array.from({ length: n }, (_, i) => at(95 + i * 360 / n, 110)),
    cell: at(305, 150)
  };
}

export function validLayout(layout) {
  const point = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
  return !!layout && Number.isFinite(layout.metresPerCell) && layout.metresPerCell > 0 && point(layout.base) && point(layout.cell)
    && Array.isArray(layout.breakers) && layout.breakers.length === 2 && layout.breakers.every(point)
    && Array.isArray(layout.dishes) && layout.dishes.length >= CREW_MIN && layout.dishes.length <= CREW_MAX && layout.dishes.every(point);
}

export function createCrewState(layout) {
  return { status: 'playing', stage: 0, elapsed: 0, timeLimit: CREW_TIME_LIMIT_SECONDS, hold: 0, cell: { ...layout.cell }, carriers: [], occupied: [], completedStages: [], message: CREW_STAGES[0].text };
}

// The dishes that count right now: one per connected crewmate (at least two), so a dropped connection
// does not make the mission impossible.
export function activeDishes(layout, liveCount) { return layout.dishes.slice(0, Math.max(CREW_MIN, Math.min(layout.dishes.length, liveCount))); }

// Station each crewmate should head to in the current stage (by slot order), for guidance and ASTRA.
export function crewTarget(state, layout, slot, liveCount = layout.playerCount) {
  const stage = CREW_STAGES[state?.stage]?.id;
  if (stage === 'breakers') return slot < 2 ? { kind: 'breaker', index: slot, point: layout.breakers[slot], label: 'Breaker ' + 'AB'[slot] } : { kind: 'base', point: layout.base, label: 'Haven (stand by)' };
  if (stage === 'dishes') { const dishes = activeDishes(layout, liveCount), i = slot % dishes.length; return { kind: 'dish', index: i, point: dishes[i], label: 'Relay dish ' + (i + 1) }; }
  if (stage === 'cell') return state.carriers.length >= CREW_MIN ? { kind: 'base', point: layout.base, label: 'Haven (carry the cell)' } : { kind: 'cell', point: state.cell, label: 'Power cell' };
  return { kind: 'base', point: layout.base, label: 'Haven airlock' };
}

// Advances the mission by dt real seconds. players: [{ id, x, y, online }]. Returns a list of event messages.
export function stepCrew(state, layout, players, dt) {
  if (!state || state.status !== 'playing') return [];
  const events = [], live = players.filter(p => p.online && Number.isFinite(p.x) && Number.isFinite(p.y));
  state.elapsed += dt;
  if (state.elapsed >= state.timeLimit) { state.status = 'failed'; state.message = 'Time ran out before Haven was back online. Regroup and try again.'; events.push(state.message); return events; }
  const stage = CREW_STAGES[state.stage].id, near = (p, point, radius) => metres(p, point, layout) <= radius;
  let ready = false;
  if (stage === 'breakers') {
    state.occupied = layout.breakers.map(b => live.some(p => near(p, b, STATION_RADIUS_METRES)));
    ready = state.occupied.every(Boolean);
  } else if (stage === 'dishes') {
    const dishes = activeDishes(layout, live.length), used = new Set();
    // Each crewmate can lock only one dish.
    state.occupied = dishes.map(d => { const p = live.find(q => !used.has(q.id) && near(q, d, STATION_RADIUS_METRES)); if (p) used.add(p.id); return !!p; });
    ready = state.occupied.length >= CREW_MIN && state.occupied.every(Boolean);
  } else if (stage === 'cell') {
    const carriers = live.filter(p => near(p, state.cell, CELL_GRAB_METRES));
    state.carriers = carriers.length >= CREW_MIN ? carriers.map(p => p.id) : [];
    if (state.carriers.length) {
      const cx = carriers.reduce((n, p) => n + p.x, 0) / carriers.length, cy = carriers.reduce((n, p) => n + p.y, 0) / carriers.length;
      const gap = Math.hypot(cx - state.cell.x, cy - state.cell.y), maxCells = CELL_MAX_SPEED_METRES / layout.metresPerCell * dt;
      const f = gap > maxCells ? maxCells / gap : 1;
      state.cell = round({ x: state.cell.x + (cx - state.cell.x) * f, y: state.cell.y + (cy - state.cell.y) * f });
    }
    state.occupied = [state.carriers.length >= CREW_MIN];
    if (metres(state.cell, layout.base, layout) <= BASE_RADIUS_METRES) ready = true, state.hold = HOLD_SECONDS;
  } else {
    state.occupied = live.map(p => near(p, layout.base, BASE_RADIUS_METRES));
    ready = live.length >= CREW_MIN && state.occupied.every(Boolean);
  }
  state.hold = ready ? Math.min(HOLD_SECONDS, state.hold + dt) : Math.max(0, state.hold - dt * 2);
  if (state.hold >= HOLD_SECONDS) {
    state.completedStages.push(stage); state.hold = 0; state.occupied = []; state.carriers = [];
    if (state.stage === CREW_STAGES.length - 1) {
      state.status = 'complete'; state.message = 'Haven is back online and the whole crew is safe. Mission complete in ' + formatClock(state.elapsed) + '!';
    } else {
      state.stage++; state.message = CREW_STAGES[state.stage].text;
    }
    events.push((state.status === 'complete' ? '' : CREW_STAGES[state.stage - 1].title + ' done. Next: ' + CREW_STAGES[state.stage].title + '. ') + state.message);
  }
  return events;
}

export function formatClock(seconds) { const s = Math.max(0, Math.floor(seconds)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
