import { Soundtrack } from './audio.js';
import { readPreference, writePreference } from './preferences.js';

export class MissionAudio extends Soundtrack {
  constructor(storage = null, options = {}) {
    super(storage, options.Context);

    this.settings = {
      musicOn: true,
      effectsOn: true,
      ...readPreference('luna-audio-v2', {}, storage)
    };
    // Older saves may still carry retired narration preferences.
    for (const key of ['voiceOn', 'voiceVolume', 'voiceURI']) delete this.settings[key];

    this.activated = false;
    this.quiet = false;
    this.channel = 'effects';
    this.channels = null;
  }

  activate() {
    this.activated = true;
    return super.activate();
  }

  saveSettings() {
    writePreference('luna-audio-v2', this.settings, this.storage);
  }

  setOption(key, value) {
    this.settings[key] = value;
    this.saveSettings();
    this.applyLevel();
  }

  // Separate music and effects while retaining the original echo.
  createChannels() {
    if (this.channels) return;

    this.channels = {};

    for (const name of ['music', 'effects']) {
      const gain = this.context.createGain();
      const delay = this.context.createDelay(1);
      const echo = this.context.createGain();

      delay.delayTime.value = 0.32;
      echo.gain.value = 0.22;

      gain.connect(this.master);
      delay.connect(echo);
      echo.connect(gain);

      this.channels[name] = { gain, delay };
    }
  }

  applyLevel(quiet = this.quiet) {
    this.quiet = !!quiet;
    if (!this.context || !this.master) return;

    this.createChannels();
    super.applyLevel(this.quiet);

    const now = this.context.currentTime;

    this.channels.music.gain.gain.setTargetAtTime(
      this.settings.musicOn ? 1 : 0,
      now,
      0.12
    );

    this.channels.effects.gain.gain.setTargetAtTime(
      this.settings.effectsOn ? 1 : 0,
      now,
      0.12
    );
  }

  // Original instrument sound, routed through the selected channel.
  tone(midi, at, duration = 0.4, level = 0.15, type = 'sine', detune = 0) {
    const enabled = this.channel === 'music'
      ? this.settings.musicOn
      : this.settings.effectsOn;

    if (
      !enabled || !this.context || this.activeVoices >= 64 ||
      this.muted || this.hidden
    ) return;

    this.createChannels();

    const output = this.channels[this.channel];
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    osc.detune.value = detune;

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, level), at + 0.035
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

    osc.connect(gain);
    gain.connect(output.gain);
    gain.connect(output.delay);

    this.activeVoices++;
    this.nodes.add(osc);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      this.activeVoices--;
      this.nodes.delete(osc);
    };

    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  // Weather ambience on the effects channel: wind and rain are filtered noise loops, solar storms add
  // Geiger-counter clicks, thunder is a low noise burst. Levels: 0 (off) to 1.
  setAmbience({ wind = 0, rain = 0, geiger = 0 } = {}, dt = 0) {
    if (!this.context || !this.channels || this.context.state !== 'running') return;
    const ctx = this.context, now = ctx.currentTime;
    if (!this.ambience) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), data = buffer.getChannelData(0);
      let brown = 0; for (let i = 0; i < data.length; i++) { const white = Math.random() * 2 - 1; brown = (brown + .02 * white) / 1.02; data[i] = i % 2 ? brown * 3.5 : white * .5; }
      const loop = (filterType, frequency) => { const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(); source.buffer = buffer; source.loop = true; filter.type = filterType; filter.frequency.value = frequency; gain.gain.value = 0; source.connect(filter); filter.connect(gain); gain.connect(this.channels.effects.gain); source.start(); this.nodes.add(source); return { source, filter, gain }; };
      this.ambience = { buffer, wind: loop('lowpass', 420), rain: loop('highpass', 2600), phase: 0 };
    }
    const a = this.ambience, on = this.settings.effectsOn && !this.muted && !this.hidden;
    a.phase += dt;
    a.wind.gain.gain.setTargetAtTime(on ? wind * (.16 + .06 * Math.sin(a.phase * .7)) : 0, now, .6);
    a.wind.filter.frequency.setTargetAtTime(260 + wind * 520 + 140 * Math.sin(a.phase * .37), now, .8);
    a.rain.gain.gain.setTargetAtTime(on ? rain * .09 : 0, now, .5);
    if (on && geiger > 0 && Math.random() < geiger * dt * 9) {
      const previous = this.channel; this.channel = 'effects';
      try { this.tone(96 + Math.floor(Math.random() * 6), now, .025, .09, 'square'); } finally { this.channel = previous; }
    }
  }
  thunder(strength = 1) {
    if (!this.ambience || !this.settings.effectsOn || this.muted || this.hidden) return;
    const ctx = this.context, now = ctx.currentTime, source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = this.ambience.buffer; filter.type = 'lowpass'; filter.frequency.value = 140;
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.45 * strength, now + .08); gain.gain.exponentialRampToValueAtTime(.0001, now + 3.2);
    source.connect(filter); filter.connect(gain); gain.connect(this.channels.effects.gain); source.start(now + .6 + Math.random()); source.stop(now + 4.2);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }

  // Resume the original composition from audio.js.
  update(state, life, held = false) {
    const previous = this.channel;
    this.channel = 'music';

    try {
      super.update(state, life, held);
    } finally {
      this.channel = previous;
    }
  }

  cue(name) {
    if (!this.settings.effectsOn) return;

    const previous = this.channel;
    this.channel = 'effects';

    try {
      super.cue(name);
    } finally {
      this.channel = previous;
    }
  }

  updateFlight(flight, held = false) {
    if (held) {
      this.update({
        status: 'opening',
        rover: { occupied: false },
        moving: false
      }, null, true);
    } else {
      super.updateFlight(flight);
    }
  }

}