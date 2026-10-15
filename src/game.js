// Oyun Ana Koordinatörü ve Durum Makinesi (v2)
import { CONFIG } from './config.js';
import { Bird } from './bird.js';
import { Background } from './background.js';
import { ObstacleManager } from './obstacles.js';
import { CollisionDetector } from './collision.js';
import { ParticleSystem } from './particles.js';
import { Audio } from './audio.js';
import { Storage } from './storage.js';
import { UIRenderer } from './ui.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.bird = new Bird();
    this.bg = new Background();
    this.obstacles = new ObstacleManager();
    this.particles = new ParticleSystem();
    this.ui = new UIRenderer();

    this.state = 'MENU';
    this.score = 0;
    this.bestScore = Storage.getBestScore();
    this.isNewBest = false;
    this.currentSpeed = CONFIG.PIPE_INITIAL_SPEED;

    this.gameOverLockTimer = 0;
    this.autoBotActive = false;
  }

  restart() {
    this.bird.reset();
    this.obstacles.reset();
    this.particles.reset();
    this.ui.reset();
    this.score = 0;
    this.isNewBest = false;
    this.currentSpeed = CONFIG.PIPE_INITIAL_SPEED;
    this.state = 'PLAYING';

    this.bird.flap();
    Audio.init();
    Audio.setGameMode('PLAYING', 0);
    Audio.playFlap();
  }

  handleAction() {
    if (this.state === 'MENU') {
      Audio.init();
      this.state = 'PLAYING';
      Audio.setGameMode('PLAYING', 0);
      this.bird.flap();
      Audio.playFlap();
    } else if (this.state === 'PLAYING') {
      this.bird.flap();
      this.particles.spawnFlapPuff(this.bird.x, this.bird.y);
      Audio.playFlap();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      Audio.setGameMode('PLAYING', this.score);
    } else if (this.state === 'GAMEOVER') {
      if (this.gameOverLockTimer <= 0) {
        this.restart();
      }
    }
  }

  togglePause(forcePause = false) {
    if (forcePause) {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        Audio.setGameMode('PAUSED', this.score);
      }
      return;
    }

    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      Audio.setGameMode('PAUSED', this.score);
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      Audio.setGameMode('PLAYING', this.score);
    }
  }

  toggleMute() {
    return Audio.toggleMute();
  }

  toggleMusic() {
    return Audio.toggleMusic();
  }

  toggleDebug() {
    CONFIG.DEBUG_HITBOXES = !CONFIG.DEBUG_HITBOXES;
    return CONFIG.DEBUG_HITBOXES;
  }

  toggleBot() {
    this.autoBotActive = !this.autoBotActive;
    return this.autoBotActive;
  }

  // Konsol ve Test Hilesi (Güvenli skor artırma)
  addScore(points = 1, { silent = false } = {}) {
    this.score += points;
    if (!silent) {
      this.ui.triggerScorePop();
      Audio.playScore();
    }
  }

  onScore() {
    this.score += 1;
    this.ui.triggerScorePop();
    Audio.playScore();

    // Hızı kademeli artır
    if (this.currentSpeed < CONFIG.PIPE_MAX_SPEED) {
      this.currentSpeed += CONFIG.PIPE_SPEED_INCREMENT;
    }

    Audio.setGameMode('PLAYING', this.score);
  }

  onBagelCollect(x, y) {
    this.score += CONFIG.BAGEL_POINTS;
    this.ui.triggerScorePop();
    this.particles.spawnBagelSparkles(x, y, 16);
    this.particles.spawnScoreText(x, y, '+5');
    Audio.playBagel();
    Audio.setGameMode('PLAYING', this.score);
  }

  triggerDeath() {
    this.state = 'DYING';
    this.bird.dead = true;

    // Ağzındaki simit ayrı parçacık olarak düşer
    if (this.bird.hasSimitInBeak) {
      this.bird.hasSimitInBeak = false;
      this.particles.spawnDroppedSimit(this.bird.x, this.bird.y);
    }

    this.particles.triggerFlash();
    this.particles.triggerShake();
    this.particles.spawnFeathers(this.bird.x, this.bird.y, 18);

    Audio.setGameMode('DYING', this.score);
    Audio.playHit();
    Audio.playFall();
  }

  update(dt) {
    this.particles.update(dt);
    this.ui.update(dt, this.state, this.score);
    Audio.update(dt);

    if (this.state === 'MENU') {
      this.bird.updateHover(dt);
      this.bg.update(dt, CONFIG.PIPE_INITIAL_SPEED * 0.35, 0);
    } else if (this.state === 'PLAYING') {
      if (this.autoBotActive) {
        this.runAutoPilotBot();
      }

      this.bird.update(dt);
      this.bg.update(dt, this.currentSpeed, this.score);

      // Engeller (Skora göre daralma parametresi aktarıldı)
      this.obstacles.update(
        dt,
        this.currentSpeed,
        () => this.onScore(),
        (bx, by) => this.onBagelCollect(bx, by),
        this.bird,
        this.score
      );

      // Çarpışma
      if (CollisionDetector.checkCollision(this.bird, this.obstacles)) {
        this.triggerDeath();
      }
    } else if (this.state === 'DYING') {
      this.bird.updateDying(dt);
      if (this.bird.hitGround) {
        this.state = 'GAMEOVER';
        Audio.setGameMode('MENU', this.score);
        this.gameOverLockTimer = 0.45;
        this.isNewBest = Storage.setBestScore(this.score);
        this.bestScore = Storage.getBestScore();
      }
    } else if (this.state === 'GAMEOVER') {
      if (this.gameOverLockTimer > 0) {
        this.gameOverLockTimer -= dt;
      }
    }
  }

  runAutoPilotBot() {
    const nextPipe = this.obstacles.pipes.find(p => p.x + p.width > this.bird.x - 12);
    let targetY = CONFIG.CANVAS_HEIGHT * 0.45;

    if (nextPipe) {
      targetY = nextPipe.bottomY - (nextPipe.bottomY - nextPipe.topHeight) / 2;
    }

    if (this.bird.y > targetY + 6 && this.bird.vy > -110) {
      this.handleAction();
    }
  }

  // İnterpolasyonlu Render Döngüsü (alpha = 0..1)
  render(alpha = 1.0) {
    this.ctx.save();
    this.particles.applyShake(this.ctx);

    // 1. Arka Plan & Gökyüzü & Kız Kulesi & Vapur & Uzaktaki Martılar
    this.bg.draw(this.ctx, this.bird);

    // 2. Engeller & Simitler
    this.obstacles.draw(this.ctx, alpha);

    // 3. Martı Karakteri (İnterpolasyonlu)
    this.bird.draw(this.ctx, alpha);

    // 4. Parçacıklar & Flaş & Düşen Simit & Yüzen Yazılar
    this.particles.draw(this.ctx);

    // 5. Arayüz
    this.ui.draw(
      this.ctx,
      this.state,
      this.score,
      this.bestScore,
      this.isNewBest,
      Audio.isMuted,
      Audio.music ? Audio.music.isMusicMuted : false,
      this.autoBotActive
    );

    this.ctx.restore();
  }
}
