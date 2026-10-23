#!/usr/bin/env node
// Spotfájlok ellenőrzése és a motor által számolt értékek kiírása.
// Használat: node tools/check-spots.js js/data/spots-early.js [további fájlok…] [--verbose]
const path = require('path');
const ROOT = path.join(__dirname, '..');
for (const f of ['util', 'cards', 'ranges', 'spot', 'icm', 'equity', 'scoring', 'srs']) require(path.join(ROOT, 'js/core', f + '.js'));
require(path.join(ROOT, 'js/data/concepts.js'));

const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const files = args.filter((a) => !a.startsWith('-'));
if (!files.length) {
  console.error('Adj meg legalább egy spotfájlt.');
  process.exit(2);
}
const PK = globalThis.PK;
PK.data.spots = [];
for (const f of files) require(path.resolve(f));
const spots = PK.data.spots;
const U = PK.util;

let bad = 0;
const ids = new Set();
for (const s of spots) {
  const errs = PK.spot.validate(s);
  if (ids.has(s.id)) errs.push(s.id + ': duplikált id');
  ids.add(s.id);
  if (errs.length) bad++;
  const head = `${errs.length ? '✗' : '✓'} ${s.id} [${s.stage}] d${s.diff} ${s.cats.join('/')} — ${s.title}`;
  console.log(head);
  if (verbose && s.table && !errs.length) {
    const st = PK.spot.simulate(s.table, s.id);
    const L = PK.spot.actionLines(s.table, s.id);
    console.log(
      `    utca: ${st.street} | pot: ${U.num(st.pot, 2)}bb | hívás: ${U.num(st.toCall, 2)}bb | végső pot híváskor: ${U.num(st.potIfCall, 2)}bb | kell: ${st.needEq == null ? '–' : U.pct(st.needEq)} | eff: ${U.num(st.effStart, 2)}bb | SPR: ${st.spr == null ? '–' : U.num(st.spr, 2)} | hős mögött: ${st.hero.stack.toFixed(2)}bb`,
    );
    for (const k of ['pre', 'flop', 'turn', 'river']) if (L[k].length) console.log(`    ${k}: ${L[k].join(', ')}`);
    if (st.toActAfter.length) console.log(`    utána még dönt: ${st.toActAfter.join(', ')}`);
  }
  for (const e of errs) console.log('    HIBA: ' + e);
}
const byCat = {};
const byDiff = {};
const byStage = {};
for (const s of spots) {
  s.cats.forEach((c) => (byCat[c] = (byCat[c] || 0) + 1));
  byDiff[s.diff] = (byDiff[s.diff] || 0) + 1;
  byStage[s.stage] = (byStage[s.stage] || 0) + 1;
}
console.log(`\n${spots.length} spot, ${bad} hibás.`);
console.log('kategóriák:', JSON.stringify(byCat));
console.log('nehézség:', JSON.stringify(byDiff), '| szakasz:', JSON.stringify(byStage));
process.exit(bad ? 1 : 0);
