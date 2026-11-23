/*
 * YENİ YIL: tablet ışıklı masa olur. Ekranda bembeyaz zemin üstünde kalın siyah çizgili yılbaşı resimleri durur;
 * çocuk kâğıdını ekranın üstüne koyar ve alttan görünen çizgilerin üstünden geçerek resmi kâğıda çizer.
 *
 *   Resimler    yılbaşı ağacı, kardan adam, hediye, yıldız, çan, kar tanesi, çorap, kurabiye adam, Noel Baba, mum,
 *               süs topu, baston şeker; yazılar: YENİ YIL, MUTLU YILLAR, gelen yıl (2027 …).
 *   Kilit       kâğıt ya da el ekrana değince bir şey olmasın diye bütün dokunuşlar kapanır; kilide 2 saniye basılı tutunca açılır.
 *   Ekran       açık kaldıkça kararmaz (Wake Lock, destekleyen tarayıcılarda); tam ekran olur (destekliyorsa).
 *   Boyut       ➖ ➕ ya da iki parmakla büyütüp küçültme, tek parmakla kaydırma (kâğıdın boyuna göre).
 *   Çizgi       kalın / ince, düz / noktalı (noktalı: noktaları birleştirme gibi).
 *   Yıldız      "Yıldız çizmeyi öğren": beş noktayı parmakla sırayla birleştirir (3 seviye, önce gösterim), sonra kâğıtta dener.
 *
 * Okuma bilmeyen çocuk için: resim adları, düğmeler ve uyarılar sesli söylenir.
 * Çizimler 400 × 500 birimlik düzlemde, yalnızca çizgi (dolgu yok); kalınlık ekrandaki piksel cinsindendir.
 */
