/* i-learn-poker — Tudástár: technika-katalógus (34 elem) és leak-taxonómia (13 kategória).
 *
 * A számok és a források a kutatási jegyzetből jönnek. Ahol egy állítás feltevés vagy közelítés,
 * ott a szöveg is ezt mondja. A részletes chartok (RFI, 10bb push/fold, 20bb reshove) a charts.js-ben vannak.
 */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.data = PK.data || {};

  PK.data.techniques = [
    // ---------------------------------------------------------------- C1. 10 fős asztal és preflop
    {
      id: 't01',
      topic: 'preflop',
      title: 'Pozíciók a 10 fős asztalnál',
      what:
        'Tíz fős asztalon a sorrend: UTG, UTG+1, UTG+2, MP, LJ, HJ, CO, BTN, SB, BB. A 9 fős chartokhoz képest egy plusz korai szék van, ezért minden korai pozíció egy fokkal szűkebb. UTG-ről kilenc játékos ül mögötted, és bármelyiküknél lehet erős kéz.',
      when: 'Minden preflop döntés ezzel kezdődik: hányan vannak még mögötted? Minél többen, annál szűkebben nyiss; minél későbbi a pozíciód, annál többet nyithatsz.',
      live: 'Élőben szinte mindig tele, 10 fős az asztal, ezért a netes 6 és 9 fős chartok csak igazítva használhatók. Attól, hogy előtted limpeltek, a mögötted ülők száma nem lesz kevesebb.',
      mistake: 'A 9 fős (vagy 6 fős) UTG-range-et játszani 10 fős asztalon, vagy minden pozícióból ugyanazokat a kezeket nyitni.',
      stage: 'Egész verseny',
      cats: ['PRE'],
      rules: [
        'UTG-ről 9, CO-ból 3, BTN-ről 2 játékos van mögötted: ez szabja meg, milyen széles lehet a range.',
        '9 fős chart használatakor a 10 fős UTG legyen egy fokkal szűkebb a 9 fős UTG-nél, a többi széket egy hellyel tolva feleltesd meg (9 fős UTG+1 ≈ 10 fős UTG+2).',
      ],
      src: 'Pozíciós alapelv; 9 fős chartok 10 fős asztalra igazítva (saját átszámítás)',
    },
    {
      id: 't02',
      topic: 'preflop',
      title: 'Nyitó range-ek (RFI) 10 fős asztalon',
      what:
        'Az RFI (raise first in) az a range, amellyel elsőként nyitsz, ha előtted mindenki dobott. A 10 fős értékek közelítések: 9 fős GTO-forrásokból számoltuk át, nem solver-kimenetek. Mélyen UTG-ről kb. 9–11% (77+, ATs+, KJs+, QJs, AQo+), BTN-ről kb. 40–45%.',
      when: 'Minden emeletlen potban, ahol elsőként lépsz be. BB ante mellett, 40bb körül minden pozíció szélesebb, mert több a holt pénz.',
      live: 'Élőben gyakran limpelt már valaki előtted: az már nem RFI-helyzet, hanem iso (lásd az iso-raise technikát). SB-ből raise és limp keverve.',
      mistake: 'Lapból nyitni pozíció helyett („ász van”), vagy a korai pozíciókból túl szélesen nyitni.',
      stage: 'Egész verseny; BB ante-val, 40bb körül szélesebb',
      cats: ['PRE'],
      rules: [
        'UTG: mélyen kb. 9–11%, ~40bb-n BB ante-val kb. 13–15%.',
        'BTN: mélyen kb. 40–45%, ~40bb-n kb. 45–51%.',
        'A teljes pozíciós táblázat és a méretek: lásd a Chartok fület.',
      ],
      src:
        '9 fős, 100bb-s GTO RFI-chartok (UTG 9–12%, CO 25–28%, BTN 44–48%) és MTT-s, 40bb-s, ante-s chartok (UTG 17%, UTG+1 19%, LJ 23%, HJ 28%, CO 36%, BTN 51%); a 10 fős átszámítás saját közelítés (preflopwizard, grindlab)',
    },
    {
      id: 't03',
      topic: 'preflop',
      title: 'Open méret',
      what:
        'A nyitás mérete a stackmélységhez és a holt pénzhez igazodik, nem a kezedhez. Minél rövidebbek a stackek, és minél több a holt pénz, annál kisebb a nyitás.',
      when: 'Minden nyitásnál: egy adott stackmélységen mindig ugyanazt a méretet használd, bármi is a kezed.',
      live: 'A korai, mély élő szakaszban a 2,5–3bb a szokásos. Mivel a mezőny preflop sokat hív (feltevés), a nagyobb méret az erős kezeidnek több értéket hoz.',
      mistake: 'Kézerőhöz igazított méret: AA-val 5bb, 76s-sel 2bb. Ez méret-tell, amit a figyelmes ellenfél leolvas.',
      stage: 'Egész verseny; a méret a stackkel csökken',
      cats: ['PRE'],
      rules: ['Mélyen, a korai élő szakaszban: 2,5–3bb.', 'BB ante-val, 25–60bb: 2–2,3bb.', '20bb alatt: 2bb vagy all-in.', 'SB-ből: 2,5–3bb.'],
      src: 'Élő MTT-s méretezési gyakorlat (egyezik a Chartok fül nyitási táblázatával)',
    },
    {
      id: 't04',
      topic: 'preflop',
      title: 'Iso-raise limperek ellen',
      what:
        'Ha előtted valaki limpelt, emeléssel elkülönítheted (iso): így pozícióban, kezdeményezéssel, lehetőleg heads-up játszol egy gyenge range ellen. Iso-kezek: erős broadway lapok, párok, suited ászok.',
      when: 'Ha a limper range-e gyenge, és a mögötted ülők ritkán szállnak be. Mélyen, pozícióban a spekulatív kezekkel (kis párok, suited connectorok) az overlimp is rendben van.',
      live: 'A korai élő szakaszban sok a limp (feltevés), ezért az iso az egyik fő pénzforrásod. Mivel a mezőny preflop sokat hív, ne spórolj a mérettel.',
      mistake: 'Túl kicsi iso, amiből multiway pot lesz; gyenge offsuit kezekkel isózni; vagy a jó kezekkel „csapdának” limpelni.',
      stage: 'Főleg a korai, mély szakasz',
      cats: ['LMP', 'PRE'],
      rules: [
        'Pozícióban: kb. 3bb + 1bb limperenként (1 limper: 4bb, 2 limper: 5bb).',
        'Pozíción kívül (SB, BB): még +1bb (2 limper ellen kb. 6bb).',
        'Overlimp: pozícióban, mélyen, spekulatív kézzel.',
      ],
      src: 'Gyakorlati ökölszabály (élő, kis tétű MTT-k)',
    },
    {
      id: 't05',
      topic: 'preflop',
      title: 'Set mining',
      what:
        'Kis párral azért hívsz egy raise-t, hogy szettet találj, és akkor nagy potot nyerj. A flopon a szett (vagy jobb) esélye kb. 12%, nagyjából minden 8.–9. alkalommal: a ritka találatnak kell kifizetnie a sok elengedett hívást.',
      when: 'Akkor hívj szettre, ha az effektív stack legalább kb. 15–20-szorosa a hívásnak (gyakorlati ökölszabály). Az effektív stack a kisebbik: a tiéd és a nyitóé közül.',
      live: 'Élőben a korai, mély szakasz a set mining terepe: mélyek a stackek, és a mezőny sokat hív (feltevés). Rövid nyitó ellen viszont nincs mit nyerni.',
      mistake: 'A saját stacked alapján dönteni: ha te 100bb-s vagy, de a nyitó csak 25bb-s, a nyereséged a rövidebb stackhez igazodik.',
      stage: 'Korai szakasz, mély stackek (60bb+)',
      cats: ['STK', 'PRE'],
      rules: [
        'Hívás 3bb-ért → legalább kb. 45–60bb effektív stack kell.',
        '25bb-s nyitó ellen a 3bb-s hívás csak kb. 8×: ott a kis pár nem set mining kéz.',
        'Ha mögötted még squeeze jöhet, a valódi ár magasabb.',
      ],
      src: 'Gyakorlati ökölszabály (implied odds); a szett esélye kombinatorikai számítás',
    },
    {
      id: 't06',
      topic: 'preflop',
      title: '3-bet, 4-bet, squeeze',
      what:
        'A 3-bet egy open újraemelése, a 4-bet a 3-beté, a squeeze pedig 3-bet egy open és legalább egy call után. Méret: pozícióban kb. az open 3-szorosa, pozíción kívül 3,5–4-szerese; squeeze-nél minden callerért még egy openméret.',
      when: 'Laza, late pozícióból sokat nyitó regek ellen lineárisabban 3-betelj, az erős és a jó közepes kezeiddel is. 20–30bb-n a 3-bet jellemzően all-in (3-bet jam), mert nem marad hely a 3-bet/foldra.',
      live: 'A rec 3-bet range-e value-túlsúlyos (feltevés): ha egy rec 3-betel, szűkebben folytass, és a 4-bet-blöff ellene ritkán jó.',
      mistake: 'Csak QQ+ és AK kezekkel 3-betelni, vagy 25bb-n 3-bet/foldolni. Hiba az is, ha nem nézed meg, honnan nyitott az ellenfél, és milyen a range-e.',
      stage: 'Egész verseny; 20–30bb-n 3-bet jam formában',
      cats: ['3B'],
      rules: [
        'Pozícióban: kb. 3× az open (2,5bb → 7,5bb).',
        'Pozíción kívül: 3,5–4× az open (2,5bb → kb. 9–10bb).',
        'Squeeze: +1 openméret callerenként (2,5bb-s open és 1 call ellen, pozíción kívül kb. 11–12,5bb).',
        '3-bet jam (Red Chip-heurisztika): akkor hatékony, ha a stacked legfeljebb 10× az open pozícióban, 12× pozíción kívül (2,2bb-s open ellen kb. 22bb, illetve 26bb).',
      ],
      src: 'Élő 3-bet-méretezési gyakorlat; Red Chip Poker (3-bet jam heurisztika); a rec-tendencia feltevés',
    },
    {
      id: 't07',
      topic: 'preflop',
      title: 'BB-védelem BB ante mellett',
      what:
        'A BB-ben a vak és BB ante esetén az ante is bent van már: ez holt pénz, ezért olcsón védekezhetsz. A BTN 2bb-s nyitására 1bb a hívás, és 5,5bb-s potba kerülsz, így 18,2% equity is elég.',
      when: 'Lopási pozíciók (BTN, SB) ellen nagyon szélesen védekezz, UTG ellen szűkebben. A döntés alapja az ár és a nyitó range-e, nem az, hogy „szép-e” a lapod.',
      live: 'A Duna egyes versenyein a struktúra BB antét jelez; hogy melyik szinttől, azt a kijelzőn vagy a floornál nézd meg. Ante nélkül kevesebb a holt pénz, és szűkebb a védelem.',
      mistake: '„Rossz a lapom, dobom” — pot odds nélkül. Ha rendszeresen túl sokat dobsz a BB-ből, a lopók ingyen viszik a vakjaidat.',
      stage: 'Egész verseny; BB ante mellett a legfontosabb',
      cats: ['BBD'],
      rules: [
        'Pot a hívásod előtt: 0,5 (SB) + 1 (BB) + 1 (ante) + 2 (open) = 4,5bb.',
        'Hívás 1bb, végső pot 5,5bb → 1 / 5,5 = 18,2% equity elég.',
        'BTN és SB ellen nagyon széles, UTG ellen szűkebb védelem.',
        'Pozíción kívül nem realizálod a teljes equitydet, ezért a legrosszabb kezeket így is dobd.',
      ],
      src: 'Pot odds számítás BB ante mellett',
    },
    {
      id: 't08',
      topic: 'preflop',
      title: 'SB-játék',
      what:
        'Ha mindenki dobott, és az SB-ben vagy, egyedül a BB ellen játszol, de pozíción kívül. A solver-alapú stratégiák itt széles range-et játszanak, raise és limp keverve.',
      when: 'Minden folded-to-SB helyzetben. Minél nagyobb az ICM-nyomás, annál kevesebb a raise: a GTO Wizard szerint extrém nyomásnál az SB közel tiszta limp-or-fold stratégiát játszik.',
      live: 'Figyeld meg, hogyan reagál a BB a limpedre: ha sokat emel rá, limpelj kevesebbet; ha passzívan checkel, a limp olcsó flopokat ad.',
      mistake: 'Az SB-t a többi pozícióhoz hasonlóan kezelni: csak a legjobb kezekkel emelni, vagy reflexből minden kezet limpelni.',
      stage: 'Egész verseny; ICM-nyomás alatt más a stratégia',
      cats: ['PRE', 'ICM'],
      rules: ['Open SB-ből: 2,5–3bb.', 'Folded-to-SB: széles range, raise és limp keverve.', 'Növekvő ICM-nyomás: kevesebb raise; extrém nyomásnál közel tiszta limp-or-fold.'],
      src: 'GTO Wizard (SB-stratégia ICM-nyomás alatt)',
    },
    /* @@T@@ */
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = { techniques: PK.data.techniques, leaks: PK.data.leaks };
})(typeof window !== 'undefined' ? window : globalThis);
