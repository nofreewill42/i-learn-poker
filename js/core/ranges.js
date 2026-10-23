/* i-learn-poker — range-jelölés értelmezése ('22+, A4s+, ATo+, Ax, Qx+ …') */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  const R = 'AKQJT98765432';
  const ri = (r) => R.indexOf(r);

  function pairsFrom(lo, hi) {
    // lo, hi: rangindex (kisebb index = erősebb)
    const out = [];
    for (let i = hi; i <= lo; i++) out.push(R[i] + R[i]);
    return out;
  }

  /** Nem pár kezek: magas lap fix, kicker a [kLoIdx, kHiIdx] rangindex-tartományban. */
  function kickers(high, kHiIdx, kLoIdx, kinds) {
    const out = [];
    const h = ri(high);
    for (let k = Math.max(kHiIdx, h + 1); k <= kLoIdx; k++) {
      for (const t of kinds) out.push(high + R[k] + t);
    }
    return out;
  }

  /** Egy tokent kézosztályok listájává alakít; ismeretlen tokenre hibát dob. */
  function expandToken(tok) {
    const t = tok.trim().replace(/\s+/g, '');
    if (!t) return [];
    let m;

    // Pár: 'QQ', '77+', '22-66'
    if ((m = /^([AKQJT2-9])\1$/i.exec(t))) return [m[1].toUpperCase().repeat(2)];
    if ((m = /^([AKQJT2-9])\1\+$/i.exec(t))) return pairsFrom(ri(m[1].toUpperCase()), 0);
    if ((m = /^([AKQJT2-9])\1-([AKQJT2-9])\2$/i.exec(t))) {
      const a = ri(m[1].toUpperCase());
      const b = ri(m[2].toUpperCase());
      return pairsFrom(Math.max(a, b), Math.min(a, b));
    }

    // 'Ax', 'Axs', 'Axo' — az adott magas lap minden kickerrel; 'Qx+' — Q, K vagy A magas lappal mindent
    if ((m = /^([AKQJT2-9])x([so]?)(\+?)$/i.exec(t))) {
      const hi = m[1].toUpperCase();
      const kinds = m[2] ? [m[2].toLowerCase()] : ['s', 'o'];
      const highs = m[3] ? R.slice(0, ri(hi) + 1).split('') : [hi];
      let out = [];
      for (const h of highs) out = out.concat(kickers(h, ri(h) + 1, 12, kinds));
      return out;
    }

    // Nem pár: 'AKs', 'AKo', 'AK', 'A4s+', 'K9+', 'A2s-A5s'
    if ((m = /^([AKQJT2-9])([AKQJT2-9])([so]?)(\+?)$/i.exec(t))) {
      const a = m[1].toUpperCase();
      const b = m[2].toUpperCase();
      if (a === b) throw new Error('Érvénytelen range-elem: ' + tok);
      const [hi, lo] = ri(a) < ri(b) ? [a, b] : [b, a];
      const kinds = m[3] ? [m[3].toLowerCase()] : ['s', 'o'];
      if (m[4]) return kickers(hi, ri(hi) + 1, ri(lo), kinds);
      return kinds.map((k) => hi + lo + k);
    }
    if ((m = /^([AKQJT2-9])([AKQJT2-9])([so]?)-([AKQJT2-9])([AKQJT2-9])([so]?)$/i.exec(t))) {
      const h1 = m[1].toUpperCase();
      const h2 = m[4].toUpperCase();
      if (h1 !== h2) throw new Error('A tartomány két végének ugyanaz legyen a magas lapja: ' + tok);
      const k1 = ri(m[2].toUpperCase());
      const k2 = ri(m[5].toUpperCase());
      const kinds = m[3] ? [m[3].toLowerCase()] : ['s', 'o'];
      return kickers(h1, Math.min(k1, k2), Math.max(k1, k2), kinds);
    }
    throw new Error('Ismeretlen range-elem: ' + tok);
  }

  /** Range-szöveg → kézosztályok halmaza (Set). */
  function parse(str) {
    const set = new Set();
    String(str || '')
      .split(/[,;]/)
      .forEach((tok) => {
        if (tok.trim()) expandToken(tok).forEach((c) => set.add(c));
      });
    return set;
  }

  function combosOf(set) {
    let n = 0;
    set.forEach((c) => {
      n += c.length === 2 ? 6 : c[2] === 's' ? 4 : 12;
    });
    return n;
  }

  function pctOf(set) {
    return combosOf(set) / 1326;
  }

  /** A rácsban szomszédos osztályok (kicker ±1, párnál rang ±1, s/o párja). */
  function neighbors(cls) {
    const out = [];
    if (cls.length === 2) {
      const i = ri(cls[0]);
      if (i > 0) out.push(R[i - 1] + R[i - 1]);
      if (i < 12) out.push(R[i + 1] + R[i + 1]);
      return out;
    }
    const h = ri(cls[0]);
    const k = ri(cls[1]);
    const t = cls[2];
    if (k - 1 > h) out.push(cls[0] + R[k - 1] + t);
    if (k + 1 <= 12) out.push(cls[0] + R[k + 1] + t);
    out.push(cls[0] + cls[1] + (t === 's' ? 'o' : 's'));
    return out;
  }

  /** Határeset: a range szélén lévő kéz (egy szomszédja a másik oldalon van). */
  function isBorder(set, cls) {
    const inside = set.has(cls);
    return neighbors(cls).some((n) => set.has(n) !== inside);
  }

  PK.ranges = { parse, expandToken, combosOf, pctOf, neighbors, isBorder };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.ranges;
})(typeof window !== 'undefined' ? window : globalThis);
