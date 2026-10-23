# Gyakorló spotok formátuma

Az alkalmazás a gyakorló helyzeteket (spotokat) egységes JS/JSON-objektumként tárolja. Ugyanebben a formában lehet **új spotokat importálni** (Adatok → Saját spotok importálása): például ha Claude az exportod alapján új, a gyenge pontjaidra szabott spotokat ír.

A beépített spotok a `js/data/spots-*.js` fájlokban vannak. Ellenőrzés:

```bash
node tools/check-spots.js js/data/spots-early.js --verbose
```

Ez kiírja, hogy a motor szerint mekkora a pot, mennyi a hívás, hány százalék equity kell, mekkora az effektív stack és az SPR. **A magyarázatokban szereplő számoknak ezzel kell egyezniük.**

## Mezők

| Mező | Kötelező | Leírás |
|---|---|---|
| `id` | igen | Egyedi azonosító, pl. `B09`. Importált spotnál legyen egyedi előtag, pl. `X-2026-11-01`. |
| `title` | igen | Rövid cím, pl. „KJo 22bb-s reshove ellen”. |
| `stage` | igen | `early` (korai, mély), `middle` (középső, BB ante), `bubble` (buborék, késői), `ft` (döntőasztal), `mental` (mentál/bankroll). |
| `cats` | igen | Kategóriakódok listája, az első a fő kategória: `PRE`, `LMP`, `STK`, `BBD`, `3B`, `CB`, `MW`, `RIV`, `PF`, `ICM`, `FT`, `EXP`, `MEN`. |
| `diff` | igen | Nehézség 1–5 (1: alapfogalom, 3: tudatos klubjátékos, 5: haladó ICM/frekvencia). |
| `basis` | igen | Az ajánlás alapja: `gto`, `exploit`, `icm`, `math`, `mental`, `concept`. |
| `conf` | igen | Mennyire biztos az ajánlás: `high`, `med`, `low`. Közeli döntésnél legyen `med` vagy `low`. |
| `ctx` | igen | Versenyhelyzet: `entrants`, `left`, `paid`, `level`, `blinds` (szöveg, pl. `'1000/2000'`), `ante` (pl. `'BBA 2000'` vagy `'nincs'`), `avgBb`, opcionálisan `note`. |
| `scene` | nem | 1–3 mondatos helyzetleírás (olvasat, előzmény, tell). |
| `table` | nem | Az asztal (lásd lent). Koncepció-kérdésnél elhagyható. |
| `check` | nem | Önellenőrzés: `pot`, `toCall`, `needEq` (tört, pl. `0.182`), `spr`, `eff`. A teszt összeveti a motorral. |
| `q` | igen | A kérdés, pl. „Mit lépsz?”. |
| `opts` | igen | 2–5 válaszlehetőség (lásd lent). |
| `ans` | igen | A megoldás egy mondatban. |
| `exp` | igen | Magyarázat 2–5 mondatban, konkrét számokkal. |
| `mist` | nem | Tipikus hibák ebben a helyzetben. |
| `factors` | igen | 3–5 kulcsfaktor, amit egy jó gondolkodásnak érintenie kell (lásd lent). |
| `markers` | nem | A spotra jellemző árulkodó mondatok (lásd lent). |
| `src` | igen | Forrás vagy alap (solver-konszenzus, Nash-chart, ICM-számítás, edzői forrás). |

### `table`

Minden összeg **big blindban (bb)** van.

