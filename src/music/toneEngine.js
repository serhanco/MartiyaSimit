// Tone.js Tabanlı Profesyonel Türk Müziği Sentezleyici & Akustik Reverb Motoru
// Hicaz Makamı 9/8 Aksak Ritim & Ney Taksimi

import { HICAZ_SCALE, getHicazFrequency, AKSAK_9_8 } from './theory.js';

export class ToneMusicEngine {
  constructor() {
    this.Tone = typeof window !== 'undefined' ? window.Tone : null;
    this.initialized = false;
    this.mode = 'MENU';
    this.score = 0;
    this.isMuted = false;
    this.isMusicMuted = false;

    // Enstrümanlar & Efektler
    this.reverb = null;
    this.masterFilter = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.neySynth = null;
    this.sazSynth = null;
    this.dumDrum = null;
    this.tekDrum = null;

    // Zamanlayıcı
    this.clockInterval = null;
    this.bpm = 110;
    this.currentStep = 0;
    this.nextStepTime = 0;

    // Melodi İndeksleri
    this.taksimIndex = 0;
    this.taksimNotes = [1, 2, 3, 4, 3, 2, 1, -1, 1, 4, 5, 4, 3, 2, 1];
    this.gameMelody = [
      1, 3, 4, 5, 4, 3, 2, 1,
      4, 5, 6, 7, 6, 5, 4, 3,
      5, 7, 8, 7, 6, 5, 4, 3,
      4, 3, 2, 1, -1, 1, 1, 1
    ];
    this.melodyIndex = 0;
  }

