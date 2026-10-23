/* i-learn-poker — Edzés: módválasztó, spot-lejátszó (gondolkodás → magyarázat → értékelés), összegzés */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.views = PK.views || {};
  const U = () => PK.util;
  const esc = (s) => PK.util.esc(s);
  const I = () => PK.ui.icons;

  const DEFAULT_P2 = [
    'Mekkora az effektív stack, és milyen pozícióban vagy?',
    'Milyen range-et adsz az ellenfélnek, és miért?',
    'Mennyi equity kell (pot odds, ICM)?',
    'Mi a terved a következő lépésre?',
  ];

  // ---------------------------------------------------------------- sorok
  function attemptsBySpot() {
    const m = new Map();
    for (const a of PK.store.state.attempts) {
      if (!m.has(a.spotId)) m.set(a.spotId, []);
      m.get(a.spotId).push(a);
    }
    return m;
  }

  function roundRobinByCat(spots) {
    const buckets = new Map();
    spots.forEach((s) => {
      const c = s.cats[0];
      if (!buckets.has(c)) buckets.set(c, []);
      buckets.get(c).push(s);
    });
    const out = [];
    let left = true;
    while (left) {
      left = false;
      for (const arr of buckets.values()) {
        if (arr.length) {
          out.push(arr.shift());
          left = true;
        }
      }
    }
    return out;
  }

  function weakCats(n) {
    const sc = PK.scoring.categoryScores(PK.scoring.latestAttempts(PK.store.state.attempts), PK.store.spotById);
    return Object.entries(sc)
      .filter(([, v]) => v.n > 0)
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, n || 3)
      .map(([c]) => c);
  }

  function buildQueue(kind, opt) {
    const S = PK.store.state;
    const all = PK.store.allSpots();
    const tried = attemptsBySpot();
    const size = Math.max(3, Number(S.settings.sessionSize) || 10);
    if (kind === 'diag') {
      const unseen = all.filter((s) => !tried.has(s.id));
      const warm = [];
      if (!S.attempts.length) {
        const easy = roundRobinByCat(unseen.filter((s) => s.diff === 1));
        warm.push(...easy.slice(0, 3));
      }
      const rest = unseen.filter((s) => warm.indexOf(s) < 0);
      const ordered = [];
      for (let d = 1; d <= 5; d++) ordered.push(...roundRobinByCat(rest.filter((s) => s.diff === d)));
      return warm.concat(ordered).slice(0, size).map((s) => s.id);
    }
    if (kind === 'due') {
      const due = PK.srs.dueIds(S.srs).filter((id) => PK.store.spotById(id));
      const weak = weakCats(13);
      const rank = (id) => {
        const s = PK.store.spotById(id);
        const i = weak.indexOf(s.cats[0]);
        return i < 0 ? 99 : i;
      };
      return due.sort((a, b) => rank(a) - rank(b)).slice(0, size);
    }
    if (kind === 'weak') {
      const cats = opt && opt.cats ? opt.cats : weakCats(3);
      const recent = Date.now() - 12 * 3600 * 1000;
      const cand = all.filter((s) => s.cats.some((c) => cats.indexOf(c) >= 0));
      const score = (s) => {
        const at = tried.get(s.id);
        if (!at) return -1000;
        const last = at[at.length - 1];
        if (new Date(last.ts).getTime() > recent) return 1000 + last.total;
        return last.total;
      };
      return cand
        .sort((a, b) => score(a) - score(b))
        .slice(0, size)
        .map((s) => s.id);
    }
    if (kind === 'filter') {
      const f = opt || {};
      const cand = all.filter((s) => (!f.cat || s.cats.indexOf(f.cat) >= 0) && (!f.stage || s.stage === f.stage) && (!f.diff || s.diff === Number(f.diff)) && (!f.custom || s.custom));
      const lastTs = (s) => {
        const at = tried.get(s.id);
        return at ? new Date(at[at.length - 1].ts).getTime() : 0;
      };
      return cand
        .sort((a, b) => lastTs(a) - lastTs(b))
        .slice(0, size)
        .map((s) => s.id);
    }
    if (kind === 'one') return [opt.id];
    return [];
  }

  function persist() {
    try {
      if (PK.train.session) g.sessionStorage.setItem('ilp.session', JSON.stringify(PK.train.session));
      else g.sessionStorage.removeItem('ilp.session');
    } catch (e) {
      /* privát mód: nem baj */
    }
  }
  function restore() {
    try {
      const raw = g.sessionStorage.getItem('ilp.session');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  const KIND_LABEL = { diag: 'Diagnosztikai kör', due: 'Esedékes ismétlés', weak: 'Gyenge pontok', filter: 'Válogatott spotok', one: 'Egy spot' };

  function startSession(kind, opt) {
    const queue = buildQueue(kind, opt);
    if (!queue.length) {
      PK.ui.toast(kind === 'due' ? 'Most nincs esedékes ismétlés.' : kind === 'diag' ? 'Minden spotot láttál már — jöhet az ismétlés vagy a gyenge pontok.' : 'Ehhez a szűréshez nincs spot.');
      return;
    }
    PK.train.session = { kind, opt: opt || null, label: KIND_LABEL[kind], queue, i: 0, results: [] };
    persist();
    location.hash = '#/edzes/spot';
  }

  // ---------------------------------------------------------------- kezdőlap
  function home(main) {
    const S = PK.store.state;
    const all = PK.store.allSpots();
    const tried = attemptsBySpot();
    const unseen = all.filter((s) => !tried.has(s.id)).length;
    const due = PK.srs.dueIds(S.srs).filter((id) => PK.store.spotById(id)).length;
    const lv = PK.scoring.levelEstimate(S.attempts, PK.store.spotById);
    const weak = weakCats(3);
    const wk = PK.util.startOfWeek();
    const thisWeek = S.attempts.filter((a) => new Date(a.ts) >= wk).length;
    const target = 50;
    const mode = S.settings.mode === 'quick' ? 'quick' : 'full';

    let h = '<div class="page-head"><div><h1>Edzés</h1>';
    if (!S.attempts.length) h += '<p>Kezdd a diagnosztikai körrel: minden spotnál mondd ki hangosan, mit gondolsz, aztán dönts. Ebből látjuk, hol tartasz.</p>';
    else if (lv.enough) h += '<p>Becsült szinted: <b>' + lv.level + ' – ' + esc(lv.label) + '</b>' + (lv.rising ? ', feltörekvő' : '') + '. A részleteket a Profilban látod.</p>';
    else h += '<p>Még néhány spot kell a szintbecsléshez. Folytasd a diagnosztikai kört.</p>';
    h += '</div><div class="field"><span class="field__hint" id="mode-l">Mód</span><div class="seg" role="group" aria-labelledby="mode-l">';
    h += '<button type="button" data-act="mode" data-v="full" aria-pressed="' + (mode === 'full') + '">Hangos gondolkodás</button>';
    h += '<button type="button" data-act="mode" data-v="quick" aria-pressed="' + (mode === 'quick') + '">Gyors (csak döntés)</button>';
    h += '</div></div></div>';

    h += '<div class="section"><div class="row row--between"><h2>Ezen a héten</h2><span class="num" style="font-size:1.4rem">' + thisWeek + ' / ' + target + ' spot</span></div>';
    h += '<div class="meter" style="margin-top:10px" role="progressbar" aria-valuemin="0" aria-valuemax="' + target + '" aria-valuenow="' + thisWeek + '"><i style="width:' + Math.min(100, (thisWeek / target) * 100) + '%"></i></div>';
    h += '<p class="muted small" style="margin:8px 0 0">A heti cél kb. 50 spot, 3 alkalommal 20–30 perc. A gyenge kategóriák kapják a figyelem nagyobb részét.</p></div>';

    h += '<div class="modes">';
    h += '<button type="button" class="mode mode--lead" data-act="start" data-kind="diag"><h3>Diagnosztikai kör <span class="count">' + unseen + '</span></h3><p>' + (unseen ? 'Még nem látott spotok, könnyűtől a nehézig, vegyes témákban. Az első próbálkozásaid adják a szintbecslést.' : 'Minden spotot láttál. Új spotokat Claude-dal generáltathatsz az Adatok oldalon.') + '</p></button>';
    h += '<button type="button" class="mode" data-act="start" data-kind="due"><h3>Esedékes ismétlés <span class="count">' + due + '</span></h3><p>A korábbi spotok 1, 3, 7, 14 és 30 nap után térnek vissza; amit elrontottál, holnap újra jön.</p></button>';
    h += '<button type="button" class="mode" data-act="start" data-kind="weak"><h3>Gyenge pontok</h3><p>' + (weak.length ? 'Most: ' + weak.map((c) => esc(PK.scoring.CAT[c].short)).join(', ') + '.' : 'Ehhez előbb néhány spotot kell megoldanod.') + '</p></button>';
    h += '<a class="mode" href="#/drill/pushfold" style="text-decoration:none"><h3>Push/fold villám</h3><p>10bb-s all-in vagy fold, másodpercek alatt. A határesetek gyakrabban jönnek.</p></a>';
    h += '<a class="mode" href="#/drill/pushfold/bemelegites" style="text-decoration:none"><h3>Verseny előtti bemelegítés</h3><p>10 push/fold döntés, aztán a mai 3 fókuszpont a Naplóba. Kb. 5 perc.</p></a>';
    h += '<a class="mode" href="#/drill/potodds" style="text-decoration:none"><h3>Pot odds villám</h3><p>Hívás, blöff, BB-védelem, outok: a számolás, amit az asztalnál fejben kell tudni.</p></a>';
    h += '<div class="mode" style="cursor:default"><h3>Válogatás</h3>';
    h += '<div class="form-grid form-grid--3" style="margin-top:4px">';
    h += '<label class="field"><span class="field__hint">Kategória</span><select data-f="cat"><option value="">Mind</option>' + PK.scoring.CATEGORIES.map((c) => '<option value="' + c.code + '">' + esc(c.short) + '</option>').join('') + '</select></label>';
    h += '<label class="field"><span class="field__hint">Szakasz</span><select data-f="stage"><option value="">Mind</option>' + Object.entries(PK.ui.STAGE_HU).map(([k, v]) => '<option value="' + k + '">' + esc(v) + '</option>').join('') + '</select></label>';
    h += '<label class="field"><span class="field__hint">Nehézség</span><select data-f="diff"><option value="">Mind</option>' + [1, 2, 3, 4, 5].map((d) => '<option value="' + d + '">' + d + '</option>').join('') + '</select></label>';
    h += '</div><div class="row" style="margin-top:10px"><button type="button" class="btn btn--sm" data-act="start-filter">Indítás</button>' + (S.customSpots.length ? '<label class="check small"><input type="checkbox" data-f="custom"> csak a saját spotjaim</label>' : '') + '</div></div>';
    h += '</div>';

    const tips = PK.data.plan && PK.data.plan.thinkAloud ? PK.data.plan.thinkAloud : null;
    h += '<div class="section" style="margin-top:16px"><h2>Így gyakorolj</h2><ol style="margin:8px 0 0;padding-left:1.2em">';
    h += '<li><b>Gondolkodj hangosan, mielőtt döntesz.</b> ' + esc(tips && tips.phase1 ? tips.phase1 : 'Mondj ki mindent, ami eszedbe jut, ahogy jön — ne magyarázd, csak gondolkodj.') + '</li>';
    h += '<li><b>Dönts.</b> A döntés után a felvétel leáll, a döntési idő rögzül.</li>';
    h += '<li><b>Magyarázd el röviden</b> a kérdések mentén: stack és pozíció, range, szükséges equity, terv.</li>';
    h += '<li><b>Értékeld magad őszintén.</b> A gép felismeri a kulcsszavakat, de te döntöd el, mi hangzott el valójában.</li>';
    h += '</ol></div>';

    main.innerHTML = h;
    return {
      onClick(act, el) {
        if (act === 'mode') {
          S.settings.mode = el.dataset.v;
          PK.store.save();
          home(main);
        } else if (act === 'start') {
          startSession(el.dataset.kind);
        } else if (act === 'start-filter') {
          const q = (k) => main.querySelector('[data-f="' + k + '"]');
          startSession('filter', { cat: q('cat').value, stage: q('stage').value, diff: q('diff').value, custom: q('custom') ? q('custom').checked : false });
        }
      },
    };
  }

  // ---------------------------------------------------------------- spot nézet részei
  function clockStrip(ctx) {
    const c = ctx || {};
    const cell = (v, l) => '<div><b>' + esc(v == null || v === '' ? '–' : v) + '</b><span>' + esc(l) + '</span></div>';
    return (
      '<div class="clock">' +
      cell(c.level, 'szint') +
      cell(c.blinds, 'vakok') +
      cell(c.ante, 'ante') +
      cell(c.left != null ? c.left + (c.entrants ? '/' + c.entrants : '') : null, 'játékos bent') +
      cell(c.paid, 'fizetett hely') +
      cell(c.avgBb != null ? PK.util.num(c.avgBb, 0) + 'bb' : null, 'átlag stack') +
      '</div>'
    );
  }

  function spotMain(spot, st, revealed) {
    let h = clockStrip(spot.ctx);
    if (spot.ctx && spot.ctx.note) h += '<p class="small muted" style="margin:8px 2px 0">' + esc(spot.ctx.note) + '</p>';
    if (spot.table) {
      h += '<div class="table-wrap-felt" style="margin-top:12px">' + PK.ui.table.render(spot, st) + '</div>';
      const hero = st.hero;
      h += '<div class="hero-row"><span class="cards">' + spot.table.cards.map((c) => PK.cards.html(c, { size: 'lg' })).join('') + '</span>';
      h += '<div class="facts">';
      h += '<div><b>' + esc(spot.table.hero) + '</b><span>a pozíciód</span></div>';
      h += '<div><b>' + esc(PK.util.bb(hero.start)) + '</b><span>stacked a kéz elején</span></div>';
      h += '<div><b>' + esc(PK.util.bb(st.effStart)) + '</b><span>effektív</span></div>';
      if (st.toCall > 0.001 && st.currentBet > (st.street === 'pre' ? st.blinds.bb : 0) + 1e-9) h += '<div><b>' + esc(PK.util.bb(st.toCall)) + '</b><span>a hívás</span></div>';
      if (revealed && st.needEq != null && st.currentBet > (st.street === 'pre' ? st.blinds.bb : 0) + 1e-9) h += '<div><b>' + esc(PK.util.pct(st.needEq)) + '</b><span>equity kell</span></div>';
      if (revealed && st.spr != null) h += '<div><b>' + esc(PK.util.num(st.spr, 1)) + '</b><span>SPR a flopon</span></div>';
      h += '</div></div>';
    }
    if (spot.scene) h += '<p class="scene">' + esc(spot.scene) + '</p>';
    if (spot.table && spot.table.reads) {
      const r = Object.entries(spot.table.reads);
      if (r.length) h += '<ul class="reads">' + r.map(([p, t]) => '<li><b>' + esc(p) + ':</b> ' + esc(t) + '</li>').join('') + '</ul>';
    }
    if (spot.table) {
      const L = PK.spot.actionLines(spot.table, spot.id);
      const names = { pre: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' };
      const boards = { flop: (spot.table.board || []).slice(0, 3), turn: (spot.table.board || []).slice(3, 4), river: (spot.table.board || []).slice(4, 5) };
      let rows = '';
      ['pre', 'flop', 'turn', 'river'].forEach((k) => {
        const has = L[k].length || (boards[k] && boards[k].length);
        if (!has) return;
        const b = boards[k] && boards[k].length ? PK.cards.text(boards[k]) + (L[k].length ? ' — ' : '') : '';
        rows += '<li><b>' + names[k] + '</b><span>' + esc(b + (L[k].length ? L[k].join(', ') : '')) + '</span></li>';
      });
      if (rows) h += '<ul class="actions-log" aria-label="Akciók">' + rows + '</ul>';
    }
    return h;
  }

  function optionsHtml(spot, chosen, revealed, disabled) {
    let h = '<div class="opts" role="group" aria-label="Válaszlehetőségek">';
    spot.opts.forEach((o, i) => {
      const g = PK.scoring.GRADE[o.g];
      const verdict = revealed ? '<span class="verdict tag ' + (o.g === 'best' || o.g === 'good' ? 'tag--ok' : o.g === 'minor' ? 'tag--warn' : 'tag--bad') + '">' + esc(g.label) + '</span>' : '';
      h +=
        '<button type="button" class="opt' + (revealed && o.g === 'best' ? ' is-best' : '') + '" data-act="choose" data-id="' + esc(o.id) + '" aria-pressed="' + (chosen === o.id) + '"' + (disabled ? ' disabled' : '') + '>' +
        '<span class="key" aria-hidden="true">' + (i + 1) + '</span><span>' + esc(o.t) + '</span>' + verdict + '</button>';
    });
    h += '</div>';
    return h;
  }

  // ---------------------------------------------------------------- lejátszó
  function player(main) {
    if (!PK.train.session) PK.train.session = restore();
    const sess = PK.train.session;
    if (!sess || sess.i >= sess.queue.length) {
      if (sess && sess.results.length) return summary(main);
      location.hash = '#/edzes';
      return {};
    }
    const spot = PK.store.spotById(sess.queue[sess.i]);
    if (!spot) {
      sess.i++;
      return player(main);
    }
    const S = PK.store.state;
    const quick = S.settings.mode === 'quick';
    let st = null;
    try {
      st = spot.table ? PK.spot.simulate(spot.table, spot.id) : null;
    } catch (e) {
      main.innerHTML = '<div class="notice notice--bad"><p>Ez a spot hibás, ezért kihagyom: ' + esc(e.message) + '</p></div>';
      sess.i++;
      setTimeout(() => PK.app.render(), 1500);
      return {};
    }
    const attemptId = PK.util.uid('a');
    const ctl = { phase: 'think', choice: null, timeSec: null, confidence: null, p1: '', p2: '', rec1: null, rec2: null, review: null, alive: true };

    const progress =
      '<div class="player__progress"><a class="btn btn--ghost btn--sm" href="#/edzes">' + I().back + 'Kilépés</a><span>' + esc(sess.label) + ', ' + (sess.i + 1) + '/' + sess.queue.length + '</span>' +
      '<div class="meter" aria-hidden="true"><i style="width:' + (sess.i / sess.queue.length) * 100 + '%"></i></div></div>';

    function frame(sideHtml, revealed) {
      main.innerHTML =
        progress +
        '<div class="player"><div class="player__main"><h1 class="sr-only">' + esc(spot.title) + '</h1>' + spotMain(spot, st, revealed) + '</div>' +
        '<div class="player__side" id="side">' + sideHtml + '</div></div>';
    }

    // -- 1. fázis
    function renderThink() {
      let side = '<h2 class="question">' + esc(spot.q) + '</h2>';
      if (!quick) {
        side += PK.ui.recorder.html({
          id: 'rec1',
          title: 'Hangos gondolkodás',
          desc: 'Mondj ki mindent, ami eszedbe jut — ne magyarázd, csak gondolkodj.',
          placeholder: 'Ide kerül, amit mondasz. Írhatsz is.',
          clockSec: Number(S.settings.thinkSec) || 60,
        });
      }
      side += optionsHtml(spot, null, false, false);
      side += '<p class="small faint" style="margin-top:12px">Billentyűk: <kbd>1</kbd>–<kbd>' + spot.opts.length + '</kbd> döntés' + (quick ? '' : ', <kbd>R</kbd> felvétel') + '. <button type="button" class="linkbtn" data-act="skip">Kihagyom ezt a spotot</button></p>';
      frame(side, false);
      if (!quick) ctl.rec1 = PK.ui.recorder.mount(main.querySelector('#rec1'), { clockSec: Number(S.settings.thinkSec) || 60, audioKey: attemptId + '-p1' });
      ctl.t0 = Date.now();
    }

    async function choose(id) {
      if (ctl.phase !== 'think') return;
      ctl.phase = 'deciding';
      ctl.choice = id;
      ctl.timeSec = Math.round((Date.now() - ctl.t0) / 1000);
      if (ctl.rec1) {
        await ctl.rec1.stop();
        ctl.p1 = ctl.rec1.text();
        ctl.rec1.destroy();
      }
      if (!ctl.alive) return; // közben elnavigált
      if (quick) renderReview();
      else renderExplain();
    }

    // -- 2. fázis
    function renderExplain() {
      ctl.phase = 'explain';
      const chosen = spot.opts.find((o) => o.id === ctl.choice);
      const prompts = PK.data.plan && PK.data.plan.thinkAloud && PK.data.plan.thinkAloud.phase2 ? PK.data.plan.thinkAloud.phase2.filter((p) => !/magabiztos/i.test(p)) : DEFAULT_P2;
      let side = '<h2 class="question">' + esc(spot.q) + '</h2>';
      side += '<div class="notice"><p>A döntésed: <b>' + esc(chosen ? chosen.t : '') + '</b> (' + ctl.timeSec + ' mp)</p></div>';
      side += PK.ui.recorder.html({ id: 'rec2', title: 'Utólagos magyarázat', desc: 'Most indokold a döntést — röviden, a kérdések mentén.', placeholder: 'Mondd vagy írd le a válaszaidat.', prompts });
      side += '<div class="field" style="margin-bottom:14px"><span class="field__hint" id="conf-l">Mennyire vagy biztos a döntésedben?</span><div class="seg" role="group" aria-labelledby="conf-l">';
      for (let i = 1; i <= 5; i++) side += '<button type="button" data-act="conf" data-v="' + i + '" aria-pressed="false">' + i + '</button>';
      side += '</div></div>';
      side += '<div class="row"><button type="button" class="btn btn--primary" data-act="reveal">Megoldás</button><button type="button" class="btn btn--ghost" data-act="reveal-skip">Kihagyom a magyarázatot</button></div>';
      frame(side, false);
      ctl.rec2 = PK.ui.recorder.mount(main.querySelector('#rec2'), { audioKey: attemptId + '-p2' });
    }

    async function reveal() {
      if (ctl.phase !== 'explain') return;
      ctl.phase = 'revealing';
      if (ctl.rec2) {
        await ctl.rec2.stop();
        ctl.p2 = ctl.rec2.text();
        ctl.rec2.destroy();
      }
      if (!ctl.alive) return;
      renderReview();
    }

    // -- értékelés
    function renderReview() {
      ctl.phase = 'review';
      const chosen = spot.opts.find((o) => o.id === ctl.choice);
      const grade = chosen ? chosen.g : 'blunder';
      const text = [ctl.p1, ctl.p2].filter(Boolean).join('\n');
      const autoF = PK.scoring.autoFactors(spot, text);
      const autoQ = PK.scoring.autoQuality(text);
      const autoD = PK.scoring.autoDeductions(text);
      const flags = PK.scoring.flags(text, spot);
      ctl.review = { grade, marks: autoF.slice(), quality: Object.assign({}, autoQ), deductions: Object.assign({}, autoD), flags, autoF, autoQ, autoD };
      const best = spot.opts.filter((o) => o.g === 'best');
      const gLabel = PK.scoring.GRADE[grade].label;
      const icon = grade === 'best' || grade === 'good' ? I().ok : grade === 'minor' ? I().warn : I().bad;

      let side = '<div class="verdict-card g-' + grade + '" tabindex="-1" id="verdict"><h2><span class="icon">' + icon + '</span>' + esc(gLabel) + '</h2>';
      side += '<p>A döntésed: <b>' + esc(chosen ? chosen.t : '–') + '</b>.' + (grade !== 'best' ? ' Ajánlott: <b>' + esc(best.map((o) => o.t).join(' vagy ')) + '</b>.' : '') + '</p>';
      if (chosen && chosen.why) side += '<p class="muted" style="margin:0">' + esc(chosen.why) + '</p>';
      side += '<div class="score" aria-live="polite" id="score"></div></div>';

      side += '<div class="section explain"><h3>Megoldás</h3><p><b>' + esc(spot.ans) + '</b></p><p>' + esc(spot.exp) + '</p>';
      if (spot.mist) side += '<p class="muted">' + (/^tipikus hib/i.test(spot.mist) ? '' : '<b>Tipikus hiba:</b> ') + esc(spot.mist) + '</p>';
      side += '<div class="row small">' + spot.cats.map((c) => '<span class="tag">' + esc(PK.scoring.CAT[c] ? PK.scoring.CAT[c].short : c) + '</span>').join('') + '<span class="tag">' + spot.diff + '. szint</span><span class="tag">' + esc(PK.ui.BASIS_HU[spot.basis] || spot.basis) + '</span><span class="tag">bizonyosság: ' + esc(PK.ui.CONF_HU[spot.conf] || spot.conf) + '</span></div>';
      if (spot.src) side += '<p class="small faint" style="margin:8px 0 0">Forrás: ' + esc(spot.src) + '</p>';
      side += '<details class="more"><summary>Az összes opció értékelése</summary><div style="margin-top:10px">' + optionsHtml(spot, ctl.choice, true, true) + '<ul class="flags" style="margin-top:8px">' + spot.opts.filter((o) => o.why).map((o) => '<li><b>' + esc(o.t) + ':</b> ' + esc(o.why) + '</li>').join('') + '</ul></div></details></div>';

      if (!quick) {
        side += '<div class="section"><h3>A gondolkodásod</h3><p class="small muted">Ezeket a szempontokat kellett érintened. Amit a gép felismert a szövegben, előre bejelöltem — javítsd, ha tévedett.</p>';
        spot.factors.forEach((f, i) => {
          const v = ctl.review.marks[i];
          side += '<div class="factor"><div class="factor__t">' + esc(f.t) + (autoF[i] ? '<span class="tag tag--sel">felismerve</span>' : '') + '</div>';
          side += '<div class="seg" role="group" aria-label="Elhangzott?">';
          [
            [0, 'Nem'],
            [0.5, 'Részben'],
            [1, 'Igen'],
          ].forEach(([val, lab]) => (side += '<button type="button" data-act="mark" data-i="' + i + '" data-v="' + val + '" aria-pressed="' + (v === val) + '">' + lab + '</button>'));
          side += '</div></div>';
        });
        side += '<div style="margin-top:14px" class="stack">';
        side += checkbox('q-range', 'Range-ben gondolkodtam (nem csak a saját lapomban)', autoQ.range);
        side += checkbox('q-quant', 'Számoltam (bb, százalék, pot odds)', autoQ.quant);
        side += checkbox('q-plan', 'Volt tervem a következő lépésre', autoQ.plan);
        side += '</div><h3 style="margin-top:16px">Levonások</h3><div class="stack" style="margin-top:8px">';
        side += checkbox('d-result', 'Eredmény-orientált érv („bejött”, „mert vesztettem”)', autoD.result);
        side += checkbox('d-tilt', 'Tilt-jel („vissza kell nyernem”)', autoD.tilt);
        side += checkbox('d-myth', 'Egy tell volt a fő érvem, range és odds nélkül', autoD.myth);
        side += '</div>';
        if (flags.length) side += '<h3 style="margin-top:16px">Árulkodó mondatok</h3><ul class="flags">' + flags.map((f) => '<li><span class="tag tag--warn">' + esc(f.cat) + '</span> ' + esc(f.msg) + (f.quote ? ' <q>' + esc(f.quote) + '</q>' : '') + '</li>').join('') + '</ul>';
        side += '<details class="more"><summary>Amit mondtál</summary><div class="stack" style="margin-top:10px">';
        side += '<div class="field"><span class="field__hint">Hangos gondolkodás</span><textarea data-f="p1">' + esc(ctl.p1) + '</textarea><div data-audio="p1"></div></div>';
        side += '<div class="field"><span class="field__hint">Utólagos magyarázat</span><textarea data-f="p2">' + esc(ctl.p2) + '</textarea><div data-audio="p2"></div></div>';
        side += '</div></details></div>';
      }

      side += '<details class="more" style="margin:0 0 14px"><summary>Nem értek egyet a megoldással</summary><label class="field" style="margin-top:8px"><span class="field__hint">Írd le, miért gondolod másképp — az exporttal Claude is megkapja, és kitér rá.</span><textarea data-f="note" style="min-height:80px"></textarea></label></details>';
      side += '<div class="row no-print" style="margin-top:4px"><button type="button" class="btn btn--primary" data-act="save-next">' + (sess.i + 1 < sess.queue.length ? 'Mentés, jöhet a következő' : 'Mentés és összegzés') + '</button>';
      side += '<button type="button" class="btn btn--ghost" data-act="discard">Nem mentem</button></div>';
      frame(side, true);
      updateScore();
      attachAudio('p1', attemptId + '-p1', ctl.rec1);
      attachAudio('p2', attemptId + '-p2', ctl.rec2);
      const v = main.querySelector('#verdict');
      if (v && g.matchMedia && !g.matchMedia('(min-width: 980px)').matches) v.scrollIntoView({ block: 'start' });
      if (v) v.focus({ preventScroll: true });
    }

    function checkbox(key, label, on) {
      return '<label class="check"><input type="checkbox" data-act="flag" data-k="' + key + '"' + (on ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
    }

    function attachAudio(slot, key, rec) {
      if (!rec || !rec.audioKey) return;
      const host = main.querySelector('[data-audio="' + slot + '"]');
      if (!host) return;
      PK.store.audio
        .get(key)
        .then((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          host.innerHTML = '<audio controls preload="metadata" src="' + url + '" style="width:100%;margin-top:6px"></audio>';
        })
        .catch(() => {});
    }

    function currentScore() {
      const r = ctl.review;
      return PK.scoring.score(spot, { grade: r.grade, mode: quick ? 'quick' : 'full', factorMarks: r.marks, quality: r.quality, deductions: r.deductions });
    }

    function updateScore() {
      const el = main.querySelector('#score');
      if (!el) return;
      const s = currentScore();
      let h = '<div class="score__total">' + s.total + '<small>/100</small></div><div class="score__parts">';
      h += '<span>Döntés <b>' + s.action + '</b>/60</span>';
      if (s.reasoning != null) h += '<span>Érvelés <b>' + Math.round(s.reasoning) + '</b>/40</span>';
      if (s.deduct) h += '<span>Levonás <b>−' + s.deduct + '</b></span>';
      h += '<span>' + (s.success ? '<span class="tag tag--ok">sikeres</span>' : '<span class="tag tag--warn">70 alatt</span>') + '</span></div>';
      el.innerHTML = h;
    }

    function save(next) {
      const r = ctl.review;
      const s = currentScore();
      const p1El = main.querySelector('[data-f="p1"]');
      const p2El = main.querySelector('[data-f="p2"]');
      const a = {
        id: attemptId,
        spotId: spot.id,
        ts: new Date().toISOString(),
        mode: quick ? 'quick' : 'full',
        choice: ctl.choice,
        grade: r.grade,
        action: s.action,
        factorMarks: quick ? null : r.marks,
        quality: quick ? null : r.quality,
        deductions: quick ? null : r.deductions,
        factorsPts: s.factorsPts,
        qualityPts: s.qualityPts,
        deduct: s.deduct,
        reasoning: s.reasoning,
        total: s.total,
        success: s.success,
        timeSec: ctl.timeSec,
        confidence: ctl.confidence,
        phase1: p1El ? p1El.value.trim() : ctl.p1,
        phase2: p2El ? p2El.value.trim() : ctl.p2,
        flags: r.flags,
        note: (main.querySelector('[data-f="note"]') || { value: '' }).value.trim(),
        auto: { factors: r.autoF, quality: r.autoQ, deductions: r.autoD },
        audio: { p1: ctl.rec1 && ctl.rec1.audioKey ? ctl.rec1.audioKey : null, p2: ctl.rec2 && ctl.rec2.audioKey ? ctl.rec2.audioKey : null },
      };
      PK.store.addAttempt(a);
      sess.results.push({ spotId: spot.id, grade: a.grade, total: a.total, success: a.success });
      PK.ui.toast('Mentve: ' + a.total + ' pont');
      sess.i++;
      persist();
      if (next) PK.app.render();
    }

    function discard() {
      ['p1', 'p2'].forEach((k) => PK.store.audio.del(attemptId + '-' + k));
      sess.i++;
      persist();
      PK.app.render();
    }

    renderThink();

    function onKey(e) {
      if (e.target && /^(TEXTAREA|INPUT|SELECT)$/.test(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (ctl.phase === 'think') {
        const n = Number(e.key);
        if (n >= 1 && n <= spot.opts.length) {
          e.preventDefault();
          choose(spot.opts[n - 1].id);
        } else if ((e.key === 'r' || e.key === 'R') && ctl.rec1) {
          e.preventDefault();
          ctl.rec1.toggle();
        }
      } else if (ctl.phase === 'explain' && (e.key === 'r' || e.key === 'R') && ctl.rec2) {
        e.preventDefault();
        ctl.rec2.toggle();
      }
    }
    document.addEventListener('keydown', onKey);

    return {
      destroy() {
        ctl.alive = false;
        document.removeEventListener('keydown', onKey);
        if (ctl.rec1) ctl.rec1.destroy();
        if (ctl.rec2) ctl.rec2.destroy();
      },
      onClick(act, el) {
        if (act === 'choose') choose(el.dataset.id);
        else if (act === 'skip') {
          sess.i++;
          persist();
          PK.app.render();
        } else if (act === 'conf') {
          ctl.confidence = Number(el.dataset.v);
          main.querySelectorAll('[data-act="conf"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
        } else if (act === 'reveal' || act === 'reveal-skip') reveal();
        else if (act === 'mark') {
          const i = Number(el.dataset.i);
          ctl.review.marks[i] = Number(el.dataset.v);
          el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
          updateScore();
        } else if (act === 'save-next') save(true);
        else if (act === 'discard') discard();
      },
      onChange(act, el) {
        if (act === 'flag' && ctl.review) {
          const k = el.dataset.k;
          const on = el.checked;
          if (k === 'q-range') ctl.review.quality.range = on;
          if (k === 'q-quant') ctl.review.quality.quant = on;
          if (k === 'q-plan') ctl.review.quality.plan = on;
          if (k === 'd-result') ctl.review.deductions.result = on;
          if (k === 'd-tilt') ctl.review.deductions.tilt = on;
          if (k === 'd-myth') ctl.review.deductions.myth = on;
          updateScore();
        }
      },
    };
  }

  // ---------------------------------------------------------------- összegzés
  function summary(main) {
    const sess = PK.train.session;
    const res = sess.results;
    const avg = res.length ? Math.round(res.reduce((a, r) => a + r.total, 0) / res.length) : 0;
    const ok = res.filter((r) => r.success).length;
    let h = '<div class="page-head"><div><h1>' + esc(sess.label) + ': kész</h1><p>' + res.length + ' spot, átlag ' + avg + ' pont, ' + ok + ' sikeres (legalább 70 pont).</p></div></div>';
    h += '<div class="section"><ul class="hist">';
    res.forEach((r) => {
      const s = PK.store.spotById(r.spotId);
      const g = PK.scoring.GRADE[r.grade];
      h += '<li><div><a href="#/profil/spot/' + encodeURIComponent(r.spotId) + '">' + esc(s ? s.title : r.spotId) + '</a><div class="meta">' + esc(g ? g.label : '') + '</div></div><div class="pts">' + r.total + '</div></li>';
    });
    h += '</ul></div>';
    h += '<div class="row"><button type="button" class="btn btn--primary" data-act="again">Új kör ugyanígy</button><a class="btn" href="#/profil">Profil megnyitása</a><a class="btn btn--ghost" href="#/edzes">Vissza</a></div>';
    h += '<p class="small muted" style="margin-top:14px">Hetente egyszer exportáld az adataidat (Adatok oldal) és add oda Claude-nak elemzésre — onnan új, rád szabott spotokat is kapsz.</p>';
    main.innerHTML = h;
    return {
      onClick(act) {
        if (act === 'again') startSession(sess.kind, sess.opt);
      },
    };
  }

  PK.train = PK.train || { session: null };
  PK.train.start = startSession;
  PK.train.buildQueue = buildQueue;
  PK.views.train = { home, player, clockStrip, spotMain, optionsHtml };
})(typeof window !== 'undefined' ? window : globalThis);
