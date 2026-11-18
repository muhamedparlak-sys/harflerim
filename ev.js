/*
 * Ev: koridorda dört şifreli kapı (ODA, MUTFAK, SALON, BANYO). Odadaki her eşyanın üstünde adı yazar;
 * çocuk eşyaya dokununca adını harf harf yazar, yazınca eşya çalışır (duşun kapağı açılır, fırından kek çıkar …).
 * Yazdırmaya teşvik: yazılmamış etiketler parlar, yazılanlara ✓ gelir, odadaki bütün kelimeler yazılınca konfeti.
 * Yazılan kelimeler uygulama açık kaldıkça hatırlanır; ikinci dokunuşta eşya doğrudan çalışır.
 *
 *   Banyo   DUŞ (kapak açılır, su akar), SU (musluk, el yıkarken beşe kadar say), SABUN (köpükleri patlat, say), AYNA (buğu silinir)
 *   Mutfak  FIRIN (kapak açılır, kek kabarır), ÇAY (çaydanlık tüter), ELMA (elmalar zıplar, say), MASA (sofra kurulur)
 *   Salon   LAMBA (yanar), SAAT (guguk kuşu çıkar), KİTAP (açılır, bir harf ve karakteri gösterir), TOP (zıplar, say)
 *   Oda     PERDE (açılır, güneş), DOLAP (kıyafet değiştir), YATAK (uyu), AYI (sarılır)
 *
 * Sahne 1000 × 600 birimlik bir düzlemdir (en-boy 5:3); eşyaların yeri ve boyu bu birimlerle verilir.
 */
