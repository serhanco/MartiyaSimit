// Türk Sanat/Halk Müziği Teorisi: Hicaz Makamı ve Koma/Cent Düzeltmeleri
// Re (Dügah) ekseninde Hicaz: Re - Mi♭ - Fa♯ - Sol - La - Si♭ - Do - Re

export const D4_BASE_FREQ = 293.6648; // Re (Dügah) temel frekansı

// [Yarım ton adımı, mikrotonal cent düzeltmesi, Türk müziği perde adı]
export const HICAZ_SCALE = [
  { step: 0,  cents: 0,   name: 'Dügâh (Re)',        degree: 1 },
  { step: 1,  cents: +18, name: 'Dik Kürdî (Mi♭)',    degree: 2 },
  { step: 4,  cents: -14, name: 'Uzzâl (Fa♯)',       degree: 3 },
  { step: 5,  cents: 0,   name: 'Nevâ (Sol)',        degree: 4 },
  { step: 7,  cents: 0,   name: 'Hüseynî (La)',      degree: 5 },
  { step: 8,  cents: +10, name: 'Acem (Si♭)',        degree: 6 },
  { step: 10, cents: 0,   name: 'Gerdâniye (Do)',    degree: 7 },
  { step: 12, cents: 0,   name: 'Tiz Dügâh (Re5)',   degree: 8 },
  // Genişleme sesleri (Tiz bölge)
  { step: 13, cents: +18, name: 'Tiz Dik Kürdî',     degree: 9 },
  { step: 16, cents: -14, name: 'Tiz Uzzâl',         degree: 10 },
  { step: 17, cents: 0,   name: 'Tiz Nevâ',          degree: 11 },
  // Pest bölge (Yastık sesler)
  { step: -2, cents: 0,   name: 'Rast (Do)',         degree: -1 },
  { step: -5, cents: 0,   name: 'Yegâh (La3)',       degree: -2 }
];

// Derece indeksine göre frekans hesaplama
export function getHicazFrequency(index = 0, baseFreq = D4_BASE_FREQ) {
  const note = HICAZ_SCALE.find(n => n.degree === index) || HICAZ_SCALE[0];
  const totalCents = note.step * 100 + note.cents;
  return baseFreq * Math.pow(2, totalCents / 1200);
}

// 9/8 Aksak Usul Vuruş Ağırlıkları (2 + 2 + 2 + 3)
// Düm (Ağır kuvvetli), Tek (Hafif tiz), Düm, Tek, Tek-ka-tek (Aksak 3'lü son)
export const AKSAK_9_8 = [
  { beat: 0, duration: 2, type: 'dum', accent: 1.0 }, // 1. iki sekizlik
  { beat: 2, duration: 2, type: 'tek', accent: 0.6 }, // 2. iki sekizlik
  { beat: 4, duration: 2, type: 'dum', accent: 0.8 }, // 3. iki sekizlik
  { beat: 6, duration: 1, type: 'tek', accent: 0.7 }, // 4. aksak 3'lünün başı
  { beat: 7, duration: 1, type: 'ka',  accent: 0.4 }, // 4. ara süsleme
  { beat: 8, duration: 1, type: 'tek', accent: 0.6 }  // 4. vuruşun kararı
];
