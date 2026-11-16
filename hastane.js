/*
 * Hastane: oyuncak ayıcık hasta; kız doktor olur.
 *   1) Kalbini dinle   — steteskobu göğsüne koy; kalp kaç kere "güm" attı? Dinleyip sayar, rakamı seçer.
 *   2) Yara bandı      — yaraları sayar ("Kaç yara var?"), her birine bant yapıştırır, bantlar sayılır.
 *   3) Şurup           — duyduğu harfin şişesini bulur (şişenin üstünde harf, yanda harfin karakteri).
 *   4) Reçete          — kâğıtta yazan rakam kadar kaşık verir (rakamı okur, kaşıkları sayar).
 *   5) İyileşti        — ayıcık güler, sarılır: "Geçmiş olsun!"
 */
window.Hastane = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);
  const KALP_EN_AZ = 2;
  const KALP_EN_COK = 5;
  const KALP_ARA_MS = 750;
  const YARA_YERLERI = [[78, 196], [168, 206], [120, 252], [62, 146], [178, 150]];
  const SISE_RENK = ['#FF6F9F', '#9B5DE5', '#2EC4B6'];

  let o = null;
  let d = null;

  const konus = (t) => o.konus(t);
  const balon = (metin) => { const b = $('#hastane-balon'); b.textContent = metin; b.classList.remove('yeni'); void b.offsetWidth; b.classList.add('yeni'); };
  const sor = (metin) => { balon(metin); window.Konus.sustur(); return konus(metin); };
  const araclar = (...x) => $('#hastane-arac').replaceChildren(...x);
  const rastgele = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  /* ---------- ayıcık ---------- */
  function ayiSvg() {
    const mutlu = d.mutlu;
    const agiz = mutlu
      ? '<path d="M104 116 Q120 136 136 116Z" fill="#7A2E2E"/>'
      : '<path d="M106 124 Q120 112 134 124" fill="none" stroke="#5A3A30" stroke-width="4" stroke-linecap="round"/>';
    const gozler = mutlu
      ? '<path d="M92 94 Q100 86 108 94 M132 94 Q140 86 148 94" fill="none" stroke="#3B2C2A" stroke-width="5" stroke-linecap="round"/>'
      : '<circle cx="100" cy="94" r="6" fill="#3B2C2A"/><circle cx="140" cy="94" r="6" fill="#3B2C2A"/><path d="M88 84 L108 78 M152 84 L132 78" stroke="#3B2C2A" stroke-width="3" stroke-linecap="round"/><path d="M146 100 q4 10 0 14 q-4 -4 0 -14Z" fill="#7EC8E3"/>';
    const ates = mutlu ? '' : '<g class="ates-isi"><path d="M168 46 q8 -10 0 -20 M180 50 q8 -10 0 -20" fill="none" stroke="#FF6F61" stroke-width="4" stroke-linecap="round"/></g>';
    const yaralar = d.yaralar.map(([x, y], i) => (d.bantlar.has(i)
      ? `<g transform="rotate(${i % 2 ? 30 : -30} ${x} ${y})"><rect x="${x - 22}" y="${y - 9}" width="44" height="18" rx="8" fill="#F6C89F" stroke="#D99A6C" stroke-width="2"/><rect x="${x - 8}" y="${y - 7}" width="16" height="14" rx="3" fill="#FBE3C9"/></g>`
      : `<g class="yara" data-yara="${i}"><circle cx="${x}" cy="${y}" r="22" fill="transparent"/><path d="M${x - 10} ${y - 6} L${x + 10} ${y + 6} M${x - 10} ${y + 6} L${x + 10} ${y - 6}" stroke="#E0363A" stroke-width="5" stroke-linecap="round"/></g>`)).join('');
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 240 300');
    s.setAttribute('class', `ayi${mutlu ? ' mutlu' : ''}`);
    s.innerHTML = `
      <ellipse cx="120" cy="290" rx="90" ry="10" fill="rgba(0,0,0,.08)"/>
      <ellipse cx="78" cy="270" rx="26" ry="20" fill="#B5784A"/><ellipse cx="162" cy="270" rx="26" ry="20" fill="#B5784A"/>
      <ellipse cx="120" cy="208" rx="70" ry="70" fill="#C98B5A"/>
      <ellipse cx="120" cy="214" rx="42" ry="46" fill="#E8C29A"/>
      <ellipse class="ayi-kol-sol" cx="54" cy="186" rx="20" ry="36" fill="#B5784A" transform="rotate(20 54 186)"/>
      <ellipse class="ayi-kol-sag" cx="186" cy="186" rx="20" ry="36" fill="#B5784A" transform="rotate(-20 186 186)"/>
      <circle cx="74" cy="52" r="24" fill="#C98B5A"/><circle cx="166" cy="52" r="24" fill="#C98B5A"/>
      <circle cx="74" cy="52" r="12" fill="#E8C29A"/><circle cx="166" cy="52" r="12" fill="#E8C29A"/>
      <circle cx="120" cy="100" r="60" fill="#C98B5A"/>
      <ellipse cx="120" cy="118" rx="26" ry="20" fill="#E8C29A"/><ellipse cx="120" cy="108" rx="9" ry="7" fill="#3B2C2A"/>
      <ellipse cx="88" cy="116" rx="9" ry="6" fill="${mutlu ? '#FF8FA3' : '#FF6F61'}" opacity=".6"/><ellipse cx="152" cy="116" rx="9" ry="6" fill="${mutlu ? '#FF8FA3' : '#FF6F61'}" opacity=".6"/>
      ${gozler}${agiz}${ates}
      <g class="kalp-yeri"><circle cx="138" cy="190" r="16" fill="#FF8FA3" opacity="0"/></g>
      ${yaralar}`;
    return s;
  }

  function ayiCiz() {
    const kap = $('#hastane-ayi');
    kap.replaceChildren(ayiSvg());
    return kap.firstChild;
  }

  /* ---------- akış ---------- */
  function baslat(ortam) {
    o = ortam;
    const yaraSayisi = rastgele(2, 4);
    d = { mutlu: false, kilit: false, kalp: rastgele(KALP_EN_AZ, KALP_EN_COK), yaralar: H().karistir(YARA_YERLERI).slice(0, yaraSayisi), bantlar: new Set(), hedef: null, hata: 0, kasik: 0, recete: rastgele(2, 4) };
    $('#hastane-doktor').replaceChildren(window.Kiz.on(o.kiz, { orgu: o.kiz.orgu, oje: o.kiz.oje, mutlu: true }));
    $('#hastane-tekrar').onclick = () => konus($('#hastane-balon').textContent);
    ayiCiz();
    kalpBasla();
  }

  /* 1) Kalbini dinle */
  async function kalpBasla() {
    await sor('Ayıcık hasta! Önce kalbini dinleyelim. Steteskobu göğsüne koy.');
    const stet = H().el('button', { className: 'hastane-alet', type: 'button', textContent: '🩺' });
    stet.addEventListener('click', () => kalpDinle(stet));
    araclar(stet);
  }

  async function kalpDinle(stet) {
    if (d.kilit || !o.canli()) return;
    d.kilit = true;
    stet.classList.add('takili');
    await sor('Şşş! Dinle. Kalbi kaç kere attı?');
    await H().bekle(400);
    const kalp = $('#hastane-ayi .kalp-yeri');
    for (let i = 0; i < d.kalp; i += 1) {
      if (!o.canli()) return;
      window.Efekt.karakter('kalpatisi');
      kalp.classList.remove('atti'); void kalp.getBBox(); kalp.classList.add('atti');
      await H().bekle(KALP_ARA_MS);
    }
    stet.classList.remove('takili');
    d.kilit = false;
    const secenek = H().karistir([...new Set([d.kalp, d.kalp - 1, d.kalp + 1].filter((n) => n >= 1))]);
    araclar(...secenek.map((n) => {
      const b = H().el('button', { className: 'sayi-dugme', type: 'button' }, [
        H().el('span', { className: 'sayi-rakam', textContent: String(n) }),
        H().el('span', { className: 'sayi-nokta', textContent: '❤'.repeat(n) }),
      ]);
      b.addEventListener('click', () => kalpCevap(n, b));
      return b;
    }), (() => { const t = H().el('button', { className: 'hastane-alet kucuk', type: 'button', textContent: '🔁🩺' }); t.addEventListener('click', () => kalpDinle(stet)); return t; })());
  }

  async function kalpCevap(n, b) {
    if (d.kilit) return;
    if (n !== d.kalp) {
      window.Efekt.yanlis();
      b.classList.remove('salla'); void b.offsetWidth; b.classList.add('salla');
      await sor('Bir daha dinleyelim!');
      return;
    }
    d.kilit = true;
    window.Efekt.tikSesi();
    await o.say(n);
    await sor(`Evet, ${n} kere attı. Kalbi sağlam!`);
    d.kilit = false;
    if (o.canli()) yaraBasla();
  }

  /* 2) Yara bandı */
  async function yaraBasla() {
    araclar(H().el('span', { className: 'hastane-alet', textContent: '🩹' }));
    baglaYaralar(); // konuşma bitmeden dokunursa da bant yapışsın
    await sor('Ayıcığın yaraları var. Kaç yara var? Dokunarak say, bant yapıştır.');
  }

  function baglaYaralar() {
    document.querySelectorAll('#hastane-ayi .yara').forEach((y) => y.addEventListener('click', () => bantla(Number(y.dataset.yara))));
  }

  async function bantla(i) {
    if (d.kilit || d.bantlar.has(i) || !o.canli()) return;
    d.kilit = true;
    d.bantlar = new Set([...d.bantlar, i]);
    window.Efekt.karakter('bant');
    ayiCiz();
    baglaYaralar();
    await o.say(d.bantlar.size);
    d.kilit = false;
    if (d.bantlar.size < d.yaralar.length || !o.canli()) return;
    await sor(`${d.yaralar.length} yara, ${d.yaralar.length} bant! Aferin doktor!`);
    if (o.canli()) suruBasla();
  }

  /* 3) Şurup: duyduğu harfin şişesi */
  function suruBasla() {
    const havuz = o.harfHavuzu();
    d.hedef = H().karistir(havuz)[0];
    d.hata = 0;
    const diger = H().karistir(window.HARFLER.map((x) => x.h).filter((h) => h !== d.hedef)).slice(0, 2);
    const harfler = H().karistir([d.hedef, ...diger]);
    const ipucu = H().el('div', { className: 'hastane-ipucu' }, [o.harfResmi(d.hedef)]);
    araclar(ipucu, H().el('div', { className: 'siseler' }, harfler.map((h, i) => {
      const b = H().el('button', { className: 'sise', type: 'button' }, [
        H().el('span', { className: 'sise-kapak' }),
        H().el('span', { className: `sise-govde ${H().tur(h)}`, textContent: H().goster(h) }),
      ]);
      b.style.setProperty('--renk', SISE_RENK[i % SISE_RENK.length]);
      b.addEventListener('click', () => siseSec(h, b));
      return b;
    })));
    sor('Şimdi şurup. Dinle! Bu harfin şişesini bul.').then(() => { if (o.canli()) konus(H().harfSesi(d.hedef)); });
  }

  async function siseSec(h, b) {
    if (d.kilit) return;
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
    window.Efekt.tikSesi();
    window.Konus.sustur();
    await konus(H().harfSesi(h));
    d.kilit = false;
    if (o.canli()) receteBasla(b.style.getPropertyValue('--renk'));
  }

  /* 4) Reçete: yazan rakam kadar kaşık */
  async function receteBasla(renk) {
    const recete = H().el('div', { className: 'recete' }, [
      H().el('span', { className: 'recete-baslik', textContent: '📝' }),
      H().el('span', { className: 'recete-rakam', textContent: String(d.recete) }),
      H().el('span', { className: 'recete-kasik', textContent: '🥄'.repeat(d.recete) }),
    ]);
    const kasik = H().el('button', { className: 'kasik', type: 'button', textContent: '🥄' });
    kasik.style.setProperty('--renk', renk);
    kasik.addEventListener('click', () => kasikVer(kasik));
    araclar(recete, kasik);
    await sor('Reçeteye bak. Kaç kaşık yazıyor? O kadar kaşık şurup ver.');
  }

  async function kasikVer(kasik) {
    if (d.kilit || !o.canli()) return;
    if (d.kasik >= d.recete) { await sor(`Yeter! Reçetede ${d.recete} kaşık yazıyor.`); return; }
    d.kilit = true;
    kasik.classList.remove('ver'); void kasik.offsetWidth; kasik.classList.add('ver');
    window.Efekt.karakter('yudum');
    d.kasik += 1;
    await o.say(d.kasik);
    d.kilit = false;
    if (d.kasik === d.recete && o.canli()) iyilesti();
  }

  /* 5) İyileşti */
  async function iyilesti() {
    d.kilit = true;
    await sor(`${d.recete} kaşık! Tamam.`);
    if (!o.canli()) return;
    d.mutlu = true;
    const ayi = ayiCiz();
    ayi.classList.add('sevin');
    window.Efekt.tac();
    window.Gorsel.konfeti();
    window.Gorsel.kalpler($('#hastane-ayi'), 10);
    await sor('Ayıcık iyileşti! Sana sarılıyor. Geçmiş olsun!');
    if (!o.canli()) return;
    const tekrar = H().el('button', { className: 'buyuk-dugme', type: 'button', textContent: '🔁 Yeni hasta' });
    tekrar.addEventListener('click', () => baslat(o));
    const cik = H().el('button', { className: 'buyuk-dugme ikinci', type: 'button', textContent: '🚪 Sokağa çık' });
    cik.addEventListener('click', () => o.cik());
    araclar(tekrar, cik);
  }

  return Object.freeze({ baslat });
})();
