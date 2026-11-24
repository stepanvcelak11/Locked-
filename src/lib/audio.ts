/**
 * Synthesised sound engine (Web Audio API) — no audio files are downloaded.
 * Every effect is built from oscillators + filtered noise bursts.
 */
type Ctx = AudioContext;

class SoundEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private scratchSrc: AudioBufferSourceNode | null = null;
  private scratchGain: GainNode | null = null;
  private scratchFilter: BiquadFilterNode | null = null;
  private creakOsc: OscillatorNode | null = null;
  private creakGain: GainNode | null = null;
  enabled = true;
  volume = 0.8;

  private ensure(): Ctx | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Call from a user gesture to unlock audio on iOS. */
  unlock() {
    this.ensure();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (!v) {
      this.scratch(0);
      this.creak(0);
    }
  }

  private noiseBurst(opts: {
    t?: number;
    dur: number;
    freq: number;
    q?: number;
    type?: BiquadFilterType;
    gain: number;
    attack?: number;
  }) {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuf) return;
    const t0 = ctx.currentTime + (opts.t ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? 'bandpass';
    f.frequency.value = opts.freq;
    f.Q.value = opts.q ?? 1;
    const g = ctx.createGain();
    const a = opts.attack ?? 0.001;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.gain), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + opts.dur + 0.05);
  }

  private tone(opts: {
    t?: number;
    freq: number;
    dur: number;
    gain: number;
    type?: OscillatorType;
    endFreq?: number;
    attack?: number;
  }) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (opts.t ?? 0);
    const o = ctx.createOscillator();
    o.type = opts.type ?? 'sine';
    o.frequency.setValueAtTime(opts.freq, t0);
    if (opts.endFreq) o.frequency.exponentialRampToValueAtTime(opts.endFreq, t0 + opts.dur);
    const g = ctx.createGain();
    const a = opts.attack ?? 0.002;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.gain), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + opts.dur + 0.05);
  }

  /** Crisp metallic click — driver pin dropping onto the plug at the shear line. */
  pinSet(intensity = 1) {
    const v = 0.55 * intensity;
    this.noiseBurst({ dur: 0.035, freq: 4200, q: 3, gain: v });
    this.noiseBurst({ dur: 0.02, freq: 9000, q: 2, gain: v * 0.5 });
    this.tone({ freq: 3150 + Math.random() * 300, dur: 0.06, gain: v * 0.25, type: 'triangle' });
    this.tone({ freq: 5400 + Math.random() * 300, dur: 0.04, gain: v * 0.12 });
  }

  /** Tiny click of a serration catching on the shear line. */
  serration() {
    this.noiseBurst({ dur: 0.018, freq: 6500, q: 4, gain: 0.18 });
    this.tone({ freq: 4600 + Math.random() * 500, dur: 0.025, gain: 0.05 });
  }

  /** Light tick when the pick touches a springy pin. */
  touch(strength = 0.5) {
    this.noiseBurst({ dur: 0.012, freq: 7000, q: 2, gain: 0.05 + 0.08 * strength });
  }

  /** Deep clunk of the plug rotating into a spool's waist. */
  falseSet() {
    this.noiseBurst({ dur: 0.09, freq: 900, q: 1.2, type: 'lowpass', gain: 0.6 });
    this.tone({ freq: 420, endFreq: 260, dur: 0.12, gain: 0.25, type: 'triangle' });
    this.noiseBurst({ t: 0.01, dur: 0.03, freq: 3200, q: 2, gain: 0.25 });
  }

  /** Dull thunk — key pin jammed in the shell. */
  overset() {
    this.noiseBurst({ dur: 0.06, freq: 500, q: 0.8, type: 'lowpass', gain: 0.45 });
    this.tone({ freq: 180, endFreq: 120, dur: 0.1, gain: 0.25 });
  }

  /** Rattle of all pins dropping when tension is released. */
  reset() {
    for (let i = 0; i < 6; i++) {
      const t = i * 0.022 + Math.random() * 0.01;
      this.noiseBurst({ t, dur: 0.02, freq: 3500 + Math.random() * 3000, q: 3, gain: 0.12 + Math.random() * 0.1 });
    }
  }

  /** Big shackle clack + metallic ring when the lock opens. */
  open() {
    this.noiseBurst({ dur: 0.05, freq: 2500, q: 0.8, gain: 0.9 });
    this.noiseBurst({ t: 0.06, dur: 0.07, freq: 1800, q: 0.9, gain: 0.7 });
    const partials = [1180, 2730, 4120, 5650];
    partials.forEach((f, i) => this.tone({ t: 0.06, freq: f, dur: 0.5 - i * 0.08, gain: 0.16 / (i + 1), type: 'sine' }));
    this.tone({ t: 0.06, freq: 220, endFreq: 140, dur: 0.15, gain: 0.3, type: 'triangle' });
  }

  /** Continuous scraping noise, level 0..1 (0 stops it). */
  scratch(level: number) {
    const ctx = level > 0 ? this.ensure() : this.ctx;
    if (!ctx || !this.master || !this.noiseBuf) return;
    if (!this.scratchSrc && level > 0) {
      this.scratchSrc = ctx.createBufferSource();
      this.scratchSrc.buffer = this.noiseBuf;
      this.scratchSrc.loop = true;
      this.scratchFilter = ctx.createBiquadFilter();
      this.scratchFilter.type = 'bandpass';
      this.scratchFilter.frequency.value = 5200;
      this.scratchFilter.Q.value = 1.4;
      this.scratchGain = ctx.createGain();
      this.scratchGain.gain.value = 0;
      this.scratchSrc.connect(this.scratchFilter).connect(this.scratchGain).connect(this.master);
      this.scratchSrc.start();
    }
    if (this.scratchGain && this.scratchFilter) {
      const t = ctx.currentTime;
      this.scratchGain.gain.setTargetAtTime(Math.min(0.12, level * 0.12), t, 0.03);
      this.scratchFilter.frequency.setTargetAtTime(4200 + level * 3000, t, 0.05);
    }
  }

  /** Low creak of counter-rotation pushing back on the wrench, level 0..1. */
  creak(level: number) {
    const ctx = level > 0 ? this.ensure() : this.ctx;
    if (!ctx || !this.master) return;
    if (!this.creakOsc && level > 0) {
      this.creakOsc = ctx.createOscillator();
      this.creakOsc.type = 'sawtooth';
      this.creakOsc.frequency.value = 70;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 900;
      f.Q.value = 6;
      this.creakGain = ctx.createGain();
      this.creakGain.gain.value = 0;
      this.creakOsc.connect(f).connect(this.creakGain).connect(this.master);
      this.creakOsc.start();
    }
    if (this.creakGain && this.creakOsc) {
      const t = ctx.currentTime;
      this.creakGain.gain.setTargetAtTime(Math.min(0.08, level * 0.08), t, 0.04);
      this.creakOsc.frequency.setTargetAtTime(55 + level * 40, t, 0.05);
    }
  }

  timerReady() {
    this.tone({ freq: 1320, dur: 0.06, gain: 0.12 });
  }
  timerStart() {
    this.tone({ freq: 880, dur: 0.09, gain: 0.25, type: 'square' });
  }
  timerStop() {
    this.tone({ freq: 1320, dur: 0.07, gain: 0.22, type: 'square' });
    this.tone({ t: 0.08, freq: 990, dur: 0.12, gain: 0.2, type: 'square' });
  }
  split() {
    this.tone({ freq: 1560, dur: 0.07, gain: 0.2, type: 'triangle' });
    this.noiseBurst({ dur: 0.03, freq: 3000, q: 2, gain: 0.2 });
  }
  countdown(final = false) {
    this.tone({ freq: final ? 1760 : 880, dur: final ? 0.18 : 0.08, gain: 0.18, type: 'triangle' });
  }
  correct() {
    this.tone({ freq: 880, dur: 0.08, gain: 0.18, type: 'triangle' });
    this.tone({ t: 0.07, freq: 1320, dur: 0.14, gain: 0.18, type: 'triangle' });
  }
  wrong() {
    this.tone({ freq: 220, endFreq: 150, dur: 0.25, gain: 0.2, type: 'sawtooth' });
  }
  achievement() {
    [784, 988, 1175, 1568].forEach((f, i) => this.tone({ t: i * 0.08, freq: f, dur: 0.25, gain: 0.14, type: 'triangle' }));
  }
}

export const sound = new SoundEngine();
