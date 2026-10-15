// Martı Kaçışı v2 Kapsamlı Birim ve Müzik Testleri
import test from 'node:test';
import assert from 'node:assert/strict';

import { CONFIG } from '../src/config.js';
import { CollisionDetector } from '../src/collision.js';
import { lerp, clamp, easeOutBack, createRNG } from '../src/util/math.js';
import { HICAZ_SCALE, getHicazFrequency, D4_BASE_FREQ, AKSAK_9_8 } from '../src/music/theory.js';
import { ObstacleManager } from '../src/obstacles.js';

test('1. Matematik ve Easing Testleri', () => {
  // lerp
  assert.equal(lerp(10, 20, 0.5), 15);
  assert.equal(lerp(0, 100, 0), 0);
  assert.equal(lerp(0, 100, 1), 100);

  // clamp
  assert.equal(clamp(150, 0, 100), 100);
  assert.equal(clamp(-20, 0, 100), 0);
  assert.equal(clamp(50, 0, 100), 50);

  // easeOutBack uç değerleri
  assert.equal(Math.round(easeOutBack(0)), 0);
  assert.equal(Math.round(easeOutBack(1)), 1);

  // Tohumlu RNG tekrarlanabilirliği
  const rng1 = createRNG(98765);
  const rng2 = createRNG(98765);
  assert.equal(rng1(), rng2());
  assert.equal(rng1(), rng2());
  assert.equal(rng1(), rng2());
});

test('2. Türk Müziği Teorisi (Hicaz Makamı ve 9/8 Aksak Usul)', () => {
  // Hicaz temel Re frekansı
  assert.ok(Math.abs(D4_BASE_FREQ - 293.66) < 0.1);

  // 1. Derece Dügah frekansı
  const dugah = getHicazFrequency(1);
  assert.ok(Math.abs(dugah - D4_BASE_FREQ) < 0.1, '1. derece Dügah (Re) olmalı');

  // 8. Derece Tiz Dügah tam bir oktav olmalı (2x frekans)
  const tizDugah = getHicazFrequency(8);
  assert.ok(Math.abs(tizDugah - (D4_BASE_FREQ * 2)) < 0.5, 'Tiz Dügah tam 2 kat frekansta olmalı');

  // Cent düzeltmeleri sınır testi (±25 cent içinde mikrotonal olmalı)
  for (const note of HICAZ_SCALE) {
    assert.ok(Math.abs(note.cents) <= 25, `${note.name} mikrotonal cent ayarı makul sınırda olmalı`);
  }

  // 9/8 Aksak Usul Vuruş Toplamı (2 + 2 + 2 + 1 + 1 + 1 = 9 vuruş)
  const totalDuration = AKSAK_9_8.reduce((sum, item) => sum + item.duration, 0);
  assert.equal(totalDuration, 9, '9/8 aksak usulün vuruş toplamı tam 9 sekizlik olmalı');
});

test('3. Dinamik Boşluk Daralma (Zorluk Eğrisi) Testi', () => {
  const obs = new ObstacleManager();

  // Skor 0 iken başlangıç aralığı
  obs.spawnPipe(400, 0);
  const pipe0 = obs.pipes[0];
  const gap0 = pipe0.bottomY - pipe0.topHeight;
  assert.equal(Math.round(gap0), CONFIG.PIPE_GAP_START, '0 skorda boşluk tam PIPE_GAP_START olmalı');

  // Skor 15 iken daralan boşluk
  obs.reset();
  obs.spawnPipe(400, 15);
  const pipe15 = obs.pipes[0];
  const gap15 = pipe15.bottomY - pipe15.topHeight;
  const expectedGap15 = Math.round(CONFIG.PIPE_GAP_START - (15 * CONFIG.PIPE_GAP_DECREMENT));
  assert.equal(Math.round(gap15), expectedGap15, '15 skorda boşluk formüle göre daralmış olmalı');
  assert.ok(gap15 < gap0, 'İlerleyen skorda boşluk daha dar olmalı');

  // Skor 100 iken min gap sınırını aşmamalı
  obs.reset();
  obs.spawnPipe(400, 100);
  const pipe100 = obs.pipes[0];
  const gap100 = pipe100.bottomY - pipe100.topHeight;
  assert.equal(gap100, CONFIG.PIPE_GAP_MIN, 'Yüksek skorda boşluk PIPE_GAP_MIN altına inmemeli');
});

test('4. Çarpışma ve God Mode Testi', () => {
  const dummyBird = {
    x: 90,
    y: CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT + 10
  };
  const dummyObstacles = { pipes: [] };

  // Normalde çarpar
  CONFIG.GOD_MODE = false;
  assert.equal(CollisionDetector.checkCollision(dummyBird, dummyObstacles), true);

  // God Mode açıkken çarpışma iptal
  CONFIG.GOD_MODE = true;
  assert.equal(CollisionDetector.checkCollision(dummyBird, dummyObstacles), false);

  CONFIG.GOD_MODE = false;
});
