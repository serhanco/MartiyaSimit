// Engeller: Alttan yükselen Kırmızı-Beyaz Deniz Feneri & Üstten sarkan Çelik Köprü Ayağı + Simit Bonusu (v2)
import { CONFIG } from './config.js';
import { lerp } from './util/math.js';

export class ObstacleManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.pipes = [];
    this.bagels = [];
    this.bagelTimer = 0;
    this.lastGapY = CONFIG.CANVAS_HEIGHT * 0.45;
  }

  // Yeni engel çifti üret (Skora göre daralan aralık)
  spawnPipe(x, score = 0) {
    const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT;
    
    // Skora göre dinamik daralan boşluk boyutu (Düzeltildi!)
    const currentGap = Math.round(Math.max(
      CONFIG.PIPE_GAP_MIN,
      CONFIG.PIPE_GAP_START - score * CONFIG.PIPE_GAP_DECREMENT
    ));

    // Boşluk dikey konumu (Önceki engele göre yumuşak varyasyon)
    const minY = CONFIG.PIPE_MIN_TOP_HEIGHT;
    const maxY = groundY - currentGap - CONFIG.PIPE_MIN_TOP_HEIGHT;
    
    let gapY = this.lastGapY + (Math.random() * 2 - 1) * CONFIG.MAX_GAP_VARIATION;
    gapY = Math.round(Math.max(minY, Math.min(maxY, gapY)));
    this.lastGapY = gapY;

    const pipePair = {
      x,
      prevX: x, // İnterpolasyon için
      width: CONFIG.PIPE_WIDTH,
      topHeight: gapY,
      bottomY: gapY + currentGap,
      bottomHeight: groundY - (gapY + currentGap),
      passed: false,
      hasBagel: Math.random() < 0.38
    };

    this.pipes.push(pipePair);

    // Simit ekle
    if (pipePair.hasBagel) {
      this.bagels.push({
        x: x + CONFIG.PIPE_WIDTH / 2,
        prevX: x + CONFIG.PIPE_WIDTH / 2,
        y: gapY + currentGap / 2,
        radius: CONFIG.BAGEL_RADIUS,
        collected: false,
        pulseAngle: Math.random() * Math.PI * 2
      });
    }
  }

  update(dt, speed, onScore, onBagelCollect, bird, score = 0) {
    const W = CONFIG.CANVAS_WIDTH;

    // İlk engel yoksa başlat
    if (this.pipes.length === 0) {
      this.spawnPipe(W + 60, score);
    }

    // Engelleri sola kaydır
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.prevX = p.x;
      p.x -= speed * dt;

      // Skor kontrolü (martı engelin ortasını geçince)
      if (!p.passed && p.x + p.width / 2 < bird.x) {
        p.passed = true;
        onScore();
      }

      // Ekrandan çıkan engelleri sil
      if (p.x + p.width < -25) {
        this.pipes.splice(i, 1);
      }
    }

    // En sağdaki engele göre yeni engel ekleme
    const lastPipe = this.pipes[this.pipes.length - 1];
    if (lastPipe && lastPipe.x < W + 60 - CONFIG.PIPE_INTERVAL_DISTANCE) {
      this.spawnPipe(W + 60, score);
    }

    // Simitleri güncelle
    for (let i = this.bagels.length - 1; i >= 0; i--) {
      const b = this.bagels[i];
      b.prevX = b.x;
      b.x -= speed * dt;
      b.pulseAngle += dt * 5;

      // Kuş simide değdi mi?
      if (!b.collected) {
        const dx = bird.x - b.x;
        const dy = bird.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.BIRD_RADIUS + b.radius) {
          b.collected = true;
          onBagelCollect(b.x, b.y);
          this.bagels.splice(i, 1);
          continue;
        }
      }

      if (b.x < -30) {
        this.bagels.splice(i, 1);
      }
    }
  }

  // Çizim (İnterpolasyonlu)
  draw(ctx, alpha = 1.0) {
    // Engeller
    for (const p of this.pipes) {
      const renderX = lerp(p.prevX, p.x, alpha);
      this.drawTopPipe(ctx, renderX, 0, p.width, p.topHeight);
      this.drawBottomLighthouse(ctx, renderX, p.bottomY, p.width, p.bottomHeight);

      if (CONFIG.DEBUG_HITBOXES) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(renderX, 0, p.width, p.topHeight);
        ctx.strokeRect(renderX, p.bottomY, p.width, p.bottomHeight);
      }
    }

    // Simitler
    for (const b of this.bagels) {
      if (!b.collected) {
        const renderX = lerp(b.prevX, b.x, alpha);
        this.drawBagel(ctx, renderX, b.y + Math.sin(b.pulseAngle) * 3, b.radius);
      }
    }
  }

  // Üst Engel: Perçinli Tarihi Çelik Köprü Ayağı
  drawTopPipe(ctx, x, y, w, h) {
    ctx.save();

    const metalGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    metalGrad.addColorStop(0, '#1e293b');
    metalGrad.addColorStop(0.3, '#334155');
    metalGrad.addColorStop(0.8, '#475569');
    metalGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = metalGrad;
    ctx.fillRect(x, y, w, h);

    // Çapraz kirişler
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    for (let py = 15; py < h - 15; py += 30) {
      ctx.beginPath();
      ctx.moveTo(x + 4, py);
      ctx.lineTo(x + w - 4, py + 25);
      ctx.moveTo(x + w - 4, py);
      ctx.lineTo(x + 4, py + 25);
      ctx.stroke();
    }

    // Alt tabla
    const capH = 18;
    const capW = w + 8;
    const capX = x - 4;
    const capY = h - capH;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(capX, capY, capW, capH);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(capX + 2, capY + 2, capW - 4, 3);

    // Perçinler
    ctx.fillStyle = '#94a3b8';
    for (let rx = capX + 5; rx < capX + capW - 2; rx += 10) {
      ctx.beginPath();
      ctx.arc(rx, capY + 10, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Köprü ikaz ışığı (Kırmızı LED)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + w / 2, capY + capH - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Alt Engel: Kırmızı-Beyaz Deniz Feneri Kulesi
  drawBottomLighthouse(ctx, x, y, w, h) {
    ctx.save();

    const capH = 20;
    const capW = w + 10;
    const capX = x - 5;
    
    // Fener balkonu tabanı
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(capX, y, capW, 6);

    // Fener cam odası (Sarı ışıklı)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 4, y + 6, w - 8, capH - 10);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 4, y + 6, w - 8, capH - 10);

    // Işık Halesi
    const glow = ctx.createRadialGradient(x + w / 2, y + 11, 4, x + w / 2, y + 11, 24);
    glow.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
    glow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 11, 24, 0, Math.PI * 2);
    ctx.fill();

    // Balkon korkuluğu
    ctx.fillStyle = '#334155';
    ctx.fillRect(capX, y + capH - 4, capW, 4);

    // Kule Gövdesi (Kırmızı & Beyaz Şeritler)
    const towerY = y + capH;
    const stripeH = 34;

    let currentStripeY = towerY;
    let isRed = true;

    while (currentStripeY < y + h) {
      const sliceH = Math.min(stripeH, (y + h) - currentStripeY);
      
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      if (isRed) {
        grad.addColorStop(0, '#991b1b');
        grad.addColorStop(0.35, '#dc2626');
        grad.addColorStop(0.8, '#ef4444');
        grad.addColorStop(1, '#7f1d1d');
      } else {
        grad.addColorStop(0, '#cbd5e1');
        grad.addColorStop(0.35, '#f8fafc');
        grad.addColorStop(0.8, '#ffffff');
        grad.addColorStop(1, '#94a3b8');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(x, currentStripeY, w, sliceH);

      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, currentStripeY, w, sliceH);

      currentStripeY += sliceH;
      isRed = !isRed;
    }

    ctx.restore();
  }

  // Altın Simit Bonusu
  drawBagel(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);

    // Işıma
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
    ctx.fill();

    // Hamur
    ctx.lineWidth = r * 0.58;
    ctx.strokeStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Kızarmış kabuk
    ctx.lineWidth = r * 0.42;
    ctx.strokeStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Susamlar
    ctx.fillStyle = '#fef3c7';
    for (let a = 0; a < Math.PI * 2; a += 0.8) {
      const sx = Math.cos(a) * (r * 0.65);
      const sy = Math.sin(a) * (r * 0.65);
      ctx.fillRect(sx - 1, sy - 1, 2, 1.5);
    }

    ctx.restore();
  }
}