window.Ev = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const KOPUK_SAYISI = 5;
  const kucuk = (k) => k.toLocaleLowerCase('tr');

  const yazilan = new Set(); // bu açılışta yazılan eşya adları
  const kutlanan = new Set(); // bütün kelimeleri yazılmış odalar

  let c = null; // kasaba bağlamı: kiz, canli, sifre, konus, say, harfResmi, harfHavuzu, yaratAc, evIci
  let sahne = null;

  const svg = (w, h, icerik) => `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${icerik}</svg>`;
  const yuzde = ({ x, y, w, h }) => `left:${x / 10}%;bottom:${y / 6}%;width:${w / 10}%;height:${h / 6}%`;
  const durum = (dugme, acik) => dugme.classList.toggle('acik', acik);

  /* ---------------- eşyalar ---------------- */
  const ESYA = {
    /* ---- banyo ---- */
    DUŞ: {
      yer: { x: 700, y: 40, w: 250, h: 500 },
      ciz: (w, h) => `
        <rect x="14" y="20" width="222" height="440" fill="#D7EEF7"/>
        <path d="M36 20 L36 460 M76 20 L76 460 M116 20 L116 460 M156 20 L156 460 M196 20 L196 460 M14 80 L236 80 M14 160 L236 160 M14 240 L236 240 M14 320 L236 320 M14 400 L236 400" stroke="#fff" stroke-width="3"/>
        <path d="M200 20 L200 60 Q200 70 186 70 L150 70" fill="none" stroke="#8D99AE" stroke-width="10" stroke-linecap="round"/>
        <ellipse cx="128" cy="76" rx="34" ry="12" fill="#6C757D"/>
        <g class="su">${[100, 114, 128, 142, 156].map((x, i) => `<path d="M${x} 90 L${x + (x - 128) * 0.5} 450" stroke="#4EA8DE" stroke-width="5" stroke-linecap="round" style="animation-delay:${i * 0.08}s"/>`).join('')}</g>
        <rect x="0" y="456" width="250" height="${h - 456}" rx="10" fill="#fff" stroke="#ADB5BD" stroke-width="4"/>
        <rect x="6" y="10" width="238" height="450" rx="10" fill="none" stroke="#8D99AE" stroke-width="10"/>
        <g class="kapak"><rect x="14" y="18" width="222" height="436" rx="8" fill="#9FD8EF" opacity=".72" stroke="#8ECAE6" stroke-width="6"/>
          <path d="M50 60 L110 20 M50 110 L180 24 M180 420 L230 380" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>
          <rect x="196" y="200" width="14" height="70" rx="7" fill="#6C757D"/></g>`,
      async calis(d, a) {
        const acik = !d.classList.contains('acik');
        durum(d, acik);
        window.Efekt.karakter(acik ? 'akarsu' : 'kapi');
        await a.konus(acik ? 'Duşun kapağı açıldı! Şırıl şırıl su akıyor.' : 'Duşun kapağı kapandı.');
      },
    },
    SU: {
      yer: { x: 420, y: 90, w: 170, h: 230 },
      ciz: () => `
        <rect x="70" y="120" width="30" height="110" rx="8" fill="#fff" stroke="#ADB5BD" stroke-width="4"/>
        <path d="M60 30 L60 14 Q60 6 70 6 L100 6 Q110 6 110 18 L110 26" fill="none" stroke="#8D99AE" stroke-width="10" stroke-linecap="round"/>
        <circle cx="60" cy="40" r="9" fill="#4CC9F0"/>
        <path class="akan" d="M110 30 L110 110" stroke="#4EA8DE" stroke-width="8" stroke-linecap="round"/>
        <path d="M6 56 L164 56 Q164 128 85 128 Q6 128 6 56Z" fill="#fff" stroke="#ADB5BD" stroke-width="5" stroke-linejoin="round"/>
        <ellipse cx="85" cy="62" rx="64" ry="8" fill="#E9F6FB"/>`,
      async calis(d, a) {
        if (d.classList.contains('acik')) { durum(d, false); await a.konus('Musluğu kapattın. Suyu boşa akıtmayalım!'); return; }
        durum(d, true);
        window.Efekt.karakter('akarsu');
        await a.konus('Su akıyor! Ellerini yıka, beşe kadar sayalım.');
        for (let n = 1; n <= 5 && a.canli(); n += 1) await a.say(n);
        if (!a.canli()) return;
        durum(d, false);
        await a.konus('Tertemiz oldu!');
      },
    },
    AYNA: {
      yer: { x: 440, y: 350, w: 130, h: 190 },
      ciz: () => `
        <ellipse cx="65" cy="96" rx="56" ry="84" fill="#DFF3FB" stroke="#B07A4F" stroke-width="9"/>
        <g class="yansima"><circle cx="65" cy="90" r="26" fill="#FFD6A5"/><circle cx="56" cy="86" r="3.5" fill="#3B2C2A"/><circle cx="74" cy="86" r="3.5" fill="#3B2C2A"/>
          <path d="M54 98 Q65 108 76 98" fill="none" stroke="#3B2C2A" stroke-width="3" stroke-linecap="round"/></g>
        <g class="pirilti" fill="#fff"><path d="M30 50 l4 -12 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4z"/><path d="M96 140 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3z"/></g>
        <ellipse class="bugu" cx="65" cy="96" rx="52" ry="80" fill="#F8F9FA"/>`,
      async calis(d, a) {
        const acik = !d.classList.contains('acik');
        durum(d, acik);
        window.Efekt.karakter(acik ? 'cin' : 'ufle');
        await a.konus(acik ? 'Buğuyu sildin, ayna pırıl pırıl! Gülümse.' : 'Hıhh! Ayna yine buğulandı.');
      },
    },
    SABUN: {
      yer: { x: 230, y: 300, w: 140, h: 90 },
      ciz: () => `
        <rect x="4" y="60" width="132" height="14" rx="7" fill="#B07A4F"/>
        <path d="M24 60 Q24 30 70 30 Q116 30 116 60Z" fill="#FF8FB5" stroke="#E5689A" stroke-width="4"/>
        <ellipse cx="58" cy="42" rx="18" ry="5" fill="#fff" opacity=".6"/>
        <g fill="#fff" stroke="#BDE0FE" stroke-width="2"><circle cx="40" cy="18" r="8"/><circle cx="62" cy="10" r="6"/><circle cx="96" cy="16" r="9"/></g>`,
      async calis(d, a) {
        window.Efekt.karakter('pop');
        await a.konus('Köpükler uçtu! Hepsini patlat ve say.');
        await kopukler(a);
      },
    },

    /* ---- mutfak ---- */
    FIRIN: {
      yer: { x: 40, y: 50, w: 220, h: 290 },
      ciz: () => `
        <rect x="6" y="20" width="208" height="270" rx="12" fill="#F1F3F5" stroke="#868E96" stroke-width="6"/>
        <rect x="6" y="20" width="208" height="40" rx="10" fill="#495057"/>
        <g fill="#212529"><ellipse cx="50" cy="40" rx="26" ry="8"/><ellipse cx="110" cy="40" rx="26" ry="8"/><ellipse cx="170" cy="40" rx="26" ry="8"/></g>
        <g fill="#868E96"><circle cx="40" cy="84" r="9"/><circle cx="76" cy="84" r="9"/><circle cx="144" cy="84" r="9"/><circle cx="180" cy="84" r="9"/></g>
        <rect x="26" y="110" width="168" height="150" rx="10" fill="#3B2C2A"/>
        <g class="kek"><rect x="62" y="196" width="96" height="50" rx="8" fill="#E0A458"/><path d="M62 204 Q110 160 158 204Z" fill="#C68B45"/>
          <circle cx="110" cy="176" r="8" fill="#E63946"/></g>
        <g class="buhar2"><path d="M86 150 Q78 136 88 124 M110 146 Q102 132 112 120 M134 150 Q126 136 136 124" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/></g>
        <g class="firin-kapak"><rect x="26" y="110" width="168" height="150" rx="10" fill="#343A40" stroke="#868E96" stroke-width="5"/>
          <rect x="50" y="140" width="120" height="80" rx="8" fill="#FFB703" opacity=".45"/>
          <rect x="60" y="120" width="100" height="10" rx="5" fill="#ADB5BD"/></g>`,
      async calis(d, a) {
        const acik = !d.classList.contains('acik');
        durum(d, acik);
        window.Efekt.karakter(acik ? 'zil' : 'kapi');
        await a.konus(acik ? 'Fırının kapağı açıldı, kek kabardı! Mis gibi.' : 'Fırın kapandı.');
      },
    },
    ÇAY: {
      yer: { x: 300, y: 300, w: 130, h: 130 },
      ciz: () => `
        <g class="buhar2"><path d="M108 28 Q98 16 108 4 M122 34 Q112 22 122 10" fill="none" stroke="#ADB5BD" stroke-width="5" stroke-linecap="round"/></g>
        <path d="M20 128 L110 128 L104 62 Q65 40 26 62Z" fill="#E63946" stroke="#B5121B" stroke-width="5" stroke-linejoin="round"/>
        <path d="M104 80 L126 46" stroke="#B5121B" stroke-width="10" stroke-linecap="round"/>
        <path d="M40 54 Q65 24 90 54" fill="none" stroke="#3B2C2A" stroke-width="6"/>
        <ellipse cx="65" cy="58" rx="30" ry="8" fill="#FF6B6B"/><circle cx="65" cy="48" r="7" fill="#3B2C2A"/>
        <path d="M44 96 L86 96" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`,
      async calis(d, a) {
        durum(d, true);
        window.Efekt.karakter('cay');
        await a.konus('Çaydanlık fokur fokur kaynıyor! Çay hazır.');
        await H().bekle(1200);
        durum(d, false);
      },
    },
    ELMA: {
      yer: { x: 450, y: 300, w: 130, h: 100 },
      ciz: () => `
        <path d="M6 56 L124 56 Q118 96 65 96 Q12 96 6 56Z" fill="#4CC9F0" stroke="#1D63D8" stroke-width="4"/>
        ${[[34, 40], [65, 30], [96, 40]].map(([x, y], i) => `<g class="elma e${i}"><circle cx="${x}" cy="${y}" r="20" fill="#E63946"/><path d="M${x} ${y - 20} q2 -10 8 -12" stroke="#5C3A21" stroke-width="4" fill="none"/><ellipse cx="${x + 9}" cy="${y - 24}" rx="7" ry="4" fill="#52B788"/><ellipse cx="${x - 7}" cy="${y - 6}" rx="5" ry="7" fill="#fff" opacity=".45"/></g>`).join('')}`,
      async calis(d, a) {
        await a.konus('Kaseye bak, elmaları sayalım!');
        for (let n = 1; n <= 3 && a.canli(); n += 1) {
          const e = d.querySelector(`.e${n - 1}`);
          e.classList.remove('hop'); void e.getBoundingClientRect(); e.classList.add('hop');
          await a.say(n);
        }
        if (a.canli()) await a.konus('Üç elma! Afiyet olsun.');
      },
    },
    MASA: {
      yer: { x: 620, y: 50, w: 240, h: 190 },
      ciz: () => `
        <rect x="30" y="80" width="14" height="110" fill="#8D5524"/><rect x="196" y="80" width="14" height="110" fill="#8D5524"/>
        <rect x="6" y="66" width="228" height="20" rx="6" fill="#B07A4F"/>
        <g class="sofra">
          <path d="M10 62 L230 62 L222 112 L18 112Z" fill="#FF8FA3" opacity=".9"/>
          <path d="M18 112 L40 62 M62 112 L74 62 M106 112 L108 62 M150 112 L142 62 M194 112 L176 62" stroke="#fff" stroke-width="3" opacity=".7"/>
          <ellipse cx="60" cy="58" rx="28" ry="8" fill="#fff" stroke="#ADB5BD" stroke-width="3"/><ellipse cx="180" cy="58" rx="28" ry="8" fill="#fff" stroke="#ADB5BD" stroke-width="3"/>
          <path d="M108 58 L104 26 Q120 18 136 26 L132 58Z" fill="#4CC9F0"/>
          <circle cx="112" cy="12" r="9" fill="#FFB703"/><circle cx="128" cy="10" r="9" fill="#FF6F61"/><circle cx="120" cy="2" r="8" fill="#9B5DE5"/>
        </g>`,
      async calis(d, a) {
        const acik = !d.classList.contains('acik');
        durum(d, acik);
        window.Efekt.karakter(acik ? 'tak' : 'sac');
        await a.konus(acik ? 'Sofra kuruldu: örtü, tabaklar, çiçekler. Masa hazır!' : 'Sofrayı topladın.');
      },
    },

    /* ---- salon ---- */
    LAMBA: {
      yer: { x: 40, y: 50, w: 140, h: 400 },
      ciz: () => `
        <circle class="isik" cx="70" cy="90" r="80" fill="url(#lamba-isik)"/>
        <defs><radialGradient id="lamba-isik"><stop offset="0" stop-color="#FFE66D" stop-opacity=".95"/><stop offset="1" stop-color="#FFE66D" stop-opacity="0"/></radialGradient></defs>
        <rect x="66" y="110" width="8" height="270" fill="#6C757D"/>
        <ellipse cx="70" cy="388" rx="44" ry="10" fill="#495057"/>
        <path class="abajur" d="M30 120 L110 120 L92 50 L48 50Z" fill="#F4A261" stroke="#E07A2F" stroke-width="4" stroke-linejoin="round"/>`,
      async calis(d, a) {
        const acik = !d.classList.contains('acik');
        durum(d, acik);
        sahne.classList.toggle('lamba-acik', acik);
        window.Efekt.karakter(acik ? 'cin' : 'tak');
        await a.konus(acik ? 'Lamba yandı! Ortalık aydınlandı.' : 'Lamba söndü.');
      },
    },
    SAAT: {
      yer: { x: 520, y: 360, w: 130, h: 180 },
      ciz: () => `
        <g class="kus"><circle cx="65" cy="46" r="14" fill="#FFB703"/><path d="M78 44 L92 48 L78 52Z" fill="#E07A2F"/><circle cx="69" cy="42" r="3" fill="#3B2C2A"/></g>
        <path d="M10 70 L65 20 L120 70Z" fill="#8D5524"/>
        <rect x="18" y="64" width="94" height="104" rx="8" fill="#B07A4F"/>
        <rect x="52" y="30" width="26" height="24" rx="4" fill="#3B2C2A"/>
        <circle cx="65" cy="112" r="38" fill="#FFF8E7" stroke="#5C3A21" stroke-width="5"/>
        <g fill="#5C3A21"><circle cx="65" cy="82" r="3"/><circle cx="95" cy="112" r="3"/><circle cx="65" cy="142" r="3"/><circle cx="35" cy="112" r="3"/></g>
        <path class="akrep" d="M65 112 L65 90" stroke="#3B2C2A" stroke-width="6" stroke-linecap="round"/>
        <path class="yelkovan" d="M65 112 L88 112" stroke="#E63946" stroke-width="4" stroke-linecap="round"/>
        <circle cx="65" cy="112" r="5" fill="#3B2C2A"/>
        <path d="M50 168 L46 178 M80 168 L84 178" stroke="#5C3A21" stroke-width="4"/>`,
      async calis(d, a) {
        durum(d, true);
        window.Efekt.karakter('tiktak');
        await H().bekle(1500);
        if (!a.canli()) return;
        window.Efekt.karakter('guguk');
        await a.konus('Guguk! Guguk! Saat çalıyor.');
        durum(d, false);
      },
    },
    KİTAP: {
      yer: { x: 790, y: 50, w: 180, h: 420 },
      ciz: () => `
        <rect x="6" y="6" width="168" height="408" rx="8" fill="#8D5524"/>
        <rect x="16" y="16" width="148" height="388" fill="#B07A4F"/>
        ${[110, 210, 310].map((y) => `<rect x="16" y="${y}" width="148" height="10" fill="#8D5524"/>`).join('')}
        ${[[24, 40, '#E63946'], [44, 50, '#1D63D8'], [64, 34, '#FFB703'], [84, 46, '#2EC4B6'], [110, 40, '#9B5DE5'], [130, 50, '#FF8FA3'],
    [28, 140, '#2EC4B6'], [50, 150, '#E63946'], [76, 136, '#FFB703'], [100, 150, '#1D63D8'],
    [30, 240, '#9B5DE5'], [56, 236, '#FF8FA3'], [86, 250, '#2EC4B6'], [112, 240, '#E63946']]
    .map(([x, y, r], i) => `<rect class="${i === 3 ? 'ucan-kitap' : ''}" x="${x}" y="${y}" width="18" height="${(Math.floor(y / 100) + 1) * 100 + 10 - y}" rx="3" fill="${r}"/>`).join('')}
        <ellipse cx="90" cy="372" rx="30" ry="22" fill="#52B788"/><rect x="78" y="370" width="24" height="34" rx="4" fill="#E07A2F"/>`,
      async calis(d, a) {
        durum(d, true);
        window.Efekt.karakter('sac');
        await H().bekle(400);
        if (a.canli()) await kitapAc(a);
        durum(d, false);
      },
    },
    TOP: {
      yer: { x: 560, y: 40, w: 110, h: 110 },
      ciz: () => `
        <g class="zipla-top"><circle cx="55" cy="55" r="48" fill="#fff" stroke="#3B2C2A" stroke-width="3"/>
          <path d="M55 7 A48 48 0 0 1 103 55 L55 55Z" fill="#E63946"/><path d="M55 103 A48 48 0 0 1 7 55 L55 55Z" fill="#1D63D8"/>
          <path d="M7 55 A48 48 0 0 1 55 7 L55 55Z" fill="#FFB703"/><circle cx="55" cy="55" r="10" fill="#fff"/></g>`,
      async calis(d, a) {
        durum(d, false); void d.getBoundingClientRect(); durum(d, true);
        for (let n = 1; n <= 3 && a.canli(); n += 1) {
          window.Efekt.karakter('pop');
          await Promise.all([a.say(n), H().bekle(700)]);
        }
        durum(d, false);
        if (a.canli()) await a.konus('Top üç kere zıpladı!');
      },
    },

    /* ---- oda ---- */
    PERDE: {
      yer: { x: 120, y: 270, w: 240, h: 250 },
      ciz: () => `
        <rect x="20" y="30" width="200" height="200" rx="8" fill="#8FD3FF" stroke="#fff" stroke-width="10"/>
        <circle class="gunes" cx="150" cy="90" r="26" fill="#FFD23F"/>
        <path d="M30 230 Q80 180 130 210 Q170 180 210 214 L210 225 L30 225Z" fill="#A6E07A"/>
        <path d="M120 30 L120 230 M20 130 L220 130" stroke="#fff" stroke-width="8"/>
        <rect x="6" y="14" width="228" height="12" rx="6" fill="#8D5524"/>
        <g class="perde-sol"><path d="M10 20 L124 20 Q114 120 124 244 L10 244Z" fill="#9B5DE5"/><path d="M40 24 L40 240 M72 24 L72 240 M100 24 L104 240" stroke="#B388EB" stroke-width="6"/></g>
        <g class="perde-sag"><path d="M230 20 L116 20 Q126 120 116 244 L230 244Z" fill="#9B5DE5"/><path d="M200 24 L200 240 M168 24 L168 240 M140 24 L136 240" stroke="#B388EB" stroke-width="6"/></g>`,
      async calis(d, a) {
        const acik = !d.classList.contains('acik');
        durum(d, acik);
        window.Efekt.karakter('sac');
        await a.konus(acik ? 'Perde açıldı! Günaydın, güneş!' : 'Perde kapandı.');
      },
    },
    DOLAP: {
      yer: { x: 770, y: 50, w: 200, h: 420 },
      ciz: () => `
        <rect x="6" y="6" width="188" height="400" rx="12" fill="#B47A55"/>
        <rect x="18" y="20" width="164" height="372" fill="#7A4E36"/>
        <path d="M30 60 L170 60" stroke="#ADB5BD" stroke-width="5"/>
        <path d="M44 62 L34 150 L80 150 L70 62Z" fill="#FF8FB5"/><path d="M96 62 L88 140 L126 140 L118 62Z" fill="#4CC9F0"/><path d="M140 62 L132 160 L170 160 L160 62Z" fill="#FFB703"/>
        <g class="kapak-sol"><rect x="12" y="14" width="88" height="384" rx="6" fill="#D9996E" stroke="#B47A55" stroke-width="5"/><circle cx="88" cy="210" r="7" fill="#FFD166"/></g>
        <g class="kapak-sag"><rect x="100" y="14" width="88" height="384" rx="6" fill="#D9996E" stroke="#B47A55" stroke-width="5"/><circle cx="112" cy="210" r="7" fill="#FFD166"/></g>
        <rect x="20" y="404" width="20" height="14" fill="#8D5524"/><rect x="160" y="404" width="20" height="14" fill="#8D5524"/>`,
      async calis(d, a) {
        durum(d, true);
        window.Efekt.karakter('kapi');
        await H().bekle(600);
        if (a.canli()) c.yaratAc('oda');
      },
    },
    YATAK: {
      yer: { x: 400, y: 50, w: 300, h: 170 },
      ciz: () => `
        <rect x="6" y="20" width="22" height="150" rx="8" fill="#B47A55"/><rect x="272" y="70" width="22" height="100" rx="8" fill="#B47A55"/>
        <rect x="20" y="96" width="262" height="50" rx="12" fill="#FF8FB5"/>
        <ellipse cx="74" cy="92" rx="44" ry="18" fill="#fff"/>
        <path d="M110 84 L276 84 Q284 84 284 96 L284 130 L110 130Z" fill="#9B5DE5"/>
        <path d="M130 84 L130 130 M170 84 L170 130 M210 84 L210 130 M250 84 L250 130" stroke="#B388EB" stroke-width="5"/>
        <g class="zzz" fill="#1D63D8" font-weight="900" font-family="sans-serif"><text x="200" y="50" font-size="30">z</text><text x="226" y="30" font-size="24">z</text><text x="248" y="14" font-size="18">z</text></g>`,
      async calis(d, a) {
        durum(d, true);
        a.kiz.classList.add('uyu');
        window.Efekt.karakter('horul');
        await a.konus('İyi uykular!');
        await H().bekle(1800);
        a.kiz.classList.remove('uyu');
        durum(d, false);
        if (a.canli()) await a.konus('Günaydın!');
      },
    },
    AYI: {
      yer: { x: 300, y: 50, w: 100, h: 130 },
      ciz: () => `
        <g class="ayi-govde">
          <circle cx="24" cy="26" r="14" fill="#C98B5A"/><circle cx="76" cy="26" r="14" fill="#C98B5A"/>
          <ellipse cx="50" cy="98" rx="34" ry="30" fill="#C98B5A"/><ellipse cx="50" cy="102" rx="18" ry="18" fill="#E8C29A"/>
          <circle cx="50" cy="46" r="30" fill="#C98B5A"/><ellipse cx="50" cy="56" rx="13" ry="10" fill="#E8C29A"/>
          <ellipse cx="50" cy="51" rx="5" ry="4" fill="#3B2C2A"/><circle cx="38" cy="40" r="4" fill="#3B2C2A"/><circle cx="62" cy="40" r="4" fill="#3B2C2A"/>
          <ellipse cx="22" cy="122" rx="12" ry="8" fill="#B5784A"/><ellipse cx="78" cy="122" rx="12" ry="8" fill="#B5784A"/>
          <path d="M40 76 L50 84 L60 76" fill="#E63946"/></g>`,
      async calis(d, a) {
        durum(d, false); void d.getBoundingClientRect(); durum(d, true);
        window.Efekt.karakter('hu');
        window.Gorsel.kalpler(d, 5);
        await a.konus('Ayıcık sana sarıldı!');
        durum(d, false);
      },
    },
  };

  const ODALAR = {
    banyo: { ad: 'BANYO', esyalar: ['DUŞ', 'SU', 'AYNA', 'SABUN'], kiz: 18, dekor: banyoDekor },
    mutfak: { ad: 'MUTFAK', esyalar: ['FIRIN', 'ÇAY', 'ELMA', 'MASA'], kiz: 52, dekor: mutfakDekor },
    salon: { ad: 'SALON', esyalar: ['LAMBA', 'SAAT', 'KİTAP', 'TOP'], kiz: 30, dekor: salonDekor },
    oda: { ad: 'ODA', esyalar: ['PERDE', 'DOLAP', 'YATAK', 'AYI'], kiz: 12, dekor: () => '' },
  };
  const KAPILAR = [['oda', '#F28CB1'], ['mutfak', '#FFB703'], ['salon', '#6BCB77'], ['banyo', '#4CC9F0']];

  /* ---------------- dekor (dokunulmayan arka plan) ---------------- */
  function banyoDekor() {
    return `<rect x="80" y="250" width="16" height="140" rx="6" fill="#ADB5BD"/>
      <path d="M60 260 L120 260 L120 380 Q90 396 60 380Z" fill="#2EC4B6"/><path d="M60 300 L120 300 M60 340 L120 340" stroke="#fff" stroke-width="5"/>
      <ellipse cx="160" cy="574" rx="70" ry="14" fill="#90E0EF"/>`;
  }
  function mutfakDekor() {
    return `<rect x="280" y="300" width="330" height="250" fill="#FFF8E7" stroke="#E9C46A" stroke-width="6"/>
      <rect x="270" y="290" width="350" height="16" rx="6" fill="#E9C46A"/>
      <path d="M445 330 L445 540 M290 420 L600 420" stroke="#E9C46A" stroke-width="5"/><circle cx="425" cy="380" r="6" fill="#B07A4F"/><circle cx="465" cy="380" r="6" fill="#B07A4F"/>
      <rect x="880" y="130" width="110" height="420" rx="14" fill="#E9ECEF" stroke="#ADB5BD" stroke-width="6"/><path d="M880 280 L990 280" stroke="#ADB5BD" stroke-width="6"/>
      <rect x="896" y="200" width="10" height="50" rx="5" fill="#868E96"/><rect x="896" y="300" width="10" height="70" rx="5" fill="#868E96"/>
      <rect x="320" y="120" width="250" height="120" rx="10" fill="#8FD3FF" stroke="#fff" stroke-width="10"/><path d="M445 120 L445 240" stroke="#fff" stroke-width="8"/>`;
  }
  function salonDekor() {
    return `<ellipse cx="420" cy="555" rx="300" ry="34" fill="#E07A5F" opacity=".55"/>
      <path d="M200 420 Q200 380 240 380 L460 380 Q500 380 500 420 L500 470 L200 470Z" fill="#457B9D"/>
      <rect x="180" y="440" width="340" height="80" rx="20" fill="#1D3557"/><rect x="190" y="420" width="70" height="80" rx="18" fill="#457B9D"/><rect x="440" y="420" width="70" height="80" rx="18" fill="#457B9D"/>
      <rect x="196" y="516" width="16" height="30" fill="#8D5524"/><rect x="490" y="516" width="16" height="30" fill="#8D5524"/>
      <rect x="250" y="160" width="90" height="110" rx="6" fill="#FFF8E7" stroke="#B07A4F" stroke-width="10"/><circle cx="295" cy="205" r="22" fill="#FFD6A5"/><path d="M262 262 Q295 226 328 262Z" fill="#F28CB1"/>
      <rect x="370" y="190" width="80" height="80" rx="6" fill="#FFF8E7" stroke="#B07A4F" stroke-width="10"/><path d="M380 260 L410 220 L440 260Z" fill="#6BCB77"/><circle cx="430" cy="210" r="10" fill="#FFD23F"/>`;
  }

  /* ---------------- yardımcılar ---------------- */
  function etiket(kelime) {
    const yazildi = yazilan.has(kelime);
    const e = H().el('span', { className: `ev-etiket${yazildi ? ' yazildi' : ''}` }, [H().renkliAd(kelime)]);
    if (yazildi) e.append(H().el('span', { className: 'ev-tik', textContent: '✓' }));
    return e;
  }

  function kizKoy(sol) {
    const k = H().el('div', { className: 'ev-kiz' }, [window.Kiz.on(c.kiz, { orgu: c.kiz.orgu, oje: c.kiz.oje, mutlu: true })]);
    k.style.left = `${sol}%`;
    return k;
  }

  const api = (kiz) => ({ konus: (t) => { window.Konus.sustur(); return c.konus(t); }, say: c.say, canli: c.canli, kiz });

  /* Sabun köpükleri: ekranda uçuşur; dokununca patlar ve sayılır. */
  function kopukler(a) {
    return new Promise((bitti) => {
      let sayi = 0;
      for (let i = 0; i < KOPUK_SAYISI; i += 1) {
        const k = H().el('button', { className: 'ev-kopuk', type: 'button', ariaLabel: 'Köpük' });
        k.style.left = `${18 + i * 15 + Math.random() * 6}%`;
        k.style.top = `${12 + Math.random() * 30}%`;
        k.style.animationDelay = `${(Math.random() * 1.2).toFixed(2)}s`;
        k.addEventListener('click', async () => {
          if (k.classList.contains('patla') || !a.canli()) return;
          k.classList.add('patla');
          window.Efekt.karakter('pop');
          sayi += 1;
          setTimeout(() => k.remove(), 300);
          await a.say(sayi);
          if (sayi === KOPUK_SAYISI && a.canli()) { await a.konus('Bütün köpükleri patlattın!'); bitti(); }
        });
        sahne.append(k);
      }
    });
  }

  /* Kitap açılır: bir harf ve onun karakteri (harfin dönüştüğü çizim) görünür. */
  async function kitapAc(a) {
    const havuz = c.harfHavuzu();
    const h = havuz[Math.floor(Math.random() * havuz.length)];
    const kapat = H().el('button', { className: 'ev-kitap-kapat', type: 'button', ariaLabel: 'Kitabı kapat', textContent: '✕' });
    const kitap = H().el('div', { className: 'ev-kitap-acik' }, [
      H().el('div', { className: 'sayfa' }, [H().el('span', { className: `kitap-harf ${H().tur(h)}`, textContent: H().goster(h) })]),
      H().el('div', { className: 'sayfa' }, [c.harfResmi(h)]),
      kapat,
    ]);
    sahne.append(kitap);
    kapat.addEventListener('click', () => kitap.remove());
    kitap.querySelector('.kitap-harf').addEventListener('click', () => { window.Konus.sustur(); H().harfVeKelimeSoyle(h); });
    window.Konus.sustur();
    await c.konus('Kitap açıldı!');
    if (a.canli()) await H().harfVeKelimeSoyle(h);
  }

  function tamamMi(oda) {
    const tanim = ODALAR[oda];
    if (kutlanan.has(oda) || !tanim.esyalar.every((k) => yazilan.has(k))) return false;
    kutlanan.add(oda);
    return true;
  }

  /* ---------------- ekranlar ---------------- */
  function koridor() {
    sahne.className = 'evici-sahne ev koridor';
    const kapilar = KAPILAR.map(([oda, renk], i) => {
      const tanim = ODALAR[oda];
      const yildiz = kutlanan.has(oda) ? H().el('span', { className: 'ev-kapi-yildiz', textContent: '⭐' }) : null;
      const kapi = H().el('button', { className: 'ev-kapi', type: 'button', ariaLabel: kucuk(tanim.ad) }, [
        H().el('span', { className: 'oda-tabela' }, [H().renkliAd(tanim.ad)]), H().el('span', { className: 'oda-kanat' }), yildiz,
      ]);
      kapi.style.left = `${24 + i * 19}%`;
      kapi.style.setProperty('--kanat', renk);
      let mesgul = false;
      kapi.addEventListener('click', async () => {
        if (mesgul) return;
        mesgul = true;
        if (await c.sifre(tanim.ad)) {
          kapi.classList.add('acik');
          window.Efekt.karakter('kapi');
          await H().bekle(700);
          if (c.canli()) c.evIci(oda);
        }
        mesgul = false;
      });
      return kapi;
    });
    sahne.replaceChildren(...kapilar, kizKoy(12));
    c.konus('Evdesin! Hangi odaya gitmek istersin? Kapının adını yaz, kapı açılsın.');
  }

  function odaAc(oda) {
    const tanim = ODALAR[oda];
    sahne.className = `evici-sahne ev ev-oda ${oda}`;
    const kiz = kizKoy(tanim.kiz);
    const a = api(kiz);
    const dekor = document.createElementNS(NS, 'svg');
    dekor.setAttribute('viewBox', '0 0 1000 600');
    dekor.setAttribute('class', 'ev-dekor');
    dekor.innerHTML = tanim.dekor();
    const geri = H().el('button', { className: 'ev-geri', type: 'button', ariaLabel: 'Koridora dön', textContent: '⬅️' });
    geri.addEventListener('click', () => c.evIci('koridor'));
    let mesgul = false;
    const esyalar = tanim.esyalar.map((kelime) => {
      const e = ESYA[kelime];
      const d = H().el('button', { className: `ev-esya esya-${oda}-${tanim.esyalar.indexOf(kelime)}`, type: 'button', ariaLabel: kucuk(kelime) });
      d.style.cssText = yuzde(e.yer);
      d.innerHTML = svg(e.yer.w, e.yer.h, e.ciz(e.yer.w, e.yer.h));
      d.append(etiket(kelime));
      d.addEventListener('click', async () => {
        if (mesgul || !c.canli()) return;
        mesgul = true;
        try {
          if (!yazilan.has(kelime)) {
            const tamam = await c.sifre(kelime, `${kucuk(kelime)} yaz, ne olacak gör!`);
            if (!tamam || !c.canli()) return;
            yazilan.add(kelime);
            d.querySelector('.ev-etiket').replaceWith(etiket(kelime));
          }
          await e.calis(d, a);
          if (c.canli() && tamamMi(oda)) {
            window.Gorsel.konfeti();
            window.Efekt.tac();
            await a.konus(`Harika! ${kucuk(tanim.ad)} içindeki bütün kelimeleri yazdın!`);
          }
        } finally { mesgul = false; }
      });
      return d;
    });
    sahne.replaceChildren(dekor, ...esyalar, kiz, geri);
    const kalan = tanim.esyalar.filter((k) => !yazilan.has(k)).length;
    c.konus(kalan
      ? `Burası ${kucuk(tanim.ad)}! Eşyaların adı üstlerinde yazıyor. Birine dokun, adını yaz, ne olacak gör!`
      : `Burası ${kucuk(tanim.ad)}! Eşyalara dokunup oynayabilirsin.`);
  }

  /** yer: 'koridor' | 'oda' | 'mutfak' | 'salon' | 'banyo' */
  function ac(yer, baglam) {
    c = baglam;
    sahne = $('#evici-sahne');
    if (yer === 'koridor' || !ODALAR[yer]) koridor();
    else odaAc(yer);
  }

  return Object.freeze({ ac });
})();
