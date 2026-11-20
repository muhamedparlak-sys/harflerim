/*
 * YAZALIM: çocuk yazmak istediği kelimeyi söyler ("anne", "elma"), kelime resmiyle (emoji ya da aileden
 * birinin fotoğrafı) ekrana gelir, "Elma mı?" diye sorulur; çocuk onaylayınca kelime harf harf yazdırılır
 * (kasabadaki şifre paneliyle: her harfin altında o harfin karakteri durur, yanlış harfte sesi söylenir).
 *
 *   Mikrofon   — tarayıcının konuşma tanıması (Safari/Chrome, tr-TR). Duyulan ilk 3 tahmin kart olarak gösterilir.
 *   Mikrofon yoksa ya da çocuk söylemek istemezse: hazır resimli kelimelerden ve aile üyelerinden seçer.
 *   Yazdıklarım — yazılan son kelimeler cihazda saklanır; dokununca yeniden yazılır.
 *   Kötü kelimeler — küfür/hakaret listesi (YASAK) ve cihazın yıldızla gizlediği sözler yazdırılmaz.
 */
window.Yaz = (() => {
  'use strict';

  const H = () => window.Harflerim;
  const $ = (s) => document.querySelector(s);
  const AZAMI_HARF = 10;
  const SAKLANAN = 12;
  const ADAY_SAYISI = 3;

  /* Çocukların en çok yazmak isteyeceği kelimeler ve resimleri (aile adları ayrıca eklenir). */
  const SOZLUK = {
    ANNE: '👩', BABA: '👨', ANNEANNE: '👵', BABAANNE: '👵', NİNE: '👵', DEDE: '👴', ABLA: '👧', ABİ: '👦', KARDEŞ: '🧒', BEBEK: '👶',
    TEYZE: '👩', HALA: '👩', DAYI: '👨', AMCA: '👨', ARKADAŞ: '🧑‍🤝‍🧑', ÖĞRETMEN: '👩‍🏫', DOKTOR: '🧑‍⚕️',
    ELMA: '🍎', ARMUT: '🍐', MUZ: '🍌', ÇİLEK: '🍓', ÜZÜM: '🍇', KARPUZ: '🍉', KİRAZ: '🍒', PORTAKAL: '🍊', LİMON: '🍋', ŞEFTALİ: '🍑',
    HAVUÇ: '🥕', DOMATES: '🍅', MISIR: '🌽', EKMEK: '🍞', PEYNİR: '🧀', YUMURTA: '🥚', SÜT: '🥛', SU: '💧', ÇAY: '🍵', PASTA: '🎂',
    KEK: '🧁', DONDURMA: '🍦', ÇİKOLATA: '🍫', ŞEKER: '🍬', BAL: '🍯', PİZZA: '🍕', ÇORBA: '🥣', MAKARNA: '🍝', PATATES: '🥔',
    KEDİ: '🐱', KÖPEK: '🐶', KUŞ: '🐦', BALIK: '🐟', TAVŞAN: '🐰', AYI: '🐻', ASLAN: '🦁', KAPLAN: '🐯', FİL: '🐘', ZÜRAFA: '🦒',
    MAYMUN: '🐵', AT: '🐴', İNEK: '🐄', KOYUN: '🐑', KEÇİ: '🐐', TAVUK: '🐔', CİVCİV: '🐥', ÖRDEK: '🦆', ARI: '🐝', KELEBEK: '🦋',
    KARINCA: '🐜', SALYANGOZ: '🐌', KAPLUMBAĞA: '🐢', YILAN: '🐍', TİMSAH: '🐊', PENGUEN: '🐧', BAYKUŞ: '🦉', FARE: '🐭', DİNOZOR: '🦕',
    YUNUS: '🐬', BALİNA: '🐳', AHTAPOT: '🐙', PAPAĞAN: '🦜', TİLKİ: '🦊', KURT: '🐺', PANDA: '🐼', DOMUZ: '🐷', ÖRÜMCEK: '🕷️',
    EV: '🏠', OKUL: '🏫', TOP: '⚽', ARABA: '🚗', OTOBÜS: '🚌', UÇAK: '✈️', GEMİ: '🚢', TREN: '🚂', BİSİKLET: '🚲', ROKET: '🚀',
    KİTAP: '📖', KALEM: '✏️', SAAT: '⏰', TELEFON: '📱', BALON: '🎈', HEDİYE: '🎁', OYUNCAK: '🧸', TAÇ: '👑',
    GÜNEŞ: '☀️', AY: '🌙', YILDIZ: '⭐', BULUT: '☁️', YAĞMUR: '🌧️', KAR: '❄️', GÖKKUŞAĞI: '🌈', ÇİÇEK: '🌸', AĞAÇ: '🌳', DENİZ: '🌊',
    KALP: '❤️', SEVGİ: '❤️', OYUN: '🎲', MÜZİK: '🎵', RESİM: '🎨', DANS: '💃', UYKU: '😴', YATAK: '🛏️', KAPI: '🚪', PENCERE: '🪟',
    ŞAPKA: '👒', ELBİSE: '👗', AYAKKABI: '👟', ÇORAP: '🧦', GÖZLÜK: '👓', ŞEMSİYE: '☂️', DİŞ: '🦷', EL: '✋', GÖZ: '👁️', BURUN: '👃',
    PRENSES: '👸', KRAL: '🤴', PERİ: '🧚', ROBOT: '🤖', CANAVAR: '👾', KORSAN: '🏴‍☠️', SİHİR: '🪄', MERHABA: '👋', TEŞEKKÜR: '🙏',
  };
  const ONERI = ['ANNE', 'BABA', 'ELMA', 'KEDİ', 'TOP', 'EV', 'GÜNEŞ', 'ARABA', 'KÖPEK', 'ÇİÇEK', 'PASTA', 'BALIK'];

  /* Kötü kelime süzgeci: söylenen kelime küfür ya da hakaretse yazdırılmaz.
     Liste kaynak kodda açık durmasın diye base64 (JSON: tam = birebir, bas = bununla başlayan). */
  const YASAK = (() => {
    try {
      const { tam, bas } = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('eyJ0YW0iOiBbIkFNIiwgIkFNSyIsICJBTVEiLCAiQVEiLCAiR8OWVCIsICJHw5ZUw5wiLCAiR8OWVExFSyIsICJHw5ZUVkVSRU4iLCAiQk9LIiwgIkJPS1RBTiIsICJCT0tVTiIsICLDh8OcSyIsICJEw5ZMIiwgIk1BTCIsICJQVcWeVCIsICLEsEJORSIsICJBUFRBTCIsICJTQUxBSyIsICJHRVLEsFpFS0FMSSIsICJEQU5HQUxBSyIsICJBSE1BSyIsICJFTkFZxLAiLCAiTUFOWUFLIiwgIkhJUkJPIiwgIsWeQVDFnkFMIiwgIkXFnsWeT8SeTFVFxZ5FSyIsICJLQUhQRSIsICJHQVZBVCIsICJZQVbFnkFLIiwgIktBTkNJSyIsICJTw5xSVMOcSyIsICJQRVpFVkVOSyIsICLFnkVSRUZTxLBaIiwgIk5BTVVTU1VaIiwgIkhBWVPEsFlFVFPEsFoiLCAixZ5JTExJSyIsICJGQUjEsMWeRSIsICJUQcWeQUsiLCAiVEHFnsWeQUsiLCAiWUFSQUsiLCAiWUFSUkFLIiwgIllBUlJBTSIsICJGVUNLIiwgIlNISVQiLCAiQklUQ0giLCAiRElDSyIsICJQVVNTWSIsICJBU1MiLCAiQ1VOVCIsICJTRVgiLCAiU0VLUyIsICJPU0LEsFIiLCAiQU5BTkkiLCAiQU5BTkEiLCAiQU5BTklOIiwgIkJBQ0lOSSIsICJTxLBLVMSwUiJdLCAiYmFzIjogWyJTxLBLIiwgIkFNQ0lLIiwgIkFNSU5BIiwgIkFNSU5JIiwgIk9SVVNQVSIsICJPUk9TUFUiLCAiT1JTUCIsICJQxLDDhyIsICJZQVJSQSIsICJZQVJBxJ4iLCAiUEVaRVZFTkciLCAiS0FIQkUiLCAiR0FWQUQiLCAiWUFWxZ5BxJ4iLCAiR0VSxLBaRUtBTCIsICJGVUNLIiwgIlNISVQiLCAiQklUQ0giLCAixZ5FUkVGU8SwWiIsICLEsEJORSIsICJQVcWeVCIsICJTxLBLxLAiLCAiU0VLU8SwIiwgIlBPUk5PIl19'), (c) => c.charCodeAt(0))));
      return { tam: new Set(tam), bas };
    } catch { return { tam: new Set(), bas: [] }; }
  })();
  const yasakMi = (kelime) => YASAK.tam.has(kelime) || YASAK.bas.some((b) => kelime.startsWith(b));

  let dinleyici = null;
  let oturum = 0;
  let yazilanlar = [];

  const kucuk = (k) => k.toLocaleLowerCase('tr');
  const TanimaSinifi = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;

  /** Duyulan metni yazılabilir kelimeye çevirir: büyük harf, Türk alfabesi dışı karakterler atılır; ilk kelime. */
  function kelimeYap(metin) {
    const duz = (metin || '').trim().toLocaleUpperCase('tr').replace(/Â/g, 'A').replace(/Î/g, 'İ').replace(/Û/g, 'U');
    const ilk = duz.split(/\s+/).find((p) => p.length) || '';
    return [...ilk].filter((h) => window.HARF_BUL.has(h)).join('').slice(0, AZAMI_HARF);
  }

  /** Kelimenin resmi: aileden biri ise fotoğrafı/emojisi, sözlükte varsa emoji, yoksa kalem. */
  function resim(kelime, sinif = 'yaz-resim') {
    const kisi = H().aile().find((k) => k.name.toLocaleUpperCase('tr') === kelime);
    if (kisi) return H().yuz(kisi, sinif);
    return H().el('span', { className: `${sinif} yuz-emoji`, textContent: SOZLUK[kelime] || '✏️' });
  }
  const emoji = (kelime) => {
    const kisi = H().aile().find((k) => k.name.toLocaleUpperCase('tr') === kelime);
    return kisi ? (kisi.emoji || '🙂') : (SOZLUK[kelime] || '✏️');
  };

  /* ---------- ana sayfa kartı ---------- */
  function kart(sira) {
    const k = H().el('button', { className: 'kart kart-mod kart-yaz', type: 'button' }, [
      H().el('span', { className: 'kart-resim' }, [H().el('span', { className: 'kart-yuz yuz-emoji', textContent: '🎤' })]),
      H().el('span', { className: 'kart-ad' }, H().renkliAd('YAZALIM')),
      H().el('span', { className: 'kart-rol', textContent: 'Söyle, yaz' }),
    ]);
    k.style.setProperty('--gecikme', `${sira * 60}ms`);
    k.addEventListener('click', ac);
    return k;
  }

  async function ac() {
    window.Efekt.ac();
    oturum += 1;
    try { const k = await window.Depo.oku('yazilanlar'); if (Array.isArray(k)) yazilanlar = k.filter((x) => typeof x === 'string' && kelimeYap(x) === x); } catch { /* boş liste */ }
    H().ekranAc('yaz');
    $('#yaz-tekrar').onclick = () => { window.Konus.sustur(); window.Konus.soyle('Ne yazmak istersin? Mikrofona dokun ve söyle.'); };
    giris();
    window.Konus.sustur();
    window.Konus.soyle(TanimaSinifi()
      ? 'Ne yazmak istersin? Mikrofona dokun ve söyle. Ya da bir resim seç.'
      : 'Ne yazmak istersin? Bir resim seç.');
  }

  /* ---------- 1) giriş: mikrofon, hazır kelimeler, aile, yazdıklarım ---------- */
  function giris() {
    const sahne = $('#yaz-sahne');
    const parcalar = [];
    if (TanimaSinifi()) {
      const mik = H().el('button', { className: 'yaz-mikrofon', type: 'button', ariaLabel: 'Söyle' }, [
        H().el('span', { className: 'yaz-mik-simge', textContent: '🎤' }),
      ]);
      mik.addEventListener('click', () => dinle(mik));
      parcalar.push(mik, H().el('p', { id: 'yaz-durum', className: 'yaz-durum', textContent: 'Dokun ve söyle' }));
    }
    const kDugme = H().el('button', { className: 'yaz-klavye-dugme', type: 'button', textContent: '⌨️ Büyükler yazsın' });
    kDugme.addEventListener('click', klavye);
    const kGiris = H().el('input', { type: 'text', placeholder: 'Kelime', autocomplete: 'off', autocapitalize: 'characters', spellcheck: false });
    const kTamam = H().el('button', { className: 'yaz-klavye-tamam', type: 'submit', textContent: 'Tamam' });
    const kForm = H().el('form', { id: 'yaz-klavye', className: 'yaz-klavye', hidden: true }, [kGiris, kTamam]);
    kForm.addEventListener('submit', (e) => {
      e.preventDefault();
      kGiris.blur();
      if (kGiris.value.trim()) duyulanlar([kGiris.value]);
    });
    parcalar.push(H().el('div', { className: 'yaz-klavye-sarma' }, [kDugme, kForm]));
    const secim = (kelime) => {
      const b = H().el('button', { className: 'yaz-secim', type: 'button', ariaLabel: kucuk(kelime) }, [
        resim(kelime, 'yaz-secim-resim'), H().el('span', { className: 'yaz-secim-ad' }, [H().renkliAd(kelime)]),
      ]);
      b.addEventListener('click', () => onayla([kelime]));
      return b;
    };
    const aile = H().aile().map((k) => kelimeYap(k.name)).filter((k) => k.length > 1);
    const hazir = [...new Set([...aile, ...ONERI])];
    parcalar.push(H().el('div', { className: 'yaz-secimler' }, hazir.map(secim)));
    if (yazilanlar.length) {
      parcalar.push(H().el('div', { className: 'yaz-yazdiklarim' }, [
        H().el('span', { className: 'yaz-baslik', textContent: '⭐ Yazdıklarım' }),
        ...yazilanlar.map((k) => {
          const b = H().el('button', { className: 'yaz-cip', type: 'button' }, [H().el('span', { textContent: emoji(k) }), H().el('span', {}, [H().renkliAd(k)])]);
          b.addEventListener('click', () => yazdir(k));
          return b;
        }),
      ]));
    }
    sahne.replaceChildren(...parcalar);
  }

  /* ---------- mikrofon ----------
     iPad Safari'de dikkat: (1) tanıma çoğu zaman "son sonuç" göndermez, durmadan dinler; bu yüzden ara sonuçlar
     açıktır, konuşma bitince (kısa sessizlikten sonra) dinleme biz durdururuz. (2) Mikrofon açılırken ses
     çalınmaz, okuma susturulur; ses oturumu çakışırsa tanıma sessizce başarısız olur. */
  const SESSIZLIK_MS = 1300;
  const EN_UZUN_DINLEME_MS = 8000;
  const HATA_METNI = {
    'not-allowed': 'Mikrofon izni verilmedi', 'service-not-allowed': 'Bu cihazda ses tanıma kapalı',
    'no-speech': 'Ses duyulmadı', 'audio-capture': 'Mikrofon bulunamadı', network: 'Ses tanıma için internet gerekiyor',
    aborted: 'Dinleme durdu',
  };

  /** Duyulan tahminleri süzer: kötü kelime varsa uyarır, yoksa onaya geçer. */
  function duyulanlar(metinler) {
    const durum = (t) => { const d = $('#yaz-durum'); if (d) d.textContent = t; };
    const hepsi = metinler.map((m) => ({ yildizli: (m || '').includes('*'), kelime: kelimeYap(m) }));
    if (hepsi.some((a) => a.yildizli || yasakMi(a.kelime))) {
      durum('Güzel bir kelime söyle');
      window.Konus.sustur();
      window.Konus.soyle('Bu kelimeyi yazmayalım. Güzel bir kelime söyle.');
      return;
    }
    const adaylar = [...new Set(hepsi.map((a) => a.kelime).filter(Boolean))].slice(0, ADAY_SAYISI);
    if (adaylar.length) onayla(adaylar);
    else { durum('Dokun ve söyle'); window.Konus.soyle('Duyamadım. Mikrofona dokun ve tekrar söyle.'); }
  }

  function dinle(mik) {
    const Sinif = TanimaSinifi();
    if (!Sinif) return;
    if (dinleyici) { dinleyici.stop(); return; }
    window.Konus.sustur();
    const benim = oturum;
    const r = new Sinif();
    r.lang = 'tr-TR';
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 5;
    dinleyici = r;
    let son = []; // en son duyulan tahminler
    let bitti = false;
    let sessizlik = null;
    const durum = (t) => { const d = $('#yaz-durum'); if (d) d.textContent = t; };
    const sonlandir = () => {
      if (bitti) return;
      bitti = true;
      clearTimeout(sessizlik); clearTimeout(uzun);
      if (benim === oturum && son.length) duyulanlar(son);
    };
    const uzun = setTimeout(() => { try { r.stop(); } catch { /* zaten durdu */ } }, EN_UZUN_DINLEME_MS);
    mik.classList.add('dinliyor');
    durum('Dinliyorum… söyle');
    r.onresult = (e) => {
      const sonuc = e.results[e.results.length - 1];
      son = [...sonuc].map((a) => a.transcript).filter((t) => t && t.trim());
      if (son.length) durum(`“${son[0].trim()}”`);
      clearTimeout(sessizlik);
      if (sonuc.isFinal) { try { r.stop(); } catch { /* */ } sonlandir(); return; }
      sessizlik = setTimeout(() => { try { r.stop(); } catch { /* */ } }, SESSIZLIK_MS);
    };
    r.onerror = (e) => {
      if (benim !== oturum) return;
      bitti = bitti || !son.length;
      const metin = HATA_METNI[e.error] || `Ses tanıma çalışmadı (${e.error})`;
      durum(`${metin} — resimden seçebilir ya da ⌨️ ile yazabilirsin`);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') window.Konus.soyle('Mikrofon çalışmadı. Bir resim seçebilirsin.');
    };
    r.onend = () => {
      dinleyici = null;
      mik.classList.remove('dinliyor');
      clearTimeout(sessizlik); clearTimeout(uzun);
      if (benim !== oturum) return;
      if (son.length) { sonlandir(); return; }
      if (!bitti) { bitti = true; durum('Dokun ve söyle'); window.Konus.soyle('Duyamadım. Mikrofona dokun ve tekrar söyle.'); }
    };
    try { r.start(); } catch (hata) {
      dinleyici = null; mik.classList.remove('dinliyor'); clearTimeout(uzun);
      durum(`Mikrofon açılamadı (${hata.name || hata}) — resimden seç ya da ⌨️ ile yaz`);
    }
  }

  /* Büyükler için klavye: kelimeyi yazıp onaylatır (mikrofon çalışmazsa ya da bilinmeyen kelime için). */
  function klavye() {
    const kap = $('#yaz-klavye');
    if (!kap) return;
    kap.hidden = !kap.hidden;
    if (kap.hidden) return;
    const giris = kap.querySelector('input');
    giris.value = '';
    giris.focus();
  }

  /* ---------- 2) onay: "Elma mı?" ---------- */
  function onayla(adaylar) {
    const benim = ++oturum;
    const sahne = $('#yaz-sahne');
    const kartlar = adaylar.map((kelime, i) => {
      const b = H().el('button', { className: `yaz-aday${i === 0 ? ' ilk' : ''}`, type: 'button', ariaLabel: kucuk(kelime) }, [
        resim(kelime), H().el('span', { className: 'yaz-aday-ad' }, [H().renkliAd(kelime)]),
        H().el('span', { className: 'yaz-evet', textContent: '✅' }),
      ]);
      b.addEventListener('click', () => yazdir(kelime));
      return b;
    });
    const tekrar = H().el('button', { className: 'yaz-tekrar-dugme', type: 'button' }, [H().el('span', { textContent: TanimaSinifi() ? '🎤' : '↩️' }), H().el('span', { textContent: TanimaSinifi() ? 'Tekrar söyle' : 'Geri' })]);
    tekrar.addEventListener('click', () => {
      oturum += 1; giris();
      const mik = $('.yaz-mikrofon');
      if (mik) dinle(mik);
    });
    sahne.replaceChildren(
      H().el('p', { className: 'yaz-soru', textContent: adaylar.length > 1 ? 'Hangisini yazmak istiyorsun?' : 'Bunu mu yazmak istiyorsun?' }),
      H().el('div', { className: 'yaz-adaylar' }, kartlar),
      tekrar,
    );
    window.Konus.sustur();
    const [ilk] = adaylar;
    window.Konus.soyle(adaylar.length > 1
      ? `${kucuk(ilk)} mı? Doğru resme dokun.`
      : `${kucuk(ilk)} mı yazmak istiyorsun? Doğruysa resme dokun.`).catch(() => {});
    void benim;
  }

  /* ---------- 3) yazdır: harf harf ---------- */
  async function yazdir(kelime) {
    const benim = ++oturum;
    window.Konus.sustur();
    const tamam = await window.Kasaba.yazdir(kelime, `${kucuk(kelime)}! Haydi yazalım. Harfleri sırayla bul.`, emoji(kelime));
    if (benim !== oturum) return;
    if (tamam) {
      yazilanlar = [kelime, ...yazilanlar.filter((k) => k !== kelime)].slice(0, SAKLANAN);
      try { await window.Depo.yaz('yazilanlar', yazilanlar); } catch { /* saklanamazsa yalnızca bu açılışta */ }
      window.Gorsel.konfeti();
      window.Efekt.tac();
      giris();
      await window.Konus.soyle(`Aferin! ${kucuk(kelime)} yazdın! Başka ne yazalım?`).catch(() => {});
    } else giris();
  }

  function durdur() {
    oturum += 1;
    if (dinleyici) { dinleyici.abort(); dinleyici = null; }
  }

  return Object.freeze({ kart, durdur, kelimeYap, yasakMi });
})();
