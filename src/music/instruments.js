// Prosedürel Türk Müziği Enstrümanları Sentezleyicisi (Ney, Saz, Darbuka ve Dem)

export class InstrumentBank {
  constructor(audioCtx, destinationNode) {
    this.ctx = audioCtx;
    this.dest = destinationNode;
    this.sazCache = new Map(); // Karplus-Strong tampon önbelleği
    this.droneGain = null;
    this.droneOscs = [];
  }

  // --- 1. NEY (Nefesli & Mistisizm) ---
  // Sinüs + bant geçiren nefes gürültüsü + gecikmeli vibrato + portamento
  playNey(freq, duration = 1.2, time = null, targetFreq = null) {
    if (!this.ctx) return;
    const t = time !== null ? time : this.ctx.currentTime;

    // Ana ses osilatörü (Ney gövde tınısı)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Portamento (notalar arası kayma)
    if (targetFreq && targetFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(targetFreq, t + duration * 0.45);
    }

    // Vibrato (Hafif ve gecikmeli başlayan nefes titreşimi)
    const vib = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    vib.frequency.setValueAtTime(5.2, t);
    vibGain.gain.setValueAtTime(0, t);
    vibGain.gain.linearRampToValueAtTime(3.2, t + duration * 0.4); // 0.4 sn sonra vibrato girer
    vib.connect(osc.frequency);
    vib.start(t);
    vib.stop(t + duration);

    // Ney nefes gürültüsü (Breath noise)
    const noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.25, this.ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(freq * 1.5, t);
    noiseFilter.Q.setValueAtTime(3.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, t);
    noiseGain.gain.linearRampToValueAtTime(0.015, t + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gain);

    // Zarf (Envelope - Yumuşak açılış ve sönümleniş)
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.12);
    gain.gain.setValueAtTime(0.16, t + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.dest);

    noise.start(t);
    noise.stop(t + duration);
    osc.start(t);
    osc.stop(t + duration);
  }

  // --- 2. SAZ / BAĞLAMA (Karplus-Strong Tel Modeli) ---
  // Çift tel tınısı ve tezene atağı
  getSazBuffer(freq) {
    const key = Math.round(freq);
    if (this.sazCache.has(key)) return this.sazCache.get(key);

    const sr = this.ctx.sampleRate;
    const dur = 1.2;
    const N = Math.max(2, Math.round(sr / freq));
    const buf = this.ctx.createBuffer(1, Math.round(sr * dur), sr);
    const data = buf.getChannelData(0);

    // Tezene darbesi (Noise burst ring buffer)
    const ring = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      ring[i] = (Math.random() * 2 - 1);
    }

    // Tel rezonans sönümlemesi
    const damp = 0.994;
    for (let i = 0; i < data.length; i++) {
      const idx = i % N;
      const nextIdx = (idx + 1) % N;
      const val = ring[idx];
      data[i] = val;
      ring[idx] = (ring[idx] + ring[nextIdx]) * 0.5 * damp;
    }

    this.sazCache.set(key, buf);
    return buf;
  }

  playSaz(freq, time = null, volume = 0.22) {
    if (!this.ctx) return;
    const t = time !== null ? time : this.ctx.currentTime;
    const buf = this.getSazBuffer(freq);

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    // Hafif rezonans filtresi
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3800, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.dest);

    src.start(t);
  }

  // --- 3. DARBUKA (Düm, Tek, Ka Ritimleri) ---
  playDarbuka(type = 'dum', accent = 1.0, time = null) {
    if (!this.ctx) return;
    const t = time !== null ? time : this.ctx.currentTime;

    if (type === 'dum') {
      // Düm: Tok göbek bası (Aşağı kayan sinüs darbesi)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(135, t);
      osc.frequency.exponentialRampToValueAtTime(52, t + 0.16);

      gain.gain.setValueAtTime(0.42 * accent, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.dest);
      osc.start(t);
      osc.stop(t + 0.22);
    } else {
      // Tek & Ka: Keskin deri/kenar çınlaması
      const isTek = type === 'tek';
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isTek ? 460 : 380, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.06);

      gain.gain.setValueAtTime((isTek ? 0.25 : 0.14) * accent, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      // Yüksek frekans tıkırtısı
      const noiseBuf = this.ctx.createBuffer(1, Math.round(this.ctx.sampleRate * 0.03), this.ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18 * accent, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      noise.connect(noiseGain);
      noiseGain.connect(this.dest);
      osc.connect(gain);
      gain.connect(this.dest);

      noise.start(t);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  // --- 4. DEM (Nefes Alan Yastık Drone) ---
  // Re ve La seslerinde yavaşça nefes alan arka plan akoru
  startDrone() {
    if (!this.ctx || this.droneGain) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.droneGain.gain.linearRampToValueAtTime(0.09, this.ctx.currentTime + 1.8);
    this.droneGain.connect(this.dest);

    const freqs = [146.83, 220.00, 293.66]; // Re3, La3, Re4
    this.droneOscs = freqs.map((f, i) => {
      const osc = this.ctx.createOscillator();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      osc.type = i === 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      if (panner) {
        panner.pan.value = (i - 1) * 0.35;
        osc.connect(panner);
        panner.connect(this.droneGain);
      } else {
        osc.connect(this.droneGain);
      }
      osc.start();
      return osc;
    });
  }

  stopDrone() {
    if (!this.droneGain) return;
    this.droneGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    setTimeout(() => {
      this.droneOscs.forEach(o => {
        try { o.stop(); } catch {}
      });
      this.droneOscs = [];
      this.droneGain = null;
    }, 850);
  }
}
