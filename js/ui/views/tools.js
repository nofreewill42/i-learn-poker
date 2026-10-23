/* i-learn-poker — Eszközök: pot odds, equity, ICM és deal, all-in hívás ICM alatt, bounty-átváltó */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.views = PK.views || {};
  const esc = (s) => PK.util.esc(s);
  const N = (x, d) => PK.util.num(x, d);

  function numIn(key, label, value, attrs) {
    return '<label class="field">' + esc(label) + '<input type="text" inputmode="decimal" autocomplete="off" data-f="' + key + '" value="' + esc(N(value)) + '"' + (attrs ? ' ' + attrs : '') + '></label>';
  }

  function view(main) {
    const st = {
      stacks: [28, 22, 15, 12, 9, 7, 4],
      payouts: '32; 21; 15; 11; 8,5; 7; 5,5',
      hero: 2,
      villain: 0,
    };

    function stackRows() {
      return st.stacks
        .map(
          (s, i) =>
            '<div class="srow"><span class="num" style="font-size:1.1rem">' + (i + 1) + '.</span>' +
            '<input type="text" inputmode="decimal" autocomplete="off" data-stack="' + i + '" value="' + esc(N(s)) + '" aria-label="' + (i + 1) + '. játékos stackje">' +
            '<span class="small muted" data-ev="' + i + '"></span>' +
            '<button type="button" class="btn btn--sm btn--ghost" data-act="rm-stack" data-i="' + i + '" aria-label="' + (i + 1) + '. játékos törlése"' + (st.stacks.length <= 2 ? ' disabled' : '') + '>' + PK.ui.icons.trash + '</button></div>',
        )
        .join('');
    }

    function render() {
      let h = '<div class="page-head"><div><h1>Eszközök</h1><p>Számolj utána a spotoknak és a saját kezeidnek. Minden számítás a böngésződben fut.</p></div></div>';

      h += '<div class="grid-2">';
      h += '<div class="section"><h2>Pot odds</h2><div class="form-grid form-grid--2">' + numIn('po-pot', 'Pot a bet előtt (bb)', 10) + numIn('po-bet', 'Az ellenfél betje (bb)', 5) + '</div><div class="calc-out" id="po-out"></div></div>';
      h += '<div class="section"><h2>Bounty-átváltó (K.O. verseny)</h2><div class="form-grid form-grid--2">' + numIn('ko-buy', 'Buy-in (Ft)', 25000) + numIn('ko-bounty', 'Ebből bounty (Ft)', 5000) + numIn('ko-stack', 'Kezdőstack (zseton)', 50000) + numIn('ko-bb', 'A mostani big blind (zseton)', 2000) + '</div><div class="calc-out" id="ko-out"></div><p class="small muted" style="margin:8px 0 0">Csak akkor add a pothoz, ha fedezed az all-in játékost. A Duna K.O. versenyén a bounty arányát kérdezd meg a floortól.</p></div>';
      h += '</div>';

      h += '<div class="section" style="margin-top:16px"><h2>Equity</h2><div class="form-grid form-grid--3">';
      h += '<label class="field">A lapjaid<input type="text" data-f="eq-hero" value="KcJd" placeholder="KcJd"></label>';
      h += '<label class="field">Ellenfél: konkrét kéz vagy range<input type="text" data-f="eq-vil" value="77+, ATs+, AJo+, KQs" placeholder="AhQs vagy 77+, ATs+"></label>';
      h += '<label class="field">Board (opcionális)<input type="text" data-f="eq-board" value="" placeholder="Jh7h2c"></label>';
      h += '</div><div class="row" style="margin-top:12px"><button type="button" class="btn btn--primary" data-act="eq">Számolás</button><span class="small muted">Monte Carlo, 60 000 leosztás; a range-jelölés: 22+, A2s+, ATo+, KQs, Ax, Qx+</span></div><div class="calc-out" id="eq-out" aria-live="polite"></div></div>';

      h += '<div class="section"><h2>ICM és deal</h2><p class="small muted">Stackek bb-ben (vagy zsetonban), kifizetések a díjalap %-ában vagy forintban, helyezés szerint. Az alapértelmezés egy 7 fizetős, kis mezőnyös struktúra feltételezése.</p>';
      h += '<div class="grid-2"><div><div class="stacks-list" id="stacks">' + stackRows() + '</div><div class="row" style="margin-top:8px"><button type="button" class="btn btn--sm" data-act="add-stack"' + (st.stacks.length >= 10 ? ' disabled' : '') + '>' + PK.ui.icons.plus + 'Játékos</button></div></div>';
      h += '<div><label class="field">Kifizetések (pontosvesszővel elválasztva)<input type="text" data-f="payouts" value="' + esc(st.payouts) + '"></label><div id="icm-out" style="margin-top:12px"></div></div></div></div>';

      h += '<div class="section"><h2>All-in hívás ICM alatt</h2><p class="small muted">A fenti stackeket használja. A hős és a jammelő stackje a kéz elején értendő; a holt pénz a többiek betéte (pl. SB, ante).</p><div class="form-grid form-grid--4">';
      h += '<label class="field">Te vagy a…<select data-f="ai-hero">' + st.stacks.map((s, i) => '<option value="' + i + '"' + (i === st.hero ? ' selected' : '') + '>' + (i + 1) + '. (' + N(s) + ')</option>').join('') + '</select></label>';
      h += '<label class="field">All-in játékos<select data-f="ai-vil">' + st.stacks.map((s, i) => '<option value="' + i + '"' + (i === st.villain ? ' selected' : '') + '>' + (i + 1) + '. (' + N(s) + ')</option>').join('') + '</select></label>';
      h += numIn('ai-blind', 'Már betett vakod', 1) + numIn('ai-ante', 'A te holt antéd (BBA)', 1);
      h += numIn('ai-dead', 'Holt pénz másoktól', 0.5);
      h += '</div><div class="calc-out" id="ai-out" aria-live="polite"></div></div>';
      main.innerHTML = h;
      calcAll();
    }

    function v(k) {
      const el = main.querySelector('[data-f="' + k + '"]');
      return el ? el.value : '';
    }

    const n = (k) => PK.util.parseNum(v(k));

    /**
     * Kifizetések: pontosvesszővel vagy új sorral elválasztva, így az ezres tagolás („100 000”) és a tizedesvessző („8,5”) is mehet.
     * Pontosvessző nélkül a szóköz (vagy egyetlen tételnél a vessző) választ el. A nem értelmezhető tételeket visszaadja.
     */
    function payouts() {
      const raw = String(v('payouts')).trim();
      let tokens;
      if (/[;\n]/.test(raw)) tokens = raw.split(/[;\n]+/);
      else {
        tokens = raw.split(/\s+/);
        if (tokens.length === 1 && raw.indexOf(',') >= 0) tokens = raw.split(',');
      }
      tokens = tokens.map((x) => x.trim()).filter(Boolean);
      const vals = tokens.map((x) => PK.util.parseNum(x));
      const ok = (x) => isFinite(x) && x >= 0;
      return { list: vals.filter(ok), bad: tokens.filter((x, i) => !ok(vals[i])) };
    }

    function calcAll() {
      // pot odds
      const pot = n('po-pot');
      const bet = n('po-bet');
      const po = main.querySelector('#po-out');
      if (pot > 0 && bet > 0) {
        po.innerHTML =
          '<div><b>' + PK.util.pct(bet / (pot + 2 * bet)) + '</b><span>equity kell a híváshoz</span></div>' +
          '<div><b>' + PK.util.pct(bet / (pot + bet)) + '</b><span>ilyen gyakran kell dobnia, ha te blöffölsz ekkorát</span></div>' +
          '<div><b>' + N(pot + 2 * bet) + 'bb</b><span>végső pot</span></div>';
      } else po.innerHTML = '<span class="muted">Adj meg pozitív potot és betet.</span>';

      // bounty
      const buy = n('ko-buy');
      const bty = n('ko-bounty');
      const stk = n('ko-stack');
      const bbc = n('ko-bb');
      const ko = main.querySelector('#ko-out');
      if (buy > bty && bty > 0 && stk > 0 && bbc > 0) {
        const chips = bty / ((buy - bty) / stk);
        ko.innerHTML = '<div><b>' + N(chips, 0) + '</b><span>zseton értékű a bounty</span></div><div><b>' + N(chips / bbc, 1) + 'bb</b><span>ennyivel nő a pot, ha nyersz</span></div>';
      } else ko.innerHTML = '<span class="muted">A bounty legyen kisebb a buy-innál, és minden mező pozitív.</span>';

      // ICM
      const PP = payouts();
      const P = PP.list;
      const out = main.querySelector('#icm-out');
      const warn = PP.bad.length ? '<p class="notice notice--warn" style="margin:0 0 10px">Ezt nem értem a kifizetések között: „' + esc(PP.bad.join('”, „')) + '”. A tételeket pontosvesszővel válaszd el, pl. 100 000; 60 000; 40 000.</p>' : '';
      if (st.stacks.filter((s) => s > 0).length >= 2 && P.length) {
        try {
          const ev = PK.icm.equity(st.stacks, P);
          const pool = P.slice(0, st.stacks.length).reduce((a, b) => a + b, 0);
          const tot = st.stacks.reduce((a, b) => a + b, 0);
          ev.forEach((e, i) => {
            const el = main.querySelector('[data-ev="' + i + '"]');
            if (el) el.textContent = 'ICM ' + N(e, 2) + ' (' + PK.util.pct(e / pool, 1) + ' a díjalapból, zseton: ' + PK.util.pct(st.stacks[i] / tot, 1) + ')';
          });
          const d = PK.icm.deals(st.stacks, P);
          let t = '<table class="t"><thead><tr><th>Játékos</th><th class="r">ICM</th><th class="r">Chip chop</th><th class="r">Különbség</th></tr></thead><tbody>';
          st.stacks.forEach((s, i) => (t += '<tr><td>' + (i + 1) + '. (' + N(s) + ')</td><td class="r">' + N(d.icm[i], 2) + '</td><td class="r">' + N(d.chip[i], 2) + '</td><td class="r">' + (d.chip[i] - d.icm[i] >= 0 ? '+' : '') + N(d.chip[i] - d.icm[i], 2) + '</td></tr>'));
          t += '</tbody></table><p class="small muted" style="margin-top:8px">Chip chop: mindenki megkapja a legkisebb kiosztott díjat, a maradék zsetonarányosan oszlik. A chip leadernek ez kedvez, a rövid stackeknek az ICM.</p>';
          out.innerHTML = warn + t;
        } catch (e) {
          out.innerHTML = '<p class="notice notice--bad">' + esc(e.message) + '</p>';
        }
      } else out.innerHTML = warn + '<span class="muted">Legalább két pozitív stack és egy kifizetés kell.</span>';

      // all-in hívás
      const ai = main.querySelector('#ai-out');
      const hero = Number(v('ai-hero'));
      const vil = Number(v('ai-vil'));
      st.hero = hero;
      st.villain = vil;
      if (hero === vil) {
        ai.innerHTML = '<span class="muted">Válassz két különböző játékost.</span>';
      } else {
        try {
          const r = PK.icm.callAllIn({ stacks: st.stacks, payouts: P, hero, villain: vil, heroBlind: n('ai-blind') || 0, heroAnte: n('ai-ante') || 0, dead: n('ai-dead') || 0 });
          const bf = PK.icm.bubbleFactor(st.stacks, P, hero, vil);
          ai.innerHTML =
            '<div><b>' + PK.util.pct(r.needChip) + '</b><span>equity kell chipEV-ben (' + N(r.callAmt) + ' hívás, ' + N(r.finalPot) + ' végső pot)</span></div>' +
            '<div><b>' + PK.util.pct(r.needIcm) + '</b><span>equity kell ICM-ben</span></div>' +
            '<div><b>+' + PK.util.pct(r.rp) + '</b><span>risk premium</span></div>' +
            '<div><b>' + (isFinite(bf.bf) ? N(bf.bf, 2) : '∞') + '</b><span>bubble factor (holt pénz nélkül)</span></div>';
        } catch (e) {
          ai.innerHTML = '<span class="muted">' + esc(e.message) + '</span>';
        }
      }
    }

    function runEquity() {
      const out = main.querySelector('#eq-out');
      const hero = PK.cards.parseMany(v('eq-hero'));
      const board = PK.cards.parseMany(v('eq-board'));
      const vtxt = v('eq-vil');
      const vcards = PK.cards.parseMany(vtxt);
      if (hero.length !== 2) {
        out.innerHTML = '<span class="muted">Add meg a két lapodat, pl. KcJd.</span>';
        return;
      }
      if ([0, 3, 4, 5].indexOf(board.length) < 0) {
        out.innerHTML = '<span class="muted">A board 0, 3, 4 vagy 5 lap legyen.</span>';
        return;
      }
      out.innerHTML = '<span class="muted">Számolok…</span>';
      setTimeout(() => {
        try {
          const compact = vtxt.replace(/\s+/g, '').replace(/10/g, 'T');
          const isHand = /^([AKQJT2-9][shdc♠♥♦♣]){2}$/i.test(compact);
          const r = isHand ? PK.equity.vs({ hero, villain: vcards, board, trials: 60000 }) : PK.equity.vs({ hero, range: vtxt, board, trials: 60000 });
          out.innerHTML =
            '<div><b>' + PK.util.pct(r.eq) + '</b><span>equity</span></div><div><b>' + PK.util.pct(r.win) + '</b><span>nyer</span></div><div><b>' + PK.util.pct(r.tie) + '</b><span>döntetlen</span></div>' +
            '<div><b>' + r.combos + '</b><span>ellenfél-kombináció</span></div>';
        } catch (e) {
          out.innerHTML = '<p class="notice notice--bad" style="margin:0">' + esc(e.message) + '</p>';
        }
      }, 20);
    }

    render();
    return {
      onInput(act, el) {
        if (el.dataset.stack != null) {
          st.stacks[Number(el.dataset.stack)] = Math.max(0, PK.util.parseNum(el.value) || 0);
          calcAll();
          return;
        }
        if (el.dataset.f === 'payouts') st.payouts = el.value;
        if (el.dataset.f && el.dataset.f.indexOf('eq-') !== 0) calcAll();
      },
      onChange(act, el) {
        if (el.dataset.f === 'ai-hero' || el.dataset.f === 'ai-vil') calcAll();
      },
      onClick(act, el) {
        if (act === 'eq') runEquity();
        else if (act === 'add-stack' && st.stacks.length < 10) {
          st.stacks.push(10);
          render();
        } else if (act === 'rm-stack' && st.stacks.length > 2) {
          st.stacks.splice(Number(el.dataset.i), 1);
          st.hero = Math.min(st.hero, st.stacks.length - 1);
          st.villain = Math.min(st.villain, st.stacks.length - 1);
          render();
        }
      },
    };
  }

  PK.views.tools = { view };
})(typeof window !== 'undefined' ? window : globalThis);
