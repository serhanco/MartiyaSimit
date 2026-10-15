// Kullanıcı Arayüzü (UI) Çizimi: Dalgalanan Başlık, Yaylı Kart Girişi, Tek Kaynaklı Madalyalar (ui.js)
import { CONFIG } from './config.js';
import { easeOutBack } from './util/math.js';

export class UIRenderer {
  constructor() {
    this.reset();
  }

  reset() {
    this.scorePopTimer = 0;
    this.menuPulse = 0;
    this.displayedScore = 0;
    this.gameOverAnimProgress = 0; // 0 -> 1 easeOutBack için
  }

  triggerScorePop() {
    this.scorePopTimer = 0.18;
  }

  update(dt, state, actualScore) {
    this.menuPulse += dt * 3.8;

    if (this.scorePopTimer > 0) {
      this.scorePopTimer -= dt;
    }

    // Game Over animasyonu
    if (state === 'GAMEOVER') {
      if (this.gameOverAnimProgress < 1.0) {
        this.gameOverAnimProgress = Math.min(1.0, this.gameOverAnimProgress + dt * 2.5);
      }

      if (this.displayedScore < actualScore) {
        this.displayedScore += Math.max(1, Math.ceil((actualScore - this.displayedScore) * dt * 9));
        if (this.displayedScore > actualScore) this.displayedScore = actualScore;
      }
    }
  }

  draw(ctx, state, score, bestScore, isNewBest, isMuted, isMusicMuted, autoBotActive) {
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;

    // 1. SES VE MÜZİK İKONLARI (Sağ üst)
    this.drawSoundControls(ctx, W - 25, 26, isMuted, isMusicMuted);

    // 2. AKTİF MOD ROZETLERİ
    let badgeY = 28;
    if (CONFIG.GOD_MODE) {
      this.drawBadge(ctx, 15, badgeY, '🛡️ ÖLÜMSÜZ', '#10b981');
      badgeY += 24;
    }
    if (autoBotActive) {
      this.drawBadge(ctx, 15, badgeY, '🤖 OTO-PİLOT', '#3b82f6');
    }

    // 3. EKRANLAR
    if (state === 'MENU') {
      this.drawMenu(ctx, W, H, bestScore);
    } else if (state === 'PLAYING' || state === 'DYING') {
      this.drawScore(ctx, W, score);
    } else if (state === 'PAUSED') {
      this.drawPaused(ctx, W, H, score);
    } else if (state === 'GAMEOVER') {
      this.drawGameOver(ctx, W, H, this.displayedScore, bestScore, isNewBest);
    }
  }

  // Canlı Skor
  drawScore(ctx, W, score) {
    ctx.save();
    let scale = 1.0;
    if (this.scorePopTimer > 0) {
      scale = 1.0 + Math.sin((this.scorePopTimer / 0.18) * Math.PI) * 0.28;
    }

    ctx.translate(W / 2, 75);
    ctx.scale(scale, scale);

    ctx.font = '900 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.strokeText(score.toString(), 0, 0);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(score.toString(), 0, 0);

    ctx.restore();
  }

  // Açılış Menüsü (Harf harf dalgalanan başlık)
  drawMenu(ctx, W, H, bestScore) {
    ctx.save();

    // Dalgalanan Başlık "MARTI KAÇIŞI"
    const title = 'MARTI KAÇIŞI';
    ctx.font = '900 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';

    const charSpacing = 24;
    const startX = (W - (title.length - 1) * charSpacing) / 2;
    const baseY = H * 0.24;

    for (let i = 0; i < title.length; i++) {
      const char = title[i];
      if (char === ' ') continue;
      const waveY = Math.sin(this.menuPulse + i * 0.42) * 5.5;
      const cx = startX + i * charSpacing;
      const cy = baseY + waveY;

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 6;
      ctx.strokeText(char, cx, cy);

      ctx.fillStyle = '#f59e0b';
      ctx.fillText(char, cx, cy);
    }

    // Alt Başlık
    ctx.font = '700 15px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('İstanbul Boğazı Macerası', W / 2, H * 0.29);

    // Yanıp sönen "UÇMAK İÇİN DOKUN" butonu
    const pulse = 1.0 + Math.sin(this.menuPulse) * 0.05;
    ctx.save();
    ctx.translate(W / 2, H * 0.58);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px system-ui, -apple-system, sans-serif';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeText('UÇMAK İÇİN DOKUN', 0, 0);
    ctx.fillText('UÇMAK İÇİN DOKUN', 0, 0);

    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('[ Boşluk / Tıklama ]', 0, 24);
    ctx.restore();

    // En Yüksek Skor
    if (bestScore > 0) {
      ctx.font = '700 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fef3c7';
      ctx.fillText(`🏆 En Yüksek Skor: ${bestScore}`, W / 2, H * 0.67);
    }

    // Kısayol Bilgisi (Zeminin üstünde, net okunur)
    ctx.font = '600 12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeText('P: Duraklat · M: Ses · N: Müzik · B: Bot', W / 2, H * 0.74);
    ctx.fillText('P: Duraklat · M: Ses · N: Müzik · B: Bot', W / 2, H * 0.74);

    ctx.restore();
  }

