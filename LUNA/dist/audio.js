import { readPreference, writePreference } from './preferences.js';

// Original, procedurally composed music. No recordings, downloads or third-party tracks.
export class Soundtrack {
  constructor(storage = null, Context = null) {
    this.storage = storage; this.Context = Context;
    const saved = readPreference('luna-audio-v1', {}, storage);
    this.muted = saved?.muted === true;
    this.volume = Number.isFinite(saved?.volume) ? Math.max(0, Math.min(1, saved.volume)) : 0.45;
    this.context = null; this.nextBeat = 0; this.beat = 0; this.mode = 'explore';
    this.activeVoices = 0; this.nodes = new Set(); this.lastStep = 0; this.hidden = false;
  }
  save() { writePreference('luna-audio-v1', { muted: this.muted, volume: this.volume }, this.storage); }
  async activate() {
    try {
      if (!this.context) {
        const Context = this.Context || globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) return false;
        this.context = new Context();
        this.master = this.context.createGain(); this.master.gain.value = 0;
        this.compressor = this.context.createDynamicsCompressor();
        this.master.connect(this.compressor); this.compressor.connect(this.context.destination);
        this.delay = this.context.createDelay(1); this.delay.delayTime.value = 0.32;
        this.echo = this.context.createGain(); this.echo.gain.value = 0.22;
        this.delay.connect(this.echo); this.echo.connect(this.master);
        this.nextBeat = this.context.currentTime + 0.08;
      }
      if (this.context.state === 'suspended' && !this.hidden) await this.context.resume();
      this.applyLevel(); return true;
    } catch { return false; }
  }
  applyLevel(quiet = false) {
    if (!this.context) return;
    this.master.gain.setTargetAtTime(this.muted || this.hidden ? 0 : this.volume * (quiet ? 0.14 : 0.38), this.context.currentTime, 0.12);
  }
  setMuted(muted) { this.muted = !!muted; this.save(); this.applyLevel(); }
  setVolume(volume) { this.volume = Math.max(0, Math.min(1, Number(volume) || 0)); this.save(); this.applyLevel(); }
  setHidden(hidden) { this.hidden = !!hidden; this.applyLevel(); }
  tone(midi, at, duration = 0.4, level = 0.15, type = 'sine', detune = 0) {
    if (!this.context || this.activeVoices >= 64 || this.muted || this.hidden) return;
    const osc = this.context.createOscillator(), gain = this.context.createGain();
    osc.type = type; osc.frequency.value = 440 * 2 ** ((midi - 69) / 12); osc.detune.value = detune;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, level), at + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain); gain.connect(this.master); gain.connect(this.delay);
    this.activeVoices++; this.nodes.add(osc);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); this.activeVoices--; this.nodes.delete(osc); };
    osc.start(at); osc.stop(at + duration + 0.02);
  }
  cue(name) {
    if (!this.context || this.muted || this.hidden) return;
    const notes = { launch: [50, 57, 62, 69], repair: [62, 65, 69, 74], board: [50, 57, 62], survey: [74, 81, 86], victory: [62, 66, 69, 74, 78, 81], fail: [50, 48, 45], click: [81], step: [34], landing:[33,40,45], radio:[76,69,64], ready:[69,74,81] }[name] || [69];
    notes.forEach((n, i) => this.tone(n, this.context.currentTime + i * 0.12, name === 'victory' ? 1.2 : 0.25, name === 'step' ? 0.04 : 0.23, 'triangle'));
  }
  updateOpening(elapsed){
    const previous=this.lastOpeningTime??elapsed;this.lastOpeningTime=elapsed;
    if(!this.context||this.context.state!=='running'||this.hidden||this.muted)return;
    this.update({status:'opening',rover:{occupied:false},moving:false},null,false);
    for(const [at,name] of [[4.15,'landing'],[8.8,'radio'],[23.6,'ready']])if(previous<at&&elapsed>=at)this.cue(name);
  }
  update(state, life, held = false) {
    if (!this.context || this.context.state !== 'running' || this.hidden) return;
    const now = this.context.currentTime;
    this.mode = state.status==='opening'?'opening':state.status === 'complete' ? 'home' : state.status === 'repair' ? 'repair' : state.status === 'failed' || (life && !life.safe) ? 'tension' : state.rover.occupied ? 'drive' : 'explore';
    this.applyLevel(held || state.status === 'paused');
    if (this.muted) { this.nextBeat = now + 0.05; return; }
    if (this.nextBeat < now - 0.2) this.nextBeat = now + 0.03;
    const tempo = { opening:76, explore: 72, repair: 88, tension: 96, drive: 84, home: 72 }[this.mode];
    const chords = this.mode === 'home' ? [[50, 57, 62, 66], [43, 55, 59, 62], [45, 57, 61, 64], [50, 57, 62, 66]] : [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 60]];
    let guard = 0;
    while (this.nextBeat < now + 0.18 && guard++ < 4) {
      const at = this.nextBeat, chord = chords[Math.floor(this.beat / 16) % chords.length], part = this.beat % 16;
      if (part === 0) chord.forEach(n => this.tone(n, at, 3.2, 0.055, 'triangle', -4));
      const arp = chord[[0, 2, 1, 3, 2, 1, 3, 2][this.beat % 8]] + 12;
      this.tone(arp, at, 0.75, this.mode === 'tension' ? 0.12 : 0.08);
      if (this.beat % 4 === 0) this.tone(chord[0] - 12, at, 0.9, 0.17, 'sine');
      if (['drive', 'tension'].includes(this.mode) && part % 2 === 0) this.tone(30, at, 0.1, 0.12);
      this.nextBeat += 60 / tempo / 2; this.beat++;
    }
    if (state.status === 'playing' && state.moving && now - this.lastStep > (state.rover.occupied ? 0.8 : 0.42)) {
      this.lastStep = now; this.cue(state.rover.occupied ? 'step' : 'step');
    }
  }
  dispose() {
    for (const node of this.nodes) { try { node.stop(); } catch {} }
    this.nodes.clear(); if (this.context) this.context.close();
  }
}
