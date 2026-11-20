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

  /* ---------- mikrofon ---------- */
  function dinle(mik) {
    const Sinif = TanimaSinifi();
    if (!Sinif) return;
    if (dinleyici) { dinleyici.abort(); return; }
    window.Konus.sustur();
    const benim = oturum;
    const r = new Sinif();
    r.lang = 'tr-TR';
    r.interimResults = false;
    r.continuous = false;
    r.maxAlternatives = 5;
    dinleyici = r;
    let duyuldu = false;
    const durum = (t) => { const d = $('#yaz-durum'); if (d) d.textContent = t; };
    mik.classList.add('dinliyor');
    durum('Dinliyorum…');
    window.Efekt.karakter('cin');
    r.onresult = (e) => {
      duyuldu = true;
      const sonuc = e.results[0];
      /* cihaz küfrü yıldızla gizleyebilir ("s***"): yıldızlı tahmin de kötü sayılır */
      const hepsi = [...sonuc].map((a) => ({ yildizli: (a.transcript || '').includes('*'), kelime: kelimeYap(a.transcript) }));
      const kotu = hepsi.some((a) => a.yildizli || yasakMi(a.kelime));
      const adaylar = [...new Set(hepsi.filter((a) => !a.yildizli && a.kelime && !yasakMi(a.kelime)).map((a) => a.kelime))].slice(0, ADAY_SAYISI);
      if (benim !== oturum) return;
      if (kotu) {
        durum('Güzel bir kelime söyle');
        window.Konus.sustur();
        window.Konus.soyle('Bu kelimeyi yazmayalım. Güzel bir kelime söyle.');
        return;
      }
      if (adaylar.length) onayla(adaylar);
    };
    r.onerror = (e) => {
      if (benim !== oturum) return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        durum('Mikrofon izni yok');
        window.Konus.soyle('Mikrofonu açmama izin verilmedi. Bir resim seçebilirsin.');
      }
    };
    r.onend = () => {
      dinleyici = null;
      mik.classList.remove('dinliyor');
      if (benim !== oturum || duyuldu) return;
      durum('Dokun ve söyle');
      window.Konus.soyle('Duyamadım. Mikrofona dokun ve tekrar söyle.');
    };
    try { r.start(); } catch { dinleyici = null; mik.classList.remove('dinliyor'); durum('Dokun ve söyle'); }
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