  async init() {
    if (this.initialized) return;
    this.Tone = window.Tone;
    if (!this.Tone) return;

    try {
      await this.Tone.start();

      // 1. Akustik Taş Mekân Reverb'ü (Ayasofya / Mevlevihane tınısı)
      this.reverb = new this.Tone.Reverb({
        decay: 3.5,
        preDelay: 0.04,
        wet: 0.35
      });
      await this.reverb.generate();

      // 2. Dinamik Lowpass Filtresi (Ölümde boğuklaşma için)
      this.masterFilter = new this.Tone.Filter({
        frequency: 18000,
        type: 'lowpass',
        rolloff: -12
      });

      // 3. Kazanç Kanalları (Gain)
      this.musicGain = new this.Tone.Gain(0.48);
      this.sfxGain = new this.Tone.Gain(0.85);

      // Sinyal Yolu: Enstrümanlar -> Reverb -> Filter -> MusicGain -> Tone.Destination
      this.reverb.connect(this.masterFilter);
      this.masterFilter.connect(this.musicGain);
      this.musicGain.connect(this.Tone.getDestination());
      this.sfxGain.connect(this.Tone.getDestination());

      // 4. NEY SENTEZLEYİCİSİ (Hafif vibrato, portamento ve nefes tınısı)
      this.neySynth = new this.Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.12,
          decay: 0.4,
          sustain: 0.8,
          release: 0.9
        },
        filterEnvelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.7,
          release: 0.8,
          baseFrequency: 300,
          octaves: 2.5
        },
        portamento: 0.08 // Notalar arası kayma (slur)
      }).connect(this.reverb);

      // 5. SAZ / BAĞLAMA SENTEZLEYİCİSİ (Karplus-Strong Tel Rezonansı)
      this.sazSynth = new this.Tone.PluckSynth({
        attackNoise: 1.4,
        dampening: 3800,
        resonance: 0.96
      }).connect(this.reverb);

      // 6. DARBUKA DÜM & TEK
      this.dumDrum = new this.Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 3.5,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.002,
          decay: 0.35,
          sustain: 0.01,
          release: 0.4
        }
      }).connect(this.masterFilter);

      this.tekDrum = new this.Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.003,
          decay: 0.06,
          sustain: 0.0
        }
      }).connect(this.reverb);

      this.initialized = true;
      this.startClock();
    } catch (err) {
      console.warn('Tone.js başlatılamadı:', err);
    }
  }

  // Müzik Durumunu Güncelle
  setMode(mode, score = 0) {
    this.mode = mode;
    this.score = score;

    if (!this.initialized) return;

    const now = this.Tone.now();
    if (mode === 'PLAYING') {
      this.bpm = Math.min(132, 110 + score * 0.8);
      this.masterFilter.frequency.rampTo(18000, 0.2, now);
    } else if (mode === 'DYING') {
      // Hüzünlü boğuklaşma
      this.masterFilter.frequency.rampTo(380, 0.35, now);
      // Ney ile karar sesi
      try {
        const kararFreq = getHicazFrequency(1);
        this.neySynth.triggerAttackRelease(kararFreq, 1.8, now);
      } catch {}
    } else if (mode === 'MENU') {
      this.bpm = 100;
      this.masterFilter.frequency.rampTo(18000, 0.3, now);
      this.taksimIndex = 0;
    } else if (mode === 'PAUSED') {
      this.masterFilter.frequency.rampTo(1200, 0.2, now);
    }
  }

  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.musicGain && this.Tone) {
      this.musicGain.gain.rampTo(this.isMusicMuted ? 0.0001 : 0.48, 0.1);
    }
    return this.isMusicMuted;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.Tone) {
      this.Tone.getDestination().mute = this.isMuted;
    }
    return this.isMuted;
  }

  // İleriye Bakan Zamanlayıcı (25 ms döngü)
  startClock() {
    if (this.clockInterval) return;
    this.nextStepTime = this.Tone.now() + 0.1;

    this.clockInterval = setInterval(() => {
      if (!this.initialized || !this.Tone) return;

      const now = this.Tone.now();
      while (this.nextStepTime < now + 0.14) {
        this.scheduleStep(this.nextStepTime);
        const eighthNote = (60 / this.bpm) * 0.5;
        this.nextStepTime += eighthNote;
        this.currentStep = (this.currentStep + 1) % 9;
      }
    }, 25);
  }

  // 9/8 Adım Olayları
  scheduleStep(time) {
    if (this.mode === 'MENU') {
      // Menüde Serbest Ney Taksimi
      if (this.currentStep % 6 === 0) {
        const deg = this.taksimNotes[this.taksimIndex % this.taksimNotes.length];
        const freq = getHicazFrequency(deg);
        try {
          this.neySynth.triggerAttackRelease(freq, 1.2, time);
        } catch {}
        this.taksimIndex++;
      }
    } else if (this.mode === 'PLAYING') {
      // 1. Darbuka 9/8 Aksak Usul Vuruşları
      const beat = AKSAK_9_8.find(b => b.beat === this.currentStep);
      if (beat) {
        try {
          if (beat.type === 'dum') {
            this.dumDrum.triggerAttackRelease('D2', 0.25, time, beat.accent * 0.9);
          } else {
            this.tekDrum.triggerAttackRelease(0.05, time, beat.accent * 0.45);
          }
        } catch {}
      }

      // 2. Saz Melodisi
      if (this.currentStep === 0 || this.currentStep === 2 || this.currentStep === 4 || this.currentStep === 6 || this.currentStep === 7) {
        const deg = this.gameMelody[this.melodyIndex % this.gameMelody.length];
        const freq = getHicazFrequency(deg);
        try {
          this.sazSynth.triggerAttackRelease(freq, 0.4, time, 0.7);
        } catch {}
        this.melodyIndex++;
      }
    }
  }

  // SFX Tetikleyicileri
  playFlap() {
    if (!this.initialized || this.isMuted) return;
    try {
      const synth = new this.Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0.01, release: 0.08 }
      }).connect(this.sfxGain);
      synth.triggerAttackRelease(580, 0.08);
    } catch {}
  }

  playScore() {
    if (!this.initialized || this.isMuted) return;
    try {
      const now = this.Tone.now();
      const synth = new this.Tone.PolySynth(this.Tone.Synth).connect(this.sfxGain);
      synth.triggerAttackRelease(['E5', 'B5'], '16n', now);
    } catch {}
  }

  playBagel() {
    if (!this.initialized || this.isMuted) return;
    try {
      const now = this.Tone.now();
      const notes = ['C5', 'E5', 'G5', 'C6'];
      const synth = new this.Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.15, sustain: 0.0 }
      }).connect(this.sfxGain);

      notes.forEach((n, idx) => {
        synth.triggerAttackRelease(n, 0.12, now + idx * 0.045);
      });
    } catch {}
  }

  playHit() {
    if (!this.initialized || this.isMuted) return;
    try {
      this.dumDrum.triggerAttackRelease('A1', 0.35, this.Tone.now(), 1.0);
    } catch {}
  }
}
