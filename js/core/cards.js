/* i-learn-poker — kártyák és kézosztályok (AKs, 77, T9o …) */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});

  const RANKS = 'AKQJT98765432'; // erősség szerint csökkenő
  const SUITS = 'shdc';
  const SUIT_SYM = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const SUIT_NAME = { s: 'pikk', h: 'kőr', d: 'káró', c: 'treff' };

  function rankIndex(r) {
    return RANKS.indexOf(r);
  }

  /** 'As' → { r: 'A', s: 's' }; hibás bemenetre null. A '10' rangot is elfogadja. */
  function parse(card) {
    if (!card) return null;
    let c = String(card).trim();
    if (/^10[shdc]$/i.test(c)) c = 'T' + c.slice(2);
    if (c.length !== 2) return null;
    const r = c[0].toUpperCase();
    const s = c[1].toLowerCase();
    if (RANKS.indexOf(r) < 0 || SUITS.indexOf(s) < 0) return null;
    return { r, s };
  }

  function isValid(card) {
    return parse(card) !== null;
  }

  function rankLabel(r) {
    return r === 'T' ? '10' : r;
  }

  /** Két lapból kézosztály: 'AKs', 'AKo' vagy 'QQ' (a magasabb rang elöl). */
  function handClass(c1, c2) {
    const a = parse(c1);
    const b = parse(c2);
    if (!a || !b) return null;
    if (a.r === b.r) return a.r + b.r;
    const [hi, lo] = rankIndex(a.r) < rankIndex(b.r) ? [a, b] : [b, a];
    return hi.r + lo.r + (a.s === b.s ? 's' : 'o');
  }

  /** A 169 kézosztály a szokásos 13×13 rácsban: a főátló párok, felette suited, alatta offsuit. */
  function gridClass(row, col) {
    const a = RANKS[row];
    const b = RANKS[col];
    if (row === col) return a + b;
    if (row < col) return a + b + 's';
    return b + a + 'o';
  }

  function allClasses() {
    const out = [];
    for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) out.push(gridClass(i, j));
    return out;
  }

  function combos(cls) {
    if (cls.length === 2) return 6;
    return cls[2] === 's' ? 4 : 12;
  }

  /** Egy véletlen konkrét lappár, ami a megadott kézosztályhoz tartozik. */
  function cardsForClass(cls, rnd) {
    const r = rnd || Math.random;
    const suits = SUITS.split('');
    const s1 = suits[Math.floor(r() * 4)];
    if (cls.length === 2) {
      const rest = suits.filter((s) => s !== s1);
      return [cls[0] + s1, cls[1] + rest[Math.floor(r() * 3)]];
    }
    if (cls[2] === 's') return [cls[0] + s1, cls[1] + s1];
    const rest = suits.filter((s) => s !== s1);
    return [cls[0] + s1, cls[1] + rest[Math.floor(r() * 3)]];
  }

  /** Lap HTML-ként. opts.size: 'sm' | 'md' | 'lg'; opts.back: lefordított lap. */
  function html(card, opts) {
    const o = opts || {};
    const size = o.size || 'md';
    if (o.back) return '<span class="card card--back card--' + size + '" aria-label="lefordított lap"></span>';
    const p = parse(card);
    if (!p) return '<span class="card card--empty card--' + size + '" aria-hidden="true"></span>';
    const label = rankLabel(p.r) + ' ' + SUIT_NAME[p.s];
    return (
      '<span class="card card--' + size + ' suit-' + p.s + '" role="img" aria-label="' + label + '">' +
      '<span class="card__rank">' + rankLabel(p.r) + '</span>' +
      '<span class="card__suit">' + SUIT_SYM[p.s] + '</span>' +
      '</span>'
    );
  }

  /** Szöveges forma, pl. 'A♠ 9♦'. */
  function text(cards) {
    return (cards || [])
      .map((c) => {
        const p = parse(c);
        return p ? rankLabel(p.r) + SUIT_SYM[p.s] : '?';
      })
      .join(' ');
  }

  /** Lapok kinyerése szabad szövegből: 'AsKd', 'A♠ K♦', 'ah kc 2d' → ['As','Kd'] */
  function parseMany(str) {
    if (!str) return [];
    const map = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
    const s = String(str).replace(/[♠♥♦♣]/g, (m) => map[m]).replace(/10/g, 'T');
    const out = [];
    const re = /([AKQJT2-9])\s*([shdc])/gi;
    let m;
    while ((m = re.exec(s))) out.push(m[1].toUpperCase() + m[2].toLowerCase());
    return out;
  }

  PK.cards = {
    RANKS,
    SUITS,
    SUIT_SYM,
    SUIT_NAME,
    rankIndex,
    parse,
    isValid,
    rankLabel,
    handClass,
    gridClass,
    allClasses,
    combos,
    cardsForClass,
    html,
    text,
    parseMany,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.cards;
})(typeof window !== 'undefined' ? window : globalThis);
