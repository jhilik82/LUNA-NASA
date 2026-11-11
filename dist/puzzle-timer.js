// Countdown for the circuit-repair puzzles.
// Default rule: when time runs out the bus trips, the wires scramble and the countdown restarts.
// With "Use more oxygen to solve the puzzle" switched on, the player keeps working in overtime instead,
// and every overtime second costs suit oxygen.

export const PUZZLE_TIME_LIMITS = { relay: 60, rover: 75, outpost: 90 };
export const TRAINING_TIME_FACTOR = 1.5;          // flight-school lessons are for learning: 50% more time
export const OXYGEN_MINUTES_PER_OVERTIME_SECOND = 1; // overtime cost, in minutes of suit oxygen

export function puzzleTimeLimit(repairType, training = false) {
  const base = PUZZLE_TIME_LIMITS[repairType] ?? PUZZLE_TIME_LIMITS.rover;
  return Math.round(base * (training ? TRAINING_TIME_FACTOR : 1));
}

export class PuzzleTimer {
  constructor(limitSeconds) { this.limit = limitSeconds; this.restart(); this.resets = 0; }
  restart() { this.remaining = this.limit; this.overtime = 0; }
  get expired() { return this.remaining <= 0; }
  get fraction() { return Math.max(0, this.remaining) / this.limit; }
  get level() { return this.expired ? 'overtime' : this.fraction <= .1 ? 'danger' : this.fraction <= .3 ? 'warning' : 'ok'; }
  // Advance by dt seconds of real time. Returns what happened this step:
  //   { type: 'running' } | { type: 'reset' } | { type: 'overtime', oxygenMinutes }
  update(dt, { useOxygen = false, paused = false } = {}) {
    if (paused || !(dt > 0)) return { type: 'running' };
    if (!this.expired) {
      this.remaining -= dt;
      if (!this.expired) return { type: 'running' };
      const spill = -this.remaining; this.remaining = 0;
      if (!useOxygen) { this.resets++; this.restart(); return { type: 'reset' }; }
      dt = spill;
    } else if (!useOxygen) { this.resets++; this.restart(); return { type: 'reset' }; }
    this.overtime += dt;
    return { type: 'overtime', oxygenMinutes: dt * OXYGEN_MINUTES_PER_OVERTIME_SECOND };
  }
  label() {
    const s = this.expired ? Math.floor(this.overtime) : Math.ceil(Math.max(0, this.remaining));
    const text = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    return this.expired ? '+' + text + ' overtime' : text;
  }
}
