import { readPreference, writePreference } from './preferences.js';

export const tutorialSteps = [
  { id: 'welcome', target: 'start-button', title: 'Your first lunar expedition', text: 'Echo is stranded. You will restore a relay, repair its power bus, and drive it home. ASTRA will guide you through the real controls, one action at a time.', action: 'Begin guided expedition', command: 'start', hold: false },
  { id: 'move', target: 'world', title: 'Take your first steps', text: 'Hold WASD or an arrow key to move. On a phone, use the direction buttons. Walk about 40 metres to continue, or choose the route button below to travel automatically.', action: 'Walk using a plotted route', command: 'route', hold: false },
  { id: 'reserves', target: 'telemetry-card', title: 'Every detour has a cost', text: 'Oxygen, water and energy change with your actions. Sprinting uses more oxygen. The Lifeline checks whether the calculated route home fits your reserves. Time is frozen while you read this step.', action: 'I understand my reserves', command: 'next', hold: true },
  { id: 'astra', target: 'astra-button', title: 'Your companion is one tap away', text: 'Tap the ASTRA button to open your mission companion. Try a quick question or type your own. Drag either panel by its header to move it out of the way. The button below opens ASTRA with advice for your next move.', action: 'Open ASTRA for my next move', command: 'astra', hold: true },
  { id: 'relay-route', target: 'route-button', title: 'Find the silent relay', text: 'Plot route to objective calculates a path across the NASA elevation grid. The orange route leads to your objective; the white dashed ribbon leads home. WASD lets you take over at any time.', action: 'Plot route to the relay', command: 'route', hold: false },
  { id: 'relay-arrive', target: 'world', title: 'Reach the relay', text: 'Follow the orange route. When you are close enough, an E prompt appears. Press E or select Interact below to open the repair panel.', action: 'Interact with the relay', command: 'interact', hold: false },
  { id: 'relay-repair', target: 'circuit-grid', title: 'Reconnect the signal', text: 'Power enters the middle-left tile. Click tiles to rotate them 90 degrees. Match neighbouring wire ends until power reaches the middle-right output. Glowing tiles have power. Apply repair becomes available when the circuit is connected.', action: 'Give me a circuit hint', command: 'hint', hold: false },
  { id: 'echo-route', target: 'route-button', title: 'Signal restored. Find Echo', text: 'The relay is online. Your next objective is the rover. Plot its route and keep checking the Lifeline before exploring optional cyan research markers.', action: 'Plot route to Echo', command: 'route', hold: false },
  { id: 'echo-arrive', target: 'world', title: 'Approach the stranded rover', text: 'Get close to Echo and press E. You will repair its power bus using the same circuit rules. The clock pauses throughout both repair puzzles.', action: 'Interact with Echo', command: 'interact', hold: false },
  { id: 'echo-repair', target: 'circuit-grid', title: 'Bring Echo back to life', text: 'Echo has a different wire route: power enters the bottom-left tile from below and exits the top-right tile above. Rotate the wires, then apply the repair. This restores the rover battery and motors; you still need to board the vehicle.', action: 'Give me a circuit hint', command: 'hint', hold: false },
  { id: 'board', target: 'interact-button', title: 'Get behind the wheel', text: 'Echo is repaired. Press E once more near the rover to board it. The location panel will switch to ECHO / ROVER, and the battery display will show rover energy.', action: 'Board Echo', command: 'interact', hold: false },
  { id: 'orbital', target: 'orbit-tab', title: 'Track your expedition and the sky', text: 'The surface tracker follows your astronaut and rover. Orbital view shows LRO, Earth, Mars and the Sun from dated JPL samples. These are ephemerides, not live telemetry. Take a look, then return to the surface.', action: 'Open orbital view', command: 'orbit', hold: true },
  { id: 'home', target: 'route-button', title: 'Bring Echo home', text: 'Return to Surface and plot the route to Haven. Drive there, then press E to dock. The tutorial will switch off automatically when you finish. You can restart it later from Help.', action: 'Plot the route home', command: 'home', hold: false }
];

export class Tutorial {
  constructor(storage = null) {
    this.storage = storage;
    this.index = 0;
    this.active = !readPreference('luna-tutorial-v1', { disabled: false }, storage)?.disabled;
    this.reason = '';
  }
  get step() { return tutorialSteps[this.index]; }
  get holdsTime() { return this.active && !!this.step?.hold; }
  next() { if (this.active) this.index = Math.min(this.index + 1, tutorialSteps.length - 1); }
  restart() { this.index = 0; this.active = true; this.reason = ''; writePreference('luna-tutorial-v1', { disabled: false }, this.storage); }
  disable(reason = 'skipped') {
    this.active = false; this.reason = reason;
    writePreference('luna-tutorial-v1', { disabled: true, reason }, this.storage);
  }
  sync(mission) {
    if (!this.active) return;
    const s = mission.state;
    if (s.status === 'complete') { this.disable('completed'); return; }
    if (s.status === 'failed') { this.active = false; this.reason = 'failed'; return; }
    const near = point => Math.hypot(s.player.x - point.x, s.player.y - point.y) * mission.terrain.cell <= mission.config.interactionMetres;
    for (let guard = 0; guard < tutorialSteps.length; guard++) {
      const tests = {
        welcome: s.status !== 'ready', move: s.distanceMetres >= 40 || s.relayOnline,
        'relay-route': !!mission.route || near(mission.objects.relay) || s.relayOnline,
        'relay-arrive': (s.status === 'repair' && mission.repairType === 'relay') || s.relayOnline,
        'relay-repair': s.relayOnline,
        'echo-route': !!mission.route || near(s.rover) || s.rover.repaired,
        'echo-arrive': (s.status === 'repair' && mission.repairType === 'rover') || s.rover.repaired,
        'echo-repair': s.rover.repaired, board: s.rover.occupied
      };
      if (!tests[this.step.id]) break;
      this.next();
    }
  }
}
