import { readPreference, writePreference } from './preferences.js';

export const STORY_KEY = 'luna-story-enabled-v1';
export const STORY_DURATION = 26;
export const storyChapters = [
  { start: 0, end: 6, shot: 'arrival', kicker: 'CHAPTER 01 / A NEW FRONTIER', title: 'Somewhere beyond home.', speaker: 'MISSION CONTROL', caption: 'Haven is our first foothold at the lunar south pole. Every expedition keeps it alive.' },
  { start: 6, end: 12, shot: 'echo', kicker: 'CHAPTER 02 / THE SILENT ROVER', title: 'Then the signal vanished.', speaker: 'ECHO / LAST TRANSMISSION', caption: 'Power bus failure. Drive systems offline. Research secured. Awaiting recovery…' },
  { start: 12, end: 19, shot: 'relay', kicker: 'CHAPTER 03 / FLIGHT SCHOOL', title: 'Every crew member starts here.', speaker: 'ASTRA', caption: 'Before the recovery, learn to move safely, repair systems and protect your return reserves. I will guide each action.' },
  { start: 19, end: 26, shot: 'astronaut', kicker: 'CHAPTER 04 / JUNIOR ASTRONAUT', title: 'Your first moonwalk.', speaker: 'ASTRA', caption: 'Ten practical missions. Start at the training beacon, learn to operate the equipment, earn your badges, and join the crew.' }
];

export class StorySequence {
  // Completion belongs to this visit. A previous skip must not silently suppress the next opening.
  constructor(storage = null) { this.storage = storage; this.enabled = readPreference(STORY_KEY, true, storage) !== false; this.state = 'idle'; this.elapsed = 0; }
  get shouldPlay() { return this.enabled && this.state === 'idle'; }
  setEnabled(enabled) { this.enabled = enabled === true; writePreference(STORY_KEY, this.enabled, this.storage); }
  get active() { return this.state === 'playing'; }
  get chapter() { return storyChapters.find(c => this.elapsed < c.end) || storyChapters.at(-1); }
  start() { if (!this.shouldPlay) return false; this.state = 'playing'; this.elapsed = 0; return true; }
  update(dt, hidden = false) {
    if (!this.active || hidden) return false;
    this.elapsed = Math.min(STORY_DURATION, this.elapsed + Math.max(0, Math.min(dt, .1)));
    if (this.elapsed >= STORY_DURATION - 1e-8) { this.finish(); return true; }
    return false;
  }
  finish(skipped = false) {
    if (!this.active) return;
    this.state = skipped ? 'skipped' : 'finished';
  }
}
