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
    // ---------------------------------------------------------------- C2. Stackmélység szerint
    {
      id: 't09',
      topic: 'stack',
      title: 'Mély stack (60bb+)',
      what:
        'Mélyen a kezek értéke nagyrészt az implied oddsból jön: pozícióban szélesebben flattelhetsz, és a spekulatív kezek (kis párok, suited connectorok, suited ászok) is játszhatók. Középerős kézzel pot controllal játszol, nem építesz nagy potot.',
      when: 'A korai szakaszban, amíg a stackek 60bb fölött vannak. Ez a „rec-pénz” szakasz: a hobbi-játékosok mélyen követik el a legdrágább hibáikat.',
      live: 'A Duna-versenyek többsége mélyen indul (pl. 30 000 zseton 100/100-on 300bb), de a 10–15 perces szintű versenyeken ez a szakasz gyorsan elfogy.',
      mistake: 'Egy párral nagy potot építeni mélyen, vagy multiwayben blöffölni olyan recek ellen, akik úgyis hívnak.',
      stage: 'Korai szakasz, 60bb+',
      cats: ['STK', 'PRE'],
      rules: [
        'Pozícióban szélesebb flat: spekulatív kezek, ha a stackek mélyek.',
        'Egy pár mélyen ritkán ér három utcás value-t (SPR > 10).',
        'Vékony value a hívogatók ellen, kevés blöff multiwayben.',
      ],
      src: 'Mély stackes MTT-alapelvek; a Duna-struktúrák a versenynaptárból',
    },
    {
      id: 't10',
      topic: 'stack',
      title: 'Közepes stack (25–60bb)',
      what:
        'BB ante mellett a nyitás 2–2,3bb. 30–40bb alatt megjelenik a 3-bet- és a 4-bet-jam: egy 3-bet után már nincs hely a foldra, ezért a 3-bet és a 4-bet gyakran all-in. Az alacsony SPR miatt a top pair gyakran elköteleződés.',
      when: 'A középső szakaszban, amikor a BB ante már megy, és a stackek 25–60bb között vannak.',
      live: 'A late pozícióból sokat nyitó, agresszív regek (feltevés) itt a legjobb célpontok a 3-bet jamhez.',
      mistake: 'Mély stackes szemlélet: 3bb-s nyitás, 3-bet utáni fold 30bb-vel, vagy alacsony SPR-nél a top pair eldobása.',
      stage: 'Középső szakasz, 25–60bb',
      cats: ['STK', '3B'],
      rules: [
        'Open: 2–2,3bb BB ante mellett.',
        '30–40bb alatt: a 3-bet és a 4-bet gyakran all-in, mert nincs hely a 3-bet/foldra.',
        'SPR 4 alatt a top pair többnyire stackelési kéz: preflop döntsd el, hogy vállalod-e.',
      ],
      src: 'MTT-s stackmélység-alapelvek; SPR-ökölszabályok',
    },
    {
      id: 't11',
      topic: 'stack',
      title: 'Rövid stack (15–25bb)',
      what:
        'Ezen a mélységen a nyitás már komoly része a stackednek, ezért csak akkor nyiss, ha tudod, mit csinálsz egy all-in válaszra. A fő fegyvered a reshove: mások nyitására all-in-nel válaszolsz, és a fold equity önmagában is sokat hoz.',
      when: 'Ha az effektív stack 15–25bb, főleg laza, late pozíciós nyitások ellen.',
      live: 'A late pozícióból sokat nyitó, agresszív regek (feltevés) a legjobb reshove-célpontok; egy szűk, ritkán nyitó rec korai nyitása ellen szűkíts.',
      mistake: 'Terv nélkül nyitni, aztán egy reshove ellen találgatni; vagy 20bb-vel flattelni, és a flopon eldobni a befektetett zsetonokat.',
      stage: 'Középső és késői szakasz, 15–25bb',
      cats: ['PF', 'STK'],
      rules: [
        'Nyitás előtt döntsd el: ha all-in jön rá, hívsz vagy dobsz?',
        '20bb, SB a BTN ellen, reshove: kb. 33+, A5s+, ATo+, KTs+, KJo+, QJs.',
        '20bb, BB a BTN ellen, reshove: kb. 22+, A7s+, ATo+, KTs+, KJo+, QTs+, JTs.',
        'Ezek chipEV-közelítések laza BTN ellen; szűkebb nyitó ellen és ICM-nyomásnál szűkíts. A range-rácsok: lásd a Chartok fület.',
      ],
      src: 'rangerpro.fr és deepfold.co rövid stackes összefoglalói (chipEV-közelítés)',
    },
    {
      id: 't12',
      topic: 'stack',
      title: 'Push/fold (12–15bb alatt)',
      what:
        'Kb. 12bb alatt a push/fold (all-in vagy fold) közel optimális: egy kis nyitás után úgysem tudnál dobni egy reshove-ra. 10–15bb között vegyes zóna jön, ahol a min-raise és az SB-limp is a stratégia része.',
      when: 'Ha 12–15bb vagy kevesebb a stacked, és előtted mindenki dobott. Egy all-in hívása más kérdés: ott nincs fold equityd, ezért szűkebben hívj, mint ahogy tolnál.',
      live: 'BB ante mellett több a holt pénz, ezért a 10bb-s chartok alsó határok: szélesebben tolhatsz és hívhatsz. Hogy melyik szinttől megy a BB ante, azt a struktúrán nézd meg.',
      mistake: 'Túl szűk shove BTN-ről és SB-ből („megvárom a jobb lapot”), túl széles hívás all-in ellen, és az ICM figyelmen kívül hagyása a buborékon.',
      stage: 'Késői szakasz, 15bb alatt',
      cats: ['PF'],
      rules: [
        '~12bb alatt push/fold; 10–15bb között vegyes zóna (min-raise, SB-limp).',
        'A 10bb-s nyitó all-in és hívó range-ek pozíciónként: lásd a Chartok fület és a Push/fold villámot.',
        'BB ante, 10bb, SB vs BB: a shove kb. 58%-ról 71%-ra, a BB hívása kb. 38%-ról 53%-ra nő.',
        'A hívó range mindig szűkebb a toló range-nél: aki hív, annak nincs fold equityje.',
      ],
      src: 'Dara O’Kearney – Barry Carter: Poker Satellite Strategy (a pokerskill.com közlésében); pokerlevelup (a BB ante hatása)',
    },
    // ---------------------------------------------------------------- C3. Postflop
    {
      id: 't13',
      topic: 'postflop',
      title: 'Heads-up c-bet',
      what:
        'A c-bet (continuation bet) a preflop emelő betje a flopon. A gyakoriságot és a méretet a board textúrája dönti el: kinek a range-ét találja jobban a flop, és kinél lehetnek a legerősebb kezek (nut-előny).',
      when: 'Heads-up potban, preflop emelőként. Száraz, magas boardon kicsi és gyakori c-bet; lapos, összekötött, a védő range-ét találó boardon gyakran check.',
      live: 'Élőben a mezőny preflop sokat hív (feltevés), ezért a heads-up pot ritkább: két vagy több ellenfél ellen a multiway szabályai érvényesek.',
      mistake: 'Automatikus c-bet minden boardon („mindig c-betelek”), a textúra végiggondolása nélkül, ugyanazzal a mérettel.',
      stage: 'Egész verseny',
      cats: ['CB'],
      rules: [
        'Száraz, magas board (pl. K72 szivárvány, BTN vs BB): gyakori c-bet a pot 25–33%-ával.',
        'Lapos, összekötött board (pl. 876 két színnel, EP vs BB): gyakori check, mert a védő range-ét találja.',
        '3-bet potban, magas boardon, 20bb-n: a PokerCoaching szerint 83% fölötti c-bet, 25%-os mérettel.',
      ],
      src: 'Solver-alapú c-bet-heurisztikák; PokerCoaching (3-bet potos c-bet 20bb-n)',
    },
    {
      id: 't14',
      topic: 'postflop',
      title: 'Multiway potok',
      what:
        'Három- vagy többszereplős potban nem érdemes a teljes range-eddel betelni. A GTO Wizard multiway-tippjei szerint a c-bet gyakoriságát a nut-előny szabja meg, a méret kisebb, a tiszta blöff kockázat/nyereség aránya pedig nagyon rossz.',
      when: 'Ha a flopon kettőnél több játékos van. Minél több az ellenfél, annál valószínűbb, hogy valaki eltalálta a boardot.',
      live: 'Élőben a multiway pot nagyon gyakori, főleg a korai, limpes szakaszban: a heads-up c-bet-szokásokat itt el kell felejteni.',
      mistake: 'Range-bet és blöff két vagy több ellenfél ellen („hátha mindenki dob”), overpair-szerelem, vagy túl vékony value-bet: ez kis tétű játékosoknál multiwayben gyakori.',
      stage: 'Egész verseny, főleg a korai, limpes szakasz',
      cats: ['MW'],
      rules: [
        'Egy multiway solver-példában a kezeknek csak kb. 11,7%-a bet: a check az alap.',
        'C-bet csak nut-előnnyel, kisebb mérettel.',
        'Tiszta blöff 2+ ellenfél ellen: szinte soha.',
        'River: ha mindenki checkel hozzád, blöffölj csak konkrét olvasattal.',
      ],
      src: 'GTO Wizard: 10 Tips for Multiway Pots (4. tipp) és multiway solver-példa',
    },
    {
      id: 't15',
      topic: 'postflop',
      title: 'SPR (stack-to-pot ratio)',
      what:
        'Az SPR az effektív stack és a flop-pot hányadosa. Megmutatja, mennyire vagy elkötelezve: alacsony SPR-nél egy jó pár is elég a stackeléshez, magasnál nagyon erős kéz kell hozzá.',
      when: 'Már preflop: a méretekkel és a hívásokkal te alakítod a flop SPR-t. A flopon ebből döntöd el, hogy a kezed stackelési kéz-e.',
      live: 'A Duna-versenyek többsége mélyen indul (pl. 30 000 zseton 100/100-on 300bb): az első szinteken magas az SPR, ott egy pár ritkán ér stacket.',
      mistake: '200bb mélyen egy párral stackelni egy rec check-raise-ére; vagy alacsony SPR-nél eldobni a top pairt.',
      stage: 'Egész verseny; mélyen magas, rövid stacknél alacsony',
      cats: ['STK'],
      rules: [
        'SPR = effektív stack / flop-pot.',
        'Példa: 25bb-s stackek, CO 2,2bb-s open, BB call, BB ante: a flop-pot 5,9bb, az SPR kb. 3,7.',
        'SPR < 4: top pair és overpair általában stack-off.',
        'SPR > 10: egy pár ritkán ér három utcás value-t, ott pot control.',
      ],
      src: 'SPR-ökölszabályok; a példát az app spot-motorja számolja',
    },
    {
      id: 't16',
      topic: 'postflop',
      title: 'Pot control',
      what:
        'Középerős kézzel (pl. második pár vagy gyenge kickeres top pair) kicsiben tartod a potot, hogy olcsón eljuss a showdownig. Pozícióban egy utcán check-backelsz, pozíción kívül check-callal játszol.',
      when: 'Ha a kezed túl erős a dobáshoz, de túl gyenge ahhoz, hogy három utcán value-t kérj, főleg magas SPR-nél.',
      live: 'Élőben a mezőny sokat hív (feltevés): pot controllal kevesebbet veszítesz a jobb kezek ellen, a vékony value-t pedig a riveren veszed be.',
      mistake: 'Középerős kézzel minden utcán betelni: a rosszabb kezeket kibetteled, a jobbak ellen nagy potot veszítesz, egy raise után pedig nehéz döntésbe kerülsz.',
      stage: 'Egész verseny; magas SPR-nél a legfontosabb',
      cats: ['STK', 'CB'],
      rules: ['Pozícióban: check-back egy utcán, hogy olcsón showdownig juss.', 'Pozíción kívül: check-call, kis potban.'],
      src: 'Postflop alapelv (pot control)',
    },
    {
      id: 't17',
      topic: 'postflop',
      title: 'Vékony value',
      what:
        'Vékony value-bet: olyan kézzel betelsz, amely csak kicsivel jobb az ellenfél hívó range-énél, de rosszabb kezek még fizetik. Calling station ellen a riveren a gyenge kickeres top pair, sőt a második pár is value lehet.',
      when: 'Ha az ellenfél sokat hív és ritkán emel: ellene a river-bet többet hoz, mint a check. Aki sokat dob, az ellen ritkábban betelj vékonyan.',
      live: 'Az „élő rec” alapprofilja (feltevés): túl sokat hív. Ellene a vékony value az egyik legnagyobb pénzforrásod.',
      mistake: '„Úgyis csak jobb hív” — a value kihagyása. Egy hívogató a rosszabb kezeit is kifizeti.',
      stage: 'Egész verseny; főleg mélyen, recek ellen',
      cats: ['RIV', 'EXP'],
      rules: [
        'Kérdezd meg magadtól: milyen rosszabb kezek hívnak? Ha sok ilyen van, betelj.',
        'Station ellen a riveren: a gyenge kickeres top pair és a második pár is value lehet.',
      ],
      src: 'Exploit-alapelv; az „élő rec” profil feltevés (európai kis tétű élő MTT-k)',
    },
    {
      id: 't18',
      topic: 'postflop',
      title: 'River-blöffök gyakorisága',
      what:
        'A kis tétű mezőny a riveren jellemzően kevesebbet blöfföl, mint amennyit kellene (underbluff). Az Upswing Poker adatelemzésében egy bizonyos river-helyzetben a játékosok csak 19%-ban blöfföltek az optimális kb. 30% helyett. Ez online, cash, reg-adat: élő MTT-re csak irányjelző.',
      when: 'Nagy river-betnél, ha bluff-catcherrel (olyan kézzel, amely csak blöfföt ver) gondolkodsz a híváson.',
      live: 'A passzív recek a riveren ritkán blöffölnek (feltevés): egy passzív játékos nagy river-betjére dobd a bluff-catchert. Aki pedig sokat hív, az ellen te ne blöffölj.',
      mistake: 'Hero call olvasat nélkül („nem hiszem el”) egy passzív rec nagy river-betjére, vagy blöff egy calling station ellen.',
      stage: 'Egész verseny',
      cats: ['RIV', 'EXP'],
      rules: [
        'Upswing-adat: egy river-helyzetben 19% blöff az optimális kb. 30% helyett (online, cash).',
        'Passzív játékos nagy river-betje: a bluff-catcher többnyire fold.',
        'Gyakran hívó ellen: ne blöffölj, inkább value-betelj vékonyan.',
      ],
      src: 'Upswing Poker adatelemzés (online reg-adat, cash); az élő mezőnyre vonatkozó rész feltevés',
    },
    {
      id: 't19',
      topic: 'postflop',
      title: 'Bluff-catching és blockerek',
      what:
        'Bluff-catcher az a kéz, amely csak az ellenfél blöffjeit veri. A blocker a kezedben lévő lap, amely csökkenti az ellenfél bizonyos kombinációinak számát. Ha a value-kezeit blokkolod, a blöffjeit nem, nő az esélye, hogy blöfföt fogsz.',
      when: 'River-döntésnél, amikor a kezed csak blöfföt ver: hívj, ha a value-t blokkolod, a blöfföt nem; dobj, ha fordítva áll.',
      live: 'Élőben a blocker csak finomhangolás: a mezőny tendenciája (pl. a passzív recek ritkán blöffölnek, feltevés) erősebb szempont.',
      mistake: 'Csak a saját kéz erejét nézni („van egy párom”), és meg sem kérdezni, mennyi blöff lehet az ellenfél range-ében.',
      stage: 'Egész verseny',
      cats: ['RIV'],
      rules: [
        'Potméretű betnél 33% equity kell: 1 potnyit hívsz egy 3 potnyi végső potért.',
        'Hívj, ha a value-t blokkolod, a blöfföt nem.',
      ],
      src: 'Pot odds számítás; blocker-alapelv',
    },
    {
      id: 't20',
      topic: 'postflop',
      title: 'Turn semi-bluff',
      what:
        'A semi-bluff olyan bet, amellyel most még nem a legjobb kezed van, de sok az outod: ha az ellenfél dob, azonnal nyersz, ha hív, még javulhatsz. A turnön az erős draw (pl. flush draw és gutshot) a legjobb második barrel.',
      when: 'Ha a turn equityt adott (pl. a flush draw mellé gutshotot kaptál), és az ellenfél range-ében sok a dobható kéz.',
      live: 'A sokat hívó, passzív recek (feltevés) ellen kisebb a fold equity: ellenük az erős draw-nál is inkább a lapok equityjére számíts, ne a dobásra.',
      mistake: 'Alig outos kézzel barrelni, vagy erős draw-val passzívan check-callolni, és elengedni a fold equityt.',
      stage: 'Egész verseny; mély és közepes stackeknél',
      cats: ['CB'],
      rules: [
        'Equityt adó turnön, erős draw-val: barrel a pot 66–75%-ával.',
        'Flush draw + gutshot: 9 + 3 = 12 out (a gutshot egyik lapja már a flush outjai között van).',
      ],
      src: 'Postflop barrel-heurisztika; outszámolás',
    },
    // ---------------------------------------------------------------- C4. Versenydinamika és ICM
    {
      id: 't21',
      topic: 'tournament',
      title: 'Rebuy és re-entry',
      what:
        'Rebuy vagy re-entry esetén kiesés után újra beszállhatsz egy új stackkel; a pontos szabály versenyenként más. Az újravásárlás lehetősége nem változtat azon, hogy egy adott kézben mi a jó döntés.',
      when: 'Kiesés után a bankrollod és a mentális állapotod alapján dönts, ne a „vissza kell nyernem” érzésből.',
      live: 'A Duna „Second Chance” versenyein 1× rebuy van, a freezeoutokon nincs újravásárlás (lásd a Duna Poker fület). Előre döntsd el, hány belépőt vállalsz aznap.',
      mistake: 'Extra varianciát vállalni, mert „úgyis újravásárolhatok”, vagy tiltből, a veszteséget hajszolva újravásárolni.',
      stage: 'A late reg végéig',
      cats: ['MEN'],
      rules: [
        'Az újravásárlás lehetősége nem ok laza all-inekre.',
        'Kiesés után két kérdés: belefér a mai keretbe? Nyugodt vagyok? Ha bármelyikre nem a válasz, nincs újravásárlás.',
      ],
      src: 'Bankroll- és mentálgyakorlat (saját ajánlás); a Duna-szabályok a versenynaptárból',
    },
    {
      id: 't22',
      topic: 'tournament',
      title: 'Late reg',
      what:
        'Késői nevezéssel a kezdés után is beszállhatsz, a late reg végéig. Ha 20–25bb-vel ülsz be, azonnal reshove- és push/fold-módban vagy, és kimarad a mély, „rec-pénzes” szakasz.',
      when: 'Ha késve érkezel, előre tudd, hány bb-vel ülsz be, és ehhez válaszd a stratégiát.',
      live: 'A Duna esti versenyein a late reg kb. 4–5 óráig tart (lásd a Duna Poker fület). A vakstruktúra nem nyilvános: beülés előtt a kijelzőn nézd meg, hány bb lesz a stacked.',
      mistake: 'Késve beülni, és rövid stackkel mély stackes stílusban játszani.',
      stage: 'A late reg végéig',
      cats: ['PF', 'STK'],
      rules: [
        'Beüléskor számold ki a stacked bb-ben, és ahhoz válassz stratégiát.',
        '20–25bb: reshove-mód; 12–15bb alatt push/fold.',
        'Ha időben ott lehetsz, ne hagyd ki a mély szakaszt: ott a legtöbb a rec-pénz.',
      ],
      src: 'MTT-stratégiai alapelv; a late reg idők a versenynaptárból',
    },
    /* @@T@@ */
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = { techniques: PK.data.techniques, leaks: PK.data.leaks };
})(typeof window !== 'undefined' ? window : globalThis);
