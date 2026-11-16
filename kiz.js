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

  /* Örgü halkaları: (x,y)'den aşağı, sağa sola dönüşümlü baklava dilimleri. */
  function orguHalkalari(x, y, adet, renk, aci = 0) {
    let s = '';
    for (let i = 0; i < adet; i += 1) {
      const yy = y + i * 20;
      const xx = x + Math.sin(aci) * i * 20;
      const yon = i % 2 ? 1 : -1;
      s += `<ellipse cx="${xx + yon * 4}" cy="${yy}" rx="15" ry="12" fill="${renk}" stroke="${koyu(renk, 0.7)}" stroke-width="2.5" transform="rotate(${yon * 22} ${xx} ${yy})"/>`;
    }
    return s;
  }

  const fiyonk = (x, y, renk) => `<g class="fiyonk">
    <path d="M${x} ${y} L${x - 22} ${y - 12} L${x - 20} ${y + 12}Z" fill="${renk}" stroke="${koyu(renk, 0.7)}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M${x} ${y} L${x + 22} ${y - 12} L${x + 20} ${y + 12}Z" fill="${renk}" stroke="${koyu(renk, 0.7)}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="${x}" cy="${y}" r="6" fill="${koyu(renk, 0.85)}"/></g>`;

  /** Önden kız. viewBox 0 0 200 320. */
  function on(g, ek = {}) {
    const r = renkler(g);
    const oje = ek.oje || r.ten;
    const sacArka = ek.orgu
      ? `<path d="M48 92 Q46 40 100 36 Q154 40 152 92 Q150 130 140 140 L60 140 Q50 130 48 92Z" fill="${r.sac}"/>`
      : `<path d="M44 96 Q40 34 100 32 Q160 34 156 96 L162 214 Q150 226 132 214 L128 150 L72 150 L68 214 Q50 226 38 214Z" fill="${r.sac}"/>`;
    const orgu = ek.orgu ? `<g class="kiz-orgu">${orguHalkalari(146, 138, 5, r.sac, 0.12)}${fiyonk(158, 236, '#FF4F8B')}</g>` : '';
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

  /** Arkadan kız (kuaför koltuğunda). viewBox 0 0 200 340. */
  function arka(g, a = { orgu: 0, toplam: 6 }) {
    const r = renkler(g);
    const ust = 142 + a.orgu * 20;
    const kalan = Math.max(36, 300 - ust);
    /* tutam ensede toplanır (üst uç ortaya yakın), aşağıda yelpaze gibi açılır */
    const tutam = (x, i) => {
      const t = 100 + (x - 100) * 0.3;
      const alt = ust + kalan;
      return `<path class="tutam" data-tutam="${i}" d="M${t - 10} ${ust} C${t - 12} ${ust + kalan * 0.4} ${x - 16} ${alt - kalan * 0.35} ${x - 8} ${alt} Q${x} ${alt + 8} ${x + 8} ${alt} C${x + 16} ${alt - kalan * 0.35} ${t + 12} ${ust + kalan * 0.4} ${t + 10} ${ust}Z"
      fill="${r.sac}" stroke="${koyu(r.sac, 0.7)}" stroke-width="2.5"/>`;
    };
    const tutamlar = a.orgu >= a.toplam ? fiyonk(100, ust + 6, '#FF4F8B') : [30, 100, 170].map((x, i) => tutam(x, i)).join('');
    return svg('0 0 200 340', `
      <path d="M66 156 Q46 196 52 230" fill="none" stroke="${r.ten}" stroke-width="15" stroke-linecap="round"/>
      <path d="M134 156 Q154 196 148 230" fill="none" stroke="${r.ten}" stroke-width="15" stroke-linecap="round"/>
      <rect x="90" y="128" width="20" height="26" fill="${koyu(r.ten, 0.9)}"/>
      <path d="M74 150 Q100 144 126 150 L150 252 Q100 266 50 252Z" fill="${r.elbise}" stroke="${koyu(r.elbise, 0.8)}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="44" cy="92" r="11" fill="${r.ten}"/><circle cx="156" cy="92" r="11" fill="${r.ten}"/>
      <circle cx="100" cy="84" r="56" fill="${r.sac}" stroke="${koyu(r.sac, 0.75)}" stroke-width="3"/>
      <path d="M62 60 Q80 100 92 140 M138 60 Q120 100 108 140 M100 30 L100 140" fill="none" stroke="${koyu(r.sac, 0.7)}" stroke-width="2.5" opacity=".55"/>
      ${orguHalkalari(100, 146, a.orgu, r.sac)}
      ${tutamlar}`, 'kiz kiz-arka');
  }

  /** Büyük el (tırnak boyama). viewBox 0 0 300 320. ojeler: 5 renk (boyanmamış = null). */
  function el(g, ojeler = []) {
    const r = renkler(g);
    const parmak = [
      { x: 70, y: 150, u: 70, a: -32 }, { x: 115, y: 70, u: 105, a: -8 },
      { x: 160, y: 56, u: 115, a: 0 }, { x: 204, y: 70, u: 105, a: 8 }, { x: 242, y: 108, u: 80, a: 18 },
    ];
    const parmaklar = parmak.map((p, i) => {
      const renk = ojeler[i] || '#FFF6EF';
      return `<g class="parmak" data-tirnak="${i}" transform="rotate(${p.a} ${p.x} ${p.y + p.u})">
        <rect x="${p.x - 23}" y="${p.y}" width="46" height="${p.u + 40}" rx="23" fill="${r.ten}" stroke="${koyu(r.ten, 0.8)}" stroke-width="3"/>
        <rect class="tirnak${ojeler[i] ? ' boyali' : ''}" x="${p.x - 16}" y="${p.y + 6}" width="32" height="40" rx="15" fill="${renk}" stroke="${koyu(r.ten, 0.7)}" stroke-width="2.5"/>
        ${ojeler[i] ? `<path d="M${p.x - 7} ${p.y + 14} L${p.x - 7} ${p.y + 32}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>` : ''}
      </g>`;
    }).join('');
    return svg('0 0 300 320', `${parmaklar}
      <path d="M50 190 Q60 150 100 160 L240 160 Q262 200 250 250 Q230 310 150 312 Q70 310 56 250Z" fill="${r.ten}" stroke="${koyu(r.ten, 0.8)}" stroke-width="3"/>
      <rect x="96" y="290" width="110" height="40" rx="10" fill="${r.elbise}"/>`, 'kiz-el');
  }

  return Object.freeze({ SECENEK, VARSAYILAN, renkler, on, arka, el });
})();
