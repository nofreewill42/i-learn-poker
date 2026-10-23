/* i-learn-poker — póker-asztal SVG-ben (a hős mindig alul) */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.ui = PK.ui || {};
  const esc = (s) => PK.util.esc(s);

  const W = 400;
  const H = 262;
  const CX = 200;
  const CY = 130;

  function cardSvg(card, x, y) {
    const p = PK.cards.parse(card);
    if (!p) return '';
    const sym = PK.cards.SUIT_SYM[p.s];
    return (
      '<g class="bcard" transform="translate(' + x + ' ' + y + ')">' +
      '<rect width="28" height="38" rx="4"/>' +
      '<text class="r s-' + p.s + '" x="14" y="17" text-anchor="middle">' + esc(PK.cards.rankLabel(p.r)) + '</text>' +
      '<text class="s s-' + p.s + '" x="14" y="33" text-anchor="middle">' + sym + '</text>' +
      '</g>'
    );
  }

  /** st: PK.spot.simulate eredménye; spot.table a profilokhoz */
  function render(spot, st) {
    const t = spot.table;
    const n = st.order.length;
    const heroIdx = st.order.indexOf(t.hero);
    const U = PK.util;
    let out = '<svg class="ptable" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(describe(spot, st)) + '">';
    out += '<ellipse class="rail" cx="' + CX + '" cy="' + CY + '" rx="170" ry="100"/>';
    out += '<ellipse class="felt" cx="' + CX + '" cy="' + CY + '" rx="158" ry="88"/>';
    out += '<ellipse class="felt-line" cx="' + CX + '" cy="' + CY + '" rx="128" ry="64"/>';

    // board és pot
    const board = t.board || [];
    if (board.length) {
      const total = board.length * 28 + (board.length - 1) * 5;
      let x = CX - total / 2;
      board.forEach((c) => {
        out += cardSvg(c, x, CY - 12);
        x += 33;
      });
      out += '<text class="pot" x="' + CX + '" y="' + (CY - 22) + '" text-anchor="middle">Pot ' + esc(U.bb(st.pot)) + '</text>';
    } else {
      out += '<text class="pot" x="' + CX + '" y="' + (CY + 2) + '" text-anchor="middle">Pot ' + esc(U.bb(st.pot)) + '</text>';
      out += '<text class="street" x="' + CX + '" y="' + (CY + 18) + '" text-anchor="middle">preflop</text>';
    }

    // székek
    const seatsSvg = [];
    const betsSvg = [];
    st.order.forEach((pos, i) => {
      const k = (i - heroIdx + n) % n;
      const ang = ((90 + (k * 360) / n) * Math.PI) / 180;
      const sx = CX + 160 * Math.cos(ang);
      const sy = CY + 104 * Math.sin(ang);
      const seat = st.seats[i];
      const prof = seat.profile && PK.spot.PROFILE[seat.profile] ? PK.spot.PROFILE[seat.profile].short : '';
      const cls = ['seat', seat.hero ? 'is-hero' : '', seat.folded ? 'is-folded' : '', seat.allin ? 'is-allin' : ''].join(' ');
      const behind = seat.allin ? 'all-in' : U.bb(seat.stack);
      let g1 = '<g class="' + cls + '" transform="translate(' + (sx - 38).toFixed(1) + ' ' + (sy - 19).toFixed(1) + ')">';
      g1 += '<rect width="76" height="38" rx="9"/>';
      g1 += '<text class="pos" x="8" y="15">' + esc(pos) + '</text>';
      if (prof) g1 += '<text class="prof" x="68" y="15" text-anchor="end">' + esc(prof) + '</text>';
      g1 += '<text class="stk" x="8" y="31">' + esc(behind) + '</text>';
      if (seat.folded && !seat.hero) g1 += '<text class="act" x="68" y="31" text-anchor="end">fold</text>';
      g1 += '</g>';
      seatsSvg.push(g1);

      const committed = seat.inStreet;
      if (committed > 0.001) {
        const bx = sx + (CX - sx) * 0.5;
        const by = sy + (CY - sy) * 0.52;
        betsSvg.push(
          '<g class="bet"><circle cx="' + (bx - 16).toFixed(1) + '" cy="' + by.toFixed(1) + '" r="6"/>' +
            '<text x="' + (bx - 7).toFixed(1) + '" y="' + (by + 4.5).toFixed(1) + '">' + esc(U.bb(committed)) + '</text></g>',
        );
      }
      if (pos === 'BTN' || (n === 2 && pos === 'SB')) {
        const dx = sx + (CX - sx) * 0.3 + (sx < CX ? 14 : -14);
        const dy = sy + (CY - sy) * 0.3 + (sy > CY ? -2 : 6);
        betsSvg.push('<g class="dealer"><circle cx="' + dx.toFixed(1) + '" cy="' + dy.toFixed(1) + '" r="8"/><text x="' + dx.toFixed(1) + '" y="' + (dy + 3.5).toFixed(1) + '" text-anchor="middle">D</text></g>');
      }
    });
    out += betsSvg.join('') + seatsSvg.join('');
    out += '</svg>';
    return out;
  }

  function describe(spot, st) {
    const t = spot.table;
    const U = PK.util;
    const parts = [st.order.length + ' fős asztal', 'te: ' + t.hero + ', ' + U.bb(st.hero.stack + st.hero.inStreet) + ', lapjaid ' + PK.cards.text(t.cards)];
    if ((t.board || []).length) parts.push('board: ' + PK.cards.text(t.board));
    parts.push('pot ' + U.bb(st.pot));
    return parts.join('; ');
  }

  PK.ui.table = { render, describe };
})(typeof window !== 'undefined' ? window : globalThis);
