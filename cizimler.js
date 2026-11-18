/*
 * Harf biçimli çizimler (Montessori resimli harf tekniği): harf önce yazılış sırasıyla çizilir,
 * sonra kendi çizgilerini koruyarak bir nesneye dönüşür; çocuk resimde harfi görmeye devam eder.
 * Her harf bir tanımdır (aşağıda TANIM). Alanlar:
 *   cizgiler  harfin çizgileri, yazılış sırasıyla (viewBox 0 0 200 240, harf merkezi 100,120)
 *   yan       dönmeden önce kısa süre görünen süsler (B: yandan baykuş, sonra ekrana döner)
 *   donus     çizildikten sonra harfin dönme açısı (artık kullanılmıyor: harf hep dik kalsın, çocuk harfi görsün)
 *   susDonus  arka/on süslerini harf merkezinde döndürür (B: baykuş kafasını yana yatırır, harf dik kalır)
 *   bicim     { çizgiNo: yeniYol } harf çizgisinin biçim değiştirmesi (aynı komut dizisi)
 *   arka / on harfin arkasına / önüne gelen süsler (dönmüş hâle göre konumlu)
 *   renk(ler), kalinlik(lar)  dönüşümden sonra çizgilerin rengi / kalınlığı
 *   bosta     dönüşümden sonra o karaktere özgü sürekli hareket (stil.css: .cizim.canli.<ad>)
 *   ses       dönüşüm anındaki karakter sesi (ses.js: Efekt.karakter)
 *   geri      sonunda yeniden harfe döner
 *   cikis     'yukari' | 'sag' | 'kac' ekrandan gider;  cikisSesi  giderken / kaçarken çalan ses
 */
