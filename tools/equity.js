#!/usr/bin/env node
// Equity-számítás parancssorból.
// Használat: node tools/equity.js Kc Jd "77+, ATs+, AJo+, KQs" [board: Jh 7h 2c] [--trials 100000]
//            node tools/equity.js Ah As vs Kd Kc [board: Ks 7d 4c]
const path = require('path');
const ROOT = path.join(__dirname, '..');
for (const f of ['util', 'cards', 'ranges', 'equity']) require(path.join(ROOT, 'js/core', f + '.js'));
const PK = globalThis.PK;

const USAGE = [
  'Használat:',
  '  node tools/equity.js Kc Jd "77+, ATs+, AJo+, KQs" [Jh 7h 2c] [--trials 100000]',
  '  node tools/equity.js Ah As vs Kd Kc [Ks 7d 4c]',
].join('\n');

const a = process.argv.slice(2);
let trials = 100000;
const ti = a.indexOf('--trials');
if (ti >= 0) {
  trials = Number(a[ti + 1]);
  a.splice(ti, 2);
}
if (a.length < 3 || (a[2] === 'vs' && a.length < 5) || !(trials > 0)) {
  console.error(USAGE);
  process.exit(1);
}
const hero = [a[0], a[1]];
let o;
if (a[2] === 'vs') o = { hero, villain: [a[3], a[4]], board: a.slice(5), trials };
else o = { hero, range: a[2], board: a.slice(3), trials };
try {
  const r = PK.equity.vs(o);
  console.log(`${hero.join(' ')} equity: ${(r.eq * 100).toFixed(1)}% (nyer ${(r.win * 100).toFixed(1)}%, döntetlen ${(r.tie * 100).toFixed(1)}%) — ${r.combos} ellenfél-kombináció, ${r.trials} szimuláció`);
} catch (e) {
  console.error('Hiba: ' + e.message + '\n\n' + USAGE);
  process.exit(1);
}
