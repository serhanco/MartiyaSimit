// Matematik, animasyon yumuşatma (easing) ve tohumlu rastgele sayı üreticisi
export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// Yaylı geri dönüş easing (kartların yaylanarak gelmesi için)
export const easeOutBack = (t, s = 1.70158) => {
  const p = t - 1;
  return 1 + (s + 1) * p * p * p + s * p * p;
};

// Yumuşak sinüs geçişi
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

// Tohumlu rastgele sayı üreticisi (Her açılışta tutarlı ve estetik silüetler için)
export function createRNG(seed = 123456) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Renk hex -> RGB ve renk interpolasyonu (Gün döngüsü geçişleri için)
export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (clean.length === 3) {
    const r = ((bigint >> 8) & 0xf) * 17;
    const g = ((bigint >> 4) & 0xf) * 17;
    const b = (bigint & 0xf) * 17;
    return { r, g, b };
  }
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

export function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return `rgb(${r}, ${g}, ${bl})`;
}
