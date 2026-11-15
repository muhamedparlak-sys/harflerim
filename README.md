# Harflerim

iPad için Montessori renkleriyle (sesli harfler kırmızı, sessizler mavi) harf tanıma ve aile isimlerini yazma oyunu.
Kurulum gerektirmez: düz HTML + CSS + JavaScript, kütüphane yok, internetsiz de çalışır.

## Oyun
- **Aile kartları**: karta dokun, isim okunur. Harfleri fotoğrafın yanındaki kutulara **sırayla** sürükle.
  Üstte isim harf harf birleşir (A · AN · ANN · ANNE) ve her adımda okunur.
- **Doğru harf**: harf karakterine dönüşür (A → ağ, M → martı …), fotoğraftan kalpler uçar.
  İki kelimeli isimde her kelime bitince yanına yeşil ✓ gelir. İsim bitince taç, konfeti, karta ⭐.
- **Yanlış harf**: kutuda kırmızı görünür, ✕ sallanır, uyarı sesi çalar ve oluşan kelime okunur (MU + M → "mum").
- **Taşa dokunmak**: o harfin sesi ve karakteri gösterilir.
- **Harf biçimli dönüşüm**: her harf önce yazılış sırasıyla çizilir, sonra kendi biçimini koruyarak o sesle başlayan
  nesneye dönüşür ve hareket eder (B yan dönüp baykuş gözü olur, M martı olup uçar, Ö örümcek olup kaçar …).
- **Harf sesleri**: sessizler adıyla değil sesiyle, sonuna ünlü eklenmeden çalınır ("me" değil "m").
  Cihazın sesi bunu yapamadığı için sesler tarayıcıda sentezlenir (`ses.js` → `FONEM`); klon sesle kayıt varsa o çalar.
- **Karakter sesleri ve hareketleri**: her karakterin kendi hareketi ve sesi var (jet uğultusu, zürafanın nal sesi, örümceğin tıkırtısı …).
- **Yardım geri sayımı**: süre dolmaya yakın doğru taş zıplar; dolunca karakterine dönüşüp ekranda kaçar.
- **HARFLER kartı**: "Yeni harfler" (aile adlarında olmayanlar) ve "Ailemizin harfleri".
- **İlerleme**: yıldızlar ve her harfin doğru/yanlış sayısı cihazda kaydedilir; ayarlarda "öğrendiği harfler".

## Ebeveyn ayarları
Sağ üstteki ⚙️ simgesine **basılı tut** (1,5 sn). Buradan isim, yakınlık ve **fotoğraf** eklenir/değişir,
küçük harf, ipucu, dönüşüm ve şaşırtmaca harf sayısı ayarlanır.
**Toplu ekle** kutusuna her satıra `İSİM - Yakınlık` yazıp aileyi bir kerede ekleyebilirsin.
Aile bilgisi bilerek kodda yok: isimler, fotoğraflar ve ilerleme yalnızca o cihazda (IndexedDB) saklanır.

## GitHub Pages'te yayınlama
1. Bu klasörün içeriğini bir depoya koy (ör. `kullanici.github.io/harflerim/` için ana sayfa deposunda `harflerim/` klasörü).
2. Depo › Settings › Pages › Branch: `main` / kök klasör.
3. Ana sayfaya bağlantı: `<a href="harflerim/">Harflerim</a>`.

## iPad'e uygulama gibi kurmak
1. Safari'de sayfayı aç › Paylaş › **Ana Ekrana Ekle**.
2. Uygulamayı ana ekrandan aç. Fotoğrafları **bu uygulamanın içinden** ekle
   (Safari ile ana ekran uygulamasının kayıtları ayrıdır).
3. Türkçe ses yoksa: Ayarlar › Erişilebilirlik › Seslendirilen İçerik › Sesler › Türkçe.

## Klon sesle kayıt eklemek
`sesler/` klasörüne ses dosyası koy ve `sesler/sesler.json` içine yazılan metinle eşleştir:

```json
{ "mum": "mum.mp3", "me": "me.mp3", "m": "m.mp3", "ağ": "ag.mp3" }
```

Anahtar, okunan metnin küçük harfli hâlidir; harf sesi için harfin kendisi (`"m"`). Kaydı olan metin dosyadan çalınır, olmayan cihazın sesiyle okunur.
Dosya adı yalnızca küçük harf, rakam, `-` ve `_` içerebilir (.mp3 .m4a .wav .ogg).

## Düzenleme
| Ne | Nerede |
|---|---|
| Harf → kelime | `harfler.js` (`HARFLER`) |
| Harf sesleri | `harfler.js` (`HARF_SES`) |
| Harf biçimli çizimler | `cizimler.js` (`TANIM`) |
| Karakter sesleri, harf sesleri | `ses.js` (`KARAKTER`, `FONEM`) |
| Karakter hareketleri | `stil.css` (`.cizim.canli.<ad>`) |
| Güncellemeden sonra | `sw.js` içindeki `ONBELLEK` sürümünü artır (ör. `harflerim-v4`) |
