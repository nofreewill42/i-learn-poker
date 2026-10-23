// Ismétlési ütemezés és tárolás: a próbálkozások ISO-időbélyeggel érkeznek.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, ROOT } = require('./load');
const path = require('path');

const PK = load();
require(path.join(ROOT, 'js', 'core', 'store.js'));
const DAY = 864e5;

test('Ismétlés: ISO-időbélyegből számként tárolt esedékesség', () => {
  const ts = '2026-01-01T10:00:00.000Z';
  const e = PK.srs.next(null, true, ts);
  assert.equal(typeof e.due, 'number');
  assert.equal(e.box, 2);
  assert.equal(e.due, Date.parse(ts) + 3 * DAY);
  assert.ok(PK.srs.isDue(e, '2026-01-04T10:00:00.000Z'));
  assert.ok(!PK.srs.isDue(e, '2026-01-03T10:00:00.000Z'));
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
  assert.equal(s.A01.due, Date.parse('2026-01-03T10:00:00.000Z') + DAY);
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
  assert.equal(S.srs.A01.due, Date.parse('2026-02-01T09:00:00.000Z') + 3 * DAY);
  // a régi, hibás formátumú export importja is rendbe jön
  const exp = PK.store.exportObject();
  exp.srs = { A01: { box: 2, due: '2026-02-01T09:00:00.000Z259200000' } };
  PK.store.importObject(exp, 'replace');
  assert.ok(PK.srs.valid(PK.store.state.srs));
  assert.equal(PK.store.state.srs.A01.box, 2);
  PK.store.reset();
});
