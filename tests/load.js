// Betölti a böngészős szkripteket Node-ba (ugyanabban a sorrendben, mint az index.html).
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const CORE = ['util', 'cards', 'ranges', 'spot', 'icm', 'equity', 'scoring', 'srs', 'drills'];

function load() {
  for (const f of CORE) {
    const p = path.join(ROOT, 'js', 'core', f + '.js');
    if (fs.existsSync(p)) require(p);
  }
  const dataDir = path.join(ROOT, 'js', 'data');
  const order = ['concepts.js', 'charts.js'];
  const rest = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith('.js') && order.indexOf(f) < 0)
    .sort();
  for (const f of order.concat(rest)) {
    const p = path.join(dataDir, f);
    if (fs.existsSync(p)) require(p);
  }
  return globalThis.PK;
}

module.exports = { load, ROOT };
