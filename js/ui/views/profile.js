/* i-learn-poker — Profil: szintbecslés, kategóriák, gondolkodási minták, előzmények */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.views = PK.views || {};
  const esc = (s) => PK.util.esc(s);

  function badge(n) {
    let segs = '';
    for (let i = 0; i < 8; i++) {
      const a = ((i * 45 + 22.5) * Math.PI) / 180;
      segs += '<rect class="spot" x="-5" y="-3" width="10" height="6" rx="1.5" transform="translate(' + (48 + 41 * Math.cos(a)).toFixed(1) + ' ' + (48 + 41 * Math.sin(a)).toFixed(1) + ') rotate(' + (i * 45 + 22.5 + 90) + ')"/>';
    }
    return (
      '<svg class="level__badge" viewBox="0 0 96 96" role="img" aria-label="' + n + '. szint"><circle class="rim" cx="48" cy="48" r="47"/>' +
      segs +
      '<circle class="inner" cx="48" cy="48" r="31"/><text x="48" y="63" text-anchor="middle">' + n + '</text></svg>'
    );
  }

  function view(main) {
    const S = PK.store.state;
    const sc = PK.scoring;
    const lv = sc.levelEstimate(S.attempts, PK.store.spotById);
    const first = sc.firstAttempts(S.attempts);
    const latest = sc.latestAttempts(S.attempts);
    const diag = sc.categoryScores(first, PK.store.spotById);
    const now = sc.categoryScores(latest, PK.store.spotById);

    let h = '<div class="page-head"><div><h1>Profil</h1><p>Hol tartasz most, és mire érdemes figyelned. A szintet az első próbálkozásaidból becslem — amikor még nem láttad a megoldást.</p></div>';
    h += '<a class="btn" href="#/adatok">' + PK.ui.icons.down + 'Export Claude-nak</a></div>';

    if (!S.attempts.length) {
      h += '<div class="empty"><h3>Még nincs adat</h3><p>Oldj meg néhány spotot a diagnosztikai körben, és itt megjelenik a szinted, az erősségeid és a fókuszpontjaid.</p><a class="btn btn--primary" href="#/edzes">Diagnosztikai kör indítása</a></div>';
      main.innerHTML = h;
      return {};
    }

    // szint
    h += '<div class="section"><div class="level"><div class="level__n">' + badge(lv.enough ? lv.level : '?') + '<div><div class="level__label">' + (lv.enough ? esc(lv.label) : 'Még kevés az adat') + (lv.rising ? ' <span class="tag tag--sel">feltörekvő</span>' : '') + '</div>';
    h += '<div class="muted small">' + lv.firstN + ' spot első próbálkozása alapján</div></div></div>';
    h += '<div><p style="margin:0">' + (lv.enough ? '<span class="muted">Erre a szintre jellemző:</span> ' + esc(lv.desc) : 'Az 1. nehézségi szintből legalább 3 spot kell az első becsléshez.') + '</p>';
    if (lv.missing) {
      const m = lv.missing;
      h += '<p class="small muted" style="margin:6px 0 0">' + (m.reason === 'kevés adat' ? 'A(z) ' + m.diff + '. nehézségi szint értékeléséhez még ' + m.need + ' spot első próbálkozása kell.' : 'A(z) ' + m.diff + '. nehézségi szinten a sikerarány még 70% alatt van — ez a következő lépcső.') + '</p>';
    }
    lv.notes.forEach((n) => (h += '<p class="small muted" style="margin:6px 0 0">' + esc(n) + '</p>'));
    h += '<div class="ladder" aria-hidden="true">' + [1, 2, 3, 4, 5].map((i) => '<div class="' + (lv.enough && i <= lv.level ? 'is-on' : '') + '">' + esc(sc.LEVELS[i].label) + '</div>').join('') + '</div>';
    h += '<details class="more"><summary>Hogyan számolom?</summary><p class="small" style="margin-top:8px">Minden spot 0–100 pontot ér: a döntés 60, az érvelés 40 (a kulcsfaktorok 25, a gondolkodás minősége 15: range, számolás, terv), levonás jár az eredmény-orientált érvért, a tilt-jelért és a tell-mítoszért. Egy spot akkor sikeres, ha legalább 70 pont (gyors módban: legjobb vagy elfogadható döntés). Egy nehézségi szint akkor „megvan”, ha legalább 3 spotból 70% sikeres. A becsült szint = 1 + a megszerzett nehézségi szintek száma. Ha a gondolkodási minőséged átlaga 6/15 alatt van, egy szinttel lejjebb sorollak; ha 12/15 fölött és a következő szinten már legalább a fele sikerül, „feltörekvő” vagy. Ha egy spot megoldását mentés nélkül megnézted, a következő próbálkozása már nem számít a szintbe.</p></details>';
    h += '</div></div></div>';

    // kategóriák + mellékoszlop
    const rows = sc.CATEGORIES.map((c) => ({ code: c.code, short: c.short, name: c.name, diag: diag[c.code], now: now[c.code] }));
    rows.sort((a, b) => (b.now.n > 0) - (a.now.n > 0) || a.now.score - b.now.score);
    const weak = rows.filter((r) => r.now.n > 0).slice(0, 3);

    h += '<div class="grid-2"><div class="section"><h2>Kategóriák</h2><p class="small muted">Elöl a leggyengébb. 60 alatt fókusz, 80 fölött erősség; kevés adatnál a pontszám 50 felé húz.</p>' + PK.ui.viz.dumbbell(rows);
    if (weak.length) h += '<div class="row" style="margin-top:14px"><button type="button" class="btn btn--primary" data-act="weak" data-cats="' + weak.map((r) => r.code).join(',') + '">Gyakorold a leggyengébbeket: ' + weak.map((r) => esc(r.short)).join(', ') + '</button></div>';
    h += '</div>';

    h += '<div>';
    h += '<div class="section"><h2>Siker nehézség szerint</h2><p class="small muted">Első próbálkozások; a szaggatott vonal a 70%-os küszöb.</p>' + PK.ui.viz.diffBars(lv.byDiff) + '</div>';

    const full = S.attempts.filter((a) => a.mode === 'full' && a.quality);
    if (full.length) {
      const share = (k) => Math.round((full.filter((a) => a.quality[k]).length / full.length) * 100);
      const fcov = Math.round((full.reduce((x, a) => x + (a.factorsPts || 0), 0) / full.length / 25) * 100);
      h += '<div class="section"><h2>A gondolkodásod</h2><table class="t"><tbody>';
      h += '<tr><td>A kulcsszempontok lefedettsége</td><td class="r">' + fcov + '%</td></tr>';
      h += '<tr><td>Range-ben gondolkodtál</td><td class="r">' + share('range') + '%</td></tr>';
      h += '<tr><td>Számoltál (bb, %, pot odds)</td><td class="r">' + share('quant') + '%</td></tr>';
      h += '<tr><td>Volt terved a következő lépésre</td><td class="r">' + share('plan') + '%</td></tr>';
      const avgT = Math.round(full.reduce((x, a) => x + (a.timeSec || 0), 0) / full.length);
      h += '<tr><td>Átlagos döntési idő</td><td class="r">' + avgT + ' mp</td></tr>';
      const conf = S.attempts.filter((a) => a.confidence);
      if (conf.length >= 5) {
        const hi = conf.filter((a) => a.confidence >= 4);
        const hiOk = hi.filter((a) => a.grade === 'best' || a.grade === 'good').length;
        if (hi.length) h += '<tr><td>Ha 4–5-ös magabiztosságot adtál, ennyiszer volt jó a döntés</td><td class="r">' + Math.round((hiOk / hi.length) * 100) + '%</td></tr>';
      }
      h += '</tbody></table></div>';
    }

    const fc = {};
    S.attempts.forEach((a) => (a.flags || []).forEach((f) => (fc[f.cat + '|' + f.msg] = (fc[f.cat + '|' + f.msg] || 0) + 1)));
    const top = Object.entries(fc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    if (top.length) {
      h += '<div class="section"><h2>Visszatérő minták</h2><ul class="flags">';
      top.forEach(([k, n]) => {
        const [cat, msg] = k.split('|');
        h += '<li><span class="tag tag--warn">' + esc(cat) + '</span> ' + esc(msg) + ' <span class="faint">(' + n + '×)</span></li>';
      });
      h += '</ul></div>';
    }

    const pf = S.drills.pf;
    const po = S.drills.po;
    if (pf.n || po.n) {
      h += '<div class="section"><h2>Villámdrillek</h2><table class="t"><tbody>';
      if (pf.n) {
        h += '<tr><td>Push/fold (10bb)</td><td class="r">' + PK.util.pct(pf.ok / pf.n, 0) + ' <span class="faint">(' + pf.n + ')</span></td></tr>';
        Object.entries(pf.byPos || {}).forEach(([p, v]) => (h += '<tr><td class="faint">&nbsp;&nbsp;' + esc(p) + '</td><td class="r faint">' + PK.util.pct(v.ok / v.n, 0) + ' (' + v.n + ')</td></tr>'));
      }
      if (po.n) h += '<tr><td>Pot odds</td><td class="r">' + PK.util.pct(po.ok / po.n, 0) + ' <span class="faint">(' + po.n + ')</span></td></tr>';
      h += '</tbody></table></div>';
    }
    h += '</div></div>';

    // előzmények
    const recent = S.attempts.slice().reverse().slice(0, 60);
    const histItem = (a) => {
      const s = PK.store.spotById(a.spotId);
      const gr = PK.scoring.GRADE[a.grade];
      return '<li><div><a href="#/profil/spot/' + encodeURIComponent(a.spotId) + '">' + esc(s ? s.title : a.spotId) + '</a><div class="meta">' + esc(PK.util.dateTimeHu(a.ts)) + ', ' + esc(gr ? gr.label.toLowerCase() : a.grade) + (a.mode === 'quick' ? ', gyors mód' : '') + '</div></div><div class="pts">' + a.total + '</div></li>';
    };
    h += '<div class="section" style="margin-top:16px"><h2>Előzmények</h2><ul class="hist">' + recent.slice(0, 12).map(histItem).join('') + '</ul>';
    if (recent.length > 12) h += '<details class="more"><summary>Korábbiak (' + (recent.length - 12) + ')</summary><ul class="hist">' + recent.slice(12).map(histItem).join('') + '</ul></details>';
    h += '</div>';

    // spotbank
    const tried = new Map();
    S.attempts.forEach((a) => tried.set(a.spotId, a));
    const all = PK.store.allSpots();
    h += '<div class="section"><h2>Spotbank</h2><p class="small muted">' + all.length + ' spot, ebből ' + all.filter((s) => tried.has(s.id)).length + ' láttál már. Az újakat a megoldás felfedése nélkül indíthatod.</p>';
    h += '<div class="table-wrap"><table class="t"><thead><tr><th>Spot</th><th>Kategória</th><th class="r">Szint</th><th class="r">Utolsó</th><th>Ismétlés</th></tr></thead><tbody>';
    all.forEach((s) => {
      const a = tried.get(s.id);
      const due = S.srs[s.id];
      h += '<tr><td>' + (a ? '<a href="#/profil/spot/' + encodeURIComponent(s.id) + '">' + esc(s.title) + '</a>' : '<button type="button" class="linkbtn" data-act="one" data-id="' + esc(s.id) + '">' + esc(s.title) + '</button> <span class="tag">új</span>') + '</td>';
      h += '<td>' + esc(s.cats.map((c) => (PK.scoring.CAT[c] ? PK.scoring.CAT[c].short : c)).join(', ')) + '</td><td class="r">' + s.diff + '</td><td class="r">' + (a ? a.total : '–') + '</td><td>' + (due ? esc(PK.util.dateHu(due.due)) : '–') + '</td></tr>';
    });
    h += '</tbody></table></div></div>';

    main.innerHTML = h;
    return {
      onClick(act, el) {
        if (act === 'weak') PK.train.start('weak', { cats: el.dataset.cats.split(',') });
        else if (act === 'one') PK.train.start('one', { id: el.dataset.id });
      },
    };
  }

  function spotDetail(main, params) {
    const id = decodeURIComponent(params[0]);
    const spot = PK.store.spotById(id);
    const S = PK.store.state;
    if (!spot) {
      main.innerHTML = '<div class="empty"><h3>Ez a spot nem található</h3><p>Lehet, hogy egy törölt saját spot volt.</p><a class="btn" href="#/profil">Vissza a profilhoz</a></div>';
      return {};
    }
    const atts = S.attempts.filter((a) => a.spotId === id).reverse();
    const srs = S.srs[id];
    let h = '<div class="page-head"><div><h1>' + esc(spot.title) + '</h1><p>' + spot.cats.map((c) => esc(PK.scoring.CAT[c] ? PK.scoring.CAT[c].name : c)).join(', ') + '; ' + spot.diff + '. nehézségi szint' + (srs ? '; következő ismétlés: ' + esc(PK.util.dateHu(srs.due)) : '') + '</p></div>';
    h += '<div class="row"><button type="button" class="btn btn--primary" data-act="again">Újra gyakorlom</button><a class="btn btn--ghost" href="#/profil">Vissza</a></div></div>';
    h += '<div class="section"><h2>Megoldás</h2><p><b>' + esc(spot.ans) + '</b></p><p>' + esc(spot.exp) + '</p></div>';
    h += '<h2 style="margin:20px 0 10px">Próbálkozásaid (' + atts.length + ')</h2>';
    atts.forEach((a) => {
      const o = spot.opts.find((x) => x.id === a.choice);
      const gr = PK.scoring.GRADE[a.grade];
      h += '<div class="section"><div class="row row--between"><h3>' + esc(PK.util.dateTimeHu(a.ts)) + '</h3><span class="num" style="font-size:1.5rem">' + a.total + '</span></div>';
      h += '<p>Döntés: <b>' + esc(o ? o.t : a.choice) + '</b> — ' + esc(gr ? gr.label : '') + (a.timeSec ? ', ' + a.timeSec + ' mp' : '') + (a.confidence ? ', magabiztosság ' + a.confidence + '/5' : '') + '</p>';
      if (a.phase1) h += '<p><span class="muted">Hangos gondolkodás:</span> „' + esc(a.phase1) + '”</p>';
      if (a.audio) h += PK.ui.recorder.slots(a.audio.p1);
      if (a.phase2) h += '<p><span class="muted">Magyarázat:</span> „' + esc(a.phase2) + '”</p>';
      if (a.audio) h += PK.ui.recorder.slots(a.audio.p2);
      if (a.flags && a.flags.length) h += '<ul class="flags">' + a.flags.map((f) => '<li><span class="tag tag--warn">' + esc(f.cat) + '</span> ' + esc(f.msg) + '</li>').join('') + '</ul>';
      h += '<div class="row" style="margin-top:8px"><button type="button" class="btn btn--sm btn--ghost" data-act="del" data-id="' + esc(a.id) + '">' + PK.ui.icons.trash + 'Törlés</button></div></div>';
    });
    main.innerHTML = h;
    PK.ui.recorder.hydrate(main);
    return {
      onClick(act, el) {
        if (act === 'again') PK.train.start('one', { id });
        else if (act === 'del') {
          if (g.confirm('Biztosan törlöd ezt a próbálkozást? A hangfelvétele is törlődik.')) {
            PK.store.deleteAttempt(el.dataset.id);
            spotDetail(main, params);
          }
        }
      },
    };
  }

  PK.views.profile = { view, spotDetail };
})(typeof window !== 'undefined' ? window : globalThis);
