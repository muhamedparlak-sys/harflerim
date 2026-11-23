/* Çevrimdışı çalışma: önbellekten hemen aç, arkada yenisini indir (bir sonraki açılışta güncel). */
const ONBELLEK = 'harflerim-v28';
const DOSYALAR = [
  './', 'index.html', 'stil.css', 'harfler.js', 'depo.js', 'ses.js', 'gorsel.js', 'cizimler.js', 'oyunlar.js', 'kiz.js', 'restoran.js', 'hastane.js', 'plaj.js', 'yaz.js', 'agac.js', 'yeniyil.js', 'haftam.js', 'ev.js', 'kasaba.js', 'kasaba.css', 'app.js',
  'manifest.webmanifest', 'simgeler/simge-192.png', 'simgeler/simge-512.png', 'simgeler/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(ONBELLEK).then((c) => c.addAll(DOSYALAR.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((anahtarlar) => Promise.all(anahtarlar.filter((k) => k !== ONBELLEK).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const istek = e.request;
  if (istek.method !== 'GET' || new URL(istek.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(ONBELLEK).then(async (c) => {
    const eski = await c.match(istek);
    const yeni = fetch(istek)
      .then((yanit) => { if (yanit.ok) c.put(istek, yanit.clone()); return yanit; })
      .catch(() => eski);
    return eski || yeni;
  }));
});
