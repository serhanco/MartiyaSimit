// İstanbul Boğazı Ambiyans Sesleri: Martı Çığlıkları, Vapur Düdüğü ve Deniz Dalgası

export class AmbienceEngine {
  constructor(audioCtx, destinationNode) {
    this.ctx = audioCtx;
    this.dest = destinationNode;
    this.waveGain = null;
    this.waveNoise = null;
    this.seagullTimer = 0;
  }

  // --- 1. BOĞAZ DALGASI (Filtrelenmiş hafif pembe gürültü) ---
  startSeaWaves() {
    if (!this.ctx || this.waveGain) return;

    const sr = this.ctx.sampleRate;
    const bufSize = sr * 4;
    const buf = this.ctx.createBuffer(1, bufSize, sr);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      d[i] = (b0 + b1 + b2) * 0.18;
    }

    this.waveNoise = this.ctx.createBufferSource();
    this.waveNoise.buffer = buf;
    this.waveNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);

    this.waveGain = this.ctx.createGain();
    this.waveGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    // Dalgada periyodik hafif kabarma
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // ~5.5 sn dalga döngüsü
    lfoGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(this.waveGain.gain);

    this.waveNoise.connect(filter);
    filter.connect(this.waveGain);
    this.waveGain.connect(this.dest);

    lfo.start();
    this.waveNoise.start();
  }

  // --- 2. MARTI ÇIĞLIĞI (Doğal glissando ve modülasyon) ---
  playSeagull(pan = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Karakteristik martı çığlığı: hızla yukarı fırlar, sonra aşağı süzülür
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(2600, t + 0.14);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.45);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.75);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2100, t);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.78);

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(pan, t);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.dest);
    } else {
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.dest);
    }

    osc.start(t);
    osc.stop(t + 0.8);
  }

  // --- 3. ŞEHİR HATLARI VAPUR DÜDÜĞÜ (İkonik Çift Tonlu Korna) ---
  playFerryHorn() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = 1.4;

    const freqs = [110, 164.81]; // A2 + E3 (Tam beşli vapur kornası)
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.linearRampToValueAtTime(f - 1.5, t + duration); // Hafif hava basıncı düşüşü

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.25);
      gain.gain.setValueAtTime(0.11, t + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.dest);

      osc.start(t);
      osc.stop(t + duration);
    });
  }

  // Periyodik ambiyans güncellemesi
  update(dt) {
    this.seagullTimer += dt;
    // Her 8-16 saniyede bir uzaktan martı sesi
    if (this.seagullTimer > 11) {
      this.seagullTimer = Math.random() * 4;
      this.playSeagull((Math.random() * 2 - 1) * 0.7);
    }
  }
}
