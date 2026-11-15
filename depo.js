/* Cihazda kalıcı küçük depo (IndexedDB). Fotoğraflar burada durur, hiçbir yere gönderilmez. */
window.Depo = (() => {
  const DB_ADI = 'harflerim';
  const TABLO = 'kv';
  let dbSozu = null;

  function ac() {
    if (!dbSozu) {
      dbSozu = new Promise((resolve, reject) => {
        const istek = indexedDB.open(DB_ADI, 1);
        istek.onupgradeneeded = () => istek.result.createObjectStore(TABLO);
        istek.onsuccess = () => resolve(istek.result);
        istek.onerror = () => reject(istek.error || new Error('Depo açılamadı'));
      });
    }
    return dbSozu;
  }

  async function oku(anahtar) {
    const db = await ac();
    return new Promise((resolve, reject) => {
      const istek = db.transaction(TABLO).objectStore(TABLO).get(anahtar);
      istek.onsuccess = () => resolve(istek.result);
      istek.onerror = () => reject(istek.error);
    });
  }

  async function yaz(anahtar, deger) {
    const db = await ac();
    return new Promise((resolve, reject) => {
      const islem = db.transaction(TABLO, 'readwrite');
      islem.objectStore(TABLO).put(deger, anahtar);
      islem.oncomplete = () => resolve();
      islem.onerror = () => reject(islem.error || new Error('Kaydedilemedi'));
    });
  }

  return Object.freeze({ oku, yaz });
})();
