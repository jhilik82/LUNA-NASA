// Countdown for the circuit-repair puzzles.
// Every puzzle gets 45 seconds. When the clock runs out the player may buy 15 more seconds for 3% of the suit's
// oxygen, at most twice. If the time runs out after both extensions, the level restarts from its initial state.

export const PUZZLE_TIME_SECONDS = 45;
export const EXTENSION_SECONDS = 15;
export const EXTENSION_OXYGEN_PERCENT = 3;   // percentage points of a full suit oxygen supply
export const MAX_EXTENSIONS = 2;

// Kept as a function so callers do not need to know the rule; every repair type has the same limit.
export function puzzleTimeLimit() { return PUZZLE_TIME_SECONDS; }

export class PuzzleTimer {
  constructor(limitSeconds = PUZZLE_TIME_SECONDS) {
    this.limit = limitSeconds; this.segment = limitSeconds; this.remaining = limitSeconds;
    this.extensions = 0; this.state = 'running';   // 'running' | 'expired' (waiting for a choice) | 'out'
  }
  get extensionsLeft() { return MAX_EXTENSIONS - this.extensions; }
  get canExtend() { return this.state === 'expired' && this.extensionsLeft > 0; }
  get fraction() { return Math.max(0, this.remaining) / this.segment; }
  get level() { return this.state !== 'running' ? 'expired' : this.extensions ? 'extra' : this.fraction <= .15 ? 'danger' : this.fraction <= .35 ? 'warning' : 'ok'; }
  // Advance by dt seconds of real time. Returns what happened this step:
  //   { type: 'running' } | { type: 'expired' } (an extension can be bought) | { type: 'out' } (restart the level)
  update(dt, { paused = false } = {}) {
    if (this.state !== 'running' || paused || !(dt > 0)) return { type: this.state === 'running' ? 'running' : 'waiting' };
    this.remaining -= dt;
    if (this.remaining > 0) return { type: 'running' };
    this.remaining = 0; this.state = this.extensionsLeft > 0 ? 'expired' : 'out';
    return { type: this.state };
  }
  // Buys one extension. Returns false when none is left or the clock is still running.
  extend() {
    if (!this.canExtend) return false;
    this.extensions++; this.segment = EXTENSION_SECONDS; this.remaining = EXTENSION_SECONDS; this.state = 'running';
    return true;
  }
  label() {
    const s = Math.ceil(Math.max(0, this.remaining));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + (this.extensions && this.state === 'running' ? ' extra' : '');
  }
}
