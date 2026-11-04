/**
 * Background Audio Player
 * Song: "Hoy es mi cumpleaños" - Los Titanes de Durango
 *
 * Sources:
 * 1. Local bundled copy: /audio/hoy-es-mi-cumpleanos.mp3
 * 2. Remote direct raw link: https://www.dropbox.com/scl/fi/gxpmufvs9dzube4lkodtw/Hoy-es-mi-cumplea-os-Los-Titanes-de-Durango-Letra.mp3?rlkey=lcx7auljavpcxaj9eucft0dx0&st=194yep9y&raw=1
 * 3. Fallback: Procedural Web Audio synth
 */

export const SONG_INFO = {
  title: 'Hoy es mi cumpleaños',
  artist: 'Los Titanes de Durango',
  dropboxUrl: 'https://www.dropbox.com/scl/fi/gxpmufvs9dzube4lkodtw/Hoy-es-mi-cumplea-os-Los-Titanes-de-Durango-Letra.mp3?rlkey=lcx7auljavpcxaj9eucft0dx0&st=194yep9y&raw=1',
  localUrl: '/audio/hoy-es-mi-cumpleanos.mp3',
};

type AudioStateListener = (state: { isPlaying: boolean; isMuted: boolean }) => void;

class BackgroundAudioManager {
  private audio: HTMLAudioElement | null = null;
  private isMuted: boolean = true;
  private isPlaying: boolean = false;
  private targetVolume: number = 0.75;
  private currentVolume: number = 0;
  private fadeTimer: number | null = null;
  private listeners: Set<AudioStateListener> = new Set();
  
