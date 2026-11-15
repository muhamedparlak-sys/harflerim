/*
 * Harf biçimli çizimler (Montessori resimli harf tekniği): harf önce yazılış sırasıyla çizilir,
 * sonra kendi çizgilerini koruyarak bir nesneye dönüşür; çocuk resimde harfi görmeye devam eder.
 * Her harf bir tanımdır (aşağıda TANIM). Alanlar:
 *   cizgiler  harfin çizgileri, yazılış sırasıyla (viewBox 0 0 200 240, harf merkezi 100,120)
 *   donus     çizildikten sonra harfin dönme açısı (B yan döner → baykuş gözleri)
 *   bicim     { çizgiNo: yeniYol } harf çizgisinin biçim değiştirmesi (aynı komut sayısı)
 *   arka / on harfin arkasına / önüne gelen süsler (dönmüş hâle göre konumlu)
 *   renk(ler), kalinlik(lar)  dönüşümden sonra çizgilerin rengi / kalınlığı
 *   bosta     dönüşümden sonra sürekli hareket (svg kökü sınıfı)
 *   geri      sonunda yeniden harfe döner     cikis  'yukari' | 'sag' uçup gider
 */
window.CIZIMLER = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const MERKEZ = '100 120';
  const KALIN = 18;
  const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
  const nokta = (x, y) => `M${x} ${y} L${x} ${y + 0.1}`;

  function svgYap(icerik) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 200 240');
    s.setAttribute('class', 'cizim');
    s.innerHTML = icerik;
    return s;
  }

  function ciz(yol, ms) {
    const uzunluk = yol.getTotalLength() || 1;
    yol.style.strokeDasharray = `${uzunluk}`;
    return yol.animate([{ strokeDashoffset: uzunluk }, { strokeDashoffset: 0 }], { duration: ms, easing: 'ease-in-out', fill: 'forwards' }).finished;
  }

  function smil(ad, el, oznitelik) {
    const a = document.createElementNS(NS, ad);
    a.setAttribute('begin', 'indefinite');
    a.setAttribute('fill', 'freeze');
    for (const [k, v] of Object.entries(oznitelik)) a.setAttribute(k, v);
    el.append(a);
    a.beginElement();
  }

  function bicimle(yol, hedef, ms) {
    smil('animate', yol, { attributeName: 'd', to: hedef, dur: `${ms}ms` });
    return bekle(ms);
  }

  function dondur(g, kaynak, hedef, ms) {
    smil('animateTransform', g, { attributeName: 'transform', type: 'rotate', from: `${kaynak} ${MERKEZ}`, to: `${hedef} ${MERKEZ}`, dur: `${ms}ms` });
    return bekle(ms);
  }

  const buyu = (el, ms, gecikme = 0) => el.animate(
    [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }],
    { duration: ms, delay: gecikme, easing: 'ease-out', fill: 'both' },
  ).finished;

  const isinlar = (cx, cy, r1, r2, n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)} L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}`;
  }).join(' ');

  const yapraklar = (cx, cy, r, n) => Array.from({ length: n }, (_, i) =>
    `<ellipse cx="${cx}" cy="${cy - r}" rx="13" ry="26" fill="#fff" stroke="#E2DCCB" stroke-width="2" transform="rotate(${(360 / n) * i} ${cx} ${cy})"/>`).join('');

  const damlalar = (xler, y) => `<g><g class="damlalar">${xler.map((x, i) =>
    `<path class="dm" style="animation-delay:${(i * 0.23).toFixed(2)}s" d="M${x} ${y} q6 10 0 14 q-6 -4 0 -14z" fill="#4EA8DE"/>`).join('')}</g></g>`;

  /* ---------- ortak harf yolları ---------- */
  const C_YOL = 'M150 62 Q128 32 92 34 Q38 40 38 120 Q38 200 92 206 Q128 208 150 178';
  const G_YOL = 'M156 66 Q132 32 98 32 Q38 32 38 120 Q38 208 98 208 Q156 208 158 136 L112 136';
  const O_YOL = 'M100 30 Q160 30 160 120 Q160 210 100 210 Q40 210 40 120 Q40 30 100 30';
  const S_YOL = 'M150 56 Q132 30 100 30 Q55 30 55 72 Q55 112 100 120 Q148 128 148 170 Q148 210 100 210 Q64 210 48 186';
  const U_YOL = 'M45 40 L45 140 Q45 210 100 210 Q155 210 155 140 L155 40';
  const CENGEL = 'M98 216 Q116 222 110 234 Q104 244 90 240';

  const TANIM = {
    B: {
      cizgiler: ['M60 30 L60 210', 'M60 30 L105 30 Q150 30 150 75 Q150 120 105 120 L60 120', 'M60 120 L112 120 Q160 120 160 165 Q160 210 112 210 L60 210'],
      donus: -90, renk: '#5C3A21', geri: true,
      arka: `<path d="M0 172 Q-6 36 100 32 Q206 36 200 172 Q160 214 100 214 Q40 214 0 172Z" fill="#B07A4F"/>
        <path d="M10 76 L-4 18 L48 52Z" fill="#8C5A3A"/><path d="M190 76 L204 18 L152 52Z" fill="#8C5A3A"/>
        <circle cx="55" cy="118" r="34" fill="#FFF3C4"/><circle cx="145" cy="112" r="34" fill="#FFF3C4"/>`,
      on: `<g><g class="yanip"><circle cx="55" cy="122" r="14" fill="#2B1D16"/><circle cx="60" cy="116" r="4" fill="#fff"/></g></g>
        <g><g class="yanip"><circle cx="145" cy="116" r="14" fill="#2B1D16"/><circle cx="150" cy="110" r="4" fill="#fff"/></g></g>
        <path d="M88 150 L112 150 L100 176Z" fill="#FFB703"/>`,
    },
    C: {
      cizgiler: [C_YOL], renk: '#6B4F3A', kalinlik: 16,
      arka: `<path d="M118 214 Q104 250 96 280 L156 280 Q156 248 172 228Z" fill="#D9A066"/>
        <ellipse cx="160" cy="206" rx="48" ry="28" fill="#D9A066"/>
        <ellipse cx="202" cy="216" rx="20" ry="15" fill="#E8BE8A"/>
        <ellipse cx="122" cy="186" rx="22" ry="10" fill="#C2884F"/>`,
      on: `<circle cx="168" cy="198" r="6" fill="#3B2C2A"/><circle cx="170" cy="196" r="2" fill="#fff"/><circle cx="214" cy="212" r="4" fill="#6B4F3A"/>
        <path d="M136 228 Q150 236 166 230" fill="none" stroke="#F3DDBB" stroke-width="6" stroke-linecap="round"/>
        <path d="M150 70 L162 64 M144 98 L157 94 M138 128 L151 128 M140 156 L153 160" stroke="#8C6B4F" stroke-width="5" stroke-linecap="round"/>`,
    },
    'Ç': {
      cizgiler: [C_YOL, CENGEL], donus: -90, renkler: ['#D62839', '#2D9A4E'], kalinliklar: [16, 16],
      arka: `<path d="M100 182 L100 262" stroke="#2D9A4E" stroke-width="10" stroke-linecap="round"/>
        <path d="M100 246 Q190 222 210 118 Q150 168 100 228Z" fill="#3DBB6C"/>
        <path d="M42 70 L56 26 L78 64 L100 18 L122 64 L144 26 L158 70 Q186 124 160 160 Q100 196 40 160 Q14 124 42 70Z" fill="#FF4D6D"/>`,
      on: `<path d="M78 64 Q86 120 100 176 M122 64 Q114 120 100 176" fill="none" stroke="#D62839" stroke-width="4" opacity=".6"/>`,
    },
    D: {
      cizgiler: ['M60 30 L60 210', 'M60 30 L95 30 Q160 30 160 120 Q160 210 95 210 L60 210'],
      donus: -90, renk: '#B5121B', kalinlik: 14,
      arka: `<path d="M10 160 L10 125 Q10 60 100 60 Q190 60 190 125 L190 160Z" fill="#E63946"/>
        <path d="M26 152 L26 128 Q26 78 100 76 Q174 78 174 128 L174 152Z" fill="#FF6B6B"/>`,
      on: `<path d="M38 150 Q50 96 90 150Z" fill="#FFB4A2"/><path d="M110 150 Q150 96 162 150Z" fill="#FFB4A2"/>
        <path d="M94 152 L100 90 L106 152Z" fill="#FFD6CC"/>
        <g fill="#FFF3C4"><ellipse cx="56" cy="136" rx="4" ry="6"/><ellipse cx="70" cy="128" rx="4" ry="6"/><ellipse cx="76" cy="142" rx="4" ry="6"/>
        <ellipse cx="128" cy="136" rx="4" ry="6"/><ellipse cx="142" cy="128" rx="4" ry="6"/><ellipse cx="146" cy="142" rx="4" ry="6"/></g>`,
    },
    E: {
      cizgiler: ['M150 30 L60 30 L60 210 L150 210', 'M60 120 L135 120'], donus: 90, renk: '#6E7088',
      arka: `<ellipse cx="100" cy="102" rx="98" ry="34" fill="#A7A9BE"/>
        <path d="M180 92 Q214 72 220 42" fill="none" stroke="#A7A9BE" stroke-width="26" stroke-linecap="round"/>
        <ellipse cx="226" cy="42" rx="26" ry="18" fill="#A7A9BE"/><ellipse cx="246" cy="50" rx="12" ry="10" fill="#D8D8E4"/>
        <ellipse cx="214" cy="10" rx="7" ry="22" fill="#8E90A6"/><ellipse cx="230" cy="8" rx="7" ry="22" fill="#8E90A6"/>
        <path d="M6 92 Q-14 108 -6 134" fill="none" stroke="#8E90A6" stroke-width="6" stroke-linecap="round"/>`,
      on: `<circle cx="224" cy="36" r="4" fill="#3B2C2A"/>`,
    },
    F: {
      cizgiler: ['M70 210 L70 30 L150 30', 'M70 115 L130 115'], donus: -90, renk: '#3A0CA3', kalinlik: 12,
      arka: `<rect x="0" y="138" width="200" height="24" rx="12" fill="#4CC9F0"/>
        <path d="M18 70 L18 140 M30 74 L30 140 M42 76 L42 140 M54 78 L54 140 M66 80 L66 140 M78 84 L78 140 M90 88 L90 140" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
      on: `<path d="M14 62 Q30 36 50 54 Q66 34 84 56 Q92 70 74 70 L22 72 Q8 72 14 62Z" fill="#E0FBFC" stroke="#90E0EF" stroke-width="4"/>`,
    },
    G: {
      cizgiler: [G_YOL], renk: '#F28C00',
      arka: `<g><g class="don" style="transform-origin:98px 120px"><path d="${isinlar(98, 120, 100, 130, 12)}" stroke="#FFB703" stroke-width="10" stroke-linecap="round"/></g></g>
        <circle cx="98" cy="120" r="84" fill="#FFD23F"/>`,
      on: `<circle cx="78" cy="104" r="7" fill="#3B2C2A"/><circle cx="120" cy="104" r="7" fill="#3B2C2A"/>
        <path d="M74 142 Q98 166 124 142" fill="none" stroke="#3B2C2A" stroke-width="6" stroke-linecap="round"/>`,
    },
    'Ğ': {
      cizgiler: [G_YOL, 'M70 4 Q100 26 130 4'], renk: '#3A86FF',
      on: `<g><g class="bulut"><circle cx="72" cy="0" r="24" fill="#fff" stroke="#9DB4CC" stroke-width="4"/><circle cx="128" cy="2" r="24" fill="#fff" stroke="#9DB4CC" stroke-width="4"/>
        <circle cx="100" cy="-14" r="30" fill="#fff" stroke="#9DB4CC" stroke-width="4"/><rect x="60" y="0" width="80" height="22" fill="#fff"/></g></g>
        ${damlalar([62, 88, 112, 138, 76, 124], 34)}`,
    },
    H: {
      cizgiler: ['M50 30 L50 210', 'M150 30 L150 210', 'M50 120 L150 120'],
      bicim: { 2: 'M50 120 Q100 186 150 120' }, renkler: ['#8B5A2B', '#8B5A2B', '#E63946'],
      arka: `<circle cx="50" cy="20" r="36" fill="#3DBB6C"/><circle cx="150" cy="20" r="36" fill="#3DBB6C"/>
        <path d="M20 214 L180 214" stroke="#95D5B2" stroke-width="10" stroke-linecap="round"/>`,
      on: `<path d="M50 120 Q100 196 150 120 Q100 172 50 120Z" fill="#FF6F61"/>
        <g><g class="zzz"><text x="118" y="120" font-size="26" font-weight="900" fill="#1D63D8">z</text><text x="136" y="96" font-size="20" font-weight="900" fill="#1D63D8">z</text></g></g>`,
    },
    I: {
      cizgiler: ['M100 52 L100 210'], renk: '#E9C46A', kalinlik: 8,
      arka: `<circle cx="100" cy="30" r="48" fill="#FFE8A3" opacity=".6"/>
        <rect x="80" y="60" width="40" height="152" rx="8" fill="#FFF1D0" stroke="#E9C46A" stroke-width="4"/>`,
      on: `<g><g class="alev"><path d="M100 0 Q124 28 100 50 Q76 28 100 0Z" fill="#FFB703"/><path d="M100 20 Q111 33 100 46 Q89 33 100 20Z" fill="#FF6F61"/></g></g>`,
    },
    'İ': {
      cizgiler: ['M100 80 L100 206', nokta(100, 36)], renkler: ['#8D99AE', '#E63946'], kalinliklar: [12, 30],
      on: `<path d="M94 202 L100 240 L106 202Z" fill="#8D99AE"/><ellipse cx="100" cy="98" rx="3" ry="10" fill="#FFF4EA"/>
        <path d="M100 36 Q58 60 96 96 Q144 112 122 150 Q104 180 132 204" fill="none" stroke="#E63946" stroke-width="5" stroke-linecap="round"/>`,
    },
    J: {
      cizgiler: ['M130 30 L130 160 Q130 210 85 210 Q50 210 45 175'], donus: 90, renk: '#457B9D', kalinlik: 12, cikis: 'sag',
      arka: `<path d="M8 150 L10 66 L46 62 L84 118 L190 118 Q236 134 190 152Z" fill="#E9ECEF" stroke="#8D99AE" stroke-width="4"/>
        <path d="M96 146 L66 196 L108 196 L142 146Z" fill="#ADB5BD"/>`,
      on: `<g fill="#4CC9F0"><circle cx="110" cy="132" r="6"/><circle cx="132" cy="132" r="6"/><circle cx="154" cy="132" r="6"/><circle cx="176" cy="132" r="6"/></g>
        <g><g class="alev"><path d="M8 124 Q-34 136 8 148Z" fill="#FFB703"/></g></g>`,
    },
    K: {
      cizgiler: ['M100 30 L100 210', 'M190 30 L102 125 L190 210'], renk: '#3B2C2A', kalinlik: 12, bosta: 'zipla',
      arka: `<path d="M102 120 L190 30 Q222 82 180 116 Q150 126 102 122Z" fill="#FF9F1C"/>
        <path d="M102 128 L190 210 Q210 168 172 140 Q140 128 102 128Z" fill="#FFBF69"/>
        <path d="M98 120 L10 30 Q-22 82 20 116 Q50 126 98 122Z" fill="#FF9F1C" stroke="#3B2C2A" stroke-width="10" stroke-linejoin="round"/>
        <path d="M98 128 L10 210 Q-10 168 28 140 Q60 128 98 128Z" fill="#FFBF69" stroke="#3B2C2A" stroke-width="10" stroke-linejoin="round"/>`,
      on: `<circle cx="150" cy="80" r="12" fill="#fff"/><circle cx="50" cy="80" r="12" fill="#fff"/>
        <circle cx="150" cy="168" r="9" fill="#FF6F61"/><circle cx="50" cy="168" r="9" fill="#FF6F61"/>
        <path d="M100 32 Q90 6 74 0 M100 32 Q110 6 126 0" fill="none" stroke="#3B2C2A" stroke-width="5" stroke-linecap="round"/>
        <circle cx="74" cy="0" r="6" fill="#3B2C2A"/><circle cx="126" cy="0" r="6" fill="#3B2C2A"/>`,
    },
    L: {
      cizgiler: ['M95 46 L95 210 L165 210'], renk: '#FF6F61', kalinlik: 10,
      arka: `<path d="M156 22 Q180 -6 160 -32" fill="none" stroke="#3B2C2A" stroke-width="20" stroke-linecap="round"/>
        <path d="M156 22 Q180 -6 160 -32" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
        <ellipse cx="110" cy="30" rx="60" ry="30" fill="#fff" stroke="#3B2C2A" stroke-width="4"/>
        <path d="M54 24 Q90 54 140 42 Q108 64 54 42Z" fill="#3B2C2A"/>`,
      on: `<circle cx="158" cy="-36" r="15" fill="#fff" stroke="#3B2C2A" stroke-width="4"/><circle cx="162" cy="-40" r="3.5" fill="#3B2C2A"/>
        <path d="M170 -40 L216 -30 L170 -28Z" fill="#FF6F61"/>
        <path d="M108 58 L132 108 L110 122" fill="none" stroke="#FF6F61" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
    N: {
      cizgiler: ['M50 210 L50 30 L150 210 L150 30'],
      bicim: { 0: 'M50 196 L50 40 L150 22 L150 178' }, renk: '#2B2D42', kalinlik: 12, bosta: 'dans',
      on: `<path d="M50 72 L150 54" stroke="#2B2D42" stroke-width="12" stroke-linecap="round"/>
        <ellipse cx="32" cy="198" rx="24" ry="17" fill="#2B2D42" transform="rotate(-20 32 198)"/>
        <ellipse cx="132" cy="180" rx="24" ry="17" fill="#2B2D42" transform="rotate(-20 132 180)"/>
        <g><g class="buhar"><path d="M176 70 L176 30 L192 36" fill="none" stroke="#9B5DE5" stroke-width="5" stroke-linecap="round"/><circle cx="170" cy="72" r="8" fill="#9B5DE5"/></g></g>`,
    },
    O: {
      cizgiler: [O_YOL], renk: '#F1E3C8', kalinlik: 12,
      arka: `<path d="M100 16 Q180 18 174 112 Q186 214 98 222 Q14 216 24 120 Q20 26 100 16Z" fill="#fff" stroke="#EADFC9" stroke-width="4"/>`,
      on: `<circle cx="102" cy="122" r="42" fill="#FFB703"/><circle cx="88" cy="106" r="10" fill="#FFE29A"/>
        <circle cx="90" cy="124" r="4" fill="#3B2C2A"/><circle cx="114" cy="124" r="4" fill="#3B2C2A"/>
        <path d="M92 138 Q102 146 112 138" fill="none" stroke="#3B2C2A" stroke-width="3" stroke-linecap="round"/>`,
    },
    'Ö': {
      cizgiler: [O_YOL, nokta(72, 6), nokta(128, 6)],
      bicim: { 1: nokta(80, 92), 2: nokta(120, 92) },
      renkler: ['#2B2D42', '#fff', '#fff'], kalinliklar: [18, 32, 32], cikis: 'kac',
      arka: `<path class="bacak" d="M44 86 Q10 56 -12 78 M41 112 Q4 102 -16 124 M43 140 Q6 150 -12 176 M50 166 Q20 192 0 218
          M156 86 Q190 56 212 78 M159 112 Q196 102 216 124 M157 140 Q194 150 212 176 M150 166 Q180 192 200 218"
          fill="none" stroke="#2B2D42" stroke-width="8" stroke-linecap="round"/>
        <ellipse cx="100" cy="120" rx="60" ry="90" fill="#2B2D42"/>`,
      on: `<circle cx="82" cy="94" r="6" fill="#2B2D42"/><circle cx="122" cy="94" r="6" fill="#2B2D42"/>
        <path d="M84 132 Q100 146 116 132" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    },
    P: {
      cizgiler: ['M70 210 L70 30', 'M70 30 L110 30 Q160 30 160 77 Q160 125 110 125 L70 125'],
      renkler: ['#2D9A4E', '#F4A261'], kalinliklar: [12, 10],
      arka: `<g>${yapraklar(113, 77, 62, 12)}</g><circle cx="113" cy="77" r="46" fill="#FFD23F"/>
        <path d="M70 176 Q32 158 20 124 Q56 132 70 164Z" fill="#3DBB6C"/>`,
      on: `<circle cx="100" cy="72" r="5" fill="#3B2C2A"/><circle cx="126" cy="72" r="5" fill="#3B2C2A"/>
        <path d="M100 92 Q113 102 126 92" fill="none" stroke="#3B2C2A" stroke-width="4" stroke-linecap="round"/>`,
    },
    R: {
      cizgiler: ['M60 210 L60 30', 'M60 30 L105 30 Q155 30 155 75 Q155 120 105 120 L60 120 L155 210'], renk: '#E63946', cikis: 'yukari',
      arka: `<path d="M28 214 L28 80 Q28 -6 100 -32 Q172 -6 172 80 L172 214Z" fill="#EDF2F7" stroke="#9DB4CC" stroke-width="5"/>
        <path d="M28 150 L-10 214 L28 214Z" fill="#E63946"/><path d="M172 150 L210 214 L172 214Z" fill="#E63946"/>
        <circle cx="104" cy="75" r="30" fill="#8ECAE6" stroke="#457B9D" stroke-width="6"/>`,
      on: `<g><g class="alev"><path d="M60 218 Q100 292 140 218Z" fill="#FFB703"/><path d="M80 218 Q100 258 120 218Z" fill="#FF6F61"/></g></g>`,
    },
    S: {
      cizgiler: [S_YOL], renk: '#F4A3B5', kalinlik: 34, bosta: 'kipir',
      on: `<circle cx="142" cy="48" r="5" fill="#3B2C2A"/><circle cx="158" cy="58" r="5" fill="#3B2C2A"/>
        <path d="M70 70 L52 76 M78 96 L62 108 M128 150 L146 146 M130 182 L148 186" stroke="#E5899E" stroke-width="5" stroke-linecap="round"/>`,
    },
    'Ş': {
      cizgiler: [S_YOL, CENGEL],
      bicim: { 0: 'M20 100 Q20 30 100 30 Q180 30 180 100 Q160 86 140 100 Q120 86 100 100 Q100 150 100 180 Q100 198 100 214' },
      renkler: ['#7B2CBF', '#7B2CBF'], kalinliklar: [12, 12],
      arka: `<path d="M20 100 Q20 30 100 30 Q180 30 180 100 Q160 86 140 100 Q120 86 100 100 Q80 86 60 100 Q40 86 20 100Z" fill="#C77DFF"/>`,
      on: `<path d="M100 30 Q70 60 60 100 M100 30 Q130 60 140 100" fill="none" stroke="#7B2CBF" stroke-width="5"/>
        ${damlalar([30, 60, 140, 170, 100], -40)}`,
    },
    T: {
      cizgiler: ['M30 40 L170 40', 'M100 40 L100 210'], renkler: ['#E63946', '#8B5A2B'],
      salla: { cizgi: 0, sinif: 't-tahta', merkez: '100 40', aci: 12 },
      arka: `<path d="M40 214 L160 214" stroke="#95D5B2" stroke-width="10" stroke-linecap="round"/>`,
      on: `<g><g class="t-tahta"><circle cx="40" cy="12" r="18" fill="#FFD84D"/><circle cx="160" cy="12" r="18" fill="#9B5DE5"/>
        <circle cx="34" cy="8" r="3" fill="#3B2C2A"/><circle cx="46" cy="8" r="3" fill="#3B2C2A"/>
        <circle cx="154" cy="8" r="3" fill="#3B2C2A"/><circle cx="166" cy="8" r="3" fill="#3B2C2A"/></g></g>`,
    },
    U: {
      cizgiler: [U_YOL], donus: 180, renk: '#1B1B1B', kalinlik: 10,
      arka: `<path d="M45 200 L45 100 Q45 30 100 30 Q155 30 155 100 L155 200Z" fill="#E63946"/>
        <path d="M60 200 Q100 250 140 200Z" fill="#1B1B1B"/>
        <path d="M45 120 L18 108 M45 160 L16 166 M155 120 L182 108 M155 160 L184 166" stroke="#1B1B1B" stroke-width="7" stroke-linecap="round"/>`,
      on: `<path d="M100 32 L100 200" stroke="#1B1B1B" stroke-width="5"/>
        <g fill="#1B1B1B"><circle cx="72" cy="82" r="12"/><circle cx="128" cy="82" r="12"/><circle cx="70" cy="150" r="12"/><circle cx="130" cy="150" r="12"/></g>
        <circle cx="88" cy="214" r="5" fill="#fff"/><circle cx="112" cy="214" r="5" fill="#fff"/>`,
    },
    'Ü': {
      cizgiler: [U_YOL, nokta(72, 6), nokta(128, 6)], donus: 180,
      renkler: ['#3A0CA3', '#DEE2E6', '#DEE2E6'], kalinliklar: [14, 30, 30],
      arka: `<path d="M45 200 L45 100 Q45 30 100 30 Q155 30 155 100 L155 200Z" fill="#4CC9F0"/>
        <path d="M30 196 L180 196 L218 204 L180 214 L30 214Z" fill="#ADB5BD"/>
        <path d="M70 40 Q100 -14 130 40" fill="none" stroke="#3A0CA3" stroke-width="14" stroke-linecap="round"/>`,
      on: `<circle cx="100" cy="120" r="16" fill="#fff" stroke="#3A0CA3" stroke-width="4"/>
        <g><g class="buhar"><path d="M60 246 Q50 262 60 276 M140 246 Q150 262 140 276" fill="none" stroke="#CED4DA" stroke-width="6" stroke-linecap="round"/></g></g>`,
    },
    V: {
      cizgiler: ['M40 40 L100 210 L160 40'], bicim: { 0: 'M10 130 L100 186 L190 130' }, renk: '#1D3557', kalinlik: 14, cikis: 'sag',
      arka: `<path d="M10 130 L190 130 L100 186Z" fill="#E63946"/><rect x="40" y="96" width="110" height="36" rx="6" fill="#fff" stroke="#1D3557" stroke-width="4"/>
        <rect x="112" y="46" width="24" height="52" fill="#E63946"/><rect x="112" y="46" width="24" height="12" fill="#1D3557"/>
        <path d="M0 200 Q25 186 50 200 Q75 214 100 200 Q125 186 150 200 Q175 214 200 200" fill="none" stroke="#4EA8DE" stroke-width="8" stroke-linecap="round"/>`,
      on: `<g fill="#4CC9F0"><circle cx="62" cy="114" r="7"/><circle cx="86" cy="114" r="7"/></g>
        <g><g class="buhar"><circle cx="126" cy="30" r="12" fill="#CED4DA"/><circle cx="138" cy="8" r="16" fill="#E9ECEF"/></g></g>`,
    },
    Y: {
      cizgiler: ['M40 40 L100 120 L160 40', 'M100 120 L100 210'], donus: 180, renk: '#E09F00', kalinlik: 12, bosta: 'parilti',
      arka: `<path d="M100 26 L124 92 L194 94 L138 136 L162 204 L100 162 L38 204 L62 136 L6 94 L76 92Z" fill="#FFD23F" stroke="#E09F00" stroke-width="6" stroke-linejoin="round"/>`,
      on: `<circle cx="86" cy="120" r="5" fill="#3B2C2A"/><circle cx="114" cy="120" r="5" fill="#3B2C2A"/>
        <path d="M88 136 Q100 146 112 136" fill="none" stroke="#3B2C2A" stroke-width="4" stroke-linecap="round"/>`,
    },
    Z: {
      cizgiler: ['M50 30 L150 30 L50 165 L150 165'], renk: '#E9A23B', kalinlik: 24,
      arka: `<ellipse cx="108" cy="178" rx="62" ry="26" fill="#F4C04E"/>
        <path d="M66 196 L62 236 M90 198 L90 238 M128 198 L128 238 M152 194 L156 234" stroke="#E9A23B" stroke-width="10" stroke-linecap="round"/>
        <path d="M168 172 Q186 180 182 200" fill="none" stroke="#E9A23B" stroke-width="5"/>
        <ellipse cx="96" cy="28" rx="58" ry="20" fill="#F4C04E"/>`,
      on: `<path d="M126 14 L130 -10 M142 16 L148 -8" stroke="#B5651D" stroke-width="7" stroke-linecap="round"/>
        <circle cx="130" cy="-12" r="6" fill="#B5651D"/><circle cx="148" cy="-10" r="6" fill="#B5651D"/>
        <ellipse cx="160" cy="26" rx="12" ry="6" fill="#E9A23B"/><circle cx="116" cy="22" r="5" fill="#3B2C2A"/><circle cx="52" cy="26" r="3" fill="#8B5A2B"/>
        <g fill="#B5651D"><circle cx="124" cy="66" r="7"/><circle cx="100" cy="98" r="6"/><circle cx="76" cy="130" r="6"/>
        <circle cx="96" cy="180" r="8"/><circle cx="130" cy="184" r="7"/><circle cx="70" cy="176" r="6"/></g>`,
    },
  };

  /* ---------- genel motor ---------- */
  function genelOlustur(t, h) {
    const renk = window.SESLI.has(h) ? '#E0363A' : '#1D63D8';
    const yollar = t.cizgiler.map((d) =>
      `<path class="hy" d="${d}" fill="none" stroke="${renk}" stroke-width="${KALIN}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    const s = svgYap(`<g class="arka">${t.arka || ''}</g><g class="harf">${yollar}</g><g class="on">${t.on || ''}</g>`);
    s.dataset.renk = renk;
    return s;
  }

  function renkle(t, yollar, renk, geriDon) {
    yollar.forEach((y, i) => {
      const hedefRenk = (t.renkler && t.renkler[i]) || t.renk || renk;
      const hedefKalin = (t.kalinliklar && t.kalinliklar[i]) || t.kalinlik || KALIN;
      const kare = [{ stroke: renk, strokeWidth: `${KALIN}px` }, { stroke: hedefRenk, strokeWidth: `${hedefKalin}px` }];
      y.animate(geriDon ? kare.reverse() : kare, { duration: 600, fill: 'forwards' });
    });
  }

  async function genelOynat(t, s, { sihir = () => {}, kelime = () => {} } = {}) {
    const renk = s.dataset.renk;
    const harf = s.querySelector('.harf');
    const yollar = [...harf.querySelectorAll('.hy')];
    const susler = [...s.querySelector('.arka').children, ...s.querySelector('.on').children];
    susler.forEach((e) => { e.style.opacity = '0'; });
    for (const y of yollar) await ciz(y, Math.max(260, Math.min(800, y.getTotalLength() * 2.6)));
    yollar.forEach((y) => { y.getAnimations().forEach((a) => a.cancel()); y.style.strokeDasharray = ''; });
    await bekle(220);
    sihir();
    const isler = [];
    if (t.donus) isler.push(dondur(harf, 0, t.donus, 650));
    for (const [i, d] of Object.entries(t.bicim || {})) isler.push(bicimle(yollar[i], d, 650));
    renkle(t, yollar, renk, false);
    await Promise.all(isler);
    await Promise.all(susler.map((e, i) => { e.style.opacity = ''; return buyu(e, 460, i * 80); }));
    if (t.salla) {
      const deger = `-${t.salla.aci} ${t.salla.merkez};${t.salla.aci} ${t.salla.merkez};-${t.salla.aci} ${t.salla.merkez}`;
      const ayar = { attributeName: 'transform', type: 'rotate', values: deger, dur: '2.4s', repeatCount: 'indefinite' };
      smil('animateTransform', yollar[t.salla.cizgi], ayar);
      smil('animateTransform', s.querySelector(`.${t.salla.sinif}`), ayar);
    }
    s.classList.add('canli', t.bosta || 'zipla');
    kelime();
    if (!t.geri) return;
    await bekle(1500);
    s.classList.remove('canli');
    await Promise.all(susler.map((e) => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).finished));
    renkle(t, yollar, renk, true);
    if (t.donus) await dondur(harf, t.donus, 0, 650);
    await bekle(300);
  }

  const UCUS = {
    yukari: [{ transform: 'none' }, { transform: 'translateY(6vh)', offset: 0.2 }, { transform: 'translateY(-120vh)' }],
    sag: [{ transform: 'none' }, { transform: 'translateX(-4vw)', offset: 0.2 }, { transform: 'translate(110vw, -10vh)' }],
  };
  const ucup = (yon) => async (s) => {
    if (yon === 'kac') {
      await window.Gorsel.kacis(s);
      await s.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.3)' }], { duration: 300, fill: 'forwards' }).finished;
      return;
    }
    await s.animate(UCUS[yon], { duration: 1500, easing: 'ease-in', fill: 'forwards' }).finished;
  };

  /* ---------- özel çizimler: A → ağaç, M → martı ---------- */
  const A = {
    olustur: () => svgYap(`
      <rect class="a-govde" x="89" y="190" width="22" height="42" rx="6" fill="#8B5A2B" opacity="0"/>
      <g class="a-yaprak">
        <path d="M100 22 L40 196 L160 196 Z" fill="#2E9E5B"/>
        <path d="M100 44 L58 158 L142 158 Z" fill="#3DBB6C"/>
        <path d="M100 66 L72 116 L128 116 Z" fill="#62D487"/>
      </g>
      <path class="a-cizgi1" d="M40 196 L100 22 L160 196" fill="none" stroke="#E0363A" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="a-cizgi2" d="M68 132 L132 132" fill="none" stroke="#E0363A" stroke-width="18" stroke-linecap="round"/>
      <g class="a-sus" opacity="0">
        <circle cx="78" cy="170" r="9" fill="#E0363A"/><circle cx="124" cy="176" r="9" fill="#E0363A"/>
        <circle cx="100" cy="98" r="8" fill="#E0363A"/><circle cx="116" cy="150" r="7" fill="#FF8C42"/>
        <circle cx="84" cy="146" r="7" fill="#FF8C42"/>
      </g>`),
    async oynat(s, { sihir = () => {}, kelime = () => {} } = {}) {
      const yaprak = s.querySelector('.a-yaprak');
      yaprak.style.opacity = '0';
      await ciz(s.querySelector('.a-cizgi1'), 650);
      await ciz(s.querySelector('.a-cizgi2'), 300);
      await bekle(250);
      sihir();
      for (const c of s.querySelectorAll('.a-cizgi1, .a-cizgi2')) {
        c.animate([{ stroke: '#E0363A' }, { stroke: c.classList.contains('a-cizgi2') ? '#8B5A2B' : '#1F7A45' }], { duration: 500, fill: 'forwards' });
      }
      yaprak.style.opacity = '';
      const govde = s.querySelector('.a-govde');
      govde.style.opacity = '1';
      govde.animate([{ transform: 'scaleY(0)' }, { transform: 'none' }], { duration: 400, fill: 'both' });
      await Promise.all([...yaprak.children].map((k, i) => k.animate(
        [{ transform: 'scale(0) translateY(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 520, delay: i * 140, easing: 'ease-out', fill: 'both' },
      ).finished));
      await buyu(s.querySelector('.a-sus'), 420);
      s.classList.add('a-salla');
      kelime();
    },
  };

  const M_HARF = 'M30 196 L50 46 L100 140 L150 46 L170 196';
  const KANAT_YUKARI = 'M8 70 L56 52 L100 108 L144 52 L192 70';
  const KANAT_ASAGI = 'M14 140 L58 100 L100 108 L142 100 L186 140';
  const M = {
    olustur: () => svgYap(`
      <path class="m-cizgi" d="${M_HARF}" fill="none" stroke="#1D63D8" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="m-govde" opacity="0">
        <ellipse cx="100" cy="128" rx="20" ry="26" fill="#fff" stroke="#6B7C93" stroke-width="4"/>
        <circle cx="100" cy="100" r="14" fill="#fff" stroke="#6B7C93" stroke-width="4"/>
        <circle cx="94" cy="97" r="2.8" fill="#3B2C2A"/><circle cx="106" cy="97" r="2.8" fill="#3B2C2A"/>
        <path d="M95 104 L105 104 L100 114 Z" fill="#FFB703"/>
        <path d="M92 152 l-6 10 M108 152 l6 10" stroke="#FFB703" stroke-width="4" stroke-linecap="round"/>
      </g>`),
    async oynat(s, { sihir = () => {}, kelime = () => {} } = {}) {
      const kanat = s.querySelector('.m-cizgi');
      await ciz(kanat, 900);
      await bekle(250);
      sihir();
      kanat.animate([{ stroke: '#1D63D8' }, { stroke: '#6B7C93' }], { duration: 500, fill: 'forwards' });
      await bicimle(kanat, KANAT_YUKARI, 550);
      kanat.setAttribute('d', KANAT_YUKARI);
      await buyu(s.querySelector('.m-govde'), 450);
      kelime();
    },
    async cikis(s) {
      smil('animate', s.querySelector('.m-cizgi'), { attributeName: 'd', values: `${KANAT_YUKARI};${KANAT_ASAGI};${KANAT_YUKARI}`, dur: '340ms', repeatCount: 'indefinite' });
      await bekle(700);
      await s.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'translate(12vw, -8vh) scale(.85) rotate(-6deg)', opacity: 1, offset: 0.35 },
        { transform: 'translate(60vw, -70vh) scale(.35) rotate(-12deg)', opacity: 0 },
      ], { duration: 1700, easing: 'ease-in', fill: 'forwards' }).finished;
    },
  };

  const hepsi = { A, M };
  for (const [h, t] of Object.entries(TANIM)) {
    hepsi[h] = Object.freeze({
      olustur: () => genelOlustur(t, h),
      oynat: (s, geri) => genelOynat(t, s, geri),
      cikis: t.cikis ? ucup(t.cikis) : undefined,
    });
  }
  return Object.freeze(hepsi);
})();
