const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');
const PK = load();
const E = PK.equity;
const ev = (s) => E.evaluate(PK.cards.parseMany(s).map(E.idx));

test('kézértékelő: kategóriák sorrendje', () => {
  const order = [
    'As Ks Qs Js Ts 2d 3c', // színsor
    '9c 9d 9h 9s Ad 2c 3h', // póker
    'Kc Kd Kh 7s 7d 2c 3h', // full
    'Ah Th 7h 4h 2h Kd Kc', // flush
    '5c 6d 7h 8s 9d Kc Kd', // sor
    'Qc Qd Qh 7s 4d 2c 3h', // drill
    'Jc Jd 8h 8s 4d 2c Ah', // két pár
    'Tc Td 8h 6s 4d 2c Ah', // pár
    'Ac Qd 9h 7s 4d 3c 2h', // magas lap
  ].map(ev);
  for (let i = 1; i < order.length; i++) assert.ok(order[i - 1] > order[i], 'sorrend hiba a(z) ' + i + '. helyen');
});

test('kézértékelő: speciális esetek', () => {
  assert.ok(ev('6c 2d 3h 4s 5d Kc Qd') > ev('Ac 2d 3h 4s 5d Kc Qd'), 'a hatos sor veri az ötös sort');
  assert.equal(E.category(ev('Ac 2d 3h 4s 5d Kc Qd')), 'sor');
  assert.ok(ev('Ah Ad Ks Kc Qh Qd 2c') > ev('Ah Ad Ks Kc Jh Jd 2c'), 'két párnál a kicker számít (Q > J)');
  assert.ok(ev('Kh Kd Ks 2c 2h 2d 9s') > ev('Qh Qd Qs Ac Ah 3d 9s'), 'két drillből full');
  assert.equal(ev('Ah Kh Qh Jh 9h 2c 3d'), ev('Ah Kh Qh Jh 9h 4c 5d'), 'ugyanaz a flush, holtverseny');
});

test('equity: ismert értékek (Monte Carlo, ±1,2%)', () => {
  const eq = (o) => E.vs({ trials: 60000, seed: 7, ...o }).eq;
  const close = (a, b) => assert.ok(Math.abs(a - b) < 0.012, `${(a * 100).toFixed(2)}% vs ${(b * 100).toFixed(2)}%`);
  close(eq({ hero: ['Ah', 'As'], villain: ['Kd', 'Kc'] }), 0.8195);
  close(eq({ hero: ['Ah', 'Kd'], villain: ['Qs', 'Qc'] }), 0.4344);
  close(eq({ hero: ['7c', '2d'], villain: ['Ah', 'As'] }), 0.1188);
  // flopon: flush draw + overkártyák vs top pár
  close(eq({ hero: ['Ah', 'Kh'], villain: ['Js', 'Tc'], board: ['Jh', '7h', '2c'] }), 0.5263);
});

test('equity: range ellen, blokkolt kombinációk nélkül', () => {
  const r = E.vs({ hero: ['Kc', 'Jd'], range: '77+, ATs+, AJo+, KQs', trials: 40000, seed: 3 });
  assert.ok(r.combos < 108, 'a KJo blokkol néhány kombinációt');
  assert.ok(r.eq > 0.26 && r.eq < 0.36, 'KJo vs szűk reshove-range: ' + (r.eq * 100).toFixed(1) + '%');
});