  // Web Audio Procedural Fallback
  private synthCtx: AudioContext | null = null;
  private synthGain: GainNode | null = null;
  private synthOscillators: OscillatorNode[] = [];
  private isSynthRunning: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (this.audio) return;
    try {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.preload = 'auto';
      this.audio.volume = 0;

      // Primary source: local fast MP3
      const sourceLocal = document.createElement('source');
      sourceLocal.src = SONG_INFO.localUrl;
      sourceLocal.type = 'audio/mpeg';
      this.audio.appendChild(sourceLocal);

      // Secondary fallback source: Dropbox direct stream
      const sourceDropbox = document.createElement('source');
      sourceDropbox.src = SONG_INFO.dropboxUrl;
      sourceDropbox.type = 'audio/mpeg';
      this.audio.appendChild(sourceDropbox);

      this.setupListeners(this.audio);
    } catch (err) {
      console.warn('Could not initialize audio element:', err);
    }
  }

  private setupListeners(el: HTMLAudioElement) {
    el.addEventListener('play', () => {
      this.isPlaying = true;
      this.notify();
    });

    el.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notify();
    });

    el.addEventListener('ended', () => {
      this.isPlaying = false;
      this.notify();
    });

    el.addEventListener('volumechange', () => {
      this.isMuted = el.muted || el.volume === 0;
      this.notify();
    });

    el.addEventListener('error', (e) => {
      console.warn('Audio element error, falling back to procedural synth:', e);
      if (this.isPlaying && !this.isMuted) {
        this.startProceduralSynth();
      }
    });
  }

  /**
   * Bind an existing DOM <audio> element (e.g. from React ref) to this manager
   */
  public attachElement(el: HTMLAudioElement) {
    if (!el) return;
    if (this.audio && this.audio !== el) {
      try {
        this.audio.pause();
      } catch {
        // ignore
      }
    }
    this.audio = el;
    this.audio.loop = true;
    this.setupListeners(el);
    // synchronize initial state
    this.audio.muted = this.isMuted;
    if (!this.isMuted) {
      this.audio.volume = this.targetVolume;
    }
    this.notify();
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener({ isPlaying: this.isPlaying, isMuted: this.isMuted });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = { isPlaying: this.isPlaying, isMuted: this.isMuted };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // ignore
      }
    });
  }

  /**
   * Start playing music (invoked on user gesture like unsealing the envelope or clicking Play)
   */
  public async play(unmute: boolean = true): Promise<void> {
    if (unmute) {
      this.isMuted = false;
    }

    this.initAudioElement();

    if (this.audio) {
      try {
        this.audio.muted = this.isMuted;
        if (this.audio.volume === 0 && !this.isMuted) {
          this.audio.volume = this.targetVolume;
        }
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        this.isPlaying = true;
        this.fadeIn();
        this.notify();
        return;
      } catch (err) {
        console.warn('HTMLAudio play failed, falling back to Web Audio:', err);
      }
    }

    // Procedural fallback if HTMLAudio blocked
    this.startProceduralSynth();
    this.isPlaying = true;
    this.notify();
  }

  /**
   * Pause music immediately
   */
  public pause(immediate: boolean = true): void {
    if (this.fadeTimer) clearInterval(this.fadeTimer);

    if (immediate) {
      if (this.audio) {
        try {
          this.audio.pause();
        } catch {
          // ignore
        }
      }
      this.stopProceduralSynth();
      this.isPlaying = false;
      this.notify();
      return;
    }

    this.fadeOut(() => {
      if (this.audio) {
        this.audio.pause();
      }
      this.stopProceduralSynth();
      this.isPlaying = false;
      this.notify();
    });
  }

  /**
   * Toggle play / pause state
   */
  public togglePlayPause(): boolean {
    if (this.isPlaying && (this.audio ? !this.audio.paused : true)) {
      this.pause(true);
      return false;
    } else {
      this.play(true);
      return true;
    }
  }

  /**
   * Set mute state directly
   */
  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.muted = muted;
    }

    if (muted) {
      this.fadeOut(() => {
        if (this.audio) {
          this.audio.volume = 0;
        }
        if (this.synthGain) {
          this.synthGain.gain.value = 0;
        }
        this.notify();
      });
    } else {
      if (!this.isPlaying) {
        this.play(false);
      } else {
        if (this.audio && this.audio.paused) {
          this.audio.play().catch(() => this.startProceduralSynth());
        }
        this.fadeIn();
        this.notify();
      }
    }
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): boolean {
    const newMuted = !this.isMuted;
    this.setMute(newMuted);
    return newMuted;
  }

  /**
   * Smooth volume fade in
   */
  private fadeIn(): void {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const step = 0.05;
    const intervalTime = 40;

    this.fadeTimer = window.setInterval(() => {
      if (this.currentVolume < this.targetVolume) {
        this.currentVolume = Math.min(this.targetVolume, this.currentVolume + step);
        if (this.audio && !this.isMuted) {
          this.audio.volume = this.currentVolume;
        }
        if (this.synthGain && this.synthCtx) {
          this.synthGain.gain.setValueAtTime(this.currentVolume * 0.18, this.synthCtx.currentTime);
        }
      } else {
        if (this.fadeTimer) clearInterval(this.fadeTimer);
      }
    }, intervalTime);
  }

  /**
   * Smooth volume fade out
   */
  private fadeOut(onComplete?: () => void): void {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const step = 0.08;
    const intervalTime = 25;

    this.fadeTimer = window.setInterval(() => {
      if (this.currentVolume > 0) {
        this.currentVolume = Math.max(0, this.currentVolume - step);
        if (this.audio) {
          this.audio.volume = this.currentVolume;
        }
        if (this.synthGain && this.synthCtx) {
          this.synthGain.gain.setValueAtTime(this.currentVolume * 0.18, this.synthCtx.currentTime);
        }
      } else {
        if (this.fadeTimer) clearInterval(this.fadeTimer);
        if (onComplete) onComplete();
      }
    }, intervalTime);
  }

  /**
   * Procedural Web Audio Synth fallback
   */
  private startProceduralSynth(): void {
    if (this.isSynthRunning) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      this.synthCtx = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.synthGain = masterGain;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);
      filter.connect(masterGain);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
      lfoGain.gain.setValueAtTime(320, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      const chord = [73.42, 110.0, 146.83, 174.61, 220.0, 261.63];
      this.synthOscillators = [];

      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = i === 0 ? 'sine' : i % 2 === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const voiceVol = i === 0 ? 0.35 : i === 1 ? 0.2 : 0.12;
        oscGain.gain.setValueAtTime(voiceVol, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        this.synthOscillators.push(osc);
      });

      this.isSynthRunning = true;
      this.fadeIn();
    } catch (e) {
      console.warn('Could not start procedural synth:', e);
    }
  }

  private stopProceduralSynth(): void {
    if (!this.isSynthRunning) return;
    this.synthOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.synthOscillators = [];
    if (this.synthCtx && this.synthCtx.state !== 'closed') {
      try {
        this.synthCtx.close();
      } catch {
        // ignore
      }
    }
    this.synthCtx = null;
    this.synthGain = null;
    this.isSynthRunning = false;
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
    };
  }
}

export const backgroundAudio = new BackgroundAudioManager();
