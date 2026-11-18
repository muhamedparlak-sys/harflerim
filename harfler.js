/*
 * Harf → karakter sözlüğü (Montessori: harfin sesi + o sesle başlayan nesne).
 * Bir harfin karakterini değiştirmek için yalnızca bu listeyi düzenle.
 * Her harfin, harfin kendi biçiminden doğan çizimi cizimler.js'te (emoji yalnızca yedek).
 * Ğ ile başlayan kelime olmadığı için "Doğan güneş" kullanılır (harf kelimenin içinde vurgulanır);
 * çizimi G'nin güneşinin yumuşak hâlidir ("yumuşak G").
 */
window.HARFLER = Object.freeze([
  { h: 'A', kelime: 'Ağ', resim: '🕸️' },
  { h: 'B', kelime: 'Baykuş', resim: '🦉' },
  { h: 'C', kelime: 'Civciv', resim: '🐥' },
  { h: 'Ç', kelime: 'Çilek', resim: '🍓' },
  { h: 'D', kelime: 'Domates', resim: '🍅' },
  { h: 'E', kelime: 'Ev', resim: '🏠' },
  { h: 'F', kelime: 'Fırça', resim: '🪥' },
  { h: 'G', kelime: 'Güneş', resim: '☀️' },
  { h: 'Ğ', kelime: 'Doğan güneş', resim: '🌅' },
  { h: 'H', kelime: 'Hamak', resim: '🌴' },
  { h: 'I', kelime: 'Işık', resim: '🕯️' },
  { h: 'İ', kelime: 'İğne', resim: '🪡' },
  { h: 'J', kelime: 'Jet', resim: '✈️' },
  { h: 'K', kelime: 'Kelebek', resim: '🦋' },
  { h: 'L', kelime: 'Leylek', resim: '🪿' },
  { h: 'M', kelime: 'Martı', resim: '🐦' },
  { h: 'N', kelime: 'Nehir', resim: '🏞️' },
  { h: 'O', kelime: 'Omlet', resim: '🍳' },
  { h: 'Ö', kelime: 'Örümcek', resim: '🕷️' },
  { h: 'P', kelime: 'Papağan', resim: '🦜' },
  { h: 'R', kelime: 'Robot', resim: '🤖' },
  { h: 'S', kelime: 'Solucan', resim: '🪱' },
  { h: 'Ş', kelime: 'Şimşek', resim: '⚡' },
  { h: 'T', kelime: 'Tahterevalli', resim: '🛝' },
  { h: 'U', kelime: 'Uğur böceği', resim: '🐞' },
  { h: 'Ü', kelime: 'Ütü', resim: '👕' },
  { h: 'V', kelime: 'Vapur', resim: '⛴️' },
  { h: 'Y', kelime: 'Yıldız', resim: '⭐' },
  { h: 'Z', kelime: 'Zürafa', resim: '🦒' },
]);

/*
 * Harfin SESİ (adı değil: "be" değil "bı"): cihaz sesi bu kısa heceyi okur.
 * ses.js'teki ünlüsüz sentez (FONEM) kısık kaldığı için kapalı (SENTEZLE = false).
 * Klon sesle kayıt öncelikli: sesler/sesler.json → { "m": "m.mp3" }.
 */
window.HARF_SES = Object.freeze({
  A: 'a', E: 'e', I: 'ı', İ: 'i', O: 'o', Ö: 'ö', U: 'u', Ü: 'ü',
  B: 'bı', C: 'cı', Ç: 'çı', D: 'dı', G: 'gı', K: 'kı', P: 'pı', T: 'tı',
  F: 'fı', H: 'hı', J: 'jı', L: 'lı', M: 'mı', N: 'nı', R: 'rı',
  S: 'sı', Ş: 'şı', V: 'vı', Y: 'yı', Z: 'zı', Ğ: 'ğı',
});

window.SESLI = new Set(['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü']);
window.HARF_BUL = new Map(window.HARFLER.map((x) => [x.h, x]));

/*
 * Aile bilgisi bilerek kodda YOK (depo herkese açık). İsimler, yakınlıklar ve fotoğraflar
 * iPad'de ebeveyn ayarlarından (⚙️ basılı tut) girilir ve yalnızca o cihazda saklanır.
 */
window.ILK_AILE = Object.freeze([]);

