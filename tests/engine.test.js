const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');
const PK = load();

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (±${tol})`);

test('kézosztályok és rács', () => {
  assert.equal(PK.cards.handClass('Ac', '9d'), 'A9o');
  assert.equal(PK.cards.handClass('9d', 'Ad'), 'A9s');
  assert.equal(PK.cards.handClass('Qs', 'Qh'), 'QQ');
  assert.equal(PK.cards.allClasses().length, 169);
  const total = PK.cards.allClasses().reduce((a, c) => a + PK.cards.combos(c), 0);
  assert.equal(total, 1326);
  assert.deepEqual(PK.cards.parseMany('A♠ 10♦ kh'), ['As', 'Td', 'Kh']);
});

test('range-értelmező alapesetek', () => {
  const r = PK.ranges.parse('77+, A4s+, ATo+, K9s+');
  assert.ok(r.has('AA') && r.has('77') && !r.has('66'));
  assert.ok(r.has('A4s') && r.has('AKs') && !r.has('A3s'));
  assert.ok(r.has('ATo') && !r.has('A9o'));
  assert.ok(r.has('K9s') && !r.has('K8s') && !r.has('K9o'));
  const q = PK.ranges.parse('Qx+');
  assert.ok(q.has('Q2o') && q.has('K2s') && q.has('A2o') && !q.has('J9s') && !q.has('QQ'));
  assert.deepEqual([...PK.ranges.parse('A2s-A5s')].sort(), ['A2s', 'A3s', 'A4s', 'A5s']);
  assert.deepEqual([...PK.ranges.parse('22-44')].sort(), ['22', '33', '44']);
  assert.throws(() => PK.ranges.parse('AXZ'));
});

test('a 10bb-s chartok százalékai egyeznek a forrással', () => {
  for (const row of PK.data.charts.pf10.rows.concat(PK.data.charts.call10.rows)) {
    const pct = PK.ranges.pctOf(PK.ranges.parse(row.range)) * 100;
    assert.ok(Math.abs(pct - row.pct) < 0.15, `${row.pos}: számolt ${pct.toFixed(2)}% vs forrás ${row.pct}%`);
  }
});

test('ICM: a kutatásban szereplő 3 fős deal-példa', () => {
  const ev = PK.icm.equity([50, 30, 20], [400, 250, 150]);
  near(ev[0], 308.93, 0.01);
  near(ev[1], 262.5, 0.01);
  near(ev[2], 228.57, 0.01);
  const d = PK.icm.deals([50, 30, 20], [400, 250, 150]);
  near(d.chip[0], 325, 1e-9);
  near(d.chip[1], 255, 1e-9);
  near(d.chip[2], 220, 1e-9);
});

test('ICM: a kézben kieső játékos az utolsó hely díját kapja', () => {
  const ev = PK.icm.equity([10, 10, 0], [50, 30, 20]);
  near(ev[2], 20);
  near(ev[0], 40);
  near(ev[0] + ev[1] + ev[2], 100);
  // döntőn a bukás nem nulla: a 7. hely díját éri
  const call = PK.icm.callAllIn({ stacks: [28, 22, 15, 12, 9, 7, 4], payouts: [32, 21, 15, 11, 8.5, 7, 5.5], hero: 2, villain: 0, heroBlind: 1, heroAnte: 1, dead: 0.5 });
  near(call.evLose, 5.5, 1e-9);
  assert.ok(call.needIcm > call.needChip && call.needIcm < 0.66, 'needIcm = ' + call.needIcm);
});

test('ICM: győztes mindent visz = chipEV, a bubble factor 1', () => {
  const ev = PK.icm.equity([60, 30, 10], [100]);
  near(ev[0], 60);
  near(ev[2], 10);
  const bf = PK.icm.bubbleFactor([60, 30, 10], [100], 1, 0);
  near(bf.bf, 1);
  near(bf.rp, 0);
});

test('ICM: buborékon a bubble factor > 1, és az ICM több equityt kér', () => {
  const stacks = [40, 25, 20, 10, 5];
  const pay = [50, 30, 20, 0, 0];
  const total = PK.icm.equity(stacks, pay).reduce((a, b) => a + b, 0);
  near(total, 100, 1e-9);
  const bf = PK.icm.bubbleFactor(stacks, pay, 2, 0);
  assert.ok(bf.bf > 1.2, 'bf = ' + bf.bf);
  const call = PK.icm.callAllIn({ stacks, payouts: pay, hero: 2, villain: 0, heroBlind: 1, heroAnte: 1, dead: 0.5 });
  assert.ok(call.needIcm > call.needChip);
  near(call.needChip, (19 - 1) / (2 * 19 + 1 + 0.5));
});

test('spot-motor: BTN min-raise, BB védekezik BB ante mellett (18,2%)', () => {
  const st = PK.spot.simulate({ sb: 0.5, bb: 1, ante: 1, anteType: 'bba', stacks: { default: 40 }, hero: 'BB', actions: [['BTN', 'r', 2]] });
  near(st.pot, 4.5);
  near(st.toCall, 1);
  near(st.needEq, 1 / 5.5);
  assert.equal(st.seats.filter((s) => s.folded).length, 8);
});

test('spot-motor: fedező jam ellen csak a hívható rész számít (45,1%)', () => {
  const st = PK.spot.simulate({ players: 8, ante: 1, anteType: 'bba', stacks: { default: 30, BTN: 45, BB: 18 }, hero: 'BB', actions: [['BTN', 'j']] });
  near(st.toCall, 16);
  near(st.potIfCall, 35.5);
  near(st.needEq, 16 / 35.5);
});

test('spot-motor: az effektív stack az emelővel szemben értendő', () => {
  const st = PK.spot.simulate({ ante: 1, stacks: { default: 85, UTG: 25, HJ: 180 }, hero: 'HJ', actions: [['UTG', 'r', 3]] });
  near(st.effStart, 25);
  const open = PK.spot.simulate({ ante: 1, stacks: { default: 85, HJ: 180 }, hero: 'HJ', actions: [] });
  near(open.effStart, 85);
});

test('spot-motor: postflop, SPR és kötelező akciók', () => {
  const table = {
    ante: 1,
    stacks: { default: 25 },
    hero: 'CO',
    actions: [['CO', 'r', 2.2], ['BB', 'c'], 'flop', ['BB', 'x']],
  };
  const st = PK.spot.simulate(table);
  near(st.pot, 5.9);
  near(st.spr, 21.8 / 5.9, 1e-9); // a BB az antét is a saját stackjéből fizette
  assert.throws(() => PK.spot.simulate({ ...table, actions: [['CO', 'r', 2.2], ['BB', 'c'], 'flop', ['CO', 'b', 2]] }), /kimaradt/);
});

test('spot-motor: limpelt pot, iso és multiway check-raise', () => {
  const st = PK.spot.simulate({
    ante: 1,
    stacks: { default: 200 },
    hero: 'UTG',
    actions: [['UTG', 'r', 3], ['CO', 'c'], ['BB', 'c'], 'flop', ['BB', 'x'], ['UTG', 'b', 3.5], ['CO', 'f'], ['BB', 'r', 12]],
  });
  near(st.pot, 10.5 + 3.5 + 12);
  near(st.toCall, 8.5);
  // a check-raise után a hős jön, nem a CO — a motor ezt kikényszeríti
  assert.throws(() =>
    PK.spot.simulate({
      ante: 1,
      stacks: { default: 200 },
      hero: 'UTG',
      actions: [['UTG', 'r', 3], ['CO', 'c'], ['BB', 'c'], 'flop', ['BB', 'x'], ['UTG', 'b', 3.5], ['CO', 'c'], ['BB', 'r', 12], ['CO', 'f']],
    }),
  );
});

test('pontozás: kétfázisú rubrika', () => {
  const spot = { factors: [{ c: 'pos' }, { c: 'odds' }] };
  const s = PK.scoring.score(spot, { grade: 'best', mode: 'full', factorMarks: [1, 0.5], quality: { range: true, quant: true, plan: false }, deductions: {} });
  assert.equal(s.total, Math.round(60 + 18.75 + 10));
  assert.ok(s.success);
  const q = PK.scoring.score(spot, { grade: 'good', mode: 'quick' });
  assert.equal(q.total, 75);
  assert.ok(q.success);
});

test('felismerés: fogalmak, minőség, árulkodó jelek', () => {
  const txt = 'UTG-ről nyitott egy szűk reg, a range-e kb. 15%. 18 százalék kell a pot odds miatt, ha raise-el, dobom.';
  const hits = PK.scoring.conceptHits(txt);
  for (const c of ['pos', 'range', 'odds', 'profile', 'plan']) assert.ok(hits.has(c), 'hiányzik: ' + c);
  const q = PK.scoring.autoQuality(txt);
  assert.deepEqual(q, { range: true, quant: true, plan: true });
  const f = PK.scoring.flags('Ász van, megnézem. Vissza kell nyernem.', null);
  assert.ok(f.some((x) => x.cat === 'PRE'));
  assert.ok(f.some((x) => x.cat === 'MEN'));
});

test('szintbecslés: első próbálkozásokból, 3 spot / szint', () => {
  const spots = {};
  const attempts = [];
  let ts = 0;
  for (let d = 1; d <= 3; d++) {
    for (let i = 0; i < 3; i++) {
      const id = 'S' + d + i;
      spots[id] = { id, diff: d, cats: ['PRE'] };
      attempts.push({ spotId: id, ts: ++ts, total: d < 3 ? 80 : 40, success: d < 3, mode: 'full', qualityPts: 10 });
    }
  }
  // ismételt próbálkozás nem javít a diagnózison
  attempts.push({ spotId: 'S30', ts: ++ts, total: 100, success: true, mode: 'full', qualityPts: 15 });
  const lv = PK.scoring.levelEstimate(attempts, (id) => spots[id]);
  assert.equal(lv.mastered, 2);
  assert.equal(lv.level, 3);
});

test('Leitner-dobozok', () => {
  const t0 = Date.UTC(2026, 0, 1);
  let e = PK.srs.next(null, true, t0);
  assert.equal(e.box, 2);
  e = PK.srs.next(e, true, t0);
  assert.equal(e.box, 3);
  e = PK.srs.next(e, false, t0);
  assert.equal(e.box, 1);
});
