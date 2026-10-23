# i-learn-poker

Személyre szabott pókertréner élő, 10 fős asztalos versenyekhez — a budapesti Duna Poker Center 50–120 nevezős MTT-ire szabva.

A lényeg: **hangosan gondolkodsz, mielőtt döntesz.** Az app rögzíti és szöveggé alakítja, amit mondasz, értékeli a döntésedet és a gondolkodásodat is, és sok spot után megmutatja, hol tartasz, és min érdemes dolgoznod. Az exportot odaadod Claude-nak, aki elemzi a gondolkodásodat, és új, rád szabott spotokat ír, amiket visszaimportálsz.

## Mit tud

| Rész | Mire jó |
|---|---|
| **Edzés** | 48 diagnosztikus spot (korai mély szakasz, BB ante-s középső szakasz, buborék, döntőasztal, mentál). Kétfázisú hangos gondolkodás: döntés előtt szabadon, utána a kérdések mentén. Diagnosztikai kör, esedékes ismétlés (1/3/7/14/30 nap), gyenge pontok, válogatás. |
| **Profil** | Szintbecslés (1 Kezdő … 5 Haladó) az első próbálkozásokból, 13 kategória első és legutóbbi pontszáma, siker nehézség szerint, a gondolkodásod jellemzői, visszatérő árulkodó mondatok, előzmények visszahallgatható felvételekkel. |
| **Villámdrillek** | Push/fold 10bb-vel (Nash-közeli chart, határesetekre súlyozva) és pot odds (hívás, blöff, BB-védelem, outok, all-in hívás). |
| **Napló** | Versenyek és bankroll (költség, helyezés, ROI, A/B/C-game), élő kezek rövidítéssel és hangos narrációval, Mental Hand History, pool-napló a Duna-mezőnyről. |
| **Tudástár** | 34 technika a Duna-mezőnyre szabva, leak-taxonómia az árulkodó mondatokkal, range-chartok, 10 hetes tanulási terv, Duna-versenynaptár. |
| **Eszközök** | Pot odds, equity (kéz vs kéz vagy range, boarddal), ICM és deal-összehasonlítás, all-in hívás ICM alatt (risk premium, bubble factor), bounty-átváltó a K.O. versenyhez. |

## Indítás

### GitHub Pages (ajánlott — itt működik a mikrofon)

1. A repó oldalán: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, ág: `main`, mappa: `/ (root)`, **Save**.
2. Pár perc múlva az app itt lesz: **https://nofreewill42.github.io/i-learn-poker/**
3. Nyisd meg **Chrome-ban vagy Edge-ben** (gépen vagy Androidon): itt működik az élő magyar beszédfelismerés. Az első felvételnél engedélyezd a mikrofont.
4. Telefonon a böngésző menüjéből „Hozzáadás a kezdőképernyőhöz” — így appként nyílik, és offline is betölt.

Safari / iOS: a beszédfelismerés bizonytalan. Ilyenkor koppints a szövegmezőbe, és használd a billentyűzet diktálását — az mindig működik.

### Helyben

```bash
python3 -m http.server 8000   # a repó gyökerében
# majd: http://localhost:8000
```

Az `index.html` dupla kattintással is megnyílik, de `file://` alatt a mikrofon nem mindenhol érhető el.

## Így használd

1. **Diagnosztikai kör.** Minden spotnál nyomd meg a zsetont (vagy az `R` billentyűt), és mondj ki mindent, ami eszedbe jut — ne magyarázd, csak gondolkodj. Aztán dönts (`1`–`5`).
2. **Utólagos magyarázat.** Röviden: effektív stack és pozíció, az ellenfél range-e, mennyi equity kell, mi a terved. Add meg, mennyire vagy biztos.
3. **Értékelés.** Megkapod a megoldást, és jelöld, mely kulcsszempontokat érintetted (a gép előre bejelöli, amit felismert — javítsd, ha tévedett).
4. **Hetente:** Adatok → *Összefoglaló másolása* → illeszd be egy Claude-beszélgetésbe. A válaszban kapott JSON-spotokat másold vissza az Adatok oldalon, és importáld.
5. **Verseny előtt** 15 perc: push/fold villám és 3 fókuszpont a Naplóban. **Utána** 24 órán belül 2–4 érdekes kéz narrálva.

## Hogyan pontoz

