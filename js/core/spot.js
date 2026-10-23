/* i-learn-poker — szituáció-motor: a leírt akciókból kiszámolja az asztal állapotát.
 *
 * Konvenciók (mind big blindban, bb):
 *  - table.stacks: a kéz ELEJÉN lévő stackek (vakok és ante előtt). 'default' = a nem részletezett székek.
 *  - table.sb, table.bb: vakok (alap 0,5 / 1). table.ante + anteType: 'bba' (big blind ante, a BB fizeti,
 *    holt pénz), 'each' (mindenki fizet) vagy 'none'.
 *  - table.actions: [pozíció, akció, összeg?] elemek, utcaváltás: 'flop' | 'turn' | 'river'.
 *    Akciók: f=fold, x=check, c=call, l=limp, b=bet (utcán belüli összegre), r=raise (összesen erre),
 *    j=all-in. Preflop a fel nem sorolt, sorra kerülő játékosok automatikusan dobnak;
 *    postflop minden akciót ki kell írni.
 *  - A felsorolt akciók után a hősnek kell következnie — ezt a motor ellenőrzi.
 */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});

  const POS_BY_N = {
    10: ['UTG', 'UTG+1', 'UTG+2', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    9: ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    8: ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    7: ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    6: ['LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    5: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
    4: ['CO', 'BTN', 'SB', 'BB'],
    3: ['BTN', 'SB', 'BB'],
    2: ['SB', 'BB'], // heads-up: az SB a button
  };

  const PROFILE = {
    rec: { short: 'rec', long: 'rekreációs játékos' },
    reg: { short: 'reg', long: 'regular' },
    lag: { short: 'LAG', long: 'laza-agresszív regular' },
    nit: { short: 'szűk', long: 'nagyon szűk játékos' },
    station: { short: 'hívó', long: 'calling station (sokat hív)' },
    passive: { short: 'passzív', long: 'passzív rekreációs játékos' },
    maniac: { short: 'mániás', long: 'túlagresszív játékos' },
    cl: { short: 'CL', long: 'chip leader' },
    unknown: { short: '?', long: 'ismeretlen játékos' },
  };

  const STREETS = ['pre', 'flop', 'turn', 'river'];
  const STREET_HU = { pre: 'preflop', flop: 'flop', turn: 'turn', river: 'river' };
  const ACT_HU = { f: 'fold', x: 'check', c: 'call', l: 'limp', b: 'bet', r: 'raise', j: 'all-in' };

  function fail(spotId, msg) {
    throw new Error((spotId ? spotId + ': ' : '') + msg);
  }

  const EPS = 1e-9;

  /**
   * Szimuláció. Visszaad: { order, seats, street, pot, potBefore, currentBet, hero, toCall,
   *   potIfCall, needEq, eff, effStart, spr, active, log }
   */
  function simulate(table, spotId) {
    const t = table || {};
    const n = t.players || 10;
    const order = POS_BY_N[n];
    if (!order) fail(spotId, 'nem támogatott játékosszám: ' + n);
    if (!t.hero || order.indexOf(t.hero) < 0) fail(spotId, 'a hős pozíciója hiányzik vagy nincs az asztalnál: ' + t.hero);
    const stacks = t.stacks || {};
    const def = stacks.default != null ? stacks.default : 100;
    for (const k of Object.keys(stacks)) {
      if (k !== 'default' && order.indexOf(k) < 0) fail(spotId, 'ismeretlen pozíció a stackeknél: ' + k);
    }
    const profiles = t.profiles || {};
    const sb = t.sb != null ? t.sb : 0.5;
    const bb = t.bb != null ? t.bb : 1;
    const ante = t.ante || 0;
    const anteType = ante ? t.anteType || 'bba' : 'none';

    const seats = order.map((pos) => {
      const start = stacks[pos] != null ? stacks[pos] : def;
      return {
        pos,
        start,
        stack: start,
        inStreet: 0,
        inHand: 0,
        dead: 0,
        folded: false,
        allin: false,
        hero: pos === t.hero,
        profile: profiles[pos] || null,
        last: null,
      };
    });
    const at = (pos) => seats[order.indexOf(pos)];
    const log = [];

    let deadPot = 0;
    function put(s, amt) {
      const a = Math.min(amt, s.stack);
      s.stack -= a;
      s.inStreet += a;
      s.inHand += a;
      if (s.stack <= EPS) {
        s.stack = 0;
        s.allin = true;
      }
      return a;
    }

    // ante
    if (anteType === 'bba') {
      const s = at('BB');
      const a = Math.min(ante, s.stack);
      s.stack -= a;
      s.dead += a;
      deadPot += a;
    } else if (anteType === 'each') {
      for (const s of seats) {
        const a = Math.min(ante, s.stack);
        s.stack -= a;
        s.dead += a;
        deadPot += a;
      }
    }
    // vakok
    put(at('SB'), sb);
    put(at('BB'), bb);

    let street = 'pre';
    let currentBet = bb;
    let aggressor = null; // aki az utcán utoljára emelte a tétet
    let idx = 0; // preflop az első pozíció kezd (heads-upban az SB)
    let spr = null;
    let flopPot = null;

    function nextIdx(i) {
      return (i + 1) % n;
    }

    function firstPostflop() {
      // heads-up: a BB kezd; különben az SB-től indulva az első aktív
      let i = n === 2 ? 1 : order.indexOf('SB');
      for (let k = 0; k < n; k++) {
        const s = seats[i];
        if (!s.folded && !s.allin) return i;
        i = nextIdx(i);
      }
      return -1;
    }

    function needsToAct(s) {
      return !s.folded && !s.allin && (s.inStreet < currentBet - EPS || s.actedStreet !== street);
    }

    /** Egy kihagyott szék kezelése: preflop dob (vagy emeletlen potban a BB checkel), postflop hiba. */
    function skip(s, why) {
      if (!needsToAct(s)) return;
      const unraisedBB = street === 'pre' && s.pos === 'BB' && Math.abs(currentBet - bb) < EPS && s.inStreet >= currentBet - EPS;
      if (s.hero && !unraisedBB) {
        fail(spotId, why + ': a hősnek (' + s.pos + ') kellene lépnie — a felsorolt akciók a hős döntése után jönnének. Nézd meg a sorrendet (preflop: UTG … BTN, SB, BB; postflop: SB, BB, UTG … BTN).');
      }
      if (street === 'pre') {
        if (unraisedBB) {
          s.actedStreet = street;
          s.last = 'x';
          s.auto = true;
        } else {
          s.folded = true;
          s.last = 'f';
          s.auto = true;
        }
      } else {
        fail(spotId, why + ': ' + s.pos + ' kimaradt (' + STREET_HU[street] + ') — postflop minden akciót ki kell írni');
      }
    }

    function advanceTo(target, why) {
      let guard = 0;
      while (idx !== target) {
        skip(seats[idx], why);
        idx = nextIdx(idx);
        if (++guard > 3 * n) fail(spotId, 'végtelen ciklus a sorrendben');
      }
    }

    function closeStreet(nextStreet) {
      // preflop: a még nem lépett játékosok dobnak (emeletlen potban a BB checkel); postflop: mindenkinek lépnie kellett
      for (let k = 0; k < n; k++) {
        skip(seats[idx], 'utcaváltás előtt');
        idx = nextIdx(idx);
      }
      for (const s of seats) {
        if (!s.folded && !s.allin && s.inStreet < currentBet - EPS) {
          fail(spotId, STREET_HU[street] + ' lezárása előtt ' + s.pos + ' nem egyenlített (' + s.inStreet + ' vs ' + currentBet + ')');
        }
      }
      for (const s of seats) s.inStreet = 0;
      currentBet = 0;
      aggressor = null;
      street = nextStreet;
      idx = firstPostflop();
      if (nextStreet === 'flop') {
        flopPot = deadPot + seats.reduce((a, s) => a + s.inHand, 0);
        const hero = seats.find((s) => s.hero);
        const opp = seats.filter((s) => !s.hero && !s.folded);
        if (hero && !hero.folded && opp.length) {
          const effBehind = Math.min(hero.stack, Math.max.apply(null, opp.map((s) => s.stack)));
          spr = flopPot > 0 ? effBehind / flopPot : null;
        }
      }
    }

    for (const item of t.actions || []) {
      if (typeof item === 'string') {
        const ns = item.toLowerCase();
        if (STREETS.indexOf(ns) !== STREETS.indexOf(street) + 1) fail(spotId, 'rossz utcasorrend: ' + street + ' → ' + ns);
        closeStreet(ns);
        log.push({ street: ns });
        continue;
      }
      const pos = item[0];
      const act = item[1];
      const amt = item[2];
      const target = order.indexOf(pos);
      if (target < 0) fail(spotId, 'ismeretlen pozíció az akcióban: ' + pos);
      advanceTo(target, 'akció előtt');
      const s = seats[target];
      if (s.folded) fail(spotId, pos + ' már dobott, nem léphet');
      if (s.allin) fail(spotId, pos + ' már all-in, nem léphet');
      let shown = 0;
      switch (act) {
        case 'f':
          s.folded = true;
          break;
        case 'x':
          if (s.inStreet < currentBet - EPS) fail(spotId, pos + ' nem checkelhet, ' + (currentBet - s.inStreet) + 'bb a hívás');
          break;
        case 'l':
          if (street !== 'pre' || Math.abs(currentBet - bb) > EPS) fail(spotId, pos + ': limp csak emelés nélküli preflopon lehet');
          put(s, currentBet - s.inStreet);
          shown = s.inStreet;
          break;
        case 'c':
          if (currentBet - s.inStreet <= EPS) fail(spotId, pos + ': nincs mit hívni (check kell)');
          put(s, currentBet - s.inStreet);
          shown = s.inStreet;
          break;
        case 'b':
          if (currentBet > EPS) fail(spotId, pos + ': bet helyett raise kell (már van tét)');
          if (!(amt > 0)) fail(spotId, pos + ': a bet összege hiányzik');
          if (amt - s.inStreet > s.stack + EPS) fail(spotId, pos + ': nincs ennyi zsetonja (all-in = j)');
          put(s, amt - s.inStreet);
          currentBet = s.inStreet;
          aggressor = s;
          shown = s.inStreet;
          break;
        case 'r':
          if (!(amt > currentBet + EPS)) fail(spotId, pos + ': a raise összege (' + amt + ') nem nagyobb a tétnél (' + currentBet + ')');
          if (amt - s.inStreet > s.stack + EPS) fail(spotId, pos + ': nincs ennyi zsetonja a raise-hez (all-in = j)');
          put(s, amt - s.inStreet);
          currentBet = s.inStreet;
          aggressor = s;
          shown = s.inStreet;
          break;
        case 'j':
          put(s, s.stack);
          if (s.inStreet > currentBet) {
            currentBet = s.inStreet;
            aggressor = s;
          }
          shown = s.inStreet;
          break;
        default:
          fail(spotId, 'ismeretlen akció: ' + act);
      }
      s.last = act;
      s.actedStreet = street;
      log.push({ street, pos, act, amt: shown });
      idx = nextIdx(target);
    }

    // a döntési pont: a hősnek kell következnie
    const heroIdx = order.indexOf(t.hero);
    advanceTo(heroIdx, 'a hős döntése előtt');
    const hero = seats[heroIdx];
    if (hero.folded || hero.allin) fail(spotId, 'a hős már nem tud lépni');

    const pot = deadPot + seats.reduce((a, s) => a + s.inHand, 0);
    const potBefore = deadPot + seats.reduce((a, s) => a + (s.inHand - s.inStreet), 0);
    const toCall = Math.max(0, Math.min(currentBet - hero.inStreet, hero.stack));
    // A hős csak annyit nyerhet az utcán, amennyit maga is betesz: a fedező ellenfelek fölös része visszajár.
    const heroStreetTotal = hero.inStreet + toCall;
    const potIfCall = potBefore + seats.reduce((a, s) => a + (s.hero ? heroStreetTotal : Math.min(s.inStreet, heroStreetTotal)), 0);
    const needEq = toCall > EPS ? toCall / potIfCall : null;
    const opps = seats.filter((s) => !s.hero && !s.folded);
    const maxOppTotal = opps.length ? Math.max.apply(null, opps.map((s) => s.stack + s.inStreet)) : 0;
    const eff = Math.min(hero.stack + hero.inStreet, maxOppTotal);
    // effektív stack: ha tétre kell válaszolnod, az emelővel szemben; különben a legnagyobb még bent lévő ellenféllel
    const maxOppStart = opps.length ? Math.max.apply(null, opps.map((s) => s.start - s.dead)) : 0;
    const vs = aggressor && !aggressor.hero && !aggressor.folded ? aggressor.start - aggressor.dead : maxOppStart;
    const effStart = Math.min(hero.start - hero.dead, vs);
    const toActAfter = [];
    if (street === 'pre') {
      // akik a hős után még döntenek (nem dobtak, nem all-in)
      let i = nextIdx(heroIdx);
      for (let k = 0; k < n - 1; k++) {
        const s = seats[i];
        if (!s.folded && !s.allin) toActAfter.push(s.pos);
        i = nextIdx(i);
      }
    }

    return {
      order,
      seats,
      street,
      pot,
      potBefore,
      dead: deadPot,
      currentBet,
      hero,
      toCall,
      potIfCall,
      needEq,
      eff,
      effStart,
      spr,
      flopPot,
      active: seats.filter((s) => !s.folded).length,
      toActAfter,
      log,
      blinds: { sb, bb, ante, anteType },
    };
  }

  /** Ember által olvasható akciónapló utcánként (magyar). */
  function actionLines(table, spotId) {
    const st = simulate(table, spotId);
    const lines = { pre: [], flop: [], turn: [], river: [] };
    let street = 'pre';
    for (const e of st.log) {
      if (e.street && !e.pos) {
        street = e.street;
        continue;
      }
      const prof = table.profiles && table.profiles[e.pos] ? ' (' + PROFILE[table.profiles[e.pos]].short + ')' : '';
      let txt = e.pos + prof + ' ' + ACT_HU[e.act];
      if (e.act === 'r' || e.act === 'b' || e.act === 'j' || e.act === 'c' || e.act === 'l') {
        txt += ' ' + (PK.util ? PK.util.bb(e.amt) : e.amt + 'bb');
      }
      lines[street].push(txt);
    }
    return lines;
  }

  /** Egy spot teljes ellenőrzése — a tesztek és az importálás használja. Hibalistát ad. */
  function validate(spot, opts) {
    const errs = [];
    const o = opts || {};
    const id = spot && spot.id;
    const need = ['id', 'title', 'stage', 'cats', 'diff', 'q', 'opts', 'ans', 'exp', 'factors'];
    for (const k of need) if (spot[k] == null || spot[k] === '') errs.push(id + ': hiányzó mező: ' + k);
    if (errs.length) return errs;
    if (['early', 'middle', 'bubble', 'ft', 'mental'].indexOf(spot.stage) < 0) errs.push(id + ': ismeretlen stage: ' + spot.stage);
    if (!(spot.diff >= 1 && spot.diff <= 5)) errs.push(id + ': diff 1–5 legyen');
    const cats = o.categories || (PK.scoring && PK.scoring.CATEGORY_CODES) || null;
    if (!Array.isArray(spot.cats) || !spot.cats.length) errs.push(id + ': cats nem üres lista legyen');
    else if (cats) spot.cats.forEach((c) => cats.indexOf(c) < 0 && errs.push(id + ': ismeretlen kategória: ' + c));
    if (!Array.isArray(spot.opts) || spot.opts.length < 2) errs.push(id + ': legalább 2 opció kell');
    else {
      const grades = { best: 1, good: 1, minor: 1, blunder: 1 };
      const ids = new Set();
      let bestN = 0;
      spot.opts.forEach((op) => {
        if (!op.id || !op.t) errs.push(id + ': opció id/t hiányzik');
        if (ids.has(op.id)) errs.push(id + ': duplikált opció-id: ' + op.id);
        ids.add(op.id);
        if (!grades[op.g]) errs.push(id + ': ismeretlen értékelés: ' + op.g);
        if (op.g === 'best') bestN++;
        if (op.g !== 'best' && !op.why) errs.push(id + ': a(z) "' + op.t + '" opcióhoz kell "why" (mit árul el, ha ezt választod)');
      });
      if (bestN < 1) errs.push(id + ': legalább egy "best" opció kell');
    }
    if (!Array.isArray(spot.factors) || spot.factors.length < 2) errs.push(id + ': legalább 2 kulcsfaktor kell');
    else {
      const concepts = o.concepts || (PK.data && PK.data.concepts) || null;
      spot.factors.forEach((f) => {
        if (!f.t) errs.push(id + ': faktor szöveg (t) hiányzik');
        if (!f.c) errs.push(id + ': faktor koncepció (c) hiányzik');
        else if (concepts && !concepts[f.c]) errs.push(id + ': ismeretlen koncepció: ' + f.c);
      });
    }
    if (spot.table) {
      try {
        const st = simulate(spot.table, id);
        const cards = spot.table.cards || [];
        const board = spot.table.board || [];
        const all = cards.concat(board);
        if (cards.length !== 2) errs.push(id + ': a hős lapjai (cards) 2 db legyen');
        all.forEach((c) => {
          if (PK.cards && !PK.cards.isValid(c)) errs.push(id + ': érvénytelen lap: ' + c);
        });
        if (new Set(all).size !== all.length) errs.push(id + ': ismétlődő lap a kézben/boardon');
        const boardN = { pre: 0, flop: 3, turn: 4, river: 5 }[st.street];
        if (board.length !== boardN) errs.push(id + ': ' + st.street + ' utcán ' + boardN + ' board-lap kell, van: ' + board.length);
        if (spot.check) {
          const c = spot.check;
          const close = (a, b) => Math.abs(a - b) <= (c.tol || 0.06);
          if (c.pot != null && !close(st.pot, c.pot)) errs.push(id + ': pot ' + st.pot.toFixed(2) + ' ≠ elvárt ' + c.pot);
          if (c.toCall != null && !close(st.toCall, c.toCall)) errs.push(id + ': hívás ' + st.toCall.toFixed(2) + ' ≠ elvárt ' + c.toCall);
          if (c.needEq != null && !(st.needEq != null && Math.abs(st.needEq - c.needEq) <= 0.006)) {
            errs.push(id + ': szükséges equity ' + (st.needEq == null ? '–' : (st.needEq * 100).toFixed(1) + '%') + ' ≠ elvárt ' + (c.needEq * 100).toFixed(1) + '%');
          }
          if (c.spr != null && !(st.spr != null && Math.abs(st.spr - c.spr) <= 0.15)) errs.push(id + ': SPR ' + (st.spr == null ? '–' : st.spr.toFixed(2)) + ' ≠ elvárt ' + c.spr);
          if (c.eff != null && !close(st.effStart, c.eff)) errs.push(id + ': effektív stack ' + st.effStart.toFixed(2) + ' ≠ elvárt ' + c.eff);
        }
      } catch (e) {
        errs.push(String(e.message || e));
      }
    }
    return errs;
  }

  PK.spot = { POS_BY_N, PROFILE, STREET_HU, ACT_HU, simulate, actionLines, validate };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.spot;
})(typeof window !== 'undefined' ? window : globalThis);
