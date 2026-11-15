/* Harflerim — isim yazma oyunu. Saf JavaScript, kurulum gerektirmez. */
(() => {
  'use strict';

  const TR = 'tr-TR';
  const BUYUK = (s) => s.toLocaleUpperCase(TR);
  const KUCUK = (s) => s.toLocaleLowerCase(TR);
  const $ = (s, kok = document) => kok.querySelector(s);

  const BASILI_TUT_MS = 1500;
  const SURUKLEME_ESIGI = 8;
  const YANLIS_GOSTERIM_MS = 1300;
  const EN_UZUN_AD = 24;
  const FOTO_BOYUT = 512;
  const IZINLI_AD = /^[A-ZÇĞIİÖŞÜ]+( [A-ZÇĞIİÖŞÜ]+)*$/u;
  const VARSAYILAN_AYAR = Object.freeze({ kucukHarf: false, ipucu: true, donusum: true, fazla: 0, yardim: 10 });
  const ZIPLAMA_ONCESI_MS = 3000;
  const OGRENDI_ESIGI = 3;
  const YEDEK_YUZLER = ['🧒', '👩', '👨', '👵', '👴', '👧', '👦', '🧔'];

  const durum = {
    ayar: { ...VARSAYILAN_AYAR },
    aile: window.ILK_AILE.map((k) => ({ ...k, foto: null })),
    yildiz: {},
    ilerleme: {},
    oyun: null,
    donusumNo: 0,
    surukleme: null,
  };

  /* ---------- küçük yardımcılar ---------- */
  function el(etiket, ozellik = {}, cocuklar = []) {
    const n = document.createElement(etiket);
    Object.assign(n, ozellik);
    for (const c of [].concat(cocuklar)) if (c != null) n.append(c);
    return n;
  }
  const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
  const goster = (h) => (durum.ayar.kucukHarf ? KUCUK(h) : BUYUK(h));
  const tur = (h) => (window.SESLI.has(h) ? 'sesli' : 'sessiz');
  const harfSesi = (h) => window.HARF_SES[h] || KUCUK(h);
  const harfVeKelime = (h) => { const b = window.HARF_BUL.get(h); return b ? `${harfSesi(h)}... ${KUCUK(b.kelime)}` : harfSesi(h); };
  const yeniKimlik = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  function renkliAd(ad) {
    const f = document.createDocumentFragment();
    for (const h of ad) f.append(h === ' ' ? el('span', { className: 'bosluk' }) : el('span', { className: tur(h), textContent: goster(h) }));
    return f;
  }

  function yuz(kisi, sinif) {
    if (kisi.foto) return el('img', { className: sinif, src: kisi.foto, alt: '' });
    return el('span', { className: `${sinif} yuz-emoji`, textContent: kisi.emoji || '🙂' });
  }

  let bildirimZamani = null;
  function bildir(metin) {
    const b = $('#bildirim');
    b.textContent = metin;
    b.hidden = false;
    clearTimeout(bildirimZamani);
    bildirimZamani = setTimeout(() => { b.hidden = true; }, 2600);
  }

  function adiDuzelt(ham) {
    const v = BUYUK(String(ham || '')).replace(/\s+/g, ' ').trim();
    if (!v || [...v].length > EN_UZUN_AD || !IZINLI_AD.test(v)) return null;
    return v;
  }

  function ekranAc(id) {
    for (const s of document.querySelectorAll('.ekran')) s.hidden = s.id !== id;
  }

  async function kaydet(anahtar, deger) {
    try {
      await window.Depo.yaz(anahtar, deger);
    } catch (hata) {
      bildir(`Kaydedilemedi: ${hata.message || hata}`);
    }
  }

  /* ---------- ana sayfa ---------- */
  function anaSayfa() {
    const kap = $('#kartlar');
    kap.replaceChildren();
    if (durum.aile.length === 0) {
      kap.append(el('div', { className: 'kart bos-aile' }, [
        el('span', { className: 'kart-yuz yuz-emoji', textContent: '👨‍👩‍👧' }),
        el('span', { className: 'kart-rol', textContent: 'Ebeveyn: sağ üstteki ⚙️ simgesine basılı tutup aileyi ekleyin.' }),
      ]));
    }
    durum.aile.forEach((kisi, i) => {
      const yildiz = durum.yildiz[kisi.id] || 0;
      const kart = el('button', { className: 'kart', type: 'button' });
      kart.style.setProperty('--gecikme', `${i * 60}ms`);
      const resim = el('span', { className: 'kart-resim' }, [yuz(kisi, 'kart-yuz')]);
      if (yildiz > 0) resim.append(el('span', { className: 'kart-tac', textContent: '👑' }));
      kart.append(...[
        resim,
        el('span', { className: 'kart-ad' }, renkliAd(kisi.name)),
        kisi.rol ? el('span', { className: 'kart-rol', textContent: kisi.rol }) : null,
        yildiz > 0 ? el('span', { className: 'kart-yildiz', textContent: `⭐ ${yildiz}` }) : null,
      ].filter(Boolean));
      kart.addEventListener('click', () => oyunBaslat(kisi));
      kap.append(kart);
    });
    const harfKart = el('button', { className: 'kart kart-harf', type: 'button' }, [
      el('span', { className: 'kart-resim' }, [el('span', { className: 'kart-yuz yuz-emoji', textContent: '🔤' })]),
      el('span', { className: 'kart-ad' }, renkliAd('HARFLER')),
    ]);
    harfKart.style.setProperty('--gecikme', `${durum.aile.length * 60}ms`);
    harfKart.addEventListener('click', harflerAc);
    kap.append(harfKart);
  }

  /* ---------- oyun ---------- */
  const bosluklariAtla = (harfler, i) => { let j = i; while (j < harfler.length && harfler[j] === ' ') j += 1; return j; };

  function karistir(dizi) {
    const a = [...dizi];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function oyunBaslat(kisi) {
    window.Efekt.ac();
    const harfler = [...kisi.name];
    durum.oyun = { kisi, harfler, sira: bosluklariAtla(harfler, 0), bitti: false, kilit: false, kutular: [], no: 0 };
    $('#portre').replaceChildren(yuz(kisi, 'portre-yuz'));
    $('#tac').hidden = true;
    $('#bitti').hidden = true;
    kutulariKur();
    taslariKur();
    insaGoster(false);
    siradakiniIsaretle();
    ekranAc('oyun');
    requestAnimationFrame(olcule);
    window.Konus.sustur();
    window.Konus.soyle(KUCUK(kisi.rol ? `${kisi.rol}, ${kisi.name}` : kisi.name));
    sayacKur();
  }

  function kutulariKur() {
    const o = durum.oyun;
    const kap = $('#kutular');
    kap.replaceChildren();
    let kelime = null;
    o.kutular = o.harfler.map((h) => {
      if (h === ' ') { kelime = null; return null; }
      if (!kelime) { kelime = el('div', { className: 'kelime' }); kap.append(kelime); }
      const kutu = el('div', { className: 'kutu' });
      kelime.append(kutu);
      return kutu;
    });
  }

  function taslariKur() {
    const o = durum.oyun;
    const gerekli = o.harfler.filter((h) => h !== ' ');
    const kullanilan = new Set(gerekli);
    const fazla = karistir(window.HARFLER.map((x) => x.h).filter((h) => !kullanilan.has(h))).slice(0, durum.ayar.fazla);
    let dizi = karistir([...gerekli, ...fazla]);
    for (let d = 0; d < 8 && dizi.length > 1 && dizi.slice(0, gerekli.length).join('') === gerekli.join(''); d += 1) dizi = karistir(dizi);
    const tepsi = $('#tepsi');
    tepsi.replaceChildren(...dizi.map((h, i) => {
      const t = el('button', { className: `tas ${tur(h)}`, type: 'button', textContent: goster(h) });
      t.dataset.h = h;
      t.style.setProperty('--gecikme', `${i * 45}ms`);
      t.addEventListener('pointerdown', tasBas);
      return t;
    }));
  }

  /** Yazılan kısım: M · ME · MER … Yanlış denemede son harf kırmızı gösterilir. */
  function insaGoster(yeniHarf, yanlisHarf = null) {
    const o = durum.oyun;
    const parca = o.harfler.slice(0, o.sira).join('').trimEnd();
    const kap = $('#insa');
    const ogeler = [...parca].map((h, i, a) => {
      if (h === ' ') return el('span', { className: 'bosluk' });
      const s = el('span', { className: tur(h), textContent: goster(h) });
      if (yeniHarf && i === a.length - 1) s.classList.add('yeni');
      return s;
    });
    if (yanlisHarf) ogeler.push(el('span', { className: 'yanlis-harf', textContent: goster(yanlisHarf) }));
    kap.replaceChildren(...ogeler);
    kap.classList.toggle('bos', ogeler.length === 0);
  }

  function siradakiniIsaretle() {
    const o = durum.oyun;
    o.kutular.forEach((k, i) => {
      if (!k || k.classList.contains('dolu')) return;
      const sirada = i === o.sira && !o.bitti;
      k.classList.toggle('sirada', sirada);
      k.classList.toggle('ipucu', sirada && durum.ayar.ipucu);
      k.textContent = sirada && durum.ayar.ipucu ? goster(o.harfler[i]) : '';
    });
  }

  function olcule() {
    const o = durum.oyun;
    if (!o) return;
    const genislik = $('#kutular').clientWidth || innerWidth * 0.6;
    const kelimeler = o.kisi.name.split(' ');
    const enUzun = Math.max(...kelimeler.map((k) => [...k].length));
    let b = genislik / (o.harfler.length * 1.2 + (kelimeler.length - 1) * 0.3);
    if (b < 64) b = genislik / (enUzun * 1.2);
    b = Math.max(44, Math.min(112, innerHeight / 8.2, b));
    const insa = Math.min(b * 0.92, (genislik - 48) / (o.harfler.length * 0.82));
    document.documentElement.style.setProperty('--b', `${Math.floor(b)}px`);
    document.documentElement.style.setProperty('--insa', `${Math.floor(insa)}px`);
  }

  /* ---------- sürükle-bırak ---------- */
  function tasBas(e) {
    const o = durum.oyun;
    if (!o || o.bitti || durum.surukleme) return;
    window.Efekt.ac();
    sayacDurdur();
    const tas = e.currentTarget;
    e.preventDefault();
    try { tas.setPointerCapture(e.pointerId); } catch { /* bazı tarayıcılar yakalamayı desteklemez */ }
    durum.surukleme = { tas, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, oynadi: false };
    tas.addEventListener('pointermove', tasOynat);
    tas.addEventListener('pointerup', tasBirak);
    tas.addEventListener('pointercancel', tasIptal);
  }

  function tasOynat(e) {
    const s = durum.surukleme;
    if (!s || e.pointerId !== s.id) return;
    s.dx = e.clientX - s.x0;
    s.dy = e.clientY - s.y0;
    if (!s.oynadi && Math.hypot(s.dx, s.dy) > SURUKLEME_ESIGI) {
      s.oynadi = true;
      s.tas.classList.add('suruklenen');
      window.Efekt.tut();
    }
    if (s.oynadi) s.tas.style.transform = `translate(${s.dx}px, ${s.dy}px) scale(1.12)`;
  }

  function suruklemeBitir() {
    const s = durum.surukleme;
    s.tas.removeEventListener('pointermove', tasOynat);
    s.tas.removeEventListener('pointerup', tasBirak);
    s.tas.removeEventListener('pointercancel', tasIptal);
    s.tas.classList.remove('suruklenen');
    durum.surukleme = null;
    return s;
  }

  function tasBirak(e) {
    if (!durum.surukleme || e.pointerId !== durum.surukleme.id) return;
    const s = suruklemeBitir();
    if (!s.oynadi) { harfiTani(s.tas.dataset.h, s.tas); sayacKur(); return; }
    birakildi(s.tas);
  }

  function tasIptal(e) {
    if (!durum.surukleme || e.pointerId !== durum.surukleme.id) return;
    tasGeriGonder(suruklemeBitir().tas);
    sayacKur();
  }

  function tasGeriGonder(tas) {
    const nereden = tas.style.transform || 'none';
    tas.style.transform = '';
    tas.animate([{ transform: nereden }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.3,1.4,.5,1)' });
  }

  function birakildi(tas) {
    const o = durum.oyun;
    const hedef = o.kutular[o.sira];
    const h = tas.dataset.h;
    const t = tas.getBoundingClientRect();
    const k = hedef.getBoundingClientRect();
    const uzaklik = Math.hypot(t.left + t.width / 2 - (k.left + k.width / 2), t.top + t.height / 2 - (k.top + k.height / 2));
    if (o.kilit || uzaklik > Math.max(k.width, 70) * 1.2) { tasGeriGonder(tas); sayacKur(); return; }
    if (h !== o.harfler[o.sira]) { yanlisHarf(tas, hedef, h); return; }
    yerlestir(tas, hedef, h);
  }

  /** Yanlış harf: kutuda kırmızı görünür, sallanan ✕, efekt ve oluşan kelime okunur (MU + M → "mum"). */
  async function yanlisHarf(tas, kutu, h) {
    const o = durum.oyun;
    o.kilit = true;
    ilerlemeYaz(o.harfler[o.sira], false);
    const baslangic = performance.now();
    window.Efekt.yanlis();
    tasGeriGonder(tas);
    kutu.classList.remove('ipucu', 'sirada');
    kutu.classList.add('yanlis');
    kutu.replaceChildren(goster(h), el('span', { className: 'carpi', textContent: '✕' }));
    kutu.animate([
      { transform: 'translateX(0)' }, { transform: 'translateX(-14px) rotate(-4deg)' }, { transform: 'translateX(12px) rotate(3deg)' },
      { transform: 'translateX(-8px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' },
    ], { duration: 520, easing: 'ease-in-out' });
    insaGoster(false, h);
    const deneme = KUCUK(o.harfler.slice(0, o.sira).join('') + h).trim();
    window.Konus.sustur();
    await window.Konus.soyle(deneme);
    const kalan = YANLIS_GOSTERIM_MS - (performance.now() - baslangic);
    if (kalan > 0) await bekle(kalan);
    if (durum.oyun !== o) return;
    kutu.classList.remove('yanlis');
    o.kilit = false;
    insaGoster(false);
    siradakiniIsaretle();
    sayacKur(ZIPLAMA_ONCESI_MS + 200);
  }

  async function yerlestir(tas, kutu, h) {
    const o = durum.oyun;
    o.no += 1;
    const no = o.no;
    ilerlemeYaz(h, !tas.classList.contains('ipucu-zipla'));
    tas.classList.remove('ipucu-zipla');
    tas.style.transform = '';
    tas.classList.add('kullanildi');
    kutu.className = `kutu dolu ${tur(h)}`;
    kutu.textContent = goster(h);
    kutu.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
    window.Efekt.tik();
    window.Gorsel.kalpler($('#portre'), 3);
    setTimeout(window.Efekt.kalp, 250);
    const kelimeBitti = o.sira + 1 >= o.harfler.length || o.harfler[o.sira + 1] === ' ';
    if (kelimeBitti) kelimeTamam(kutu.parentElement);
    o.sira = bosluklariAtla(o.harfler, o.sira + 1);
    const bitti = o.sira >= o.harfler.length;
    o.bitti = bitti;
    insaGoster(true);
    siradakiniIsaretle();

    const yazilan = o.harfler.slice(0, o.sira).join('').trim();
    const parca = [...yazilan].length === 1 ? harfSesi(yazilan) : KUCUK(yazilan);
    const bilgi = window.HARF_BUL.get(h);
    window.Konus.sustur();
    if (durum.ayar.donusum && bilgi) {
      window.Konus.soyle(harfVeKelime(h));
      await donustur(h, kutu);
    } else {
      await window.Konus.soyle(harfSesi(h));
    }
    if (durum.oyun !== o || o.no !== no) return;
    await window.Konus.soyle(parca);
    if (durum.oyun !== o || o.no !== no) return;
    if (bitti) kutla(); else sayacKur();
  }

  /** İki kelimeli isimde her kelime tamamlanınca yanına yeşil tik oturur. */
  function kelimeTamam(kelimeKutusu) {
    if (!kelimeKutusu || kelimeKutusu.querySelector('.tik')) return;
    const tik = el('span', { className: 'tik', textContent: '✓' });
    kelimeKutusu.append(tik);
    kelimeKutusu.classList.add('tamam');
    setTimeout(window.Efekt.tikSesi, 200);
  }

  function harfiTani(h, kaynak) {
    const bilgi = window.HARF_BUL.get(h);
    window.Konus.sustur();
    window.Konus.soyle(harfVeKelime(h));
    kaynak.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg) scale(1.1)' }, { transform: 'rotate(8deg)' }, { transform: 'none' }], { duration: 420 });
    if (bilgi) donustur(h, kaynak);
  }

  /* ---------- harf → karakter dönüşümü ---------- */
  function vurguluKelime(kelime, h) {
    const harfler = [...kelime];
    const i = harfler.findIndex((x) => BUYUK(x) === h);
    return harfler.map((x, j) => el('span', { className: j === i ? `vurgu ${tur(h)}` : '', textContent: goster(x) }));
  }

  /** Emoji karakter: harf bulanıklaşıp kaybolur, yerine resim belirir. */
  async function emojiDonusumu(harf, resim, kelime, isilti, canli) {
    window.Efekt.sihir();
    window.Gorsel.isilti(isilti);
    harf.animate([{ transform: 'scale(1)', filter: 'blur(0)', opacity: 1 }, { transform: 'scale(1.5) rotate(8deg)', filter: 'blur(16px)', opacity: 0 }],
      { duration: 520, easing: 'ease-in', fill: 'both' });
    kelime.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 520, fill: 'both' });
    await resim.animate([
      { transform: 'scale(.2) rotate(-25deg)', filter: 'blur(16px)', opacity: 0 },
      { transform: 'scale(1.18) rotate(6deg)', filter: 'blur(0)', opacity: 1, offset: 0.7 },
      { transform: 'none', filter: 'blur(0)', opacity: 1 },
    ], { duration: 720, delay: 150, easing: 'ease-out', fill: 'both' }).finished;
    if (canli()) await bekle(950);
  }

  async function donustur(h, kaynak, { kac = false } = {}) {
    const bilgi = window.HARF_BUL.get(h);
    if (!bilgi) return;
    const no = ++durum.donusumNo;
    const canli = () => no === durum.donusumNo;
    const cizim = window.CIZIMLER && window.CIZIMLER[h];
    const sahne = $('#sahne');
    const svg = cizim ? cizim.olustur() : null;
    const harf = cizim
      ? el('div', { className: 'd-cizim' }, [svg])
      : el('div', { className: `d-harf ${tur(h)}`, textContent: goster(h) });
    const resim = cizim ? null : el('div', { className: 'd-resim' }, [el('span', { textContent: bilgi.resim })]);
    const kelime = el('div', { className: 'd-kelime' }, vurguluKelime(bilgi.kelime, h));
    const isilti = el('div', { className: 'd-isilti' });
    const grup = el('div', { className: 'd-grup' }, [isilti, harf, resim, kelime]);
    sahne.replaceChildren(grup);
    sahne.classList.add('acik');
    const k = kaynak.getBoundingClientRect();
    const g = harf.getBoundingClientRect();
    const dx = k.left + k.width / 2 - (g.left + g.width / 2);
    const dy = k.top + k.height / 2 - (g.top + g.height / 2);
    try {
      await harf.animate([{ transform: `translate(${dx}px, ${dy}px) scale(.3)`, opacity: 0.5 }, { transform: 'none', opacity: 1 }],
        { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'both' }).finished;
      if (!canli()) return;
      if (cizim) {
        let kelimeAcik = false;
        const kelimeGoster = () => {
          if (kelimeAcik) return Promise.resolve();
          kelimeAcik = true;
          return kelime.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 420, fill: 'both' }).finished;
        };
        await cizim.oynat(svg, { sihir: () => { window.Efekt.sihir(); window.Gorsel.isilti(isilti); }, kelime: kelimeGoster });
        if (!canli()) return;
        await kelimeGoster();
        await bekle(900);
      } else {
        await emojiDonusumu(harf, resim, kelime, isilti, canli);
      }
      if (!canli()) return;
      if (kac) {
        kelime.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
        window.Efekt.yanlis();
        await window.Gorsel.kacis(cizim ? harf : resim, 7);
        if (!canli()) return;
      } else if (cizim && cizim.cikis) {
        kelime.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 900, fill: 'both' });
        await cizim.cikis(svg);
        return;
      }
      await grup.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.15)`, opacity: 0 }],
        { duration: 420, easing: 'ease-in', fill: 'both' }).finished;
    } catch {
      /* ekran değişince animasyon iptal olur; sorun değil */
    } finally {
      if (canli()) { sahne.classList.remove('acik'); sahne.replaceChildren(); }
    }
  }

  /* ---------- yardım geri sayımı ---------- */
  function dogruTas() {
    const o = durum.oyun;
    if (!o) return null;
    return [...document.querySelectorAll('#tepsi .tas:not(.kullanildi)')].find((t) => t.dataset.h === o.harfler[o.sira]) || null;
  }

  function sayacDurdur() {
    const o = durum.oyun;
    if (!o) return;
    (o.zamanlar || []).forEach(clearTimeout);
    o.zamanlar = [];
    if (o.sayacAnim) o.sayacAnim.cancel();
    $('#sayac').classList.remove('acik');
  }

  /** Süre biterken doğru taş zıplar; bitince karakterine dönüşüp ekranda kaçar. */
  function sayacKur(sureMs = durum.ayar.yardim * 1000) {
    sayacDurdur();
    const o = durum.oyun;
    if (!o || o.bitti || !durum.ayar.yardim) return;
    const sure = Math.max(sureMs, 1200);
    $('#sayac').classList.add('acik');
    o.sayacAnim = $('#sayac i').animate([
      { transform: 'scaleX(1)', background: '#2EC46B' },
      { transform: 'scaleX(.35)', background: '#FFB703', offset: 0.7 },
      { transform: 'scaleX(0)', background: '#E0363A' },
    ], { duration: sure, fill: 'forwards' });
    o.zamanlar = [
      setTimeout(() => { const t = dogruTas(); if (t) t.classList.add('ipucu-zipla'); }, Math.max(0, sure - ZIPLAMA_ONCESI_MS)),
      setTimeout(yardimEt, sure),
    ];
  }

  async function yardimEt() {
    const o = durum.oyun;
    const tas = dogruTas();
    if (!o || o.bitti || !tas) return;
    $('#sayac').classList.remove('acik');
    tas.classList.add('ipucu-zipla');
    const h = tas.dataset.h;
    window.Konus.sustur();
    window.Konus.soyle(harfVeKelime(h));
    await donustur(h, tas, { kac: true });
    if (durum.oyun === o && !o.bitti) sayacKur(durum.ayar.yardim * 1500);
  }

  /* ---------- ilerleme (yalnızca bu cihazda) ---------- */
  function ilerlemeYaz(h, kendiBildi) {
    const eski = durum.ilerleme[h] || { dogru: 0, yanlis: 0, yardimla: 0 };
    let yeni;
    if (kendiBildi === false) yeni = { ...eski, yanlis: eski.yanlis + 1 };
    else if (kendiBildi) yeni = { ...eski, dogru: eski.dogru + 1 };
    else yeni = { ...eski, yardimla: (eski.yardimla || 0) + 1 };
    durum.ilerleme = { ...durum.ilerleme, [h]: yeni };
    kaydet('ilerleme', durum.ilerleme);
  }

  function ilerlemeOzeti() {
    const ogrendi = window.HARFLER.filter((x) => ((durum.ilerleme[x.h] || {}).dogru || 0) >= OGRENDI_ESIGI).map((x) => goster(x.h));
    const isim = Object.values(durum.yildiz).reduce((a, b) => a + b, 0);
    return `Öğrendiği harfler (${ogrendi.length}/29, yardımsız ${OGRENDI_ESIGI} kez): ${ogrendi.join(' ') || 'henüz yok'} · Tamamladığı isim: ${isim}`;
  }

  /* ---------- ödül ---------- */
  function kutla() {
    const o = durum.oyun;
    sayacDurdur();
    window.Efekt.tac();
    window.Gorsel.konfeti();
    window.Gorsel.tacTak($('#tac'));
    window.Gorsel.kalpler($('#portre'), 8);
    $('#portre').animate([{ transform: 'rotate(-2deg) scale(1)' }, { transform: 'rotate(3deg) scale(1.08)' }, { transform: 'rotate(-2deg) scale(1)' }], { duration: 700, iterations: 2 });
    $('#bitti-ad').replaceChildren(renkliAd(o.kisi.name));
    $('#bitti').hidden = false;
    durum.yildiz = { ...durum.yildiz, [o.kisi.id]: (durum.yildiz[o.kisi.id] || 0) + 1 };
    kaydet('yildiz', durum.yildiz);
    window.Konus.soyle('Harika! Aferin sana!');
  }

  /* ---------- harfler ekranı ---------- */
  function harflerAc() {
    window.Efekt.ac();
    const aileHarfleri = new Set(durum.aile.flatMap((k) => [...k.name]));
    const yeni = window.HARFLER.filter((x) => !aileHarfleri.has(x.h));
    const bilinen = window.HARFLER.filter((x) => aileHarfleri.has(x.h));
    const dugme = (x) => {
      const b = el('button', { className: `tas harf-tas ${tur(x.h)}`, type: 'button', textContent: goster(x.h) });
      b.addEventListener('click', () => harfiTani(x.h, b));
      return b;
    };
    $('#yeni-harfler').replaceChildren(...yeni.map(dugme));
    $('#aile-harfleri').replaceChildren(...bilinen.map(dugme));
    $('#yeni-baslik').hidden = yeni.length === 0;
    ekranAc('harfler');
  }

  function evDon() {
    window.Konus.sustur();
    sayacDurdur();
    durum.oyun = null;
    durum.donusumNo += 1;
    $('#sahne').classList.remove('acik');
    $('#sahne').replaceChildren();
    anaSayfa();
    ekranAc('ana');
  }

  /* ---------- ebeveyn ayarları ---------- */
  function disliBagla() {
    const d = $('#disli');
    let zaman = null;
    const dur = () => { clearTimeout(zaman); zaman = null; d.classList.remove('tutuluyor'); };
    d.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      d.classList.add('tutuluyor');
      zaman = setTimeout(() => { dur(); ayarlarAc(); }, BASILI_TUT_MS);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ad) => d.addEventListener(ad, () => {
      if (zaman) bildir('Ayarlar için dişliye basılı tut');
      dur();
    }));
  }

  function fotoOku(dosya) {
    return new Promise((resolve, reject) => {
      if (!dosya || !String(dosya.type).startsWith('image/')) { reject(new Error('Bu dosya bir fotoğraf değil')); return; }
      const adres = URL.createObjectURL(dosya);
      const img = new Image();
      img.onload = () => {
        const kenar = Math.min(img.naturalWidth, img.naturalHeight);
        const c = el('canvas', { width: FOTO_BOYUT, height: FOTO_BOYUT });
        c.getContext('2d').drawImage(img, (img.naturalWidth - kenar) / 2, (img.naturalHeight - kenar) / 2, kenar, kenar, 0, 0, FOTO_BOYUT, FOTO_BOYUT);
        URL.revokeObjectURL(adres);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(adres); reject(new Error('Fotoğraf açılamadı')); };
      img.src = adres;
    });
  }

  async function aileKaydet(yeni) {
    durum.aile = yeni;
    await kaydet('aile', yeni);
  }

  function fotoSecici(sinif, gorunum, secilince) {
    const etiket = el('label', { className: sinif });
    const girdi = el('input', { type: 'file', accept: 'image/*', className: 'gizli' });
    girdi.addEventListener('change', async () => {
      const dosya = girdi.files && girdi.files[0];
      if (!dosya) return;
      try { await secilince(await fotoOku(dosya)); } catch (hata) { bildir(hata.message); }
      girdi.value = '';
    });
    etiket.append(gorunum, girdi);
    return etiket;
  }

  function adGirdisi(deger) {
    const g = el('input', { type: 'text', value: deger, maxLength: EN_UZUN_AD, className: 'ad-girdi', placeholder: 'İSİM' });
    g.setAttribute('autocapitalize', 'characters');
    g.setAttribute('autocomplete', 'off');
    g.setAttribute('spellcheck', 'false');
    return g;
  }

  function kisiSatiri(kisi, i) {
    const satir = el('li', { className: 'kisi-satir' });
    const foto = fotoSecici('kucuk-resim', yuz(kisi, 'kucuk-yuz'), async (veri) => {
      await aileKaydet(durum.aile.map((x) => (x.id === kisi.id ? { ...x, foto: veri } : x)));
      ayarlariCiz();
    });
    const ad = adGirdisi(kisi.name);
    ad.addEventListener('change', async () => {
      const v = adiDuzelt(ad.value);
      if (!v) { bildir('İsim yalnızca Türkçe harflerden oluşmalı (en çok 24)'); ad.value = kisi.name; return; }
      ad.value = v;
      await aileKaydet(durum.aile.map((x) => (x.id === kisi.id ? { ...x, name: v } : x)));
    });
    const rol = el('input', { type: 'text', value: kisi.rol || '', maxLength: 16, className: 'rol-girdi', placeholder: 'Yakınlık' });
    rol.addEventListener('change', async () => {
      const v = rol.value.trim().slice(0, 16);
      await aileKaydet(durum.aile.map((x) => (x.id === kisi.id ? { ...x, rol: v } : x)));
    });
    const yukari = el('button', { type: 'button', className: 'simge-dugme', textContent: '↑', disabled: i === 0, title: 'Yukarı taşı' });
    yukari.addEventListener('click', async () => {
      const yeni = [...durum.aile];
      [yeni[i - 1], yeni[i]] = [yeni[i], yeni[i - 1]];
      await aileKaydet(yeni);
      ayarlariCiz();
    });
    const sil = el('button', { type: 'button', className: 'simge-dugme tehlike', textContent: '🗑', title: 'Sil' });
    sil.addEventListener('click', async () => {
      if (!window.confirm(`${kisi.name} silinsin mi?`)) return;
      await aileKaydet(durum.aile.filter((x) => x.id !== kisi.id));
      ayarlariCiz();
    });
    satir.append(foto, el('div', { className: 'kisi-adlar' }, [ad, rol]), yukari, sil);
    return satir;
  }

  let bekleyenFoto = null;
  function ayarlariCiz() {
    $('#kisi-listesi').replaceChildren(...durum.aile.map(kisiSatiri));
    const a = durum.ayar;
    $('#ayar-kucuk').checked = a.kucukHarf;
    $('#ayar-ipucu').checked = a.ipucu;
    $('#ayar-donusum').checked = a.donusum;
    $('#ayar-fazla').value = String(a.fazla);
    $('#ayar-fazla-deger').textContent = String(a.fazla);
    $('#ayar-yardim').value = String(a.yardim);
    $('#ayar-yardim-deger').textContent = a.yardim ? `${a.yardim} sn` : 'kapalı';
    $('#ilerleme-ozet').textContent = ilerlemeOzeti();
    $('#ses-durumu').textContent = window.Konus.turkceVar()
      ? 'Türkçe ses hazır.'
      : 'Bu cihazda Türkçe ses bulunamadı: Ayarlar › Erişilebilirlik › Seslendirilen İçerik › Sesler › Türkçe.';
  }

  function ayarlarAc() {
    bekleyenFoto = null;
    $('#yeni-foto-gorunum').replaceWith(el('span', { id: 'yeni-foto-gorunum', className: 'kucuk-yuz yuz-emoji', textContent: '📷' }));
    $('#yeni-ad').value = '';
    $('#yeni-rol').value = '';
    ayarlariCiz();
    $('#ayarlar').showModal();
  }

  function ayarlariBagla() {
    const degistir = (yama) => { durum.ayar = { ...durum.ayar, ...yama }; kaydet('ayar', durum.ayar); };
    $('#ayar-kucuk').addEventListener('change', (e) => degistir({ kucukHarf: e.target.checked }));
    $('#ayar-ipucu').addEventListener('change', (e) => degistir({ ipucu: e.target.checked }));
    $('#ayar-donusum').addEventListener('change', (e) => degistir({ donusum: e.target.checked }));
    $('#ayar-fazla').addEventListener('input', (e) => {
      const n = Math.max(0, Math.min(4, Number(e.target.value) || 0));
      $('#ayar-fazla-deger').textContent = String(n);
      degistir({ fazla: n });
    });
    $('#ayar-yardim').addEventListener('input', (e) => {
      const n = Math.max(0, Math.min(30, Number(e.target.value) || 0));
      $('#ayar-yardim-deger').textContent = n ? `${n} sn` : 'kapalı';
      degistir({ yardim: n });
    });
    const fotoKap = $('#yeni-foto');
    fotoKap.replaceWith(fotoSecici('kucuk-resim yeni', el('span', { id: 'yeni-foto-gorunum', className: 'kucuk-yuz yuz-emoji', textContent: '📷' }), async (veri) => {
      bekleyenFoto = veri;
      $('#yeni-foto-gorunum').replaceWith(el('img', { id: 'yeni-foto-gorunum', className: 'kucuk-yuz', src: veri, alt: '' }));
    }));
    $('#yeni-ekle').addEventListener('click', async () => {
      const ad = adiDuzelt($('#yeni-ad').value);
      if (!ad) { bildir('İsim yalnızca Türkçe harflerden oluşmalı (en çok 24)'); return; }
      const kisi = {
        id: yeniKimlik(), name: ad, rol: $('#yeni-rol').value.trim().slice(0, 16),
        emoji: YEDEK_YUZLER[durum.aile.length % YEDEK_YUZLER.length], foto: bekleyenFoto,
      };
      await aileKaydet([...durum.aile, kisi]);
      ayarlarAc();
    });
    $('#toplu-ekle').addEventListener('click', async () => {
      const satirlar = $('#toplu-metin').value.split('\n').map((s) => s.trim()).filter(Boolean);
      const yeniler = [];
      const hatali = [];
      for (const satir of satirlar) {
        const [adHam, ...rolParca] = satir.split(/\s[-–,]\s|\s*[–,]\s*/);
        const ad = adiDuzelt(adHam);
        if (!ad) { hatali.push(satir); continue; }
        yeniler.push({
          id: yeniKimlik(), name: ad, rol: rolParca.join(' ').trim().slice(0, 16),
          emoji: YEDEK_YUZLER[(durum.aile.length + yeniler.length) % YEDEK_YUZLER.length], foto: null,
        });
      }
      if (yeniler.length) await aileKaydet([...durum.aile, ...yeniler]);
      $('#toplu-metin').value = hatali.join('\n');
      bildir(hatali.length ? `${yeniler.length} kişi eklendi; ${hatali.length} satır okunamadı (kutuda bıraktım).` : `${yeniler.length} kişi eklendi.`);
      ayarlariCiz();
    });
    $('#ayarlar').addEventListener('close', anaSayfa);
  }

  /* ---------- açılış ---------- */
  async function yukle() {
    try {
      const [ayar, aile, yildiz, ilerleme] = await Promise.all(['ayar', 'aile', 'yildiz', 'ilerleme'].map((k) => window.Depo.oku(k)));
      if (ilerleme && typeof ilerleme === 'object') durum.ilerleme = ilerleme;
      if (ayar && typeof ayar === 'object') durum.ayar = { ...VARSAYILAN_AYAR, ...ayar };
      if (Array.isArray(aile)) durum.aile = aile.filter((k) => k && typeof k.name === 'string' && adiDuzelt(k.name));
      if (yildiz && typeof yildiz === 'object') durum.yildiz = yildiz;
    } catch (hata) {
      bildir(`Kayıtlar okunamadı, varsayılanlar açıldı (${hata.message || hata})`);
    }
  }

  async function basla() {
    await yukle();
    anaSayfa();
    disliBagla();
    ayarlariBagla();
    document.querySelectorAll('[data-geri]').forEach((b) => b.addEventListener('click', evDon));
    $('#tekrar').addEventListener('click', () => durum.oyun && oyunBaslat(durum.oyun.kisi));
    window.addEventListener('resize', olcule);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    window.Konus.kayitlariYukle();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => false);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => bildir('Çevrimdışı mod kurulamadı; internetle çalışır.'));
    }
  }

  basla();
})();
