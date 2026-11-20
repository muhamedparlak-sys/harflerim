/*
 * SOY AĞACI: ayarlarda eklenen aile üyeleri "Yakınlık" alanına göre (anne, baba, dayı, teyze, amca, hala, dede,
 * anneanne, babaanne, abla, abi, kardeş, kuzen …) ağaçta kendi yerine yerleşir. Yeni kişi eklendikçe ağaç büyür.
 *
 *   Büyükler    anne tarafı (anneanne, dede)          |  baba tarafı (babaanne, dede)
 *   Ebeveynler  teyze, dayı … ANNE  ❤️  BABA … amca, hala
 *   Çocuklar    anne tarafı kuzenler | BEN + kardeşler | baba tarafı kuzenler
 *   Diğer       yenge, enişte, arkadaş, öğretmen, bilinmeyen yakınlıklar
 *
 * Bir kişiye dokununca yakınlığı ve adı okunur; ✏️ ile adı harf harf yazılır (kasabadaki şifre paneliyle).
 * "Dede" gibi tarafı belli olmayan büyükler, yakınlıkta "anne"/"baba" geçiyorsa o tarafa, yoksa boş olan tarafa konur.
 */
window.Agac = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const kucuk = (k) => (k || '').toLocaleLowerCase('tr');

  /* Yakınlık sözcükleri (uzundan kısaya: "anneanne" "anne"den önce denenir). */
  const ROLLER = [
    ['anneanne', 'anneanne'], ['babaanne', 'babaanne'], ['büyükanne', 'nine'], ['nine', 'nine'], ['büyükbaba', 'dede'], ['dede', 'dede'],
    ['kuzen', 'kuzen'], ['kızı', 'kuzen'], ['oğlu', 'kuzen'], ['yenge', 'yenge'], ['enişte', 'eniste'],
    ['teyze', 'teyze'], ['dayı', 'dayi'], ['amca', 'amca'], ['hala', 'hala'],
    ['anne', 'anne'], ['baba', 'baba'], ['abla', 'abla'], ['ağabey', 'abi'], ['abi', 'abi'], ['kardeş', 'kardes'],
    ['kendim', 'ben'], ['kendisi', 'ben'], ['ben', 'ben'],
  ];
  /** Ayar ekranındaki "Yakınlık" kutusuna öneri listesi. */
  const ONERILER = ['Anne', 'Baba', 'Anneanne', 'Babaanne', 'Dede (anne tarafı)', 'Dede (baba tarafı)', 'Teyze', 'Dayı', 'Amca', 'Hala',
    'Abla', 'Abi', 'Kardeş', 'Teyze kızı', 'Dayı oğlu', 'Amca kızı', 'Hala oğlu', 'Yenge', 'Enişte', 'Ben'];

  function rolBul(rol) {
    const r = kucuk(rol);
    const bul = ROLLER.find(([kelime]) => r.includes(kelime));
    if (!bul) return { tur: 'diger', taraf: null };
    let taraf = null;
    const tur = bul[1];
    if (['anneanne', 'teyze', 'dayi'].includes(tur)) taraf = 'anne';
    if (['babaanne', 'amca', 'hala'].includes(tur)) taraf = 'baba';
    if (['dede', 'nine', 'kuzen', 'yenge', 'eniste'].includes(tur)) {
      const kalan = r.replace(bul[0], '');
      if (/anne|teyze|dayı/.test(kalan)) taraf = 'anne';
      else if (/baba|amca|hala/.test(kalan)) taraf = 'baba';
    }
    return { tur, taraf };
  }

  /** Aileyi ağaçtaki yerlere dağıtır. */
  function yerlestir(aile) {
    const y = {
      buyukAnne: [], buyukBaba: [], ebeAnne: [], ebeBaba: [], anne: [], baba: [],
      kuzenAnne: [], kuzenBaba: [], cocuk: [], ben: [], diger: [],
    };
    const belirsizBuyuk = [];
    const belirsizKuzen = [];
    aile.forEach((kisi) => {
      const { tur, taraf } = rolBul(kisi.rol);
      const k = { kisi, tur };
      switch (tur) {
        case 'anneanne': y.buyukAnne.push(k); break;
        case 'babaanne': y.buyukBaba.push(k); break;
        case 'dede': case 'nine':
          if (taraf === 'anne') y.buyukAnne.push(k); else if (taraf === 'baba') y.buyukBaba.push(k); else belirsizBuyuk.push(k);
          break;
        case 'teyze': case 'dayi': y.ebeAnne.push(k); break;
        case 'amca': case 'hala': y.ebeBaba.push(k); break;
        case 'yenge': case 'eniste':
          if (taraf === 'anne') y.ebeAnne.push(k); else if (taraf === 'baba') y.ebeBaba.push(k); else y.diger.push(k);
          break;
        case 'anne': y.anne.push(k); break;
        case 'baba': y.baba.push(k); break;
        case 'abla': case 'abi': case 'kardes': y.cocuk.push(k); break;
        case 'kuzen':
          if (taraf === 'anne') y.kuzenAnne.push(k); else if (taraf === 'baba') y.kuzenBaba.push(k); else belirsizKuzen.push(k);
          break;
        case 'ben': y.ben.push(k); break;
        default: y.diger.push(k);
      }
    });
    /* tarafı belli olmayan dede/nine: aynı türden henüz olmayan tarafa (önce anne tarafı) */
    belirsizBuyuk.forEach((k) => {
      const varMi = (liste) => liste.some((x) => x.tur === k.tur || (k.tur === 'nine' && /anne$/.test(x.tur)));
      if (!varMi(y.buyukAnne)) y.buyukAnne.push(k);
      else if (!varMi(y.buyukBaba)) y.buyukBaba.push(k);
      else y.buyukBaba.push(k);
    });
    belirsizKuzen.forEach((k, i) => (i % 2 ? y.kuzenBaba : y.kuzenAnne).push(k));
    /* anne tarafında anne en sağda (babaya yakın), baba tarafında baba en solda */
    y.buyukAnne.sort((a, b) => (a.tur === 'dede') - (b.tur === 'dede'));
    y.buyukBaba.sort((a, b) => (b.tur === 'dede') - (a.tur === 'dede'));
    return y;
  }

  /* ---------- çizim ---------- */
  function dugum(k, sinif = '') {
    const { kisi } = k;
    const rol = kisi.rol || '';
    const kap = H().el('div', { className: `agac-kisi ${sinif}` });
    const resim = H().el('button', { className: 'agac-resim-dugme', type: 'button', ariaLabel: kucuk(kisi.name) }, [H().yuz(kisi, 'agac-resim')]);
    resim.addEventListener('click', () => { window.Konus.sustur(); window.Konus.soyle(kucuk(rol ? `${rol}, ${kisi.name}` : kisi.name)); });
    const yaz = H().el('button', { className: 'agac-yaz', type: 'button', ariaLabel: `${kucuk(kisi.name)} yaz`, textContent: '✏️' });
    yaz.addEventListener('click', () => yazdir(kisi));
    kap.append(resim, yaz, H().el('span', { className: 'agac-ad' }, [H().renkliAd(kisi.name)]), rol ? H().el('span', { className: 'agac-rol', textContent: rol }) : '');
    return kap;
  }

  function benDugumu(y) {
    if (y.ben.length) return y.ben.map((k) => dugum(k, 'ben'));
    /* çocuk kendini eklemediyse: kasabadaki karakteri */
    const kap = H().el('div', { className: 'agac-kisi ben' });
    const resim = H().el('span', { className: 'agac-resim agac-kiz' });
    window.Depo.oku('kiz').then((kiz) => resim.replaceChildren(window.Kiz.on({ ...window.Kiz.VARSAYILAN, ...(kiz || {}) }, { mutlu: true }))).catch(() => {});
    resim.append(window.Kiz.on(window.Kiz.VARSAYILAN, { mutlu: true }));
    kap.append(resim, H().el('span', { className: 'agac-ad' }, [H().renkliAd('BEN')]));
    return [kap];
  }

  const bosDugum = (ad) => H().el('div', { className: 'agac-kisi bos' }, [
    H().el('span', { className: 'agac-resim yuz-emoji', textContent: '➕' }), H().el('span', { className: 'agac-rol', textContent: ad }),
  ]);

  const grup = (sinif, ...cocuklar) => H().el('div', { className: `agac-grup ${sinif}` }, cocuklar.flat().filter(Boolean));

  function ciz() {
    const aile = H().aile();
    const y = yerlestir(aile);
    const sahne = $('#agac-sahne');
    const satir = (sinif, ...gruplar) => H().el('div', { className: `agac-satir ${sinif}` }, gruplar);

    const gBuyukAnne = y.buyukAnne.length ? grup('buyuk-anne', y.buyukAnne.map((k) => dugum(k))) : null;
    const gBuyukBaba = y.buyukBaba.length ? grup('buyuk-baba', y.buyukBaba.map((k) => dugum(k))) : null;
    const gAnneTaraf = grup('anne-taraf', y.ebeAnne.map((k) => dugum(k)), y.anne.length ? y.anne.map((k) => dugum(k, 'ebeveyn')) : bosDugum('Anne'));
    const kalp = H().el('span', { className: 'agac-kalp', textContent: '❤️' });
    const gBabaTaraf = grup('baba-taraf', y.baba.length ? y.baba.map((k) => dugum(k, 'ebeveyn')) : bosDugum('Baba'), y.ebeBaba.map((k) => dugum(k)));
    const gKuzenAnne = y.kuzenAnne.length ? grup('kuzen-anne', y.kuzenAnne.map((k) => dugum(k))) : null;
    const gCocuk = grup('cocuklar', y.cocuk.filter((k) => k.tur !== 'kardes').map((k) => dugum(k)), benDugumu(y), y.cocuk.filter((k) => k.tur === 'kardes').map((k) => dugum(k)));
    const gKuzenBaba = y.kuzenBaba.length ? grup('kuzen-baba', y.kuzenBaba.map((k) => dugum(k))) : null;

    const agac = H().el('div', { className: 'soy-agaci' }, [
      (gBuyukAnne || gBuyukBaba) ? satir('buyukler', gBuyukAnne || grup('bos-yer'), gBuyukBaba || grup('bos-yer')) : null,
      satir('ebeveynler', gAnneTaraf, kalp, gBabaTaraf),
      satir('cocuklar-satiri', gKuzenAnne || grup('bos-yer'), gCocuk, gKuzenBaba || grup('bos-yer')),
    ].filter(Boolean));
    const cizgiler = document.createElementNS(NS, 'svg');
    cizgiler.setAttribute('class', 'agac-cizgiler');
    agac.prepend(cizgiler);
    const parcalar = [agac];
    if (y.diger.length) {
      parcalar.push(H().el('div', { className: 'agac-diger' }, [
        H().el('span', { className: 'agac-diger-baslik', textContent: '💛 Sevdiklerimiz' }),
        H().el('div', { className: 'agac-grup' }, y.diger.map((k) => dugum(k))),
      ]));
    }
    if (!aile.length) parcalar.unshift(H().el('p', { className: 'agac-not', textContent: 'Ebeveyn: ⚙️ ayarlardan aileyi ekleyin; "Yakınlık" kutusuna anne, baba, dayı, teyze, amca, hala … yazın.' }));
    sahne.replaceChildren(...parcalar);

    /* bağlantı çizgileri: büyükler → kendi taraflarındaki çocukları; anne-baba → çocuklar; teyze/dayı ve amca/hala → kuzenler */
    const bagla = () => {
      const kutu = agac.getBoundingClientRect();
      cizgiler.setAttribute('viewBox', `0 0 ${kutu.width} ${kutu.height}`);
      const alt = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - kutu.left, r.bottom - kutu.top]; };
      const ust = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - kutu.left, r.top - kutu.top]; };
      const yol = (a, b) => {
        const orta = (a[1] + b[1]) / 2;
        return `<path d="M${a[0]} ${a[1]} V${orta} H${b[0]} V${b[1]}" />`;
      };
      let d = '';
      if (gBuyukAnne) d += yol(alt(gBuyukAnne), ust(gAnneTaraf));
      if (gBuyukBaba) d += yol(alt(gBuyukBaba), ust(gBabaTaraf));
      d += yol(alt(kalp), ust(gCocuk));
      if (gKuzenAnne) d += yol(alt(gAnneTaraf), ust(gKuzenAnne));
      if (gKuzenBaba) d += yol(alt(gBabaTaraf), ust(gKuzenBaba));
      cizgiler.innerHTML = d;
    };
    requestAnimationFrame(bagla);
    window.onresize = () => { if (!$('#agac').hidden) bagla(); };
  }

  /* ---------- açılış, yazdırma ---------- */
  async function yazdir(kisi) {
    window.Konus.sustur();
    const tamam = await window.Kasaba.yazdir(kisi.name.toLocaleUpperCase('tr'), `${kucuk(kisi.name)} yazalım! Harfleri sırayla bul.`, '🌳');
    if (tamam) { window.Gorsel.konfeti(); window.Konus.soyle(`Aferin! ${kucuk(kisi.name)} yazdın!`); }
  }

  function kart(sira) {
    const k = H().el('button', { className: 'kart kart-mod kart-agac', type: 'button' }, [
      H().el('span', { className: 'kart-resim' }, [H().el('span', { className: 'kart-yuz yuz-emoji', textContent: '🌳' })]),
      H().el('span', { className: 'kart-ad' }, H().renkliAd('SOY AĞACI')),
      H().el('span', { className: 'kart-rol', textContent: 'Ailem' }),
    ]);
    k.style.setProperty('--gecikme', `${sira * 60}ms`);
    k.addEventListener('click', ac);
    return k;
  }

  function ac() {
    window.Efekt.ac();
    H().ekranAc('agac');
    ciz();
    $('#agac-tekrar').onclick = () => { window.Konus.sustur(); window.Konus.soyle('Bu bizim ailemiz! Birine dokun, adını dinle. Kalemle adını yazabilirsin.'); };
    window.Konus.sustur();
    window.Konus.soyle('Bu bizim ailemiz! Birine dokun, adını dinle. Kalemle adını yazabilirsin.');
  }

  return Object.freeze({ kart, ac, yerlestir, rolBul, ONERILER });
})();
