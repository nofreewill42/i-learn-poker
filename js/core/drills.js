/* i-learn-poker — villámdrillek: push/fold (10bb) és pot odds */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});

  // ---- push/fold ----
  let cache = null;
  function chartSets() {
    if (cache) return cache;
    const C = PK.data.charts;
    const all = PK.cards.allClasses();
    const mk = (row, kind) => {
      const set = PK.ranges.parse(row.range);
      const border = all.filter((c) => PK.ranges.isBorder(set, c));
      return { kind, pos: row.pos, ten: row.ten, pct: row.pct, range: row.range, set, border };
    };
    cache = {
      shove: C.pf10.rows.map((r) => mk(r, 'shove')),
      call: C.call10.rows.map((r) => mk(r, 'call')),
    };
    return cache;
  }

  function weightedClass(rnd) {
    // kombinációszám szerint súlyozott véletlen kézosztály (mint a valódi osztásnál)
    let x = Math.floor(rnd() * 1326);
    for (const c of PK.cards.allClasses()) {
      x -= PK.cards.combos(c);
      if (x < 0) return c;
    }
    return '72o';
  }

  /** opts.kind: 'shove' | 'call' | 'mix'; opts.pos: szűrés pozícióra (opcionális) */
  function pushFold(opts, rnd) {
    const r = rnd || Math.random;
    const o = opts || {};
    const sets = chartSets();
    let kind = o.kind || 'shove';
    if (kind === 'mix') kind = r() < 0.75 ? 'shove' : 'call';
    let pool = sets[kind];
    if (o.pos) {
      const f = pool.filter((p) => p.pos === o.pos);
      if (f.length) pool = f;
    }
    const chart = pool[Math.floor(r() * pool.length)];
    const cls = r() < 0.6 && chart.border.length ? chart.border[Math.floor(r() * chart.border.length)] : weightedClass(r);
    const cards = PK.cards.cardsForClass(cls, r);
    const yes = chart.set.has(cls);
    return {
      kind,
      pos: chart.pos,
      ten: chart.ten,
      pct: chart.pct,
      range: chart.range,
      cls,
      cards,
      answer: yes ? (kind === 'shove' ? 'shove' : 'call') : 'fold',
      border: PK.ranges.isBorder(chart.set, cls),
      set: chart.set,
    };
  }

  // ---- pot odds ----
  const fmtP = (x) => Math.round(x * 100) + '%';

  function choicesAround(correct, distractors, rnd) {
    const vals = [correct];
    const add = (v) => {
      if (v > 0.01 && v < 0.99 && vals.every((w) => Math.abs(w - v) >= 0.04)) vals.push(v);
    };
    distractors.forEach(add);
    let guard = 0;
    while (vals.length < 4 && guard++ < 50) add(correct + (rnd() < 0.5 ? -1 : 1) * (0.05 + rnd() * 0.12));
    const shuffled = PK.util.shuffle(vals, rnd);
    return { choices: shuffled.map((v) => ({ label: fmtP(v), v })), answer: shuffled.indexOf(correct) };
  }

  const nCr = (n, k) => {
    let r = 1;
    for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
    return r;
  };

  function potOdds(rnd) {
    const r = rnd || Math.random;
    const N = PK.util.num;
    const type = Math.floor(r() * 5);
    if (type === 0) {
      const P = PK.util.pick([4, 5, 6, 8, 10, 12, 15, 20, 24], r);
      const f = PK.util.pick([0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5], r);
      const B = Math.round(P * f * 2) / 2;
      const need = B / (P + 2 * B);
      const c = choicesAround(need, [B / (P + B), B / P], r);
      return {
        type: 'call',
        prompt: `A potban ${N(P)}bb van, az ellenfél ${N(B)}bb-t betel. Hány % equity kell a hívásodhoz?`,
        ...c,
        explain: `Hívás / végső pot = ${N(B)} / (${N(P)} + ${N(B)} + ${N(B)}) = ${N(B)} / ${N(P + 2 * B)} = ${PK.util.pct(need)}. Gyakori hiba a saját hívást kihagyni a nevezőből: ${N(B)} / ${N(P + B)} = ${PK.util.pct(B / (P + B))}.`,
      };
    }
    if (type === 1) {
      const P = PK.util.pick([4, 6, 8, 10, 12, 16, 20], r);
      const f = PK.util.pick([1 / 3, 0.5, 2 / 3, 0.75, 1, 1.25], r);
      const B = Math.round(P * f * 2) / 2;
      const need = B / (P + B);
      const c = choicesAround(need, [B / (P + 2 * B), B / P], r);
      return {
        type: 'bluff',
        prompt: `Blöffölsz: ${N(B)}bb-t betelsz egy ${N(P)}bb-s potba. Milyen gyakran kell dobnia az ellenfélnek, hogy a blöff nullszaldós legyen?`,
        ...c,
        explain: `Kockáztatott / (kockáztatott + nyerhető) = ${N(B)} / (${N(B)} + ${N(P)}) = ${PK.util.pct(need)}. Minél nagyobb a bet a pothoz képest, annál gyakrabban kell működnie.`,
      };
    }
    if (type === 2) {
      const O = PK.util.pick([2, 2.2, 2.5, 3], r);
      const ante = r() < 0.7;
      const potNow = O + 0.5 + 1 + (ante ? 1 : 0);
      const call = O - 1;
      const need = call / (potNow + call);
      const c = choicesAround(need, [call / potNow, O / (potNow + O)], r);
      return {
        type: 'bb',
        prompt: `A BTN ${N(O)}bb-re nyit, az SB dob. Te a BB-ben vagy${ante ? ', BB ante van (1bb)' : ', ante nincs'}. Hány % equity elég a hívásra?`,
        ...c,
        explain: `A pot most ${N(potNow)}bb (open ${N(O)} + SB 0,5 + BB 1${ante ? ' + ante 1' : ''}), a hívásod ${N(call)}bb, a végső pot ${N(potNow + call)}bb → ${N(call)} / ${N(potNow + call)} = ${PK.util.pct(need)}.`,
      };
    }
    if (type === 3) {
      const outs = PK.util.pick([4, 8, 9, 12, 15], r);
      const flop = r() < 0.6;
      const exact = flop ? 1 - nCr(47 - outs, 2) / nCr(47, 2) : outs / 46;
      const rule = flop ? Math.min(0.99, outs * 0.04) : outs * 0.02;
      const c = choicesAround(exact, [flop ? outs * 0.02 : outs * 0.04, flop ? outs / 47 : outs / 52], r);
      const what = { 4: 'gutshot', 8: 'nyílt sorhúzó', 9: 'flushhúzó', 12: 'flushhúzó + overkártya', 15: 'flushhúzó + nyílt sorhúzó' }[outs];
      return {
        type: 'outs',
        prompt: flop
          ? `A flopon all-in vagy, ${outs} outod van (${what}). Mekkora eséllyel javulsz a riverig?`
          : `A turnön ${outs} outod van (${what}). Mekkora eséllyel jön be a riveren?`,
        ...c,
        explain: flop
          ? `Pontosan: 1 − C(${47 - outs},2)/C(47,2) = ${PK.util.pct(exact)}. A 4-es szabály (${outs} × 4 = ${Math.round(rule * 100)}%) jó közelítés, ha két lap jön.`
          : `Pontosan: ${outs} / 46 = ${PK.util.pct(exact)}. A 2-es szabály (${outs} × 2 = ${Math.round(rule * 100)}%) egy lapra jó közelítés.`,
      };
    }
    const J = PK.util.pick([8, 10, 12, 15, 20], r);
    const potIfCall = 2 * J + 0.5 + 1;
    const need = (J - 1) / potIfCall;
    const c = choicesAround(need, [(J - 1) / (J + 1.5), J / (2 * J)], r);
    return {
      type: 'allin',
      prompt: `Az UTG ${N(J)}bb-vel all-in, mindenki dob. Te a BB-ben vagy (a vakot és az 1bb-s antét már betetted). Hány % equity kell a hívásra?`,
      ...c,
      explain: `A hívásod ${N(J)} − 1 = ${N(J - 1)}bb; a végső pot ${N(J)} + ${N(J)} + SB 0,5 + ante 1 = ${N(potIfCall)}bb → ${N(J - 1)} / ${N(potIfCall)} = ${PK.util.pct(need)}.`,
    };
  }

  PK.drills = { chartSets, pushFold, potOdds };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.drills;
})(typeof window !== 'undefined' ? window : globalThis);
