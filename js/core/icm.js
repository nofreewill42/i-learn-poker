/* i-learn-poker — ICM (Malmuth–Harville), bubble factor, risk premium, deal-összehasonlítás */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});

  function popcount(x) {
    let c = 0;
    while (x) {
      x &= x - 1;
      c++;
    }
    return c;
  }

  /**
   * ICM-érték játékosonként (Malmuth–Harville).
   * stacks: a még versenyben lévő játékosok zsetonjai; payouts: díjak helyezés szerint (1., 2., …).
   * A 0 zsetonú játékos ebben a kézben esett ki: az utolsó helyek díját kapja (több kiesőnél egyenlően osztva) —
   * így pl. egy döntőasztali bukás a 7. hely díját éri, nem nullát.
   */
  function equity(stacks, payouts) {
    const N = stacks.length;
    const idx = [];
    const busted = [];
    stacks.forEach((s, i) => {
      if (s > 0) idx.push(i);
      else busted.push(i);
    });
    const m = idx.length;
    if (m > 16) throw new Error('Legfeljebb 16 játékosra számolok ICM-et.');
    const all = (payouts || []).slice(0, N).map(Number);
    while (all.length < N) all.push(0);
    const P = all.slice(0, m);
    const bottomShare = busted.length ? all.slice(m).reduce((a, b) => a + b, 0) / busted.length : 0;
    const st = idx.map((i) => stacks[i]);
    const memo = new Map();

    function rec(mask) {
      const hit = memo.get(mask);
      if (hit) return hit;
      const res = new Float64Array(m);
      const k = popcount(mask);
      const place = m - k;
      let restPay = 0;
      for (let p = place; p < m; p++) restPay += Math.abs(P[p]);
      if (k === 0 || restPay === 0) {
        memo.set(mask, res);
        return res;
      }
      let total = 0;
      for (let j = 0; j < m; j++) if (mask & (1 << j)) total += st[j];
      for (let j = 0; j < m; j++) {
        if (!(mask & (1 << j))) continue;
        const p = st[j] / total;
        res[j] += p * P[place];
        const sub = rec(mask & ~(1 << j));
        for (let q = 0; q < m; q++) res[q] += p * sub[q];
      }
      memo.set(mask, res);
      return res;
    }

    const r = m ? rec((1 << m) - 1) : new Float64Array(0);
    const out = stacks.map(() => 0);
    idx.forEach((i, j) => {
      out[i] = r[j];
    });
    busted.forEach((i) => {
      out[i] = bottomShare;
    });
    return out;
  }

  /** Helyezési valószínűségek (place[i][k] = i. játékos k+1. helyen végez). */
  function placeProbs(stacks) {
    const n = stacks.length;
    return stacks.map((_, i) => {
      const row = [];
      for (let k = 0; k < n; k++) {
        const pay = stacks.map((__, j) => (j === k ? 1 : 0));
        row.push(equity(stacks, pay)[i]);
      }
      return row;
    });
  }

  /**
   * „Klasszikus” bubble factor: a hős és egy ellenfél all-in ütközése holt pénz nélkül.
   * BF = (veszteség ha bukik) / (nyereség ha nyer); RP = BF/(BF+1) − 50%.
   */
  function bubbleFactor(stacks, payouts, hero, villain) {
    const E = Math.min(stacks[hero], stacks[villain]);
    const now = equity(stacks, payouts)[hero];
    const w = stacks.slice();
    w[hero] += E;
    w[villain] -= E;
    const l = stacks.slice();
    l[hero] -= E;
    l[villain] += E;
    const win = equity(w, payouts)[hero];
    const lose = equity(l, payouts)[hero];
    const gain = win - now;
    const loss = now - lose;
    const bf = gain > 0 ? loss / gain : Infinity;
    const need = isFinite(bf) ? bf / (bf + 1) : 1;
    return { bf, need, rp: need - 0.5, now, win, lose, risked: E };
  }

  /**
   * All-in hívás ICM alatt. A hős és a jammelő ellenfél stackje a kéz ELEJÉN; a többiek stackje
   * a kényszerbetétek UTÁN (a holt pénz tőlük származik).
   * heroBlind: a hős által már betett vak (beszámít a hívásba); heroAnte: a hős holt antéja (BBA);
   * dead: a többiek holt pénze a potban (pl. SB, ante).
   */
  function callAllIn(o) {
    const stacks = o.stacks.map(Number);
    const h = o.hero;
    const v = o.villain;
    const hb = Number(o.heroBlind || 0);
    const ha = Number(o.heroAnte || 0);
    const D = Number(o.dead || 0);
    const H = stacks[h];
    const V = stacks[v];
    const E = Math.min(H - ha, V);
    if (!(E > hb)) throw new Error('A hős stackje túl kicsi ehhez a számításhoz.');

    const fold = stacks.slice();
    fold[h] = H - hb - ha;
    fold[v] = V + hb + ha + D;
    const win = stacks.slice();
    win[h] = H + E + D;
    win[v] = V - E;
    const lose = stacks.slice();
    lose[h] = H - ha - E;
    lose[v] = V + E + ha + D;

    const P = o.payouts;
    const evFold = equity(fold, P)[h];
    const evWin = equity(win, P)[h];
    const evLose = equity(lose, P)[h];
    const needIcm = (evFold - evLose) / (evWin - evLose);
    const callAmt = E - hb;
    const finalPot = 2 * E + ha + D;
    const needChip = callAmt / finalPot;
    return {
      evFold,
      evWin,
      evLose,
      needIcm,
      needChip,
      rp: needIcm - needChip,
      callAmt,
      finalPot,
      risked: E,
      chips: { fold: fold[h], win: win[h], lose: lose[h] },
    };
  }

  /** Deal-összehasonlítás: ICM vs chip chop (mindenki a legkisebb díjat kapja, a maradék zsetonarányosan). */
  function deals(stacks, payouts) {
    const n = stacks.length;
    const P = payouts.slice(0, n);
    while (P.length < n) P.push(0);
    const pool = P.reduce((a, b) => a + b, 0);
    const minPay = Math.min.apply(null, P);
    const total = stacks.reduce((a, b) => a + b, 0);
    const icm = equity(stacks, P);
    const chip = stacks.map((s) => minPay + (pool - minPay * n) * (s / total));
    return { icm, chip, pool };
  }

  PK.icm = { equity, placeProbs, bubbleFactor, callAllIn, deals };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.icm;
})(typeof window !== 'undefined' ? window : globalThis);
