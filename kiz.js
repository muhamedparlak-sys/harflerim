/*
 * Kendi karakteri: kızın kendisinin seçtiği ten, saç, göz ve elbise renkleriyle çizilen kız.
 *   on(g, ek)   — önden görünüş (ek.orgu: yana sarkan örgü, ek.oje: tırnak rengi, ek.mutlu: ağzı açık gülüş)
 *   arka(g, a)  — arkadan görünüş (kuaför): üstte örülmüş kısım, altta 3 tutam (a.orgu adım, a.toplam)
 *   el(g, ojeler) — tırnak boyamak için büyük el (5 parmak, .parmak[data-tirnak=0..4])
 * Seçimler yalnızca cihazda (Depo 'kiz').
 */
window.Kiz = (() => {
  'use strict';

  const SECENEK = Object.freeze({
    ten: ['#FFE3CC', '#F4C7A1', '#D69C74', '#A66B48'],
    sac: ['#3B2416', '#7A4524', '#C98A3E', '#EBC86F', '#E86FA6'],
    goz: ['#5B3A1E', '#3E7CB1', '#4F8A4A'],
    elbise: ['#FF6F9F', '#9B5DE5', '#2EC4B6', '#FFB703', '#FF6F61'],
  });
  const VARSAYILAN = Object.freeze({ ten: 1, sac: 1, goz: 0, elbise: 0 });
  const NS = 'http://www.w3.org/2000/svg';

  /** Seçim (indisler) → renkler; bozuk kayıtta varsayılan. */
  function renkler(g = VARSAYILAN) {
    const sec = (ad) => {
      const i = Number.isInteger(g[ad]) ? g[ad] : VARSAYILAN[ad];
      return SECENEK[ad][i] || SECENEK[ad][VARSAYILAN[ad]];
    };
    return { ten: sec('ten'), sac: sec('sac'), goz: sec('goz'), elbise: sec('elbise') };
  }

  /** Rengi koyulaştır (gölge ve çizgiler için). */
  function koyu(hex, oran = 0.78) {
    const n = parseInt(hex.slice(1), 16);
    const k = (s) => Math.round(((n >> s) & 255) * oran);
    return `rgb(${k(16)},${k(8)},${k(0)})`;
  }

  function svg(viewBox, icerik, sinif) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('class', sinif);
    s.innerHTML = icerik; // yalnızca bu dosyadaki sabit şablonlar ve renk kodları
    return s;
  }

  /** Rengi açar (parlaklık için): beyaza doğru karıştırır. */
  function acik(hex, oran = 0.35) {
    const n = parseInt(hex.slice(1), 16);
    const k = (s) => { const c = (n >> s) & 255; return Math.round(c + (255 - c) * oran); };
    return `rgb(${k(16)},${k(8)},${k(0)})`;
  }

  let sayac = 0;
  const yeniKimlik = () => `kz${(sayac += 1)}`;

  /* Saç degradeleri: d = tutam/örgü (çapraz ışık), b = baş (sol üstten ışık). */
  function sacTanim(renk, id) {
    return `<linearGradient id="${id}-d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${acik(renk, 0.32)}"/>
        <stop offset=".5" stop-color="${renk}"/><stop offset="1" stop-color="${koyu(renk, 0.7)}"/></linearGradient>
      <radialGradient id="${id}-b" cx=".36" cy=".28" r=".85"><stop offset="0" stop-color="${acik(renk, 0.3)}"/>
        <stop offset=".45" stop-color="${renk}"/><stop offset="1" stop-color="${koyu(renk, 0.68)}"/></radialGradient>`;
  }

  const ORGU_ARALIK = 14; // halkalar üst üste biner (halka boyu ~28)

  /* Örgü: (x,y)'den aşağı, sağa sola dönüşümlü yaprak biçimli halkalar; her halkada tel çizgisi ve parıltı. */
  function orguHalkalari(x, y, adet, renk, aci = 0, id = null, olcek = 1) {
    const dolgu = id ? `url(#${id}-d)` : renk;
    let s = '';
    for (let i = 0; i < adet; i += 1) {
      const yy = y + i * ORGU_ARALIK * olcek;
      const xx = x + Math.sin(aci) * i * ORGU_ARALIK * olcek;
      const yon = i % 2 ? 1 : -1;
      s += `<g transform="translate(${xx + yon * 7 * olcek} ${yy}) rotate(${yon * -40}) scale(${olcek})">
        <path d="M0 -14 C14 -13 18 6 2 14 C-11 13 -15 -8 0 -14Z" fill="${dolgu}" stroke="${koyu(renk, 0.6)}" stroke-width="2"/>
        <path d="M-5 -8 Q4 -2 -1 10" fill="none" stroke="${koyu(renk, 0.58)}" stroke-width="1.6" opacity=".55"/>
        <path d="M4 -9 Q9 -4 8 2" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".32"/></g>`;
    }
    return s;
  }

  const fiyonk = (x, y, renk) => `<g class="fiyonk">
    <path d="M${x - 3} ${y + 4} L${x - 16} ${y + 30} L${x - 8} ${y + 27} L${x - 5} ${y + 34}Z" fill="${koyu(renk, 0.85)}"/>
    <path d="M${x + 3} ${y + 4} L${x + 16} ${y + 30} L${x + 8} ${y + 27} L${x + 5} ${y + 34}Z" fill="${koyu(renk, 0.85)}"/>
    <path d="M${x} ${y} C${x - 8} ${y - 22} ${x - 36} ${y - 20} ${x - 32} ${y - 2} C${x - 30} ${y + 12} ${x - 12} ${y + 9} ${x} ${y}Z" fill="${renk}" stroke="${koyu(renk, 0.7)}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M${x} ${y} C${x + 8} ${y - 22} ${x + 36} ${y - 20} ${x + 32} ${y - 2} C${x + 30} ${y + 12} ${x + 12} ${y + 9} ${x} ${y}Z" fill="${renk}" stroke="${koyu(renk, 0.7)}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M${x - 6} ${y - 2} C${x - 12} ${y - 12} ${x - 24} ${y - 12} ${x - 24} ${y - 3}" fill="none" stroke="${koyu(renk, 0.8)}" stroke-width="2.5" opacity=".6"/>
    <path d="M${x + 6} ${y - 2} C${x + 12} ${y - 12} ${x + 24} ${y - 12} ${x + 24} ${y - 3}" fill="none" stroke="${koyu(renk, 0.8)}" stroke-width="2.5" opacity=".6"/>
    <path d="M${x - 26} ${y - 8} Q${x - 20} ${y - 14} ${x - 14} ${y - 12}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>
    <ellipse cx="${x}" cy="${y + 1}" rx="7" ry="8" fill="${koyu(renk, 0.85)}" stroke="${koyu(renk, 0.65)}" stroke-width="2"/></g>`;

  /** Önden kız. viewBox 0 0 200 320. */
  function on(g, ek = {}) {
    const r = renkler(g);
    const oje = ek.oje || r.ten;
    const sacArka = ek.orgu
      ? `<path d="M48 92 Q46 40 100 36 Q154 40 152 92 Q150 130 140 140 L60 140 Q50 130 48 92Z" fill="${r.sac}"/>`
      : `<path d="M44 96 Q40 34 100 32 Q160 34 156 96 L162 214 Q150 226 132 214 L128 150 L72 150 L68 214 Q50 226 38 214Z" fill="${r.sac}"/>`;
    const id = yeniKimlik();
    const orgu = ek.orgu ? `<defs>${sacTanim(r.sac, id)}</defs><g class="kiz-orgu">${orguHalkalari(146, 140, 8, r.sac, 0.12, id)}${fiyonk(160, 250, '#FF4F8B')}</g>` : '';
    const agiz = ek.mutlu
      ? `<path d="M84 118 Q100 140 116 118 Z" fill="#B23A48"/><path d="M90 128 Q100 134 110 128" fill="none" stroke="#FF8FA3" stroke-width="4" stroke-linecap="round"/>`
      : `<path d="M86 118 Q100 130 114 118" fill="none" stroke="#B23A48" stroke-width="4.5" stroke-linecap="round"/>`;
    const goz = (x) => `<g class="kiz-goz"><ellipse cx="${x}" cy="96" rx="11" ry="13" fill="#fff"/>
      <circle cx="${x}" cy="98" r="8.5" fill="${r.goz}"/><circle cx="${x}" cy="99" r="4.5" fill="#1d1414"/>
      <circle cx="${x + 3}" cy="94" r="3" fill="#fff"/><circle cx="${x - 3}" cy="102" r="1.5" fill="#fff"/>
      <path d="M${x - 12} 86 Q${x} 78 ${x + 12} 86" fill="none" stroke="#2a1a14" stroke-width="3" stroke-linecap="round"/></g>`;
    const tirnak = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="2.4" fill="${oje}"/>`;
    return svg('0 0 200 320', `
      ${sacArka}
      <g class="kiz-bacak kiz-bacak-sol"><rect x="78" y="244" width="16" height="50" rx="8" fill="${r.ten}"/><ellipse cx="84" cy="298" rx="15" ry="9" fill="#E0457B"/></g>
      <g class="kiz-bacak kiz-bacak-sag"><rect x="106" y="244" width="16" height="50" rx="8" fill="${r.ten}"/><ellipse cx="116" cy="298" rx="15" ry="9" fill="#E0457B"/></g>
      <g class="kiz-kol kiz-kol-sol"><path d="M66 160 Q46 196 52 226" fill="none" stroke="${r.ten}" stroke-width="15" stroke-linecap="round"/>
        <circle cx="52" cy="230" r="10" fill="${r.ten}"/>${tirnak(48, 236)}${tirnak(55, 238)}</g>
      <g class="kiz-kol kiz-kol-sag"><path d="M134 160 Q154 196 148 226" fill="none" stroke="${r.ten}" stroke-width="15" stroke-linecap="round"/>
        <circle cx="148" cy="230" r="10" fill="${r.ten}"/>${tirnak(152, 236)}${tirnak(145, 238)}</g>
      <rect x="90" y="138" width="20" height="20" fill="${koyu(r.ten, 0.9)}"/>
      <path d="M74 152 Q100 146 126 152 L150 252 Q100 266 50 252Z" fill="${r.elbise}" stroke="${koyu(r.elbise, 0.8)}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M86 152 Q100 166 114 152" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="80" cy="206" r="5" fill="#fff" opacity=".7"/><circle cx="118" cy="226" r="5" fill="#fff" opacity=".7"/><circle cx="100" cy="190" r="5" fill="#fff" opacity=".7"/>
      <circle cx="44" cy="100" r="11" fill="${r.ten}"/><circle cx="156" cy="100" r="11" fill="${r.ten}"/>
      <circle cx="100" cy="92" r="56" fill="${r.ten}"/>
      <path d="M44 92 Q44 34 100 34 Q156 34 156 92 Q140 62 112 58 Q118 74 104 78 Q100 60 84 62 Q78 78 62 74 Q52 80 44 92Z" fill="${r.sac}"/>
      ${goz(78)}${goz(122)}
      <ellipse cx="66" cy="116" rx="9" ry="6" fill="#FF8FA3" opacity=".6"/><ellipse cx="134" cy="116" rx="9" ry="6" fill="#FF8FA3" opacity=".6"/>
      ${agiz}${orgu}`, 'kiz kiz-on');
  }

  /** Arkadan kız (kuaför koltuğunda). viewBox 0 0 200 340.
   *  Katmanlar: omuzlar/elbise → koltuk arkalığı → baş (ışıklı, tel çizgili saç) → ensede toka → örgü → 3 tutam (ya da fiyonk). */
  function arka(g, a = { orgu: 0, toplam: 6 }) {
    const r = renkler(g);
    const id = yeniKimlik();
    const OLCEK = 1.45;
    const ADIM = ORGU_ARALIK * OLCEK;
    const ust = 160 + a.orgu * ADIM;
    const kalan = Math.max(40, 318 - ust);
    const tel = koyu(r.sac, 0.6);
    /* tutam ensede toplanır (üst uç ortaya yakın), aşağıda yelpaze gibi açılır; ucu tel tel */
    const tutam = (x, i) => {
      const t = 100 + (x - 100) * 0.25;
      const alt = ust + kalan;
      const govde = `M${t - 9} ${ust} C${t - 10} ${ust + kalan * 0.4} ${x - 14} ${alt - kalan * 0.35} ${x - 10} ${alt - 8}
        L${x - 7} ${alt + 5} L${x - 3} ${alt - 2} L${x + 1} ${alt + 8} L${x + 4} ${alt - 2} L${x + 9} ${alt + 4} L${x + 10} ${alt - 8}
        C${x + 14} ${alt - kalan * 0.35} ${t + 10} ${ust + kalan * 0.4} ${t + 9} ${ust}Z`;
      const cizgi = (o) => `M${t + o} ${ust + 4} C${t + o} ${ust + kalan * 0.4} ${x + o * 1.2} ${alt - kalan * 0.35} ${x + o * 1.1} ${alt - 6}`;
      return `<g class="tutam" data-tutam="${i}">
        <path d="${govde}" fill="url(#${id}-d)" stroke="${koyu(r.sac, 0.62)}" stroke-width="2" stroke-linejoin="round"/>
        <path d="${cizgi(-4)} ${cizgi(4)}" fill="none" stroke="${tel}" stroke-width="1.5" opacity=".5"/>
        <path d="${cizgi(-1)}" fill="none" stroke="${acik(r.sac, 0.55)}" stroke-width="2.6" opacity=".35"/></g>`;
    };
    const son = a.orgu >= a.toplam
      ? `<path d="M92 ${ust - 2} Q88 ${ust + 18} 94 ${ust + 30} M100 ${ust} L100 ${ust + 34} M108 ${ust - 2} Q112 ${ust + 18} 106 ${ust + 30}" stroke="url(#${id}-d)" stroke-width="7" stroke-linecap="round" fill="none"/>${fiyonk(100, ust + 2, '#FF4F8B')}`
      : [30, 100, 170].map((x, i) => tutam(x, i)).join('');
    const telCizgileri = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]
      .map((k) => `M${100 + k * 2} 30 Q${100 + k * 13} 84 ${100 + k * 3.2} 152`).join(' ');
    return svg('0 0 200 340', `<defs>${sacTanim(r.sac, id)}
        <linearGradient id="${id}-e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${acik(r.elbise, 0.2)}"/><stop offset="1" stop-color="${koyu(r.elbise, 0.85)}"/></linearGradient>
        <linearGradient id="${id}-k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B197FC"/><stop offset="1" stop-color="#7048E8"/></linearGradient></defs>
      <path d="M30 216 Q34 170 76 160 Q100 154 124 160 Q166 170 170 216 L176 340 L24 340Z" fill="url(#${id}-e)" stroke="${koyu(r.elbise, 0.75)}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="40" cy="182" rx="22" ry="20" fill="${acik(r.elbise, 0.15)}" stroke="${koyu(r.elbise, 0.75)}" stroke-width="3"/>
      <ellipse cx="160" cy="182" rx="22" ry="20" fill="${acik(r.elbise, 0.15)}" stroke="${koyu(r.elbise, 0.75)}" stroke-width="3"/>
      <path d="M86 160 Q100 172 114 160" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
      <path d="M10 340 L14 252 Q16 232 42 230 L158 230 Q184 232 186 252 L190 340Z" fill="url(#${id}-k)" stroke="#5F3DC4" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 340 L32 262 Q34 248 52 247 L148 247 Q166 248 168 262 L170 340" fill="none" stroke="#D0BFFF" stroke-width="3" opacity=".8"/>
      <g fill="#5F3DC4"><circle cx="64" cy="276" r="4"/><circle cx="136" cy="276" r="4"/><circle cx="64" cy="316" r="4"/><circle cx="136" cy="316" r="4"/></g>
      <rect x="88" y="124" width="24" height="40" rx="8" fill="${r.ten}"/>
      <path d="M88 150 Q100 158 112 150" fill="none" stroke="${koyu(r.ten, 0.82)}" stroke-width="3" opacity=".7"/>
      <ellipse cx="43" cy="98" rx="10" ry="14" fill="${r.ten}"/><ellipse cx="157" cy="98" rx="10" ry="14" fill="${r.ten}"/>
      <ellipse cx="45" cy="98" rx="4.5" ry="8" fill="${koyu(r.ten, 0.85)}"/><ellipse cx="155" cy="98" rx="4.5" ry="8" fill="${koyu(r.ten, 0.85)}"/>
      <path d="M40 96 Q38 28 100 24 Q162 28 160 96 Q160 136 134 150 Q118 157 100 157 Q82 157 66 150 Q40 136 40 96Z" fill="url(#${id}-b)" stroke="${koyu(r.sac, 0.65)}" stroke-width="2.5"/>
      <path d="${telCizgileri}" fill="none" stroke="${tel}" stroke-width="1.7" opacity=".45"/>
      <path d="M58 66 Q100 34 142 66" fill="none" stroke="${acik(r.sac, 0.6)}" stroke-width="8" stroke-linecap="round" opacity=".38"/>
      <path d="M70 54 Q100 38 124 50" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>
      ${orguHalkalari(100, 168, a.orgu, r.sac, 0, id, OLCEK)}
      ${son}
      <g><ellipse cx="100" cy="155" rx="17" ry="9" fill="#FF4F8B" stroke="#C2255C" stroke-width="2"/>
        <path d="M88 152 Q92 158 90 162 M100 147 L100 163 M112 152 Q108 158 110 162" fill="none" stroke="#C2255C" stroke-width="2" opacity=".7"/>
        <path d="M90 151 Q96 148 102 149" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g>`, 'kiz kiz-arka');
  }

  /** Büyük el (tırnak boyama). viewBox 0 0 300 320. ojeler: 5 renk (boyanmamış = null). */
  function el(g, ojeler = []) {
    const r = renkler(g);
    const id = yeniKimlik();
    const cizgi = koyu(r.ten, 0.78);
    const parmak = [
      { x: 70, y: 150, u: 70, a: -32 }, { x: 115, y: 70, u: 105, a: -8 },
      { x: 160, y: 56, u: 115, a: 0 }, { x: 204, y: 70, u: 105, a: 8 }, { x: 242, y: 108, u: 80, a: 18 },
    ];
    const parmaklar = parmak.map((p, i) => {
      const renk = ojeler[i] || '#FFF6EF';
      const boy = p.u + 40;
      return `<g class="parmak" data-tirnak="${i}" transform="rotate(${p.a} ${p.x} ${p.y + p.u})">
        <rect x="${p.x - 23}" y="${p.y}" width="46" height="${boy}" rx="23" fill="url(#${id}-t)" stroke="${cizgi}" stroke-width="3"/>
        <path d="M${p.x - 12} ${p.y + boy * 0.5} Q${p.x} ${p.y + boy * 0.5 + 5} ${p.x + 12} ${p.y + boy * 0.5}
          M${p.x - 10} ${p.y + boy * 0.5 + 9} Q${p.x} ${p.y + boy * 0.5 + 13} ${p.x + 10} ${p.y + boy * 0.5 + 9}" fill="none" stroke="${cizgi}" stroke-width="2" opacity=".45"/>
        <rect class="tirnak${ojeler[i] ? ' boyali' : ''}" x="${p.x - 16}" y="${p.y + 6}" width="32" height="40" rx="15" fill="${renk}" stroke="${koyu(r.ten, 0.7)}" stroke-width="2.5"/>
        ${ojeler[i]
    ? `<path d="M${p.x - 7} ${p.y + 14} L${p.x - 7} ${p.y + 32}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/><circle cx="${p.x + 6}" cy="${p.y + 14}" r="2.5" fill="#fff" opacity=".8"/>`
    : `<path d="M${p.x - 10} ${p.y + 40} Q${p.x} ${p.y + 34} ${p.x + 10} ${p.y + 40}" fill="none" stroke="#fff" stroke-width="3" opacity=".9"/>`}
      </g>`;
    }).join('');
    return svg('0 0 300 320', `<defs>
        <linearGradient id="${id}-t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${koyu(r.ten, 0.9)}"/><stop offset=".35" stop-color="${acik(r.ten, 0.18)}"/><stop offset="1" stop-color="${koyu(r.ten, 0.92)}"/></linearGradient>
        <radialGradient id="${id}-a" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="${acik(r.ten, 0.18)}"/><stop offset="1" stop-color="${koyu(r.ten, 0.9)}"/></radialGradient></defs>
      ${parmaklar}
      <path d="M50 190 Q60 150 100 160 L240 160 Q262 200 250 250 Q230 310 150 312 Q70 310 56 250Z" fill="url(#${id}-a)" stroke="${cizgi}" stroke-width="3"/>
      <path d="M96 220 Q140 250 196 228 M110 260 Q150 276 190 262" fill="none" stroke="${cizgi}" stroke-width="2.5" stroke-linecap="round" opacity=".35"/>
      <rect x="92" y="288" width="118" height="42" rx="12" fill="${r.elbise}" stroke="${koyu(r.elbise, 0.8)}" stroke-width="3"/>
      <path d="M92 300 L210 300" stroke="#fff" stroke-width="4" opacity=".6"/>`, 'kiz-el');
  }


  return Object.freeze({ SECENEK, VARSAYILAN, renkler, on, arka, el });
})();
