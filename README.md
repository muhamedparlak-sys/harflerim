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
  nesneye dönüşür ve hareket eder (B baykuş, E erik dalı, F dik diş fırçası, M martı olup uçar …).
  Harf hiç yatmaz, hep okunur kalır; karakter harfin etrafında döner (`susDonus`).
- **Harf sesleri**: sessizler adıyla değil sesiyle çalınır ("me" değil "mı"; tek sefer, tekrar yok).
  Cihaz sesi kısa hece okur ("mı", "kı"); klon sesle kayıt varsa o çalar (en iyisi bu).
  Ünlüsüz tarayıcı sentezi (`ses.js` → `FONEM`) hoparlörde kısık kaldığı için kapalı (`SENTEZLE = false`).
- Oyunlar: Harf Avı (sesi dinle, balonu patlat), Canavar (harfli kurabiyeleri yer, istemediğini tükürür; her lokmada şişer, turun sonunda patlar),
  Bilmece (tersten: resimlerin ilk seslerinden kelimeyi ya da aile adını bul), Çıkartma Albümü.
- **Kasaba** (kendi karakteri): ten, saç, göz, elbise seçilir; her satır kilitli, kelimesi yazılınca açılır (TEN, SAÇ, GÖZ, ELBİSE).
  Kız apartmandan çıkar, sokakta yürür. Kapılar şifreli: **KUAFÖR**, **EV**, **ODA** harf harf yazılınca açılır (soluk harfler yol gösterir).
  Kuaförde saç örülür (ses hangi harfi söylüyorsa o tokalı tutam ortaya atılır, her atış sayılır: bir … altı),
  beş tırnak boyanır ve sayılır, üflenip kurutulur, sonra aynaya bakılır. Evde koridor, oda, dolap ve yatak var.
  Restoranda "Kaç kişisiniz?" sorulur, misafirler ve tabaklar sayılır, pizza ya da pasta kişi sayısı kadar dilimlenir ve paylaştırılır.
  Hastanede (şifre HASTANE) hasta ayıcığın kalbi dinlenip atışlar sayılır, yaralara bant yapıştırılırken sayılır, duyulan harfin şurup şişesi bulunur ve reçetedeki rakam kadar kaşık verilir.
  Plajda (şifre PLAJ) kartta yazan kadar pompalanıp simit şişirilir, duyulan harfin şamandırasına üç tur yüzülür, kartta yazan kadar kabuk toplanır.
  Sokak yana kaydırılır; yerler eşit aralıkla dizilir, yeni yer YERLER listesine eklenir. Sonraki yerler: okul, park, tenis.
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
| Kendi karakteri (kız) | `kiz.js` |
| Kasaba, kapı şifreleri, kuaför, ev | `kasaba.js`, `kasaba.css` |
| Restoran | `restoran.js` |
| Hastane | `hastane.js` |
| Plaj | `plaj.js` |
| Güncellemeden sonra | `sw.js` içindeki `ONBELLEK` sürümünü artır (ör. `harflerim-v4`) |
