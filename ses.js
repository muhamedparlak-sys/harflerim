/*
 * Konuşma + ses efektleri.
 * Konuşma: sesler/sesler.json içinde kaydı olan metin (ör. "mum") o dosyadan çalınır
 * (klon ses); kaydı olmayan her şey cihazın Türkçe sesiyle (Web Speech) okunur.
 */
window.Konus = (() => {
  const DESTEK = 'speechSynthesis' in window;
  const DOSYA_KALIBI = /^[a-z0-9çğıöşü_-]+\.(mp3|m4a|wav|ogg)$/u;
  const EN_UZUN_BEKLEME_MS = 6000;
  let ses = null;
  let kayitlar = new Map();
  let zincir = Promise.resolve();
  let bekleyen = 0;
  let kusak = 0;
  let calan = null;

  function sesSec() {
    const sesler = speechSynthesis.getVoices();
    ses = sesler.find((v) => v.lang === 'tr-TR')
      || sesler.find((v) => (v.lang || '').toLowerCase().startsWith('tr'))
      || null;
  }
  if (DESTEK) {
    sesSec();
    speechSynthesis.addEventListener?.('voiceschanged', sesSec);
  }

  /** sesler/sesler.json → { "mum": "mum.mp3", ... } (isteğe bağlı) */
  async function kayitlariYukle() {
    try {
      const yanit = await fetch('sesler/sesler.json', { cache: 'no-cache' });
      if (!yanit.ok) return 0;
      const veri = await yanit.json();
      const temiz = Object.entries(veri || {})
        .filter(([metin, dosya]) => typeof metin === 'string' && typeof dosya === 'string' && DOSYA_KALIBI.test(dosya))
        .map(([metin, dosya]) => [anahtar(metin), `sesler/${dosya}`]);
      kayitlar = new Map(temiz);
      return kayitlar.size;
    } catch {
      return 0; // kayıt dosyası yoksa cihaz sesi kullanılır; bu bir hata değil
    }
  }

  const anahtar = (metin) => metin.toLocaleLowerCase('tr-TR').replace(/[.!?,…]+/g, ' ').replace(/\s+/g, ' ').trim();

  function kayitCal(yol) {
    return new Promise((resolve) => {
      const a = new Audio(yol);
      const bitir = () => { if (calan && calan.a === a) calan = null; resolve(true); };
      calan = { a, bitir };
      a.onended = bitir;
      a.onerror = () => { calan = null; resolve(false); };
      a.play().catch(() => { calan = null; resolve(false); });
    });
  }

  function cihazdaOku(metin, { hiz = 0.85, perde = 1.1 } = {}) {
    if (!DESTEK) return Promise.resolve();
    return new Promise((resolve) => {
      const s = new SpeechSynthesisUtterance(metin);
      s.lang = 'tr-TR';
      if (ses) s.voice = ses;
      s.rate = hiz;
      s.pitch = perde;
      let bitti = false;
      const bitir = () => { if (!bitti) { bitti = true; resolve(); } };
      s.onend = bitir;
      s.onerror = bitir;
      speechSynthesis.speak(s);
      setTimeout(bitir, EN_UZUN_BEKLEME_MS + metin.length * 120);
    });
  }

  /* "harf:M" biçimindeki metin harfin sesidir: önce klon kaydı ("m"), yoksa sentez. */
  const HARF_ON = 'harf:';

  async function simdiSoyle(metin, secenek) {
    if (metin.startsWith(HARF_ON)) {
      const h = metin.slice(HARF_ON.length);
      const kayit = kayitlar.get(anahtar(h));
      if (kayit && await kayitCal(kayit)) return;
      const sure = window.Efekt && window.Efekt.fonem(h);
      if (sure) { await new Promise((r) => setTimeout(r, sure * 1000 + 150)); return; }
      await cihazdaOku((window.HARF_SES && window.HARF_SES[h]) || h.toLocaleLowerCase('tr-TR'), secenek);
      return;
    }
    const yol = kayitlar.get(anahtar(metin));
    if (yol && await kayitCal(yol)) return;
    await cihazdaOku(metin, secenek);
  }

  /** Sıraya koyar. Sıra boşsa hemen başlar (iOS'ta dokunuşun içinde başlaması gerekir). */
  function soyle(metin, secenek = {}) {
    if (!metin) return zincir;
    const k = kusak;
    const calistir = () => (k === kusak ? simdiSoyle(metin, secenek) : Promise.resolve());
    const is = bekleyen === 0 ? calistir() : zincir.then(calistir);
    bekleyen += 1;
    zincir = is.finally(() => { if (k === kusak) bekleyen -= 1; });
    return zincir;
  }

  function sustur() {
    kusak += 1;
    bekleyen = 0;
    zincir = Promise.resolve();
    if (DESTEK) speechSynthesis.cancel();
    if (calan) { calan.a.pause(); calan.bitir(); }
  }

  return Object.freeze({ soyle, sustur, kayitlariYukle, turkceVar: () => !!ses || kayitlar.size > 0 });
})();

