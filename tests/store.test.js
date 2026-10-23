// Ismétlési ütemezés és tárolás: a próbálkozások ISO-időbélyeggel érkeznek.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, ROOT } = require('./load');
const path = require('path');

const PK = load();
require(path.join(ROOT, 'js', 'core', 'store.js'));

test('Ismétlés: ISO-időbélyegből számként tárolt esedékesség', () => {
  const ts = '2026-01-01T10:00:00.000Z';
  const e = PK.srs.next(null, true, ts);
  assert.equal(typeof e.due, 'number');
  assert.equal(e.box, 2);
  assert.equal(e.due, PK.srs.dayStart(ts, 3));
  assert.ok(PK.srs.isDue(e, PK.srs.dayStart(ts, 3)));
  assert.ok(!PK.srs.isDue(e, PK.srs.dayStart(ts, 3) - 1));
});

test('Ismétlés: újraépítés időrendben, a komoly hiba az 1-es dobozba visz', () => {
  const atts = [
    { spotId: 'A01', ts: '2026-01-03T10:00:00.000Z', success: false, grade: 'minor' },
    { spotId: 'A01', ts: '2026-01-01T10:00:00.000Z', success: true, grade: 'best' },
    { spotId: 'B02', ts: '2026-01-02T10:00:00.000Z', success: true, grade: 'blunder' },
  ];
  const s = PK.srs.rebuild(atts);
  assert.equal(s.A01.box, 1);
  assert.equal(s.A01.reps, 2);
  assert.equal(s.A01.due, PK.srs.dayStart('2026-01-03T10:00:00.000Z', 1));
  assert.equal(s.B02.box, 1);
  assert.ok(PK.srs.valid(s));
  assert.ok(!PK.srs.valid({ X: { box: 2, due: '2026-01-01T10:00:00.000Z86400000' } }));
  assert.deepEqual(PK.srs.dueIds(s, '2026-01-10T00:00:00.000Z'), ['B02', 'A01']);
});

test('Tár: mentés, törlés és import után is érvényes az ütemezés', () => {
  PK.store.load();
  PK.store.reset();
  const mk = (id, spotId, ts, ok) => ({ id, spotId, ts, mode: 'full', grade: ok ? 'best' : 'minor', total: ok ? 90 : 40, success: ok });
  PK.store.addAttempt(mk('x1', 'A01', '2026-02-01T09:00:00.000Z', true));
  PK.store.addAttempt(mk('x2', 'A01', '2026-02-02T09:00:00.000Z', false));
  let S = PK.store.state;
  assert.equal(typeof S.srs.A01.due, 'number');
  assert.equal(S.srs.A01.box, 1);
  PK.store.deleteAttempt('x2');
  S = PK.store.state;
  assert.equal(S.srs.A01.box, 2);
  assert.equal(S.srs.A01.due, PK.srs.dayStart('2026-02-01T09:00:00.000Z', 3));
  // a régi, hibás formátumú export importja is rendbe jön
  const exp = PK.store.exportObject();
  exp.srs = { A01: { box: 2, due: '2026-02-01T09:00:00.000Z259200000' } };
  PK.store.importObject(exp, 'replace');
  assert.ok(PK.srs.valid(PK.store.state.srs));
  assert.equal(PK.store.state.srs.A01.box, 2);
  PK.store.reset();
});

test('Tár: a megoldás megnézése után a következő próbálkozás nem diagnosztikus', () => {
  PK.store.load();
  PK.store.reset();
  PK.store.markPeek('A02', 'eldobott');
  PK.store.addAttempt({ id: 'y1', spotId: 'A02', ts: '2026-03-01T10:00:00.000Z', mode: 'full', grade: 'best', total: 100, success: true });
  PK.store.markPeek('A03', 'y2');
  PK.store.addAttempt({ id: 'y2', spotId: 'A03', ts: '2026-03-01T10:05:00.000Z', mode: 'full', grade: 'best', total: 100, success: true });
  const S = PK.store.state;
  assert.equal(S.attempts.find((a) => a.id === 'y1').peeked, true);
  assert.ok(!S.attempts.find((a) => a.id === 'y2').peeked, 'a saját felfedés nem számít');
  assert.deepEqual(Object.keys(S.peek), []);
  assert.deepEqual(PK.scoring.firstAttempts(S.attempts).map((a) => a.spotId), ['A03']);
  PK.store.reset();
});

test('Tár: helyben cserélt állapot, összefésülő visszaállítás és csak változáskor írás', () => {
  const mem = {};
  let writes = 0;
  globalThis.localStorage = {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => {
      writes++;
      mem[k] = v;
    },
  };
  try {
    PK.store.load();
    PK.store.reset();
    const ref = PK.store.state;
    const backup = PK.store.exportObject();
    backup.drills.pf = { n: 40, ok: 30, byPos: {}, best: 7 };
    backup.settings = Object.assign({}, backup.settings, { thinkSec: 90, theme: 'dark' });
    PK.store.importObject(backup, 'merge');
    assert.equal(PK.store.state, ref, 'ugyanaz az objektum marad');
    assert.equal(ref.drills.pf.n, 40, 'új eszközön a mentés drillstatisztikája jön át');
    assert.equal(ref.settings.thinkSec, 90, 'alapbeállításoknál a mentés beállításai jönnek át');
    PK.store.importObject(backup, 'merge');
    assert.equal(ref.drills.pf.n, 40, 'kétszeri betöltés sem dupláz');
    const before = writes;
    PK.store.saveNow();
    assert.equal(writes, before, 'változás nélkül nem ír');
    // egy másik lap írása után átvesszük a tárolt állapotot
    const other = JSON.parse(mem[PK.store.KEY]);
    other.mhh.push({ id: 'm1', ts: '2026-03-02T10:00:00.000Z', problem: 'teszt' });
    mem[PK.store.KEY] = JSON.stringify(other);
    assert.ok(PK.store.syncFromStorage());
    assert.equal(ref.mhh.length, 1);
    PK.store.reset();
  } finally {
    delete globalThis.localStorage;
  }
});

test('Import: típusok egységesítése és szigorúbb ellenőrzés', () => {
  PK.store.load();
  PK.store.reset();
  const base = JSON.parse(JSON.stringify(PK.data.spots.find((s) => s.id === 'A15')));
  const sp = Object.assign(base, { id: 'X-T1', diff: '1', ctx: Object.assign({}, base.ctx, { avgBb: '160' }) });
  sp.opts = sp.opts.map((o, i) => Object.assign({}, o, { id: i + 1 }));
  sp.factors = sp.factors.map((f) => Object.assign({}, f, { kw: 'keret' }));
  const r = PK.store.importSpots([sp]);
  assert.deepEqual(r.errors, []);
  const got = PK.store.spotById('X-T1');
  assert.equal(got.diff, 1);
  assert.equal(got.ctx.avgBb, 160);
  assert.deepEqual(got.opts.map((o) => o.id), ['1', '2', '3']);
  assert.deepEqual(got.factors[0].kw, ['keret']);
  const bad = Object.assign(JSON.parse(JSON.stringify(sp)), { id: 'X-T2', diff: 2.5 });
  bad.factors[0].kw = ['(nyitott'];
  const r2 = PK.store.importSpots([bad]);
  assert.equal(r2.added, 0);
  assert.ok(r2.errors.some((e) => /diff/.test(e)));
  assert.ok(r2.errors.some((e) => /kulcssz/.test(e)));
  assert.equal(PK.util.num('35', 0), '35');
  PK.store.reset();
});
