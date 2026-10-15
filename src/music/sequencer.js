// Müzik İleriye Bakan Zamanlayıcı (Look-ahead Sequencer) ve Beste Yöneticisi
import { HICAZ_SCALE, getHicazFrequency, AKSAK_9_8 } from './theory.js';
import { InstrumentBank } from './instruments.js';
import { AmbienceEngine } from './ambience.js';

export class MusicDirector {
  constructor(audioCtx, musicMasterGain) {
    this.ctx = audioCtx;
    this.gainNode = musicMasterGain;
    this.instruments = new InstrumentBank(audioCtx, musicMasterGain);
    this.ambience = new AmbienceEngine(audioCtx, musicMasterGain);

    this.mode = 'MENU'; // 'MENU' | 'PLAYING' | 'DYING' | 'PAUSED'
    this.isPlaying = false;
    this.isMusicMuted = false;

    // Tempo ve Zamanlama
    this.bpm = 110;
    this.score = 0;
    this.nextNoteTime = 0;
    this.currentStep = 0; // 9/8 vuruş adımı
    this.timerId = null;

    // Ney taksimi durumu (Menü modu)
    this.taksimTimer = 0;
    this.taksimNotes = [1, 2, 3, 4, 3, 2, 1, -1, 1, 4, 5, 4, 3, 2, 1]; // Hicaz seyir
    this.taksimIndex = 0;

    // Oyun melodisi motifleri (Saz 9/8 kalıpları)
    this.gameMelody = [
      1, 3, 4, 5, 4, 3, 2, 1, // Motif 1 (Giriş)
      4, 5, 6, 7, 6, 5, 4, 3, // Motif 2 (Yükseliş)
      5, 7, 8, 7, 6, 5, 4, 3, // Motif 3 (Tiz zirve)
      4, 3, 2, 1, -1, 1, 1, 1  // Motif 4 (Karar Re)
    ];
    this.melodyIndex = 0;
  }

  init() {
    this.ambience.startSeaWaves();
    this.instruments.startDrone();
    this.startScheduler();
  }

  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.isMusicMuted ? 0.0001 : 0.45, this.ctx.currentTime);
    }
    return this.isMusicMuted;
  }

  setMode(mode, score = 0) {
    this.mode = mode;
    this.score = score;

    if (mode === 'PLAYING') {
      // Skora göre dinamik tempo artışı
      this.bpm = Math.min(132, 110 + score * 0.8);
    } else if (mode === 'DYING') {
      this.bpm = 70; // Yavaşlayan son vuruşlar
      // Ney ile hüzünlü karar sesi
      this.instruments.playNey(getHicazFrequency(1), 1.8, this.ctx.currentTime);
    } else if (mode === 'MENU') {
      this.bpm = 100;
      this.taksimIndex = 0;
    }
  }

  update(dt) {
    this.ambience.update(dt);
  }

  startScheduler() {
    if (this.timerId) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;

    // 25 ms aralıklarla gelecekteki 120 ms'yi zamanla
    this.timerId = setInterval(() => {
      if (this.ctx && this.ctx.state === 'running') {
        while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
          this.scheduleNextEvents(this.nextNoteTime);
          this.advanceStep();
        }
      }
    }, 25);
  }

  // Bir sonraki vuruş ve melodiyi zamanla
  scheduleNextEvents(time) {
    if (this.mode === 'MENU') {
      // Menüde Serbest Ney Taksimi (Her ~1.2 saniyede bir dökülen nağmeler)
      if (this.currentStep % 6 === 0) {
        const degree = this.taksimNotes[this.taksimIndex % this.taksimNotes.length];
        const nextDegree = this.taksimNotes[(this.taksimIndex + 1) % this.taksimNotes.length];
        const f1 = getHicazFrequency(degree);
        const f2 = getHicazFrequency(nextDegree);
        this.instruments.playNey(f1, 1.3, time, f2);
        this.taksimIndex++;
      }
    } else if (this.mode === 'PLAYING') {
      // 1. Darbuka 9/8 Aksak Kalıbı
      const beatInfo = AKSAK_9_8.find(b => b.beat === this.currentStep);
      if (beatInfo) {
        this.instruments.playDarbuka(beatInfo.type, beatInfo.accent, time);
      }

      // 2. Saz Melodisi (Her 2 sekizlikte ve aksak vuruşlarda)
      if (this.currentStep === 0 || this.currentStep === 2 || this.currentStep === 4 || this.currentStep === 6 || this.currentStep === 7) {
        const deg = this.gameMelody[this.melodyIndex % this.gameMelody.length];
        const freq = getHicazFrequency(deg);
        this.instruments.playSaz(freq, time, 0.24);
        this.melodyIndex++;
      }
    }
  }

  // Zaman adımı ilerletme (9/8 usul 9 sekizlikten oluşur: step 0 to 8)
  advanceStep() {
    const eighthNoteDuration = (60 / this.bpm) * 0.5; // Sekizlik nota süresi
    this.nextNoteTime += eighthNoteDuration;
    this.currentStep = (this.currentStep + 1) % 9;
  }
}