/* Kısa, sentezlenmiş efektler (dosya gerekmez). */
window.Efekt = (() => {
  let ctx = null;

  function ac() {
    try {
      // iPad sessiz düğmesi açıkken Web Audio susar; "playback" oturumu sentez seslerini yine çalar (Safari 16.4+).
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!ctx && Ctor) ctx = new Ctor();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    } catch {
      ctx = null; // ses kartı yoksa efektsiz devam
    }
  }

  function ton(frekans, sure, { tur = 'sine', guc = 0.16, gecikme = 0, kayma = 0 } = {}) {
    if (!ctx) return;
    const t = ctx.currentTime + gecikme;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tur;
    o.frequency.setValueAtTime(frekans, t);
    if (kayma) o.frequency.exponentialRampToValueAtTime(frekans * kayma, t + sure);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(guc, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + sure + 0.05);
  }

  /** Filtreli beyaz gürültü: jet, nal, buhar, gök gürültüsü gibi sesler için. */
  function gurultu(sure, { frekans = 1200, q = 1, tur = 'bandpass', guc = 0.15, gecikme = 0, kayma = 0 } = {}) {
    if (!ctx) return;
    const t = ctx.currentTime + gecikme;
    const uzunluk = Math.max(1, Math.floor(ctx.sampleRate * sure));
    const tampon = ctx.createBuffer(1, uzunluk, ctx.sampleRate);
    const veri = tampon.getChannelData(0);
    for (let i = 0; i < uzunluk; i += 1) veri[i] = Math.random() * 2 - 1;
    const kaynak = ctx.createBufferSource();
    kaynak.buffer = tampon;
    const f = ctx.createBiquadFilter();
    f.type = tur;
    f.Q.value = q;
    f.frequency.setValueAtTime(frekans, t);
    if (kayma) f.frequency.exponentialRampToValueAtTime(frekans * kayma, t + sure);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(guc, t + Math.min(0.05, sure / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    kaynak.connect(f).connect(g).connect(ctx.destination);
    kaynak.start(t);
    kaynak.stop(t + sure + 0.05);
  }

  /** Ses telleri: testere dişi titreşim → formant süzgeçleri (ünlüsüz "mmm", "lll" gibi). */
  function vizilti(sure, { f0 = 125, formant = [[300, 4, 1]], guc = 0.18, titresim = 0, gecikme = 0 } = {}) {
    if (!ctx) return;
    const t = ctx.currentTime + gecikme;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0 * 0.94, t + sure);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(guc, t + Math.min(0.04, sure / 4));
    g.gain.setValueAtTime(guc, t + sure * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    for (const [f, q, kazanc] of formant) {
      const b = ctx.createBiquadFilter();
      b.type = 'bandpass';
      b.frequency.value = f;
      b.Q.value = q;
      const k = ctx.createGain();
      k.gain.value = kazanc;
      o.connect(b).connect(k).connect(g);
    }
    if (titresim) { // R: dil titremesi
      const lfo = ctx.createOscillator();
      const derin = ctx.createGain();
      lfo.frequency.value = titresim;
      derin.gain.value = guc * 0.9;
      lfo.connect(derin).connect(g.gain);
      lfo.start(t);
      lfo.stop(t + sure + 0.05);
    }
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + sure + 0.05);
  }

  /*
   * Sessiz harflerin SESİ, sonuna ünlü eklemeden (cihaz sesi "m"yi hep "me" diye okuyor).
   * Değer: saniye cinsinden süre. Klon sesle kayıt varsa (sesler.json → "m") o kullanılır.
   */
  const SENTEZLE = false; // true: sessiz harfler Web Audio ile ünlüsüz sentezlenir (deneysel)
  const FONEM = {
    M: () => { vizilti(0.55, { formant: [[260, 3, 1.4], [900, 6, 0.08]] }); return 0.55; },
    N: () => { vizilti(0.5, { formant: [[260, 3, 1.2], [1700, 8, 0.12]] }); return 0.5; },
    L: () => { vizilti(0.45, { formant: [[360, 4, 1], [1250, 6, 0.4], [2700, 8, 0.15]] }); return 0.45; },
    R: () => { vizilti(0.45, { formant: [[420, 4, 1], [1300, 6, 0.4]], titresim: 26 }); return 0.45; },
    Y: () => { vizilti(0.4, { formant: [[280, 4, 1], [2250, 6, 0.4], [2950, 8, 0.2]] }); return 0.4; },
    Ğ: () => { vizilti(0.4, { formant: [[480, 3, 0.8], [1000, 5, 0.3]], guc: 0.1 }); return 0.4; },
    Z: () => { vizilti(0.5, { formant: [[200, 3, 0.8]], guc: 0.08 }); gurultu(0.5, { frekans: 5000, tur: 'highpass', guc: 0.12 }); return 0.5; },
    V: () => { vizilti(0.45, { formant: [[220, 3, 1], [1100, 5, 0.15]], guc: 0.12 }); gurultu(0.45, { frekans: 1600, q: 0.6, guc: 0.04 }); return 0.45; },
    J: () => { vizilti(0.45, { formant: [[220, 3, 0.8]], guc: 0.08 }); gurultu(0.45, { frekans: 2600, q: 1.4, guc: 0.12 }); return 0.45; },
    S: () => { gurultu(0.5, { frekans: 5200, tur: 'highpass', guc: 0.2 }); return 0.5; },
    Ş: () => { gurultu(0.5, { frekans: 2800, q: 1.3, guc: 0.25 }); return 0.5; },
    F: () => { gurultu(0.45, { frekans: 1800, q: 0.4, guc: 0.12 }); return 0.45; },
    H: () => { gurultu(0.45, { frekans: 1300, q: 0.3, guc: 0.1 }); return 0.45; },
    P: () => { gurultu(0.05, { frekans: 900, q: 0.6, guc: 0.3 }); return 0.12; },
    T: () => { gurultu(0.05, { frekans: 4200, q: 0.8, guc: 0.3 }); return 0.12; },
    K: () => { gurultu(0.07, { frekans: 2000, q: 1, guc: 0.3 }); return 0.14; },
    B: () => { vizilti(0.08, { formant: [[300, 2, 1]], guc: 0.25 }); gurultu(0.04, { frekans: 900, guc: 0.15, gecikme: 0.06 }); return 0.14; },
    D: () => { vizilti(0.06, { formant: [[300, 2, 1]], guc: 0.2 }); gurultu(0.05, { frekans: 3600, guc: 0.2, gecikme: 0.05 }); return 0.14; },
    G: () => { vizilti(0.06, { formant: [[300, 2, 1]], guc: 0.2 }); gurultu(0.06, { frekans: 1900, guc: 0.2, gecikme: 0.05 }); return 0.14; },
    C: () => { vizilti(0.12, { formant: [[250, 2, 1]], guc: 0.1 }); gurultu(0.12, { frekans: 2800, q: 1.3, guc: 0.2, gecikme: 0.03 }); return 0.18; },
    Ç: () => { gurultu(0.03, { frekans: 4000, guc: 0.25 }); gurultu(0.14, { frekans: 2800, q: 1.3, guc: 0.22, gecikme: 0.03 }); return 0.2; },
  };

  const tekrar = (adet, ara, fn) => { for (let i = 0; i < adet; i += 1) fn(i * ara, i); };
  /* Her karakterin kendi sesi (harfler.js'teki kelimeye göre). */
  const KARAKTER = {
    ag: () => tekrar(3, 0.12, (g) => ton(1600, 0.08, { gecikme: g, guc: 0.05, tur: 'triangle' })),
    hu: () => { ton(400, 0.32, { guc: 0.14, kayma: 0.9 }); ton(380, 0.5, { guc: 0.14, gecikme: 0.45, kayma: 0.85 }); },
    cik: () => tekrar(4, 0.16, (g) => ton(2600, 0.07, { gecikme: g, guc: 0.08, kayma: 1.35 })),
    cay: () => { ton(3200, 0.5, { guc: 0.05, tur: 'triangle' }); ton(3200, 0.5, { guc: 0.05, tur: 'triangle', gecikme: 0.3 }); gurultu(0.8, { frekans: 5000, tur: 'highpass', guc: 0.03, gecikme: 0.4 }); },
    // Ejderha: hırıltılı kükreme + ateş üfleme
    kukre: () => {
      vizilti(0.7, { f0: 70, formant: [[400, 3, 1], [900, 5, 0.5]], guc: 0.2, titresim: 22 });
      gurultu(0.9, { frekans: 700, tur: 'lowpass', guc: 0.3, gecikme: 0.45, kayma: 2.5 });
    },
    // Canavar: iştahlı "ham-nyam-nyam-mmm" (çıtır ısırık + ağız dolu mırıltı)
    nyam: () => {
      tekrar(4, 0.24, (g, i) => {
        gurultu(0.06, { frekans: 2200 - i * 150, q: 0.8, guc: 0.24, gecikme: g });
        vizilti(0.15, { f0: 150 - i * 8, formant: [[650, 5, 1], [1200, 6, 0.45]], guc: 0.14, gecikme: g + 0.05 });
      });
      vizilti(0.45, { f0: 175, formant: [[280, 4, 1]], guc: 0.16, gecikme: 1.0 });
      vizilti(0.25, { f0: 210, formant: [[280, 4, 1]], guc: 0.13, gecikme: 1.42 });
    },
    // İstemediği kurabiyeyi tadarken kuşkulu "hı-ıh"
    hmm: () => { vizilti(0.18, { f0: 160, formant: [[300, 4, 1]], guc: 0.12 }); vizilti(0.22, { f0: 120, formant: [[300, 4, 1]], guc: 0.12, gecikme: 0.22 }); },
    // Tükürme: "ptuh!" patlaması + "bıııh" iğrenme
    tukur: () => {
      gurultu(0.08, { frekans: 2600, q: 0.7, guc: 0.32 });
      vizilti(0.4, { f0: 140, formant: [[500, 5, 1], [1500, 7, 0.4]], guc: 0.12, titresim: 18, gecikme: 0.1 });
    },
    // Canavar şişerken yükselen "fıııı", patlarken "PAT!"
    sisir: () => ton(180, 0.9, { tur: 'triangle', guc: 0.1, kayma: 3 }),
    // Balon gibi patlar ("BAM" çatlama + gümbürtü), sonra konfeti fışkırır ("fışşş" + pırıltılar)
    patla: () => {
      gurultu(0.04, { frekans: 3000, tur: 'highpass', guc: 0.55 });
      gurultu(0.25, { frekans: 1400, q: 0.4, guc: 0.4, kayma: 0.25 });
      ton(90, 0.45, { guc: 0.35, kayma: 0.35 });
      gurultu(1.1, { frekans: 6000, q: 0.6, guc: 0.16, gecikme: 0.12, kayma: 0.4 });
      tekrar(8, 0.09, (g, i) => ton(1400 + ((i * 377) % 1200), 0.07, { gecikme: 0.2 + g, guc: 0.05, tur: 'triangle', kayma: 1.3 }));
    },
    // Karnını sıvazlarken memnun "mmm-hı"
    doydum: () => {
      vizilti(0.5, { f0: 150, formant: [[280, 4, 1]], guc: 0.15 });
      vizilti(0.3, { f0: 200, formant: [[280, 4, 1]], guc: 0.13, gecikme: 0.55 });
    },
    cop: () => { ton(220, 0.18, { kayma: 0.4, guc: 0.2 }); gurultu(0.12, { frekans: 600, guc: 0.08 }); },
    aii: () => { ton(620, 0.35, { tur: 'sawtooth', guc: 0.06, kayma: 0.6 }); ton(360, 0.4, { tur: 'sawtooth', guc: 0.06, kayma: 1.6, gecikme: 0.38 }); },
    fis: () => tekrar(4, 0.2, (g) => gurultu(0.14, { frekans: 3500, guc: 0.08, gecikme: g })),
    parla: () => [0, 1, 2, 3].forEach((i) => ton(1320 * 1.12 ** i, 0.4, { gecikme: i * 0.09, guc: 0.04, tur: 'triangle' })),
    damla: () => tekrar(4, 0.22, (g, i) => ton(900 + i * 140, 0.12, { gecikme: g, guc: 0.1, kayma: 1.8 })),
    horul: () => tekrar(2, 0.9, (g) => gurultu(0.6, { frekans: 300, tur: 'lowpass', guc: 0.12, gecikme: g })),
    pif: () => gurultu(0.5, { frekans: 2500, guc: 0.05, kayma: 0.5 }),
    cin: () => ton(2400, 0.5, { tur: 'triangle', guc: 0.08 }),
    jet: () => { gurultu(1.8, { frekans: 500, q: 0.8, guc: 0.22, kayma: 6 }); ton(110, 1.6, { tur: 'sawtooth', guc: 0.05, kayma: 2.2 }); },
    pirpir: () => tekrar(20, 0.13, (g) => gurultu(0.07, { frekans: 900, guc: 0.06, gecikme: g })),
    tak: () => tekrar(8, 0.07, (g) => gurultu(0.04, { frekans: 2200, q: 4, guc: 0.12, gecikme: g })),
    kanat: () => { ton(1400, 0.35, { tur: 'triangle', guc: 0.06, kayma: 0.65 }); tekrar(4, 0.17, (g) => gurultu(0.1, { frekans: 700, guc: 0.08, gecikme: 0.2 + g })); },
    nota: () => [523, 587, 659, 784].forEach((f, i) => ton(f, 0.22, { gecikme: i * 0.18, guc: 0.1, tur: 'triangle' })),
    cizir: () => gurultu(1.2, { frekans: 4000, tur: 'highpass', guc: 0.06 }),
    /* bacak adımıyla aynı ritim: stil.css .bacak 0.25 sn → her yarım adımda bir tık */
    tikirkos: () => tekrar(24, 0.125, (g, i) => gurultu(0.03, { frekans: i % 2 ? 2600 : 3400, q: 5, guc: 0.1, gecikme: g })),
    tikir: () => tekrar(10, 0.06, (g) => gurultu(0.03, { frekans: 3000, q: 5, guc: 0.08, gecikme: g })),
    pop: () => tekrar(4, 0.14, (g, i) => ton(500 + i * 120, 0.1, { gecikme: g, guc: 0.1, kayma: 1.9 })),
    bip: () => [880, 660, 990, 740].forEach((f, i) => ton(f, 0.1, { gecikme: i * 0.13, guc: 0.06, tur: 'square' })),
    vik: () => ton(700, 0.4, { tur: 'triangle', guc: 0.06, kayma: 1.6 }),
    gok: () => { gurultu(0.15, { frekans: 3000, guc: 0.2 }); gurultu(1.4, { frekans: 260, tur: 'lowpass', guc: 0.3, gecikme: 0.1, kayma: 0.6 }); },
    gicir: () => { ton(1200, 0.3, { tur: 'triangle', guc: 0.05, kayma: 0.75 }); ton(900, 0.3, { tur: 'triangle', guc: 0.05, kayma: 1.33, gecikme: 0.6 }); },
    vizz: () => ton(230, 0.7, { tur: 'sawtooth', guc: 0.04, kayma: 1.1 }),
    tis: () => gurultu(0.9, { frekans: 5000, tur: 'highpass', guc: 0.06 }),
    duduk: () => { ton(170, 1, { tur: 'sawtooth', guc: 0.07 }); ton(255, 1, { tur: 'sawtooth', guc: 0.05 }); },
    nal: () => [0, 0.12, 0.36, 0.48, 0.72, 0.84, 1.08, 1.2, 1.44, 1.56].forEach((g) => gurultu(0.05, { frekans: 1700, q: 3, guc: 0.2, gecikme: g })),
  };

  return Object.freeze({
    ac,
    karakter: (ad) => { if (KARAKTER[ad]) KARAKTER[ad](); },
    // Sentez fonemleri hoparlörde çok kısık/belirsiz kaldı (kullanıcı testi 2026-11-15): harf sesi
    // şimdilik cihaz sesiyle kısa hece ("mı", "kı") okunur. Klon kaydı (sesler.json) hep önceliklidir.
    fonemVar: (h) => SENTEZLE && !!FONEM[h],
    /** Harfin sesini sentezler; süreyi (sn) döner. Ses kartı yoksa 0. */
    fonem: (h) => { ac(); return ctx && FONEM[h] ? FONEM[h]() : 0; },
    tut: () => ton(660, 0.08, { guc: 0.07 }),
    tik: () => { ton(520, 0.12, { kayma: 1.6 }); ton(880, 0.1, { gecikme: 0.06, guc: 0.1 }); },
    sihir: () => [0, 1, 2, 3, 4].forEach((i) => ton(880 * 1.19 ** i, 0.18, { gecikme: i * 0.05, guc: 0.06, tur: 'triangle' })),
    yanlis: () => { ton(300, 0.16, { tur: 'square', guc: 0.07, kayma: 0.8 }); ton(220, 0.28, { tur: 'square', guc: 0.07, gecikme: 0.16, kayma: 0.7 }); },
    tikSesi: () => { ton(784, 0.14, { tur: 'triangle', guc: 0.12 }); ton(1175, 0.3, { tur: 'triangle', guc: 0.12, gecikme: 0.12 }); },
    kalp: () => ton(1046, 0.12, { tur: 'triangle', guc: 0.06, kayma: 1.25 }),
    tac: () => [523, 659, 784, 1047, 1319].forEach((f, i) => ton(f, 0.32, { gecikme: i * 0.11, guc: 0.12, tur: 'triangle' })),
  });
})();
