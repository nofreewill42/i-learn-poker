/* i-learn-poker — Markdown-összefoglaló és elemzési kérés Claude-nak */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});

  const PROMPT = [
    'Te vagy a pókeredzőm. Élő, 10 fős asztalos, 50–120 nevezős MTT-ket játszom a budapesti Duna Poker Centerben, heti 1–2 alkalommal.',
    'Ez az i-learn-poker gyakorlóalkalmazásom exportja: spotonként a döntésem, a hangos gondolkodásom átirata (1. fázis: döntés előtt, szabadon), az utólagos magyarázatom (2. fázis) és a pontszámok; továbbá az élő kezeim, a versenynaplóm és a mentális jegyzeteim. Az átiratok gépi beszédfelismerésből jönnek, lehetnek bennük félrehallások.',
    '',
    'Kérlek:',
    '1. Elemezd a gondolkodásomat a 13 kategória szerint (PRE, LMP, STK, BBD, 3B, CB, MW, RIV, PF, ICM, FT, EXP, MEN), és nevezd meg a 3 legnagyobb leakemet — idézd a gondolkodásomból az árulkodó mondatokat.',
    '2. Becsüld meg a szintemet (1 Kezdő, 2 Hobbi-játékos, 3 Tudatos klubjátékos, 4 Erős regular, 5 Haladó) indoklással; ha eltérsz az app becslésétől, mondd meg, miért.',
    '3. Nézd át az élő kezeimet: hol tértem el a jó gyakorlattól, és mi a tanulság.',
    '4. Adj konkrét, 2 hetes gyakorlási tervet: mit gyakoroljak az appban, és mire figyeljek az élő versenyeken.',
    '5. Írj 10 új gyakorló spotot a gyenge kategóriáimra a dokumentum végén leírt formátumban, egyetlen JSON-tömbként egy ```json kódblokkban, „X-” kezdetű egyedi azonosítókkal, hogy importálni tudjam. Az élő kezeimből is csinálhatsz spotot.',
  ].join('\n');

  const FORMAT = [
    'Minden spot egy objektum. Összegek big blindban (bb). Kötelező mezők: id, title, stage (early|middle|bubble|ft|mental), cats (kategóriakódok, az első a fő), diff (1–5), basis (gto|exploit|icm|math|mental|concept), conf (high|med|low), ctx {entrants, left, paid, level, blinds, ante, avgBb, note?}, q (kérdés), opts, ans (megoldás egy mondatban), exp (magyarázat számokkal), factors, src. Opcionális: scene (helyzetleírás), table, check, mist, markers.',
    '- opts: [{ id, t (szöveg méretekkel), g: best|good|minor|blunder, why (kötelező, ha nem best: mit árul el a gondolkodásról ez a választás) }], 2–5 db.',
    '- factors: 3–5 db { c, t, kw? } — c a hangos gondolkodásban keresett fogalom: pos, stack, odds, range, profile, icm, board, spr, fe, sizing, blockers, plan, dom, implied, dead, init, mw, tilt, tells, bankroll, math, reshove.',
    '- markers: [{ re: "ékezet nélküli kisbetűs regex", msg: "mit jelez" }] — árulkodó mondatok.',
    '- table: { players (2–10), sb (0.5), bb (1), ante (1), anteType ("bba" = a BB fizeti, holt pénz | "each" | ante: 0), stacks { default, <pozíció>: bb a kéz ELEJÉN }, profiles { <pozíció>: rec|reg|lag|nit|station|passive|maniac|cl|unknown }, reads { <pozíció>: szöveg }, hero, cards ["Kc","Jd"], board [0/3/4/5 lap], actions }.',
    '- Pozíciók 10 főnél: UTG, UTG+1, UTG+2, MP, LJ, HJ, CO, BTN, SB, BB (kevesebbnél a végéről: 9 → UTG, UTG+1, MP, LJ, HJ, CO, BTN, SB, BB; 8 → UTG, UTG+1, LJ, HJ, CO, BTN, SB, BB; 7 → UTG, LJ, HJ, CO, BTN, SB, BB; 6 → LJ, HJ, CO, BTN, SB, BB; 2 → SB, BB).',
    '- actions: [pozíció, akció, összeg] elemek; akció: f fold, x check, c call, l limp, b bet (az utcán betett összeg), r raise (az utcán betett TELJES összeg), j all-in; utcaváltás: "flop", "turn", "river". Preflop a fel nem sorolt, sorra kerülő játékosok automatikusan dobnak; postflop minden akciót ki kell írni a valódi sorrendben (SB, BB, UTG … BTN). A felsorolt akciók után a hősnek kell következnie.',
    '- check: { pot, toCall, needEq (tört), spr, eff } — opcionális önellenőrzés; az app ellenőrzi a saját motorjával.',
  ].join('\n');

  function q(s) {
    return String(s || '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function markdown(opts) {
    const o = opts || {};
    const S = PK.store.state;
    const U = PK.util;
    const sc = PK.scoring;
    const since = o.days ? Date.now() - o.days * 86400000 : 0;
    const inRange = (ts) => !since || new Date(ts).getTime() >= since;
    const lines = [];
    const lv = sc.levelEstimate(S.attempts, PK.store.spotById);
    const cats = sc.categoryScores(sc.latestAttempts(S.attempts), PK.store.spotById);

    lines.push('# Pókeredzés — export elemzéshez', '');
    lines.push('Exportálva: ' + U.dateTimeHu(new Date()) + (o.days ? ' (az utolsó ' + o.days + ' nap)' : ' (minden adat)'), '');
    lines.push('## Kérés', '', PROMPT, '');

    lines.push('## Profil (az app becslése)', '');
    lines.push('- Becsült szint: ' + (lv.enough ? lv.level + ' – ' + lv.label + (lv.rising ? ' (feltörekvő)' : '') : 'még kevés az adat') + ', ' + lv.firstN + ' első próbálkozás alapján');
    const dl = [];
    for (let d = 1; d <= 5; d++) dl.push(d + ': ' + lv.byDiff[d].ok + '/' + lv.byDiff[d].n);
    lines.push('- Siker nehézségi szintenként (első próbálkozás, siker = legalább 70 pont): ' + dl.join(', '));
    if (lv.qualityAvg != null) lines.push('- Gondolkodási minőség átlaga: ' + U.num(lv.qualityAvg, 1) + '/15 (range-gondolkodás, számolás, terv)');
    lines.push('', '| Kategória | Pontszám | Próbálkozás |', '|---|---|---|');
    for (const c of sc.CATEGORIES) lines.push('| ' + c.code + ' – ' + c.name + ' | ' + Math.round(cats[c.code].score) + ' | ' + cats[c.code].n + ' |');
    const flagCount = {};
    S.attempts.forEach((a) => (a.flags || []).forEach((f) => (flagCount[f.cat + ': ' + f.msg] = (flagCount[f.cat + ': ' + f.msg] || 0) + 1)));
    const topFlags = Object.entries(flagCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (topFlags.length) {
      lines.push('', 'Leggyakoribb árulkodó jelek a gondolkodásomban:');
      topFlags.forEach(([k, n]) => lines.push('- ' + k + ' (' + n + '×)'));
    }
    const pf = S.drills.pf;
    if (pf.n) {
      lines.push('', '- Push/fold drill (10bb): ' + pf.ok + '/' + pf.n + ' helyes (' + U.pct(pf.ok / pf.n, 0) + ')');
      const pos = Object.entries(pf.byPos || {}).map(([p, v]) => p + ' ' + v.ok + '/' + v.n);
      if (pos.length) lines.push('  - pozíciónként: ' + pos.join(', '));
    }
    const po = S.drills.po;
    if (po.n) lines.push('- Pot odds drill: ' + po.ok + '/' + po.n + ' helyes (' + U.pct(po.ok / po.n, 0) + ')');
    lines.push('');

    const atts = S.attempts.filter((a) => inRange(a.ts));
    lines.push('## Spotok időrendben (' + atts.length + ')', '');
    for (const a of atts) {
      const sp = PK.store.spotById(a.spotId);
      if (!sp) continue;
      const chosen = sp.opts.find((x) => x.id === a.choice);
      const best = sp.opts.filter((x) => x.g === 'best').map((x) => x.t).join(' / ');
      lines.push('### ' + sp.id + ' — ' + sp.title + ' (' + sp.cats.join('/') + ', nehézség ' + sp.diff + ')');
      lines.push('- Időpont: ' + U.dateTimeHu(a.ts) + (a.mode === 'quick' ? ', gyors mód' : ''));
      lines.push('- Döntésem: ' + (chosen ? chosen.t : a.choice) + ' → ' + (sc.GRADE[a.grade] ? sc.GRADE[a.grade].label : a.grade) + (a.grade !== 'best' ? ' (ajánlott: ' + best + ')' : ''));
      const parts = ['döntés ' + a.action + '/60'];
      if (a.reasoning != null) parts.push('érvelés ' + Math.round(a.reasoning) + '/40');
      if (a.deduct) parts.push('levonás −' + a.deduct);
      lines.push('- Pont: ' + a.total + '/100 (' + parts.join(', ') + ')' + (a.confidence ? ', magabiztosság ' + a.confidence + '/5' : '') + (a.timeSec ? ', ' + a.timeSec + ' mp' : ''));
      if (q(a.phase1)) lines.push('- Hangos gondolkodás: „' + q(a.phase1) + '”');
      if (q(a.phase2)) lines.push('- Utólagos magyarázat: „' + q(a.phase2) + '”');
      if (a.flags && a.flags.length) lines.push('- Árulkodó jelek: ' + a.flags.map((f) => f.cat + ' – ' + f.msg).join('; '));
      if (q(a.note)) lines.push('- Nem értek egyet a megoldással: „' + q(a.note) + '” — kérlek, térj ki rá.');
      lines.push('');
    }

    const hands = S.liveHands.filter((h) => inRange(h.date || h.ts));
    if (hands.length) {
      lines.push('## Élő kezek (' + hands.length + ')', '');
      for (const h of hands) {
        lines.push('### ' + (h.date || '') + ' — ' + (h.tournament || 'verseny') + (h.level ? ', ' + h.level + '. szint' : ''));
        const meta = [];
        if (h.blinds) meta.push('vakok ' + h.blinds);
        if (h.pos) meta.push('pozícióm ' + h.pos);
        if (h.stack) meta.push('stackem ' + h.stack + 'bb');
        if (h.cards) meta.push('lapjaim ' + h.cards);
        if (h.board) meta.push('board ' + h.board);
        if (meta.length) lines.push('- ' + meta.join(', '));
        if (q(h.shorthand)) lines.push('- Rövidítés: `' + q(h.shorthand) + '`');
        if (q(h.reads)) lines.push('- Olvasatok: ' + q(h.reads));
        ['pre', 'flop', 'turn', 'river'].forEach((k) => {
          if (h.action && q(h.action[k])) lines.push('- ' + k + ': ' + q(h.action[k]));
        });
        if (q(h.thoughts)) lines.push('- Gondolataim: „' + q(h.thoughts) + '”');
        if (q(h.result)) lines.push('- Eredmény: ' + q(h.result));
        if (h.emotion) lines.push('- Érzelmi állapot: ' + h.emotion + '/5' + (q(h.emotionNote) ? ' — ' + q(h.emotionNote) : ''));
        lines.push('');
      }
    }

    const sess = S.sessions.filter((x) => inRange(x.date || x.ts));
    if (sess.length) {
      lines.push('## Versenynapló (' + sess.length + ')', '', '| Dátum | Verseny | Költség | Helyezés | Nyeremény | Játék | Fókusz | Pool-megfigyelések |', '|---|---|---|---|---|---|---|---|');
      for (const x of sess) {
        const cost = (Number(x.buyIn) || 0) * (1 + (Number(x.rebuys) || 0)) + (Number(x.addOn) || 0);
        lines.push(
          '| ' + [x.date, q(x.tournament), U.ft(cost), x.finish ? x.finish + (x.entrants ? '/' + x.entrants : '') : '–', U.ft(Number(x.prize) || 0), x.game || '–', (x.focus || []).filter(Boolean).map(q).join('; '), (x.pool || []).filter(Boolean).map(q).join('; ')].join(' | ') + ' |',
        );
      }
      lines.push('');
    }

    const mhh = S.mhh.filter((x) => inRange(x.ts));
    if (mhh.length) {
      lines.push('## Mental Hand History (' + mhh.length + ')', '');
      for (const m of mhh) {
        lines.push('### ' + U.dateHu(m.ts));
        (PK.data.plan ? PK.data.plan.mhh : []).forEach((f) => {
          if (q(m[f.key])) lines.push('- ' + f.label + ' ' + q(m[f.key]));
        });
        lines.push('');
      }
    }

    lines.push('## Az új spotok formátuma', '', FORMAT, '');
    const ex = PK.store.spotById('B09');
    if (ex) {
      const clean = JSON.parse(JSON.stringify(ex));
      lines.push('Példa (egy beépített spot):', '', '```json', JSON.stringify(clean, null, 2), '```', '');
    }
    return lines.join('\n');
  }

  PK.report = { PROMPT, FORMAT, markdown };
})(typeof window !== 'undefined' ? window : globalThis);
