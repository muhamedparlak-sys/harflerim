/* Görsel ödüller: konfeti, uçan kalpler, ışıltı patlaması, taç. */
window.Gorsel = (() => {
  const RENKLER = ['#FF6F61', '#FFB703', '#1D63D8', '#E0363A', '#2EC4B6', '#9B5DE5'];
  const KONFETI_MS = 3500;
  const rastgele = (a, b) => a + Math.random() * (b - a);

  function konfeti() {
    const tuval = document.getElementById('konfeti');
    const c = tuval.getContext('2d');
    const oran = Math.min(2, window.devicePixelRatio || 1);
    const W = innerWidth;
    const H = innerHeight;
    tuval.width = W * oran;
    tuval.height = H * oran;
    c.scale(oran, oran);
    const parcalar = Array.from({ length: 170 }, () => ({
      x: W / 2 + rastgele(-120, 120), y: H * 0.45,
      vx: rastgele(-8, 8), vy: rastgele(-20, -6),
      r: rastgele(4, 10), renk: RENKLER[(Math.random() * RENKLER.length) | 0],
      don: rastgele(0, 6), vd: rastgele(-0.3, 0.3),
    }));
    const bas = performance.now();
    tuval.hidden = false;
    const kare = (simdi) => {
      c.clearRect(0, 0, W, H);
      for (const p of parcalar) {
        p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.don += p.vd;
        c.save(); c.translate(p.x, p.y); c.rotate(p.don);
        c.fillStyle = p.renk; c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        c.restore();
      }
      if (simdi - bas < KONFETI_MS) requestAnimationFrame(kare);
      else { c.clearRect(0, 0, W, H); tuval.hidden = true; }
    };
    requestAnimationFrame(kare);
  }

  /** Bir öğenin üstünden yukarı süzülen kalpler. */
  function kalpler(hedef, adet = 4) {
    if (!hedef) return;
    const r = hedef.getBoundingClientRect();
    for (let i = 0; i < adet; i += 1) {
      const k = document.createElement('span');
      k.className = 'ucan-kalp';
      k.textContent = ['❤️', '💖', '💕', '💗'][i % 4];
      k.style.left = `${r.left + rastgele(r.width * 0.15, r.width * 0.85)}px`;
      k.style.top = `${r.top + r.height * 0.35}px`;
      document.body.append(k);
      const yukselis = rastgele(160, 280);
      const salinim = rastgele(-50, 50);
      k.animate([
        { transform: 'translate(-50%, 0) scale(.3)', opacity: 0 },
        { transform: `translate(calc(-50% + ${salinim * 0.4}px), -${yukselis * 0.3}px) scale(1.15)`, opacity: 1, offset: 0.25 },
        { transform: `translate(calc(-50% + ${salinim}px), -${yukselis}px) scale(.9)`, opacity: 0 },
      ], { duration: rastgele(1300, 1900), delay: i * 110, easing: 'ease-out', fill: 'both' })
        .finished.finally(() => k.remove());
    }
  }

  /** Harf dönüşümünde merkezden saçılan ışıltılar. */
  function isilti(kap, adet = 14) {
    for (let i = 0; i < adet; i += 1) {
      const s = document.createElement('i');
      s.style.background = RENKLER[i % RENKLER.length];
      kap.append(s);
      const aci = (i / adet) * Math.PI * 2 + rastgele(-0.2, 0.2);
      const uzak = rastgele(140, 260);
      s.animate([
        { transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(aci) * uzak}px), calc(-50% + ${Math.sin(aci) * uzak}px)) scale(1)`, opacity: 0 },
      ], { duration: rastgele(600, 900), easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'both' });
    }
  }

  /** Taç yukarıdan düşüp fotoğrafın başına oturur. */
  function tacTak(tac) {
    if (!tac) return;
    tac.hidden = false;
    tac.animate([
      { transform: 'translate(-50%, -260px) rotate(-30deg) scale(1.6)', opacity: 0 },
      { transform: 'translate(-50%, 12px) rotate(8deg) scale(1)', opacity: 1, offset: 0.65 },
      { transform: 'translate(-50%, -6px) rotate(-4deg) scale(1.05)', offset: 0.82 },
      { transform: 'translate(-50%, 0) rotate(-6deg) scale(1)', opacity: 1 },
    ], { duration: 1100, easing: 'ease-out', fill: 'both' });
  }

  /** Ekranda oraya buraya kaçış (örümcek, ipucu karakterleri), sonunda yerine döner. */
  function kacis(el, adim = 6) {
    const kare = [{ transform: 'none' }];
    for (let i = 0; i < adim; i += 1) {
      kare.push({ transform: `translate(${rastgele(-36, 36).toFixed(1)}vw, ${rastgele(-28, 28).toFixed(1)}vh) rotate(${rastgele(-25, 25).toFixed(0)}deg) scale(.55)` });
    }
    kare.push({ transform: 'none' });
    return el.animate(kare, { duration: adim * 430, easing: 'ease-in-out' }).finished;
  }

  return Object.freeze({ konfeti, kalpler, isilti, tacTak, kacis });
})();
