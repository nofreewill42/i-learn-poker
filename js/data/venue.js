/* i-learn-poker — Duna Poker Center: helyszín, heti versenyek, kifizetés, házszabály, mezőny, bankroll.
 *
 * Forrás: dunapoker.hu, pokerdiscover.com, SZTFH-engedélylista, Cardplayer Lifestyle, felhasználói értékelések
 * (a kutatás ideje: 2026. október). A menetrend változhat; ahol egy adat következtetés vagy feltevés, a szöveg is ezt mondja.
 */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.data = PK.data || {};

  PK.data.venue = {
    name: 'Duna Poker Center',
    address: '1138 Budapest, Váci út 178., Duna Pláza, első emelet',
    rooms: '660 m², három terem: Platinum (cash), Gold és Silver (verseny); az oldal szerint 30 asztal, más források szerint 28.',
    license: 'SZTFH-engedélyek: DUNA GOLD és DUNA SILVER – Monaco Póker Kft.; DUNA PLATINUM – Plaza Póker Kft.; 2031. 11. 02-ig érvényesek.',
    contact: { email: 'info@dunapoker.hu', phone: '+36 70 282 1797 (0–24)' },
    checked: '2026. október (a kutatás ideje)',
    disclaimer: 'A menetrend és a struktúra változhat — a floornál és a dunapoker.hu-n ellenőrizd.',

    schedule: [
      { day: 'Kedd', time: '15:00', name: 'Second Chance', buyIn: 5000, stack: '15 000 / 20 000', levels: '10 perc, 100/100', lateReg: '~16:40–16:50', reentry: '1× rebuy' },
      { day: 'Kedd', time: '18:00', name: 'Big Stack Freeze', buyIn: 20000, stack: '100 000', levels: '20 perc, 100/200, BB ante', lateReg: '~22:20–22:30', reentry: 'max. 1 re-entry' },
      { day: 'Szerda', time: '15:00', name: 'Freeze', buyIn: 7000, stack: '25 000', levels: '10–15 perc, 100/100', lateReg: '~16:10–17:10', reentry: 'nem egyértelmű; egyes listákon 6× re-entry' },
      { day: 'Szerda', time: '18:00', name: 'Second Chance', buyIn: 12000, stack: '30 000 / 40 000', levels: '20 perc, 100/100', lateReg: '~22:30', reentry: '1× rebuy' },
      { day: 'Csütörtök', time: '15:00', name: 'Satellite (3×25K)', buyIn: 2500, stack: '15 000 / 20 000', levels: '10 perc, 100/200', lateReg: '~16:10', reentry: '1× rebuy' },
      { day: 'Csütörtök', time: '18:00', name: 'Second Chance', buyIn: 25000, stack: '30 000 / 40 000', levels: '25 perc, 100/100', lateReg: '~22:40', reentry: '1× rebuy' },
      { day: 'Péntek', time: '18:00', name: 'K.O. Freezeout', buyIn: 25000, stack: '50 000', levels: '25 perc, 100/100', lateReg: '~22:40', reentry: 'nincs' },
      { day: 'Szombat', time: '15:00', name: 'Freezeout', buyIn: 8000, stack: '30 000', levels: '15 perc, 100/100, BB ante', lateReg: '~17:40–17:50', reentry: 'nincs' },
      { day: 'Szombat', time: '18:00', name: 'Second Chance', buyIn: 22000, stack: '30 000 / 40 000', levels: '20 perc, 100/100, BB ante', lateReg: '~22:20–22:50', reentry: '1× rebuy' },
      { day: 'Vasárnap', time: '15:00', name: 'Second Chance / Freezeout', buyIn: 9500, stack: '30 000 / 40 000 (más listán 40 000)', levels: '20 perc, 100/100, BB ante', lateReg: '~19:10–19:20', reentry: '1× rebuy' },
    ],
    stackNote:
      'A „30 000 / 40 000” valószínűleg 30 000 induló és 40 000 zsetonos rebuy- vagy add-on stack (következtetés). A BB ante csak egyes listákon szerepel, a vakemelési struktúra és az ante kezdete nem nyilvános: fotózd le a kijelzőt.',

    series:
      'Sorozat: a „Second Chance” Day 1A/1B/1C napjai 25 000 Ft-ért (8 000 000 Ft várható összdíj, 25 perces szintek, BB ante, „played till 10%”); a Day 2 már pénzben („ITM”) indul, 6000/12000-től, 30 perces szintekkel. Egyes hetekben 3–4 millió Ft-os garantált versenyek is vannak (pl. 4 000 000 Ft GTD K.O. Freezeout).',
    payouts:
      'Nincs nyilvános kifizetési tábla, fizetett-hely arány vagy deal-szabály. Kiinduló feltevés a „played till 10%” alapján: kb. a mezőny 10%-a fizet, vagyis 50 nevezőnél kb. 5, 70-nél kb. 7, 120-nál kb. 12 hely. A verseny előtt kérdezd meg a floort.',
    bubble:
      '70 nevezőnél 7 asztal indul. Ha 7 hely fizet (feltevés), a pénzbuborék a 10 fős döntőn van: a pénzbuborék, a döntőasztal és a díjugrások egyszerre jönnek, így ott a legnagyobb az ICM-nyomás. Erre a szakaszra készülj a legjobban (Tudástár → Technikák → Verseny és ICM).',

    houseRules: [
      'Nincs nyilvános házszabály a telefonhasználatról, a jegyzetelésről és a hangfelvételről: első alkalommal kérdezd meg a floort.',
      'Anekdoták: egy látogató szerint az asztalnál való beszéddel nem szigorúak; egy 2022-es fórumbejegyzés szerint sokan beszélnek kéz közben, és a „show one, show all” szabályt sem veszik szigorúan. Erre ne építs: a floor szava dönt.',
      'Kézben soha ne nyúlj a telefonhoz.',
      'Az asztalnál ne diktálj hangot; a kéz után csak rövidített szöveges jegyzetet írj.',
      'A hangos narrálást a szünetben, az asztaltól távol vagy hazafelé csináld.',
    ],

    pool: {
      facts: [
        'A Cardplayer Lifestyle szerint a Duna elsősorban „locals room”: helyi, visszatérő játékosok terme.',
        'Egy felhasználói értékelés (cash játékról) szerint túlnyomórészt helyiek játszanak, a szint nem túl magas, a stílus nagyon agresszív, 300–500bb-s stackekkel, 7%-os rake mellett. Ez cash-adat, a versenyekre csak irányjelző.',
      ],
      assumptions: [
        'Sok limp a korai szakaszban → iso-raise erős kezekkel, kellő mérettel.',
        'Túl sok preflop call → több a multiway pot; az erős kezeidből kérj value-t.',
        'Value-túlsúlyos 3-bet range a recektől → egy rec 3-betje ellen szűkebben folytass, 4-bet-blöff ritkán.',
        'River-underbluff a passzív recektől → nagy river-betjükre dobd a bluff-catchert.',
        'Laza hívások all-in ellen → rövid stackkel tolj inkább value-val, kevesebb blöffel.',
        'Túlzott óvatosság a buborékon, főleg a közepes stackeknél → nagy stackkel nyomd őket.',
        'Late pozícióból túl sokat nyitó, agresszív regek → ők a 3-bet- és a reshove-célpontok.',
        'Alkalmanként 3 megfigyelés a Pool-naplóba; 8–10 alkalom után ezek felülírják a fenti feltevéseket.',
      ],
    },

    askFloor: [
      'Kifizetési tábla: hány hely fizet az adott nevezőszámnál?',
      'Deal-szabály: engedélyezett-e, és hogyan bonyolítják?',
      'Telefon/jegyzet használata az asztalnál',
      'A bounty aránya a K.O. versenyen',
      'Mikor indul a BB ante, és mi a vakstruktúra?',
      'Az újravásárlás pontos szabálya (rebuy, re-entry, add-on) és a late reg vége',
    ],

    bankroll: [
      'Elkülönített keret, amely független a megélhetésedtől: legalább 50–100 buy-in a fő versenytípusodból (saját ajánlás, nem szabály).',
      'Példa: 8 000 Ft-os fő versenytípushoz 400 000–800 000 Ft, 25 000 Ft-oshoz 1 250 000–2 500 000 Ft.',
      'Az esti maximumot előre rögzítsd (pl. 1 belépő + 1 rebuy), és ne írd felül az asztalnál.',
      'Ha a havi keret elfogyott, tarts szünetet a hónap végéig.',
      'Az újravásárlásról nyugodt fejjel dönts: tiltben nincs rebuy.',
      'Ha a játék kontrollálhatatlanná válik, hívd a játékosvédelmi zöld számot.',
    ],

    helpline: { label: 'Játékosvédelmi zöld szám (a terem oldalán feltüntetve)', phone: '06 80 205 352' },
    src: 'dunapoker.hu; pokerdiscover.com; SZTFH-engedélylista; Cardplayer Lifestyle; felhasználói értékelések és egy 2022-es fórumbejegyzés',
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PK.data.venue;
})(typeof window !== 'undefined' ? window : globalThis);
