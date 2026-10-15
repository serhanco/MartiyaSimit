// Parçacık efektleri: Tüyler, düşen simit, su sıçramaları, yüzen +5 yazıları ve sönümlenen kamera sarsıntısı
import { CONFIG } from './config.js';

export class ParticleSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.shakeTimer = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.flashTimer = 0;
    this.flashMax = 0;
  }

  // Sönümlenen yumuşak kamera sarsıntısı
  triggerShake(intensity = CONFIG.SHAKE_INTENSITY, duration = CONFIG.SHAKE_DURATION) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  triggerFlash(duration = CONFIG.FLASH_DURATION) {
    this.flashTimer = duration;
    this.flashMax = duration;
  }

  // Çarpışmada etrafa saçılan tüyler
  spawnFeathers(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= CONFIG.MAX_PARTICLES) this.particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 180;
      this.particles.push({
        type: 'feather',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        gravity: 280,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8,
        length: 8 + Math.random() * 6,
        color: Math.random() > 0.35 ? '#ffffff' : '#cbd5e1',
        alpha: 1.0,
        life: 0.9 + Math.random() * 0.4,
        maxLife: 1.3
      });
    }
  }

  // Ölüm anında ağızdan düşüp yuvarlanan simit parçacığı 🥯
  spawnDroppedSimit(x, y) {
    this.particles.push({
      type: 'dropped_simit',
      x: x + 15,
      y: y + 4,
      vx: 60 + Math.random() * 40,
      vy: -140,
      gravity: 580,
      rotation: 0,
      vRot: 12,
      radius: 6,
      alpha: 1.0,
      life: 1.4,
      maxLife: 1.4
    });
  }

  // Simit kapınca yukarı süzülen altın "+5" yazısı
  spawnScoreText(x, y, text = '+5') {
    this.floatingTexts.push({
      x,
      y,
      vy: -45,
      text,
      alpha: 1.0,
      life: 0.85,
      maxLife: 0.85
    });
  }

  spawnFlapPuff(x, y) {
    if (this.particles.length >= CONFIG.MAX_PARTICLES) this.particles.shift();
    this.particles.push({
      type: 'puff',
      x: x - 12,
      y: y + 8,
      vx: -40 - Math.random() * 20,
      vy: 10 + Math.random() * 20,
      gravity: 60,
      radius: 4 + Math.random() * 3,
      alpha: 0.65,
      life: 0.3,
      maxLife: 0.3
    });
  }

  spawnBagelSparkles(x, y, count = 14) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= CONFIG.MAX_PARTICLES) this.particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 130;
      this.particles.push({
        type: 'sparkle',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 140,
        radius: 2 + Math.random() * 2.5,
        color: Math.random() > 0.5 ? '#f59e0b' : '#fef08a',
        alpha: 1.0,
        life: 0.65,
        maxLife: 0.65
      });
    }
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }

    // Parçacıklar
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      if (p.vRot) p.rotation += p.vRot * dt;

      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // Yüzen yazılar
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, ft.life / ft.maxLife);
    }
  }

  // Sönümlenen sinüs dalgalı kamera sarsıntısı
  applyShake(ctx) {
    if (this.shakeTimer > 0 && this.shakeDuration > 0) {
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      const offsetX = Math.sin(this.shakeTimer * 45) * currentIntensity;
      const offsetY = Math.cos(this.shakeTimer * 38) * currentIntensity;
      ctx.translate(offsetX, offsetY);
    }
  }

  draw(ctx) {
    // Parçacıklar
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'feather') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.length, p.length * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dropped_simit') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'puff') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Yüzen +5 Yazıları
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = '900 20px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Flaş
    if (this.flashTimer > 0 && this.flashMax > 0) {
      ctx.save();
      const alpha = Math.min(1, (this.flashTimer / this.flashMax) * 0.85);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      ctx.restore();
    }
  }
}
