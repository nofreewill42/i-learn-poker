/* i-learn-poker — tanulási terv: heti rutin, 10 hetes út, ellenőrzőlisták, élő kézrögzítés, MHH, hangos gondolkodás, szintek */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.data = PK.data || {};

  PK.data.plan = {
    weekly: [
      {
        when: 'Élő verseny előtt (15 perc)',
        items: [
          '10 push/fold villámkérdés: Edzés → Verseny előtti bemelegítés.',
          'Írd fel a mai 3 fókuszpontodat a Naplóba (pl. „BB-ből védekezem a BTN-nyitások ellen”, „20bb alatt reshove-terv”).',
          'Fotózd le a struktúrát a kijelzőről: szintidő, vakemelés, mikortól megy a BB ante.',
          'Nézd meg a keretet: mennyi a mai maximum (pl. 1 belépő + 1 rebuy)?',
        ],
      },
      {
        when: 'Verseny közben',
        items: [
          'Kéz közben soha ne nyúlj a telefonhoz.',
          'Az érdekes kezekből a kéz után csak egy rövid szöveges jegyzet, rövidítéssel.',
          'A szünetekben, az asztaltól távol mondj el 1–3 kezet a narrációs sablon szerint.',
          'Figyeld a mezőnyt: alkalmanként 3 megfigyelés a Pool-naplóba.',
          'Ha tiltet érzel, a következő szünetben állj fel, sétálj egyet, és csak utána ülj vissza.',
        ],
      },
      {
        when: 'Verseny után (24 órán belül)',
        items: [
          'Rögzíts 2–4 kezet a Napló → Élő kezek fülön, a sablon szerint; az eredményt a végén mondd.',
          'Töltsd ki a versenybejegyzést: költség, helyezés, A/B/C-game, 3 pool-megfigyelés.',
          'Ha egy érzés rossz döntéshez vezetett, írj Mental Hand Historyt.',
        ],
      },
      {
        when: 'Gyakorlás a toolban (heti 3× 20–30 perc)',
        items: [
          'Heti kb. 30 spot (3 × egy 10 spotos kör), hangos gondolkodással.',
          'A spotok kb. 40%-a a gyenge kategóriáidból jöjjön (Gyenge pontok mód).',
          'Kezdd az esedékes ismétlésekkel: a Leitner-dobozok 1, 3, 7, 14 és 30 nap után hozzák vissza a spotokat, és amit elrontasz, az visszakerül az 1. dobozba.',
          'Ha belefér, napi 10 perc Push/fold villám.',
          'Kiegészítő eszközök: HRC vagy ICMIZER az ICM-spotokhoz, a GTO Wizard trainer a postflophoz.',
        ],
      },
      {
        when: 'Hetente',
        items: [
          'Export → Claude-elemzés: Adatok → Összefoglaló másolása, majd beillesztés egy új Claude-beszélgetésbe.',
          'Claude új spotjait importáld (Adatok → Saját spotok importálása), és gyakorold őket a következő héten.',
          'Nézd meg a Profil fület: melyik kategória javult, melyik maradt le?',
        ],
      },
    ],

    weeks: [
      {
        from: 1,
        to: 2,
        title: 'Diagnózis',
        goal: 'Mérd fel, hol tartasz: oldd meg az összes beépített spotot (kb. 48) hangos gondolkodással, és nézd meg az alapszintedet és a kategória-profilodat.',
        focus: [
          'Diagnosztikai kör: minden spot egyszer, a megoldás előtt őszinte döntéssel — az első próbálkozások adják a szintbecslést.',
          'A „Hangos gondolkodás” módot használd (gondolkodás + utólagos magyarázat), ne a gyorsat, hogy a gondolkodásod is mérhető legyen.',
          'Élőben indítsd el a rutint: bemelegítés, 3 fókuszpont, 2–4 kéz rögzítése.',
          'A 2. hét végén az első export → Claude-elemzés.',
        ],
        cats: [],
      },
      {
        from: 3,
        to: 4,
        title: 'Push/fold és BB-védelem',
        goal: 'A két leggyakoribb és leggyorsabban javítható terület: a rövid stackes all-in döntések és a védekezés a BB-ből.',
        focus: [
          'Napi 10 perc Push/fold villám, amíg a 10bb-s range-ek fejből nem mennek.',
          'Reshove 20bb-vel a BTN ellen (Chartok fül), és terv minden 15–25bb-s nyitás előtt.',
          'BB-védelem: minden döntésnél mondd ki a pot oddsot (BB ante-val a BTN 2bb-s nyitására 18,2%).',
          'Élő fókuszpontok: „20bb alatt reshove-terv”, „BB-ből védekezem a lopások ellen”.',
        ],
        cats: ['PF', 'BBD'],
      },
      {
        from: 5,
        to: 6,
        title: 'Buborék és döntő',
        goal: 'Tanuld meg, mikor kell a chipEV pot oddsnál több equity (risk premium), és hogyan változik a játék a díjlétrán.',
        focus: [
          'ICM-spotok a toolban; a számokat ellenőrizd az Eszközök → All-in hívás ICM alatt kalkulátorral.',
          'Bubble factor és risk premium: egyenlő tétnél RP = BF / (1 + BF) − 50%.',
          'Döntő: díjlétra, mikrostackek, deal-matek (Eszközök → ICM és deal).',
          'Élőben a verseny előtt tudd meg, hány hely fizet, és mi a deal-szabály.',
        ],
        cats: ['ICM', 'FT'],
      },
      {
        from: 7,
        to: 8,
        title: 'Postflop: c-bet, multiway, river',
        goal: 'A postflop alapok: mikor c-betelj, hogyan játssz több ellenfél ellen, és hogyan dönts a riveren.',
        focus: [
          'C-bet: a board textúrájából indulj — kinek a range-ét találja, kinél a nut-előny?',
          'Multiway: nincs range-bet, kevés a blöff, kisebb a méret.',
          'River: a profil dönt — passzív játékos nagy betjére fold, a hívogató ellen vékony value.',
          'Élőben jegyezd fel a showdownokat (méret és kéz) a Pool-naplóba.',
        ],
        cats: ['CB', 'MW', 'RIV'],
      },
      {
        from: 9,
        to: 9,
        title: '3-bet és exploit',
        goal: 'Agresszívabb preflop a laza nyitók ellen, és a mezőny-megfigyeléseid tudatos használata.',
        focus: [
          '3-bet-méretek: pozícióban 3×, pozíción kívül 3,5–4× az open; 20–30bb-n 3-bet jam.',
          'Ki nyit túl sokat late pozícióból? Ő a 3-bet- és a reshove-célpont.',
          'Nézd át a Pool-naplót: mit írnak felül a megfigyeléseid az alapfeltevésekből?',
          'Tellek csak kontextusban, döntetlen helyzetben.',
        ],
        cats: ['3B', 'EXP'],
      },
      {
        from: 10,
        to: 10,
        title: 'Újramérés',
        goal: 'Mérd meg újra, mennyit javultál, és építs új spotokat a saját élő kezeidből.',
        focus: [
          'Ismételt kör a régi spotokon; a Profil fülön a diagnózis és a mostani pontszám egymás mellett látszik.',
          'Export → Claude: kérj új spotokat a saját élő kezeidből, és importáld őket.',
          'Válaszd ki a következő időszak 2–3 fő fókuszát a leggyengébb kategóriákból.',
        ],
        cats: [],
      },
    ],

    preSession: [
      '10 push/fold villámkérdés megvan (bemelegítés).',
      'A mai 3 fókuszpont felírva a Naplóba.',
      'A mai maximum rögzítve (pl. 1 belépő + 1 rebuy), és belefér a havi keretbe.',
      'A struktúra lefotózva: szintidő, vakemelés, a BB ante kezdete.',
      'Tudom, hány hely fizet (ha nem, megkérdezem a floort).',
      'A telefon némítva; kéz közben nem nyúlok hozzá.',
      'Kipihent és nyugodt vagyok? Ha nem, ma nincs újravásárlás.',
    ],

    postSession: [
      'Versenybejegyzés: költség (buy-in, rebuy, add-on), helyezés, nyeremény.',
      'A játékom értékelése: A, B vagy C volt — az eredménytől függetlenül.',
      '3 pool-megfigyelés a mezőnyről.',
      '2–4 érdekes kéz rögzítve 24 órán belül, a narrációs sablon szerint.',
      'Tilt vagy erős érzés volt? → Mental Hand History.',
      'A 3 fókuszpont: sikerült tartani? Mi lesz a következő alkalommal?',
      'Belefértem az esti maximumba? Hol tart a havi keret?',
    ],

    liveTemplate: {
      shorthand: 'L14 1k/2k/2k | H BTN 28bb AJo | UTG 40 rec op2.2 | H 3b jam | UTG c AK | ki',
      legend: [
        ['L14', '14. szint'],
        ['1k/2k/2k', 'Kisvak / nagyvak / BB ante: 1000/2000, ante 2000 (k = ezer)'],
        ['|', 'Elválasztó: új szereplő vagy új akció'],
        ['H', 'Hős, vagyis te'],
        ['BTN 28bb AJo', 'Pozíció, stack bb-ben, lapok (o = offsuit, s = suited)'],
        ['UTG 40 rec', 'Ellenfél: pozíció, stack bb-ben (40bb), típus (rec, reg, nit, station…)'],
        ['op2.2', 'Open 2,2bb-re'],
        ['3b jam', '3-bet all-in'],
        ['c AK', 'Call, és a mutatott lapok'],
        ['ki', 'Eredmény: kiestem (más példák: +30bb, dupla)'],
        ['l / x / b / r / f', 'Limp / check / bet / raise / fold'],
        ['F: T: R:', 'Flop, turn, river, pl. „F: Kc7d2h x, H b3”'],
      ],
      narration: [
        'Szint, vakok, ante',
        'Stackek bb-ben (a tiéd és az ellenfeleké)',
        'Pozíciók',
        'Olvasatok: ki milyen típus, mit láttál tőle korábban',
        'Akció utcánként',
        'Gondolataid minden döntési pontnál — amit akkor gondoltál, nem amit most tudsz',
        'Eredmény — csak a végén',
        'Érzelmi állapotod a kéz alatt',
      ],
      tips: [
        'Kéz közben soha ne nyúlj a telefonhoz.',
        'Az asztalnál ne diktálj hangot: a kéz után csak egy rövid szöveges jegyzetet írj, a fenti rövidítéssel.',
        'A hangos narrálást a szünetben, az asztaltól távol, vagy hazafelé csináld.',
        'Az eredményt a narráció végén mondd: ha előre kimondod, átszínezi, hogyan emlékszel a döntéseidre.',
        'A Dunán nincs nyilvános házszabály a telefonhasználatról és a jegyzetelésről: első alkalommal kérdezd meg a floort.',
        'Külön appok is vannak (Pokerscope: rövidítésből replay; HandRecorder: offline; Fastroll és LiveHands: export). A gondolataidat akkor is ide írd, hogy bekerüljenek az exportba.',
      ],
    },

    mhh: [
      {
        key: 'problem',
        label: 'Mi a probléma?',
        hint: 'A helyzet és az érzés konkrétan: mi történt, mit éreztél, mit léptél miatta. Pl. „Egy bad beat után két körön át marginális kezekkel hívtam, mert vissza akartam szerezni a zsetonokat.”',
      },
      {
        key: 'logic',
        label: 'Miért logikus, hogy így érzek/gondolkodom?',
        hint: 'Milyen valós igény vagy gondolat áll az érzés mögött? Pl. „Jól játszottam, mégis vesztettem, és azt szeretném, hogy a jó döntés jutalmat hozzon.”',
      },
      {
        key: 'flaw',
        label: 'Miért hibás ez a logika?',
        hint: 'Hol csúszik el a gondolatmenet? Pl. „Egy kéz eredménye rövid távon szinte csak szerencse, és a zseton nem jön vissza attól, hogy rosszabb kezekkel hívok.”',
      },
      {
        key: 'fix',
        label: 'Mi a helyes gondolat?',
        hint: 'Egy mondat, amit a következő alkalommal felidézhetsz. Pl. „A döntést ítélem meg, nem az eredményt; a következő kéz független az előzőtől.”',
      },
      {
        key: 'why',
        label: 'Miért helyes?',
        hint: 'Indokold meg, hogy a következő tiltnél is meggyőző legyen. Pl. „Hosszú távon a jó döntések hozzák a pénzt; egy bad beat többnyire azt jelenti, hogy az ellenfél rosszul tette be a pénzt.”',
      },
    ],

    thinkAloud: {
      phase1: 'Mondj ki mindent, ami eszedbe jut, ahogy jön; ne magyarázd. 30–90 másodperc elég, aztán dönts.',
      phase2: [
        'Mekkora az effektív stack, és milyen pozícióban vagy?',
        'Milyen range-et adsz az ellenfélnek, és miért?',
        'Mennyi equity kell (pot odds, ICM)?',
        'Mi a terved a következő lépésre?',
        'Mennyire vagy magabiztos a döntésedben (1–5)?',
      ],
      tips: [
        'Az 1. fázisban ne indokolj: a gondolatok kimondása nem változtat a gondolatmeneten, a magyarázatkérés viszont igen (Ericsson–Simon). Az indoklás a 2. fázisba való.',
        'A 2. fázis a döntés után jön, 30–60 másodperc, mindig ugyanazokkal a kérdésekkel.',
        'Az első alkalommal 3 könnyű spottal melegíts be, hogy megszokd a hangos gondolkodást.',
        'Legyen látható óra: 60 másodperces időzítő (Adatok → Beállítások, 30–120 mp között állítható).',
        'A deliberate practice célzott, visszajelzéses gyakorlás. Hambrick és mtsai (2014) metaanalízise szerint sakkban és zenében a gyakorlás a teljesítménykülönbségek kb. egyharmadát magyarázta: a tool a fejlődést segíti, de nem garantálja.',
      ],
    },

    levels: [
      { n: 1, label: 'Kezdő', markers: 'A saját lapjából indul („ász van, megnézem”), zsetonban számol bb helyett; a pozíció és a pot odds nem kerül elő.' },
      { n: 2, label: 'Hobbi-játékos', markers: 'Szóba kerül a pozíció és az alap pot odds („1bb-t hívok egy 5,5bb-s potért”); a preflop nagyjából chart szerint megy.' },
      { n: 3, label: 'Tudatos klubjátékos', markers: 'bb-ben gondolkodik, ismeri a push/foldot, típus szerint sorolja be az ellenfelet („rec, sokat hív”), és alapszinten figyel az ICM-re („buborék van, szűkítek”).' },
      { n: 4, label: 'Erős regular', markers: 'Range vs range gondolkodás, SPR, méretezési logika és blockerek; a risk premiumot kvalitatívan kezeli („az ICM miatt több equity kell”).' },
      { n: 5, label: 'Haladó', markers: 'Frekvenciákban gondolkodik, a bubble factort és a risk premiumot számszerűen kezeli („BF 1,4, kb. 8% extra kell”), az ICM-et postflop is alkalmazza, és érti a deal-matekot.' },
    ],
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PK.data.plan;
})(typeof window !== 'undefined' ? window : globalThis);
