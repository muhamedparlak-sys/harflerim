/*
 * Oyun modları (isim yazmanın yanında):
 *   Harf Avı       — sesi dinle, doğru harfli balona dokun (GCompris "Click on a letter" fikri).
 *   Canavarı Besle — canavarın düşünce balonunda istediği şeyin resmi var (ör. martı) ve ses
 *                    "mmm… martı" der; çocuk o kelimenin ilk harfini ağzına sürükler. Beslendikçe büyür
 *                    ve değişir (Feed the Monster'daki büyüyen evcil canavar fikri). Büyüme cihazda kalır.
 *   Resim Bilmecesi — tersten: ismin harfleri yerine resimler dizilir (ANNE → ağ, nota, nota, eşek);
 *                    çocuk ilk sesleri bulup harfleri altlarına koyar, sonunda kişinin fotoğrafı açılır.
 *   Çıkartma Albümü — bir harfi kendi başına 3 kez bulunca o harfin karakteri albüme yapışır.
 * Sorulan harfler uyarlanır: aile adlarındaki harfler önce; çok yanılınan harf daha sık, iyi bilinen daha seyrek.
 */
window.Oyunlar = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);
  const SORU_SAYISI = 6;
  const AV_SECENEK = 4;
  const BESLE_SECENEK = 3;
  const YENI_HARF_ADIMI = 3;
  const EVRE_ESIKLERI = [0, 10, 25, 50, 90];
  const EVRE_RENGI = ['#9BE15D', '#4CC9F0', '#B388EB', '#FF8FA3', '#FFB703'];
  const BALON_RENGI = ['#FF6F61', '#FFB703', '#2EC4B6', '#9B5DE5', '#4CC9F0', '#F15BB5'];

  let mod = null;
  let modNo = 0;
  let canavar = { yem: 0 };
  let suruk = null;

  (async () => {
    try {
      const c = await window.Depo.oku('canavar');
      if (c && Number.isFinite(c.yem) && c.yem >= 0) canavar = { yem: Math.floor(c.yem) };
    } catch {
      /* kayıt okunamazsa canavar baştan başlar; oyun yine çalışır */
    }
  })();

  /* ---------- hangi harf sorulsun ---------- */
  const tumHarfler = () => window.HARFLER.map((x) => x.h);
  const ogrenildi = (h) => ((H().ilerleme()[h] || {}).dogru || 0) >= H().OGRENDI_ESIGI;

  /** Aile harfleri; onların hepsi öğrenildiyse sıradaki birkaç yeni harf de katılır. */
  function havuz() {
    const aile = [...H().aileHarfleri()];
    if (aile.length < AV_SECENEK) return tumHarfler();
    if (!aile.every(ogrenildi)) return aile;
    const yeni = tumHarfler().filter((h) => !aile.includes(h));
    return [...aile, ...yeni.filter(ogrenildi), ...yeni.filter((h) => !ogrenildi(h)).slice(0, YENI_HARF_ADIMI)];
  }

  function agirlik(h) {
    const p = H().ilerleme()[h] || {};
    return (1 + 2 * (p.yanlis || 0) + (p.yardimla || 0)) / (1 + (p.dogru || 0));
  }

  function harfSec(liste, onceki) {
    const adaylar = liste.length > 1 ? liste.filter((h) => h !== onceki) : liste;
    const toplam = adaylar.reduce((t, h) => t + agirlik(h), 0);
    let r = Math.random() * toplam;
    for (const h of adaylar) { r -= agirlik(h); if (r <= 0) return h; }
    return adaylar[adaylar.length - 1];
  }

  function secenekler(hedef, adet, liste) {
    const digerleri = H().karistir([...new Set([...liste, ...tumHarfler()])].filter((h) => h !== hedef));
    const yakin = digerleri.filter((h) => liste.includes(h));
    const uzak = digerleri.filter((h) => !liste.includes(h));
    return H().karistir([hedef, ...[...yakin, ...uzak].slice(0, adet - 1)]);
  }

  /* ---------- ortak ---------- */
  const canli = (m) => m && m === mod;

  function noktalar(kap, m) {
    kap.replaceChildren(...Array.from({ length: SORU_SAYISI }, (_, i) =>
      H().el('i', { className: i < m.soru ? 'dolu' : '' })));
  }

  function sor(m) {
    window.Konus.sustur();
    if (m.soru === 0 && !m.anlatildi) { m.anlatildi = true; window.Konus.soyle('Dinle! Bu sesi söyleyen balonu patlat.'); }
    window.Konus.soyle(H().harfSesi(m.hedef));
  }

  function modBitti(m, yeniden) {
    if (!canli(m)) return;
    window.Efekt.tac();
    window.Gorsel.konfeti();
    window.Konus.soyle('Harika! Aferin sana!');
    const kutu = $('#mod-bitti');
    $('#mod-bitti-tekrar').onclick = () => { kutu.hidden = true; yeniden(); };
    kutu.hidden = false;
  }

  /** Doğru cevapta: ilerlemeyi yaz (ilk denemede bildiyse "kendi bildi"). */
  const dogruYaz = (m) => H().ilerlemeYaz(m.hedef, m.hata === 0 ? true : null);

  function yanlisYaz(m) {
    if (m.hata === 0) H().ilerlemeYaz(m.hedef, false);
    m.hata += 1;
  }

  /* ---------- Harf Avı ---------- */
  function avBasla() {
    window.Efekt.ac();
    const m = { tur: 'av', no: ++modNo, soru: 0, liste: havuz(), hedef: null, hata: 0, kilit: false };
    mod = m;
    $('#mod-bitti').hidden = true;
    H().ekranAc('av');
    $('#av-tekrar').onclick = () => { if (canli(m) && m.hedef) sor(m); };
    avSoru(m);
  }

  function avSoru(m) {
    if (!canli(m)) return;
    m.hedef = harfSec(m.liste, m.hedef);
    m.hata = 0;
    m.kilit = false;
    noktalar($('#av-ilerleme'), m);
    const renkler = H().karistir(BALON_RENGI);
    $('#av-alan').replaceChildren(...secenekler(m.hedef, AV_SECENEK, m.liste).map((h, i) => {
      const b = H().el('button', { className: 'balon', type: 'button' }, [H().el('span', { className: `balon-harf ${H().tur(h)}`, textContent: H().goster(h) })]);
      b.style.setProperty('--renk', renkler[i % renkler.length]);
      b.style.setProperty('--x', `${4 + i * (92 / AV_SECENEK)}%`);
      b.style.setProperty('--y', `${10 + Math.round(Math.random() * 22)}%`);
      b.style.setProperty('--gecikme', `${i * 110}ms`);
      b.style.setProperty('--salla', `${2.6 + Math.random()}s`);
      b.addEventListener('click', () => avSec(m, h, b));
      return b;
    }));
    sor(m);
  }

  async function avSec(m, h, b) {
    if (!canli(m) || m.kilit) return;
    if (h !== m.hedef) {
      yanlisYaz(m);
      window.Efekt.yanlis();
      b.animate([{ translate: '0 0' }, { translate: '-14px 0' }, { translate: '14px 0' }, { translate: '0 0' }], { duration: 360, iterations: 2 });
      window.Konus.sustur();
      window.Konus.soyle(H().harfSesi(h));
      window.Konus.soyle(H().harfSesi(m.hedef));
      return;
    }
    m.kilit = true;
    dogruYaz(m);
    window.Efekt.karakter('pop');
    window.Gorsel.kalpler(b, 5);
    b.classList.add('patla');
    for (const diger of $('#av-alan').children) if (diger !== b) diger.classList.add('uc');
    window.Konus.sustur();
    H().harfVeKelimeSoyle(h);
    await H().donustur(h, b);
    if (!canli(m)) return;
    m.soru += 1;
    if (m.soru >= SORU_SAYISI) { noktalar($('#av-ilerleme'), m); modBitti(m, avBasla); return; }
    avSoru(m);
  }

  /* ---------- Canavarı Besle ---------- */
  const evre = (yem) => EVRE_ESIKLERI.reduce((e, esik, i) => (yem >= esik ? i : e), 0);

  function canavarSvg(e) {
    const renk = EVRE_RENGI[e];
    const kanat = e >= 3 ? `<path d="M44 120 Q-6 70 6 150 Q20 140 44 150Z M196 120 Q246 70 234 150 Q220 140 196 150Z" fill="#fff" stroke="${renk}" stroke-width="5"/>` : '';
    const boynuz = e >= 1 ? '<path d="M78 66 L62 18 L100 56Z M162 66 L178 18 L140 56Z" fill="#FFD23F" stroke="#E09F00" stroke-width="3" stroke-linejoin="round"/>' : '';
    const benek = e >= 2 ? '<g fill="#fff" opacity=".45"><circle cx="70" cy="180" r="9"/><circle cx="172" cy="186" r="11"/><circle cx="186" cy="140" r="6"/><circle cx="58" cy="140" r="6"/></g>' : '';
    const tac = e >= 4 ? '<path d="M88 40 L96 14 L110 32 L120 6 L130 32 L144 14 L152 40Z" fill="#FFD23F" stroke="#E09F00" stroke-width="3" stroke-linejoin="round"/>' : '';
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 240 240');
    s.setAttribute('class', `canavar-svg evre-${e}`);
    s.innerHTML = `${kanat}${boynuz}
      <ellipse cx="86" cy="222" rx="22" ry="10" fill="${renk}" stroke="#2B2D42" stroke-width="3"/><ellipse cx="154" cy="222" rx="22" ry="10" fill="${renk}" stroke="#2B2D42" stroke-width="3"/>
      <path d="M40 150 Q30 60 120 52 Q210 60 200 150 Q204 222 120 222 Q36 222 40 150Z" fill="${renk}" stroke="#2B2D42" stroke-width="4"/>
      ${benek}${tac}
      <g class="cv-goz"><circle cx="92" cy="108" r="22" fill="#fff" stroke="#2B2D42" stroke-width="3"/><circle cx="148" cy="108" r="22" fill="#fff" stroke="#2B2D42" stroke-width="3"/>
        <circle class="cv-bebek" cx="96" cy="112" r="10" fill="#2B2D42"/><circle class="cv-bebek" cx="152" cy="112" r="10" fill="#2B2D42"/></g>
      <g class="cv-agiz"><ellipse cx="120" cy="164" rx="36" ry="12" fill="#7A1E2C" stroke="#2B2D42" stroke-width="3"/>
        <path d="M100 154 L106 162 L112 154Z M128 154 L134 162 L140 154Z" fill="#fff"/><ellipse cx="120" cy="170" rx="16" ry="5" fill="#FF6F91"/></g>
      <path d="M40 150 Q20 150 18 132 M200 150 Q220 150 222 132" fill="none" stroke="#2B2D42" stroke-width="5" stroke-linecap="round"/>`;
    return s;
  }

  function canavarCiz() {
    const e = evre(canavar.yem);
    $('#canavar').replaceChildren(canavarSvg(e));
    const sonraki = EVRE_ESIKLERI[e + 1];
    const oran = sonraki ? (canavar.yem - EVRE_ESIKLERI[e]) / (sonraki - EVRE_ESIKLERI[e]) : 1;
    $('#canavar-cubuk').style.setProperty('--oran', `${Math.round(oran * 100)}%`);
    $('#canavar-yem').textContent = `🍎 ${canavar.yem}`;
  }

  function besleBasla() {
    window.Efekt.ac();
    const m = { tur: 'besle', no: ++modNo, soru: 0, liste: havuz(), hedef: null, hata: 0, kilit: false };
    mod = m;
    $('#mod-bitti').hidden = true;
    H().ekranAc('besle');
    canavarCiz();
    $('#besle-tekrar').onclick = () => { if (canli(m) && m.hedef) besleSor(m); };
    besleSoru(m);
  }

  function besleSoru(m) {
    if (!canli(m)) return;
    m.hedef = harfSec(m.liste, m.hedef);
    m.hata = 0;
    m.kilit = false;
    noktalar($('#besle-ilerleme'), m);
    $('#besle-tepsi').replaceChildren(...secenekler(m.hedef, BESLE_SECENEK, m.liste).map((h) => {
      const t = H().el('button', { className: `tas yem-tas kurabiye ${H().tur(h)}`, type: 'button', textContent: H().goster(h) });
      t.dataset.h = h;
      t.addEventListener('pointerdown', (e) => surukBasla(e, m, t, {
        hareket: (x, y) => agizAc(canavarUstunde(x, y)),
        birak: (x, y) => (canavarUstunde(x, y) ? besle(m, t) : geriGonder(t)),
      }));
      return t;
    }));
    $('#canavar').animate([{ transform: 'none' }, { transform: 'translateY(-14px) scale(1.04)' }, { transform: 'none' }], { duration: 500 });
    istekGoster(m);
    if (m.soru === 0) window.Konus.soyle('Canavar acıktı! Balondaki resmin ilk harfini ona ver.');
    window.Konus.soyle(H().harfSesi(m.hedef));
    window.Konus.soyle(window.HARF_BUL.get(m.hedef).kelime.toLocaleLowerCase('tr-TR'));
  }

  /** Düşünce balonu: hedef harfin karakteri, harf hâli görünmeden (çizim bitince açılır). */
  function istekGoster(m) {
    const balon = $('#canavar-istek');
    const cizim = window.CIZIMLER[m.hedef];
    const bilgi = window.HARF_BUL.get(m.hedef);
    if (!cizim) { balon.replaceChildren(H().el('span', { className: 'istek-yazi', textContent: bilgi.resim })); return; }
    const svg = cizim.olustur();
    const kap = H().el('div', { className: 'istek-resim hazirlaniyor' }, [svg]);
    balon.replaceChildren(H().el('span', { className: 'istek-dusun', textContent: '…' }), kap);
    cizim.oynat(svg, { kal: true, sessiz: true }).catch(() => {}).finally(() => {
      if (!canli(m) || !kap.isConnected) return;
      kap.classList.remove('hazirlaniyor');
      balon.querySelector('.istek-dusun')?.remove();
    });
  }

  /** Canavar modunda tekrar: ses + kelime ("mmm… martı"). */
  function besleSor(m) {
    window.Konus.sustur();
    window.Konus.soyle(H().harfSesi(m.hedef));
    window.Konus.soyle(window.HARF_BUL.get(m.hedef).kelime.toLocaleLowerCase('tr-TR'));
  }

  function agizAc(acik) { $('#canavar').classList.toggle('ac', acik); }

  function canavarUstunde(x, y) {
    const r = $('#canavar').getBoundingClientRect();
    const pay = r.width * 0.12;
    return x > r.left - pay && x < r.right + pay && y > r.top - pay && y < r.bottom + pay;
  }

  /**
   * Ortak sürükleme (canavar ve resim bilmecesi). Olaylar pencereye bağlı; iPad bazen bırakma
   * yerine "iptal" gönderir, sürüklenmişse son konumunda bırakılmış sayılır.
   *   olay.hareket(x, y)  sürüklerken   olay.birak(x, y)  bırakınca   dokununca harfin sesi çalar
   */
  function surukBasla(e, m, t, olay) {
    if (!canli(m) || m.kilit) return;
    if (suruk) { geriGonder(suruk.t); suruk = null; }
    e.preventDefault();
    try { t.setPointerCapture(e.pointerId); } catch { /* yakalama desteklenmiyorsa pencere olayları yeter */ }
    suruk = { m, t, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, hareket: false };
    const oyna = (ev) => {
      if (!suruk || ev.pointerId !== suruk.id) return;
      suruk.x = ev.clientX;
      suruk.y = ev.clientY;
      const dx = ev.clientX - suruk.x0;
      const dy = ev.clientY - suruk.y0;
      if (!suruk.hareket && Math.hypot(dx, dy) < 8) return;
      suruk.hareket = true;
      t.classList.add('suruklenen');
      t.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
      if (olay.hareket) olay.hareket(ev.clientX, ev.clientY);
    };
    const bitir = (ev) => {
      if (!suruk || ev.pointerId !== suruk.id) return;
      window.removeEventListener('pointermove', oyna);
      window.removeEventListener('pointerup', bitir);
      window.removeEventListener('pointercancel', bitir);
      const s = suruk;
      suruk = null;
      if (olay.hareket) olay.hareket(-1, -1);
      if (!s.hareket) { if (ev.type === 'pointerup') { window.Konus.sustur(); window.Konus.soyle(H().harfSesi(t.dataset.h)); } return; }
      olay.birak(s.x, s.y);
    };
    window.addEventListener('pointermove', oyna);
    window.addEventListener('pointerup', bitir);
    window.addEventListener('pointercancel', bitir);
  }


  async function geriGonder(t) {
    const simdi = t.style.transform || 'none';
    t.style.transform = '';
    t.classList.remove('suruklenen');
    await t.animate([{ transform: simdi }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.3,1.4,.5,1)' }).finished;
  }

  /** Kurabiyeyi canavarın ağzına götürür; dönen değer ağızdaki konum (transform). */
  async function agzaGotur(t, cv, kucul) {
    const tr = t.getBoundingClientRect();
    const cr = cv.getBoundingClientRect();
    const simdi = t.style.transform || 'none';
    const r = t.style.transform.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/);
    const [dx, dy] = r ? [Number(r[1]), Number(r[2])] : [0, 0];
    const agiz = `translate(${dx + cr.left + cr.width / 2 - (tr.left + tr.width / 2)}px, ${dy + cr.top + cr.height * 0.68 - (tr.top + tr.height / 2)}px) scale(${kucul})`;
    agizAc(true);
    await t.animate([{ transform: simdi }, { transform: agiz }], { duration: 360, easing: 'ease-in', fill: 'forwards' }).finished;
    return agiz;
  }

  /** İstemediği kurabiyeyi bir ısırıp tükürür; kurabiye dönerek tepsiye geri uçar. */
  async function tukur(m, t, cv) {
    m.kilit = true;
    const agiz = await agzaGotur(t, cv, 0.5);
    agizAc(false);
    cv.classList.add('cigne');
    window.Efekt.karakter('hmm');
    await H().bekle(420);
    cv.classList.remove('cigne');
    window.Efekt.karakter('tukur');
    cv.classList.add('igren');
    cv.animate([{ transform: 'none' }, { transform: 'translateY(-10px) rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'none' }], { duration: 520 });
    t.style.transform = '';
    t.classList.remove('suruklenen');
    t.getAnimations().forEach((a) => a.cancel());
    await t.animate([
      { transform: agiz },
      { transform: `${agiz.replace(/scale\([^)]*\)/, '')} translateY(-140px) rotate(360deg) scale(.9)`, offset: 0.45 },
      { transform: 'rotate(720deg)' },
    ], { duration: 700, easing: 'cubic-bezier(.2,.7,.4,1)' }).finished;
    cv.classList.remove('igren');
    if (canli(m)) m.kilit = false;
  }

  async function besle(m, t) {
    if (!canli(m) || m.kilit) return;
    const h = t.dataset.h;
    const cv = $('#canavar');
    if (h !== m.hedef) {
      yanlisYaz(m);
      window.Konus.sustur();
      await tukur(m, t, cv);
      if (!canli(m)) return;
      window.Konus.soyle(H().harfSesi(h));
      besleSor(m);
      return;
    }
    m.kilit = true;
    dogruYaz(m);
    await agzaGotur(t, cv, 0.2);
    t.classList.add('kullanildi');
    agizAc(false);
    cv.classList.add('cigne');
    window.Efekt.karakter('nyam');
    window.Gorsel.kalpler(cv, 5);
    const eskiEvre = evre(canavar.yem);
    canavar = { yem: canavar.yem + 1 };
    H().kaydet('canavar', canavar);
    await H().bekle(1300);
    cv.classList.remove('cigne');
    if (!canli(m)) return;
    canavarCiz();
    if (evre(canavar.yem) > eskiEvre) {
      window.Efekt.tac();
      window.Gorsel.konfeti();
      H().bildir('🎉 Canavarın büyüdü!');
      cv.animate([{ transform: 'scale(.6)' }, { transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 700, easing: 'ease-out' });
    }
    window.Konus.sustur();
    H().harfVeKelimeSoyle(h);
    await H().donustur(h, cv);
    if (!canli(m)) return;
    m.soru += 1;
    if (m.soru >= SORU_SAYISI) { noktalar($('#besle-ilerleme'), m); modBitti(m, besleBasla); return; }
    besleSoru(m);
  }

  /* ---------- Resim Bilmecesi (tersten): resimlerin ilk seslerinden ismi bul ---------- */
  const YEDEK_SOZCUKLER = ['ANNE', 'BABA', 'DEDE', 'NİNE', 'ABLA'];
  const EN_UZUN_BILMECE = 9;
  const kelimeOf = (h) => window.HARF_BUL.get(h).kelime.toLocaleLowerCase('tr-TR');

  function bilmeceKisisi(oncekiId) {
    const aile = H().aile().filter((k) => k.name.replace(/ /g, '').length <= EN_UZUN_BILMECE);
    const adaylar = aile.length ? aile : YEDEK_SOZCUKLER.map((ad) => ({ id: ad, name: ad, rol: '' }));
    const liste = adaylar.length > 1 ? adaylar.filter((k) => k.id !== oncekiId) : adaylar;
    return liste[Math.floor(Math.random() * liste.length)];
  }

  function bilmeceKarti(m, h, i) {
    if (h === ' ') return H().el('div', { className: 'bilmece-bosluk' });
    const resim = H().el('div', { className: 'bilmece-resim hazirlaniyor' });
    const kutu = H().el('div', { className: 'bilmece-kutu' });
    kutu.dataset.i = String(i);
    resim.addEventListener('click', () => { window.Konus.sustur(); window.Konus.soyle(kelimeOf(h)); });
    const cizim = window.CIZIMLER[h];
    if (cizim) {
      const svg = cizim.olustur();
      resim.append(svg);
      setTimeout(() => {
        if (!canli(m)) return;
        cizim.oynat(svg, { kal: true, sessiz: true }).catch(() => {}).finally(() => resim.classList.remove('hazirlaniyor'));
      }, i * 160);
    }
    return H().el('div', { className: 'bilmece-kart' }, [resim, kutu]);
  }

  function bilmeceBasla() {
    window.Efekt.ac();
    const oncekiId = mod && mod.kisi ? mod.kisi.id : null;
    const kisi = bilmeceKisisi(oncekiId);
    const harfler = [...kisi.name];
    const m = { tur: 'bilmece', no: ++modNo, kisi, harfler, kalan: harfler.filter((h) => h !== ' ').length, kilit: false };
    mod = m;
    $('#mod-bitti').hidden = true;
    $('#bilmece-cevap').hidden = true;
    H().ekranAc('bilmece');
    $('#bilmece-tekrar').onclick = () => {
      if (!canli(m)) return;
      window.Konus.sustur();
      harfler.filter((h) => h !== ' ').forEach((h) => window.Konus.soyle(kelimeOf(h)));
    };
    $('#bilmece-kartlar').replaceChildren(...harfler.map((h, i) => bilmeceKarti(m, h, i)));
    $('#bilmece-tepsi').replaceChildren(...H().karistir(harfler.filter((h) => h !== ' ')).map((h) => {
      const t = H().el('button', { className: `tas yem-tas ${H().tur(h)}`, type: 'button', textContent: H().goster(h) });
      t.dataset.h = h;
      t.addEventListener('pointerdown', (e) => surukBasla(e, m, t, { birak: (x, y) => bilmeceBirak(m, t, x, y) }));
      return t;
    }));
    window.Konus.sustur();
    window.Konus.soyle('Resimlerin ilk seslerini bul. Burada kim yazıyor?');
  }

  /** Parmağa ya da taşın ortasına en yakın boş kutu (yeterince yakınsa). */
  function enYakinKutu(t, x, y) {
    const tr = t.getBoundingClientRect();
    const noktalar = [[x, y], [tr.left + tr.width / 2, tr.top + tr.height / 2]];
    let en = null;
    let enUzak = Infinity;
    for (const k of document.querySelectorAll('#bilmece-kartlar .bilmece-kutu:not(.dolu)')) {
      const r = k.getBoundingClientRect();
      for (const [px, py] of noktalar) {
        const u = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        if (u < enUzak) { enUzak = u; en = k; }
      }
    }
    return en && enUzak < Math.max(en.getBoundingClientRect().width, 70) * 1.3 ? en : null;
  }

  function bilmeceBirak(m, t, x, y) {
    if (!canli(m)) return;
    const kutu = enYakinKutu(t, x, y);
    if (!kutu) { geriGonder(t); return; }
    const h = t.dataset.h;
    const beklenen = m.harfler[Number(kutu.dataset.i)];
    if (h !== beklenen) {
      if (!kutu.dataset.hata) H().ilerlemeYaz(beklenen, false);
      kutu.dataset.hata = '1';
      window.Efekt.yanlis();
      kutu.animate([{ transform: 'none' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'none' }], { duration: 320, iterations: 2 });
      geriGonder(t);
      window.Konus.sustur();
      window.Konus.soyle(H().harfSesi(h));
      window.Konus.soyle(kelimeOf(beklenen));
      return;
    }
    H().ilerlemeYaz(h, kutu.dataset.hata ? null : true);
    t.style.transform = '';
    t.classList.remove('suruklenen');
    t.classList.add('kullanildi');
    kutu.classList.add('dolu', H().tur(h));
    kutu.textContent = H().goster(h);
    kutu.parentElement.classList.add('bulundu');
    window.Efekt.tik();
    window.Gorsel.kalpler(kutu, 3);
    window.Konus.sustur();
    window.Konus.soyle(H().harfSesi(h));
    m.kalan -= 1;
    if (m.kalan === 0) bilmeceCozuldu(m);
  }

  async function bilmeceCozuldu(m) {
    const k = m.kisi;
    const cevap = $('#bilmece-cevap');
    const aileden = H().aile().includes(k);
    const yuz = aileden ? H().yuz(k, 'bilmece-yuz') : H().el('span', { className: 'bilmece-yuz yuz-emoji', textContent: '🎉' });
    cevap.replaceChildren(yuz, H().el('span', { className: 'bilmece-ad' }, H().renkliAd(k.name)));
    cevap.hidden = false;
    window.Efekt.tikSesi();
    window.Gorsel.konfeti();
    const ad = k.name.toLocaleLowerCase('tr-TR');
    await window.Konus.soyle(k.rol ? `${k.rol}! ${ad}` : ad);
    await H().bekle(1200);
    modBitti(m, bilmeceBasla);
  }

  /* ---------- Çıkartma Albümü ---------- */
  function albumAc() {
    window.Efekt.ac();
    mod = { tur: 'album', no: ++modNo };
    const il = H().ilerleme();
    const esik = H().OGRENDI_ESIGI;
    const acik = window.HARFLER.filter((x) => ogrenildi(x.h)).length;
    $('#album-baslik').textContent = `Çıkartmalarım ${acik} / ${window.HARFLER.length}`;
    const kartlar = window.HARFLER.map((x, i) => {
      const kazanildi = ogrenildi(x.h);
      const kart = H().el('button', { className: `cikartma ${kazanildi ? 'acik' : 'kilitli'}`, type: 'button' });
      if (kazanildi && window.CIZIMLER[x.h]) {
        const svg = window.CIZIMLER[x.h].olustur();
        kart.append(H().el('div', { className: 'cikartma-resim' }, [svg]),
          H().el('span', { className: 'cikartma-ad' }, [H().el('b', { className: H().tur(x.h), textContent: H().goster(x.h) }), ` ${x.kelime}`]));
        setTimeout(() => { if (svg.isConnected) window.CIZIMLER[x.h].oynat(svg, { kal: true, sessiz: true }).catch(() => {}); }, i * 90);
      } else {
        const sayi = Math.min(esik, (il[x.h] || {}).dogru || 0);
        kart.append(H().el('span', { className: `cikartma-harf ${H().tur(x.h)}`, textContent: H().goster(x.h) }),
          H().el('span', { className: 'cikartma-nokta' }, Array.from({ length: esik }, (_, j) => H().el('i', { className: j < sayi ? 'dolu' : '' }))));
      }
      kart.addEventListener('click', () => {
        window.Konus.sustur();
        H().harfVeKelimeSoyle(x.h);
        if (kazanildi) H().donustur(x.h, kart);
        else kart.animate([{ transform: 'none' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'none' }], { duration: 400 });
      });
      return kart;
    });
    $('#album-izgara').replaceChildren(...kartlar);
    H().ekranAc('album');
  }

  /** app.js ilerlemeYaz → bir harf eşiği geçince. */
  function yeniCikartma(h) {
    const b = window.HARF_BUL.get(h);
    if (!b) return;
    window.Efekt.tac();
    H().bildir(`📒 Yeni çıkartma: ${b.kelime}!`);
  }

  /* ---------- ana sayfa kartları ---------- */
  function kartlar(sira) {
    const kart = (ad, gorsel, ek, tikla, i) => {
      const k = H().el('button', { className: 'kart kart-mod', type: 'button' }, [
        H().el('span', { className: 'kart-resim' }, [gorsel]),
        H().el('span', { className: 'kart-ad' }, H().renkliAd(ad)),
        ek ? H().el('span', { className: 'kart-rol', textContent: ek }) : null,
      ].filter(Boolean));
      k.style.setProperty('--gecikme', `${(sira + i) * 60}ms`);
      k.addEventListener('click', tikla);
      return k;
    };
    const yuz = (metin) => H().el('span', { className: 'kart-yuz yuz-emoji', textContent: metin });
    const canavarYuz = H().el('span', { className: 'kart-yuz kart-canavar' }, [canavarSvg(evre(canavar.yem))]);
    const acik = window.HARFLER.filter((x) => ogrenildi(x.h)).length;
    return [
      kart('HARF AVI', yuz('🎈'), 'Sesi dinle, balonu bul', avBasla, 0),
      kart('CANAVAR', canavarYuz, `🍎 ${canavar.yem}`, besleBasla, 1),
      kart('BİLMECE', yuz('🧩'), 'Resimlerden ismi bul', bilmeceBasla, 2),
      kart('ALBÜM', yuz('📒'), `${acik} / ${window.HARFLER.length}`, albumAc, 3),
    ];
  }

  function durdur() {
    mod = null;
    suruk = null;
    const kutu = $('#mod-bitti');
    if (kutu) kutu.hidden = true;
  }

  return Object.freeze({ kartlar, durdur, yeniCikartma });
})();
