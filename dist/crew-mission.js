import { TrainingMission } from './academy.js';
import { CREW_STAGES, CREW_MIN, crewTarget, planCrewLayout, formatClock } from './crew-rules.js';

// The surface side of a multiplayer crew mission. Movement, terrain, oxygen and the HUD work like any surface
// mission; what to do comes from the shared room (set by app.js from the server), not from a flight-school lesson.
export const CREW_LESSON = {
  id: 'crew', title: 'Haven Blackout', skill: 'Teamwork under pressure', badge: 'Crew Specialist',
  brief: 'Haven has lost power. Your crew of 2 to 6 astronauts must restart the breakers together, lock the relay array, carry in a spare power cell and return to Haven at the same time.',
  explanation: 'No astronaut can finish this alone: every stage needs crewmates in different places at the same moment.',
  steps: CREW_STAGES.map(s => s.title)
};

export class CrewMission extends TrainingMission {
  constructor(...args) { super(...args); this.isCrew = true; this.room = null; this.selfId = null; this.crewLessonActive = true; }
  get lesson() { return this.crewLessonActive ? CREW_LESSON : super.lesson; }
  get courseComplete() { return false; }
  get awaitingRecap() { return false; }
  syncTraining() {}
  awardField() {}
  passRecap() { return false; }
  nextLevel() { return false; }
  setRoom(room, selfId) { this.room = room; this.selfId = selfId; }
  liveCrew() { return (this.room?.players || []).filter(p => p.online).sort((a, b) => a.slot - b.slot); }
  mySlot() { return Math.max(0, this.liveCrew().findIndex(p => p.id === this.selfId)); }
  // Station positions for this crew, worked out on the host's device and shared through the server.
  planLayout(playerCount) { return planCrewLayout(this.objects.base, playerCount, { metresPerCell: this.terrain.cell, accessible: p => this.accessibleDestination(p) }); }
  assignment() {
    const room = this.room;
    if (!room?.crew || !room.layout) return null;
    return crewTarget(room.crew, room.layout, this.mySlot(), this.liveCrew().length);
  }
  target() { return this.assignment()?.point || this.objects.base; }
  metresTo(point) { return Math.round(Math.hypot(point.x - this.state.player.x, point.y - this.state.player.y) * this.terrain.cell); }
  nextAction() {
    const room = this.room;
    if (!room) return { title: 'Crew mission', text: 'Create a crew or join one with a code to play together.', action: 'Open crew lobby', command: 'crew' };
    if (room.status === 'lobby') {
      const n = this.liveCrew().length;
      return { title: 'Crew lobby · ' + room.code, text: n < CREW_MIN ? 'Waiting for crewmates: share the link. The mission needs at least ' + CREW_MIN + ' astronauts.' : n + ' astronauts ready. ' + (room.hostId === this.selfId ? 'Start the mission when everyone is in.' : 'Waiting for the host to start.'), action: 'Open crew lobby', command: 'crew' };
    }
    const crew = room.crew;
    if (crew.status === 'complete') return { title: 'Mission complete!', text: crew.message, action: 'Crew lobby', command: 'crew' };
    if (crew.status === 'failed') return { title: 'Mission failed', text: crew.message, action: 'Crew lobby', command: 'crew' };
    const stage = CREW_STAGES[crew.stage], t = this.assignment();
    return { title: stage.title + ' · ' + formatClock(crew.timeLimit - crew.elapsed) + ' left', text: stage.text + ' Your spot: ' + t.label + ' (' + this.metresTo(t.point) + ' m).', action: 'Go to ' + t.label, command: 'route' };
  }
  interact() { const t = this.assignment(); this.notify(t ? 'Crew stations work by standing on them together. Head to ' + t.label + ' (' + this.metresTo(t.point) + ' m).' : 'Open the crew lobby to start the mission.', 'info'); }
  astra(question = 'next') {
    const q = String(question).toLowerCase(), a = this.nextAction();
    if (/crew|team|station|breaker|dish|relay|cell|what (now|next)|next|where|help|how/.test(q) || q === 'next') return a.title + '. ' + a.text;
    return super.astra(question);
  }
  // Running out of oxygen in a crew mission does not end it for everyone: the astronaut is brought back to Haven
  // on a fresh tank, which costs the team the walk back.
  update(dt, input = {}) {
    super.update(dt, input);
    const s = this.state;
    if (s.status === 'failed') {
      const suit = this.config.suit;
      Object.assign(s, { status: 'playing', oxygen: suit.oxygenMinutes, suitWh: suit.batteryWh ?? s.suitWh, water: suit.waterLitres ?? s.water, failureReason: null });
      s.player.x = this.objects.base.x; s.player.y = this.objects.base.y; s.player.speed = 0; this.route = null;
      this.events = this.events.filter(e => e.type !== 'ended');
      this.notify('Oxygen ran low: ASTRA guided you back to Haven for a fresh tank. Rejoin your crew!', 'warning');
    }
  }
}