window.YeniYil = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);
  const KILIT_ACMA_MS = 2000;

  const yil = () => { const s = new Date(); return s.getMonth() >= 9 ? s.getFullYear() + 1 : s.getFullYear(); };

  const daire = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  const yildizYolu = (x, y, R, r, uc = 5, don = -90) => {
    const n = [];
    for (let i = 0; i < uc * 2; i += 1) {
      const a = ((don + (i * 180) / uc) * Math.PI) / 180;
      const rr = i % 2 ? r : R;
      n.push(`${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`);
    }
    return `M${n.join(' L')}Z`;
  };

  /* Yıldız çizmeyi öğren: tek çizgiyle beş köşeli yıldız. Köşeler: T tepe, US üst sağ, AS alt sağ, AL alt sol, UL üst sol.
     Sıra: tepe → alt sol → üst sağ → üst sol → alt sağ → tepe (5 çizgi). */
  const YM = { x: 200, y: 222, R: 168 };
  const kose = (aci) => [YM.x + YM.R * Math.cos((aci * Math.PI) / 180), YM.y + YM.R * Math.sin((aci * Math.PI) / 180)];
  const NOKTALAR = [kose(-90), kose(126), kose(-18), kose(198), kose(54)]; // 1..5 çizim sırasıyla
  const ADIMLAR = [
    'Bir numaralı noktadan, tepeden başla. Kaydırak gibi aşağı sola in, iki numaraya.',
    'Şimdi yukarı sağa çık, üç numaraya.',
    'Dümdüz sola git, dört numaraya.',
    'Aşağı sağa in, beş numaraya.',
    'Ve tepeye, bir numaraya geri dön!',
  ];
  const noktaliYildiz = () => {
    const yol = [...NOKTALAR, NOKTALAR[0]].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
    return `<path d="M${yol}" class="yy-silik"/>`
      + NOKTALAR.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="9" class="yy-nokta"/><text x="${x + (i === 0 ? 0 : x < 200 ? -30 : 30)}" y="${y + (i === 0 ? -26 : 34)}" class="yy-sayi" text-anchor="middle">${i + 1}</text>`).join('');
  };

  const RESIMLER = [
    {
      ad: 'Yılbaşı ağacı', kod: 'agac',
      ciz: () => `
        <path d="${yildizYolu(200, 46, 34, 14)}"/>
        <path d="M200 84 L124 176 L162 176 L92 274 L140 274 L60 384 L340 384 L260 274 L308 274 L238 176 L276 176 Z"/>
        <path d="M150 214 Q200 238 252 214 M110 322 Q200 356 292 322"/>
        ${daire(176, 150, 10)}${daire(232, 196, 10)}${daire(140, 250, 11)}${daire(262, 260, 11)}${daire(200, 296, 11)}${daire(118, 360, 11)}${daire(290, 360, 11)}
        <rect x="176" y="384" width="48" height="44"/>
        <path d="M136 428 L264 428 L248 484 L152 484 Z"/>`,
    },
    {
      ad: 'Kardan adam', kod: 'kardan',
      ciz: () => `
        <path d="M156 58 L156 14 L244 14 L244 58 M130 58 L270 58"/>
        ${daire(200, 104, 48)}
        ${daire(182, 92, 6)}${daire(218, 92, 6)}
        <path d="M200 102 L238 112 L200 116 Z"/>
        <path d="M178 126 Q200 140 222 126"/>
        <path d="M150 150 Q200 172 250 150 L254 168 Q200 190 146 168 Z M226 170 L236 216 L252 212 L242 166"/>
        ${daire(200, 230, 66)}
        ${daire(200, 214, 6)}${daire(200, 244, 6)}
        <path d="M138 212 L74 172 M98 186 L84 160 M262 212 L326 172 M302 186 L316 160"/>
        ${daire(200, 388, 92)}
        ${daire(200, 360, 7)}${daire(200, 400, 7)}`,
    },
    {
      ad: 'Hediye kutusu', kod: 'hediye',
      ciz: () => `
        <rect x="70" y="170" width="260" height="56" rx="6"/>
        <rect x="88" y="226" width="224" height="236" rx="6"/>
        <path d="M182 170 L182 462 M218 170 L218 462"/>
        <path d="M200 168 C150 96 92 112 112 150 C126 176 176 172 200 168 Z"/>
        <path d="M200 168 C250 96 308 112 288 150 C274 176 224 172 200 168 Z"/>
        <path d="M120 300 l12 -12 l12 12 l-12 12 Z M250 380 l12 -12 l12 12 l-12 12 Z"/>`,
    },
    { ad: 'Yıldız adımları', kod: 'yildiz-adim', ciz: noktaliYildiz },
    {
      ad: 'Yıldız', kod: 'yildiz',
      ciz: () => `
        <path d="${yildizYolu(200, 260, 190, 80)}"/>
        ${daire(170, 244, 8)}${daire(230, 244, 8)}
        <path d="M172 284 Q200 306 228 284"/>
        <path d="M40 60 l6 -16 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 Z M340 440 l6 -16 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 Z"/>`,
    },
    {
      ad: 'Çan', kod: 'can',
      ciz: () => `
        ${daire(200, 66, 16)}
        <path d="M200 82 C138 82 118 146 118 226 L108 330 Q98 356 74 366 L326 366 Q302 356 292 330 L282 226 C282 146 262 82 200 82 Z"/>
        <path d="M110 330 L290 330"/>
        ${daire(200, 392, 24)}
        <path d="M184 56 C150 20 110 40 132 66 C146 82 176 70 184 60 M216 56 C250 20 290 40 268 66 C254 82 224 70 216 60"/>
        <path d="M150 170 Q200 150 250 170"/>`,
    },
    {
      ad: 'Kar tanesi', kod: 'kar',
      ciz: () => [0, 60, 120, 180, 240, 300].map((a) => `<g transform="rotate(${a} 200 250)">
          <path d="M200 250 L200 80 M200 130 L170 100 M200 130 L230 100 M200 180 L176 156 M200 180 L224 156 M200 96 L186 82 M200 96 L214 82"/></g>`).join('')
        + daire(200, 250, 26),
    },
    {
      ad: 'Çorap', kod: 'corap',
      ciz: () => `
        <rect x="118" y="40" width="168" height="60" rx="14"/>
        <path d="M134 100 L134 292 C134 330 112 352 86 374 C40 414 70 476 130 462 C176 452 216 418 256 382 C284 356 270 320 270 290 L270 100"/>
        <path d="M90 380 C112 400 116 440 104 462 M232 348 C238 372 250 386 262 390"/>
        <path d="M150 150 L254 150 M150 200 L254 200"/>
        ${daire(286, 56, 10)}`,
    },
    {
      ad: 'Kurabiye adam', kod: 'kurabiye',
      ciz: () => `
        ${daire(200, 96, 58)}
        <path d="M154 150 L92 182 Q68 196 86 222 Q98 236 120 228 L150 214 L144 320 L110 412 Q100 446 132 450 Q150 452 160 432 L192 366 L208 366 L240 432 Q250 452 268 450 Q300 446 290 412 L256 320 L250 214 L280 228 Q302 236 314 222 Q332 196 308 182 L246 150"/>
        ${daire(180, 86, 7)}${daire(220, 86, 7)}
        <path d="M176 116 Q200 134 224 116"/>
        ${daire(200, 208, 9)}${daire(200, 246, 9)}${daire(200, 284, 9)}
        <path d="M96 196 l8 10 l8 -10 l8 10 M280 196 l8 10 l8 -10 l8 10 M118 414 l10 8 l10 -8 l10 8 M252 414 l10 8 l10 -8 l10 8"/>`,
    },
    {
      ad: 'Noel Baba', kod: 'noel',
      ciz: () => `
        <path d="M100 196 C110 90 210 36 320 70 L298 116 C250 100 200 120 192 190"/>
        ${daire(330, 72, 22)}
        <path d="M92 196 Q200 168 308 196 Q316 214 308 232 Q200 206 92 232 Q84 214 92 196 Z"/>
        <path d="M108 232 L108 290 M292 232 L292 290"/>
        ${daire(168, 264, 8)}${daire(232, 264, 8)}
        ${daire(200, 292, 14)}
        <path d="M200 304 C180 296 152 300 140 318 C162 326 186 320 200 310 C214 320 238 326 260 318 C248 300 220 296 200 304 Z"/>
        <path d="M108 290 C96 360 130 440 200 470 C270 440 304 360 292 290 C276 320 250 336 230 330 M108 290 C124 320 150 336 170 330"/>
        <path d="M150 370 q10 14 20 0 M230 370 q10 14 20 0 M190 410 q10 14 20 0"/>`,
    },
    {
      ad: 'Mum', kod: 'mum',
      ciz: () => `
        <path d="M200 50 C168 96 172 136 200 150 C228 136 232 96 200 50 Z M200 96 C190 112 192 130 200 136 C208 130 210 112 200 96 Z"/>
        <path d="M200 150 L200 176"/>
        <rect x="150" y="176" width="100" height="232" rx="10"/>
        <path d="M150 210 Q160 234 172 210 Q178 250 190 214"/>
        <path d="M150 408 C110 420 90 440 112 456 L288 456 C310 440 290 420 250 408"/>
        <path d="M100 446 C70 420 50 444 64 466 C80 486 110 470 100 446 Z M300 446 C330 420 350 444 336 466 C320 486 290 470 300 446 Z"/>
        ${daire(84, 448, 7)}${daire(316, 448, 7)}`,
    },
    {
      ad: 'Süs topu', kod: 'sus',
      ciz: () => `
        <path d="M200 30 C176 30 176 60 200 60 C224 60 224 30 200 30"/>
        <rect x="176" y="60" width="48" height="34" rx="6"/>
        ${daire(200, 270, 170)}
        <path d="M44 210 L92 180 L140 214 L188 182 L236 214 L284 182 L332 214 L356 198"/>
        <path d="M44 330 L92 360 L140 326 L188 358 L236 326 L284 358 L332 326 L356 342"/>
        <path d="${yildizYolu(200, 270, 34, 14)}"/>
        ${daire(110, 270, 12)}${daire(290, 270, 12)}`,
    },
    {
      ad: 'Baston şeker', kod: 'baston',
      ciz: () => `
        <path d="M150 480 L150 160 C150 60 290 60 290 160 L290 200 L240 200 L240 160 C240 120 200 120 200 160 L200 480 Z"/>
        <path d="M150 440 L200 410 M150 380 L200 350 M150 320 L200 290 M150 260 L200 230 M150 200 L200 170 M160 120 L204 140 M214 84 L230 126 M268 92 L246 132 M290 160 L240 170"/>
        <path d="M190 470 C210 480 230 470 236 456"/>`,
    },
  ];

  const yazilar = () => [
    { ad: 'Yeni yıl', kod: 'yazi-yeniyil', yazi: ['YENİ', 'YIL'] },
    { ad: 'Mutlu yıllar', kod: 'yazi-mutlu', yazi: ['MUTLU', 'YILLAR'] },
    { ad: String(yil()), kod: 'yazi-yil', yazi: [String(yil())] },
  ];

  const ayar = { kalin: true, noktali: false, olcek: 1, x: 0, y: 0 };
  const OLCEK_MIN = 0.35;
  const OLCEK_MAX = 2.5;
  let liste = [];
  let sira = 0;
  let uyanik = null;
  let kilitli = false;

  /* ---------- çizim ---------- */
  function svgYap(sayfa, kucukResim = false) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 400 500');
    s.setAttribute('class', `yy-cizim${kucukResim ? ' kucuk' : ''}`);
    if (sayfa.yazi) {
      const satir = sayfa.yazi.length;
      const boy = satir === 1 ? 150 : 120;
      s.innerHTML = sayfa.yazi.map((t, i) => {
        const y = 250 + (i - (satir - 1) / 2) * (boy * 1.15);
        const genis = Math.min(boy, 380 / (t.length * 0.72));
        return `<text x="200" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${genis}" font-weight="900" font-family="Nunito, 'Arial Rounded MT Bold', sans-serif" letter-spacing="4">${t}</text>`;
      }).join('');
    } else s.innerHTML = sayfa.ciz();
    return s;
  }

  /* ---------- galeri ---------- */
  function kart(sira0) {
    const k = H().el('button', { className: 'kart kart-mod kart-yeniyil', type: 'button' }, [
      H().el('span', { className: 'kart-resim' }, [H().el('span', { className: 'kart-yuz yuz-emoji', textContent: '🎄' })]),
      H().el('span', { className: 'kart-ad' }, H().renkliAd('YENİ YIL')),
      H().el('span', { className: 'kart-rol', textContent: 'Kâğıda çiz' }),
    ]);
    k.style.setProperty('--gecikme', `${sira0 * 60}ms`);
    k.addEventListener('click', ac);
    return k;
  }

  function ac() {
    window.Efekt.ac();
    liste = [...RESIMLER, ...yazilar()];
    H().ekranAc('yeniyil');
    const sahne = $('#yeniyil-sahne');
    sahne.replaceChildren(
      H().el('p', { className: 'yy-ipucu', textContent: '☀️ Ekran parlaklığını sonuna kadar aç. Bir resim seç, kâğıdını ekranın üstüne koy, çizgilerin üstünden geç.' }),
      H().el('div', { className: 'yy-galeri' }, [ogrenKarti(), ...liste.map((sayfa, i) => {
        const b = H().el('button', { className: 'yy-kucuk', type: 'button', ariaLabel: sayfa.ad }, [svgYap(sayfa, true), H().el('span', { className: 'yy-ad', textContent: sayfa.ad })]);
        b.addEventListener('click', () => goster(i));
        return b;
      })]),
    );
    $('#yeniyil-tekrar').onclick = () => { window.Konus.sustur(); window.Konus.soyle('Yeni yıl geliyor! Bir resim seç, kâğıdını ekrana koy ve çizgilerin üstünden geç.'); };
    window.Konus.sustur();
    window.Konus.soyle('Yeni yıl geliyor! Bir resim seç, kâğıdını ekrana koy ve çizgilerin üstünden geç. Büyüklerin ekranın ışığını sonuna kadar açsın.');
  }

  /* ---------- yıldız çizmeyi öğren (parmakla) ----------
     Seviye 1: silik yol + numaralar + önce gösterim; 2: yalnızca numaralı noktalar; 3: numarasız noktalar.
     Çocuk sıradaki noktadan başlayıp parmağını hedef noktaya kaydırır; doğruysa çizgi kalır, ses bir sonraki adımı söyler. */
  const YAKIN = 46; // nokta yakalama yarıçapı (çizim birimi)
  const ogr = { seviye: 1, adim: 0, kilit: false };

  function ogrenKarti() {
    const s0 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s0.setAttribute('viewBox', '0 0 400 420');
    s0.setAttribute('class', 'yy-cizim kucuk');
    s0.innerHTML = noktaliYildiz();
    const b = H().el('button', { className: 'yy-kucuk yy-ogren-kart', type: 'button', ariaLabel: 'Yıldız çizmeyi öğren' }, [
      s0, H().el('span', { className: 'yy-ad', textContent: '⭐ Yıldız çizmeyi öğren' })]);
    b.addEventListener('click', () => ogrenAc(1));
    return b;
  }

  function ogrenAc(seviye) {
    ogr.seviye = seviye; ogr.adim = 0; ogr.kilit = false;
    let kap = $('#yy-ogren');
    if (!kap) {
      kap = H().el('div', { id: 'yy-ogren', className: 'yy-ogren' });
      document.body.append(kap);
    }
    kap.hidden = false;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 420');
    svg.setAttribute('class', 'yy-ogren-alan');
    const yol = [...NOKTALAR, NOKTALAR[0]].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
    svg.innerHTML = `<path class="yy-dolgu" d="M${yol}Z"/>
      ${ogr.seviye === 1 ? `<path class="yy-hayalet" d="M${yol}"/>` : ''}
      <g class="yy-cizgiler"></g><line class="yy-canli" x1="0" y1="0" x2="0" y2="0"/>
      ${NOKTALAR.map(([x, y], i) => `<g class="yy-hedef" data-i="${i}"><circle cx="${x}" cy="${y}" r="22"/>
        ${ogr.seviye < 3 ? `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${i + 1}</text>` : ''}</g>`).join('')}
      <g class="yy-kalem" opacity="0"><circle r="12"/></g>`;
    const cubuk = H().el('div', { className: 'yy-cubuk' }, [
      H().el('button', { type: 'button', textContent: '✕', onclick: () => { kap.hidden = true; window.Konus.sustur(); } }),
      H().el('button', { type: 'button', textContent: '👀 Göster', onclick: () => goster5(svg) }),
      ...[1, 2, 3].map((n) => H().el('button', { type: 'button', className: n === ogr.seviye ? 'secili' : '', textContent: '⭐'.repeat(n), onclick: () => ogrenAc(n) })),
      H().el('button', { type: 'button', textContent: '📄 Kâğıtta dene', onclick: () => { kap.hidden = true; goster(liste.findIndex((p) => p.kod === 'yildiz-adim')); } }),
    ]);
    kap.replaceChildren(H().el('div', { className: 'yy-kagit' }, [svg]), cubuk);
    isaretle(svg);
    parmakKur(svg);
    window.Konus.sustur();
    if (ogr.seviye === 1) {
      window.Konus.soyle('Yıldız çizmeyi öğrenelim! Önce ben göstereyim, sonra sen çiz.').then(() => goster5(svg));
    } else {
      window.Konus.soyle(ogr.seviye === 2 ? 'Şimdi sen çiz! Noktaları sırayla birleştir.' : 'Şimdi numaralar yok! Tepeden başla.').then(() => window.Konus.soyle(ADIMLAR[0]));
    }
  }

  /** Sıradaki başlangıç ve hedef noktayı parlatır. */
  function isaretle(svg) {
    svg.querySelectorAll('.yy-hedef').forEach((g) => {
      const i = Number(g.dataset.i);
      g.classList.toggle('yy-bas', i === ogr.adim % 5 && ogr.adim < 5);
      g.classList.toggle('yy-hedefte', i === (ogr.adim + 1) % 5 && ogr.adim < 5);
      g.classList.toggle('yy-gecildi', i <= ogr.adim && ogr.adim > 0);
    });
  }

  const svgNokta = (svg, e) => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    return [q.x, q.y];
  };
  const uzak = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function parmakKur(svg) {
    const canli = svg.querySelector('.yy-canli');
    let ciziyor = false;
    svg.addEventListener('pointerdown', (e) => {
      if (ogr.kilit || ogr.adim >= 5) return;
      const n = svgNokta(svg, e);
      if (uzak(n, NOKTALAR[ogr.adim]) > YAKIN) {
        window.Konus.sustur();
        window.Konus.soyle(ogr.seviye < 3 ? `${ogr.adim + 1} numaralı noktadan başla. Parlayan noktadan.` : 'Parlayan noktadan başla.');
        return;
      }
      ciziyor = true;
      svg.setPointerCapture(e.pointerId);
      const [x, y] = NOKTALAR[ogr.adim];
      canli.setAttribute('x1', x); canli.setAttribute('y1', y); canli.setAttribute('x2', x); canli.setAttribute('y2', y);
      canli.classList.add('gorunur');
    });
    svg.addEventListener('pointermove', (e) => {
      if (!ciziyor) return;
      const [x, y] = svgNokta(svg, e);
      canli.setAttribute('x2', x); canli.setAttribute('y2', y);
    });
    const birak = async (e) => {
      if (!ciziyor) return;
      ciziyor = false;
      canli.classList.remove('gorunur');
      const hedef = NOKTALAR[(ogr.adim + 1) % 5];
      if (uzak(svgNokta(svg, e), hedef) > YAKIN) {
        window.Efekt.yanlis();
        window.Konus.sustur();
        window.Konus.soyle(`Neredeyse! ${ADIMLAR[ogr.adim]}`);
        return;
      }
      await cizgiEkle(svg, ogr.adim);
    };
    svg.addEventListener('pointerup', birak);
    svg.addEventListener('pointercancel', () => { ciziyor = false; canli.classList.remove('gorunur'); });
  }

  async function cizgiEkle(svg, i) {
    const [a, b] = [NOKTALAR[i], NOKTALAR[(i + 1) % 5]];
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]);
    svg.querySelector('.yy-cizgiler').append(l);
    ogr.adim = i + 1;
    isaretle(svg);
    window.Efekt.karakter('cin');
    window.Konus.sustur();
    if (ogr.adim < 5) { window.Konus.soyle(`Aferin! ${ADIMLAR[ogr.adim]}`); return; }
    svg.classList.add('tamam');
    window.Gorsel.konfeti();
    window.Efekt.tac();
    await window.Konus.soyle(ogr.seviye < 3 ? 'Yıldız oldu! Harika çizdin! Şimdi daha zor bir yıldız deneyelim mi? Üstte üç yıldızlı düğme var.' : 'Kendi başına yıldız çizdin! Şimdi kâğıtta dene!');
  }

  /** Gösterim: kalem beş çizgiyi sırayla çizer, her adım sesli anlatılır; sonra sıra çocukta. */
  async function goster5(svg) {
    if (ogr.kilit) return;
    ogr.kilit = true;
    const kalem = svg.querySelector('.yy-kalem');
    const cizgiler = svg.querySelector('.yy-cizgiler');
    cizgiler.replaceChildren();
    svg.classList.remove('tamam');
    ogr.adim = 0; isaretle(svg);
    kalem.setAttribute('opacity', '1');
    for (let i = 0; i < 5 && !$('#yy-ogren').hidden; i += 1) {
      const [a, b] = [NOKTALAR[i], NOKTALAR[(i + 1) % 5]];
      window.Konus.sustur();
      const konusma = window.Konus.soyle(ADIMLAR[i]);
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('class', 'gosterim');
      l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', a[0]); l.setAttribute('y2', a[1]);
      cizgiler.append(l);
      const sure = 1400;
      const t0 = performance.now();
      await new Promise((bitti) => {
        const kare = (t) => {
          const k = Math.min(1, (t - t0) / sure);
          const x = a[0] + (b[0] - a[0]) * k; const y = a[1] + (b[1] - a[1]) * k;
          l.setAttribute('x2', x); l.setAttribute('y2', y);
          kalem.setAttribute('transform', `translate(${x} ${y})`);
          if (k < 1) requestAnimationFrame(kare); else bitti();
        };
        requestAnimationFrame(kare);
      });
      await konusma;
    }
    kalem.setAttribute('opacity', '0');
    await H().bekle(400);
    cizgiler.replaceChildren();
    ogr.adim = 0; ogr.kilit = false; isaretle(svg);
    window.Konus.sustur();
    await window.Konus.soyle('Şimdi sıra sende! Parmağınla parlayan noktadan başla.');
    window.Konus.soyle(ADIMLAR[0]);
  }

  /* ---------- kopyalama ekranı ---------- */
  async function ekranUyanik(ac0) {
    try {
      if (ac0 && 'wakeLock' in navigator && !uyanik) {
        uyanik = await navigator.wakeLock.request('screen');
        uyanik.addEventListener('release', () => { uyanik = null; });
      } else if (!ac0 && uyanik) { await uyanik.release(); uyanik = null; }
    } catch { uyanik = null; }
  }

  function cizimGuncelle() {
    const kap = $('#yy-tam');
    kap.classList.toggle('ince', !ayar.kalin);
    kap.classList.toggle('noktali', ayar.noktali);
    $('#yy-kalin').textContent = ayar.kalin ? '✏️ İnce çizgi' : '🖍️ Kalın çizgi';
    $('#yy-noktali').textContent = ayar.noktali ? '➖ Düz çizgi' : '⋯ Noktalı';
  }

  /* Büyütme/küçültme: ➖ ➕ düğmeleri, iki parmakla sıkıştırıp açma, tek parmakla kaydırma (kilitliyken kapalı).
     Çizgi kalınlığı değişmez (non-scaling-stroke); ölçek resimden resme geçerken korunur, konum sıfırlanır. */
  function yerlestirCizim() {
    const c = $('#yy-tam .yy-kagit .yy-cizim');
    if (!c) return;
    c.style.transform = `translate(${ayar.x}px, ${ayar.y}px) scale(${ayar.olcek})`;
    c.style.setProperty('--olcek', ayar.olcek); // çizgi kalınlığı ölçekten bağımsız kalsın
  }
  function olcekle(o) {
    ayar.olcek = Math.min(OLCEK_MAX, Math.max(OLCEK_MIN, o));
    if (ayar.olcek <= 1) { ayar.x = 0; ayar.y = 0; }
    yerlestirCizim();
  }
  function parmakla(alan) {
    const parmaklar = new Map();
    let bas = null;
    const durum0 = () => {
      const p = [...parmaklar.values()];
      return { p, olcek: ayar.olcek, x: ayar.x, y: ayar.y, mesafe: p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0 };
    };
    alan.addEventListener('pointerdown', (e) => {
      if (kilitli) return;
      alan.setPointerCapture(e.pointerId);
      parmaklar.set(e.pointerId, { x: e.clientX, y: e.clientY });
      bas = durum0();
    });
    alan.addEventListener('pointermove', (e) => {
      if (kilitli || !parmaklar.has(e.pointerId)) return;
      parmaklar.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const p = [...parmaklar.values()];
      if (p.length > 1 && bas.mesafe) {
        olcekle(bas.olcek * (Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / bas.mesafe));
      } else if (p.length === 1 && bas.p.length === 1) {
        ayar.x = bas.x + (p[0].x - bas.p[0].x);
        ayar.y = bas.y + (p[0].y - bas.p[0].y);
        yerlestirCizim();
      }
    });
    const birak = (e) => { parmaklar.delete(e.pointerId); bas = durum0(); };
    ['pointerup', 'pointercancel'].forEach((t) => alan.addEventListener(t, birak));
  }

  function goster(i) {
    sira = (i + liste.length) % liste.length;
    const sayfa = liste[sira];
    let kap = $('#yy-tam');
    if (!kap) {
      kap = H().el('div', { id: 'yy-tam', className: 'yy-tam' }, [
        H().el('div', { className: 'yy-kagit' }),
        H().el('div', { className: 'yy-cubuk' }, [
          H().el('button', { id: 'yy-kapat', type: 'button', textContent: '✕' }),
          H().el('button', { id: 'yy-onceki', type: 'button', textContent: '◀' }),
          H().el('span', { id: 'yy-baslik' }),
          H().el('button', { id: 'yy-sonraki', type: 'button', textContent: '▶' }),
          H().el('button', { id: 'yy-kucult', type: 'button', textContent: '➖', ariaLabel: 'Küçült' }),
          H().el('button', { id: 'yy-buyut', type: 'button', textContent: '➕', ariaLabel: 'Büyüt' }),
          H().el('button', { id: 'yy-kalin', type: 'button' }),
          H().el('button', { id: 'yy-noktali', type: 'button' }),
          H().el('button', { id: 'yy-kilitle', type: 'button', textContent: '🔒 Kilitle' }),
        ]),
        H().el('div', { id: 'yy-kilit', className: 'yy-kilit', hidden: true }, [
          H().el('button', { id: 'yy-kilit-ac', type: 'button', ariaLabel: 'Kilidi açmak için basılı tut' }, [H().el('span', { textContent: '🔒' }), H().el('i')]),
        ]),
      ]);
      document.body.append(kap);
      $('#yy-kapat').addEventListener('click', kapat);
      $('#yy-onceki').addEventListener('click', () => goster(sira - 1));
      $('#yy-sonraki').addEventListener('click', () => goster(sira + 1));
      const soyle = (t) => { window.Konus.sustur(); window.Konus.soyle(t); };
      $('#yy-kalin').addEventListener('click', () => { ayar.kalin = !ayar.kalin; cizimGuncelle(); soyle(ayar.kalin ? 'Kalın çizgi' : 'İnce çizgi'); });
      $('#yy-noktali').addEventListener('click', () => {
        ayar.noktali = !ayar.noktali; cizimGuncelle();
        soyle(ayar.noktali ? 'Noktalı çizgi. Noktaları birleştir.' : 'Düz çizgi');
      });
      $('#yy-kapat').addEventListener('pointerdown', () => soyle('Resimlere dön'));
      $('#yy-buyut').addEventListener('click', () => { olcekle(ayar.olcek * 1.25); soyle('Büyüttüm'); });
      $('#yy-kucult').addEventListener('click', () => { olcekle(ayar.olcek / 1.25); soyle('Küçülttüm'); });
      parmakla(kap.querySelector('.yy-kagit'));
      $('#yy-kilitle').addEventListener('click', kilitle);
      kilitAcmaKur();
    }
    kap.hidden = false;
    kap.querySelector('.yy-kagit').replaceChildren(svgYap(sayfa));
    ayar.x = 0; ayar.y = 0;
    yerlestirCizim();
    $('#yy-baslik').textContent = sayfa.ad;
    cizimGuncelle();
    ekranUyanik(true);
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    window.Konus.sustur();
    window.Konus.soyle(`${sayfa.ad}! Kâğıdını koy, kilitle ve çizgilerin üstünden geç.`);
  }

  function kilitle() {
    kilitli = true;
    $('#yy-tam').classList.add('kilitli');
    $('#yy-kilit').hidden = false;
    window.Konus.sustur();
    window.Konus.soyle('Kilitledim. Artık kâğıdını koyabilirsin. Açmak için kilide iki saniye basılı tut.');
  }

  /* Kilit: tam ekran örtü bütün dokunuşları yutar; yalnızca köşedeki kilide basılı tutmak açar. */
  function kilitAcmaKur() {
    const ortu = $('#yy-kilit');
    const dugme = $('#yy-kilit-ac');
    let zaman = null;
    ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'click', 'contextmenu', 'gesturestart'].forEach((t) => ortu.addEventListener(t, (e) => {
      if (!dugme.contains(e.target)) e.preventDefault();
      e.stopPropagation();
    }, { passive: false }));
    const basla = (e) => {
      e.preventDefault();
      dugme.classList.add('basili');
      clearTimeout(zaman);
      zaman = setTimeout(() => {
        dugme.classList.remove('basili');
        kilitli = false;
        ortu.hidden = true;
        $('#yy-tam').classList.remove('kilitli');
        window.Efekt.karakter('cin');
      }, KILIT_ACMA_MS);
    };
    const birak = () => { clearTimeout(zaman); dugme.classList.remove('basili'); };
    dugme.addEventListener('pointerdown', basla);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => dugme.addEventListener(t, birak));
  }

  function kapat() {
    if (kilitli) return;
    const kap = $('#yy-tam');
    if (kap) kap.hidden = true;
    ekranUyanik(false);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }

  /* ekran yeniden görünür olunca uyanık kilidi tazelenir (iPad başka uygulamaya geçince bırakır) */
  document.addEventListener('visibilitychange', () => {
    const kap = $('#yy-tam');
    if (document.visibilityState === 'visible' && kap && !kap.hidden) ekranUyanik(true);
  });

  function durdur() { kilitli = false; const kap = $('#yy-tam'); if (kap) { kap.hidden = true; kap.classList.remove('kilitli'); $('#yy-kilit').hidden = true; } ekranUyanik(false); }

  return Object.freeze({ kart, durdur });
})();
