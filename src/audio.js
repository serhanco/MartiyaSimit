// Ana Ses Motoru & Mikser: Tone.js Desteği + Web Audio Geriye Dönük Uyumluluk (audio.js)
import { Storage } from './storage.js';
import { ToneMusicEngine } from './music/toneEngine.js';

class AudioManager {
  constructor() {
    this.toneEngine = new ToneMusicEngine();
    this.isMuted = Storage.isMuted();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    if (typeof window !== 'undefined' && window.Tone) {
      await this.toneEngine.init();
      this.initialized = true;
    }
  }

  // Genel Sesi Aç/Kapat (M tuşu)
  toggleMute() {
    this.isMuted = !this.isMuted;
    Storage.setMuted(this.isMuted);
    if (this.toneEngine) {
      return this.toneEngine.toggleMute();
    }
    return this.isMuted;
  }

  // Sadece Müziği Aç/Kapat (N tuşu)
  toggleMusic() {
    if (!this.initialized) this.init();
    if (this.toneEngine) {
      return this.toneEngine.toggleMusicMute();
    }
    return false;
  }

  // Oyun Durumuna Göre Müzik ve Filtre Modu
  setGameMode(mode, score = 0) {
    if (!this.initialized) this.init();
    if (this.toneEngine) {
      this.toneEngine.setMode(mode, score);
    }
  }

  update(dt) {
    // Tone.js dahili zamanlayıcı kullanır
  }

  // --- OYUN İÇİ SES EFEKTLERİ ---
  playFlap() {
    if (this.isMuted) return;
    if (this.toneEngine && this.toneEngine.initialized) {
      this.toneEngine.playFlap();
    }
  }

  playScore() {
    if (this.isMuted) return;
    if (this.toneEngine && this.toneEngine.initialized) {
      this.toneEngine.playScore();
    }
  }

  playBagel() {
    if (this.isMuted) return;
    if (this.toneEngine && this.toneEngine.initialized) {
      this.toneEngine.playBagel();
    }
  }

  playHit() {
    if (this.isMuted) return;
    if (this.toneEngine && this.toneEngine.initialized) {
      this.toneEngine.playHit();
    }
  }

  playFall() {
    // Hit darbesi yeterli
  }
}

export const Audio = new AudioManager();
