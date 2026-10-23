/* i-learn-poker — szituáció-bank: korai szakasz (mély stackek, 1–4. szint) */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.data = PK.data || {};
  const S = (PK.data.spots = PK.data.spots || []);

  S.push({
    id: 'A01',
    title: 'UTG A9o mély stackkel',
    stage: 'early',
    cats: ['PRE'],
    diff: 1,
    basis: 'gto',
    conf: 'high',
    ctx: { entrants: 70, left: 70, paid: 7, level: 2, blinds: '100/200', ante: 'BBA 200', avgBb: 150, note: 'Korai szakasz, mindenki mély.' },
    table: {
      players: 10,
      ante: 1,
      anteType: 'bba',
      stacks: { default: 150 },
      profiles: { BB: 'rec', SB: 'rec', BTN: 'reg' },
      hero: 'UTG',
      cards: ['Ac', '9d'],
      board: [],
      actions: [],
    },
    check: { pot: 2.5, toCall: 1 },
    q: 'Te nyitsz elsőként UTG-ről. Mit lépsz?',
    opts: [
      { id: 'fold', t: 'Fold', g: 'best' },
      { id: 'limp', t: 'Limp 1bb', g: 'blunder', why: 'Az UTG-limp feladja a kezdeményezést, és egy dominált kézzel hív be multiway potba. Árulkodó: „olcsón megnézem” gondolkodás.' },
      { id: 'o25', t: 'Open 2,5bb', g: 'minor', why: 'A méret rendben van, de a kéz nem fér bele a 10 fős UTG-range-be. Árulkodó: az ász önmagában még nem nyitóerő.' },
      { id: 'o3', t: 'Open 3bb', g: 'minor', why: 'Nagyobb méret egy olyan kézzel, amit nem is kellene nyitni — több pénzt teszel be dominált helyzetben.' },
    ],
    ans: 'Fold: az A9o nem fér bele a 10 fős asztal UTG-range-ébe.',
    exp:
      'Tíz fős asztalon UTG-ről kilenc játékos van mögötted, ezért a nyitási range szűk, nagyjából 9–11% (kb. 77+, ATs+, KJs+, QJs, AQo+). Az A9o-t mögötted a jobb ászok (AT–AK) dominálják: ha hívnak vagy 3-betelnek, gyakran rosszabb a kickered, és pozíción kívül játszol. Mélyen (150bb) a dominált ászokkal elvesztett nagy potok drágák.',
    mist: 'Az „ász van, megnézem” logika és a limp UTG-ről, ami multiway, pozíción kívüli potokhoz vezet.',
    factors: [
      { c: 'pos', t: 'UTG: 9 játékos van mögötted, a range kb. 9–11%.' },
      { c: 'dom', t: 'Az A9o-t a mögötted lévők jobb ászai dominálják (AT–AK).' },
      { c: 'stack', t: '150bb mélyen a dominált kezekkel elvesztett nagy potok sokba kerülnek.' },
    ],
    markers: [{ re: '\\basz(szal)? (van|mindig)', msg: 'Kéz-alapú gondolkodás: „ász van”.' }],
    src: '9 fős 100bb GTO RFI-chartok (UTG 9–12%) 10 fős asztalra szűkítve',
  });
})(typeof window !== 'undefined' ? window : globalThis);
