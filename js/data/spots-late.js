/* i-learn-poker — szituáció-bank: késői szakasz (buborék) és döntőasztal.
 * Az ICM-számok feltételezett kifizetéssel készültek (a Duna táblája nem nyilvános):
 * 7 hely: 32 / 21 / 15 / 11 / 8,5 / 7 / 5,5% · 11 hely: 27 / 18 / 12,5 / 9,5 / 7,5 / 6 / 5 / 4,2 / 3,6 / 3,4 / 3,3%.
 */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.data = PK.data || {};
  const S = (PK.data.spots = PK.data.spots || []);

  const PAY7 = 'Feltételezett kifizetés (a Duna táblája nem nyilvános): 32 / 21 / 15 / 11 / 8,5 / 7 / 5,5% a díjalapból.';

  S.push({
    id: 'C01',
    title: 'Buborék: KJo a chip leader jamje ellen',
    stage: 'bubble',
    cats: ['ICM', 'PF'],
    diff: 4,
    basis: 'icm',
    conf: 'high',
    ctx: { entrants: 70, left: 8, paid: 7, level: 18, blinds: '6000/12000', ante: 'BBA 12000', avgBb: 22, note: 'Pénzbuborék: 8 bent, 7 fizet. ' + PAY7 },
    scene: 'A buborékon a chip leader minden második kezét tolja. Az UTG-nek 4bb maradt, a következő kézben ő lesz a BB.',
    table: {
      players: 8,
      ante: 1,
      anteType: 'bba',
      stacks: { UTG: 4, 'UTG+1': 26, LJ: 24, HJ: 20, CO: 22, BTN: 45, SB: 17, BB: 18 },
      profiles: { BTN: 'cl' },
      reads: { BTN: 'Kihasználja a buborékot, nagyon szélesen tol.' },
      hero: 'BB',
      cards: ['Kh', 'Jc'],
      board: [],
      actions: [['BTN', 'j']],
    },
    check: { toCall: 16, needEq: 0.451, eff: 17 },
    q: 'Mindenki dob a 45bb-s chip leaderig, aki all-in; az SB dob. Mit lépsz a BB-ből?',
    opts: [
      { id: 'call', t: 'Call 16bb', g: 'blunder', why: 'ChipEV-ben döntöttél: a 45,1%-os pot oddsot nézted, a buborékot nem. Árulkodó: „széles a range-e, megvan az odds, hívom”.' },
      { id: 'fold', t: 'Fold', g: 'best' },
    ],
    ans: 'Fold: a buborékon 68,4% equity kellene, a KJo még a CL any two range-e ellen is csak kb. 61%-os.',
    exp:
      'ChipEV-ben 16bb-t hívsz egy 35,5bb-s potért, ehhez 45,1% elég, és a KJo egy széles CL-range ellen (a kezek kb. 70%-a) 58%-os, any two ellen 60,6%-os — chipEV-ben tehát hívás. A buborékon viszont a zsetonok nem egyformán érnek: ha veszítesz, 0-val kiesel, ha nyersz, a várható pénzed csak kb. 46%-kal nő (a díjalap 11,3%-áról 16,5%-ára). Az ICM-számítás (feltételezett kifizetéssel) ezért 68,4% equityt kér, a risk premium 23,3%; ráadásul a 4bb-s UTG a következő kézben a BB-ben lesz. Ilyen nyomás alatt egy széles range ellen is csak kb. TT+ hív, és még az AK is határeset (65–67%).',
    mist: 'A leggyakoribb buborékhiba a chipEV-hívás („széles a range-e, megvan az odds”). A másik véglet, ha a nagy stack lopásait mindig elengeded: a TT+ itt is hívás.',
    factors: [
      { c: 'icm', t: 'Pénzbuborék (8 bent, 7 fizet): a modell szerint 68,4% equity kell, chipEV-ben csak 45,1% — a risk premium 23,3%.' },
      { c: 'range', t: 'A CL a buborékon nagyon szélesen tol; a KJo a kezek 70%-a ellen kb. 58%, any two ellen 60,6%.' },
      { c: 'stack', t: 'A 45bb-s CL fedez: ha veszítesz, kiesel, és 0-t kapsz.', kw: ['fedez', 'kiesek'] },
      { c: 'icm', t: 'A 4bb-s UTG a következő kézben a BB-ben lesz: ha most dobsz, valószínűleg ő esik ki elsőként.', kw: ['\\b4 ?bb', 'mikro', 'legrovidebb'] },
      { c: 'odds', t: '16bb hívás 35,5bb-s végső potért: chipEV-ben 45,1% elég — ezért csábító a hívás.' },
    ],
    markers: [{ re: '\\b(megvan|jo|eleg) (az )?(pot ?odds|odds|ar)\\b', msg: 'Pot odds ICM nélkül: a buborékon a chipEV-küszöb (45%) nem elég.' }],
    src: 'ICM-számítás (Malmuth–Harville) feltételezett 7 helyes kifizetéssel (PK.icm.callAllIn) + Monte Carlo equity; GTO Wizard: Money Bubble vs Final Table Bubble',
  });

  S.push({
    id: 'C03',
    title: 'QQ a buborékon, CO-jam ellen',
    stage: 'bubble',
    cats: ['ICM', 'PF'],
    diff: 2,
    basis: 'icm',
    conf: 'high',
    ctx: { entrants: 70, left: 8, paid: 7, level: 18, blinds: '6000/12000', ante: 'BBA 12000', avgBb: 22, note: 'Pénzbuborék: 8 bent, 7 fizet. ' + PAY7 },
    table: {
      players: 8,
      ante: 1,
      anteType: 'bba',
      stacks: { UTG: 22, 'UTG+1': 23, LJ: 25, HJ: 24, CO: 25, BTN: 21, SB: 16, BB: 20 },
      profiles: { CO: 'lag' },
      reads: { CO: 'Agresszív reg, a buborékon sokat tol.' },
      hero: 'BB',
      cards: ['Qd', 'Qc'],
      board: [],
      actions: [['CO', 'j']],
    },
    check: { toCall: 18, needEq: 0.456, eff: 19 },
    q: 'A 25bb-s CO all-in, a BTN és az SB dob. Mit lépsz a BB-ből?',
    opts: [
      { id: 'call', t: 'Call 18bb', g: 'best' },
      { id: 'fold', t: 'Fold', g: 'blunder', why: 'Túlbecsülted az ICM-et: a buborék-félelem a prémium kezeket is elvitte. Árulkodó: „nem akarok buborékolni”.' },
    ],
    ans: 'Call: az ICM 64,4%-ot kér, a QQ egy reális CO-jam range ellen kb. 70%-os.',
    exp:
      'ChipEV-ben 18bb-t hívsz egy 39,5bb-s potért, ez 45,6%. A buborék miatt az ICM-számítás (feltételezett kifizetéssel) 64,4%-ot kér, a risk premium kb. 19% — ez szigorú küszöb. Egy agresszív reg 25bb-s CO-jamje ellen (pl. 22+, A2s+, A8o+, K9s+, KTo+, Q9s+, QJo, J9s+, T9s) a QQ mégis 70,4%-os, és egy szűkebb, 13%-os range ellen (33+, A7s+, ATo+, KTs+, KQo, QJs) is 68%. Csak egy nagyon szűk range ellen (77+, ATs+, AQo+) csúszna a küszöb alá (62,7%), de ilyen szűken egy agresszív reg nem tol 25bb-t a buborékon.',
    mist: 'Tipikus hiba, hogy a buborékon a prémium kezeket is eldobjuk („nem akarok buborékolni”). Az ICM szűkíti a hívási range-et, de a QQ+ ezen a stackmélységen hívás.',
    factors: [
      { c: 'icm', t: 'A buborékon 64,4% equity kell (chipEV-ben 45,6%): a risk premium kb. 19%.' },
      { c: 'range', t: 'Egy agresszív reg 25bb-s CO-jamje a buborékon széles (kb. 20%); a QQ ez ellen 70%-os.' },
      { c: 'odds', t: '18bb hívás 39,5bb-s végső potért: chipEV-ben 45,6% kell.' },
      { c: 'stack', t: 'A CO 25bb-vel fedez: ha veszítesz, kiesel — ezért magasabb a küszöb, de a QQ így is fölötte van.', kw: ['fedez'] },
    ],
    markers: [{ re: '\\bnem (akarok|szeretnek) (kiesni|buborekolni)|\\bbiztosra megyek', msg: 'Buborék-félelem: a QQ itt is hívás.' }],
    src: 'ICM-számítás (Malmuth–Harville) feltételezett 7 helyes kifizetéssel (PK.icm.callAllIn) + Monte Carlo equity',
  });

  S.push({
    id: 'C05',
    title: 'Bubble factorból risk premium',
    stage: 'bubble',
    cats: ['ICM'],
    diff: 4,
    basis: 'concept',
    conf: 'high',
    ctx: { entrants: 70, left: 8, paid: 7, level: 18, blinds: '6000/12000', ante: 'BBA 12000', avgBb: 22, note: 'Elméleti kérdés; a példa a GTO Wizard „Money Bubble vs Final Table Bubble” cikkéből való.' },
    scene:
      'A pénzbuborékon ülsz 9bb-vel a BTN-on. Egy ICM-kalkulátor szerint a bubble factorod (BF) egy nagyobb stack ellen 2,06: ha ellene kiesel, 2,06-szor annyit veszítesz, mint amennyit egy megnyert all-innel nyernél.',
    q: 'Mennyivel több equity kell egy egyenlő tétes all-in híváshoz, mint chipEV-ben (50%)?',
    opts: [
      { id: 'a', t: 'Kb. 5%-kal több', g: 'blunder', why: 'Alábecsülöd az ICM-et, mintha a BF 1 körül lenne. Árulkodó: „egy kicsit szűkebben hívok”.' },
      { id: 'b', t: 'Kb. 10%-kal több', g: 'minor', why: 'Jó az irány, de nem a képletből számolsz: a BF 2,06 jóval nagyobb nyomás, mint amit a +10% jelent.' },
      { id: 'c', t: 'Kb. 17%-kal több', g: 'best' },
      { id: 'd', t: 'Kb. 30%-kal több', g: 'minor', why: 'Túlbecsülöd: valószínűleg az 1/(1+BF) = 32,7%-ot vetted extra equitynek. A küszöb BF/(1+BF) = 67,3%.' },
    ],
    ans: 'Kb. 17%-kal több: BF/(1+BF) = 2,06/3,06 = 67,3% kell az 50% helyett.',
    exp:
      'A bubble factor azt mondja meg, hányszor fáj jobban a vesztés, mint amennyit a nyerés hoz. Egyenlő tétes all-innél a szükséges equity BF/(1+BF), itt 2,06/3,06 = 67,3%. ChipEV-ben 50% elég lenne, a különbség, 17,3% a risk premium. Ezért a 9bb-s stack a pénzbuborékon egy coinflipet sem hívhat, és az erős kezek egy részét is el kell dobnia.',
    mist: 'Tipikus hiba, hogy a buborék csak „egy kicsit szűkebb” hívást jelent. A BF 2 körül már kétharmados equityt kér.',
    factors: [
      { c: 'math', t: 'Szükséges equity = BF / (1 + BF) = 2,06 / 3,06 = 67,3%.', kw: ['67', '2,06', '3,06'] },
      { c: 'icm', t: 'Risk premium = 67,3% − 50% = 17,3%: ennyivel több equity kell, mint chipEV-ben.' },
      { c: 'stack', t: 'A pénzbuborékon a rövid stackek a legnyomottabbak: kiesve semmit nem visznek, a min-cash egy kiesésnyire van.' },
      { c: 'odds', t: 'Egyenlő tétes all-innél chipEV-ben 50% elég — ehhez képest kell a többlet.' },
    ],
    src: 'GTO Wizard: Money Bubble vs Final Table Bubble (BF 2,06 → +17,3%); képlet: szükséges equity = BF / (1 + BF)',
  });

  S.push({
    id: 'C09',
    title: '110 nevező, 11 fizet, 12 bent',
    stage: 'bubble',
    cats: ['ICM'],
    diff: 3,
    basis: 'concept',
    conf: 'high',
    ctx: {
      entrants: 110,
      left: 12,
      paid: 11,
      level: 18,
      blinds: '6000/12000',
      ante: 'BBA 12000',
      avgBb: 22,
      note: 'Elméleti kérdés. Feltételezett 11 helyes kifizetés: 27 / 18 / 12,5 / 9,5 / 7,5 / 6 / 5 / 4,2 / 3,6 / 3,4 / 3,3% a díjalapból.',
    },
    scene: 'Egy nagyobb versenyen 110-en neveztetek, 11 hely fizet. Tizenketten maradtatok két asztalon: egy kiesés a pénzig, kettő a 10 fős döntőig.',
    q: 'Melyik állítás igaz erre a buborékra?',
    opts: [
      { id: 'big', t: 'Olyan, mint egy nagy mezőny pénzbuboréka: főleg a rövid stackek vannak nyomás alatt', g: 'minor', why: 'Nagy mezőnyben a min-cash után még sokáig kicsik a lépcsők, ott tényleg a rövid stackek a legnyomottabbak. Itt a min-cash (3,3%) után rögtön nagy pay jumpok jönnek, így a közepes stackek is erősen nyomottak.' },
      { id: 'ft', t: 'Inkább döntő-buborék: a közepes stackek a legnyomottabbak, a legrövidebbek kevésbé', g: 'best' },
      { id: 'none', t: 'Nincs igazi ICM: a min-cash olyan kicsi, hogy chipEV-ben érdemes játszani', g: 'blunder', why: 'A 12. hely 0-t ér, a 11. 3,3%-ot, és innen meredek lépcsők jönnek: az ICM itt az egyik legerősebb. Árulkodó: „a min-cash úgyis kevés”.' },
    ],
    ans: 'Döntő-buborék dinamika: kis mezőnyben a pénzbuborék a döntő-buborékra hasonlít, a közepes stackek a legnyomottabbak.',
    exp:
      'A GTO Wizard elemzése szerint kis mezőnyben a pénzbuborék a döntő-buborékra hasonlít, mert a pénzhelyek után rögtön a nagy pay jumpok jönnek. A feltételezett kifizetéssel számolva egy 4bb-s stack bubble factora az 58bb-s chip leader ellen 1,61, egy 14bb-sé 2,38, egy 30bb-sé 2,53: itt nem a legrövidebb stack a legnyomottabb, hanem a közepesek. A rövid stack ezért viszonylag bátrabban tolhat, a közepeseknek viszont nagyon szűken kell hívniuk — ellenük lehet lopni.',
    mist: 'Tipikus hiba, hogy a kis versenyek buborékát egy nagy online verseny buborékaként kezeljük: ott a rövid stack a legnyomottabb, itt inkább a közepes.',
    factors: [
      { c: 'icm', t: 'Kis mezőnyben a pénzhelyek után rögtön nagy pay jumpok jönnek: a buborék a döntő-buborékra hasonlít.' },
      { c: 'math', t: 'Feltételezett kifizetéssel a CL ellen: 4bb-s stack BF 1,61, 14bb-s 2,38, 30bb-s 2,53.', kw: ['bubble factor', '\\bbf\\b'] },
      { c: 'stack', t: 'A közepes stackek a legnyomottabbak: nekik kell a legszűkebben hívniuk.' },
      { c: 'fe', t: 'A közepes stackek ellen nagy a fold equity: ők nem tudnak tágan védekezni.' },
    ],
    markers: [{ re: '\\bmin-? ?cash (ugyis |ugy is )?(keves|kicsi|semmi)', msg: '„A min-cash úgyis kevés” — a buborékon a kiesés 0-t ér.' }],
    src: 'GTO Wizard: Money Bubble vs Final Table Bubble; ICM-számítás (Malmuth–Harville) feltételezett 11 helyes kifizetéssel',
  });

  S.push({
    id: 'C10',
    title: '5. óra, robotpilóta',
    stage: 'bubble',
    cats: ['MEN'],
    diff: 1,
    basis: 'mental',
    conf: 'high',
    ctx: { entrants: 70, left: 10, paid: 7, level: 17, blinds: '5000/10000', ante: 'BBA 10000', avgBb: 21, note: 'Az ötödik órában jársz, közeledik a buborék. A szünet kb. 30 perc múlva jön.' },
    scene: 'Rájössz, hogy nem emlékszel az előző három kézre: ki nyitott, mit dobtál és miért. A döntéseid egyre gyorsabbak, és „csak megy”.',
    q: 'Mit csinálsz?',
    opts: [
      { id: 'push', t: 'Folytatod, majd jobban figyelsz', g: 'minor', why: 'A fáradt figyelem akaratból nem jön vissza. Árulkodó: „majd jobban figyelek”, miközben egyre rövidebbek a döntési idők.' },
      { id: 'nit', t: 'A szünetig mindent eldobsz, ami nem prémium', g: 'minor', why: 'A robotpilóta foldolva is drága: a buborékon kihagyod a lopásokat és a vakvédelmet. Ez nem reset, csak elhalasztott probléma.' },
      { id: 'reset', t: 'Reset: a BB-d után kihagysz néhány kezet — víz, séta, 3 fókuszpont, aztán vissza', g: 'best' },
    ],
    ans: 'Reset: állj fel a BB-d után (vagy a szünetben), igyál vizet, sétálj, és válassz 3 fókuszpontot a következő órára.',
    exp:
      'Ha nem emlékszel az előző kezekre, a figyelmed elfáradt — ez akaratból nem javul, csak szünettel. A legolcsóbb reset a BB-d után: a következő 6–8 kézben nem vagy vakban, így a kihagyásuk zsetonba nem kerül, csak lehetőségbe. Igyál vizet, sétálj egyet, és válassz 3 fókuszpontot (pl. a stackek bb-ben, ki a legrövidebb, ki lop sokat). A buborékon egyetlen figyelmetlen hívás többe kerülhet, mint egy teljes kihagyott orbit (SB + BB + BB ante = 2,5bb).',
    mist: 'A fáradtság jele nem az, hogy rosszul érzed magad, hanem hogy rövidülnek a döntési idők, és a döntéseidből kimarad a stack, a pozíció és az ellenfél.',
    factors: [
      { c: 'tilt', t: 'Nem emlékszel az előző 3 kézre: a figyelmed elfáradt, reset kell.' },
      { c: 'plan', t: 'Terv: a BB-d után állj fel — a következő 6–8 kéz kihagyása zsetonba nem kerül.' },
      { c: 'icm', t: 'A buborékon a legdrágább egy figyelmetlen döntés: a kiesés itt 0-t ér.' },
      { c: 'stack', t: 'Egy teljes kihagyott orbit 2,5bb (SB + BB + BB ante): 21bb-ből ez is olcsóbb, mint egy robotpilóta-hiba.' },
    ],
    markers: [{ re: '\\bmajd (jobban )?figyelek|\\bcsak (nyomom|megyek tovabb|jatszom tovabb)|\\bnem emlekszem', msg: 'Robotpilóta-jel: a figyelem nem jön vissza akaratból — reset kell.' }],
    src: 'Mentális játék: edzői konszenzus (figyelem, fáradtság, reset-rutin); nem solver- vagy kutatási eredmény',
  });

  S.push({
    id: 'C11',
    title: 'Szatellit-buborék: AA fold',
    stage: 'bubble',
    cats: ['ICM'],
    diff: 4,
    basis: 'icm',
    conf: 'high',
    ctx: {
      entrants: 30,
      left: 4,
      paid: 3,
      level: 12,
      blinds: '2000/4000',
      ante: 'BBA 4000',
      avgBb: 18.75,
      note: 'Csütörtöki 2 500 Ft-os szatellit: 3 db 25 000 Ft-os belépő a tét, a 4. hely semmit nem ér. A nevezők száma és a struktúra feltételezett.',
    },
    scene: 'Négyen maradtatok, 3 egyforma jegy jár. Te és a BTN messze vezettek, a CO-nak 5bb, az SB-nek 4bb maradt. A BTN, a másik nagy stack, rád tol.',
    table: {
      players: 4,
      ante: 1,
      anteType: 'bba',
      stacks: { CO: 5, BTN: 34, SB: 4, BB: 32 },
      profiles: { BTN: 'rec' },
      reads: { BTN: 'Úgy játszik, mintha rendes verseny lenne.' },
      hero: 'BB',
      cards: ['Ah', 'Ad'],
      board: [],
      actions: [['BTN', 'j']],
    },
    check: { toCall: 30, needEq: 0.472, eff: 31 },
    q: 'A CO dob, a BTN all-in, az SB dob. Mit lépsz a BB-ből?',
    opts: [
      { id: 'call', t: 'Call 30bb', g: 'blunder', why: 'A kéz erejéből döntöttél, nem abból, mit ér a jegy. Árulkodó: „AA-t nem dobok el”. A szatelliten a 3. jegy ugyanannyit ér, mint az 1.' },
      { id: 'fold', t: 'Fold', g: 'best' },
    ],
    ans: 'Fold: foldolva a jegy kb. 97,6%-ban a tiéd, a híváshoz 97,7% equity kellene — az AA csak kb. 85%-os.',
    exp:
      'Szatelliten minden jegy ugyanannyit ér, ezért a plusz zseton szinte semmit nem ad: ha nyersz, a jegyesélyed 97,6%-ról csak 99,9%-ra nő, ha veszítesz, kiesel, és semmit nem kapsz. Az ICM-számítás szerint így 97,7% equity kellene a híváshoz (chipEV-ben 47,2% lenne). Az AA még any two ellen is csak kb. 85%-os, a hívás tehát kb. 0,12 jegyet, azaz kb. 3 100 Ft-ot veszít. Dobj, és hagyd, hogy az 5bb-s és a 4bb-s stack essen ki.',
    mist: 'Klasszikus hiba a „rendes verseny” logika. A szatellit-buborékon nem a kéz ereje számít, hanem az, hogy mennyire biztos már a jegyed; a nagy stackek itt nem ütköznek egymással.',
    factors: [
      { c: 'icm', t: 'Szatelliten minden jegy ugyanannyit ér: nyerve a jegyesélyed csak 97,6%-ról 99,9%-ra nő, vesztve 0.' },
      { c: 'math', t: 'A híváshoz 97,7% equity kellene; az AA any two ellen is csak kb. 85%-os.' },
      { c: 'stack', t: 'Két mikrostack (5bb és 4bb) van, a vakok őket is viszik: nekik kell kiesniük, nem neked.', kw: ['mikro', 'rovid'] },
      { c: 'range', t: 'Nem a BTN range-én múlik: a legrosszabb kéz (pl. 72o) ellen is csak kb. 88% az AA.' },
    ],
    markers: [{ re: '\\b(aa-?t|aszpart|ket aszt) (soha )?nem (dob|fold)', msg: '„AA-t nem dobok el” — a szatelliten a jegy értéke dönt, nem a kéz ereje.' }],
    src: 'ICM-számítás (Malmuth–Harville, 3 egyforma jegy: [1, 1, 1, 0]) + Monte Carlo equity; a szatellit-stratégia alapelve (Dara O’Kearney – Barry Carter: Poker Satellite Strategy)',
  });

  S.push({
    id: 'D02',
    title: 'Közepes stack a CL SB-jamje ellen',
    stage: 'ft',
    cats: ['FT', 'ICM'],
    diff: 5,
    basis: 'icm',
    conf: 'med',
    ctx: { entrants: 70, left: 7, paid: 7, level: 18, blinds: '6000/12000', ante: 'BBA 12000', avgBb: 25, note: 'Döntőasztal, mindenki pénzben. ' + PAY7 },
    scene: 'A döntőn két rövid stack van: az UTG-nek 6bb, a HJ-nek 8bb maradt. A chip leader a rövid stackek miatt mindenkit nyom.',
    table: {
      players: 7,
      ante: 1,
      anteType: 'bba',
      stacks: { UTG: 6, LJ: 24, HJ: 8, CO: 28, BTN: 24, SB: 60, BB: 25 },
      profiles: { SB: 'cl' },
      reads: { SB: 'A BB ellen szinte bármivel tol.' },
      hero: 'BB',
      cards: ['Ks', 'Qd'],
      board: [],
      actions: [['SB', 'j']],
    },
    check: { toCall: 23, needEq: 0.469, eff: 24 },
    q: 'Mindenki dob a 60bb-s chip leaderig, aki az SB-ből all-in. Mit lépsz a BB-ből?',
    opts: [
      { id: 'call', t: 'Call 23bb', g: 'minor', why: 'Pot oddsból hívtál, a pay jumpokat nem árazd be. Árulkodó: „KQ erős kéz, és bármivel tol”.' },
      { id: 'fold', t: 'Fold', g: 'best' },
    ],
    ans: 'Fold: a döntőn 64,7% equity kell, a KQo a CL széles range-e ellen is csak kb. 56–61%-os.',
    exp:
      'ChipEV-ben 23bb-t hívsz egy 49bb-s potért, ehhez 46,9% elég, és a KQo a CL széles range-e ellen (a kezek 50–70%-a) 56–60%-os, any two ellen 61%-os — chipEV-ben hívás. A döntőn viszont a CL fedez: ha veszítesz, a 7. hely díjával kiesel, miközben a 6bb-s és a 8bb-s stack kiesése két pay jumpot hozna neked. Az ICM-számítás (feltételezett kifizetéssel) ezért 64,7%-ot kér, a risk premium kb. 18%. Ezt a KQo semmilyen reális range ellen nem éri el: széles range ellen kb. TT+, AQs+, AKo hív (any two ellen 77+, AJs+, AKo).',
    mist: 'Tipikus hiba, hogy a döntőn a chip leader széles range-e miatt „jó” kezekkel hívunk, és közben elfelejtjük a két rövid stack kiesését.',
    factors: [
      { c: 'icm', t: 'A döntőn 64,7% equity kell a híváshoz (chipEV-ben 46,9%): a risk premium kb. 18%.' },
      { c: 'range', t: 'A CL SB-ből szinte bármivel tol; a KQo a kezek 50–70%-a ellen 56–60%, any two ellen 61%.' },
      { c: 'stack', t: 'A 60bb-s CL fedez: ha veszítesz, a 7. hely díjával kiesel.', kw: ['fedez'] },
      { c: 'icm', t: 'Két rövid stack (6bb és 8bb) van: ha kivárod a kiesésüket, két pay jumpot kapsz.', kw: ['rovid', '\\b[68] ?bb', 'pay ?jump', 'ladder'] },
      { c: 'odds', t: '23bb hívás 49bb-s végső potért: chipEV-ben 46,9% elég.' },
    ],
    markers: [{ re: '\\b(megvan|jo|eleg) (az )?(pot ?odds|odds|ar)\\b|\\bbarmivel tol', msg: 'ChipEV-gondolkodás a döntőn: a pot odds és a széles range egyedül nem elég.' }],
    src: 'ICM-számítás (Malmuth–Harville) feltételezett 7 helyes kifizetéssel (PK.icm.callAllIn) + Monte Carlo equity; GTO Wizard: Money Bubble vs Final Table Bubble',
  });

  S.push({
    id: 'D03',
    title: 'Deal hárman: chip chop vagy ICM?',
    stage: 'ft',
    cats: ['FT'],
    diff: 4,
    basis: 'math',
    conf: 'high',
    ctx: { entrants: 70, left: 3, paid: 7, level: 23, blinds: '20000/40000', ante: 'BBA 40000', avgBb: 17.5, note: 'Elméleti példa kerek díjakkal: a még kiosztandó díjak 400 000 / 250 000 / 150 000 Ft.' },
    scene: 'Hárman maradtatok. A zsetonok aránya: A 50%, B 30%, te (C) 20% — kb. 26bb, 16bb és 10,5bb. A chip leader dealt ajánl, két változat van az asztalon.',
    q: 'Te vagy a legrövidebb stack (C). Melyik változatot választod?',
    opts: [
      { id: 'chop', t: 'Chip chop: mindenki 150 000 Ft, a maradék 350 000 zsetonarányosan (neked 220 000 Ft)', g: 'minor', why: 'A chip chop a nagy stacknek kedvez, a rövid stacktől visz el pénzt. Árulkodó: „a chip chop a fair, mindenki a zsetonja szerint kap”.' },
      { id: 'icm', t: 'ICM-deal (neked kb. 228 600 Ft)', g: 'best' },
      { id: 'play', t: 'Nincs deal, játszunk tovább', g: 'good', why: 'Nem hiba, ha erősebbnek érzed magad a többieknél: az ICM-deal a mostani várható értéked, játékkal ugyanezt kapod szórással, plusz a képességelőnyöd. Ha csak a szórástól tartasz, a deal a jobb.' },
    ],
    ans: 'ICM-deal: kb. 228 600 Ft-ot ad, a chip chop csak 220 000 Ft-ot — 8 571 Ft-ot hagynál az asztalon.',
    exp:
      'A chip chop úgy számol, mintha a zseton egyenesen arányosan érne pénzt, pedig a rövid stack zsetonjai többet érnek: a 3. díj (150 000 Ft) már biztos, és onnan csak feljebb léphetsz. Az ICM (Malmuth–Harville) szerint A kb. 308 900, B 262 500, te 228 600 Ft-ot érsz; chip choppal A 325 000, B 255 000, te 220 000 Ft-ot kapnál. A chip chop tehát kb. 16 100 Ft-ot visz át a chip leaderhez, ebből 8 571 Ft a tiéd. Rövid stackként ICM-dealt kérj; ha nem fogadják el, a továbbjátszás sem hiba.',
    mist: 'A leggyakoribb tévhit, hogy a chip chop „igazságos”. A chip leadernek kedvez, a rövid stacknek mindig rosszabb, mint az ICM.',
    factors: [
      { c: 'math', t: 'ICM: A 308 900, B 262 500, C 228 600 Ft; chip chop: 325 000 / 255 000 / 220 000 Ft.', kw: ['228', '220', '8 ?5\\d\\d'] },
      { c: 'icm', t: 'A rövid stack zsetonjai többet érnek a zsetonaránynál: a 3. díj már biztos.' },
      { c: 'stack', t: 'Te 20%-kal (kb. 10,5bb) a legrövidebb vagy: a chip chop tőled visz el a legtöbbet (8 571 Ft).' },
      { c: 'profile', t: 'Továbbjátszani csak akkor éri meg, ha erősebb vagy a többieknél — ez az egyetlen érv a deal ellen.' },
    ],
    markers: [{ re: '\\bzsetonaranyos(an)? (a )?(fair|igazsagos)|\\bmindenki a zsetonja szerint', msg: '„Mindenki a zsetonja szerint” — a zseton nem egyenesen arányosan ér pénzt.' }],
    src: 'ICM-számítás (Malmuth–Harville, PK.icm.deals); chip chop: a legkisebb díj mindenkinek, a maradék zsetonarányosan',
  });
})(typeof window !== 'undefined' ? window : globalThis);
