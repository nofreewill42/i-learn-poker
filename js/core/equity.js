/* i-learn-poker — kézértékelő és equity-számítás (kéz vs kéz / kéz vs range, Monte Carlo) */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  const RCHARS = '23456789TJQKA';
  const SCHARS = 'shdc';

  /** 'As' → 0..51 (rang*4 + szín), rang 0 = kettes, 12 = ász */
  function idx(card) {
    const r = RCHARS.indexOf(card[0].toUpperCase());
    const s = SCHARS.indexOf(card[1].toLowerCase());
    if (r < 0 || s < 0) throw new Error('Érvénytelen lap: ' + card);
    return r * 4 + s;
  }
  function str(i) {
    return RCHARS[i >> 2] + SCHARS[i & 3];
  }

  const cnt = new Int8Array(13);
  const sm = new Int32Array(4);

  function straightHigh(mask) {
    const m = ((mask << 1) | ((mask >> 12) & 1)) & 0x3fff; // az ász alul is
    for (let hi = 13; hi >= 4; hi--) if (((m >> (hi - 4)) & 0x1f) === 0x1f) return hi - 1; // 3 = ötös-sor … 12 = ász-sor
    return -1;
  }
  function topBits(mask, k) {
    let v = 0;
    let n = 0;
    for (let r = 12; r >= 0 && n < k; r--) {
      if (mask & (1 << r)) {
        v = (v << 4) | r;
        n++;
      }
    }
    while (n < k) {
      v <<= 4;
      n++;
    }
    return v;
  }

  /** 5–7 lapos kéz értéke (nagyobb = erősebb). */
  function evaluate(cards, len) {
    const L = len || cards.length;
    cnt.fill(0);
    sm[0] = sm[1] = sm[2] = sm[3] = 0;
    let rm = 0;
    for (let i = 0; i < L; i++) {
      const c = cards[i];
      const r = c >> 2;
      cnt[r]++;
      sm[c & 3] |= 1 << r;
      rm |= 1 << r;
    }
    let flushMask = 0;
    for (let s = 0; s < 4; s++) {
      let m = sm[s];
      let p = 0;
      while (m) {
        m &= m - 1;
        p++;
      }
      if (p >= 5) flushMask = sm[s];
    }
    if (flushMask) {
      const sf = straightHigh(flushMask);
      if (sf >= 0) return (8 << 20) | sf;
    }
    let quad = -1;
    let trip1 = -1;
    let trip2 = -1;
    let pair1 = -1;
    let pair2 = -1;
    for (let r = 12; r >= 0; r--) {
      const k = cnt[r];
      if (k === 4) quad = r;
      else if (k === 3) {
        if (trip1 < 0) trip1 = r;
        else if (trip2 < 0) trip2 = r;
      } else if (k === 2) {
        if (pair1 < 0) pair1 = r;
        else if (pair2 < 0) pair2 = r;
      }
    }
    if (quad >= 0) return (7 << 20) | (quad << 16) | (topBits(rm & ~(1 << quad), 1) << 12);
    if (trip1 >= 0 && (trip2 >= 0 || pair1 >= 0)) {
      const p = Math.max(trip2, pair1);
      return (6 << 20) | (trip1 << 16) | (p << 12);
    }
    if (flushMask) return (5 << 20) | topBits(flushMask, 5);
    const st = straightHigh(rm);
    if (st >= 0) return (4 << 20) | st;
    if (trip1 >= 0) return (3 << 20) | (trip1 << 16) | (topBits(rm & ~(1 << trip1), 2) << 8);
    if (pair1 >= 0 && pair2 >= 0) return (2 << 20) | (pair1 << 16) | (pair2 << 12) | (topBits(rm & ~(1 << pair1) & ~(1 << pair2), 1) << 8);
    if (pair1 >= 0) return (1 << 20) | (pair1 << 16) | (topBits(rm & ~(1 << pair1), 3) << 4);
    return topBits(rm, 5);
  }

  const CATEGORY_HU = ['magas lap', 'pár', 'két pár', 'drill', 'sor', 'flush', 'full', 'póker', 'színsor'];
  function category(score) {
    return CATEGORY_HU[score >> 20];
  }

  /** Egy kézosztály összes konkrét kombinációja (0..51 indexekkel), a halott lapok nélkül. */
  function combosOfClass(cls, deadMask) {
    const out = [];
    const r1 = RCHARS.indexOf(cls[0]);
    const r2 = RCHARS.indexOf(cls[1]);
    const t = cls[2];
    for (let s1 = 0; s1 < 4; s1++) {
      for (let s2 = 0; s2 < 4; s2++) {
        if (cls.length === 2 && s2 <= s1) continue;
        if (t === 's' && s1 !== s2) continue;
        if (t === 'o' && s1 === s2) continue;
        const a = r1 * 4 + s1;
        const b = r2 * 4 + s2;
        if (deadMask[a] || deadMask[b]) continue;
        out.push([a, b]);
      }
    }
    return out;
  }

  function rng(seed) {
    if (seed == null) return Math.random;
    let x = seed >>> 0 || 1;
    return function () {
      x ^= x << 13;
      x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;
      x >>>= 0;
      return x / 4294967296;
    };
  }

  /**
   * Equity: hős két lapja egy konkrét kéz vagy egy range ellen.
   * o: { hero: ['Kc','Jd'], villain: ['Ah','Qs'] | null, range: Set|string, board: [], trials, seed }
   */
  function vs(o) {
    const R = rng(o.seed);
    const hero = o.hero.map(idx);
    const board = (o.board || []).map(idx);
    const dead = new Uint8Array(52);
    hero.concat(board).forEach((c) => {
      if (dead[c]) throw new Error('Ismétlődő lap: ' + str(c));
      dead[c] = 1;
    });
    let combos;
    if (o.villain) {
      const v = o.villain.map(idx);
      v.forEach((c) => {
        if (dead[c]) throw new Error('Ismétlődő lap: ' + str(c));
      });
      combos = [v];
    } else {
      const set = typeof o.range === 'string' ? PK.ranges.parse(o.range) : o.range;
      combos = [];
      set.forEach((cls) => {
        combosOfClass(cls, dead).forEach((cb) => combos.push(cb));
      });
    }
    if (!combos.length) throw new Error('Az ellenfél range-e üres (vagy minden kombinációt blokkolsz).');
    const trials = o.trials || 20000;
    const need = 5 - board.length;
    const deck = [];
    const h7 = new Int32Array(7);
    const v7 = new Int32Array(7);
    for (let i = 0; i < board.length; i++) {
      h7[2 + i] = board[i];
      v7[2 + i] = board[i];
    }
    h7[0] = hero[0];
    h7[1] = hero[1];
    let win = 0;
    let tie = 0;
    for (let t = 0; t < trials; t++) {
      const vc = combos[Math.floor(R() * combos.length)];
      v7[0] = vc[0];
      v7[1] = vc[1];
      deck.length = 0;
      for (let c = 0; c < 52; c++) if (!dead[c] && c !== vc[0] && c !== vc[1]) deck.push(c);
      for (let k = 0; k < need; k++) {
        const j = k + Math.floor(R() * (deck.length - k));
        const tmp = deck[k];
        deck[k] = deck[j];
        deck[j] = tmp;
        h7[2 + board.length + k] = deck[k];
        v7[2 + board.length + k] = deck[k];
      }
      const a = evaluate(h7, 7);
      const b = evaluate(v7, 7);
      if (a > b) win++;
      else if (a === b) tie++;
    }
    return { eq: (win + tie / 2) / trials, win: win / trials, tie: tie / trials, trials, combos: combos.length };
  }

  PK.equity = { idx, str, evaluate, category, combosOfClass, vs };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.equity;
})(typeof window !== 'undefined' ? window : globalThis);
