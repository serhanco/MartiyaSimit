// Detaylı İstanbul Sahnesi: Gün Döngüsü, Kız Kulesi, Boğaz Köprüsü, Dumanlı Vapurlar, Yalılar ve Sahil
import { CONFIG } from './config.js';
import { lerp, lerpColor, createRNG } from './util/math.js';

export class Background {
  constructor() {
    this.reset();
  }

  reset() {
    this.cloudOffset = 0;
    this.skylineOffset = 0;
    this.bridgeOffset = 0;
    this.waterOffset = 0;
    this.groundOffset = 0;
    this.waveTimer = 0;

    // Gün döngüsü (0: Günbatımı, 1: Alacakaranlık, 2: Gece)
    this.dayPhaseProgress = 0; // 0.0 -> 2.0
    this.targetPhase = 0;

    // Dinamik Öğeler: Kız Kulesi
    this.maidenTowerX = CONFIG.CANVAS_WIDTH + 140;
    this.maidenTowerSpeed = 18;

    // Şehir Hatları Vapuru & Duman Parçacıkları
    this.ferryX = CONFIG.CANVAS_WIDTH + 90;
    this.ferrySpeed = 22;
    this.ferrySmoke = [];
    this.smokeTimer = 0;

    // Balıkçı Sandalı (Dalgalarda salınır)
    this.boatX = CONFIG.CANVAS_WIDTH * 0.35;
    this.boatBob = 0;

    // Gece Yıldızları (Sabit tohumlu)
    const rng = createRNG(4242);
    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: rng() * CONFIG.CANVAS_WIDTH,
        y: rng() * 220,
        r: 0.8 + rng() * 1.5,
        twinklePhase: rng() * Math.PI * 2
      });
    }
  }

  update(dt, speed = CONFIG.PIPE_INITIAL_SPEED, score = 0) {
    // 1. Gün Döngüsü Hesabı (Her 15 puanda bir sonraki evre)
    const targetPhase = Math.min(2.0, score / CONFIG.DAY_PHASE_STEP);
    this.dayPhaseProgress = lerp(this.dayPhaseProgress, targetPhase, dt * 1.5);

    // 2. Parallax Kayma Hızları
    this.cloudOffset = (this.cloudOffset + speed * 0.06 * dt) % CONFIG.CANVAS_WIDTH;
    this.bridgeOffset = (this.bridgeOffset + speed * 0.12 * dt) % CONFIG.CANVAS_WIDTH;
    this.skylineOffset = (this.skylineOffset + speed * 0.26 * dt) % CONFIG.CANVAS_WIDTH;
    this.waterOffset = (this.waterOffset + speed * 0.65 * dt) % CONFIG.CANVAS_WIDTH;
    this.groundOffset = (this.groundOffset + speed * dt) % 24;

    this.waveTimer += dt * 4;
    this.boatBob += dt * 3;

    // 3. Kız Kulesi İlerleyişi
    this.maidenTowerX -= this.maidenTowerSpeed * dt;
    if (this.maidenTowerX < -150) {
      this.maidenTowerX = CONFIG.CANVAS_WIDTH + 320 + Math.random() * 200;
    }

    // 4. Vapur ve Dumanı
    this.ferryX -= this.ferrySpeed * dt;
    if (this.ferryX < -140) {
      this.ferryX = CONFIG.CANVAS_WIDTH + 240 + Math.random() * 250;
    }

    // Bacadan çıkan pofuduk duman
    this.smokeTimer += dt;
    if (this.smokeTimer > 0.16 && this.ferryX > -60 && this.ferryX < CONFIG.CANVAS_WIDTH + 60) {
      this.smokeTimer = 0;
      this.ferrySmoke.push({
        x: this.ferryX + 18,
        y: (CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT - 45) - 24,
        r: 3.5,
        alpha: 0.75,
        vx: 8 + Math.random() * 6,
        vy: -12 - Math.random() * 10
      });
    }

    for (let i = this.ferrySmoke.length - 1; i >= 0; i--) {
      const s = this.ferrySmoke[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.r += dt * 9;
      s.alpha -= dt * 0.8;
      if (s.alpha <= 0) this.ferrySmoke.splice(i, 1);
    }

    // 5. Yıldızların titreşimi
    for (const star of this.stars) {
      star.twinklePhase += dt * 3;
    }
  }

  draw(ctx, bird = null) {
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    const groundY = H - CONFIG.GROUND_HEIGHT;
    const waterY = groundY - 45;

    const nightFactor = Math.min(1.0, Math.max(0.0, this.dayPhaseProgress - 0.7)); // 0: gündüz, 1: gece

    // 1. DİNAMİK GÖKYÜZÜ (Günbatımı -> Alacakaranlık -> Gece)
    this.drawSky(ctx, W, waterY, nightFactor);

    // 2. YILDIZLAR VE HİLAL AY (Gece olunca parlar)
    if (nightFactor > 0.05) {
      this.drawStarsAndMoon(ctx, W, nightFactor);
    }

    // 3. UZAK BULUTLAR
    this.drawClouds(ctx, W, nightFactor);

    // 4. UZAKTAKİ MARTI SÜRÜSÜ
    if (bird) {
      bird.drawDistantFlock(ctx);
    }

    // 5. BOĞAZ KÖPRÜSÜ (Işıklı asma köprü kuleleri ve katener kablosu)
    this.drawBosphorusBridge(ctx, -this.bridgeOffset, waterY, nightFactor);
    this.drawBosphorusBridge(ctx, -this.bridgeOffset + W, waterY, nightFactor);

    // 6. TARİHİ YARIMADA & GALATA SİLÜETİ
    this.drawSkyline(ctx, -this.skylineOffset, waterY, nightFactor);
    this.drawSkyline(ctx, -this.skylineOffset + W, waterY, nightFactor);

    // 7. BOĞAZ YALILARI (Osmanlı Ahşap Sahil Köşkleri & Cumbalar)
    this.drawYalilar(ctx, -this.skylineOffset * 1.4, waterY, nightFactor);
    this.drawYalilar(ctx, -this.skylineOffset * 1.4 + W, waterY, nightFactor);

    // 8. BOĞAZ SULARI & DALGALAR
    this.drawWater(ctx, W, waterY, groundY, nightFactor);

    // 8. KIZ KULESİ (Boğaz'ın ortasında adacık)
    if (this.maidenTowerX > -120 && this.maidenTowerX < W + 120) {
      this.drawMaidenTower(ctx, this.maidenTowerX, waterY + 6, nightFactor);
    }

    // 9. ŞEHİR HATLARI VAPURU & BACASINDAN ÇIKAN DUMANLAR
    this.drawFerry(ctx, this.ferryX, waterY - 8, nightFactor);

    // 10. SAHİL YALILARI & ARNAVUT KALDIRIMI ZEMİNİ & SOKAK LAMBALARI
    this.drawShoreAndGround(ctx, groundY, W, H, nightFactor);
  }

  // Dinamik Gökyüzü Çizimi
  drawSky(ctx, W, waterY, nightFactor) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, waterY);

    if (nightFactor < 0.5) {
      // Gün batımı renkleri
      skyGrad.addColorStop(0.0, '#312e81');
      skyGrad.addColorStop(0.35, '#831843');
      skyGrad.addColorStop(0.65, '#c2410c');
      skyGrad.addColorStop(0.9, '#f59e0b');
      skyGrad.addColorStop(1.0, '#fef08a');
    } else {
      // Geceye geçiş renkleri
      skyGrad.addColorStop(0.0, '#020617');
      skyGrad.addColorStop(0.4, '#0f172a');
      skyGrad.addColorStop(0.75, '#1e1b4b');
      skyGrad.addColorStop(1.0, '#312e81');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, waterY);

    // Güneş (Gün batımında parlar, gece batar)
    if (nightFactor < 0.85) {
      const sunAlpha = 1.0 - nightFactor * 1.15;
      const sunX = W * 0.72;
      const sunY = waterY - 32 + (nightFactor * 60);

      ctx.save();
      ctx.globalAlpha = Math.max(0, sunAlpha);

      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 85);
      sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      sunGlow.addColorStop(0.3, 'rgba(245, 158, 11, 0.4)');
      sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 85, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Yıldızlar ve Hilal Ay
  drawStarsAndMoon(ctx, W, nightFactor) {
    ctx.save();
    ctx.globalAlpha = nightFactor;

    // Yıldızlar
    ctx.fillStyle = '#ffffff';
    for (const s of this.stars) {
      const twinkle = 0.5 + Math.sin(s.twinklePhase) * 0.5;
      ctx.globalAlpha = nightFactor * twinkle;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hilal Ay (İstanbul gecesinin simgesi)
    const moonX = W * 0.28;
    const moonY = 85;
    ctx.globalAlpha = nightFactor * 0.95;

    // Ayın ışıması
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 40);
    moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
    moonGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 40, 0, Math.PI * 2);
    ctx.fill();

    // Hilal şekli (İki daire farkı)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Gölgeleyen daire
    ctx.fillStyle = '#090d1a';
    ctx.beginPath();
    ctx.arc(moonX + 7, moonY - 4, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Bulutlar
  drawClouds(ctx, W, nightFactor) {
    ctx.save();
    ctx.fillStyle = nightFactor > 0.5 ? 'rgba(30, 41, 59, 0.4)' : 'rgba(253, 186, 116, 0.25)';
    this.drawCloud(ctx, (W * 0.2 - this.cloudOffset + W) % W, 70, 52);
    this.drawCloud(ctx, (W * 0.7 - this.cloudOffset + W) % W, 115, 65);
    this.drawCloud(ctx, (W * 1.15 - this.cloudOffset + W) % W, 85, 45);
    ctx.restore();
  }

  drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.15, size * 0.38, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Boğaz Asma Köprüsü (Işıklı katener ve kuleler)
  drawBosphorusBridge(ctx, baseX, baseY, nightFactor) {
    ctx.save();
    ctx.translate(baseX, baseY);

    const bridgeColor = nightFactor > 0.5 ? '#1e293b' : '#334155';
    ctx.strokeStyle = bridgeColor;
    ctx.lineWidth = 2.5;

    const t1X = 70;
    const t2X = 260;
    const deckY = -22;

    // Köprü Tabliyesi
    ctx.beginPath();
    ctx.moveTo(0, deckY);
    ctx.lineTo(CONFIG.CANVAS_WIDTH, deckY);
    ctx.stroke();

    // İki Kule
    ctx.fillStyle = bridgeColor;
    ctx.fillRect(t1X - 3, -80, 6, 80);
    ctx.fillRect(t2X - 3, -80, 6, 80);

    // Asma Ana Kablo (Katener parabol eğrisi)
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, deckY);
    ctx.quadraticCurveTo(t1X * 0.5, -45, t1X, -78);
    ctx.quadraticCurveTo((t1X + t2X) * 0.5, -30, t2X, -78);
    ctx.quadraticCurveTo(t2X + (CONFIG.CANVAS_WIDTH - t2X) * 0.5, -45, CONFIG.CANVAS_WIDTH, deckY);
    ctx.stroke();

    // Gece Köprü Işıkları (Kırmızı / Beyaz LED'ler)
    if (nightFactor > 0.2) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(t1X - 2, -83, 4, 3);
      ctx.fillRect(t2X - 2, -83, 4, 3);

      // Kablo boyunca parlayan beyaz lambalar
      ctx.fillStyle = '#fef08a';
      for (let px = t1X; px <= t2X; px += 24) {
        const u = (px - t1X) / (t2X - t1X);
        const cy = -78 + Math.sin(u * Math.PI) * 48;
        ctx.beginPath();
        ctx.arc(px, cy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // İstanbul Silüeti (Galata, Tarihi Kubbeler & Yalılar)
  drawSkyline(ctx, baseX, baseY, nightFactor) {
    ctx.save();
    ctx.translate(baseX, baseY);

    ctx.fillStyle = nightFactor > 0.5 ? '#090d1a' : '#1e1b4b';

    // Tepe hatları
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -25);
    ctx.bezierCurveTo(40, -35, 80, -22, 110, -28);
    ctx.bezierCurveTo(150, -42, 190, -26, 230, -32);
    ctx.bezierCurveTo(280, -20, 320, -38, CONFIG.CANVAS_WIDTH, -25);
    ctx.lineTo(CONFIG.CANVAS_WIDTH, 0);
    ctx.closePath();
    ctx.fill();

    // Galata Kulesi (x: 58)
    ctx.fillRect(58, -78, 14, 53);
    ctx.fillRect(55, -86, 20, 8);
    ctx.beginPath();
    ctx.moveTo(55, -86);
    ctx.lineTo(65, -106);
    ctx.lineTo(75, -86);
    ctx.closePath();
    ctx.fill();

    // Büyük Cami ve Kubbeler (x: 195)
    ctx.beginPath();
    ctx.arc(195, -46, 18, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(175, -38, 10, Math.PI, 0);
    ctx.arc(215, -38, 10, Math.PI, 0);
    ctx.fill();
    // Minareler
    ctx.fillRect(162, -82, 3.5, 50);
    ctx.fillRect(227, -82, 3.5, 50);

    // Gece Yanan Pencereler
    if (nightFactor > 0.3) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
      // Galata Kulesi pencereleri
      ctx.fillRect(63, -70, 4, 6);
      ctx.fillRect(63, -56, 4, 6);
      // Ev pencereleri
      ctx.fillRect(115, -22, 3, 4);
      ctx.fillRect(135, -24, 3, 4);
      ctx.fillRect(265, -20, 3, 4);
    }

    ctx.restore();
  }

  // Boğaz Kıyısındaki Tarihi Osmanlı Yalıları (Cumbalar, Ahşap Kaplamalar ve Gece Işıkları)
  drawYalilar(ctx, baseX, baseY, nightFactor) {
    ctx.save();
    ctx.translate(baseX, baseY);

    const yalilar = [
      { x: 10,  w: 44, h: 28, color: '#9f1239', roof: '#450a0a', cumbaW: 16, cumbaH: 14 },
      { x: 60,  w: 52, h: 36, color: '#d97706', roof: '#78350f', cumbaW: 20, cumbaH: 18 },
      { x: 120, w: 46, h: 31, color: '#f1f5f9', roof: '#334155', cumbaW: 18, cumbaH: 15 },
      { x: 174, w: 50, h: 34, color: '#0f766e', roof: '#134e4a', cumbaW: 18, cumbaH: 16 },
      { x: 232, w: 45, h: 29, color: '#881337', roof: '#4c0519', cumbaW: 16, cumbaH: 14 },
      { x: 285, w: 54, h: 35, color: '#e2e8f0', roof: '#1e293b', cumbaW: 22, cumbaH: 17 }
    ];

    for (const y of yalilar) {
      // 1. Ana Gövde
      ctx.fillStyle = nightFactor > 0.5 ? '#1e293b' : y.color;
      ctx.fillRect(y.x, -y.h, y.w, y.h);

      // Ahşap yalı çizgileri
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      for (let ly = -y.h + 5; ly < 0; ly += 5) {
        ctx.beginPath();
        ctx.moveTo(y.x, ly);
        ctx.lineTo(y.x + y.w, ly);
        ctx.stroke();
      }

      // 2. Cumba (Denize taşan çıkma kat)
      const cx = y.x + (y.w - y.cumbaW) / 2;
      const cy = -y.h + 8;
      ctx.fillStyle = nightFactor > 0.5 ? '#0f172a' : y.color;
      ctx.fillRect(cx, cy, y.cumbaW, y.cumbaH);
      ctx.strokeRect(cx, cy, y.cumbaW, y.cumbaH);

      // Cumba alt destek payandaları
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(cx, cy + y.cumbaH);
      ctx.lineTo(cx + 4, cy + y.cumbaH + 5);
      ctx.lineTo(cx + y.cumbaW - 4, cy + y.cumbaH + 5);
      ctx.lineTo(cx + y.cumbaW, cy + y.cumbaH);
      ctx.fill();

      // 3. Kırma Ahşap Çatı ve Saçaklar
      ctx.fillStyle = y.roof;
      ctx.beginPath();
      ctx.moveTo(y.x - 3, -y.h);
      ctx.lineTo(y.x + y.w / 2, -y.h - 10);
      ctx.lineTo(y.x + y.w + 3, -y.h);
      ctx.closePath();
      ctx.fill();

      // 4. Pencereler & Gece Sarı Işıklar
      const winColor = nightFactor > 0.3 ? '#fef08a' : '#0284c7';
      ctx.fillStyle = winColor;

      // Cumba pencereleri
      ctx.fillRect(cx + 2, cy + 3, 4, 6);
      ctx.fillRect(cx + y.cumbaW - 6, cy + 3, 4, 6);
      // Yan pencereler
      ctx.fillRect(y.x + 3, -y.h + 8, 4, 6);
      ctx.fillRect(y.x + y.w - 7, -y.h + 8, 4, 6);

      // 5. Suya Düşen Hafif Renk Yansıması
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = y.color;
      ctx.fillRect(y.x + 2, 0, y.w - 4, 14);
      ctx.restore();
    }

    ctx.restore();
  }
  drawWater(ctx, W, waterY, groundY, nightFactor) {
    const seaGrad = ctx.createLinearGradient(0, waterY, 0, groundY);
    if (nightFactor > 0.5) {
      seaGrad.addColorStop(0, '#060a14');
      seaGrad.addColorStop(0.5, '#0b1329');
      seaGrad.addColorStop(1, '#081a33');
    } else {
      seaGrad.addColorStop(0, '#0f172a');
      seaGrad.addColorStop(0.4, '#1e293b');
      seaGrad.addColorStop(1, '#0f2744');
    }
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, waterY, W, groundY - waterY);

    // Su dalgaları
    ctx.strokeStyle = nightFactor > 0.5 ? 'rgba(148, 163, 184, 0.2)' : 'rgba(254, 240, 138, 0.28)';
    ctx.lineWidth = 1.2;
    for (let row = 0; row < 4; row++) {
      const y = waterY + 8 + row * 9;
      ctx.beginPath();
      for (let x = 0; x < W; x += 16) {
        const wave = Math.sin(this.waveTimer + x * 0.08 + row * 1.8) * 2;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
  }

  // Kız Kulesi (Maiden's Tower)
  drawMaidenTower(ctx, x, y, nightFactor) {
    ctx.save();
    ctx.translate(x, y);

    // Taş Adacık Tabakası
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kale Gövdesi (Beyaz-Krem Taş Köşk)
    ctx.fillStyle = nightFactor > 0.5 ? '#64748b' : '#f8fafc';
    ctx.fillRect(-18, -18, 36, 18);

    // Kule Üst Katı ve Balkon
    ctx.fillRect(-8, -32, 16, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-11, -34, 22, 3); // Balkon korkuluğu

    // Konik Çatı ve Bayrak Direği
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-9, -34);
    ctx.lineTo(0, -48);
    ctx.lineTo(9, -34);
    ctx.closePath();
    ctx.fill();

    // Bayrak
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, -52, 6, 4);

    // Fener Işığı (Gece dönen ışık huzmesi)
    if (nightFactor > 0.2) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.beginPath();
      ctx.arc(0, -30, 4, 0, Math.PI * 2);
      ctx.fill();

      // Dönen ışık konisi
      const beamAngle = this.waveTimer * 1.2;
      ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.arc(0, -30, 75, beamAngle - 0.35, beamAngle + 0.35);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // Şehir Hatları Vapuru & Dumanları
  drawFerry(ctx, x, y, nightFactor) {
    ctx.save();
    ctx.translate(x, y);

    // 1. Duman Parçacıkları
    for (const s of this.ferrySmoke) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = nightFactor > 0.5 ? '#cbd5e1' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(s.x - x, s.y - y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Alt Gövde (Siyah)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(44, 0);
    ctx.lineTo(39, 6);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();

    // 3. Beyaz Yolcu Katı
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(4, -8, 34, 8);
    ctx.fillRect(10, -15, 20, 7);

    // Pencereler (Gece sarı ışıklı)
    ctx.fillStyle = nightFactor > 0.3 ? '#fef08a' : '#0284c7';
    ctx.fillRect(7, -6, 5, 3.5);
    ctx.fillRect(15, -6, 5, 3.5);
    ctx.fillRect(23, -6, 5, 3.5);
    ctx.fillRect(31, -6, 5, 3.5);

    // 4. İkonik Sarı-Siyah Vapur Bacası
    ctx.fillStyle = '#eab308';
    ctx.fillRect(17, -22, 5, 7);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(17, -24, 5, 2.5);

    ctx.restore();
  }

  // Sahil, Yalılar ve Işıklı Sokak Lambaları
  drawShoreAndGround(ctx, groundY, W, H, nightFactor) {
    // 1. Sahil Korkuluğu
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, groundY, W, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, groundY + 1, W, 2);

    // 2. Arnavut Kaldırımı Zemin
    ctx.fillStyle = nightFactor > 0.5 ? '#1e293b' : '#334155';
    ctx.fillRect(0, groundY + 8, W, H - groundY - 8);

    // Akan kaldırım taşı derzleri
    ctx.fillStyle = nightFactor > 0.5 ? '#0f172a' : '#1e293b';
    const tileW = 24;
    for (let x = -this.groundOffset; x < W + tileW; x += tileW) {
      ctx.fillRect(x, groundY + 12, 1.2, H - groundY - 12);
      ctx.fillRect(x + 12, groundY + 28, 1.2, H - groundY - 28);
    }
    for (let y = groundY + 12; y < H; y += 16) {
      ctx.fillRect(0, y, W, 1);
    }

    // 3. Klasik Döküm Sokak Lambaları (Gece sarı ışık saçar)
    const lampSpacing = 160;
    for (let lx = ((W * 0.4 - this.groundOffset * 3) % lampSpacing + lampSpacing) % lampSpacing; lx < W + 40; lx += lampSpacing) {
      this.drawStreetLamp(ctx, lx, groundY, nightFactor);
    }

    // 4. Sahilde Uyuyan İstanbul Kedisi 🐈
    this.drawSleepingCat(ctx, W * 0.2, groundY + 14);

    // 5. Kırmızı Simit Arabası
    this.drawSimitCart(ctx, W * 0.78, groundY + 2);
  }

  // Klasik Sokak Lambası
  drawStreetLamp(ctx, x, groundY, nightFactor) {
    ctx.save();
    ctx.translate(x, groundY);

    // Direk
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -38, 4, 38);
    ctx.fillRect(-4, -42, 8, 4);

    // Cam Fener
    ctx.fillStyle = nightFactor > 0.2 ? '#fef08a' : '#cbd5e1';
    ctx.fillRect(-3.5, -48, 7, 6);

    // Gece Işık Halesi
    if (nightFactor > 0.2) {
      const glow = ctx.createRadialGradient(0, -45, 3, 0, -45, 32);
      glow.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      glow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -45, 32, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Uyuyan Tatlı Kedi
  drawSleepingCat(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Kıvrılmış kedi gövdesi (Turuncu tekir)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kafa & Kulaklar
    ctx.beginPath();
    ctx.arc(6, -2, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -6); ctx.lineTo(7, -9); ctx.lineTo(9, -5); ctx.fill();

    // Kıvrılmış kuyruk
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-6, 2, 4, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  // Kırmızı Simit Arabası
  drawSimitCart(ctx, x, groundY) {
    ctx.save();
    ctx.translate(x, groundY);

    // Kırmızı camlı gövde
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-12, -22, 24, 22);

    // Cam vitrin (İçinde simitler görünür)
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.fillRect(-10, -20, 20, 12);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-10, -20, 20, 12);

    // İçteki simitler
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-5, -14, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -14, 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // İki büyük tekerlek
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-8, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(8, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
