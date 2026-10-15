// Birleşik Girdi Yöneticisi: Klavye, Dokunmatik Ekran, Fare ve Müzik Kısayolları (input.js)
export class InputHandler {
  constructor(canvas, onAction, onPause, onMute, onMusicToggle, onDebugToggle, onBotToggle) {
    this.canvas = canvas;
    this.onAction = onAction;
    this.onPause = onPause;
    this.onMute = onMute;
    this.onMusicToggle = onMusicToggle;
    this.onDebugToggle = onDebugToggle;
    this.onBotToggle = onBotToggle;

    this.init();
  }

  init() {
    // 1. POINTER (Fare Tıklaması ve Dokunmatik Ekran)
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onAction();
    });

    // 2. KLAVYE
    window.addEventListener('keydown', (e) => {
      // Space veya Yukarı Ok: Kanat çırp / Başla
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.onAction();
      }
      // P veya Esc: Duraklat
      else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        this.onPause();
      }
      // M: Tüm Sesi Aç/Kapat
      else if (e.code === 'KeyM') {
        e.preventDefault();
        this.onMute();
      }
      // N: Sadece Müziği Aç/Kapat
      else if (e.code === 'KeyN') {
        e.preventDefault();
        this.onMusicToggle();
      }
      // H: Debug Hitboxlarını Göster
      else if (e.code === 'KeyH') {
        e.preventDefault();
        this.onDebugToggle();
      }
      // B: Otomatik Pilot Botunu Aç/Kapat
      else if (e.code === 'KeyB') {
        e.preventDefault();
        this.onBotToggle();
      }
    });

    // Sekme arka plana geçince otomatik duraklat
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.onPause) {
        this.onPause(true);
      }
    });
  }
}
