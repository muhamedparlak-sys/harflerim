/*
 * Plaj: kız denize girer (kapı şifresi PLAJ — J harfi burada çalışılır).
 *   1) Simit     — kartta yazan rakam kadar pompalar; her pompada simit büyür ve sayılır.
 *   2) Yüzme     — denizde harfli şamandıralar; duyduğu harfin şamandırasına yüzer (yanda harfin karakteri).
 *                  Üç tur; her tur sayılır.
 *   3) Kabuk     — kumsalda deniz kabukları; kartta yazan kadarını kovaya toplar, kabuklar sayılır.
 *   4) Bitiş     — sevinir, konfeti: "Harika bir plaj günü!"
 */
window.Plaj = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);
  const TUR_SAYISI = 3;
  const YUZME_MS = 1500;
  const SAMANDIRA_YERI = [34, 52, 70]; // denizde şamandıraların sol kenarı (%)
  const KABUK_YERI = [[30, 6], [40, 15], [50, 4], [60, 13], [70, 6], [80, 16], [88, 5]]; // kumda [sol %, alt %]
  const KIZ_KUMDA = { sol: 5, alt: 3 };
  const KIZ_DENIZDE = { sol: 14, alt: 30 };

  let o = null;
  let d = null;

  const konus = (t) => o.konus(t);
  const balon = (metin) => { const b = $('#plaj-balon'); b.textContent = metin; b.classList.remove('yeni'); void b.offsetWidth; b.classList.add('yeni'); };
  const sor = (metin) => { balon(metin); window.Konus.sustur(); return konus(metin); };
  const araclar = (...x) => $('#plaj-arac').replaceChildren(...x);
  const rastgele = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  /* ---------- sahne ---------- */
  function simitSvg() {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 200 70');
    s.setAttribute('class', 'simit');
    let serit = '';
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      serit += `<path d="M${100 + Math.cos(a) * 66} ${35 + Math.sin(a) * 20} L${100 + Math.cos(a) * 96} ${35 + Math.sin(a) * 32}" stroke="#fff" stroke-width="16"/>`;
    }
    s.innerHTML = `<ellipse cx="100" cy="35" rx="82" ry="27" fill="none" stroke="#FF5D73" stroke-width="22"/>${serit}
      <ellipse cx="100" cy="35" rx="82" ry="27" fill="none" stroke="#C93A52" stroke-width="2" opacity=".5"/>`;
    return s;
  }

  function kizCiz(mutlu = false) {
    const kap = $('#plaj-kiz');
    kap.replaceChildren(window.Kiz.on(o.kiz, { orgu: o.kiz.orgu, oje: o.kiz.oje, mutlu }), d.simit);
  }

  function kizYer({ sol, alt }) {
    const kap = $('#plaj-kiz');
    kap.style.left = `${sol}%`;
    kap.style.bottom = `${alt}%`;
  }

  function simitBuyut() {
    const oran = d.pompa / d.hedefPompa;
    d.simit.style.scale = `${0.5 + 0.5 * oran} ${0.2 + 0.8 * oran}`; // sönükken yassı, şiştikçe dolgun
  }

  function kart(rakam, ek) {
    return H().el('div', { className: 'recete plaj-kart' }, [
      H().el('span', { className: 'recete-rakam', textContent: String(rakam) }),
      H().el('span', { className: 'recete-kasik', textContent: ek.repeat(rakam) }),
    ]);
  }

  /* ---------- akış ---------- */
  function baslat(ortam) {
    o = ortam;
    d = { kilit: false, pompa: 0, hedefPompa: rastgele(3, 5), tur: 0, hedef: null, hata: 0, onceki: null, kabuk: 0, hedefKabuk: rastgele(3, 5), simit: simitSvg() };
    $('#plaj-tekrar').onclick = () => konus($('#plaj-balon').textContent);
    const sahne = $('#plaj-sahne');
    sahne.replaceChildren(
      H().el('div', { className: 'plaj-gunes' }),
      H().el('div', { className: 'plaj-dalga d1' }), H().el('div', { className: 'plaj-dalga d2' }),
      H().el('div', { id: 'plaj-samandiralar' }),
      H().el('div', { id: 'plaj-kumlar' }),
      H().el('div', { className: 'plaj-semsiye' }),
      H().el('div', { id: 'plaj-kova', className: 'plaj-kova', textContent: '🪣' }),
      H().el('div', { id: 'plaj-kiz', className: 'plaj-kiz' }),
      H().el('div', { id: 'plaj-arac', className: 'plaj-arac' }),
    );
    kizCiz();
    kizYer(KIZ_KUMDA);
    simitBuyut();
    simitBasla();
  }

  /* 1) Simidi şişir */
  function simitBasla() {
    const pompa = H().el('button', { className: 'pompa', type: 'button', ariaLabel: 'Pompa' }, [
      H().el('span', { className: 'pompa-sap' }), H().el('span', { className: 'pompa-govde' }),
    ]);
    pompa.addEventListener('click', () => pompala(pompa));
    araclar(kart(d.hedefPompa, '●'), pompa);
    sor('Plaja geldik! Önce simidini şişir. Kartta kaç yazıyor? O kadar pompala.');
  }

  async function pompala(pompa) {
    if (d.kilit || !o.canli()) return;
    if (d.pompa >= d.hedefPompa) { await sor(`Yeter! Kartta ${d.hedefPompa} yazıyor.`); return; }
    d.kilit = true;
    pompa.classList.remove('bas'); void pompa.offsetWidth; pompa.classList.add('bas');
    window.Efekt.karakter('pompa');
    d.pompa += 1;
    simitBuyut();
    await o.say(d.pompa);
    if (!o.canli()) return;
    if (d.pompa < d.hedefPompa) { d.kilit = false; return; }
    await sor(`${d.hedefPompa} kere pompaladın. Simit hazır! Hadi denize!`);
    if (o.canli()) denizeGir();
  }

  /* 2) Yüzme: duyduğu harfin şamandırasına yüz */
  async function denizeGir() {
    araclar();
    kizYer(KIZ_DENIZDE);
    window.Efekt.karakter('sicrama');
    await H().bekle(YUZME_MS);
    if (!o.canli()) return;
    $('#plaj-kiz').classList.add('yuzuyor');
    d.kilit = false;
    yuzmeTuru();
  }

  function yuzmeTuru() {
    const havuz = o.harfHavuzu().filter((h) => h !== d.onceki);
    d.hedef = H().karistir(havuz)[0];
    d.onceki = d.hedef;
    d.hata = 0;
    const diger = H().karistir(window.HARFLER.map((x) => x.h).filter((h) => h !== d.hedef)).slice(0, 2);
    const harfler = H().karistir([d.hedef, ...diger]);
    $('#plaj-samandiralar').replaceChildren(...harfler.map((h, i) => {
      const b = H().el('button', { className: 'samandira', type: 'button' }, [
        H().el('span', { className: `samandira-harf ${H().tur(h)}`, textContent: H().goster(h) }),
      ]);
      b.style.left = `${SAMANDIRA_YERI[i]}%`;
      b.style.animationDelay = `${-i * 0.6}s`;
      b.addEventListener('click', () => samandiraSec(h, b, i));
      return b;
    }));
    araclar(H().el('div', { className: 'hastane-ipucu' }, [o.harfResmi(d.hedef)]));
    const metin = d.tur === 0 ? 'Dinle! Bu harfin şamandırasına yüz.' : 'Bir tur daha! Dinle.';
    sor(metin).then(() => { if (o.canli()) konus(H().harfSesi(d.hedef)); });
  }

  async function samandiraSec(h, b, i) {
    if (d.kilit || !o.canli()) return;
    if (h !== d.hedef) {
      if (d.hata === 0) H().ilerlemeYaz(d.hedef, false);
      d.hata += 1;
      window.Efekt.yanlis();
      b.classList.remove('salla'); void b.offsetWidth; b.classList.add('salla');
      window.Konus.sustur();
      konus(H().harfSesi(d.hedef));
      return;
    }
    d.kilit = true;
    H().ilerlemeYaz(h, d.hata === 0 ? true : null);
    b.classList.add('secildi');
    window.Konus.sustur();
    konus(H().harfSesi(h));
    kizYer({ sol: SAMANDIRA_YERI[i] - 7, alt: KIZ_DENIZDE.alt });
    window.Efekt.karakter('sicrama');
    await H().bekle(YUZME_MS);
    if (!o.canli()) return;
    d.tur += 1;
    await o.say(d.tur);
    if (!o.canli()) return;
    if (d.tur < TUR_SAYISI) { d.kilit = false; yuzmeTuru(); return; }
    $('#plaj-samandiralar').replaceChildren();
    araclar();
    await sor(`${TUR_SAYISI} tur yüzdün! Şimdi kumsala çıkalım.`);
    if (o.canli()) kumsalaCik();
  }

  /* 3) Kabuk topla */
  async function kumsalaCik() {
    kizYer(KIZ_KUMDA);
    window.Efekt.karakter('sicrama');
    await H().bekle(YUZME_MS * 0.5);
    $('#plaj-kiz').classList.remove('yuzuyor');
    await H().bekle(YUZME_MS * 0.5);
    if (!o.canli()) return;
    $('#plaj-kumlar').replaceChildren(...KABUK_YERI.map(([sol, alt], i) => {
      const b = H().el('button', { className: 'kabuk', type: 'button', textContent: i % 3 === 2 ? '⭐' : '🐚', ariaLabel: 'Kabuk' });
      b.style.left = `${sol}%`;
      b.style.bottom = `${alt}%`;
      b.style.rotate = `${(i * 37) % 60 - 30}deg`;
      b.addEventListener('click', () => kabukTopla(b));
      return b;
    }));
    araclar(kart(d.hedefKabuk, '🐚'));
    d.kilit = false;
    sor('Kumsalda deniz kabukları var. Kartta kaç yazıyor? O kadarını kovaya topla.');
  }

  async function kabukTopla(b) {
    if (d.kilit || !o.canli() || b.classList.contains('toplandi')) return;
    if (d.kabuk >= d.hedefKabuk) { await sor(`Yeter! Kartta ${d.hedefKabuk} yazıyor.`); return; }
    d.kilit = true;
    const kova = $('#plaj-kova').getBoundingClientRect();
    const r = b.getBoundingClientRect();
    b.classList.add('toplandi');
    b.style.translate = `${kova.left + kova.width / 2 - (r.left + r.width / 2)}px ${kova.top - (r.top + r.height / 2)}px`;
    window.Efekt.tikSesi();
    d.kabuk += 1;
    await o.say(d.kabuk);
    if (!o.canli()) return;
    if (d.kabuk < d.hedefKabuk) { d.kilit = false; return; }
    bitis();
  }

  /* 4) Bitiş */
  async function bitis() {
    araclar();
    d.simit.style.scale = '1';
    kizCiz(true);
    $('#plaj-kiz').classList.add('sevin');
    window.Efekt.tac();
    window.Gorsel.konfeti();
    window.Gorsel.kalpler($('#plaj-kiz'), 8);
    await sor(`Harika bir plaj günü! Simidi şişirdin, ${TUR_SAYISI} tur yüzdün, ${d.hedefKabuk} kabuk topladın.`);
    if (!o.canli()) return;
    const tekrar = H().el('button', { className: 'buyuk-dugme', type: 'button', textContent: '🔁 Yine yüz' });
    tekrar.addEventListener('click', () => baslat(o));
    const cik = H().el('button', { className: 'buyuk-dugme ikinci', type: 'button', textContent: '🚪 Sokağa çık' });
    cik.addEventListener('click', () => o.cik());
    araclar(tekrar, cik);
  }

  return Object.freeze({ baslat });
})();