```js
table: {
  players: 10,            // 2–10; a pozíciók: UTG, UTG+1, UTG+2, MP, LJ, HJ, CO, BTN, SB, BB (kevesebb játékosnál a végéről számolva)
  sb: 0.5, bb: 1,         // vakok bb-ben (100/100-as szintnél sb: 1)
  ante: 1, anteType: 'bba', // 'bba' = big blind ante (a BB fizeti, holt pénz), 'each' = mindenki, vagy ante: 0
  stacks: { default: 40, BB: 22 }, // a kéz ELEJÉN lévő stackek, vakok és ante előtt
  profiles: { BB: 'reg' },  // rec, reg, lag, nit, station, passive, maniac, cl, unknown
  reads: { BB: 'Agresszív, sokat reshove-ol.' }, // szabad szöveges olvasat (opcionális)
  hero: 'CO',
  cards: ['Kc', 'Jd'],    // rang: A K Q J T 9 … 2; szín: s ♠, h ♥, d ♦, c ♣
  board: [],              // 0, 3, 4 vagy 5 lap — az utcának megfelelően
  actions: [['CO', 'r', 2.2], ['BB', 'j']],
}
```

Kevesebb játékosnál a pozíciók: 9 → UTG, UTG+1, MP, LJ, HJ, CO, BTN, SB, BB; 8 → UTG, UTG+1, LJ, HJ, CO, BTN, SB, BB; 7 → UTG, LJ, HJ, CO, BTN, SB, BB; 6 → LJ, HJ, CO, BTN, SB, BB; 5 → HJ, CO, BTN, SB, BB; 4 → CO, BTN, SB, BB; 3 → BTN, SB, BB; 2 → SB (button), BB.

**Akciók:** `[pozíció, akció, összeg]`, utcaváltás: `'flop'`, `'turn'`, `'river'`.

| Kód | Jelentés | Összeg |
|---|---|---|
| `f` | fold | – |
| `x` | check | – |
| `c` | call | automatikus |
| `l` | limp (emeletlen preflop) | automatikus |
| `b` | bet | az utcán betett összeg |
| `r` | raise | az utcán betett **teljes** összeg (raise to) |
| `j` | all-in | automatikus |

Szabályok:
- Preflop a fel nem sorolt, sorra kerülő játékosok **automatikusan dobnak**; emeletlen potban a BB checkel.
- Postflop **minden** akciót ki kell írni, a valódi sorrendben (SB, BB, UTG, … BTN).
- A felsorolt akciók után a hősnek kell következnie. Ha nem így van, a motor hibát jelez.

### `opts`

```js
opts: [
  { id: 'fold', t: 'Fold', g: 'best' },
  { id: 'call', t: 'Call', g: 'blunder', why: 'Elsüllyedt költség: a már betett 2,2bb miatt hívnál.' },
]
```

`g` (értékelés): `best` (legjobb), `good` (elfogadható alternatíva), `minor` (kis hiba), `blunder` (komoly hiba). Vegyes stratégiánál több `best` is lehet. Minden nem `best` opcióhoz kötelező a `why`: mit árul el a gondolkodásodról, ha ezt választod.

### `factors`

```js
factors: [
  { c: 'range', t: 'A BB 22bb-s reshove range-e kb. 77+, ATs+, AJo+, KQs — ezt a KJo nem veri.' },
  { c: 'odds', t: '43,2% equity kell; a KJo kb. 30%-os.' },
  { c: 'stack', t: 'Te 45bb-vel fedezed, a hívás a stacked közel felébe kerül.', kw: ['fedez'] },
]
```

`c` a fogalom, amelyet a hangos gondolkodásban keresünk: `pos`, `stack`, `odds`, `range`, `profile`, `icm`, `board`, `spr`, `fe`, `sizing`, `blockers`, `plan`, `dom`, `implied`, `dead`, `init`, `mw`, `tilt`, `tells`, `bankroll`, `math`, `reshove`. A `kw` opcionális extra minta (ékezet nélküli, kisbetűs regex).

### `markers`

```js
markers: [{ re: '\\bmar beraktam', msg: 'Elsüllyedt költség: a betett zseton nem ok a hívásra.' }]
```

A minta ékezet nélküli, kisbetűs szövegen fut. Ha a hangos gondolkodásodban elhangzik, a profilban árulkodó jelként jelenik meg.
