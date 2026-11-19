/*
 * Kasaba: kendi karakteri evden çıkar, sokakta yürür, kuaföre girer.
 *   Karakter yarat — ten, saç, göz, elbise (cihazda saklanır, Depo 'kiz').
 *   Sokak          — apartman kapısı açılır, kız çıkar; dükkâna dokununca oraya yürür ve girer.
 *   Kapı şifresi   — kapı ancak adı harf harf yazılınca açılır: KUAFÖR, EV, ODA … (soluk harfler yol gösterir).
 *   Ev             — ev.js: koridorda ODA, MUTFAK, SALON, BANYO kapıları; odadaki eşyalar adı yazılınca çalışır.
 *   Kuaför         — 1) saç örme: ses hangi harfi söylüyorsa o tokalı tutam ortaya atılır; her atış sayılır.
 *                    2) tırnak: oje seç, beş tırnağı boya (bir, iki, … beş), üfle kurusun.
 *                    3) ayna: örgülü saç ve ojeli tırnaklarla sevinir.
 *   Restoran       — restoran.js: kaç kişisiniz, tabaklar, menü, dilimle, paylaştır.
 *   Hastane        — hastane.js: kalp atışını say, yara bantla, harfli şurup, reçetedeki kadar kaşık.
 *   Plaj           — plaj.js (şifre PLAJ): simidi pompala, harfli şamandıralara yüz, kabuk topla.
 * Sonraki yerler (okul, park, tenis) YERLER listesine eklenir.
 */
