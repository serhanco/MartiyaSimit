// Çarpışma algılama motoru (Daire - Dikdörtgen / Zemin / Tavan)
import { CONFIG } from './config.js';

export class CollisionDetector {
  // Daire ile AABB Dikdörtgen çarpışma kontrolü
  static circleIntersectsRect(cx, cy, radius, rx, ry, rw, rh) {
    // Daire merkezine en yakın dikdörtgen noktasını bul (clamp)
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));

    // Mesafe karesi
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (radius * radius);
  }

  // Martının dünya ile çarpışma testi
  static checkCollision(bird, obstacleManager) {
    // REA HACK NOKTASI: GOD_MODE açıksa hiçbir çarpışma gerçekleşmez!
    if (CONFIG.GOD_MODE) {
      return false;
    }

    const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT;
    const bx = bird.x;
    const by = bird.y;
    const br = CONFIG.BIRD_RADIUS;

    // 1. Zemin Çarpışması
    if (by + br >= groundY) {
      return true;
    }

    // 2. Engel Çarpışmaları (Üst Köprü ve Alt Fener)
    for (const pipe of obstacleManager.pipes) {
      // Yalnızca martının yakınındaki engelleri test et (geniş faz eleme)
      if (pipe.x > bx + br + 10 || pipe.x + pipe.width < bx - br - 10) {
        continue;
      }

      // Üst engel (Çelik Köprü Ayağı)
      if (this.circleIntersectsRect(bx, by, br, pipe.x, 0, pipe.width, pipe.topHeight)) {
        return true;
      }

      // Alt engel (Deniz Feneri Kulesi)
      if (this.circleIntersectsRect(bx, by, br, pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight)) {
        return true;
      }
    }

    return false;
  }
}
