/*
 * Restoran: saymayı ve paylaştırmayı oynayarak öğrenir.
 *   1) "Kaç kişisiniz?"  — rakamı seçer (altında o kadar nokta); misafirler masaya tek tek oturur ve sayılır.
 *   2) Tabaklar           — herkese bir tabak (bire bir eşleme), her tabak sayılır.
 *   3) Menü               — PİZZA ya da PASTA (resim + kelime; dokununca okunur).
 *   4) Dilimle            — kişi sayısı kadar kesik çizgi; her birine dokununca bıçak keser; dilimler sayılır.
 *   5) Paylaştır          — dilime dokun, sıradaki tabağa uçsun ("Anneye bir dilim!"); sonra hep birlikte afiyetle yerler.
 * Misafirler: önce kızın kendisi, sonra aile kartları (fotoğraf cihazda), eksikse oyuncak hayvanlar.
 */
window.Restoran = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);
  const KISI_SECENEK = [2, 3, 4, 5, 6];
  const OYUNCAKLAR = ['🧸', '🐰', '🐱', '🐶', '🦊', '🐼'];
  const YEMEK = Object.freeze({
    pizza: { kelime: 'PİZZA', resim: '🍕', kenar: '#E9A23B', ic: '#FFD166', sus: '#D9534F', sus2: '#5CB85C' },
    pasta: { kelime: 'PASTA', resim: '🍰', kenar: '#C9845A', ic: '#FF9EC0', sus: '#E0363A', sus2: '#FFFFFF' },
  });
  const R = 100; // yemek yarıçapı (viewBox -110..110)

  let o = null; // ortam: { canli(), say(n), konus(t), cik() , kiz }
  let r = null; // tur durumu

  const konus = (t) => o.konus(t);
  const balon = (metin) => { const b = $('#restoran-balon'); b.textContent = metin; b.classList.remove('yeni'); void b.offsetWidth; b.classList.add('yeni'); };
  const sor = (metin, okunacak = metin) => { balon(metin); window.Konus.sustur(); return konus(okunacak); };

  /* ---------- çizimler ---------- */
  const derece = (a) => (a * Math.PI) / 180;
  const nokta = (aci, yaricap) => [Math.cos(derece(aci)) * yaricap, Math.sin(derece(aci)) * yaricap];
  const yaz = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const sinir = (n, k) => -90 + (k * 360) / n;

  function dilimYolu(n, i) {
    const a1 = sinir(n, i);
    const a2 = sinir(n, i + 1);
    return `M0 0 L${yaz(nokta(a1, R))} A${R} ${R} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${yaz(nokta(a2, R))}Z`;
  }

  /** Bir dilim: kenar + iç + süsler (orta açıya göre). */
  function dilimIcerik(y, n, i) {
    const orta = (sinir(n, i) + sinir(n, i + 1)) / 2;
    const yay = 360 / n;
    let sus = '';
    for (const [da, yr] of [[0, 52], [-yay / 4, 76], [yay / 4, 76], [0, 28]]) {
      const [x, yy] = nokta(orta + da, yr);
      sus += y === YEMEK.pizza
        ? `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${yr < 40 ? 6 : 9}" fill="${da === 0 && yr === 28 ? y.sus2 : y.sus}"/>`
        : `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${yr < 40 ? 5 : 8}" fill="${yr === 52 ? y.sus2 : y.sus}"/>`;
    }
    return `<path d="${dilimYolu(n, i)}" fill="${y.ic}" stroke="${y.kenar}" stroke-width="10" stroke-linejoin="round"/>${sus}`;
  }

  function svg(viewBox, icerik, sinif) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('class', sinif);
    s.innerHTML = icerik; // yalnızca bu dosyadaki sabit şablonlar ve sayılar
    return s;
  }

  /** Bütün yemek: kesilmemişken dilimler bitişik; kesim çizgileri ayrı katman. */
  function yemekSvg() {
    const y = YEMEK[r.yemek];
    let ic = '';
    for (let i = 0; i < r.n; i += 1) {
      const orta = derece((sinir(r.n, i) + sinir(r.n, i + 1)) / 2);
      ic += `<g class="dilim" data-dilim="${i}" style="--dx:${(Math.cos(orta) * 9).toFixed(1)}px;--dy:${(Math.sin(orta) * 9).toFixed(1)}px">${dilimIcerik(y, r.n, i)}</g>`;
    }
    let kesim = '';
    for (let k = 0; k < r.n; k += 1) {
      const d = `M0 0 L${yaz(nokta(sinir(r.n, k), R + 6))}`;
      kesim += `<g class="kesim" data-kesim="${k}"><path class="kesim-iz" d="${d}"/><path class="kesim-dokun" d="${d}"/></g>`;
    }
    return svg('-115 -115 230 230', `<circle r="${R + 4}" fill="${y.kenar}"/>${ic}<g class="kesimler">${kesim}</g>`, 'yemek');
  }

  function tekDilimSvg(i) {
    return svg('-110 -110 220 220', dilimIcerik(YEMEK[r.yemek], r.n, i), 'tabak-dilim');
  }

  /* ---------- masa ---------- */
  function misafirListesi(n) {
    const aile = H().aile().slice(0, n - 1).map((k) => ({ ad: k.name, yuz: () => H().yuz(k, 'misafir-yuz') }));
    const kendisi = { ad: null, yuz: () => H().el('span', { className: 'misafir-yuz kendi' }, [window.Kiz.on(o.kiz, { orgu: o.kiz.orgu, oje: o.kiz.oje, mutlu: true })]) };
    const liste = [kendisi, ...aile];
    for (let i = 0; liste.length < n; i += 1) {
      const emoji = OYUNCAKLAR[i % OYUNCAKLAR.length];
      liste.push({ ad: null, yuz: () => H().el('span', { className: 'misafir-yuz yuz-emoji', textContent: emoji }) });
    }
    return liste;
  }

  function masaCiz() {
    const masa = H().el('div', { className: 'masa' });
    r.yerler = r.misafirler.map((m, i) => {
      const aci = derece(90 + (i * 360) / r.n);
      const yer = H().el('div', { className: 'misafir' }, [m.yuz()]);
      yer.style.left = `${50 + Math.cos(aci) * 47}%`;
      yer.style.top = `${50 + Math.sin(aci) * 44}%`;
      const tabak = H().el('div', { className: 'tabak bos' });
      tabak.style.left = `${50 + Math.cos(aci) * 31}%`;
      tabak.style.top = `${50 + Math.sin(aci) * 30}%`;
      yer.hidden = true;
      masa.append(tabak, yer);
      return { yer, tabak };
    });
    const orta = H().el('div', { className: 'yemek-kap' });
    masa.append(orta);
    $('#restoran-masa').replaceChildren(masa);
  }

  /* ---------- akış ---------- */
  function baslat(ortam) {
    o = ortam;
    r = { n: 0, misafirler: [], yerler: [], yemek: null, kesik: new Set(), dagitilan: 0, kilit: false };
    $('#restoran-masa').replaceChildren(H().el('div', { className: 'masa' }));
    $('#restoran-tekrar').onclick = () => konus($('#restoran-balon').textContent);
    kacKisi();
  }

  function araclar(...dugmeler) { $('#restoran-arac').replaceChildren(...dugmeler); }

  /* 1) Kaç kişisiniz? */
  function kacKisi() {
    sor('Hoş geldiniz! Kaç kişisiniz?');
    araclar(...KISI_SECENEK.map((n) => {
      const b = H().el('button', { className: 'sayi-dugme', type: 'button' }, [
        H().el('span', { className: 'sayi-rakam', textContent: String(n) }),
        H().el('span', { className: 'sayi-nokta', textContent: '●'.repeat(n) }),
      ]);
      b.addEventListener('click', () => kisiSec(n));
      return b;
    }));
  }

  async function kisiSec(n) {
    if (r.kilit) return;
    r.kilit = true;
    r.n = n;
    r.misafirler = misafirListesi(n);
    araclar();
    masaCiz();
    await sor(`${n} kişi! Buyurun, oturun.`);
    for (let i = 0; i < n; i += 1) {
      if (!o.canli()) return;
      r.yerler[i].yer.hidden = false;
      window.Efekt.karakter('pop');
      await o.say(i + 1);
    }
    r.kilit = false;
    if (o.canli()) tabaklar();
  }

  /* 2) Herkese bir tabak */
  function tabaklar() {
    sor('Herkese bir tabak koy.');
    let konan = 0;
    const yigin = H().el('button', { className: 'tabak-yigin', type: 'button', ariaLabel: 'Tabak' });
    yigin.addEventListener('click', async () => {
      if (r.kilit || konan >= r.n) return;
      r.kilit = true;
      r.yerler[konan].tabak.classList.remove('bos');
      window.Efekt.karakter('cin');
      konan += 1;
      yigin.style.setProperty('--kalan', r.n - konan);
      await o.say(konan);
      r.kilit = false;
      if (konan === r.n && o.canli()) menu();
    });
    yigin.style.setProperty('--kalan', r.n);
    araclar(yigin);
  }

  /* 3) Menü */
  function menu() {
    sor('Ne yiyelim? Pizza mı, pasta mı?');
    araclar(...Object.entries(YEMEK).map(([ad, y]) => {
      const b = H().el('button', { className: 'menu-kart', type: 'button' }, [
        H().el('span', { className: 'menu-resim', textContent: y.resim }),
        H().el('span', { className: 'menu-ad' }, H().renkliAd(y.kelime)),
      ]);
      b.addEventListener('click', () => yemekSec(ad));
      return b;
    }));
  }

  async function yemekSec(ad) {
    if (r.kilit) return;
    r.kilit = true;
    r.yemek = ad;
    araclar();
    const kelime = YEMEK[ad].kelime.toLocaleLowerCase('tr');
    window.Konus.sustur();
    await konus(kelime);
    const kap = $('.yemek-kap');
    kap.replaceChildren(yemekSvg());
    kap.classList.add('geldi');
    window.Efekt.karakter('pif');
    r.kilit = false;
    if (o.canli()) dilimle();
  }

  /* 4) Dilimle: kişi sayısı kadar kesim */
  function dilimle() {
    const kelime = YEMEK[r.yemek].kelime.toLocaleLowerCase('tr');
    sor(`${r.n} kişiyiz. ${kelime === 'pizza' ? 'Pizzayı' : 'Pastayı'} ${r.n} dilim keselim. Çizgilere dokun!`);
    araclar(H().el('span', { className: 'bicak', textContent: '🔪' }));
    document.querySelectorAll('.kesim').forEach((k) => k.addEventListener('click', () => kes(Number(k.dataset.kesim), k)));
  }

  async function kes(k, el) {
    if (r.kilit || r.kesik.has(k)) return;
    r.kilit = true;
    r.kesik.add(k);
    el.classList.add('kesildi');
    window.Efekt.karakter('kes');
    await H().bekle(500);
    r.kilit = false;
    if (r.kesik.size < r.n || !o.canli()) return;
    r.kilit = true;
    $('.yemek').classList.add('ayrildi');
    await sor('Hadi dilimleri sayalım!');
    const dilimler = [...document.querySelectorAll('.dilim')];
    for (let i = 0; i < dilimler.length; i += 1) {
      if (!o.canli()) return;
      dilimler[i].classList.add('sayildi');
      await o.say(i + 1);
    }
    await sor(`${r.n} kişi, ${r.n} dilim!`);
    r.kilit = false;
    if (o.canli()) paylastir();
  }

  /* 5) Paylaştır */
  function paylastir() {
    sor('Herkese bir dilim ver. Dilime dokun!');
    araclar();
    document.querySelectorAll('.dilim').forEach((d) => d.addEventListener('click', () => dilimVer(Number(d.dataset.dilim), d)));
  }

  async function dilimVer(i, el) {
    if (r.kilit || el.classList.contains('verildi')) return;
    r.kilit = true;
    const sira = r.dagitilan;
    const { tabak } = r.yerler[sira];
    el.classList.add('verildi');
    tabak.append(tekDilimSvg(i));
    tabak.classList.add('dolu');
    window.Efekt.karakter('pop');
    r.dagitilan += 1;
    const ad = r.misafirler[sira].ad;
    window.Konus.sustur();
    await o.say(r.dagitilan);
    if (ad) await konus(`${ad.toLocaleLowerCase('tr')} için bir dilim`);
    r.kilit = false;
    if (r.dagitilan === r.n && o.canli()) afiyet();
  }

  async function afiyet() {
    r.kilit = true;
    await sor('Herkesin tabağında bir dilim var. Afiyet olsun!');
    if (!o.canli()) return;
    window.Efekt.karakter('nyam');
    document.querySelectorAll('.tabak-dilim').forEach((d) => d.classList.add('yeniyor'));
    document.querySelectorAll('.misafir').forEach((m) => m.classList.add('yiyor'));
    await H().bekle(1900);
    if (!o.canli()) return;
    window.Efekt.tac();
    window.Gorsel.konfeti();
    window.Gorsel.kalpler($('#restoran-masa'), 10);
    await sor('Herkes doydu! Hepsi bitti!');
    if (!o.canli()) return;
    const tekrar = H().el('button', { className: 'buyuk-dugme', type: 'button', textContent: '🔁 Yine gel' });
    tekrar.addEventListener('click', () => baslat(o));
    const cik = H().el('button', { className: 'buyuk-dugme ikinci', type: 'button', textContent: '🚪 Sokağa çık' });
    cik.addEventListener('click', () => o.cik());
    araclar(tekrar, cik);
  }

  return Object.freeze({ baslat });
})();
