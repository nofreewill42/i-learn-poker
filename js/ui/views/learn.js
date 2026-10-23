/* i-learn-poker — Tudástár: technikák, leak-taxonómia, chartok, tanulási terv, Duna Poker Center */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.views = PK.views || {};
  const esc = (s) => PK.util.esc(s);

  const TABS = [
    ['technikak', 'Technikák'],
    ['leakek', 'Leakek'],
    ['chartok', 'Chartok'],
    ['terv', 'Tanulási terv'],
    ['duna', 'Duna Poker'],
  ];
  const TOPICS = [
    ['', 'Mind'],
    ['preflop', 'Preflop'],
    ['stack', 'Stackmélység'],
    ['postflop', 'Postflop'],
    ['tournament', 'Verseny és ICM'],
    ['exploit', 'Exploit'],
    ['mental', 'Mentál'],
  ];

  function tabs(cur) {
    return '<nav class="tabs" aria-label="Tudástár">' + TABS.map(([k, l]) => '<a href="#/tudas/' + k + '"' + (k === cur ? ' aria-current="page"' : '') + '>' + l + '</a>').join('') + '</nav>';
  }

  function catTags(cats) {
    return (cats || []).map((c) => '<button type="button" class="tag" data-act="practice" data-cat="' + esc(c) + '" title="Gyakorold ezt a kategóriát">' + esc(PK.scoring.CAT[c] ? PK.scoring.CAT[c].short : c) + '</button>').join(' ');
  }

  function missing(what) {
    return '<div class="notice notice--warn"><p>A(z) ' + esc(what) + ' adatai nem töltődtek be.</p></div>';
  }

  function view(main, params) {
    const tab = (params && params[0]) || 'technikak';
    const state = { topic: '', q: '', chart: 'MP2' };

    function render() {
      let h = '<div class="page-head"><div><h1>Tudástár</h1><p>Technikák, chartok és a terv — a gyakorló spotok mögötti elmélet, a Duna-mezőnyre szabva.</p></div></div>';
      h += tabs(tab);
      if (tab === 'technikak') h += techniques(state);
      else if (tab === 'leakek') h += leaks();
      else if (tab === 'chartok') h += charts(state);
      else if (tab === 'terv') h += plan();
      else if (tab === 'duna') h += venue();
      main.innerHTML = h;
      if (tab === 'technikak') {
        const inp = main.querySelector('[data-f="q"]');
        if (inp && state.focusSearch) {
          inp.focus();
          inp.setSelectionRange(inp.value.length, inp.value.length);
          state.focusSearch = false;
        }
      }
    }

    render();
    return {
      onClick(act, el) {
        if (act === 'topic') {
          state.topic = el.dataset.v;
          render();
        } else if (act === 'chart') {
          state.chart = el.dataset.v;
          render();
        } else if (act === 'practice') {
          PK.train.start('filter', { cat: el.dataset.cat });
        }
      },
      onInput(act, el) {
        if (el.dataset.f === 'q') {
          state.q = el.value;
          state.focusSearch = true;
          render();
        }
      },
    };
  }

  function techniques(state) {
    const list = PK.data.techniques;
    if (!list) return missing('technikák');
    const nq = PK.util.norm(state.q);
    const items = list.filter((t) => (!state.topic || t.topic === state.topic) && (!nq || PK.util.norm([t.title, t.what, t.when, t.live, t.mistake, (t.rules || []).join(' ')].join(' ')).indexOf(nq) >= 0));
    let h = '<div class="row" style="margin-bottom:14px"><div class="seg" role="group" aria-label="Téma">';
    TOPICS.forEach(([k, l]) => (h += '<button type="button" data-act="topic" data-v="' + k + '" aria-pressed="' + (state.topic === k) + '">' + l + '</button>'));
    h += '</div><input type="search" data-f="q" value="' + esc(state.q) + '" placeholder="Keresés, pl. squeeze, SPR, tilt" aria-label="Keresés a technikák között" style="max-width:280px"></div>';
    h += '<div class="section">';
    if (!items.length) h += '<p class="muted">Nincs találat.</p>';
    items.forEach((t, i) => {
      h += '<article class="tech"><h3>' + esc(t.title) + ' <span class="row" style="gap:6px">' + catTags(t.cats) + '</span></h3><dl>';
      if (t.what) h += '<dt>Mi ez</dt><dd>' + esc(t.what) + '</dd>';
      if (t.when) h += '<dt>Mikor</dt><dd>' + esc(t.when) + '</dd>';
      if (t.live) h += '<dt>Élőben</dt><dd>' + esc(t.live) + '</dd>';
      if (t.mistake) h += '<dt>Tipikus hiba</dt><dd>' + esc(t.mistake) + '</dd>';
      if (t.stage) h += '<dt>Mikor számít</dt><dd>' + esc(t.stage) + '</dd>';
      if (t.rules && t.rules.length) h += '<dt>Ökölszabályok</dt><dd><ul>' + t.rules.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul></dd>';
      if (t.src) h += '<dt>Forrás</dt><dd class="small muted">' + esc(t.src) + '</dd>';
      h += '</dl></article>';
      if (i === items.length - 1) h += '';
    });
    h += '</div>';
    return h;
  }

  function leaks() {
    const L = PK.data.leaks;
    if (!L) return missing('leak-taxonómia');
    const S = PK.store.state;
    const now = PK.scoring.categoryScores(PK.scoring.latestAttempts(S.attempts), PK.store.spotById);
    let h = '<p class="muted" style="max-width:70ch">Minden kategóriához: a tipikus hibák, és hogy ezek milyen mondatokban bukkannak fel a hangos gondolkodásban. Az app ezeket a jeleket keresi az átirataidban.</p>';
    L.forEach((l) => {
      const c = PK.scoring.CAT[l.code] || { name: l.code };
      const sc = now[l.code];
      h += '<div class="section"><div class="row row--between"><h2>' + esc(l.code + ' – ' + c.name) + '</h2><span class="row">' + (sc && sc.n ? '<span class="tag">' + Math.round(sc.score) + ' pont, ' + sc.n + ' spot</span>' : '') + '<button type="button" class="btn btn--sm" data-act="practice" data-cat="' + esc(l.code) + '">Gyakorlom</button></span></div>';
      h += '<div class="grid-2" style="margin-top:8px"><div><p style="margin-bottom:4px;font-weight:600">Tipikus leakek</p><ul>' + (l.leaks || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
      h += '<div><p style="margin-bottom:4px;font-weight:600">Árulkodó mondatok</p><ul>' + (l.markers || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></div>';
      if (l.fix) h += '<p class="notice notice--ok" style="margin-bottom:0">' + esc(l.fix) + '</p>';
      h += '</div>';
    });
    return h;
  }

  function charts(state) {
    const C = PK.data.charts;
    const pf = C.pf10.rows.find((r) => r.pos === state.chart) || C.pf10.rows[0];
    const set = PK.ranges.parse(pf.range);
    let h = '<div class="section"><h2>' + esc(C.pf10.title) + '</h2><p class="small muted">' + esc(C.pf10.setup) + '. ' + esc(C.pf10.note) + '</p>';
    h += '<div class="seg" role="group" aria-label="Pozíció" style="margin:8px 0 14px">';
    C.pf10.rows.forEach((r) => (h += '<button type="button" data-act="chart" data-v="' + esc(r.pos) + '" aria-pressed="' + (r.pos === pf.pos) + '">' + esc(r.pos) + '</button>'));
    h += '</div><div class="grid-2"><div>' + PK.ui.viz.rangeGrid(set, null, pf.pos + ' nyitó all-in range') + '</div><div>';
    h += '<p class="num" style="font-size:2rem;margin:0">' + PK.util.num(pf.pct, 1) + '%</p><p class="muted">' + esc(pf.pos) + ' (10 fős asztalon: ' + esc(pf.ten) + ')</p><p><code>' + esc(pf.range) + '</code></p>';
    h += '<p class="small faint">Forrás: ' + esc(C.pf10.source) + '</p><a class="btn btn--sm" href="#/drill/pushfold">Gyakorlom a drillben</a></div></div></div>';

    h += '<div class="section"><h2>' + esc(C.call10.title) + '</h2><p class="small muted">' + esc(C.call10.setup) + '</p><div class="grid-2">';
    C.call10.rows.forEach((r) => (h += '<div><h3>' + esc(r.pos) + ', ' + PK.util.num(r.pct, 1) + '%</h3><p class="small"><code>' + esc(r.range) + '</code></p>' + PK.ui.viz.rangeGrid(PK.ranges.parse(r.range), null, r.pos + ' hívási range') + '</div>'));
    h += '</div></div>';

    h += '<div class="section"><h2>' + esc(C.reshove20.title) + '</h2><p class="small muted">' + esc(C.reshove20.setup) + '. Forrás: ' + esc(C.reshove20.source) + '.</p><div class="grid-2">';
    C.reshove20.rows.forEach((r) => (h += '<div><h3>' + esc(r.ten) + '</h3><p class="small"><code>' + esc(r.range) + '</code></p>' + PK.ui.viz.rangeGrid(PK.ranges.parse(r.range), null, r.ten + ' reshove range') + '</div>'));
    h += '</div></div>';

    h += '<div class="section"><h2>' + esc(C.rfi.title) + '</h2><div class="table-wrap"><table class="t"><thead><tr><th>Pozíció</th><th class="r">Mélyen (100bb+)</th><th class="r">~40bb, BB ante</th></tr></thead><tbody>';
    C.rfi.rows.forEach((r) => (h += '<tr><td>' + esc(r.pos) + (r.example ? '<div class="small faint">' + esc(r.example) + '</div>' : '') + '</td><td class="r">' + esc(r.deep) + '</td><td class="r">' + esc(r.mid) + '</td></tr>'));
    h += '</tbody></table></div><p class="small" style="margin-top:10px">' + esc(C.rfi.sizes) + '</p><p class="small faint" style="margin:0">' + esc(C.rfi.source) + '</p></div>';
    h += '<div class="section"><h2>' + esc(C.bba.title) + '</h2><p style="margin:0">' + esc(C.bba.text) + '</p></div>';
    return h;
  }

  function plan() {
    const P = PK.data.plan;
    if (!P) return missing('tanulási terv');
    const S = PK.store.state;
    const start = S.plan.start ? new Date(S.plan.start) : null;
    const week = start ? Math.floor(PK.util.daysBetween(start, new Date()) / 7) + 1 : null;
    let h = '<div class="section"><h2>10 hetes út</h2><p class="small muted">' + (start ? 'Az első spotodtól számolva most a ' + week + '. hétnél tartasz.' : 'A terv az első megoldott spotoddal indul.') + '</p><ul class="weeks">';
    (P.weeks || []).forEach((w) => {
      const now = week && week >= w.from && week <= w.to;
      h += '<li class="' + (now ? 'is-now' : '') + '"><div class="wk">' + (w.from === w.to ? w.from + '.' : w.from + '–' + w.to + '.') + '<div class="small muted" style="font-family:var(--f-ui)">hét</div></div><div><h3>' + esc(w.title) + '</h3>';
      if (w.goal) h += '<p style="margin:4px 0">' + esc(w.goal) + '</p>';
      if (w.focus && w.focus.length) h += '<ul>' + w.focus.map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul>';
      if (w.cats && w.cats.length) h += '<div class="row" style="gap:6px">' + catTags(w.cats) + '</div>';
      h += '</div></li>';
    });
    h += '</ul></div>';

    h += '<div class="grid-2">';
    (P.weekly || []).forEach((b) => (h += '<div class="section"><h3>' + esc(b.when) + '</h3><ul>' + (b.items || []).map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul></div>'));
    h += '</div>';
    if (P.preSession) h += '<div class="grid-2" style="margin-top:16px"><div class="section"><h3>Verseny előtt</h3><div class="stack">' + P.preSession.map((t) => '<label class="check"><input type="checkbox"><span>' + esc(t) + '</span></label>').join('') + '</div></div>';
    if (P.postSession) h += '<div class="section"><h3>Verseny után</h3><div class="stack">' + P.postSession.map((t) => '<label class="check"><input type="checkbox"><span>' + esc(t) + '</span></label>').join('') + '</div></div></div>';
    if (P.thinkAloud) {
      const T = P.thinkAloud;
      h += '<div class="section" style="margin-top:16px"><h2>A hangos gondolkodás protokollja</h2><p><b>1. fázis, döntés előtt:</b> ' + esc(T.phase1) + '</p>';
      if (T.phase2) h += '<p style="margin-bottom:4px"><b>2. fázis, döntés után:</b></p><ol>' + T.phase2.map((q) => '<li>' + esc(q) + '</li>').join('') + '</ol>';
      if (T.tips) h += '<ul>' + T.tips.map((q) => '<li>' + esc(q) + '</li>').join('') + '</ul>';
      h += '</div>';
    }
    if (P.levels) {
      h += '<div class="section"><h2>Szintek és gondolkodási jelek</h2><table class="t"><tbody>' + P.levels.map((l) => '<tr><td style="white-space:nowrap"><b>' + l.n + ' – ' + esc(l.label) + '</b></td><td>' + esc(l.markers) + '</td></tr>').join('') + '</tbody></table></div>';
    }
    return h;
  }

  function venue() {
    const V = PK.data.venue;
    if (!V) return missing('Duna Poker Center');
    let h = '<div class="section"><h2>' + esc(V.name) + '</h2><p>' + esc(V.address || '') + (V.rooms ? '. ' + esc(V.rooms) : '') + '</p>';
    if (V.contact) h += '<p class="small">' + esc([V.contact.email, V.contact.phone].filter(Boolean).join(', ')) + '</p>';
    h += '<div class="notice notice--warn"><p>' + esc(V.disclaimer || '') + (V.checked ? ' Az adatok ideje: ' + esc(V.checked) + '.' : '') + '</p></div></div>';
    h += '<div class="section"><h2>Heti versenyek</h2><div class="table-wrap"><table class="t"><thead><tr><th>Nap</th><th>Verseny</th><th class="r">Buy-in</th><th>Stack</th><th>Szintek</th><th>Late reg</th><th>Újravásárlás</th></tr></thead><tbody>';
    (V.schedule || []).forEach((s) => (h += '<tr><td style="white-space:nowrap">' + esc(s.day + ' ' + s.time) + '</td><td>' + esc(s.name) + '</td><td class="r" style="white-space:nowrap">' + esc(PK.util.ft(s.buyIn)) + '</td><td>' + esc(s.stack) + '</td><td>' + esc(s.levels) + '</td><td>' + esc(s.lateReg) + '</td><td>' + esc(s.reentry) + '</td></tr>'));
    h += '</tbody></table></div>';
    if (V.stackNote) h += '<p class="small muted" style="margin-top:10px">' + esc(V.stackNote) + '</p>';
    if (V.series) h += '<p class="small" style="margin-top:10px">' + esc(V.series) + '</p>';
    h += '</div>';
    h += '<div class="grid-2"><div class="section"><h2>Kifizetés és buborék</h2>' + (V.payouts ? '<p>' + esc(V.payouts) + '</p>' : '') + (V.bubble ? '<p style="margin:0">' + esc(V.bubble) + '</p>' : '') + '</div>';
    h += '<div class="section"><h2>Kérdezd meg a floort</h2><ul>' + (V.askFloor || []).map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul></div></div>';
    if (V.houseRules) h += '<div class="section" style="margin-top:16px"><h2>Telefon, jegyzet, házszabály</h2><ul>' + V.houseRules.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul></div>';
    if (V.helpline) h += '<p class="small muted">' + esc(V.helpline.label) + ': <b>' + esc(V.helpline.phone) + '</b></p>';
    if (V.license) h += '<p class="small faint" style="margin:0">' + esc(V.license) + '</p>';
    if (V.src) h += '<p class="small faint">Források: ' + esc(Array.isArray(V.src) ? V.src.join('; ') : V.src) + '</p>';
    return h;
  }

  PK.views.learn = { view };
})(typeof window !== 'undefined' ? window : globalThis);