window.CIZIMLER = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const MERKEZ = '100 120';
  const KALIN = 18;
  const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
  const nokta = (x, y) => `M${x} ${y} L${x} ${y + 0.1}`;
  const yaz = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const efekt = (ad) => { if (ad && window.Efekt && window.Efekt.karakter) window.Efekt.karakter(ad); };

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
  const sonuk = (el, ms) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards' }).finished;

  const isinlar = (cx, cy, r1, r2, n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)} L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}`;
  }).join(' ');

  const damlalar = (xler, y) => `<g><g class="damlalar">${xler.map((x, i) =>
    `<path class="dm" style="animation-delay:${(i * 0.23).toFixed(2)}s" d="M${x} ${y} q6 10 0 14 q-6 -4 0 -14z" fill="#4EA8DE"/>`).join('')}</g></g>`;

  /* Örümcek ağı: A'nın tepesinden yelpaze gibi açılan ışınlar + içe sarkan halkalar.
     A'nın iki bacağı (±0.326) iki ışın, yatay çizgisi 116 yarıçaplı halka olur. */
  const AG_YON = [-0.62, -0.326, -0.15, 0, 0.15, 0.326, 0.62].map((x) => [x, Math.sqrt(1 - x * x)]);
  const agNokta = ([x, y], r) => [100 + x * r, 22 + y * r];
  function agAgi() {
    const isin = AG_YON.map((y) => `M100 22 L${yaz(agNokta(y, 196))}`).join(' ');
    const halka = [38, 76, 116, 156, 192].map((r) => AG_YON.map((y, i) => {
      const p = agNokta(y, r);
      if (i === 0) return `M${yaz(p)}`;
      const o = AG_YON[i - 1];
      const k = agNokta([(y[0] + o[0]) / 2, (y[1] + o[1]) / 2], r * 0.9);
      return `Q${yaz(k)} ${yaz(p)}`;
    }).join(' ')).join(' ');
    return `<path d="${isin}" fill="none" stroke="#8D99AE" stroke-width="3" stroke-linecap="round"/>
      <path d="${halka}" fill="none" stroke="#8D99AE" stroke-width="3" stroke-linecap="round"/>`;
  }

  /* ---------- ortak harf yolları ---------- */
  const C_YOL = 'M150 62 Q128 32 92 34 Q38 40 38 120 Q38 200 92 206 Q128 208 150 178';
  const G_YOL = 'M156 66 Q132 32 98 32 Q38 32 38 120 Q38 208 98 208 Q156 208 158 136 L112 136';
  const O_YOL = 'M100 30 Q160 30 160 120 Q160 210 100 210 Q40 210 40 120 Q40 30 100 30';
  const S_YOL = 'M150 56 Q132 30 100 30 Q55 30 55 72 Q55 112 100 120 Q148 128 148 170 Q148 210 100 210 Q64 210 48 186';
  const U_YOL = 'M45 40 L45 140 Q45 210 100 210 Q155 210 155 140 L155 40';
  const CENGEL = 'M98 216 Q116 222 110 234 Q104 244 90 240';
  const DAMLA = 'M100 22 Q70 70 56 120 Q40 206 100 208 Q160 206 144 120 Q130 70 102 24 L100 22';
  const SIMSEK = 'M140 20 Q122.5 42.5 105 65 Q87.5 87.5 70 110 Q99 111 128 112 Q117 130.3 106 148.7 Q95 167 84 185.3 Q73 203.7 62 222';

  const TANIM = {
    A: {
      cizgiler: ['M40 196 L100 22 L160 196', 'M62 132 Q100 132 138 132'],
      bicim: { 1: 'M62 132 Q100 146 138 132' }, renkler: ['#5E6472', '#5E6472'], kalinliklar: [7, 5],
      bosta: 'ag-salla', ses: 'ag',
      arka: agAgi(),
      /* ağda örümcek yok (A'yı Ö örümceğiyle karıştırıyordu); yalnızca çiy damlaları */
      on: `<g fill="#BDE0FE"><circle cx="72" cy="90" r="4"/><circle cx="118" cy="190" r="5"/><circle cx="40" cy="160" r="4"/></g>`,
    },
    B: {
      cizgiler: ['M60 30 L60 210', 'M60 30 L105 30 Q150 30 150 75 Q150 120 105 120 L60 120', 'M60 120 L112 120 Q160 120 160 165 Q160 210 112 210 L60 210'],
      /* baykuş kafasını yana yatırır (baykuşlar kafasını çevirir): B dik kalır, iki göbeği iki göz */
      susDonus: 90, renk: '#5C3A21', geri: true, bosta: 'kafa', ses: 'hu',
      yan: `<path d="M60 18 Q30 22 30 70 L30 200 Q34 226 70 224 L118 224 Q178 220 182 162 Q184 126 156 118 Q180 104 176 66 Q170 20 112 18Z" fill="#B07A4F"/>
        <path d="M56 26 L40 -14 L86 22Z" fill="#8C5A3A"/>
        <circle cx="106" cy="76" r="26" fill="#FFF3C4"/><circle cx="116" cy="76" r="11" fill="#2B1D16"/><circle cx="120" cy="72" r="3.5" fill="#fff"/>
        <path d="M168 108 L198 122 L166 134Z" fill="#FFB703"/>
        <path d="M80 150 Q108 172 140 160 M80 178 Q108 198 140 188" fill="none" stroke="#8C5A3A" stroke-width="6" stroke-linecap="round"/>`,
      arka: `<path d="M0 172 Q-6 36 100 32 Q206 36 200 172 Q160 214 100 214 Q40 214 0 172Z" fill="#B07A4F"/>
        <path d="M10 76 L-4 18 L48 52Z" fill="#8C5A3A"/><path d="M190 76 L204 18 L152 52Z" fill="#8C5A3A"/>
        <circle cx="55" cy="118" r="34" fill="#FFF3C4"/><circle cx="145" cy="112" r="34" fill="#FFF3C4"/>`,
      on: `<g><g class="yanip"><circle cx="55" cy="122" r="14" fill="#2B1D16"/><circle cx="60" cy="116" r="4" fill="#fff"/></g></g>
        <g><g class="yanip"><circle cx="145" cy="116" r="14" fill="#2B1D16"/><circle cx="150" cy="110" r="4" fill="#fff"/></g></g>
        <path d="M88 150 L112 150 L100 176Z" fill="#FFB703"/>`,
    },
    C: {
      /* civciv: C gövdenin çevresi, C'nin açık ağzı civcivin açık gagası */
      cizgiler: [C_YOL], renk: '#F2A900', kalinlik: 10, bosta: 'gagala', ses: 'cik',
      arka: `<path d="M150 62 Q128 32 92 34 Q38 40 38 120 Q38 200 92 206 Q128 208 150 178 Q168 150 158 120 Q168 90 150 62Z" fill="#FFD84D"/>
        <path d="M150 96 L196 112 L156 122Z" fill="#FF8C1A"/><path d="M156 124 L192 132 L150 146Z" fill="#E86A00"/>
        <path d="M78 206 L72 230 M78 230 L64 236 M78 230 L84 238 M114 206 L118 230 M118 230 L106 236 M118 230 L128 238"
          fill="none" stroke="#FF8C1A" stroke-width="6" stroke-linecap="round"/>`,
      on: `<circle cx="120" cy="84" r="9" fill="#3B2C2A"/><circle cx="123" cy="81" r="3" fill="#fff"/>
        <circle cx="110" cy="112" r="9" fill="#FF9EAA" opacity=".7"/>
        <path d="M60 130 Q70 168 104 160 Q90 146 96 128" fill="#F2C230"/>
        <path d="M84 36 Q92 14 100 34 Q108 16 112 38" fill="none" stroke="#F2A900" stroke-width="5" stroke-linecap="round"/>`,
    },
    'Ç': {
      /* ısırılmış çilek (ters durur): C çileğin kırmızı kabuğu, ucu yukarıda sivrilir;
         C'nin açık ağzı ısırık yeri (içi açık pembe), altındaki çengel (virgül) yeşil sap olur */
      cizgiler: [C_YOL, CENGEL],
      bicim: { 0: 'M146 58 Q124 18 96 22 Q44 34 40 126 Q38 206 96 208 Q136 210 154 180' },
      renkler: ['#B5121B', '#2D9A4E'], kalinliklar: [9, 10], bosta: 'jole', ses: 'cop',
      arka: `<path d='M146 58 Q124 18 96 22 Q44 34 40 126 Q38 206 96 208 Q136 210 154 180 Q124 178 118 154 Q96 140 112 120 Q94 100 116 84 Q118 62 146 58Z' fill="#E63946"/>
        <path d="M146 58 Q118 62 116 84 Q94 100 112 120 Q96 140 118 154 Q124 178 154 180 Q106 176 100 120 Q104 66 146 58Z" fill="#FFB3C1"/>
        <path d="M60 198 Q44 226 76 222 Q78 244 98 226 Q114 244 122 222 Q152 228 138 196 Q100 214 60 198Z" fill="#40916C"/>`,
      on: `<g fill="#FFD23F"><ellipse cx="96" cy="40" rx="2.6" ry="4" transform="rotate(0 96 40)"/><ellipse cx="76" cy="56" rx="2.6" ry="4" transform="rotate(-30 76 56)"/><ellipse cx="112" cy="48" rx="2.6" ry="4" transform="rotate(20 112 48)"/><ellipse cx="62" cy="86" rx="2.6" ry="4" transform="rotate(-50 62 86)"/><ellipse cx="90" cy="74" rx="2.6" ry="4" transform="rotate(-10 90 74)"/><ellipse cx="56" cy="122" rx="2.6" ry="4" transform="rotate(-80 56 122)"/><ellipse cx="80" cy="108" rx="2.6" ry="4" transform="rotate(-30 80 108)"/><ellipse cx="60" cy="160" rx="2.6" ry="4" transform="rotate(-110 60 160)"/><ellipse cx="84" cy="146" rx="2.6" ry="4" transform="rotate(-60 84 146)"/><ellipse cx="76" cy="188" rx="2.6" ry="4" transform="rotate(-150 76 188)"/><ellipse cx="104" cy="190" rx="2.6" ry="4" transform="rotate(180 104 190)"/></g>`,
    },
    D: {
      /* bir dilim domates: D dik durur, dilim onun etrafında dik durur */
      cizgiler: ['M60 30 L60 210', 'M60 30 L95 30 Q160 30 160 120 Q160 210 95 210 L60 210'],
      susDonus: 90, renk: '#B5121B', kalinlik: 14, bosta: 'jole', ses: 'cop',
      arka: `<circle cx="150" cy="44" r="38" fill="#E63946"/>
        <path d="M150 8 L140 -6 L152 2 L160 -10 L160 6 L176 2 L162 14 L138 14 L124 4Z" fill="#2D9A4E"/>
        <path d="M150 8 L152 -16" stroke="#2D9A4E" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="136" cy="30" rx="8" ry="12" fill="#fff" opacity=".45"/>
        <path d="M10 160 L10 125 Q10 60 100 60 Q190 60 190 125 L190 160Z" fill="#E63946"/>
        <path d="M24 154 L24 128 Q24 76 100 74 Q176 76 176 128 L176 154Z" fill="#FF7B7B"/>`,
      on: `<path d="M100 150 L100 84 M100 150 L46 112 M100 150 L154 112" stroke="#FFC9C9" stroke-width="7" stroke-linecap="round"/>
        <g fill="#F6D365"><ellipse cx="64" cy="138" rx="5" ry="7"/><ellipse cx="78" cy="122" rx="5" ry="7"/><ellipse cx="86" cy="104" rx="5" ry="7"/>
        <ellipse cx="116" cy="104" rx="5" ry="7"/><ellipse cx="124" cy="122" rx="5" ry="7"/><ellipse cx="136" cy="138" rx="5" ry="7"/></g>`,
    },
    E: {
      /* ev: E'nin dik çizgisi duvar, üst kolu çatı altı, orta kolu kat arası, alt kolu zemin;
         kolların arasındaki iki boşluk evin pencereleri olur, tepeye çatı gelir */
      cizgiler: ['M150 30 L60 30 L60 210 L150 210', 'M60 120 L135 120'], renk: '#7B4B2A', kalinlik: 14,
      bosta: 'zipla', ses: 'kapi',
      arka: `<rect x="62" y="32" width="88" height="176" fill="#FFF1D6"/>
        <rect x="128" y="-34" width="18" height="40" fill="#B5121B"/>
        <path d="M40 34 L105 -26 L170 34Z" fill="#E63946" stroke="#B5121B" stroke-width="5" stroke-linejoin="round"/>
        <path d="M-6 214 Q100 202 206 214 L206 236 L-6 236Z" fill="#8BC34A"/>`,
      on: `<g><rect x="80" y="50" width="52" height="52" rx="4" fill="#FFE8A3" stroke="#7B4B2A" stroke-width="5"/>
          <path d="M106.0 50 L106.0 102 M80 76.0 L132 76.0" stroke="#7B4B2A" stroke-width="4"/></g><g><rect x="80" y="140" width="52" height="52" rx="4" fill="#FFE8A3" stroke="#7B4B2A" stroke-width="5"/>
          <path d="M106.0 140 L106.0 192 M80 166.0 L132 166.0" stroke="#7B4B2A" stroke-width="4"/></g>
        <g><g class="buhar"><circle cx="137" cy="-46" r="7" fill="#DEE2E6"/><circle cx="146" cy="-62" r="9" fill="#DEE2E6"/></g></g>
        <g fill="#E63946"><circle cx="30" cy="204" r="6"/><circle cx="176" cy="204" r="6"/></g><g fill="#FFD23F"><circle cx="30" cy="204" r="2.5"/><circle cx="176" cy="204" r="2.5"/></g>`,
    },
    F: {
      /* dik diş fırçası: F'nin dik çizgisi sap, iki kolu kıl demetinin üstü ve altı */
      cizgiler: ['M70 210 L70 30 L150 30', 'M70 115 L130 115'], renk: '#3A0CA3', kalinlik: 12, bosta: 'fircala-dik', ses: 'fis',
      arka: `<rect x="56" y="18" width="28" height="216" rx="14" fill="#4CC9F0"/>
        <path d="M80 44 L140 44 M80 56 L144 56 M80 68 L140 68 M80 80 L144 80 M80 92 L140 92 M80 104 L136 104"
          stroke="#fff" stroke-width="8" stroke-linecap="round"/>
        <path d="M80 50 L136 50 M80 74 L136 74 M80 98 L132 98" stroke="#90E0EF" stroke-width="5" stroke-linecap="round"/>`,
      on: `<path d="M142 40 Q172 36 166 58 Q182 70 166 82 Q178 98 160 106 Q148 112 142 104 Z" fill="#fff" stroke="#4EA8DE" stroke-width="4"/>
        <path d="M152 46 Q164 70 152 100" fill="none" stroke="#E63946" stroke-width="5" stroke-linecap="round"/>
        <circle cx="70" cy="196" r="6" fill="#fff" opacity=".6"/>`,
    },
    G: {
      cizgiler: [G_YOL], renk: '#F28C00', bosta: 'nabiz', ses: 'parla',
      arka: `<g><g class="don" style="transform-origin:98px 120px"><path d="${isinlar(98, 120, 100, 130, 12)}" stroke="#FFB703" stroke-width="10" stroke-linecap="round"/></g></g>
        <circle cx="98" cy="120" r="84" fill="#FFD23F"/>`,
      on: `<circle cx="78" cy="104" r="7" fill="#3B2C2A"/><circle cx="120" cy="104" r="7" fill="#3B2C2A"/>
        <path d="M74 142 Q98 166 124 142" fill="none" stroke="#3B2C2A" stroke-width="6" stroke-linecap="round"/>`,
    },
    'Ğ': {
      /* yumuşak G: G'nin güneşinin yumuşak hâli (sabahın tatlı, doğan güneşi). G hiç değişmez;
         ışınlar yumuşak yuvarlak yapraklara döner, renkler pastel, gözler Ğ'nin şapkası (˘) gibi kapalı gülümser */
      cizgiler: [G_YOL, 'M70 4 Q100 26 130 4'],
      renkler: ['#F4A261', '#F4A261'], kalinliklar: [12, 9], bosta: 'nabiz', ses: 'cin',
      arka: `<g><g class="don" style="transform-origin:98px 120px"><g fill="#FFD8A8"><ellipse cx="126.0" cy="15.7" rx="11" ry="17" transform="rotate(15 126.0 15.7)"/><ellipse cx="174.4" cy="43.6" rx="11" ry="17" transform="rotate(45 174.4 43.6)"/><ellipse cx="202.3" cy="92.0" rx="11" ry="17" transform="rotate(75 202.3 92.0)"/><ellipse cx="202.3" cy="148.0" rx="11" ry="17" transform="rotate(105 202.3 148.0)"/><ellipse cx="174.4" cy="196.4" rx="11" ry="17" transform="rotate(135 174.4 196.4)"/><ellipse cx="126.0" cy="224.3" rx="11" ry="17" transform="rotate(165 126.0 224.3)"/><ellipse cx="70.0" cy="224.3" rx="11" ry="17" transform="rotate(195 70.0 224.3)"/><ellipse cx="21.6" cy="196.4" rx="11" ry="17" transform="rotate(225 21.6 196.4)"/><ellipse cx="-6.3" cy="148.0" rx="11" ry="17" transform="rotate(255 -6.3 148.0)"/><ellipse cx="-6.3" cy="92.0" rx="11" ry="17" transform="rotate(285 -6.3 92.0)"/><ellipse cx="21.6" cy="43.6" rx="11" ry="17" transform="rotate(315 21.6 43.6)"/><ellipse cx="70.0" cy="15.7" rx="11" ry="17" transform="rotate(345 70.0 15.7)"/></g></g></g>
        <circle cx="98" cy="120" r="84" fill="#FFE8C2"/>`,
      on: `<path d="M68 106 Q78 116 88 106 M110 106 Q120 116 130 106" fill="none" stroke="#7A4E2D" stroke-width="5" stroke-linecap="round"/>
        <circle cx="66" cy="128" r="9" fill="#FFB3C1" opacity=".8"/><circle cx="132" cy="128" r="9" fill="#FFB3C1" opacity=".8"/>
        <path d="M82 140 Q98 154 116 140" fill="none" stroke="#7A4E2D" stroke-width="5" stroke-linecap="round"/>`,
    },
    H: {
      cizgiler: ['M50 30 L50 210', 'M150 30 L150 210', 'M50 120 L150 120'],
      bicim: { 2: 'M50 120 Q100 186 150 120' }, renkler: ['#8B5A2B', '#8B5A2B', '#E63946'], bosta: 'sakin', ses: 'horul',
      salla: { cizgi: 2, sinif: 'h-hamak', merkez: '100 120', aci: 7 },
      arka: `<circle cx="50" cy="20" r="36" fill="#3DBB6C"/><circle cx="150" cy="20" r="36" fill="#3DBB6C"/>
        <path d="M20 214 L180 214" stroke="#95D5B2" stroke-width="10" stroke-linecap="round"/>`,
      on: `<g><g class="h-hamak"><path d="M50 120 Q100 196 150 120 Q100 172 50 120Z" fill="#FF6F61"/>
        <g class="zzz"><text x="118" y="120" font-size="26" font-weight="900" fill="#1D63D8">z</text><text x="136" y="96" font-size="20" font-weight="900" fill="#1D63D8">z</text></g></g></g>`,
    },
    I: {
      cizgiler: ['M100 52 L100 210'], renk: '#E9C46A', kalinlik: 8, bosta: 'titrek', ses: 'pif',
      arka: `<circle cx="100" cy="30" r="48" fill="#FFE8A3" opacity=".6"/>
        <rect x="80" y="60" width="40" height="152" rx="8" fill="#FFF1D0" stroke="#E9C46A" stroke-width="4"/>`,
      on: `<g><g class="alev"><path d="M100 0 Q124 28 100 50 Q76 28 100 0Z" fill="#FFB703"/><path d="M100 20 Q111 33 100 46 Q89 33 100 20Z" fill="#FF6F61"/></g></g>`,
    },
    'İ': {
      cizgiler: ['M100 80 L100 206', nokta(100, 36)], renkler: ['#8D99AE', '#E63946'], kalinliklar: [12, 30], bosta: 'dikis', ses: 'cin',
      on: `<path d="M94 202 L100 240 L106 202Z" fill="#8D99AE"/><ellipse cx="100" cy="98" rx="3" ry="10" fill="#FFF4EA"/>
        <path d="M100 36 Q58 60 96 96 Q144 112 122 150 Q104 180 132 204" fill="none" stroke="#E63946" stroke-width="5" stroke-linecap="round"/>`,
    },
    J: {
      cizgiler: ['M130 30 L130 160 Q130 210 85 210 Q50 210 45 175'], susDonus: -90, renk: '#457B9D', kalinlik: 12,
      bosta: 'suzul', ses: 'jet', cikis: 'yukari', cikisSesi: 'jet',
      arka: `<path d="M8 150 L10 66 L46 62 L84 118 L190 118 Q236 134 190 152Z" fill="#E9ECEF" stroke="#8D99AE" stroke-width="4"/>
        <path d="M96 146 L66 196 L108 196 L142 146Z" fill="#ADB5BD"/>`,
      on: `<g fill="#4CC9F0"><circle cx="110" cy="132" r="6"/><circle cx="132" cy="132" r="6"/><circle cx="154" cy="132" r="6"/><circle cx="176" cy="132" r="6"/></g>
        <g><g class="alev"><path d="M8 124 Q-34 136 8 148Z" fill="#FFB703"/></g></g>`,
    },
    K: {
      cizgiler: ['M100 30 L100 210', 'M190 30 L102 125 L190 210'], renk: '#3B2C2A', kalinlik: 12, bosta: 'kanat-yan', ses: 'pirpir', cikis: 'kelebek', cikisSesi: 'pirpir',
      /* yandan kelebek: K'nin dik çizgisi gövde, iki kolu üst ve alt kanadın kenarı (aynalama yok) */
      arka: `<path d="M102 120 L190 30 Q236 70 206 112 Q170 132 102 122Z" fill="#FF9F1C"/>
        <path d="M102 128 L190 210 Q222 170 186 140 Q150 124 102 128Z" fill="#FFBF69"/>`,
      on: `<circle cx="160" cy="82" r="13" fill="#fff"/><circle cx="178" cy="100" r="7" fill="#fff"/>
        <circle cx="166" cy="166" r="10" fill="#FF6F61"/>
        <circle cx="100" cy="24" r="12" fill="#3B2C2A"/><circle cx="104" cy="21" r="3" fill="#fff"/>
        <path d="M100 14 Q96 -6 82 -12 M104 14 Q112 -6 126 -10" fill="none" stroke="#3B2C2A" stroke-width="5" stroke-linecap="round"/>
        <circle cx="82" cy="-12" r="5" fill="#3B2C2A"/><circle cx="126" cy="-10" r="5" fill="#3B2C2A"/>`,
    },
    L: {
      cizgiler: ['M95 46 L95 210 L165 210'], renk: '#FF6F61', kalinlik: 10, bosta: 'gaga', ses: 'tak',
      arka: `<path d="M156 22 Q180 -6 160 -32" fill="none" stroke="#3B2C2A" stroke-width="20" stroke-linecap="round"/>
        <path d="M156 22 Q180 -6 160 -32" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
        <ellipse cx="110" cy="30" rx="60" ry="30" fill="#fff" stroke="#3B2C2A" stroke-width="4"/>
        <path d="M54 24 Q90 54 140 42 Q108 64 54 42Z" fill="#3B2C2A"/>`,
      on: `<circle cx="158" cy="-36" r="15" fill="#fff" stroke="#3B2C2A" stroke-width="4"/><circle cx="162" cy="-40" r="3.5" fill="#3B2C2A"/>
        <path d="M170 -40 L216 -30 L170 -28Z" fill="#FF6F61"/>
        <path d="M108 58 L132 108 L110 122" fill="none" stroke="#FF6F61" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
    N: {
      /* nehir (kuşbakışı): N'nin üç çizgisi kıvrılarak akan nehir olur, kıyıda ağaçlar */
      cizgiler: ['M50 210 L50 30 L150 210 L150 30'], renk: '#3A86FF', kalinlik: 30, bosta: 'zipla', ses: 'akarsu',
      arka: `<rect x="2" y="6" width="196" height="228" rx="34" fill="#B7E4A7"/>
        <path d="M50 210 L50 30 L150 210 L150 30" fill="none" stroke="#E9D8A6" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>`,
      on: `<g><g class="akis"><path d="M50 210 L50 30 L150 210 L150 30" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="10 16" stroke-linecap="round" opacity=".75"/></g></g>
        <g><circle cx="116" cy="62" r="18" fill="#2D9A4E"/><rect x="113" y="76" width="6" height="14" fill="#7B4B2A"/></g>
        <g><circle cx="86" cy="176" r="16" fill="#40916C"/><rect x="83" y="188" width="6" height="12" fill="#7B4B2A"/></g>
        <g fill="#FFD23F"><circle cx="20" cy="120" r="5"/><circle cx="182" cy="230" r="0"/><circle cx="184" cy="120" r="5"/></g>
        <path d="M92 108 L110 108 L106 116 L96 116Z" fill="#E63946"/><path d="M101 108 L101 96 L109 104Z" fill="#fff"/>`,
    },
    O: {
      cizgiler: [O_YOL], renk: '#F1E3C8', kalinlik: 12, bosta: 'cizir', ses: 'cizir',
      arka: `<path d="M100 16 Q180 18 174 112 Q186 214 98 222 Q14 216 24 120 Q20 26 100 16Z" fill="#fff" stroke="#EADFC9" stroke-width="4"/>`,
      on: `<circle cx="102" cy="122" r="42" fill="#FFB703"/><circle cx="88" cy="106" r="10" fill="#FFE29A"/>
        <circle cx="90" cy="124" r="4" fill="#3B2C2A"/><circle cx="114" cy="124" r="4" fill="#3B2C2A"/>
        <path d="M92 138 Q102 146 112 138" fill="none" stroke="#3B2C2A" stroke-width="3" stroke-linecap="round"/>`,
    },
    'Ö': {
      /* örümcek: Ö'nün iki noktası sapların ucundaki iki göz olur (yerinde kalır) */
      cizgiler: [O_YOL, nokta(72, 6), nokta(128, 6)],
      renkler: ['#2B2D42', '#fff', '#fff'], kalinliklar: [18, 34, 34], bosta: 'tikir', ses: 'tikir', cikis: 'kac', cikisSesi: 'tikirkos',
      arka: `<path class="bacak bacak-1" d="M44 86 Q10 56 -12 78 M43 140 Q6 150 -12 176 M159 112 Q196 102 216 124 M150 166 Q180 192 200 218"
          fill="none" stroke="#2B2D42" stroke-width="8" stroke-linecap="round"/>
        <path class="bacak bacak-2" d="M41 112 Q4 102 -16 124 M50 166 Q20 192 0 218 M156 86 Q190 56 212 78 M157 140 Q194 150 212 176"
          fill="none" stroke="#2B2D42" stroke-width="8" stroke-linecap="round"/>
        <path d="M86 40 Q76 26 72 10 M114 40 Q124 26 128 10" fill="none" stroke="#2B2D42" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="100" cy="120" rx="60" ry="90" fill="#2B2D42"/>`,
      on: `<circle cx="74" cy="8" r="7" fill="#2B2D42"/><circle cx="130" cy="8" r="7" fill="#2B2D42"/>
        <circle cx="76" cy="5" r="2.5" fill="#fff"/><circle cx="132" cy="5" r="2.5" fill="#fff"/>
        <path d="M80 126 Q100 144 120 126" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
        <circle cx="72" cy="112" r="7" fill="#FF8FA3" opacity=".5"/><circle cx="128" cy="112" r="7" fill="#FF8FA3" opacity=".5"/>`,
    },
    P: {
      /* papağan (yandan): P'nin göbeği yuvarlak kafa, gaga göbeğin sağından çıkar;
         P'nin dik çizgisi papağanın sırtı olur, alttan uzun kuyruk sarkar, dala tünemiştir */
      cizgiler: ['M70 210 L70 30', 'M70 30 L110 30 Q160 30 160 77 Q160 125 110 125 L70 125'],
      renkler: ['#9D0208', '#9D0208'], kalinliklar: [9, 9], bosta: 'dans', ses: 'gak',
      arka: `<path d="M66 196 L50 254 L66 256 L80 200Z" fill="#1D63D8"/><path d="M74 198 L70 256 L84 254 L88 200Z" fill="#E63946"/>
        <path d="M70 112 Q146 116 142 170 Q136 208 80 208 L70 208Z" fill="#E63946"/>
        <path d="M70 30 L110 30 Q160 30 160 77 Q160 125 110 125 L70 125Z" fill="#E63946"/>
        <path d="M74 126 Q118 132 116 176 Q106 206 74 202Z" fill="#2D9A4E"/>
        <path d="M76 168 Q96 172 104 190 M76 184 Q92 188 98 200" fill="none" stroke="#1D63D8" stroke-width="6" stroke-linecap="round"/>
        <rect x="14" y="204" width="182" height="12" rx="6" fill="#8D5524"/>
        <path d="M188 210 Q198 196 206 200" stroke="#8D5524" stroke-width="6" stroke-linecap="round" fill="none"/>
        <ellipse cx="200" cy="192" rx="10" ry="6" fill="#52B788"/>`,
      on: `<path d="M150 58 Q196 54 192 104 Q180 88 156 94Z" fill="#FFD23F" stroke="#B08900" stroke-width="3" stroke-linejoin="round"/>
        <path d="M156 96 Q174 98 172 112 Q160 112 152 102Z" fill="#3B2C2A"/>
        <ellipse cx="124" cy="70" rx="20" ry="17" fill="#fff"/>
        <circle cx="128" cy="68" r="7" fill="#1B1B1B"/><circle cx="130" cy="66" r="2.4" fill="#fff"/>
        <path d="M92 210 l-4 10 M100 210 l0 10 M108 210 l4 10" stroke="#6C757D" stroke-width="4" stroke-linecap="round"/>`,
    },
    R: {
      /* robot: R'nin göbeği kafa, dik çizgisi gövde ve bacak, çapraz çizgisi adım atan bacak */
      cizgiler: ['M60 210 L60 30', 'M60 30 L105 30 Q155 30 155 75 Q155 120 105 120 L60 120 L155 210'],
      renk: '#495057', kalinlik: 12, bosta: 'robot', ses: 'bip',
      arka: `<path d="M60 30 L105 30 Q155 30 155 75 Q155 120 105 120 L60 120Z" fill="#ADB5BD"/>
        <rect x="44" y="124" width="74" height="62" rx="10" fill="#8D99AE"/>
        <path d="M100 30 L100 6" stroke="#495057" stroke-width="5"/>
        <path d="M118 146 L162 132" stroke="#495057" stroke-width="10" stroke-linecap="round"/>
        <rect x="36" y="204" width="34" height="14" rx="5" fill="#495057"/><rect x="148" y="204" width="34" height="14" rx="5" fill="#495057"/>`,
      on: `<circle cx="100" cy="4" r="8" fill="#E63946"/>
        <circle cx="122" cy="68" r="15" fill="#fff"/><circle cx="126" cy="68" r="7" fill="#1D63D8"/>
        <path d="M84 98 L136 98" stroke="#495057" stroke-width="5" stroke-dasharray="6 5"/>
        <circle cx="70" cy="150" r="6" fill="#FFD23F"/><circle cx="90" cy="150" r="6" fill="#2EC46B"/><circle cx="168" cy="130" r="8" fill="#495057"/>`,
    },
    S: {
      cizgiler: [S_YOL], renk: '#F4A3B5', kalinlik: 34, bosta: 'kipir', ses: 'vik',
      on: `<circle cx="142" cy="48" r="5" fill="#3B2C2A"/><circle cx="158" cy="58" r="5" fill="#3B2C2A"/>
        <path d="M70 70 L52 76 M78 96 L62 108 M128 150 L146 146 M130 182 L148 186" stroke="#E5899E" stroke-width="5" stroke-linecap="round"/>`,
    },
    'Ş': {
      /* şimşek: S'nin kıvrımları keskinleşip zikzak olur, çengel kıvılcım olur */
      cizgiler: [S_YOL, CENGEL],
      bicim: { 0: SIMSEK, 1: 'M44 232 Q52 214 62 230 Q72 246 82 230' },
      renkler: ['#F28C00', '#FFB703'], kalinliklar: [8, 7], bosta: 'cak', ses: 'gok',
      arka: `<g><g class="bulut"><circle cx="110" cy="-6" r="30" fill="#ADB5BD"/><circle cx="150" cy="4" r="26" fill="#8D99AE"/><circle cx="72" cy="6" r="24" fill="#8D99AE"/>
        <rect x="60" y="0" width="110" height="28" rx="14" fill="#8D99AE"/></g></g>
        <path d="M150 10 L58 118 L114 116 L50 234 L144 102 L90 104Z" fill="#FFD23F" stroke="#F28C00" stroke-width="4" stroke-linejoin="round"/>`,
      on: `${damlalar([30, 168, 186], 30)}`,
    },
    T: {
      cizgiler: ['M30 40 L170 40', 'M100 40 L100 210'], renkler: ['#E63946', '#8B5A2B'], bosta: 'sakin', ses: 'gicir',
      salla: { cizgi: 0, sinif: 't-tahta', merkez: '100 40', aci: 12 },
      arka: `<path d="M40 214 L160 214" stroke="#95D5B2" stroke-width="10" stroke-linecap="round"/>`,
      on: `<g><g class="t-tahta"><circle cx="40" cy="12" r="18" fill="#FFD84D"/><circle cx="160" cy="12" r="18" fill="#9B5DE5"/>
        <circle cx="34" cy="8" r="3" fill="#3B2C2A"/><circle cx="46" cy="8" r="3" fill="#3B2C2A"/>
        <circle cx="154" cy="8" r="3" fill="#3B2C2A"/><circle cx="166" cy="8" r="3" fill="#3B2C2A"/></g></g>`,
    },
    U: {
      /* uğur böceği (yukarıdan, dik): U kabuğun çevresi, kafa U'nun açık ağzını kapatır */
      cizgiler: [U_YOL], renk: '#1B1B1B', kalinlik: 10, bosta: 'emekle', ses: 'vizz',
      arka: `<path d="M45 140 L22 132 M45 172 L22 186 M155 140 L178 132 M155 172 L178 186 M60 52 L36 40 M140 52 L164 40" stroke="#1B1B1B" stroke-width="7" stroke-linecap="round"/>
        <path d="M86 6 Q80 -14 66 -20 M114 6 Q120 -14 134 -20" fill="none" stroke="#1B1B1B" stroke-width="5" stroke-linecap="round"/>
        <circle cx="66" cy="-20" r="5" fill="#1B1B1B"/><circle cx="134" cy="-20" r="5" fill="#1B1B1B"/>
        <path d="M45 46 L45 140 Q45 210 100 210 Q155 210 155 140 L155 46Z" fill="#E63946"/>
        <path d="M50 48 Q50 2 100 2 Q150 2 150 48Z" fill="#1B1B1B"/>`,
      on: `<path d="M100 48 L100 208" stroke="#1B1B1B" stroke-width="5"/>
        <g fill="#1B1B1B"><circle cx="72" cy="86" r="12"/><circle cx="128" cy="86" r="12"/><circle cx="70" cy="150" r="12"/><circle cx="130" cy="150" r="12"/><circle cx="100" cy="190" r="0"/></g>
        <circle cx="80" cy="26" r="7" fill="#fff"/><circle cx="120" cy="26" r="7" fill="#fff"/>
        <circle cx="81" cy="27" r="3" fill="#1B1B1B"/><circle cx="121" cy="27" r="3" fill="#1B1B1B"/>`,
    },
    'Ü': {
      /* ütü (yukarıdan): U ütünün tabanı olur, burnu biraz sivrilir (U dik kalır); ütü bir tişörtün
         üstünde gidip gelir, içinde kulp, iki nokta topuktan çıkan buhar */
      cizgiler: [U_YOL, nokta(72, 6), nokta(128, 6)],
      bicim: { 0: 'M45 40 L45 120 Q45 178 100 214 Q155 178 155 120 L155 40' },
      renkler: ['#3A0CA3', '#ADB5BD', '#ADB5BD'], kalinliklar: [10, 22, 22], bosta: 'utule', ses: 'tis',
      arka: `<path d="M-20 70 L30 40 L170 40 L220 70 L200 110 L176 100 L176 236 L24 236 L24 100 L0 110Z" fill="#FFAFCC" stroke="#F78FB3" stroke-width="4" stroke-linejoin="round"/>
        <path d="M74 40 Q100 62 126 40" fill="none" stroke="#F78FB3" stroke-width="5"/>
        <path d="M30 150 q8 -6 0 -12 q-8 -6 0 -12 M30 196 q8 -6 0 -12 q-8 -6 0 -12 M170 150 q8 -6 0 -12 q-8 -6 0 -12 M170 196 q8 -6 0 -12 q-8 -6 0 -12" fill="none" stroke="#F78FB3" stroke-width="3" stroke-linecap="round"/>
        <path d="M45 40 L45 120 Q45 178 100 214 Q155 178 155 120 L155 40Z" fill="#ADB5BD" stroke="#ADB5BD" stroke-width="24" stroke-linejoin="round"/>
        <path d="M45 40 L45 120 Q45 178 100 214 Q155 178 155 120 L155 40Z" fill="#4CC9F0"/>
        <path d="M100 40 Q100 16 86 0 Q72 -16 84 -36" fill="none" stroke="#6C757D" stroke-width="6" stroke-linecap="round"/>`,
      on: `<rect x="45" y="40" width="110" height="14" fill="#3A9FC0"/>
        <rect x="84" y="74" width="32" height="92" rx="16" fill="#3A0CA3"/>
        <rect x="91" y="84" width="18" height="72" rx="9" fill="#5A2FC2"/>
        <g fill="#fff"><circle cx="66" cy="112" r="3"/><circle cx="134" cy="112" r="3"/><circle cx="68" cy="146" r="3"/><circle cx="132" cy="146" r="3"/><circle cx="100" cy="188" r="3"/></g>
        <g><g class="buhar"><path d="M58 -6 Q50 -18 60 -28 M142 -6 Q150 -18 140 -28" fill="none" stroke="#ADB5BD" stroke-width="6" stroke-linecap="round"/></g></g>
        <g><g class="buhar"><path d="M78 236 Q70 222 80 212 M100 246 Q92 232 102 222 M122 236 Q114 222 124 212" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/></g></g>`,
    },
    V: {
      /* vapur önden: V çentiği gövde olarak kalır */
      cizgiler: ['M40 40 L100 210 L160 40'], bicim: { 0: 'M20 110 L100 192 L180 110' }, renk: '#1D3557', kalinlik: 12,
      bosta: 'dalga', ses: 'duduk', cikis: 'sag', cikisSesi: 'duduk',
      arka: `<path d="M20 110 L180 110 L100 192Z" fill="#E63946"/><path d="M42 132 L158 132 L150 142 L50 142Z" fill="#fff"/>
        <rect x="50" y="76" width="100" height="34" rx="6" fill="#fff" stroke="#1D3557" stroke-width="4"/>
        <rect x="88" y="34" width="24" height="44" fill="#E63946"/><rect x="88" y="34" width="24" height="10" fill="#1D3557"/>
        <path d="M0 196 Q25 182 50 196 Q75 210 100 196 Q125 182 150 196 Q175 210 200 196" fill="none" stroke="#4EA8DE" stroke-width="8" stroke-linecap="round"/>`,
      on: `<g fill="#4CC9F0"><circle cx="70" cy="93" r="7"/><circle cx="100" cy="93" r="7"/><circle cx="130" cy="93" r="7"/></g>
        <g><g class="buhar"><circle cx="100" cy="18" r="12" fill="#CED4DA"/><circle cx="114" cy="-4" r="16" fill="#E9ECEF"/></g></g>`,
    },
    Y: {
      /* üç uçlu yıldız: Y'nin üç kolu eşit aralıkla (120°) açılır ve yıldızın üç ucu olur;
         yıldız simetriktir ve Y'nin kendisidir */
      cizgiler: ['M40 40 L100 120 L160 40', 'M100 120 L100 210'],
      bicim: { 0: 'M22.1 75.0 L100 120 L177.9 75.0' },
      renk: '#C98A00', kalinlik: 9, bosta: 'parilti', ses: 'parla',
      arka: `<path d="M190.1 68.0 L122.5 133.0 L100.0 224.0 L77.5 133.0 L9.9 68.0 L100.0 94.0Z" fill="#FFD23F" stroke="#E09F00" stroke-width="7" stroke-linejoin="round"/>`,
      on: `<circle cx="88" cy="134" r="5" fill="#3B2C2A"/><circle cx="112" cy="134" r="5" fill="#3B2C2A"/>
        <circle cx="89.5" cy="132.5" r="1.8" fill="#fff"/><circle cx="113.5" cy="132.5" r="1.8" fill="#fff"/>
        <g fill="#FFE66D"><path d="M18 196 l5 -12 l5 12 l-5 12z"/><path d="M176 196 l4 -10 l4 10 l-4 10z"/><path d="M176 24 l4 -9 l4 9 l-4 9z"/></g>`,
    },
    Z: {
      cizgiler: ['M50 30 L150 30 L50 165 L150 165'], renk: '#E9A23B', kalinlik: 24, bosta: 'dortnala', ses: 'nal', cikis: 'sag', cikisSesi: 'nal',
      arka: `<g class="z-arka-bacak"><path d="M66 196 L62 236 M90 198 L90 238" stroke="#E9A23B" stroke-width="10" stroke-linecap="round"/></g>
        <g class="z-on-bacak"><path d="M128 198 L128 238 M152 194 L156 234" stroke="#E9A23B" stroke-width="10" stroke-linecap="round"/></g>
        <ellipse cx="108" cy="178" rx="62" ry="26" fill="#F4C04E"/>
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
  const katman = (s, ad) => [...s.querySelector(`.${ad}`).children];

  function genelOlustur(t, h) {
    const renk = window.SESLI.has(h) ? '#E0363A' : '#1D63D8';
    const yollar = t.cizgiler.map((d) =>
      `<path class="hy" d="${d}" fill="none" stroke="${renk}" stroke-width="${KALIN}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    const don = t.susDonus ? ` transform="rotate(${t.susDonus} ${MERKEZ})"` : '';
    const s = svgYap(`<g class="arka"${don}>${t.arka || ''}</g><g class="yan">${t.yan || ''}</g><g class="harf">${yollar}</g><g class="on"${don}>${t.on || ''}</g>`);
    s.dataset.renk = renk;
    /* süsler harf çizilmeden görünmesin (yoksa uçuş sırasında karakter bir an önce görünür) */
    for (const ad of ['arka', 'yan', 'on']) katman(s, ad).forEach((e) => { e.style.opacity = '0'; });
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

  /** B gibi harflerde: önce harfin kendi duruşunda (yandan) karakter görünür, sonra döner. */
  async function yandanGoster(t, s, yollar, renk, sihir) {
    const yan = katman(s, 'yan');
    sihir();
    renkle(t, yollar, renk, false);
    await Promise.all(yan.map((e, i) => { e.style.opacity = ''; return buyu(e, 420, i * 70); }));
    efekt(t.ses);
    await bekle(1300);
    await Promise.all(yan.map((e) => sonuk(e, 350)));
  }

  /* kal: sonunda harfe geri dönme (albüm); sessiz: karakter sesi çalma */
  async function genelOynat(t, s, { sihir = () => {}, kelime = () => {}, kal = false, sessiz = false } = {}) {
    const renk = s.dataset.renk;
    const harf = s.querySelector('.harf');
    const yollar = [...harf.querySelectorAll('.hy')];
    const susler = [...katman(s, 'arka'), ...katman(s, 'on')];
    for (const y of yollar) await ciz(y, Math.max(260, Math.min(800, y.getTotalLength() * 2.6)));
    yollar.forEach((y) => { y.getAnimations().forEach((a) => a.cancel()); y.style.strokeDasharray = ''; });
    await bekle(220);
    if (t.yan) await yandanGoster({ ...t, ses: sessiz ? null : t.ses }, s, yollar, renk, sihir);
    else { sihir(); renkle(t, yollar, renk, false); }
    const isler = [];
    if (t.donus) isler.push(dondur(harf, 0, t.donus, 650));
    for (const [i, d] of Object.entries(t.bicim || {})) isler.push(bicimle(yollar[i], d, 650));
    await Promise.all(isler);
    if (!t.yan && !sessiz) efekt(t.ses);
    await Promise.all(susler.map((e, i) => { e.style.opacity = ''; return buyu(e, 460, i * 80); }));
    if (t.salla) {
      const deger = `-${t.salla.aci} ${t.salla.merkez};${t.salla.aci} ${t.salla.merkez};-${t.salla.aci} ${t.salla.merkez}`;
      const ayar = { attributeName: 'transform', type: 'rotate', values: deger, dur: '2.4s', repeatCount: 'indefinite' };
      smil('animateTransform', yollar[t.salla.cizgi], ayar);
      smil('animateTransform', s.querySelector(`.${t.salla.sinif}`), ayar);
    }
    s.classList.add('canli', t.bosta || 'zipla');
    kelime();
    if (!t.geri || kal) return;
    await bekle(1500);
    s.classList.remove('canli');
    await Promise.all(susler.map((e) => sonuk(e, 400)));
    renkle(t, yollar, renk, true);
    if (t.donus) await dondur(harf, t.donus, 0, 650);
    await bekle(300);
  }

  const UCUS = {
    yukari: [{ transform: 'none' }, { transform: 'translateY(6vh)', offset: 0.2 }, { transform: 'translateY(-120vh)' }],
    sag: [{ transform: 'none' }, { transform: 'translateX(-4vw)', offset: 0.2 }, { transform: 'translate(110vw, -10vh)' }],
    kelebek: [
      { transform: 'none' }, { transform: 'translate(8vw, -14vh) rotate(8deg)', offset: 0.25 },
      { transform: 'translate(-2vw, -30vh) rotate(-8deg)', offset: 0.5 }, { transform: 'translate(18vw, -48vh) rotate(8deg) scale(.8)', offset: 0.75 },
      { transform: 'translate(34vw, -90vh) rotate(-6deg) scale(.6)' },
    ],
  };
  const SURE = { kelebek: 2600 };
  /* Uçuş kabın (.d-cizim) üzerinde oynar; böylece svg'nin kendi hareketi (kanat çırpma,
     dörtnala koşu, bacak tıkırtısı) uçarken de sürer. */
  const ucup = (yon, ses) => async (s) => {
    const kap = s.parentElement || s;
    efekt(ses);
    if (yon === 'kac') {
      await window.Gorsel.kacis(kap);
      await kap.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.3)' }], { duration: 300, fill: 'forwards' }).finished;
      return;
    }
    await kap.animate(UCUS[yon], { duration: SURE[yon] || 1500, easing: yon === 'kelebek' ? 'ease-in-out' : 'ease-in', fill: 'forwards' }).finished;
  };

  /* ---------- özel çizim: M → martı (kanatlar M'nin kendisi) ---------- */
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
    async oynat(s, { sihir = () => {}, kelime = () => {}, sessiz = false } = {}) {
      const kanat = s.querySelector('.m-cizgi');
      await ciz(kanat, 900);
      await bekle(250);
      sihir();
      kanat.animate([{ stroke: '#1D63D8' }, { stroke: '#6B7C93' }], { duration: 500, fill: 'forwards' });
      await bicimle(kanat, KANAT_YUKARI, 550);
      kanat.setAttribute('d', KANAT_YUKARI);
      if (!sessiz) efekt('kanat');
      await buyu(s.querySelector('.m-govde'), 450);
      kelime();
    },
    async cikis(s) {
      smil('animate', s.querySelector('.m-cizgi'), { attributeName: 'd', values: `${KANAT_YUKARI};${KANAT_ASAGI};${KANAT_YUKARI}`, dur: '340ms', repeatCount: 'indefinite' });
      efekt('kanat');
      await bekle(700);
      await s.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'translate(12vw, -8vh) scale(.85) rotate(-6deg)', opacity: 1, offset: 0.35 },
        { transform: 'translate(60vw, -70vh) scale(.35) rotate(-12deg)', opacity: 0 },
      ], { duration: 1700, easing: 'ease-in', fill: 'forwards' }).finished;
    },
  };

  const hepsi = { M };
  for (const [h, t] of Object.entries(TANIM)) {
    hepsi[h] = Object.freeze({
      olustur: () => genelOlustur(t, h),
      oynat: (s, geri) => genelOynat(t, s, geri),
      cikis: t.cikis ? ucup(t.cikis, t.cikisSesi) : undefined,
      kacisSesi: t.cikisSesi,
    });
  }
  return Object.freeze(hepsi);
})();