  // Duraklatıldı
  drawPaused(ctx, W, H, score) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, 0, W, H);

    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DURAKLATILDI', W / 2, H * 0.45);

    ctx.font = '600 16px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Devam etmek için P veya tıkla', W / 2, H * 0.52);

    ctx.font = '700 18px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Mevcut Skor: ${score}`, W / 2, H * 0.58);
    ctx.restore();
  }

  // Game Over Skorbord Kartı (Yaylı giriş animasyonu)
  drawGameOver(ctx, W, H, score, bestScore, isNewBest) {
    ctx.save();
    const cardW = 280;
    const cardH = 210;
    const cardX = (W - cardW) / 2;

    // Yaylı iniş: yukarılardan veya aşağıdan easeOutBack ile hedefe oturur
    const startY = H + 40;
    const targetY = H * 0.28;
    const eased = easeOutBack(this.gameOverAnimProgress);
    const cardY = startY + (targetY - startY) * eased;

    // Gölge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.roundRect(ctx, cardX + 4, cardY + 6, cardW, cardH, 16);
    ctx.fill();

    // Kart Gövdesi
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    cardGrad.addColorStop(0, '#fef3c7');
    cardGrad.addColorStop(1, '#fde68a');
    ctx.fillStyle = cardGrad;
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Başlık
    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#78350f';
    ctx.fillText('OYUN BİTTİ', W / 2, cardY + 36);

    // Madalya
    this.drawMedal(ctx, cardX + 54, cardY + 105, score);

    // Skorlar
    ctx.textAlign = 'right';
    const textRight = cardX + cardW - 24;

    ctx.font = '700 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#92400e';
    ctx.fillText('SKOR', textRight, cardY + 80);

    ctx.font = '900 28px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#451a03';
    ctx.fillText(score.toString(), textRight, cardY + 110);

    ctx.font = '700 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#92400e';
    ctx.fillText('EN YÜKSEK', textRight, cardY + 138);

    ctx.font = '900 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#451a03';
    ctx.fillText(bestScore.toString(), textRight, cardY + 164);

    // Yeni Rekor Rozeti
    if (isNewBest) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      this.roundRect(ctx, textRight - 85, cardY + 172, 85, 18, 9);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 10px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ YENİ REKOR!', textRight - 42, cardY + 184);
    }

    // Tekrar Dene Butonu
    const btnPulse = 1.0 + Math.sin(this.menuPulse) * 0.05;
    ctx.save();
    ctx.translate(W / 2, cardY + cardH + 42);
    ctx.scale(btnPulse, btnPulse);

    ctx.fillStyle = '#10b981';
    this.roundRect(ctx, -95, -20, 190, 40, 20);
    ctx.fill();
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TEKRAR DENE ↻', 0, 0);

    ctx.restore();
    ctx.restore();
  }

  // Madalyalar (Tek kaynak: CONFIG.MEDALS)
  drawMedal(ctx, cx, cy, score) {
    ctx.save();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fill();

    let medalColor = '#94a3b8';
    let medalLabel = '—';
    let ringColor = '#64748b';

    if (score >= CONFIG.MEDALS.MASTER) {
      medalColor = '#06b6d4'; // Simit Ustası 🥯
      ringColor = '#0891b2';
      medalLabel = '🥯';
    } else if (score >= CONFIG.MEDALS.GOLD) {
      medalColor = '#fbbf24'; // Altın
      ringColor = '#d97706';
      medalLabel = '🥇';
    } else if (score >= CONFIG.MEDALS.SILVER) {
      medalColor = '#cbd5e1'; // Gümüş
      ringColor = '#94a3b8';
      medalLabel = '🥈';
    } else if (score >= CONFIG.MEDALS.BRONZE) {
      medalColor = '#d97706'; // Bronz
      ringColor = '#b45309';
      medalLabel = '🥉';
    }

    ctx.fillStyle = medalColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 27, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(medalLabel, cx, cy + 1);

    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawBadge(ctx, x, y, text, color) {
    ctx.save();
    ctx.font = '800 11px system-ui, -apple-system, sans-serif';
    const width = ctx.measureText(text).width + 16;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.roundRect(ctx, x, y - 10, width, 20, 6);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 8, y);
    ctx.restore();
  }

  // Ses ve Müzik Butonları
  drawSoundControls(ctx, x, y, isMuted, isMusicMuted) {
    ctx.save();

    // Müzik İkonu (N)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.arc(x - 36, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '13px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isMusicMuted ? '🎵❌' : '🎵', x - 36, y);

    // Genel Ses İkonu (M)
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(isMuted ? '🔇' : '🔊', x, y);

    ctx.restore();
  }
}