Egy spot 0–100 pont: **döntés 60** (legjobb 60, elfogadható 45, kis hiba 20, komoly hiba 0) + **érvelés 40** (a spot 3–5 kulcsszempontjának lefedése 25, gondolkodási minőség 15: range-gondolkodás, számolás, terv) − **levonások** (eredmény-orientált érv, tilt-jel, tell-mítosz; legfeljebb 15). Sikeres, ha legalább 70.

A **szint** az első próbálkozásokból jön (akkor még nem láttad a megoldást): egy nehézségi szint „megvan”, ha legalább 3 spotból 70% sikeres; a szint = 1 + a megszerzett nehézségi szintek száma. Gyenge gondolkodási minőségnél egy szinttel lejjebb, erősnél „feltörekvő” jelzés. Ha egy spot megoldását mentés nélkül megnézted, a következő próbálkozása már nem számít a szintbe. Az ismételt próbálkozások a „legutóbbi” pontszámokba és az ismétlési ütemezésbe számítanak: egy esedékes spot sikeres ismétlése egy dobozzal feljebb viszi (1, 3, 7, 14, 30 nap), a hiba vissza az elejére, és másnap újra jön.

## Adatvédelem

Minden adat a böngésződben marad (localStorage és IndexedDB); nincs szerver, nincs fiók. A Chrome és az Edge élő beszédfelismerése a hangot a böngésző gyártójának szerverére küldi átírásra — ha ezt nem szeretnéd, kapcsold ki a Beállításokban (a hangfelvétel ettől még helyben marad, a szöveget beírhatod vagy diktálhatod). Más eszközre a teljes mentéssel (JSON) viszed át az adataidat.

## A tartalom alapja és korlátai

- A spotok és a technikák egy 2026 októberi kutatásra épülnek (GTO Wizard, Upswing, Red Chip Poker, PokerCoaching, O’Kearney–Carter, Tendler, Elwood és mások); minden spot jelzi a forrását és az ajánlás bizonyosságát.
- A 10bb-s push/fold chart (O’Kearney–Carter) a forrás szerint ante nélküli chipEV-tábla, de saját Nash-számításunk szerint a tartományai a big blind ante-s értékekhez állnak közel (UTG kb. 15%, BTN kb. 43%, SB kb. 72%; ante nélkül kb. 9%, 32% és 58% lenne). A korai, ante nélküli szinteken ezért korai pozícióból szűkebben told. A 10 fős nyitási arányok 9 fős chartokból számolt közelítések, nem solver-kimenetek.
- Az ICM-számítás Malmuth–Harville-modell; a Duna kifizetési táblája nem nyilvános, ezért a spotok egy feltételezett, kb. 10%-ot fizető struktúrával számolnak. A közeli ICM-spotokat érdemes HRC-vel vagy ICMIZER-rel is ellenőrizni.
- A gondolkodás automatikus felismerése kulcsszavas: javaslat, nem ítélet — a végső jelölés a tiéd.
- A Duna-menetrend és -struktúra változhat; kérdezd meg a floort a kifizetésről, a deal-szabályról, a telefonhasználatról és a bounty arányáról.

## Felelős játék

A bankroll-tanácsok (Napló → Versenyek) ajánlások, nem szabályok. Ha a játék kontrollálhatatlanná válik, a terem oldalán feltüntetett játékosvédelmi zöld szám: **06 80 205 352**.

## Fejlesztés

Nincs build-lépés: sima HTML, CSS és JavaScript (klasszikus szkriptek a `PK` névtérben), így GitHub Pages-en és helyben is ugyanúgy fut.

```
index.html, sw.js, manifest.webmanifest
css/            megjelenés (saját tárhelyről töltött Barlow Condensed és Source Sans 3)
js/core/        motor: kártyák, range-ek, spot-szimuláció, ICM, equity, pontozás, ismétlés, tárolás, hang, export
js/data/        tartalom: spotok, chartok, fogalomtár, technikák, terv, Duna
js/ui/          felület: asztal, ábrák, felvétel-panel, nézetek
tests/          Node-tesztek
tools/          spot-ellenőrző és equity parancssorból
docs/           a spotformátum leírása
```

```bash
npm test                                            # range-ek és chartok, ICM, equity, spot-motor, pontozás, ismétlés és tárolás, a spotbank ellenőrzése
node tools/check-spots.js js/data/spots-*.js -v     # spotok számai a motor szerint
node tools/equity.js Kc Jd "77+, ATs+, AJo+, KQs"   # equity kéz vs range
```

Új spot írásához lásd: [docs/SPOT_FORMAT.md](docs/SPOT_FORMAT.md). A betűtípusok a SIL Open Font License alatt állnak (`assets/fonts/`).
