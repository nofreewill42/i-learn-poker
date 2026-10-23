/* i-learn-poker — ábrák: kategória-dumbbell (első próba → legutóbbi), nehézség-oszlopok, 13×13 range-rács */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.ui = PK.ui || {};
  const esc = (s) => PK.util.esc(s);
  const clampPct = (v) => Math.max(0, Math.min(100, v));

  /**
   * rows: [{ code, short, diag: {score, n}, now: {score, n} }]
   * Skála 0–100; a 60 alatti sáv a fókusz, a 80 fölötti az erősség.
   */
  function dumbbell(rows) {
    let html = '<div class="legend"><span><i class="k-diag"></i>Első próbálkozás (diagnózis)</span><span><i class="k-now"></i>Legutóbbi próbálkozás</span></div>';
    html += '<div class="axis-row" aria-hidden="true"><span></span><span class="ticks"><span>0</span><span>50</span><span>100</span></span><span></span></div>';
    html += '<div class="dumbbell" role="table" aria-label="Kategória-pontszámok, első és legutóbbi próbálkozás">';
    for (const r of rows) {
      const has = r.now.n > 0;
      const a = r.diag.n ? clampPct(r.diag.score) : null;
      const b = clampPct(r.now.score);
      html += '<div class="row-cat' + (has ? '' : ' is-empty') + '" role="row">';
      html += '<div class="name" role="rowheader">' + esc(r.short) + '<small>' + esc(r.code) + ', ' + (has ? r.now.n + ' spot' : 'nincs adat') + '</small></div>';
      html += '<div class="track" role="cell" aria-label="' + (has ? 'legutóbbi ' + Math.round(b) + (a != null ? ', első ' + Math.round(a) : '') : 'nincs adat') + '">';
      html += '<span class="band"></span><span class="tick" style="left:60%"></span><span class="tick" style="left:80%"></span>';
      if (has) {
        if (a != null && Math.abs(a - b) >= 1) html += '<span class="link" style="left:' + Math.min(a, b) + '%;width:' + Math.abs(a - b) + '%"></span>';
        if (a != null) html += '<span class="dot d-diag" style="left:' + a + '%" title="Első próbálkozás: ' + Math.round(a) + '"></span>';
        html += '<span class="dot d-now" style="left:' + b + '%" title="Legutóbbi: ' + Math.round(b) + '"></span>';
      }
      html += '</div>';
      html += '<div class="val" role="cell">' + (has ? Math.round(b) : '–') + (has && a != null ? '<small>első: ' + Math.round(a) + '</small>' : '') + '</div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function diffBars(byDiff) {
    let html = '<div class="diffbars">';
    for (let d = 1; d <= 5; d++) {
      const b = byDiff[d] || { n: 0, ok: 0 };
      const rate = b.n ? b.ok / b.n : 0;
      html += '<div class="col"><div class="bar" title="' + b.ok + '/' + b.n + ' sikeres"><i style="height:' + Math.round(rate * 100) + '%"></i><span class="thr"></span></div>';
      html += '<div><b>' + (b.n ? Math.round(rate * 100) + '%' : '–') + '</b><br>' + d + '. szint, ' + b.ok + '/' + b.n + '</div></div>';
    }
    html += '</div>';
    return html;
  }

  /** 13×13 range-rács; set: kézosztályok halmaza, hl: kiemelt osztály */
  function rangeGrid(set, hl, label) {
    let html = '<div class="rgrid" role="img" aria-label="' + esc(label || 'Range-rács') + '">';
    for (let i = 0; i < 13; i++) {
      for (let j = 0; j < 13; j++) {
        const c = PK.cards.gridClass(i, j);
        const cls = (set && set.has(c) ? 'in' : '') + (hl === c ? ' hl' : '');
        html += '<span class="' + cls + '">' + c + '</span>';
      }
    }
    html += '</div>';
    return html;
  }

  PK.ui.viz = { dumbbell, diffBars, rangeGrid };
})(typeof window !== 'undefined' ? window : globalThis);
