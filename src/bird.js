// Yeniden Tasarlanmış Martı Karakteri: Sürekli Kanat Çırpışı, Squash & Stretch, Göz Kırpma ve İnterpolasyon
import { CONFIG } from './config.js';
import { lerp } from './util/math.js';

export class Bird {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = CONFIG.BIRD_X;
    this.y = CONFIG.CANVAS_HEIGHT * 0.42;
    this.prevY = this.y;

    this.vy = 0;
    this.rotation = 0;
    this.prevRotation = 0;

    // Sürekli Kanat Animasyonu
    this.wingPhase = 0;
    this.wingFreq = 7; // Kanat çırpış frekansı
    this.isFlapping = false;

    // Squash & Stretch
    this.scaleX = 1.0;
    this.scaleY = 1.0;

    // Yüz & Bakış
    this.blinkTimer = 2.5 + Math.random() * 2;
    this.isBlinking = false;
    this.hasSimitInBeak = true;

    // Menü Süzülüşü
    this.hoverTimer = 0;
    this.dead = false;
    this.hitGround = false;

    // Uzaktaki Martı Sürüsü (Parallax V-formasyonu)
    this.distantFlock = [
      { x: 40,  y: 95,  size: 5.5, phase: 0 },
      { x: 65,  y: 110, size: 4.8, phase: 0.8 },
      { x: 90,  y: 125, size: 4.2, phase: 1.5 },
      { x: 115, y: 140, size: 3.6, phase: 2.2 }
    ];
  }

  // Kanat çırpma
  flap() {
    this.vy = CONFIG.FLAP_VELOCITY;
    this.isFlapping = true;
    this.wingFreq = 16; // Hızlı çırpış

    // Flap anında dikey uzama (squash & stretch)
    this.scaleX = 0.86;
    this.scaleY = 1.18;
  }

  // Menü modunda süzülme
  updateHover(dt) {
    this.prevY = this.y;
    this.prevRotation = this.rotation;

    this.hoverTimer += dt * 3.2;
    this.y = (CONFIG.CANVAS_HEIGHT * 0.42) + Math.sin(this.hoverTimer) * 8.5;
    this.rotation = Math.sin(this.hoverTimer) * 0.06;

    // Kanat yavaşça süzülür
    this.wingPhase += dt * 5.0;
    this.updateBlink(dt);
    this.updateDistantFlock(dt);
    this.updateSprings(dt);
  }

  // Oyun içi fizik
  update(dt) {
    this.prevY = this.y;
    this.prevRotation = this.rotation;

    // Yerçekimi
    this.vy += CONFIG.GRAVITY * dt;
    if (this.vy > CONFIG.MAX_FALL_SPEED) {
      this.vy = CONFIG.MAX_FALL_SPEED;
    }

    this.y += this.vy * dt;

    // Tavan kontrolü
    if (this.y < CONFIG.BIRD_RADIUS) {
      this.y = CONFIG.BIRD_RADIUS;
      if (this.vy < 0) this.vy = 0;
    }

    // Eğim hesaplama
    if (this.vy < 0) {
      this.rotation = Math.max(CONFIG.TILT_MIN, this.rotation - CONFIG.TILT_UP_SPEED * dt);
    } else {
      this.rotation = Math.min(CONFIG.TILT_MAX, this.rotation + CONFIG.TILT_DOWN_SPEED * dt);
    }

    // Kanat animasyon frekansı (yukarı çıkarken hızlı, dalışta süzülme)
    if (this.vy < 0) {
      this.wingFreq = 15;
    } else {
      this.wingFreq = Math.max(4.5, 12 - (this.vy / 80));
    }
    this.wingPhase += dt * this.wingFreq;

    this.updateBlink(dt);
    this.updateDistantFlock(dt);
    this.updateSprings(dt);
  }

  // Ölüm anı
  updateDying(dt) {
    this.prevY = this.y;
    this.prevRotation = this.rotation;

    this.vy += CONFIG.GRAVITY * dt * 1.25;
    this.y += this.vy * dt;
    this.rotation = Math.min(Math.PI / 2, this.rotation + 9 * dt);

    const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT - CONFIG.BIRD_RADIUS;
    if (this.y >= groundY) {
      this.y = groundY;
      this.hitGround = true;
    }
  }

  // Squash & Stretch yay sönümlemesi
  updateSprings(dt) {
    this.scaleX += (1.0 - this.scaleX) * Math.min(1, dt * 12);
    this.scaleY += (1.0 - this.scaleY) * Math.min(1, dt * 12);
  }

  // Göz kırpma döngüsü
  updateBlink(dt) {
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer < -0.14) {
        this.isBlinking = false;
        this.blinkTimer = 2.5 + Math.random() * 3.5;
      }
    }
  }

  // Uzaktaki martı sürüsünün gökyüzünde süzülüşü
  updateDistantFlock(dt) {
    for (const b of this.distantFlock) {
      b.x -= 22 * dt;
      b.phase += dt * 6.5;
      if (b.x < -30) {
        b.x = CONFIG.CANVAS_WIDTH + 40 + Math.random() * 50;
      }
    }
  }

  // Uzaktaki martı sürüsünü çiz (Arka plan katmanında çağrılır)
  drawDistantFlock(ctx) {
    ctx.save();
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 1.2;

    for (const b of this.distantFlock) {
      const wingY = Math.sin(b.phase) * (b.size * 0.7);
      ctx.beginPath();
      // Klasik "V" şeklinde uzaktaki martı
      ctx.moveTo(b.x - b.size, b.y + wingY);
      ctx.quadraticCurveTo(b.x - b.size * 0.4, b.y - b.size * 0.4, b.x, b.y);
      ctx.quadraticCurveTo(b.x + b.size * 0.4, b.y - b.size * 0.4, b.x + b.size, b.y + wingY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Martı Çizimi (İnterpolasyonlu)
  draw(ctx, alpha = 1.0) {
    const renderY = lerp(this.prevY, this.y, alpha);
    const renderRot = lerp(this.prevRotation, this.rotation, alpha);

    ctx.save();
    ctx.translate(this.x, renderY);
    ctx.rotate(renderRot);
    ctx.scale(this.scaleX, this.scaleY);

    // Hitbox Debug
    if (CONFIG.DEBUG_HITBOXES) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, CONFIG.BIRD_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    }

    // --- 1. KUYRUK TÜYLERİ ---
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-18, 2);
    ctx.lineTo(-30, -4);
    ctx.lineTo(-26, 7);
    ctx.closePath();
    ctx.fill();

    // --- 2. MARTI BEYAZ GÖVDESİ ---
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-2, 2, 17, 11, -0.06, 0, Math.PI * 2);
    ctx.fill();

    // Göğüs gölgesi
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(-3, 6, 12, 6, 0.1, 0, Math.PI);
    ctx.fill();

    // --- 3. İKİ SEGMENTLİ ORGANİK KANAT ---
    // Kanat açısı sinüs dalgasıyla -1 ile +1 arasında yumuşakça salınır
    const wingSine = Math.sin(this.wingPhase);
    const innerAngle = wingSine * 0.55; // İç kanat açısı
    const outerAngle = Math.sin(this.wingPhase - 0.45) * 0.85; // Dış kanat gecikmeli kırbaç hareketi

    ctx.save();
    ctx.translate(-3, 1);
    ctx.rotate(innerAngle);

    // İç kanat segmenti (Gri)
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-6, -14, -2, -18);
    ctx.lineTo(8, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dış kanat segmenti (İç kanadın ucundan başlar)
    ctx.save();
    ctx.translate(-2, -18);
    ctx.rotate(outerAngle * 0.7);

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4, -12, 2, -14);
    ctx.lineTo(5, 2);
    ctx.closePath();
    ctx.fill();

    // Siyah uç tüyleri
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(2, -14);
    ctx.lineTo(5, -6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.restore();

    // --- 4. KAFA VE YÜZ ---
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(12, -4, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Göz (Göz Kırpma veya Çarpışmada "X" Ölüm Gözü)
    if (this.dead) {
      // Çarpışma gözü (X)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(12, -8); ctx.lineTo(16, -4);
      ctx.moveTo(16, -8); ctx.lineTo(12, -4);
      ctx.stroke();
    } else if (this.isBlinking) {
      // Göz kırpma çizgisi
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, -6);
      ctx.lineTo(16, -6);
      ctx.stroke();
    } else {
      // Normal parlayan canlı göz
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(14, -6, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(14.8, -6, 1.3, 0, Math.PI * 2);
      ctx.fill();
      // Işık parıltısı
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(14.2, -6.6, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gaga (Sarı-Turuncu + Martı Kırmızı Lekesi)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(18, -6);
    ctx.lineTo(27, -2);
    ctx.lineTo(17, 0);
    ctx.closePath();
    ctx.fill();

    // Kırmızı gaga lekesi
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(22.5, -2, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // --- 5. GAGADA SALLANAN SİMİT ---
    if (this.hasSimitInBeak) {
      ctx.save();
      const simitSwing = Math.sin(this.wingPhase * 0.8) * 0.25;
      ctx.translate(22, 6);
      ctx.rotate(simitSwing);

      ctx.strokeStyle = '#b45309';
      ctx.fillStyle = '#d97706';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Susamlar
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-2, -3, 1, 1);
      ctx.fillRect(2, -1, 1, 1);
      ctx.fillRect(-1, 3, 1, 1);
      ctx.restore();
    }

    ctx.restore();
  }
}
