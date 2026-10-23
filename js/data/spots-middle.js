/* i-learn-poker — szituáció-bank: középső szakasz (big blind ante, 10–60bb) */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.data = PK.data || {};
  const S = (PK.data.spots = PK.data.spots || []);

  S.push({
    id: 'B03',
    title: 'BB K4o BTN min-raise ellen',
    stage: 'middle',
    cats: ['BBD'],
    diff: 2,
    basis: 'gto',
    conf: 'high',
    ctx: { entrants: 70, left: 35, paid: 7, level: 10, blinds: '1000/2000', ante: 'BBA 2000', avgBb: 40 },
    table: {
      players: 10,
      ante: 1,
      anteType: 'bba',
      stacks: { default: 40 },
      profiles: { BTN: 'reg' },
      reads: { BTN: 'Late pozícióból sokat nyit.' },
      hero: 'BB',
      cards: ['Kh', '4c'],
      board: [],
      actions: [['BTN', 'r', 2]],
    },
    check: { pot: 4.5, toCall: 1, needEq: 0.182 },
    q: 'A BTN 2bb-re nyit, az SB dob. Mit lépsz a BB-ből?',
    opts: [
      { id: 'fold', t: 'Fold', g: 'minor', why: 'Lapból döntöttél, nem árból: 1bb-ért 5,5bb-s potért játszol. Ha ez rendszeres, a BB-ből túl sokat dobsz, és a BTN ingyen lopja a vakjaidat.' },
      { id: 'call', t: 'Call 1bb', g: 'best' },
      { id: '3b', t: '3-bet 8bb-re', g: 'minor', why: 'A K4o túl gyenge value-nak és rossz bluff is: nincs blocker-értéke, és 40bb-n a 3-bet/fold sokat kockáztat.' },
      { id: 'jam', t: 'All-in 40bb', g: 'blunder', why: '40bb-t kockáztatsz 4,5bb-ért: ezt csak sokkal jobb kezek hívják. Árulkodó: „nem akarok postflop játszani”.' },
    ],
    ans: 'Call: 18,2% equity is elég, a K4o egy széles BTN-range ellen kb. 40%-os.',
    exp:
      'A BB ante miatt a potban már 4,5bb van (SB 0,5 + BB 1 + ante 1 + open 2). Neked 1bb a hívás, a végső pot 5,5bb, tehát 1 / 5,5 = 18,2% equity elég. A BTN egy laza regtől nagyjából a kezek 45–50%-át nyitja; ez ellen a K4o kb. 40%-os. A pozíción kívüli realizáció rontja ezt, de messze nem annyira, hogy fold legyen.',
    mist: 'A leggyakoribb BB-leak a „rossz a lapom” fold pot odds nélkül, illetve a túl kevés védekezés late pozíciós nyitások ellen.',
    factors: [
      { c: 'odds', t: '1bb hívás 5,5bb-s végső potért: 18,2% equity elég.' },
      { c: 'dead', t: 'A BB ante 1bb holt pénzt tesz a potba, ezért olcsó a védekezés.' },
      { c: 'range', t: 'A BTN-range széles (45–50%), a K4o ez ellen kb. 40%-os.' },
      { c: 'pos', t: 'BTN-open a BB ellen: a lopási range-ek ellen kell a legszélesebben védekezni.' },
    ],
    markers: [{ re: '\\b(rossz|szar|gyenge) (a )?lap', msg: '„Rossz a lapom” — pot odds nélkül.' }],
    src: 'BB ante-s pot odds számítás; MTT-s BB-védelmi solver-konszenzus (GTO Wizard, Upswing)',
  });

  S.push({
    id: 'B09',
    title: 'KJo 22bb-s reshove ellen',
    stage: 'middle',
    cats: ['PF', 'STK'],
    diff: 3,
    basis: 'gto',
    conf: 'med',
    ctx: { entrants: 70, left: 30, paid: 7, level: 11, blinds: '1200/2400', ante: 'BBA 2400', avgBb: 35 },
    table: {
      players: 10,
      ante: 1,
      anteType: 'bba',
      stacks: { default: 45, BB: 22 },
      profiles: { BB: 'reg' },
      reads: { BB: 'Ismert, tisztességes reg, nem mániákus.' },
      hero: 'CO',
      cards: ['Kc', 'Jd'],
      board: [],
      actions: [['CO', 'r', 2.2], ['BB', 'j']],
    },
    check: { pot: 24.7, toCall: 18.8, needEq: 0.432 },
    q: 'CO-ból 2,2bb-re nyitottál, a 22bb-s BB all-in. Mit lépsz?',
    opts: [
      { id: 'fold', t: 'Fold', g: 'best' },
      { id: 'call', t: 'Call 18,8bb', g: 'blunder', why: 'A már betett 2,2bb miatt hívnál (elsüllyedt költség), vagy nem gondoltad végig, milyen kezekkel reshove-ol egy reg 22bb-vel. A KJo ez ellen kb. 33%-os.' },
    ],
    ans: 'Fold: 43,2% equity kellene, a KJo egy tipikus 22bb-s reshove-range ellen kb. 33%-os.',
    exp:
      'A BB a vak és az ante után 20bb-vel tol, összesen 21bb-re. Neked 18,8bb a hívás, a végső pot 43,5bb, tehát 43,2% equity kell. Egy reg 22bb-vel CO-open ellen jellemzően 77+, ATs+, AJo+, KQs körüli kezekkel (plusz néhány suited ásszal) reshove-ol: ezek közül sok dominálja a KJo-t (AK, AJ, KQ), a párok pedig érmefeldobásnál jobbak. A KJo így kb. 33%-os, és egy szélesebb range (55+, A8s+, ATo+, KTs+, KQo, QJs) ellen is csak kb. 36%. A már betett 2,2bb nem számít, az már a poté.',
    mist: 'Tipikus hiba a „már beraktam, nem dobom el” logika, és hogy a reshove-ot automatikusan blöffnek nézzük.',
    factors: [
      { c: 'range', t: 'Egy 22bb-s reg reshove-range-e kb. 77+, ATs+, AJo+, KQs.' },
      { c: 'odds', t: '18,8bb hívás 43,5bb-s potért: 43,2% equity kell, a KJo kb. 33%.' },
      { c: 'dom', t: 'A KJo-t az AK, AJ és KQ dominálja.' },
      { c: 'stack', t: 'A hívás 45bb-s stacked több mint 40%-a.' },
    ],
    markers: [{ re: '\\bmar beraktam|\\bbenne van mar|\\bnem dobom el', msg: 'Elsüllyedt költség: a már betett 2,2bb nem ok a hívásra.' }],
    src: 'Pot odds számítás; 20–25bb-s reshove-range-ek (rangerpro, deepfold) és equity-becslés',
  });
})(typeof window !== 'undefined' ? window : globalThis);
