/* i-learn-poker — közös segédfüggvények (böngészőben és Node-ban is fut) */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  /** HTML-escape — minden felhasználói vagy importált szöveg így kerül a DOM-ba. */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC[c]);
  }

  function uid(prefix) {
    return (prefix || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /** Kisbetű, ékezetek nélkül, egységes szóközökkel — a kulcsszó-felismeréshez. */
  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[“”„"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Mint a norm, de karakterenként: a kimenet pontosan olyan hosszú, mint a bemenet (idézetek kivágásához). */
  function normKeep(s) {
    let out = '';
    for (const ch of String(s || '')) {
      if (/\s/.test(ch) || /[“”„"]/.test(ch)) {
        out += ' ';
        continue;
      }
      const b = ch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      out += b.length ? b[0] : ' ';
      if (ch.length === 2) out += ' '; // UTF-16 párok: a hossz maradjon azonos
    }
    return out;
  }

  /** Egységes alak a felismeréshez: NFC, egyszeres szóközök. */
  function tidy(s) {
    return String(s || '')
      .normalize('NFC')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function round(x, d) {
    const m = Math.pow(10, d || 0);
    return Math.round((x + Number.EPSILON) * m) / m;
  }

  /** Magyar számformátum: tizedesvessző, ezres tagolás nem törő szóközzel. */
  function num(x, maxDec) {
    if (x == null || !isFinite(x)) return '–';
    const d = maxDec == null ? 1 : maxDec;
    const v = round(x, d);
    let s = v.toFixed(d);
    if (d > 0) s = s.replace(/\.?0+$/, '');
    const neg = s.startsWith('-');
    if (neg) s = s.slice(1);
    let [int, frac] = s.split('.');
    if (int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '−' : '') + int + (frac ? ',' + frac : '');
  }

  function bb(x, maxDec) {
    return num(x, maxDec == null ? 1 : maxDec) + 'bb';
  }

  function pct(frac, dec) {
    if (frac == null || !isFinite(frac)) return '–';
    return num(frac * 100, dec == null ? 1 : dec) + '%';
  }

  function ft(x) {
    if (x == null || !isFinite(x)) return '–';
    return num(Math.round(x), 0).replace(/(\d)(?=(\d{3})+$)/g, '$1 ') + ' Ft';
  }

  // ---- dátumok (helyi idő) ----
  function pad(n) {
    return String(n).padStart(2, '0');
  }
  function isoDate(d) {
    const x = d ? new Date(d) : new Date();
    return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
  }
  function startOfWeek(d) {
    const x = d ? new Date(d) : new Date();
    const day = (x.getDay() + 6) % 7; // hétfő = 0
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - day);
    return x;
  }
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function daysBetween(a, b) {
    const A = new Date(a);
    const B = new Date(b);
    A.setHours(0, 0, 0, 0);
    B.setHours(0, 0, 0, 0);
    return Math.round((B - A) / 86400000);
  }
  const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
  function dateHu(d) {
    const x = new Date(d);
    if (isNaN(x)) return '–';
    return x.getFullYear() + '. ' + MONTHS[x.getMonth()] + ' ' + x.getDate() + '.';
  }
  function dateTimeHu(d) {
    const x = new Date(d);
    if (isNaN(x)) return '–';
    return dateHu(x) + ' ' + pad(x.getHours()) + ':' + pad(x.getMinutes());
  }

  function shuffle(arr, rnd) {
    const r = rnd || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr, rnd) {
    return arr[Math.floor((rnd || Math.random)() * arr.length)];
  }

  function debounce(fn, ms) {
    let t = null;
    const f = function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
    f.flush = function () {
      clearTimeout(t);
      fn();
    };
    return f;
  }

  PK.util = {
    esc,
    uid,
    norm,
    normKeep,
    tidy,
    clamp,
    round,
    num,
    bb,
    pct,
    ft,
    isoDate,
    startOfWeek,
    addDays,
    daysBetween,
    dateHu,
    dateTimeHu,
    shuffle,
    pick,
    debounce,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.util;
})(typeof window !== 'undefined' ? window : globalThis);
