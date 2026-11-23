/*
 * HAFTAM: tamamen resimli haftalık program, "kaç gün kaldı" geri sayımı ve saat öğrenme.
 * Okuma bilmeyen çocuk için her şey resimli ve sesli: güne, etkinliğe ya da saate dokununca okunur.
 *
 *   Haftam        7 gün yan yana (Pazartesi başlar), bugün vurgulu. Hafta içi 09–18 okul; duş, havuz, tenis …
 *                 varsayılan olarak günlere dağıtılır. "+" ile resim ve saat (kadranlı saat düğmeleri) seçilerek eklenir.
 *                 ✏️ Düzenle açıkken etkinlikler silinebilir. Geri sayımdaki günler (doğum günü …) o güne de düşer.
 *   Kaç gün kaldı Yılbaşı kendiliğinden; doğum günü, bayram, tatil … eklenir. Kalan gün sayısı ve her gece için bir 🌙.
 *   Saat          üstte canlı analog saat (dokununca "Saat üç buçuk" der); "Saat kaç?" oyunu: tam saat ve buçuk.
 *
 * Saklama: Depo 'program' = { etkinlikler: [{ id, gun 0..6, saat, bitis?, ad, resim }], sayac: [{ id, ad, resim, tarih }] }.
 */
window.Haftam = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);

  const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const KISA = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
  const SAYI = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'on bir', 'on iki'];
  const ETKINLIK = [
    ['Okul', '🏫'], ['Duş', '🚿'], ['Banyo', '🛁'], ['Havuz', '🏊'], ['Tenis', '🎾'], ['Futbol', '⚽'], ['Bale', '🩰'], ['Dans', '💃'],
    ['Jimnastik', '🤸'], ['Piyano', '🎹'], ['Resim', '🎨'], ['Kitap', '📖'], ['Park', '🛝'], ['Bisiklet', '🚲'], ['Oyun', '🧸'],
    ['Market', '🛒'], ['Doktor', '🩺'], ['Dişçi', '🦷'], ['Ninem', '👵'], ['Dedem', '👴'], ['Arkadaş', '🧒'], ['Doğum günü', '🎂'],
    ['Sinema', '🎬'], ['Tiyatro', '🎭'], ['Müze', '🏛️'], ['Yemek', '🍽️'], ['Uyku', '😴'], ['Kurs', '✏️'],
  ];
  const SAYAC_TURU = [['Doğum günüm', '🎂'], ['Bayram', '🍬'], ['Tatil', '🏖️'], ['Gösteri', '🎭'], ['Gezi', '🚗'], ['Misafir', '🧳'], ['Okul tatili', '🎒'], ['Özel gün', '⭐']];
  const SAATLER = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  const VARSAYILAN = () => {
    let n = 0;
    const e = (gun, saat, ad, resim, bitis) => ({ id: `v${(n += 1)}`, gun, saat, ad, resim, ...(bitis ? { bitis } : {}) });
    return {
      etkinlikler: [
        ...[0, 1, 2, 3, 4].map((g) => e(g, 9, 'Okul', '🏫', 18)),
        e(0, 19, 'Duş', '🚿'), e(1, 19, 'Havuz', '🏊'), e(2, 19, 'Duş', '🚿'), e(3, 19, 'Tenis', '🎾'), e(4, 19, 'Duş', '🚿'),
        e(5, 10, 'Havuz', '🏊'), e(5, 15, 'Park', '🛝'), e(6, 11, 'Tenis', '🎾'), e(6, 16, 'Ninem', '👵'),
      ],
      sayac: [],
    };
  };

  let program = VARSAYILAN();
  let sekme = 'hafta';
  let duzenle = false;
  let saatZamani = null;

  const kaydet = () => window.Depo.yaz('program', program).catch(() => {});
  const soyle = (t) => { window.Konus.sustur(); return window.Konus.soyle(t); };
  const kimlik = () => `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  /* ---------- zaman yardımcıları ---------- */
  const bugunNo = () => (new Date().getDay() + 6) % 7; // 0 = Pazartesi
  const gece = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d; };
  const kalanGun = (tarih) => Math.round((gece(tarih) - gece(new Date())) / 86400000);
  const yilbasi = () => { const s = new Date(); return new Date(s.getFullYear() + 1, 0, 1); };
  const haftaBasi = () => { const d = gece(new Date()); d.setDate(d.getDate() - bugunNo()); return d; };
  const tarihMetni = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const tarihOku = (s) => { const [y, a, g] = s.split('-').map(Number); return new Date(y, a - 1, g); };

  /** "sabah dokuz", "öğlen bir buçuk", "akşam altı", "gece dokuz" */
  function saatSoz(saat, dakika = 0) {
    const s = saat % 12 === 0 ? 12 : saat % 12;
    const v = saat < 6 ? 'gece' : saat < 12 ? 'sabah' : saat < 14 ? 'öğlen' : saat < 18 ? 'öğleden sonra' : saat < 21 ? 'akşam' : 'gece';
    return `${v} ${SAYI[s]}${dakika >= 30 ? ' buçuk' : ''}`;
  }
  const saatYazi = (s, d = 0) => `${String(s).padStart(2, '0')}:${String(d).padStart(2, '0')}`;
  const vakit = (saat) => (saat < 6 ? 'gece' : saat < 12 ? 'sabah' : saat < 14 ? 'öğlen' : saat < 18 ? 'öğleden sonra' : saat < 21 ? 'akşam' : 'gece');
  const on2 = (saat) => (saat % 12 === 0 ? 12 : saat % 12);
  const BULUNMA = { 1: 'de', 2: 'de', 3: 'te', 4: 'te', 5: 'te', 6: 'da', 7: 'de', 8: 'de', 9: 'da', 10: 'da', 11: 'de', 12: 'de' };
  const YONELME = { 1: 'e', 2: 'ye', 3: 'e', 4: 'e', 5: 'e', 6: 'ya', 7: 'ye', 8: 'e', 9: 'a', 10: 'a', 11: 'e', 12: 'ye' };
  /** "sabah dokuzda", "akşam yedide" (sesli okuma) */
  const saatte = (saat) => `${vakit(saat)} ${SAYI[on2(saat)]}${BULUNMA[on2(saat)]}`;
  /** "akşam altıya" */
  const saate = (saat) => `${vakit(saat)} ${SAYI[on2(saat)]}${YONELME[on2(saat)]}`;

  /* ---------- analog saat ---------- */
  function saatSvg(saat, dakika = 0, { sayilar = 'hepsi', sinif = 'hp-saat' } = {}) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 100 100');
    s.setAttribute('class', sinif);
    const akrep = ((saat % 12) + dakika / 60) * 30;
    const yelkovan = dakika * 6;
    const rakamlar = (sayilar === 'hepsi' ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [12, 3, 6, 9])
      .map((n) => {
        const a = ((n * 30 - 90) * Math.PI) / 180;
        return `<text x="${50 + 36 * Math.cos(a)}" y="${50 + 36 * Math.sin(a)}" text-anchor="middle" dominant-baseline="central">${n}</text>`;
      }).join('');
    const cizgiler = Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="6" x2="50" y2="${i % 3 ? 10 : 12}" transform="rotate(${i * 30} 50 50)"/>`).join('');
    s.innerHTML = `<circle cx="50" cy="50" r="46" class="kadran"/>${cizgiler}<g class="rakam">${rakamlar}</g>
      <line x1="50" y1="50" x2="50" y2="26" class="akrep" transform="rotate(${akrep} 50 50)"/>
      <line x1="50" y1="50" x2="50" y2="14" class="yelkovan" transform="rotate(${yelkovan} 50 50)"/>
      <circle cx="50" cy="50" r="4" class="orta"/>`;
    return s;
  }

  /* ---------- açılış ---------- */
  function kart(sira) {
    const k = H().el('button', { className: 'kart kart-mod kart-haftam', type: 'button' }, [
      H().el('span', { className: 'kart-resim' }, [H().el('span', { className: 'kart-yuz yuz-emoji', textContent: '📅' })]),
      H().el('span', { className: 'kart-ad' }, H().renkliAd('HAFTAM')),
      H().el('span', { className: 'kart-rol', textContent: 'Program, saat' }),
    ]);
    k.style.setProperty('--gecikme', `${sira * 60}ms`);
    k.addEventListener('click', ac);
    return k;
  }

  async function ac() {
    window.Efekt.ac();
    try {
      const p = await window.Depo.oku('program');
      if (p && Array.isArray(p.etkinlikler)) program = { etkinlikler: p.etkinlikler, sayac: Array.isArray(p.sayac) ? p.sayac : [] };
    } catch { /* varsayılan program */ }
    H().ekranAc('haftam');
    $('#haftam-tekrar').onclick = () => soyle(`Bugün ${GUNLER[bugunNo()]}. Saat ${saatSoz(new Date().getHours(), new Date().getMinutes())}.`);
    sekme = 'hafta'; duzenle = false;
    ciz();
    clearInterval(saatZamani);
    saatZamani = setInterval(ustSaatGuncelle, 30000);
    const g = bugunNo();
    const bugun = program.etkinlikler.filter((e) => e.gun === g).sort((a, b) => a.saat - b.saat);
    soyle(`Bugün ${GUNLER[g]}! ${bugun.length ? `Bugün ${bugun.map((e) => `${saatte(e.saat)} ${e.ad.toLocaleLowerCase('tr')}`).join(', ')} var.` : ''}`);
  }

  function ustSaatGuncelle() {
    const kap = $('#hp-ust-saat');
    if (!kap || $('#haftam').hidden) { clearInterval(saatZamani); return; }
    const s = new Date();
    kap.replaceChildren(saatSvg(s.getHours(), s.getMinutes(), { sinif: 'hp-saat buyuk' }));
  }

  /* ---------- çizim ---------- */
  function ciz() {
    const s = new Date();
    const ustSaat = H().el('button', { id: 'hp-ust-saat', className: 'hp-ust-saat', type: 'button', ariaLabel: 'Saat kaç?' }, [saatSvg(s.getHours(), s.getMinutes(), { sinif: 'hp-saat buyuk' })]);
    ustSaat.addEventListener('click', () => { const t = new Date(); soyle(`Şimdi saat ${saatSoz(t.getHours(), t.getMinutes())}.`); });
    const bugunYazi = H().el('button', { className: 'hp-bugun', type: 'button' }, [
      H().el('span', { className: 'hp-bugun-ust', textContent: 'BUGÜN' }), H().el('span', {}, [H().renkliAd(GUNLER[bugunNo()].toLocaleUpperCase('tr'))]),
    ]);
    bugunYazi.addEventListener('click', () => soyle(`Bugün ${GUNLER[bugunNo()]}.`));
    const sekmeDugme = (ad, simge, yazi) => {
      const b = H().el('button', { className: `hp-sekme${sekme === ad ? ' secili' : ''}`, type: 'button' }, [H().el('span', { className: 'simge', textContent: simge }), H().el('span', { textContent: yazi })]);
      b.addEventListener('click', () => { sekme = ad; ciz(); soyle(yazi); });
      return b;
    };
    const ust = H().el('div', { className: 'hp-ust' }, [ustSaat, bugunYazi,
      H().el('div', { className: 'hp-sekmeler' }, [sekmeDugme('hafta', '📅', 'Haftam'), sekmeDugme('sayac', '⏳', 'Kaç gün kaldı'), sekmeDugme('saat', '🕒', 'Saat oyunu')])]);
    const govde = sekme === 'hafta' ? haftaCiz() : sekme === 'sayac' ? sayacCiz() : saatOyunu();
    $('#haftam-sahne').replaceChildren(ust, govde);
  }

  /* ---------- haftam ---------- */
  function etkinlikKarti(e, gun) {
    const k = H().el('button', { className: `hp-etk${e.ozel ? ' ozel' : ''}${e.bitis ? ' uzun' : ''}`, type: 'button' }, [
      H().el('span', { className: 'hp-etk-resim', textContent: e.resim }),
      e.saat != null ? saatSvg(e.saat, 0, { sayilar: 'dort', sinif: 'hp-saat kucuk' }) : null,
      H().el('span', { className: 'hp-etk-saat', textContent: e.saat != null ? (e.bitis ? `${e.saat}–${e.bitis}` : saatYazi(e.saat)) : '' }),
    ]);
    if (duzenle && !e.ozel) {
      const sil = H().el('span', { className: 'hp-sil', textContent: '✕' });
      k.append(sil);
    }
    k.addEventListener('click', () => {
      if (duzenle && !e.ozel) {
        program.etkinlikler = program.etkinlikler.filter((x) => x.id !== e.id);
        kaydet(); ciz(); soyle(`${e.ad} silindi.`);
        return;
      }
      const ad = e.ad.toLocaleLowerCase('tr');
      if (e.ozel) soyle(`${GUNLER[gun]}: ${ad}!`);
      else soyle(`${GUNLER[gun]}, ${saatte(e.saat)} ${ad}${e.bitis ? `, ${saate(e.bitis)} kadar` : ''}.`);
    });
    return k;
  }

  function haftaCiz() {
    const bas = haftaBasi();
    const sutunlar = GUNLER.map((gunAdi, g) => {
      const tarih = new Date(bas); tarih.setDate(bas.getDate() + g);
      const ozel = program.sayac.filter((c) => tarihMetni(tarihOku(c.tarih)) === tarihMetni(tarih)).map((c) => ({ ...c, ozel: true, saat: null }));
      if (tarihMetni(tarih) === tarihMetni(yilbasi())) ozel.push({ ad: 'Yılbaşı', resim: '🎄', ozel: true, saat: null });
      const liste = program.etkinlikler.filter((e) => e.gun === g).sort((a, b) => a.saat - b.saat);
      const baslik = H().el('button', { className: 'hp-gun-baslik', type: 'button' }, [
        H().el('span', { className: 'hp-gun-ad' }, [H().renkliAd(KISA[g])]),
        H().el('span', { className: 'hp-gun-tarih', textContent: tarih.getDate() }),
      ]);
      baslik.addEventListener('click', () => {
        const l = liste.map((e) => `${saatte(e.saat)} ${e.ad.toLocaleLowerCase('tr')}`);
        soyle(`${gunAdi}${g === bugunNo() ? ', bugün' : ''}. ${l.length ? l.join(', ') : 'Boş gün'}.`);
      });
      const ekle = H().el('button', { className: 'hp-ekle', type: 'button', textContent: '+', ariaLabel: `${gunAdi} ekle` });
      ekle.addEventListener('click', () => ekleAc(g));
      return H().el('div', { className: `hp-gun${g === bugunNo() ? ' bugun' : ''}${g >= 5 ? ' haftasonu' : ''}` }, [
        baslik, ...ozel.map((e) => etkinlikKarti(e, g)), ...liste.map((e) => etkinlikKarti(e, g)), ekle,
      ]);
    });
    const duzenleDugme = H().el('button', { className: `hp-duzenle${duzenle ? ' acik' : ''}`, type: 'button', textContent: duzenle ? '✅ Bitti' : '✏️ Düzenle' });
    duzenleDugme.addEventListener('click', () => { duzenle = !duzenle; ciz(); soyle(duzenle ? 'Silmek istediğine dokun.' : 'Tamam.'); });
    return H().el('div', { className: 'hp-hafta-kap' }, [H().el('div', { className: 'hp-hafta' }, sutunlar), duzenleDugme]);
  }

  /* Ekleme: 1) resim seç 2) saat seç (kadranlı düğmeler). */
  function ekleAc(gun) {
    const ortu = H().el('div', { className: 'hp-ortu' });
    const kutu = H().el('div', { className: 'hp-kutu' });
    ortu.append(kutu);
    document.body.append(ortu);
    const kapat = () => ortu.remove();
    ortu.addEventListener('click', (e) => { if (e.target === ortu) kapat(); });
    const resimSec = () => {
      kutu.replaceChildren(
        H().el('p', { className: 'hp-soru', textContent: `${GUNLER[gun]}: ne yapacaksın?` }),
        H().el('div', { className: 'hp-izgara' }, ETKINLIK.map(([ad, resim]) => {
          const b = H().el('button', { className: 'hp-sec', type: 'button', ariaLabel: ad }, [H().el('span', { className: 'hp-sec-resim', textContent: resim })]);
          b.addEventListener('click', () => { soyle(`${ad}. Saat kaçta?`); saatSec(ad, resim); });
          return b;
        })),
        H().el('button', { className: 'hp-vazgec', type: 'button', textContent: '✕', onclick: kapat }),
      );
      soyle(`${GUNLER[gun]}. Ne yapacaksın? Bir resim seç.`);
    };
    const saatSec = (ad, resim) => {
      kutu.replaceChildren(
        H().el('p', { className: 'hp-soru' }, [H().el('span', { className: 'hp-soru-resim', textContent: resim }), ' Saat kaçta?']),
        H().el('div', { className: 'hp-saatler' }, SAATLER.map((s) => {
          const b = H().el('button', { className: `hp-saat-sec ${s < 12 ? 'sabah' : s < 18 ? 'ogle' : 'aksam'}`, type: 'button' }, [
            saatSvg(s, 0, { sinif: 'hp-saat orta' }), H().el('span', { textContent: s < 12 ? '☀️' : s < 18 ? '🌤️' : '🌙' }),
          ]);
          b.addEventListener('click', () => {
            program.etkinlikler.push({ id: kimlik(), gun, saat: s, ad, resim });
            kaydet(); kapat(); ciz();
            window.Efekt.karakter('cin');
            soyle(`Tamam! ${GUNLER[gun]}, ${saatte(s)} ${ad.toLocaleLowerCase('tr')}.`);
          });
          b.addEventListener('pointerenter', () => {});
          return b;
        })),
        H().el('button', { className: 'hp-vazgec', type: 'button', textContent: '↩', onclick: resimSec }),
      );
    };
    resimSec();
  }

  /* ---------- kaç gün kaldı ---------- */
  function sayacCiz() {
    const liste = [{ ad: 'Yılbaşı', resim: '🎄', tarih: tarihMetni(yilbasi()), sabit: true },
      ...program.sayac.filter((c) => kalanGun(tarihOku(c.tarih)) >= 0)]
      .sort((a, b) => tarihOku(a.tarih) - tarihOku(b.tarih));
    const kartlar = liste.map((c) => {
      const gun = kalanGun(tarihOku(c.tarih));
      const aylar = gun > 0 && gun <= 31 ? H().el('div', { className: 'hp-uykular' }, Array.from({ length: gun }, () => H().el('span', { textContent: '🌙' }))) : null;
      const k = H().el('button', { className: `hp-sayac${gun === 0 ? ' bugun' : ''}`, type: 'button' }, [
        H().el('span', { className: 'hp-sayac-resim', textContent: c.resim }),
        H().el('span', { className: 'hp-sayac-gun', textContent: gun === 0 ? '🎉' : gun }),
        H().el('span', { className: 'hp-sayac-alt', textContent: gun === 0 ? 'BUGÜN!' : 'gün' }),
        aylar,
      ]);
      if (duzenle && !c.sabit) k.append(H().el('span', { className: 'hp-sil', textContent: '✕' }));
      k.addEventListener('click', () => {
        if (duzenle && !c.sabit) { program.sayac = program.sayac.filter((x) => x.id !== c.id); kaydet(); ciz(); soyle(`${c.ad} silindi.`); return; }
        const ad = c.ad.toLocaleLowerCase('tr');
        soyle(gun === 0 ? `${ad} bugün! Yaşasın!` : gun === 1 ? `${ad} yarın! Bir uyku kaldı!` : `${ad} için ${gun} gün kaldı. ${gun} kere uyuyup uyanınca!`);
      });
      return k;
    });
    const ekle = H().el('button', { className: 'hp-sayac hp-sayac-ekle', type: 'button' }, [H().el('span', { className: 'hp-sayac-resim', textContent: '➕' }), H().el('span', { className: 'hp-sayac-alt', textContent: 'Gün ekle' })]);
    ekle.addEventListener('click', sayacEkle);
    const duzenleDugme = H().el('button', { className: `hp-duzenle${duzenle ? ' acik' : ''}`, type: 'button', textContent: duzenle ? '✅ Bitti' : '✏️ Düzenle' });
    duzenleDugme.addEventListener('click', () => { duzenle = !duzenle; ciz(); });
    return H().el('div', { className: 'hp-sayac-kap' }, [H().el('div', { className: 'hp-sayaclar' }, [...kartlar, ekle]), duzenleDugme]);
  }

  /* Gün ekleme: resmi çocuk seçer, tarihi büyük girer (takvim). */
  function sayacEkle() {
    const ortu = H().el('div', { className: 'hp-ortu' });
    const kutu = H().el('div', { className: 'hp-kutu' });
    ortu.append(kutu);
    document.body.append(ortu);
    const kapat = () => ortu.remove();
    ortu.addEventListener('click', (e) => { if (e.target === ortu) kapat(); });
    kutu.replaceChildren(
      H().el('p', { className: 'hp-soru', textContent: 'Hangi günü bekliyorsun?' }),
      H().el('div', { className: 'hp-izgara' }, SAYAC_TURU.map(([ad, resim]) => {
        const b = H().el('button', { className: 'hp-sec', type: 'button', ariaLabel: ad }, [H().el('span', { className: 'hp-sec-resim', textContent: resim }), H().el('span', { className: 'hp-sec-ad', textContent: ad })]);
        b.addEventListener('click', () => {
          soyle(`${ad}. Büyüklerin tarihi seçsin.`);
          const tarih = H().el('input', { type: 'date', className: 'hp-tarih', min: tarihMetni(new Date()) });
          const tamam = H().el('button', { className: 'hp-tamam', type: 'button', textContent: 'Tamam' });
          tamam.addEventListener('click', () => {
            if (!tarih.value) { soyle('Önce tarihi seç.'); return; }
            program.sayac.push({ id: kimlik(), ad, resim, tarih: tarih.value });
            kaydet(); kapat(); ciz();
            const g = kalanGun(tarihOku(tarih.value));
            soyle(`${ad.toLocaleLowerCase('tr')} için ${g} gün kaldı!`);
          });
          kutu.replaceChildren(H().el('p', { className: 'hp-soru' }, [H().el('span', { className: 'hp-soru-resim', textContent: resim }), ` ${ad}: hangi gün?`]), tarih, tamam,
            H().el('button', { className: 'hp-vazgec', type: 'button', textContent: '✕', onclick: kapat }));
        });
        return b;
      })),
      H().el('button', { className: 'hp-vazgec', type: 'button', textContent: '✕', onclick: kapat }),
    );
  }

  /* ---------- saat oyunu ---------- */
  const oyun = { seviye: 1, dogru: 0 };
  function saatOyunu() {
    const kap = H().el('div', { className: 'hp-oyun' });
    const yeni = () => {
      const buçuk = oyun.seviye === 2;
      const saat = 1 + Math.floor(Math.random() * 12);
      const dk = buçuk && Math.random() < 0.6 ? 30 : 0;
      const yanlislar = H().karistir([...Array(12).keys()].map((i) => i + 1).filter((x) => x !== saat)).slice(0, 2);
      const secenekler = H().karistir([[saat, dk], ...yanlislar.map((x) => [x, buçuk ? (Math.random() < 0.5 ? 30 : 0) : 0])]);
      const soz = `${SAYI[saat]}${dk ? ' buçuk' : ''}`;
      const seviyeDugme = (n, yazi) => { const b = H().el('button', { className: `hp-seviye${oyun.seviye === n ? ' secili' : ''}`, type: 'button', textContent: yazi }); b.addEventListener('click', () => { oyun.seviye = n; yeni(); }); return b; };
      if (oyun.seviye === 1) {
        /* seviye 1: saati gösterir, "Saat kaç?" — üç sayıdan biri */
        kap.replaceChildren(
          H().el('div', { className: 'hp-seviyeler' }, [seviyeDugme(1, '🕐 Tam saat'), seviyeDugme(2, '🕧 Buçuk')]),
          saatSvg(saat, 0, { sinif: 'hp-saat dev' }),
          H().el('div', { className: 'hp-cevaplar' }, H().karistir([saat, ...yanlislar]).map((n) => {
            const b = H().el('button', { className: 'hp-cevap', type: 'button', textContent: n });
            b.addEventListener('click', () => cevapla(n === saat, b, `Saat ${SAYI[saat]}!`, yeni, () => soyle(`Kısa kol hangi sayıyı gösteriyor?`)));
            return b;
          })),
          H().el('p', { className: 'hp-oyun-skor', textContent: '⭐'.repeat(Math.min(oyun.dogru, 10)) }),
        );
        soyle('Saat kaç? Kısa kol hangi sayıyı gösteriyor?');
      } else {
        /* seviye 2: "Saat dört buçuk" denir; üç saatten doğrusu seçilir */
        kap.replaceChildren(
          H().el('div', { className: 'hp-seviyeler' }, [seviyeDugme(1, '🕐 Tam saat'), seviyeDugme(2, '🕧 Buçuk')]),
          H().el('button', { className: 'hp-soru-buyuk', type: 'button', textContent: `🔊 ${saatYazi(saat, dk)}`, onclick: () => soyle(`Saat ${soz}`) }),
          H().el('div', { className: 'hp-cevaplar saatli' }, secenekler.map(([s, d]) => {
            const b = H().el('button', { className: 'hp-cevap saatli', type: 'button' }, [saatSvg(s, d, { sinif: 'hp-saat orta' })]);
            b.addEventListener('click', () => cevapla(s === saat && d === dk, b, `Evet! Saat ${soz}.`, yeni,
              () => soyle(dk ? 'Buçukta uzun kol aşağıda, altıyı gösterir.' : 'Tam saatte uzun kol yukarıda, on ikiyi gösterir.')));
            return b;
          })),
          H().el('p', { className: 'hp-oyun-skor', textContent: '⭐'.repeat(Math.min(oyun.dogru, 10)) }),
        );
        soyle(`Saat ${soz} hangisi?`);
      }
    };
    yeni();
    return kap;
  }

  async function cevapla(dogru, dugme, mesaj, sonraki, ipucu) {
    if (!dogru) {
      window.Efekt.yanlis();
      dugme.classList.remove('salla'); void dugme.offsetWidth; dugme.classList.add('salla');
      ipucu();
      return;
    }
    oyun.dogru += 1;
    dugme.classList.add('dogru');
    window.Efekt.karakter('cin');
    if (oyun.dogru % 5 === 0) window.Gorsel.konfeti();
    await soyle(mesaj);
    if (!$('#haftam').hidden && sekme === 'saat') sonraki();
  }

  function durdur() { clearInterval(saatZamani); document.querySelectorAll('.hp-ortu').forEach((o) => o.remove()); }

  return Object.freeze({ kart, durdur, saatSoz, saatte });
})();
