// Giriş Noktası: Sabit Zaman Adımlı (Fixed Timestep) ve Render İnterpolasyonlu Oyun Döngüsü
import { CONFIG } from './config.js';
import { Game } from './game.js';
import { InputHandler } from './input.js';
import { Audio } from './audio.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new Game(canvas);

  // REA ve Geliştirici Konsolu İçin Global Nesneler
  window.__MARTI_GAME__ = game;
  window.__CONFIG__ = CONFIG;

  // Retina / HiDPI Canvas Ölçekleme
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = CONFIG.CANVAS_WIDTH * dpr;
    canvas.height = CONFIG.CANVAS_HEIGHT * dpr;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // İlk kullanıcı etkileşiminde ses motorunu uyandır ve menü ney taksimini başlat
  const unlockAudio = async () => {
    await Audio.init();
    if (game.state === 'MENU') {
      Audio.setGameMode('MENU', 0);
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  // Girdi Dinleyicisi
  new InputHandler(
    canvas,
    () => game.handleAction(),
    (force) => game.togglePause(force),
    () => game.toggleMute(),
    () => game.toggleMusic(),
    () => game.toggleDebug(),
    () => game.toggleBot()
  );

  // Sabit Zaman Adımlı Döngü + Render İnterpolasyonu (60 Hz Mantık, 120+ Hz Akıcı Çizim)
  const FIXED_STEP = 1 / 60; // 0.01666s
  let lastTime = performance.now();
  let accumulator = 0;

  function loop(currentTime) {
    let frameTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (frameTime > 0.1) frameTime = 0.1;

    accumulator += frameTime;

    while (accumulator >= FIXED_STEP) {
      game.update(FIXED_STEP);
      accumulator -= FIXED_STEP;
    }

    // Sub-frame interpolasyon faktörü (0.0 <= alpha < 1.0)
    const alpha = accumulator / FIXED_STEP;
    game.render(alpha);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
