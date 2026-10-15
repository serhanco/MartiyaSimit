// localStorage yönetimi: En yüksek skor ve ses ayarları
const STORAGE_KEYS = {
  BEST_SCORE: 'marti_kacisi_best_score',
  MUTED: 'marti_kacisi_muted'
};

export const Storage = {
  getBestScore() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.BEST_SCORE);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },

  setBestScore(score) {
    try {
      const current = this.getBestScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEYS.BEST_SCORE, score.toString());
        return true; // Yeni rekor!
      }
      return false;
    } catch {
      return false;
    }
  },

  isMuted() {
    try {
      return localStorage.getItem(STORAGE_KEYS.MUTED) === 'true';
    } catch {
      return false;
    }
  },

  setMuted(muted) {
    try {
      localStorage.setItem(STORAGE_KEYS.MUTED, muted.toString());
    } catch {
      // sessizce geç
    }
  }
};
