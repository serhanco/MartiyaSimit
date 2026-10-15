// Oyun konfigürasyonu ve ayarlanabilir fizik/görsel sabitleri
export const CONFIG = {
  // Mantıksal Çözünürlük (Dikey 9:16 formatı)
  CANVAS_WIDTH: 360,
  CANVAS_HEIGHT: 640,

  // Fizik Ayarları
  GRAVITY: 1650,         // px/s^2 aşağı ivme
  FLAP_VELOCITY: -480,   // px/s yukarı fırlatma hızı
  MAX_FALL_SPEED: 750,   // Terminal hız sınırı
  TILT_MIN: -28 * (Math.PI / 180), // Yukarı bakış açısı
  TILT_MAX: 85 * (Math.PI / 180),  // Dalış açısı
  TILT_UP_SPEED: 16,     // Zıplamada yukarı dönme hızı
  TILT_DOWN_SPEED: 4.8,  // Düşüşte aşağı yatma ivmesi

  // Martı Boyut ve Hitbox
  BIRD_X: 90,
  BIRD_RADIUS: 13,       // Biraz daha affedici hitbox
  BIRD_WIDTH: 42,
  BIRD_HEIGHT: 32,

  // Engel (Deniz Feneri & Köprü Ayağı) Ayarları
  PIPE_WIDTH: 62,
  PIPE_INITIAL_SPEED: 155,
  PIPE_MAX_SPEED: 220,
  PIPE_SPEED_INCREMENT: 1.6, // Her puanda artan hız
  PIPE_INTERVAL_DISTANCE: 215, // İki engel arası yatay mesafe
  PIPE_GAP_START: 168,   // Başlangıç dikey geçiş aralığı
  PIPE_GAP_MIN: 125,     // En dar dikey geçiş aralığı
  PIPE_GAP_DECREMENT: 2.2, // Her puanda daralma miktarı (Düzeltildi!)
  PIPE_MIN_TOP_HEIGHT: 70, // Üst engelin min yüksekliği
  MAX_GAP_VARIATION: 135, // İki engel arası maks dikey oynama

  // Zemin & Tavan
  GROUND_HEIGHT: 85,
  CEILING_LIMIT: 0,

  // Simit Bonusu
  BAGEL_RADIUS: 12,
  BAGEL_POINTS: 5,

  // Parçacık Sınırları
  MAX_PARTICLES: 100,

  // Görsel ve Juice
  FLASH_DURATION: 0.08,
  SHAKE_DURATION: 0.22,
  SHAKE_INTENSITY: 8,

  // Gün Döngüsü (Puan aralıkları)
  DAY_PHASE_STEP: 15, // Her 15 puanda bir evre değişir (Günbatımı -> Alacakaranlık -> Gece)

  // Madalya Eşikleri (Tek kaynak)
  MEDALS: {
    BRONZE: 10,
    SILVER: 20,
    GOLD: 35,
    MASTER: 50 // Simit Ustası 🥯
  },

  // Hata Ayıklama (Debug) & Hileler
  DEBUG_HITBOXES: false,
  GOD_MODE: false
};
