/* i-learn-poker — Napló: versenyek és bankroll, élő kezek, Mental Hand History, pool-napló */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.views = PK.views || {};
  const esc = (s) => PK.util.esc(s);
  const U = () => PK.util;

  const TABS = [
    ['versenyek', 'Versenyek'],
    ['kezek', 'Élő kezek'],
    ['mental', 'Mentál'],
    ['pool', 'Pool-napló'],
  ];

  function tabs(cur) {
    return '<nav class="tabs" aria-label="Napló">' + TABS.map(([k, l]) => '<a href="#/naplo/' + k + '"' + (k === cur ? ' aria-current="page"' : '') + '>' + l + '</a>').join('') + '</nav>';
  }

  function head(title, sub, btn) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (btn || '') + '</div>';
  }

  function cost(x) {
    return (Number(x.buyIn) || 0) * (1 + (Number(x.rebuys) || 0)) + (Number(x.addOn) || 0);
  }

  function seg(name, values, cur, labels) {
    return (
      '<div class="seg" role="group" data-seg="' + name + '">' +
      values.map((v, i) => '<button type="button" data-act="seg" data-name="' + name + '" data-v="' + esc(v) + '" aria-pressed="' + (String(cur) === String(v)) + '">' + esc(labels ? labels[i] : v) + '</button>').join('') +
      '</div>'
    );
  }

  function readSeg(main, name) {
    const b = main.querySelector('[data-seg="' + name + '"] [aria-pressed="true"]');
    return b ? b.dataset.v : null;
  }

  function val(main, k) {
    const el = main.querySelector('[data-f="' + k + '"]');
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    return el.value.trim();
  }

  function venueOptions() {
    const v = PK.data.venue;
    if (!v || !v.schedule) return '';
    return '<datalist id="tourneys">' + v.schedule.map((s) => '<option value="' + esc(s.day + ' ' + s.time + ' ' + s.name) + '">' + esc(PK.util.ft(s.buyIn)) + '</option>').join('') + '</datalist>';
  }

  // ---------------------------------------------------------------- lista nézet
  function view(main, params) {
    const tab = (params && params[0]) || 'versenyek';
    const S = PK.store.state;
    let h = '';
    if (tab === 'versenyek') {
      h += head('Napló', 'Minden élő versenyed egy sorban: költség, helyezés, a játékod minősége és a mezőnyről tanultak.', '<a class="btn btn--primary" href="#/naplo/verseny/uj">' + PK.ui.icons.plus + 'Új verseny</a>');
      h += tabs(tab);
      const list = S.sessions.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
      if (!list.length) {
        h += '<div class="empty"><h3>Még nincs bejegyzés</h3><p>Verseny előtt írd fel a 3 fókuszpontodat, utána a helyezést, a költséget és 3 megfigyelést a mezőnyről. Ebből lesz a bankroll-összesítő és a pool-napló.</p></div>';
      } else {
        const tc = list.reduce((a, x) => a + cost(x), 0);
        const tw = list.reduce((a, x) => a + (Number(x.prize) || 0), 0);
        const itm = list.filter((x) => Number(x.prize) > 0).length;
        h += '<div class="section"><div class="calc-out" style="margin-top:0">';
        h += '<div><b>' + list.length + '</b><span>verseny</span></div>';
        h += '<div><b>' + esc(U().ft(tc)) + '</b><span>összes költség</span></div>';
        h += '<div><b>' + esc(U().ft(tw)) + '</b><span>összes nyeremény</span></div>';
        h += '<div><b>' + (tw - tc >= 0 ? '+' : '') + esc(U().ft(tw - tc)) + '</b><span>nettó</span></div>';
        h += '<div><b>' + U().pct(itm / list.length, 0) + '</b><span>pénzbe érés</span></div>';
        if (tc > 0) h += '<div><b>' + U().pct((tw - tc) / tc, 0) + '</b><span>ROI</span></div>';
        h += '</div><p class="small muted" style="margin:10px 0 0">Kis mintán a ROI szinte csak szórás: 50–100 verseny előtt ne vonj le belőle következtetést a tudásodról.</p></div>';
        h += '<div class="section"><div class="table-wrap"><table class="t"><thead><tr><th>Dátum</th><th>Verseny</th><th class="r">Költség</th><th class="r">Helyezés</th><th class="r">Nyeremény</th><th>Játék</th></tr></thead><tbody>';
        list.forEach((x) => {
          h += '<tr><td><a href="#/naplo/verseny/' + esc(x.id) + '">' + esc(x.date || '–') + '</a></td><td>' + esc(x.tournament || '–') + '</td><td class="r">' + esc(U().ft(cost(x))) + '</td><td class="r">' + esc(x.finish ? x.finish + (x.entrants ? '/' + x.entrants : '') : '–') + '</td><td class="r">' + esc(U().ft(Number(x.prize) || 0)) + '</td><td>' + esc(x.game || '–') + '</td></tr>';
        });
        h += '</tbody></table></div></div>';
      }
      const v = PK.data.venue;
      if (v && v.bankroll) h += '<div class="section"><h2>Bankroll</h2><ul>' + v.bankroll.map((b) => '<li>' + esc(b) + '</li>').join('') + '</ul>' + (v.helpline ? '<p class="small muted" style="margin:0">' + esc(v.helpline.label) + ': <b>' + esc(v.helpline.phone) + '</b></p>' : '') + '</div>';
    } else if (tab === 'kezek') {
      h += head('Napló', 'Az érdekes kezeidet a szünetben vagy hazafelé mondd el a sablon szerint. Az exporttal Claude ezeket is elemzi, és spotot csinálhat belőlük.', '<a class="btn btn--primary" href="#/naplo/kez/uj">' + PK.ui.icons.plus + 'Új kéz</a>');
      h += tabs(tab);
      const list = S.liveHands.slice().sort((a, b) => ((a.date || '') < (b.date || '') ? 1 : -1));
      if (!list.length) h += '<div class="empty"><h3>Még nincs rögzített kéz</h3><p>Az asztalnál elég egy rövidítés (pl. <code>L14 1k/2k/2k | H BTN 28bb AJo | UTG op2.2 | H jam</code>), a részleteket utána mondd el.</p></div>';
      else {
        h += '<div class="section"><ul class="hist">';
        list.forEach((x) => {
          const cards = PK.cards.parseMany(x.cards || '');
          h += '<li><div><a href="#/naplo/kez/' + esc(x.id) + '">' + esc((x.date || '') + ' — ' + (x.tournament || 'verseny')) + '</a><div class="meta">' + esc([x.pos, x.stack ? x.stack + 'bb' : '', cards.length ? PK.cards.text(cards) : '', x.result || ''].filter(Boolean).join(', ')) + '</div></div><div>' + (cards.length ? '<span class="cards">' + cards.slice(0, 2).map((c) => PK.cards.html(c, { size: 'sm' })).join('') + '</span>' : '') + '</div></li>';
        });
        h += '</ul></div>';
      }
      const lt = PK.data.plan && PK.data.plan.liveTemplate;
      if (lt) {
        h += '<div class="section"><h2>Rövidítés az asztalnál</h2><p><code>' + esc(lt.shorthand) + '</code></p>';
        if (lt.legend) h += '<table class="t"><tbody>' + lt.legend.map(([a, b]) => '<tr><td><code>' + esc(a) + '</code></td><td>' + esc(b) + '</td></tr>').join('') + '</tbody></table>';
        if (lt.tips) h += '<ul style="margin-top:12px">' + lt.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>';
        h += '</div>';
      }
    } else if (tab === 'mental') {
      h += head('Napló', 'Mental Hand History (Jared Tendler): ha egy érzés rossz döntéshez vezetett, írd le öt lépésben, és dolgozd át.', '<a class="btn btn--primary" href="#/naplo/mental/uj">' + PK.ui.icons.plus + 'Új bejegyzés</a>');
      h += tabs(tab);
      const list = S.mhh.slice().reverse();
      if (!list.length) h += '<div class="empty"><h3>Még nincs bejegyzés</h3><p>Tilt, unalom, félelem a buborékon, „vissza kell nyernem” — amikor ilyet érzel, a verseny után írd le itt.</p></div>';
      else {
        h += '<div class="section"><ul class="hist">';
        list.forEach((x) => (h += '<li><div><a href="#/naplo/mental/' + esc(x.id) + '">' + esc(PK.util.dateHu(x.ts)) + '</a><div class="meta">' + esc((x.problem || '').slice(0, 120)) + '</div></div><div></div></li>'));
        h += '</ul></div>';
      }
    } else if (tab === 'pool') {
      h += head('Napló', 'Mit tanultál a mezőnyről? Alkalmanként 3 megfigyelés; 8–10 alkalom után ezek írják felül az alapfeltevéseket.');
      h += tabs(tab);
      const obs = [];
      S.sessions.forEach((x) => (x.pool || []).filter(Boolean).forEach((p) => obs.push({ date: x.date, t: p, tour: x.tournament })));
      obs.sort((a, b) => (a.date < b.date ? 1 : -1));
      h += '<div class="section"><h2>A te megfigyeléseid (' + obs.length + ')</h2>';
      if (!obs.length) h += '<p class="muted">A versenybejegyzéseknél írhatsz pool-megfigyeléseket.</p>';
      else h += '<ul class="hist">' + obs.map((o) => '<li><div>' + esc(o.t) + '<div class="meta">' + esc((o.date || '') + (o.tour ? ', ' + o.tour : '')) + '</div></div><div></div></li>').join('') + '</ul>';
      h += '</div>';
      const v = PK.data.venue;
      if (v && v.pool) {
        h += '<div class="grid-2"><div class="section"><h2>Amit a forrásokból tudunk</h2><ul>' + (v.pool.facts || []).map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul></div>';
        h += '<div class="section"><h2>Alapfeltevések</h2><p class="small muted">Európai kis tétű élő MTT-k alapján — a saját megfigyeléseid felülírják őket.</p><ul>' + (v.pool.assumptions || []).map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul></div></div>';
      }
    }
    main.innerHTML = h;
    return {};
  }

  // ---------------------------------------------------------------- verseny űrlap
  function sessionForm(main, params) {
    const S = PK.store.state;
    const id = params[0];
    const x = id === 'uj' ? { id: PK.util.uid('s'), date: PK.util.isoDate(), focus: ['', '', ''], pool: ['', '', ''] } : S.sessions.find((s) => s.id === id);
    if (!x) {
      location.hash = '#/naplo/versenyek';
      return {};
    }
    const isNew = id === 'uj';
    let h = head(isNew ? 'Új verseny' : 'Verseny szerkesztése', 'Előtte töltsd ki a fókuszpontokat, utána az eredményt és a megfigyeléseidet.', '<a class="btn btn--ghost" href="#/naplo/versenyek">' + PK.ui.icons.back + 'Vissza</a>');
    h += venueOptions();
    h += '<div class="section"><h2>Alapadatok</h2><div class="form-grid form-grid--3">';
    h += '<label class="field">Dátum<input type="date" data-f="date" value="' + esc(x.date || '') + '"></label>';
    h += '<label class="field">Verseny<input type="text" list="tourneys" data-f="tournament" value="' + esc(x.tournament || '') + '" placeholder="pl. Kedd 18:00 Big Stack Freeze"></label>';
    h += '<label class="field">Buy-in (Ft)<input type="number" inputmode="numeric" min="0" step="500" data-f="buyIn" value="' + esc(x.buyIn || '') + '"></label>';
    h += '<label class="field">Rebuy / re-entry (db)<input type="number" inputmode="numeric" min="0" step="1" data-f="rebuys" value="' + esc(x.rebuys || '') + '"></label>';
    h += '<label class="field">Add-on (Ft)<input type="number" inputmode="numeric" min="0" step="500" data-f="addOn" value="' + esc(x.addOn || '') + '"></label>';
    h += '<label class="field">Nevezők száma<input type="number" inputmode="numeric" min="0" data-f="entrants" value="' + esc(x.entrants || '') + '"></label>';
    h += '<label class="field">Helyezés<input type="number" inputmode="numeric" min="1" data-f="finish" value="' + esc(x.finish || '') + '"></label>';
    h += '<label class="field">Nyeremény (Ft)<input type="number" inputmode="numeric" min="0" step="500" data-f="prize" value="' + esc(x.prize || '') + '"></label>';
    h += '<label class="field">Játékidő (perc)<input type="number" inputmode="numeric" min="0" step="5" data-f="minutes" value="' + esc(x.minutes || '') + '"></label>';
    h += '</div></div>';

    h += '<div class="section"><h2>Előtte</h2><p class="small muted">Mire figyelsz ma? Három konkrét pont, pl. „BB-ből védekezem a BTN-nyitások ellen”, „20bb alatt reshove-terv”, „nem hívok river-betet passzív rec ellen”.</p><div class="form-grid">';
    for (let i = 0; i < 3; i++) h += '<input type="text" data-f="focus' + i + '" value="' + esc((x.focus || [])[i] || '') + '" aria-label="' + (i + 1) + '. fókuszpont" placeholder="' + (i + 1) + '. fókuszpont">';
    h += '</div><div class="field" style="margin-top:12px"><span class="field__hint">Hangulat a verseny előtt (1 = fáradt, feszült; 5 = friss, nyugodt)</span>' + seg('mood', [1, 2, 3, 4, 5], x.mood) + '</div></div>';

    h += '<div class="section"><h2>Utána</h2><div class="field"><span class="field__hint">Milyen volt a játékod? (A = a legjobb formád, C = a legrosszabb)</span>' + seg('game', ['A', 'B', 'C'], x.game) + '</div>';
    h += '<label class="field" style="margin-top:12px">Tilt-pillanatok, érzelmek<textarea data-f="tilt" placeholder="Mi történt, mit éreztél, hogyan hatott a döntéseidre?">' + esc(x.tilt || '') + '</textarea></label>';
    h += '<p style="margin:14px 0 6px;font-weight:600">Három megfigyelés a mezőnyről</p><div class="form-grid">';
    for (let i = 0; i < 3; i++) h += '<input type="text" data-f="pool' + i + '" value="' + esc((x.pool || [])[i] || '') + '" aria-label="' + (i + 1) + '. megfigyelés" placeholder="pl. a 3-as széken ülő rec minden BTN-nyitást hív">';
    h += '</div><label class="field" style="margin-top:12px">Megjegyzés<textarea data-f="notes">' + esc(x.notes || '') + '</textarea></label></div>';

    h += '<div class="row"><button type="button" class="btn btn--primary" data-act="save">Mentés</button>' + (isNew ? '' : '<button type="button" class="btn btn--danger" data-act="del">' + PK.ui.icons.trash + 'Törlés</button>') + '</div>';
    main.innerHTML = h;

    return {
      onClick(act, el) {
        if (act === 'seg') {
          el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
        } else if (act === 'save') {
          const rec = Object.assign({}, x, {
            date: val(main, 'date'),
            tournament: val(main, 'tournament'),
            buyIn: Number(val(main, 'buyIn')) || 0,
            rebuys: Number(val(main, 'rebuys')) || 0,
            addOn: Number(val(main, 'addOn')) || 0,
            entrants: Number(val(main, 'entrants')) || null,
            finish: Number(val(main, 'finish')) || null,
            prize: Number(val(main, 'prize')) || 0,
            minutes: Number(val(main, 'minutes')) || null,
            focus: [0, 1, 2].map((i) => val(main, 'focus' + i)),
            pool: [0, 1, 2].map((i) => val(main, 'pool' + i)),
            mood: Number(readSeg(main, 'mood')) || null,
            game: readSeg(main, 'game'),
            tilt: val(main, 'tilt'),
            notes: val(main, 'notes'),
            ts: x.ts || new Date().toISOString(),
          });
          const i = S.sessions.findIndex((s) => s.id === rec.id);
          if (i >= 0) S.sessions[i] = rec;
          else S.sessions.push(rec);
          PK.store.save();
          PK.ui.toast('Verseny mentve');
          location.hash = '#/naplo/versenyek';
        } else if (act === 'del') {
          if (g.confirm('Biztosan törlöd ezt a versenybejegyzést?')) {
            S.sessions = S.sessions.filter((s) => s.id !== x.id);
            PK.store.save();
            location.hash = '#/naplo/versenyek';
          }
        }
      },
      onChange(act, el) {
        if (el.dataset.f === 'tournament' && PK.data.venue) {
          const hit = PK.data.venue.schedule.find((s) => s.day + ' ' + s.time + ' ' + s.name === el.value);
          const bi = main.querySelector('[data-f="buyIn"]');
          if (hit && bi && !bi.value) bi.value = hit.buyIn;
        }
      },
    };
  }

  // ---------------------------------------------------------------- élő kéz űrlap
  function handForm(main, params) {
    const S = PK.store.state;
    const id = params[0];
    const x = id === 'uj' ? { id: PK.util.uid('h'), date: PK.util.isoDate(), action: {} } : S.liveHands.find((s) => s.id === id);
    if (!x) {
      location.hash = '#/naplo/kezek';
      return {};
    }
    const isNew = id === 'uj';
    const lt = (PK.data.plan && PK.data.plan.liveTemplate) || {};
    const positions = PK.spot.POS_BY_N[10];
    let h = head(isNew ? 'Új élő kéz' : 'Élő kéz', 'Az eredményt a végén mondd — előtte a döntési pontokon a gondolataidat.', '<a class="btn btn--ghost" href="#/naplo/kezek">' + PK.ui.icons.back + 'Vissza</a>');
    h += venueOptions();
    h += '<div class="section"><div class="form-grid form-grid--4">';
    h += '<label class="field">Dátum<input type="date" data-f="date" value="' + esc(x.date || '') + '"></label>';
    h += '<label class="field">Verseny<input type="text" list="tourneys" data-f="tournament" value="' + esc(x.tournament || '') + '"></label>';
    h += '<label class="field">Szint<input type="number" inputmode="numeric" min="1" data-f="level" value="' + esc(x.level || '') + '"></label>';
    h += '<label class="field">Vakok / ante<input type="text" data-f="blinds" value="' + esc(x.blinds || '') + '" placeholder="1000/2000/2000"></label>';
    h += '<label class="field">Pozícióm<select data-f="pos"><option value=""></option>' + positions.map((p) => '<option' + (x.pos === p ? ' selected' : '') + '>' + p + '</option>').join('') + '</select></label>';
    h += '<label class="field">Stackem (bb)<input type="number" inputmode="decimal" min="0" step="0.5" data-f="stack" value="' + esc(x.stack || '') + '"></label>';
    h += '<label class="field">Lapjaim<input type="text" data-f="cards" value="' + esc(x.cards || '') + '" placeholder="AhKd"></label>';
    h += '<label class="field">Board<input type="text" data-f="board" value="' + esc(x.board || '') + '" placeholder="Kc7d2h 9s 3c"></label>';
    h += '</div><div id="cardprev" class="row" style="margin-top:10px"></div>';
    h += '<label class="field" style="margin-top:12px">Rövidítés (amit az asztalnál felírtál)<input type="text" data-f="shorthand" value="' + esc(x.shorthand || '') + '" placeholder="' + esc(lt.shorthand || '') + '"></label>';
    h += '<label class="field" style="margin-top:12px">Ellenfelek, olvasatok<textarea data-f="reads" placeholder="Ki volt a kézben, milyen típus, mit láttál tőle korábban?">' + esc(x.reads || '') + '</textarea></label></div>';

    h += '<div class="section"><h2>Akció utcánként</h2><div class="form-grid form-grid--2">';
    [
      ['pre', 'Preflop'],
      ['flop', 'Flop'],
      ['turn', 'Turn'],
      ['river', 'River'],
    ].forEach(([k, l]) => (h += '<label class="field">' + l + '<textarea data-f="a-' + k + '" style="min-height:70px">' + esc((x.action || {})[k] || '') + '</textarea></label>'));
    h += '</div></div>';

    h += PK.ui.recorder.html({
      id: 'rec-live',
      title: 'Gondolataid a döntési pontokon',
      desc: 'Mondd el a kezet a sablon szerint, minden döntésnél azt, amit akkor gondoltál.',
      prompts: lt.narration || [],
      value: x.thoughts || '',
    });
    h += '<div class="section"><div class="form-grid form-grid--2">';
    h += '<label class="field">Eredmény<input type="text" data-f="result" value="' + esc(x.result || '') + '" placeholder="pl. nyertem 30bb-t, kiestem 12.-ként"></label>';
    h += '<div class="field"><span class="field__hint">Érzelmi állapot a kéz alatt (1 = feszült, tiltes; 5 = nyugodt)</span>' + seg('emotion', [1, 2, 3, 4, 5], x.emotion) + '</div></div>';
    h += '<label class="field" style="margin-top:12px">Mit érzel most a kézzel kapcsolatban?<input type="text" data-f="emotionNote" value="' + esc(x.emotionNote || '') + '"></label>';
    h += '<p style="margin:14px 0 6px;font-weight:600">Mire vonatkozik?</p><div class="row">';
    PK.scoring.CATEGORIES.forEach((c) => (h += '<label class="check small"><input type="checkbox" data-cat="' + c.code + '"' + ((x.cats || []).indexOf(c.code) >= 0 ? ' checked' : '') + '>' + esc(c.short) + '</label>'));
    h += '</div></div>';
    h += '<div class="row"><button type="button" class="btn btn--primary" data-act="save">Mentés</button>' + (isNew ? '' : '<button type="button" class="btn btn--danger" data-act="del">' + PK.ui.icons.trash + 'Törlés</button>') + '</div>';
    main.innerHTML = h;

    const rec = PK.ui.recorder.mount(main.querySelector('#rec-live'), { audioKey: x.id + '-n' });
    function preview() {
      const c = PK.cards.parseMany(val(main, 'cards'));
      const b = PK.cards.parseMany(val(main, 'board'));
      main.querySelector('#cardprev').innerHTML =
        (c.length ? '<span class="cards">' + c.map((k) => PK.cards.html(k, { size: 'sm' })).join('') + '</span>' : '') + (b.length ? '<span class="faint">board</span><span class="cards">' + b.map((k) => PK.cards.html(k, { size: 'sm' })).join('') + '</span>' : '');
    }
    preview();

    return {
      destroy() {
        rec.destroy();
      },
      onInput(act, el) {
        if (el.dataset.f === 'cards' || el.dataset.f === 'board') preview();
      },
      async onClick(act, el) {
        if (act === 'seg') {
          el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
        } else if (act === 'save') {
          await rec.stop();
          const r = Object.assign({}, x, {
            date: val(main, 'date'),
            tournament: val(main, 'tournament'),
            level: Number(val(main, 'level')) || null,
            blinds: val(main, 'blinds'),
            pos: val(main, 'pos'),
            stack: Number(val(main, 'stack')) || null,
            cards: val(main, 'cards'),
            board: val(main, 'board'),
            shorthand: val(main, 'shorthand'),
            reads: val(main, 'reads'),
            action: { pre: val(main, 'a-pre'), flop: val(main, 'a-flop'), turn: val(main, 'a-turn'), river: val(main, 'a-river') },
            thoughts: rec.text(),
            result: val(main, 'result'),
            emotion: Number(readSeg(main, 'emotion')) || null,
            emotionNote: val(main, 'emotionNote'),
            cats: Array.from(main.querySelectorAll('[data-cat]:checked')).map((c) => c.dataset.cat),
            audio: rec.audioKey || x.audio || null,
            ts: x.ts || new Date().toISOString(),
          });
          const i = S.liveHands.findIndex((s) => s.id === r.id);
          if (i >= 0) S.liveHands[i] = r;
          else S.liveHands.push(r);
          PK.store.save();
          PK.ui.toast('Kéz mentve');
          location.hash = '#/naplo/kezek';
        } else if (act === 'del') {
          if (g.confirm('Biztosan törlöd ezt a kezet?')) {
            S.liveHands = S.liveHands.filter((s) => s.id !== x.id);
            if (x.audio) PK.store.audio.del(x.audio);
            PK.store.save();
            location.hash = '#/naplo/kezek';
          }
        }
      },
    };
  }

  // ---------------------------------------------------------------- MHH űrlap
  function mhhForm(main, params) {
    const S = PK.store.state;
    const id = params[0];
    const x = id === 'uj' ? { id: PK.util.uid('m'), ts: new Date().toISOString() } : S.mhh.find((s) => s.id === id);
    if (!x) {
      location.hash = '#/naplo/mental';
      return {};
    }
    const isNew = id === 'uj';
    const fields = (PK.data.plan && PK.data.plan.mhh) || [
      { key: 'problem', label: 'Mi a probléma?', hint: '' },
      { key: 'logic', label: 'Miért logikus, hogy így érzek/gondolkodom?', hint: '' },
      { key: 'flaw', label: 'Miért hibás ez a logika?', hint: '' },
      { key: 'fix', label: 'Mi a helyes gondolat?', hint: '' },
      { key: 'why', label: 'Miért helyes?', hint: '' },
    ];
    let h = head(isNew ? 'Új Mental Hand History' : 'Mental Hand History', 'Öt lépés Jared Tendler módszere szerint. Írd le őszintén, aztán olvasd át a következő verseny előtt.', '<a class="btn btn--ghost" href="#/naplo/mental">' + PK.ui.icons.back + 'Vissza</a>');
    h += '<div class="section"><div class="form-grid">';
    fields.forEach((f, i) => {
      h += '<label class="field">' + (i + 1) + '. ' + esc(f.label) + (f.hint ? '<span class="field__hint">' + esc(f.hint) + '</span>' : '') + '<textarea data-f="' + esc(f.key) + '">' + esc(x[f.key] || '') + '</textarea></label>';
    });
    h += '</div></div><div class="row"><button type="button" class="btn btn--primary" data-act="save">Mentés</button>' + (isNew ? '' : '<button type="button" class="btn btn--danger" data-act="del">' + PK.ui.icons.trash + 'Törlés</button>') + '</div>';
    main.innerHTML = h;
    return {
      onClick(act) {
        if (act === 'save') {
          const r = Object.assign({}, x);
          fields.forEach((f) => (r[f.key] = val(main, f.key)));
          const i = S.mhh.findIndex((s) => s.id === r.id);
          if (i >= 0) S.mhh[i] = r;
          else S.mhh.push(r);
          PK.store.save();
          PK.ui.toast('Bejegyzés mentve');
          location.hash = '#/naplo/mental';
        } else if (act === 'del') {
          if (g.confirm('Biztosan törlöd ezt a bejegyzést?')) {
            S.mhh = S.mhh.filter((s) => s.id !== x.id);
            PK.store.save();
            location.hash = '#/naplo/mental';
          }
        }
      },
    };
  }

  PK.views.journal = { view, sessionForm, handForm, mhhForm };
})(typeof window !== 'undefined' ? window : globalThis);