window.Kasaba = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);
  const ORGU_ADIMI = 6;
  const TIRNAK_SAYISI = 5;
  const SAYILAR = ['bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on'];
  const OJELER = ['#FF4F8B', '#B04BFF', '#FF8C1A', '#18B7A6', '#E0363A'];
  const YURUME_MS_MIN = 900;
  const YURUME_MS_YUZDE = 55; // dünya genişliğinin her %'si için
  const ADIM_SESI_MS = 2500; // ses.js 'adim' 10 adım × 0,25 sn

  let kiz = { ...window.Kiz.VARSAYILAN };
  let yuklendi = false;
  let oturum = 0; // ekran değişince eski beklemeler iptal olsun

  const canli = (no) => no === oturum;
  const konus = (metin) => window.Konus.soyle(metin);

  async function yukle() {
    if (yuklendi) return;
    try {
      const k = await window.Depo.oku('kiz');
      if (k && typeof k === 'object') kiz = { ...kiz, ...k, yaratildi: !!k.yaratildi };
    } catch {
      /* kayıt okunamazsa varsayılan kız; oyun yine çalışır */
    }
    yuklendi = true;
  }

  const kaydet = () => H().kaydet('kiz', kiz);

  /* ---------- ana sayfa kartı ---------- */
  function kart(gecikme) {
    const resim = H().el('span', { className: 'kart-yuz kart-kiz' }, [window.Kiz.on(kiz, { orgu: kiz.orgu, oje: kiz.oje, mutlu: true })]);
    const k = H().el('button', { className: 'kart kart-mod kart-kasaba', type: 'button' }, [
      H().el('span', { className: 'kart-resim' }, [resim]),
      H().el('span', { className: 'kart-ad' }, H().renkliAd('KASABA')),
      H().el('span', { className: 'kart-rol', textContent: 'Kuaföre git' }),
    ]);
    k.style.setProperty('--gecikme', `${gecikme * 60}ms`);
    k.addEventListener('click', ac);
    yukle().then(() => resim.replaceChildren(window.Kiz.on(kiz, { orgu: kiz.orgu, oje: kiz.oje, mutlu: true })));
    return k;
  }

  async function ac() {
    window.Efekt.ac();
    await yukle();
    if (kiz.yaratildi) sokak('ev');
    else yaratAc();
  }

  /* ---------- karakter yarat ---------- */
  /* Her satır kilitli: kelimesi (TEN, SAÇ, GÖZ, ELBİSE) yazılınca renkler açılır. Dolap her açılışta yeniden kilitlenir. */
  const SATIRLAR = [['ten', '🙂', 'TEN'], ['sac', '💇‍♀️', 'SAÇ'], ['goz', '👀', 'GÖZ'], ['elbise', '👗', 'ELBİSE']];

  /** donus: 'oda' ise dolaptan açıldı, bitince odaya dönülür; yoksa sokağa çıkılır. */
  function yaratAc(donus) {
    const no = ++oturum;
    H().ekranAc('kiz-yarat');
    const onizle = $('#kiz-onizle');
    const ciz = () => onizle.replaceChildren(window.Kiz.on(kiz, { mutlu: true, orgu: kiz.orgu, oje: kiz.oje }));
    ciz();
    const renkler = (ad) => window.Kiz.SECENEK[ad].map((renk, i) => {
      const b = H().el('button', { className: `renk-dugme${kiz[ad] === i ? ' secili' : ''}`, type: 'button', ariaLabel: `${ad} ${i + 1}` });
      b.style.setProperty('--renk', renk);
      b.addEventListener('click', () => {
        kiz = { ...kiz, [ad]: i };
        b.parentElement.querySelectorAll('.renk-dugme').forEach((d) => d.classList.toggle('secili', d === b));
        window.Efekt.tik();
        ciz();
        onizle.classList.remove('sevin'); void onizle.offsetWidth; onizle.classList.add('sevin');
      });
      return b;
    });
    const satir = ([ad, simge, kelime]) => {
      const kap = H().el('div', { className: 'secenek-satir kilitli' });
      const kilit = H().el('button', { className: 'satir-kilit', type: 'button' }, [
        H().el('span', { textContent: '🔒' }), H().el('span', { className: 'satir-kelime' }, H().renkliAd(kelime)),
      ]);
      kilit.addEventListener('click', async () => {
        if (!canli(no)) return;
        if (await sifre(kelime, no, `${kelime.toLocaleLowerCase('tr')} yaz, renkler açılsın!`) && canli(no)) {
          kap.classList.remove('kilitli');
          kap.replaceChildren(H().el('span', { className: 'secenek-simge', textContent: simge }), ...renkler(ad));
          konus(`Hangi ${kelime.toLocaleLowerCase('tr')}?`);
        }
      });
      kap.append(H().el('span', { className: 'secenek-simge', textContent: simge }), kilit);
      return kap;
    };
    $('#kiz-secenek').replaceChildren(...SATIRLAR.map(satir));
    $('#kiz-hazir').onclick = () => {
      kiz = { ...kiz, yaratildi: true };
      kaydet();
      window.Efekt.tac();
      if (donus === 'oda') evIci('oda');
      else sokak('ev');
    };
    if (canli(no)) konus(kiz.yaratildi ? 'Dolabın açık. Neyi değiştirmek istersin? Kilide dokun.' : 'Merhaba! Haydi kendini yarat. Bir kilide dokun, kelimeyi yaz.');
  }

  /* ---------- sokak ---------- */
  function apartmanSvg() {
    let pencere = '';
    for (let kat = 0; kat < 4; kat += 1) {
      for (let s = 0; s < 3; s += 1) {
        const x = 30 + s * 66;
        const y = 40 + kat * 62;
        const isik = (kat + s) % 3 === 0 ? '#FFE9A8' : '#BFE6FF';
        pencere += `<rect x="${x}" y="${y}" width="48" height="42" rx="6" fill="${isik}" stroke="#7A5A50" stroke-width="4"/>
          <path d="M${x + 24} ${y} V${y + 42} M${x} ${y + 21} H${x + 48}" stroke="#7A5A50" stroke-width="3"/>
          <rect x="${x - 4}" y="${y + 40}" width="56" height="8" rx="3" fill="#E9C9B5"/>`;
      }
    }
    return `<svg class="bina apartman" viewBox="0 0 240 380" aria-hidden="true">
      <rect x="10" y="20" width="220" height="360" rx="10" fill="#F6B8A0" stroke="#7A5A50" stroke-width="5"/>
      <rect x="0" y="8" width="240" height="22" rx="8" fill="#C9705A"/>
      ${pencere}
      <rect x="86" y="292" width="68" height="88" rx="8" fill="#5A3A30"/>
      <g class="kapi-kanat"><rect x="90" y="296" width="60" height="84" rx="6" fill="#A0603C" stroke="#5A3A30" stroke-width="3"/>
        <circle cx="140" cy="340" r="5" fill="#FFD166"/><rect x="100" y="306" width="40" height="26" rx="4" fill="#C98458"/></g>
      <rect x="76" y="280" width="88" height="14" rx="6" fill="#C9705A"/>
    </svg>`;
  }

  function kuaforSvg() {
    let tente = '';
    for (let i = 0; i < 8; i += 1) tente += `<path d="M${10 + i * 28} 120 h28 v26 q-14 14 -28 0Z" fill="${i % 2 ? '#fff' : '#FF6F9F'}"/>`;
    return `<svg class="bina kuafor-bina" viewBox="0 0 240 380" aria-hidden="true">
      <rect x="10" y="60" width="220" height="320" rx="10" fill="#FFF0F6" stroke="#7A5A50" stroke-width="5"/>
      <rect x="22" y="70" width="196" height="46" rx="10" fill="#fff" stroke="#FF6F9F" stroke-width="4"/>
      ${tente}
      <rect x="22" y="176" width="120" height="130" rx="8" fill="#CFEFFF" stroke="#7A5A50" stroke-width="4"/>
      <ellipse cx="82" cy="226" rx="30" ry="36" fill="#fff" stroke="#E0A9C0" stroke-width="5"/>
      <rect x="60" y="262" width="44" height="34" rx="8" fill="#FF6F9F"/>
      <text x="45" y="210" font-size="26">✂️</text>
      <rect x="158" y="236" width="62" height="144" rx="8" fill="#5A3A30"/>
      <g class="kapi-kanat"><rect x="162" y="240" width="54" height="140" rx="6" fill="#FF8FB5" stroke="#5A3A30" stroke-width="3"/>
        <rect x="170" y="252" width="38" height="56" rx="5" fill="#CFEFFF"/><circle cx="208" cy="320" r="5" fill="#FFD166"/></g>
      <g class="zil"><path d="M189 220 q-10 0 -10 12 h20 q0 -12 -10 -12Z" fill="#FFD166" stroke="#B8860B" stroke-width="2"/></g>
    </svg>`;
  }

  function restoranSvg() {
    let tente = '';
    for (let i = 0; i < 8; i += 1) tente += `<path d="M${10 + i * 28} 130 h28 v24 q-14 14 -28 0Z" fill="${i % 2 ? '#fff' : '#E0363A'}"/>`;
    return `<svg class="bina restoran-bina" viewBox="0 0 240 380" aria-hidden="true">
      <rect x="170" y="10" width="26" height="60" fill="#B5674E" stroke="#7A5A50" stroke-width="4"/>
      <g class="duman"><circle cx="183" cy="0" r="10" fill="#fff" opacity=".8"/><circle cx="196" cy="-16" r="13" fill="#fff" opacity=".6"/></g>
      <rect x="10" y="60" width="220" height="320" rx="10" fill="#FFF6DC" stroke="#7A5A50" stroke-width="5"/>
      <rect x="22" y="72" width="196" height="50" rx="10" fill="#fff" stroke="#E0363A" stroke-width="4"/>
      ${tente}
      <rect x="20" y="176" width="64" height="88" rx="8" fill="#CFEFFF" stroke="#7A5A50" stroke-width="4"/>
      <rect x="156" y="176" width="64" height="88" rx="8" fill="#CFEFFF" stroke="#7A5A50" stroke-width="4"/>
      <ellipse cx="52" cy="244" rx="24" ry="7" fill="#E0363A"/><text x="40" y="236" font-size="22">🍕</text>
      <ellipse cx="188" cy="244" rx="24" ry="7" fill="#E0363A"/><text x="176" y="236" font-size="22">🍰</text>
      <rect x="90" y="236" width="60" height="144" rx="8" fill="#5A3A30"/>
      <g class="kapi-kanat"><rect x="94" y="240" width="52" height="140" rx="6" fill="#E9A23B" stroke="#5A3A30" stroke-width="3"/>
        <rect x="102" y="252" width="36" height="50" rx="5" fill="#CFEFFF"/><circle cx="138" cy="320" r="5" fill="#FFD166"/></g>
      <g class="zil"><path d="M120 216 q-10 0 -10 12 h20 q0 -12 -10 -12Z" fill="#FFD166" stroke="#B8860B" stroke-width="2"/></g>
    </svg>`;
  }

  function hastaneSvg() {
    let pencere = '';
    for (let kat = 0; kat < 3; kat += 1) {
      for (const x of [26, 168]) pencere += `<rect x="${x}" y="${120 + kat * 52}" width="46" height="36" rx="5" fill="#BFE6FF" stroke="#7A5A50" stroke-width="4"/>`;
    }
    return `<svg class="bina hastane-bina" viewBox="0 0 240 380" aria-hidden="true">
      <rect x="10" y="40" width="220" height="340" rx="10" fill="#F4F8FB" stroke="#7A5A50" stroke-width="5"/>
      <rect x="0" y="30" width="240" height="18" rx="8" fill="#8FB8DE"/>
      <rect x="22" y="56" width="196" height="46" rx="10" fill="#fff" stroke="#E0363A" stroke-width="4"/>
      <g class="hastane-arti"><rect x="98" y="114" width="44" height="100" rx="8" fill="#E0363A"/><rect x="70" y="142" width="100" height="44" rx="8" fill="#E0363A"/></g>
      ${pencere}
      <rect x="86" y="262" width="68" height="118" rx="8" fill="#5A3A30"/>
      <g class="kapi-kanat"><rect x="90" y="266" width="60" height="114" rx="6" fill="#8FB8DE" stroke="#5A3A30" stroke-width="3"/>
        <rect x="98" y="276" width="44" height="48" rx="5" fill="#E4F4FF"/><circle cx="140" cy="334" r="5" fill="#FFD166"/></g>
      <g class="zil"><path d="M120 236 q-10 0 -10 12 h20 q0 -12 -10 -12Z" fill="#FFD166" stroke="#B8860B" stroke-width="2"/></g>
    </svg>`;
  }

  /** Plaj girişi: palmiye, şemsiye, iki direkli kapı (tabela üstte), arkada deniz ve kum. */
  function plajSvg() {
    return `<svg class="bina plaj-giris" viewBox="0 0 240 380" aria-hidden="true">
      <path d="M0 300 Q60 288 120 298 T240 296 V380 H0Z" fill="#F3D9A4"/>
      <path d="M34 380 Q30 300 52 200" fill="none" stroke="#9C6B45" stroke-width="12" stroke-linecap="round"/>
      <g class="palmiye-yaprak" fill="#3DA35A"><path d="M52 200 Q20 180 2 200 Q26 186 52 206Z"/><path d="M52 200 Q84 176 104 194 Q78 186 52 206Z"/>
        <path d="M52 200 Q40 164 14 156 Q40 176 50 204Z"/><path d="M52 200 Q70 160 96 158 Q70 176 56 204Z"/></g>
      <circle cx="56" cy="210" r="6" fill="#7A5A50"/><circle cx="46" cy="212" r="6" fill="#7A5A50"/>
      <rect x="78" y="150" width="12" height="230" rx="5" fill="#C98B5A" stroke="#7A5A50" stroke-width="3"/>
      <rect x="150" y="150" width="12" height="230" rx="5" fill="#C98B5A" stroke="#7A5A50" stroke-width="3"/>
      <rect x="62" y="96" width="116" height="62" rx="12" fill="#FFF7E0" stroke="#7A5A50" stroke-width="4"/>
      <g class="kapi-kanat"><rect x="92" y="300" width="56" height="80" rx="4" fill="#F7E1B5" stroke="#9C6B45" stroke-width="3"/>
        <path d="M106 300 V380 M120 300 V380 M134 300 V380" stroke="#9C6B45" stroke-width="3"/></g>
      <g transform="translate(156 236)"><circle r="20" fill="none" stroke="#FF5D73" stroke-width="10"/>
        <path d="M14 -14 L8 -8 M-14 14 L-8 8 M14 14 L8 8 M-14 -14 L-8 -8" stroke="#fff" stroke-width="10"/></g>
      <line x1="208" y1="380" x2="208" y2="232" stroke="#7A5A50" stroke-width="5"/>
      <path d="M168 236 Q208 196 248 236Z" fill="#FF6F9F"/><path d="M188 236 Q208 204 228 236Z" fill="#fff"/>
    </svg>`;
  }

  /*
   * Sokaktaki yerler (soldan sağa); bitişik nizam: binalar arada boşluk bırakmadan yan yana dizilir.
   * kapi: kapının bina içindeki yeri (0 sol kenar … 1 sağ kenar); kızın durduğu yer ekranda ölçülür.
   * Yeni yer: buraya bir satır + açılış işlevi (yerAc).
   */
  const YERLER = [
    { ad: 'ev', sifre: 'EV', svg: apartmanSvg, kapi: 0.5 },
    { ad: 'kuafor', sifre: 'KUAFÖR', tabela: 'KUAFÖR', svg: kuaforSvg, kapi: 0.79 },
    { ad: 'restoran', sifre: 'RESTORAN', tabela: 'RESTORAN', svg: restoranSvg, kapi: 0.5 },
    { ad: 'hastane', sifre: 'HASTANE', tabela: 'HASTANE', svg: hastaneSvg, kapi: 0.5 },
    { ad: 'plaj', sifre: 'PLAJ', tabela: 'PLAJ', svg: plajSvg, kapi: 0.5 },
  ];
  const BINA_ORAN = 240 / 380; // bina svg en/boy
  const BINA_BOY = 0.66; // bina yüksekliği / sokak yüksekliği (kasaba.css .yapi)
  const SOKAK_BAS = 0.35; // ilk binadan önceki boşluk (bina genişliği cinsinden)
  const SOKAK_SON = 1.2; // son binadan sonra (deniz) boşluk
  const yerBul = (ad) => YERLER.find((y) => y.ad === ad) || YERLER[0];

  function yerAc(ad, no) {
    if (!canli(no)) return;
    if (ad === 'kuafor') kuaforAc();
    else if (ad === 'restoran') restoranAc();
    else if (ad === 'hastane') hastaneAc();
    else if (ad === 'plaj') plajAc();
    else evIci('koridor');
  }

  /** Sokak sahnesi. nereden: çıkılan yerin adı ('ev', 'kuafor', 'restoran'). */
  async function sokak(nereden) {
    const no = ++oturum;
    H().ekranAc('kasaba');
    const alan = $('#kasaba-sokak');
    const dunya = H().el('div', { className: 'dunya' });
    const binalar = new Map();
    YERLER.forEach((y) => {
      const bina = H().el('button', { className: `yapi yapi-${y.ad}`, type: 'button', ariaLabel: y.tabela || 'Ev' });
      bina.innerHTML = y.svg();
      if (y.tabela) {
        const tabela = H().el('span', { className: 'tabela' }, H().renkliAd(y.tabela));
        tabela.addEventListener('click', (e) => { e.stopPropagation(); window.Konus.sustur(); konus(y.tabela.toLocaleLowerCase('tr')); });
        bina.append(tabela);
      }
      binalar.set(y.ad, bina);
    });
    const kizKap = H().el('div', { className: 'sokak-kiz iceride' }, [window.Kiz.on(kiz, { orgu: kiz.orgu, oje: kiz.oje })]);
    dunya.append(
      H().el('div', { className: 'gunes-top' }), H().el('div', { className: 'bulut b1' }), H().el('div', { className: 'bulut b2' }), H().el('div', { className: 'bulut b3' }),
      H().el('div', { className: 'sokak-deniz' }),
      ...binalar.values(), kizKap, H().el('div', { className: 'kaldirim' }),
    );
    alan.replaceChildren(dunya);
    /* bitişik nizam: bina genişliği sokağın yüksekliğinden çıkar; dünya binaların toplamı kadar uzar */
    const genislik = dunya.offsetHeight * BINA_BOY * BINA_ORAN;
    const dunyaPx = genislik * (SOKAK_BAS + YERLER.length + SOKAK_SON);
    dunya.style.width = `${Math.max(dunyaPx, alan.clientWidth)}px`;
    const solYuzde = (i) => ((genislik * (SOKAK_BAS + i)) / dunya.offsetWidth) * 100;
    YERLER.forEach((y, i) => { binalar.get(y.ad).style.left = `${solYuzde(i)}%`; });
    dunya.querySelector('.sokak-deniz').style.left = `${solYuzde(YERLER.length - 1) + 1}%`;
    /* kapının dünyadaki yeri (%): bina ekranda ölçülür, böylece her ekran boyunda kız kapının önünde durur */
    const kapiYeri = (ad) => { const y = yerBul(ad); const b = binalar.get(y.ad); return ((b.offsetLeft + b.offsetWidth * y.kapi) / dunya.offsetWidth) * 100; };
    kizKap.style.left = `${kapiYeri(nereden)}%`;
    takipEt(alan, kizKap, 0);
    let mesgul = true;
    const gidis = async (hedef) => {
      if (mesgul || !canli(no)) return;
      mesgul = true;
      const yer = yerBul(hedef);
      await yuru(kizKap, kapiYeri(yer.ad), no, alan);
      if (!canli(no)) return;
      if (!(await sifre(yer.sifre, no))) { mesgul = false; return; }
      await iceriGir(binalar.get(hedef), kizKap, no);
      yerAc(hedef, no);
    };
    binalar.forEach((bina, ad) => bina.addEventListener('click', () => gidis(ad)));
    /* sokağın boş bir yerine (gökyüzü, kaldırım) dokununca kız oraya yürür */
    alan.addEventListener('click', (e) => {
      if (mesgul || !canli(no) || e.target.closest('.yapi')) return;
      const kutu = dunya.getBoundingClientRect();
      const ilk = kapiYeri(YERLER[0].ad);
      const son = kapiYeri(YERLER[YERLER.length - 1].ad);
      const hedef = Math.min(son, Math.max(ilk, ((e.clientX - kutu.left) / kutu.width) * 100));
      yuru(kizKap, hedef, no, alan);
    });

    await disariCik(binalar.get(yerBul(nereden).ad), kizKap, no);
    if (!canli(no)) return;
    mesgul = false;
    if (nereden === 'ev') konus('Günaydın! Bugün nereye gidelim? Yürümek için sokağa dokun, girmek için bir binaya dokun.');
    else konus('Şimdi nereye gidelim?');
  }

  /** Kamera kızı ortada tutsun (sure ms boyunca her karede). */
  function takipEt(alan, kizKap, sure) {
    const bitis = performance.now() + sure;
    const adim = () => {
      alan.scrollLeft = kizKap.offsetLeft - alan.clientWidth / 2;
      if (performance.now() < bitis) requestAnimationFrame(adim);
    };
    adim();
  }

  /* ---------- kapı şifresi: kelimeyi harf harf yaz, kapı açılsın ---------- */
  const SIFRE_SASIRTMA = 3;

  /** Kutunun altında harfin dönüştüğü karakter canlanır (K → kelebek); dokununca adı okunur. */
  function harfResmi(h) {
    const bilgi = window.HARF_BUL.get(h);
    const kap = H().el('button', { className: 'sifre-resim', type: 'button', ariaLabel: bilgi ? bilgi.kelime : h });
    const cizim = window.CIZIMLER && window.CIZIMLER[h];
    if (cizim) {
      const svg = cizim.olustur();
      kap.append(svg);
      requestAnimationFrame(() => cizim.oynat(svg, { sessiz: true, kal: true }).catch(() => {}));
    } else if (bilgi) kap.textContent = bilgi.resim;
    kap.addEventListener('click', () => { if (bilgi) { window.Konus.sustur(); konus(bilgi.kelime.toLocaleLowerCase('tr')); } });
    return kap;
  }

  /** Şifre panelini açar; kelime yazılınca true, vazgeçilince false. */
  function sifre(kelime, no, mesaj) {
    return new Promise((bitir) => {
      const harfler = [...kelime];
      const sasirt = H().karistir(window.HARFLER.map((x) => x.h).filter((h) => !harfler.includes(h))).slice(0, SIFRE_SASIRTMA);
      const panel = $('#sifre');
      let sira = 0;
      let hata = 0;
      const yuvalar = harfler.map((h) => H().el('span', { className: 'sifre-yuva' }, [H().el('span', { className: `hayalet ${H().tur(h)}`, textContent: H().goster(h) })]));
      const resimler = harfler.map((h) => harfResmi(h));
      const bitis = (sonuc) => { panel.hidden = true; bitir(sonuc); };
      const tas = (h) => {
        const b = H().el('button', { className: `sifre-tas ${H().tur(h)}`, type: 'button', textContent: H().goster(h) });
        b.addEventListener('click', async () => {
          if (!canli(no) || sira >= harfler.length || b.disabled) return;
          if (h !== harfler[sira]) {
            hata += 1;
            window.Efekt.yanlis();
            b.classList.remove('salla'); void b.offsetWidth; b.classList.add('salla');
            window.Konus.sustur(); konus(H().harfSesi(harfler[sira]));
            if (hata >= 2) yuvalar[sira].classList.add('ipucu');
            return;
          }
          H().ilerlemeYaz(h, hata === 0 ? true : null);
          hata = 0;
          b.disabled = true;
          yuvalar[sira].classList.remove('ipucu');
          yuvalar[sira].replaceChildren(H().el('span', { className: `dolu ${H().tur(h)}`, textContent: H().goster(h) }));
          sira += 1;
          window.Efekt.tikSesi();
          window.Konus.sustur();
          if (sira < harfler.length) { konus(H().harfSesi(h)); return; }
          panel.classList.add('acildi');
          $('#sifre .sifre-kilit').textContent = '🔓';
          window.Efekt.karakter('kilit');
          await konus(kelime.toLocaleLowerCase('tr'));
          await H().bekle(500);
          if (canli(no)) bitis(true);
        });
        return b;
      };
      $('#sifre-yuvalar').replaceChildren(...yuvalar.map((y, i) => H().el('span', { className: 'sifre-sutun' }, [y, resimler[i]])));
      $('#sifre-taslar').replaceChildren(...H().karistir([...harfler, ...sasirt]).map(tas));
      $('#sifre-kapat').onclick = () => bitis(false);
      $('#sifre-dinle').onclick = () => { window.Konus.sustur(); konus(kelime.toLocaleLowerCase('tr')); };
      panel.classList.remove('acildi');
      $('#sifre .sifre-kilit').textContent = '🔒';
      panel.hidden = false;
      window.Konus.sustur();
      konus(mesaj || `Kapı kilitli! Şifre: ${kelime.toLocaleLowerCase('tr')}. Harfleri sırayla yaz.`);
    });
  }

  /* ---------- evin içi (ev.js): koridorda ODA, MUTFAK, SALON, BANYO kapıları; eşyalar adı yazılınca çalışır ---------- */
  function evIci(yer) {
    const no = ++oturum;
    H().ekranAc('evici');
    $('#evici-cik').onclick = () => sokak('ev');
    window.Ev.ac(yer, {
      kiz, konus, say, harfResmi, harfHavuzu, yaratAc,
      canli: () => canli(no),
      sifre: (kelime, mesaj) => sifre(kelime, no, mesaj),
      evIci,
    });
  }

  async function kapiAc(bina, acik) {
    bina.classList.toggle('kapi-acik', acik);
    window.Efekt.karakter('kapi');
    await H().bekle(450);
  }

  async function disariCik(bina, kizKap, no) {
    await H().bekle(300);
    if (!canli(no)) return;
    if (bina.classList.contains('yapi-kuafor')) window.Efekt.karakter('zil');
    await kapiAc(bina, true);
    kizKap.classList.remove('iceride');
    await H().bekle(650);
    if (!canli(no)) return;
    await kapiAc(bina, false);
  }

  async function iceriGir(bina, kizKap, no) {
    if (bina.classList.contains('yapi-kuafor')) window.Efekt.karakter('zil');
    await kapiAc(bina, true);
    kizKap.classList.add('iceride');
    await H().bekle(650);
    if (canli(no)) await kapiAc(bina, false);
  }

  let yuruyus = 0; // son yürüyüş; yenisi başlarsa eskisi yarıda kalır

  async function yuru(kizKap, hedef, no, alan) {
    const benim = ++yuruyus;
    const kap = kizKap.parentElement;
    /* yürürken yeni hedef gelirse kız bulunduğu yerden döner */
    const simdi = (kizKap.offsetLeft / kap.offsetWidth) * 100;
    kizKap.style.transitionDuration = '0ms';
    kizKap.style.left = `${simdi}%`;
    void kizKap.offsetWidth;
    const yol = Math.abs(simdi - hedef);
    if (yol < 0.5) { kizKap.classList.remove('yuruyor', 'sola'); return; }
    const sure = Math.round(YURUME_MS_MIN + yol * YURUME_MS_YUZDE);
    kizKap.classList.toggle('sola', hedef < simdi);
    kizKap.classList.add('yuruyor');
    kizKap.style.transitionDuration = `${sure}ms`;
    kizKap.style.left = `${hedef}%`;
    takipEt(alan, kizKap, sure);
    for (let t = 0; t < sure; t += ADIM_SESI_MS) setTimeout(() => { if (canli(no) && benim === yuruyus) window.Efekt.karakter('adim'); }, t);
    await H().bekle(sure);
    if (canli(no) && benim === yuruyus) kizKap.classList.remove('yuruyor', 'sola');
  }


  /* ---------- restoran (restoran.js) ---------- */
  function restoranAc() {
    const no = ++oturum;
    H().ekranAc('restoran');
    $('#restoran-cik').onclick = () => sokak('restoran');
    window.Restoran.baslat({ kiz, canli: () => canli(no), say, konus, cik: () => sokak('restoran') });
  }

  /* ---------- hastane (hastane.js) ---------- */
  function hastaneAc() {
    const no = ++oturum;
    H().ekranAc('hastane');
    $('#hastane-cik').onclick = () => sokak('hastane');
    window.Hastane.baslat({ kiz, canli: () => canli(no), say, konus, harfResmi, harfHavuzu, cik: () => sokak('hastane') });
  }

  /* ---------- plaj (plaj.js) ---------- */
  function plajAc() {
    const no = ++oturum;
    H().ekranAc('plaj');
    $('#plaj-cik').onclick = () => sokak('plaj');
    window.Plaj.baslat({ kiz, canli: () => canli(no), say, konus, harfResmi, harfHavuzu, cik: () => sokak('plaj') });
  }

  /* ---------- kuaför ---------- */
  function kuaforAc() {
    const no = ++oturum;
    H().ekranAc('kuafor');
    $('#kuafor-cik').onclick = () => sokak('kuafor');
    kiz = { ...kiz, orgu: false, oje: null };
    orguBasla(no);
  }

  /** Ekranın ortasında büyük rakam belirir ve sayı okunur. */
  function say(n) {
    const kutu = $('#buyuk-sayi');
    kutu.textContent = String(n);
    kutu.classList.remove('goster'); void kutu.offsetWidth; kutu.classList.add('goster');
    window.Konus.sustur();
    return konus(SAYILAR[n - 1]);
  }

  function harfHavuzu() {
    const aile = [...H().aileHarfleri()];
    return aile.length >= 4 ? aile : window.HARFLER.map((x) => x.h);
  }

  /* 1) Saç örme: dış tutamlar sırayla ortaya atılır (sağ, sol, sağ …). */
  function orguBasla(no) {
    const o = { no, adim: 0, hedef: null, hata: 0, kilit: false, harfler: [] };
    $('#kuafor-tekrar').onclick = () => { if (canli(no) && o.hedef) { window.Konus.sustur(); konus(H().harfSesi(o.hedef)); } };
    $('#kuafor-ipucu').textContent = '💇‍♀️';
    window.Konus.sustur();
    konus('Saçını örelim! Dinle. O harfli tutamı ortaya at.');
    orguAdim(o);
  }

  function orguAdim(o) {
    if (!canli(o.no)) return;
    const havuz = harfHavuzu();
    const hedef = H().karistir(havuz.filter((h) => h !== o.hedef))[0];
    const digerleri = H().karistir(window.HARFLER.map((x) => x.h).filter((h) => h !== hedef)).slice(0, 2);
    const dogruTutam = o.adim % 2 === 0 ? 2 : 0;
    const harfler = [...digerleri];
    harfler.splice(dogruTutam, 0, hedef);
    o.hedef = hedef; o.hata = 0; o.kilit = false; o.harfler = harfler;
    orguCiz(o, dogruTutam);
    konus(H().harfSesi(hedef));
  }

  function orguCiz(o, dogruTutam) {
    const sahne = $('#kuafor-sahne');
    const kizSvg = window.Kiz.arka(kiz, { orgu: o.adim, toplam: ORGU_ADIMI });
    const kap = H().el('div', { className: 'koltuk' }, [H().el('div', { className: 'ayna-arka' }), kizSvg]);
    if (o.adim < ORGU_ADIMI) {
      const tokalar = H().el('div', { className: 'tokalar' }, o.harfler.map((h, i) => {
        const b = H().el('button', { className: `toka toka-${i}`, type: 'button' }, [H().el('span', { className: H().tur(h), textContent: H().goster(h) })]);
        b.addEventListener('click', () => tokaSec(o, i, i === dogruTutam, b, kizSvg));
        return b;
      }));
      /* sesi duyduğu harfin karakteri de görünsün (ör. K → kelebek); dokununca adı okunur */
      kap.append(tokalar, H().el('div', { className: 'orgu-ipucu' }, [harfResmi(o.hedef)]));
    }
    sahne.replaceChildren(kap);
  }

  async function tokaSec(o, i, dogru, dugme, kizSvg) {
    if (o.kilit || !canli(o.no)) return;
    if (!dogru) {
      if (o.hata === 0) H().ilerlemeYaz(o.hedef, false);
      o.hata += 1;
      window.Efekt.yanlis();
      dugme.classList.remove('salla'); void dugme.offsetWidth; dugme.classList.add('salla');
      window.Konus.sustur();
      konus(H().harfSesi(o.hedef));
      if (o.hata >= 2) document.querySelector(`.toka-${o.adim % 2 === 0 ? 2 : 0}`)?.classList.add('ipucu');
      return;
    }
    o.kilit = true;
    H().ilerlemeYaz(o.hedef, o.hata === 0 ? true : null);
    const tutam = kizSvg.querySelector(`[data-tutam="${i}"]`);
    if (tutam) tutam.classList.add(i === 2 ? 'ortaya-sol' : 'ortaya-sag');
    dugme.classList.add('takildi');
    window.Efekt.karakter('sac');
    await H().bekle(550);
    if (!canli(o.no)) return;
    o.adim += 1;
    await say(o.adim);
    if (!canli(o.no)) return;
    if (o.adim < ORGU_ADIMI) { orguAdim(o); return; }
    orguCiz(o, -1);
    window.Efekt.karakter('parla');
    window.Gorsel.kalpler($('#kuafor-sahne'), 8);
    await konus('Altı örgü! Fiyonk da tamam.');
    if (canli(o.no)) { kiz = { ...kiz, orgu: true }; tirnakBasla(o.no); }
  }

  /* 2) Tırnak boyama: oje seç, beş tırnağı boya, say. */
  function tirnakBasla(no) {
    const t = { no, ojeler: [], renk: OJELER[0], bitti: false };
    $('#kuafor-ipucu').textContent = '💅';
    $('#kuafor-tekrar').onclick = () => { window.Konus.sustur(); konus('Bir oje seç, sonra tırnağa dokun.'); };
    tirnakCiz(t);
    window.Konus.sustur();
    konus('Şimdi tırnaklarını boyayalım. Bir oje seç, sonra tırnağa dokun.');
  }

  function tirnakCiz(t) {
    const elSvg = window.Kiz.el(kiz, t.ojeler);
    elSvg.querySelectorAll('.parmak').forEach((n) => n.addEventListener('click', () => tirnakBoya(t, Number(n.dataset.tirnak))));
    const sise = (renk) => {
      const b = H().el('button', { className: `oje${renk === t.renk ? ' secili' : ''}`, type: 'button', ariaLabel: 'oje' }, [H().el('span', { className: 'oje-kapak' }), H().el('span', { className: 'oje-govde' })]);
      b.style.setProperty('--renk', renk);
      b.addEventListener('click', () => { t.renk = renk; window.Efekt.tik(); tirnakCiz(t); });
      return b;
    };
    const parcalar = [H().el('div', { className: 'el-kap' }, [elSvg])];
    if (t.ojeler.filter(Boolean).length < TIRNAK_SAYISI) parcalar.push(H().el('div', { className: 'ojeler' }, OJELER.map(sise)));
    else if (!t.bitti) {
      const ufle = H().el('button', { className: 'ufle-dugme', type: 'button', textContent: '🌬️' });
      ufle.addEventListener('click', () => kurut(t, ufle));
      parcalar.push(ufle);
    }
    $('#kuafor-sahne').replaceChildren(...parcalar);
  }

  async function tirnakBoya(t, i) {
    if (!canli(t.no) || t.bitti) return;
    const yeni = !t.ojeler[i];
    t.ojeler = Object.assign([...t.ojeler], { [i]: t.renk });
    window.Efekt.karakter('firca');
    tirnakCiz(t);
    if (!yeni) return;
    const adet = t.ojeler.filter(Boolean).length;
    await say(adet);
    if (canli(t.no) && adet === TIRNAK_SAYISI) konus('Beş tırnak! Şimdi üfle, kurusun.');
  }

  async function kurut(t, dugme) {
    if (t.bitti) return;
    t.bitti = true;
    dugme.classList.add('esiyor');
    window.Efekt.karakter('ufle');
    window.Gorsel.isilti?.($('.el-kap'));
    await H().bekle(1300);
    if (!canli(t.no)) return;
    kiz = { ...kiz, oje: t.ojeler[2] || t.renk };
    aynaGoster(t.no);
  }

  /* 3) Ayna: yeni hali, sevinç. */
  async function aynaGoster(no) {
    kaydet();
    $('#kuafor-ipucu').textContent = '🪞';
    const kap = H().el('div', { className: 'ayna' }, [window.Kiz.on(kiz, { orgu: true, oje: kiz.oje, mutlu: true })]);
    $('#kuafor-sahne').replaceChildren(kap);
    window.Efekt.tac();
    window.Gorsel.konfeti();
    kap.classList.add('sevin');
    await konus('Aynaya bak! Çok güzel oldun!');
    if (!canli(no)) return;
    const cik = H().el('button', { className: 'buyuk-dugme', type: 'button', textContent: '🚪 Sokağa çık' });
    cik.addEventListener('click', () => sokak('kuafor'));
    kap.after(cik);
  }

  function durdur() { oturum += 1; }

  return Object.freeze({ kart, durdur });
})();
