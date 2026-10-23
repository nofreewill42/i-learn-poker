const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');
const PK = load();
const spots = (PK.data && PK.data.spots) || [];

test('minden beépített spot érvényes a motor szerint', () => {
  const errs = [];
  const ids = new Set();
  for (const s of spots) {
    if (ids.has(s.id)) errs.push('duplikált id: ' + s.id);
    ids.add(s.id);
    errs.push(...PK.spot.validate(s));
  }
  assert.deepEqual(errs, []);
});

test('a spotbank lefedi a szakaszokat, kategóriákat és nehézségeket', () => {
  assert.ok(spots.length >= 40, 'legalább 40 spot kell, most: ' + spots.length);
  const byCat = {};
  const byDiff = {};
  const byStage = {};
  for (const s of spots) {
    s.cats.forEach((c) => (byCat[c] = (byCat[c] || 0) + 1));
    byDiff[s.diff] = (byDiff[s.diff] || 0) + 1;
    byStage[s.stage] = (byStage[s.stage] || 0) + 1;
  }
  for (const c of PK.scoring.CATEGORY_CODES) assert.ok((byCat[c] || 0) >= 2, c + ' kategóriában kevés a spot: ' + (byCat[c] || 0));
  for (let d = 1; d <= 5; d++) assert.ok((byDiff[d] || 0) >= 3, d + '. nehézségből kevés a spot: ' + (byDiff[d] || 0));
  for (const st of ['early', 'middle', 'bubble', 'ft']) assert.ok((byStage[st] || 0) >= 3, st + ' szakaszból kevés a spot');
});

test('a spotok markerei érvényes regexek, a faktorok fogalmai léteznek', () => {
  for (const s of spots) {
    for (const m of s.markers || []) {
      const src = typeof m === 'string' ? m : m.re;
      assert.doesNotThrow(() => new RegExp(src, 'i'), s.id + ': rossz regex: ' + src);
    }
    for (const f of s.factors) assert.ok(PK.data.concepts[f.c], s.id + ': ismeretlen fogalom: ' + f.c);
    for (const f of s.factors) if (f.kw) f.kw.forEach((k) => assert.doesNotThrow(() => new RegExp(k, 'i'), s.id + ': rossz kw: ' + k));
  }
});
