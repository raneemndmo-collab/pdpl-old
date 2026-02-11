/**
 * Sound Manager for Smart Rasid Console
 * Uses Web Audio API to generate cyber-themed sound effects
 * No external audio files needed - all sounds are synthesized
 */

class SoundManager {
  private audioContext: AudioContext | null = null;
  private _muted: boolean = false;
  private _volume: number = 0.3;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load preferences from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rasid-sound-prefs");
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          this._muted = prefs.muted ?? false;
          this._volume = prefs.volume ?? 0.3;
        } catch {}
      }
    }
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  private savePrefs() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "rasid-sound-prefs",
        JSON.stringify({ muted: this._muted, volume: this._volume })
      );
    }
    this.listeners.forEach((fn) => fn());
  }

  get muted() {
    return this._muted;
  }

  get volume() {
    return this._volume;
  }

  setMuted(muted: boolean) {
    this._muted = muted;
    this.savePrefs();
  }

  setVolume(volume: number) {
    this._volume = Math.max(0, Math.min(1, volume));
    this.savePrefs();
  }

  toggleMute() {
    this._muted = !this._muted;
    this.savePrefs();
    return this._muted;
  }

  onChange(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ─── Typing Sound (keyboard click) ─────────────────────────
  playTyping() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "highpass";
      filter.frequency.value = 2000;

      osc.type = "square";
      osc.frequency.value = 3500 + Math.random() * 1500;

      gain.gain.setValueAtTime(this._volume * 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  // ─── Message Received (notification ping) ──────────────────
  playMessageReceived() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(this._volume * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  // ─── Alert Sound (critical finding) ────────────────────────
  playAlert() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();

      // Two-tone alert
      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.value = i === 0 ? 800 : 600;

        const start = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(this._volume * 0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.12);
      }
    } catch {}
  }

  // ─── Success Sound (task completed) ────────────────────────
  playSuccess() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const notes = [523, 659, 784]; // C5, E5, G5

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        const start = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(this._volume * 0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {}
  }

  // ─── Send Message (whoosh) ─────────────────────────────────
  playSend() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(this._volume * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  // ─── Thinking/Processing (subtle beep loop) ───────────────
  playThinking() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = 440;

      gain.gain.setValueAtTime(this._volume * 0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  // ─── Tool Activation (digital blip) ───────────────────────
  playToolActivation() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.frequency.value = 1500;
      filter.Q.value = 5;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(this._volume * 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  // ─── Welcome Greeting (warm chime) ────────────────────────
  playGreeting() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        const start = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(this._volume * 0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch {}
  }

  // ─── Error Sound ──────────────────────────────────────────
  playError() {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(this._volume * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }
}

// Singleton instance
export const soundManager = new SoundManager();
