/* i-learn-poker — villámdrillek: push/fold 10bb és pot odds */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.views = PK.views || {};
  const esc = (s) => PK.util.esc(s);

  function pushfold(main, params) {
    const warmup = params && params[0] === 'bemelegites';
    const S = PK.store.state;
    const st = S.drills.pf;
    const sess = { n: 0, ok: 0, streak: 0 };
    let kind = 'shove';
    let posFilter = '';
    let q = null;
    let answered = false;

    function next() {
      q = PK.drills.pushFold({ kind, pos: posFilter || null });
      answered = false;
      render();
    }

    function render() {
      const C = PK.data.charts;
      const positions = (kind === 'call' ? C.call10.rows : C.pf10.rows).map((r) => r.pos);
      let h = '<div class="page-head"><div><h1>' + (warmup ? 'Verseny előtti bemelegítés' : 'Push/fold villám') + '</h1><p>' + (warmup ? '10 gyors push/fold döntés, aztán írd fel a mai 3 fókuszpontodat. ' : '') + esc(C.pf10.setup) + '. Forrás: ' + esc(C.pf10.source) + '.</p></div>';
      h += '<a class="btn btn--ghost" href="#/edzes">' + PK.ui.icons.back + 'Edzés</a></div>';
      h += '<div class="row" style="margin-bottom:16px"><div class="seg" role="group" aria-label="Feladat">';
      [
        ['shove', 'Nyitó all-in'],
        ['call', 'Hívás UTG-shove ellen'],
        ['mix', 'Vegyes'],
      ].forEach(([k, l]) => (h += '<button type="button" data-act="kind" data-v="' + k + '" aria-pressed="' + (kind === k) + '">' + l + '</button>'));
      h += '</div>';
      if (kind !== 'mix') {
        h += '<label class="field" style="flex-direction:row;align-items:center;gap:8px"><span class="field__hint">Pozíció</span><select data-act="pos" style="width:auto"><option value="">Mind</option>' + positions.map((p) => '<option value="' + esc(p) + '"' + (posFilter === p ? ' selected' : '') + '>' + esc(p) + '</option>').join('') + '</select></label>';
      }
      h += '</div>';

      h += '<div class="section drill"><div class="drill__hand"><div><div class="drill__pos">' + esc(q.pos) + '</div><div class="small muted">10 fős asztalon: ' + esc(q.ten) + '</div></div>';
      h += '<span class="cards">' + q.cards.map((c) => PK.cards.html(c, { size: 'lg' })).join('') + '</span></div>';
      h += '<p>' + (q.kind === 'shove' ? 'Eddig mindenki dobott. 10bb-d van — all-in vagy fold?' : 'Az UTG 10bb-vel all-in, utána mindenki dobott. Neked is 10bb-d van — hívsz vagy dobsz?') + '</p>';
      const yes = q.kind === 'shove' ? 'All-in' : 'Hívás';
      const yesV = q.kind === 'shove' ? 'shove' : 'call';
      h += '<div class="drill__answers">';
      h += '<button type="button" class="btn" data-act="ans" data-v="' + yesV + '"' + (answered ? ' disabled' : '') + '>' + yes + ' <kbd>1</kbd></button>';
      h += '<button type="button" class="btn" data-act="ans" data-v="fold"' + (answered ? ' disabled' : '') + '>Fold <kbd>2</kbd></button></div>';
      h += '<div id="fb" aria-live="polite"></div>';
      if (warmup) h += '<div class="meter" style="margin-top:14px" role="progressbar" aria-valuemin="0" aria-valuemax="10" aria-valuenow="' + Math.min(10, sess.n) + '"><i style="width:' + Math.min(100, sess.n * 10) + '%"></i></div>';
      h += '<div class="stats-line"><span>Most: <b>' + sess.ok + '/' + sess.n + '</b></span><span>Sorozat: <b>' + sess.streak + '</b></span><span>Legjobb sorozat: <b>' + (st.best || 0) + '</b></span><span>Összesen: <b>' + (st.n ? PK.util.pct(st.ok / st.n, 0) : '–') + '</b></span></div></div>';
      main.innerHTML = h;
    }

    function answer(v) {
      if (answered) return;
      answered = true;
      const right = v === q.answer;
      sess.n++;
      st.n++;
      if (right) {
        sess.ok++;
        st.ok++;
        sess.streak++;
        st.best = Math.max(st.best || 0, sess.streak);
      } else sess.streak = 0;
      const key = (q.kind === 'call' ? 'hívás ' : '') + q.pos;
      st.byPos[key] = st.byPos[key] || { n: 0, ok: 0 };
      st.byPos[key].n++;
      if (right) st.byPos[key].ok++;
      PK.store.save();
      render();
      main.querySelectorAll('[data-act="ans"]').forEach((b) => {
        if (b.dataset.v === q.answer) b.classList.add('is-correct');
        else if (b.dataset.v === v) b.classList.add('is-wrong');
      });
      const label = q.answer === 'fold' ? 'Fold' : q.kind === 'shove' ? 'All-in' : 'Hívás';
      let fb = '<div class="notice ' + (right ? 'notice--ok' : 'notice--bad') + '" style="margin-top:14px"><p><b>' + (right ? 'Helyes.' : 'Nem ez.') + '</b> A ' + esc(q.cls) + ' ' + esc(q.pos) + '-ből: <b>' + label + '</b>.' + (q.border ? ' <span class="tag tag--warn">határeset</span>' : '') + '</p>';
      fb += '<p class="small" style="margin:0">' + (q.kind === 'shove' ? 'Nyitó all-in' : 'Hívás') + ' range (' + PK.util.num(q.pct, 1) + '%): ' + esc(q.range) + '</p></div>';
      fb += '<div style="margin-top:12px">' + PK.ui.viz.rangeGrid(q.set, q.cls, q.pos + ' range') + '</div>';
      if (warmup && sess.n >= 10) {
        fb += '<div class="notice notice--ok" style="margin-top:14px"><p><b>Kész a bemelegítés: ' + sess.ok + '/10.</b> Most írd fel a mai 3 fókuszpontodat, és fotózd le a verseny struktúráját.</p></div>';
        fb += '<div class="row" style="margin-top:12px"><a class="btn btn--primary" href="#/naplo/verseny/uj">Fókuszpontok felírása</a><button type="button" class="btn btn--ghost" data-act="next">Még egy kör</button></div>';
      } else fb += '<div class="row" style="margin-top:14px"><button type="button" class="btn btn--primary" data-act="next">Következő <kbd>Enter</kbd></button></div>';
      main.querySelector('#fb').innerHTML = fb;
      const nb = main.querySelector('[data-act="next"]');
      if (nb) nb.focus({ preventScroll: true });
    }

    function onKey(e) {
      if (e.target && /^(TEXTAREA|INPUT|SELECT)$/.test(e.target.tagName)) return;
      if (!answered && (e.key === '1' || e.key === '2')) {
        e.preventDefault();
        answer(e.key === '1' ? (q.kind === 'shove' ? 'shove' : 'call') : 'fold');
      } else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        if (e.target && e.target.tagName === 'BUTTON') return; // a fókuszált gomb saját kattintása intézi
        e.preventDefault();
        next();
      }
    }
    document.addEventListener('keydown', onKey);
    next();
    return {
      destroy() {
        document.removeEventListener('keydown', onKey);
      },
      onClick(act, el) {
        if (act === 'ans') answer(el.dataset.v);
        else if (act === 'next') next();
        else if (act === 'kind') {
          kind = el.dataset.v;
          posFilter = '';
          next();
        }
      },
      onChange(act, el) {
        if (act === 'pos') {
          posFilter = el.value;
          next();
        }
      },
    };
  }

  function potodds(main) {
    const st = PK.store.state.drills.po;
    const sess = { n: 0, ok: 0 };
    let q = null;
    let answered = false;

    function next() {
      q = PK.drills.potOdds();
      answered = false;
      render();
    }

    function render() {
      let h = '<div class="page-head"><div><h1>Pot odds villám</h1><p>Hívás, blöff, BB-védelem, outok és all-in hívás — a fejszámolás, amit az asztalnál gyorsan kell tudni.</p></div>';
      h += '<a class="btn btn--ghost" href="#/edzes">' + PK.ui.icons.back + 'Edzés</a></div>';
      h += '<div class="section drill"><p style="font-size:1.15rem;font-weight:600">' + esc(q.prompt) + '</p><div class="drill__choices">';
      q.choices.forEach((c, i) => (h += '<button type="button" class="btn" data-act="ans" data-i="' + i + '"' + (answered ? ' disabled' : '') + '>' + esc(c.label) + '</button>'));
      h += '</div><div id="fb" aria-live="polite"></div>';
      h += '<div class="stats-line"><span>Most: <b>' + sess.ok + '/' + sess.n + '</b></span><span>Összesen: <b>' + (st.n ? PK.util.pct(st.ok / st.n, 0) : '–') + '</b></span></div></div>';
      main.innerHTML = h;
    }

    function answer(i) {
      if (answered) return;
      answered = true;
      const right = i === q.answer;
      sess.n++;
      st.n++;
      if (right) {
        sess.ok++;
        st.ok++;
      }
      st.byType[q.type] = st.byType[q.type] || { n: 0, ok: 0 };
      st.byType[q.type].n++;
      if (right) st.byType[q.type].ok++;
      PK.store.save();
      render();
      main.querySelectorAll('[data-act="ans"]').forEach((b) => {
        const k = Number(b.dataset.i);
        if (k === q.answer) b.classList.add('is-correct');
        else if (k === i) b.classList.add('is-wrong');
      });
      main.querySelector('#fb').innerHTML =
        '<div class="notice ' + (right ? 'notice--ok' : 'notice--bad') + '" style="margin-top:14px"><p><b>' + (right ? 'Helyes.' : 'Nem ez.') + '</b> ' + esc(q.explain) + '</p></div>' +
        '<div class="row" style="margin-top:12px"><button type="button" class="btn btn--primary" data-act="next">Következő <kbd>Enter</kbd></button></div>';
      const nb = main.querySelector('[data-act="next"]');
      if (nb) nb.focus({ preventScroll: true });
    }

    function onKey(e) {
      if (e.target && /^(TEXTAREA|INPUT|SELECT)$/.test(e.target.tagName)) return;
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= 4) {
        e.preventDefault();
        answer(n - 1);
      } else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        if (e.target && e.target.tagName === 'BUTTON') return; // a fókuszált gomb saját kattintása intézi
        e.preventDefault();
        next();
      }
    }
    document.addEventListener('keydown', onKey);
    next();
    return {
      destroy() {
        document.removeEventListener('keydown', onKey);
      },
      onClick(act, el) {
        if (act === 'ans') answer(Number(el.dataset.i));
        else if (act === 'next') next();
      },
    };
  }

  PK.views.drills = { pushfold, potodds };
})(typeof window !== 'undefined' ? window : globalThis);
