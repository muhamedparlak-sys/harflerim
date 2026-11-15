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

  async function simdiSoyle(metin, secenek) {
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

  return Object.freeze({
    ac,
    tut: () => ton(660, 0.08, { guc: 0.07 }),
    tik: () => { ton(520, 0.12, { kayma: 1.6 }); ton(880, 0.1, { gecikme: 0.06, guc: 0.1 }); },
    sihir: () => [0, 1, 2, 3, 4].forEach((i) => ton(880 * 1.19 ** i, 0.18, { gecikme: i * 0.05, guc: 0.06, tur: 'triangle' })),
    yanlis: () => { ton(300, 0.16, { tur: 'square', guc: 0.07, kayma: 0.8 }); ton(220, 0.28, { tur: 'square', guc: 0.07, gecikme: 0.16, kayma: 0.7 }); },
    tikSesi: () => { ton(784, 0.14, { tur: 'triangle', guc: 0.12 }); ton(1175, 0.3, { tur: 'triangle', guc: 0.12, gecikme: 0.12 }); },
    kalp: () => ton(1046, 0.12, { tur: 'triangle', guc: 0.06, kayma: 1.25 }),
    tac: () => [523, 659, 784, 1047, 1319].forEach((f, i) => ton(f, 0.32, { gecikme: i * 0.11, guc: 0.12, tur: 'triangle' })),
  });
})();
