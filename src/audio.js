/* ============================================================
   FIGHTER KONOHA — Audio Manager
   ============================================================ */

import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from './config.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.musicNodes = null;
    this.settings = this.loadSettings();
    this.unlocked = false;
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
    } catch (e) { /* abaikan */ }
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) { /* abaikan */ }
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.settings.master;
    this.master.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.settings.sfx;
    this.sfxGain.connect(this.master);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.settings.music;
    this.musicGain.connect(this.master);

    if (this.settings.musicOn) this.startMusic();
  }

  setMaster(v) { this.settings.master = v; if (this.master) this.master.gain.value = v; this.saveSettings(); }
  setSfx(v)    { this.settings.sfx = v;    if (this.sfxGain) this.sfxGain.gain.value = v; this.saveSettings(); }
  setMusic(v)  { this.settings.music = v;  if (this.musicGain) this.musicGain.gain.value = v; this.saveSettings(); }
  setMusicOn(on) {
    this.settings.musicOn = on;
    this.saveSettings();
    if (!this.ctx) return;
    if (on) this.startMusic(); else this.stopMusic();
  }

  now() { return this.ctx ? this.ctx.currentTime : 0; }

  tone({ freq = 440, dur = 0.15, type = 'square', gain = 0.3, slideTo = null, delay = 0 }) {
    if (!this.ctx) return;
    const t0 = this.now() + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noiseBurst({ dur = 0.12, gain = 0.35, delay = 0, filterFreq = 1200 }) {
    if (!this.ctx) return;
    const t0 = this.now() + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
  }

  hitLight()  { this.noiseBurst({ dur: 0.08, gain: 0.4, filterFreq: 1800 }); this.tone({ freq: 220, dur: 0.08, type: 'square', gain: 0.2 }); }
  hitHeavy()  { this.noiseBurst({ dur: 0.16, gain: 0.5, filterFreq: 900 });  this.tone({ freq: 110, dur: 0.18, type: 'sawtooth', gain: 0.3, slideTo: 60 }); }
  hitBlock()  { this.tone({ freq: 700, dur: 0.06, type: 'square', gain: 0.15 }); this.noiseBurst({ dur: 0.05, gain: 0.2, filterFreq: 3000 }); }
  jump()      { this.tone({ freq: 300, dur: 0.12, type: 'sine', gain: 0.18, slideTo: 500 }); }
  special()   { this.tone({ freq: 500, dur: 0.25, type: 'triangle', gain: 0.22, slideTo: 900 }); }
  ultimate()  {
    this.tone({ freq: 80, dur: 0.6, type: 'sawtooth', gain: 0.35, slideTo: 400 });
    this.noiseBurst({ dur: 0.5, gain: 0.4, filterFreq: 2000, delay: 0.05 });
  }
  ko()        {
    this.tone({ freq: 220, dur: 0.5, type: 'square', gain: 0.3, slideTo: 40 });
    this.tone({ freq: 440, dur: 0.5, type: 'square', gain: 0.2, slideTo: 60, delay: 0.08 });
  }
  clashHit()  { this.tone({ freq: 900, dur: 0.05, type: 'square', gain: 0.25 }); }
  menuClick() { this.tone({ freq: 600, dur: 0.06, type: 'square', gain: 0.18, slideTo: 900 }); }
  menuBack()  { this.tone({ freq: 500, dur: 0.08, type: 'square', gain: 0.15, slideTo: 250 }); }
  roundStart(){ this.tone({ freq: 440, dur: 0.35, type: 'sawtooth', gain: 0.25, slideTo: 880 }); }
  countGauge(){ this.tone({ freq: 350, dur: 0.05, type: 'sine', gain: 0.12 }); }

  startMusic() {
    if (!this.ctx || this.musicNodes) return;
    const notes = [110, 130.81, 146.83, 164.81, 196];
    let i = 0;
    const playStep = () => {
      if (!this.musicNodes) return;
      const freq = notes[i % notes.length];
      i++;
      const t0 = this.now();
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.5, t0 + 0.3);
      g.gain.linearRampToValueAtTime(0, t0 + 1.4);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t0);
      osc.stop(t0 + 1.5);
      this.musicTimer = setTimeout(playStep, 1500);
    };
    this.musicNodes = { active: true };
    playStep();
  }

  stopMusic() {
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.musicTimer = null;
    this.musicNodes = null;
  }
}
