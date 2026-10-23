/* i-learn-poker — Leitner-féle ismétlés (1/3/7/14/30 nap) */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  const INTERVALS = [1, 3, 7, 14, 30];
  const DAY = 86400000;

  /** Időpont ezredmásodpercben: szám, Date vagy ISO-szöveg (a próbálkozások `ts` mezője ISO). */
  function toMs(v) {
    if (v == null) return Date.now();
    if (typeof v === 'number') return isFinite(v) ? v : Date.now();
    const n = v instanceof Date ? v.getTime() : Date.parse(v);
    return isFinite(n) ? n : Date.now();
  }

  /** Egy próbálkozás „rendben volt-e” az ismétlés szempontjából: sikeres, és nem komoly hiba. */
  function passed(a) {
    return !!(a && a.success && a.grade !== 'blunder');
  }

  /** Új állapot egy próbálkozás után. Siker → egy dobozzal feljebb; hiba vagy komoly hiba → vissza az 1-esbe. */
  function next(entry, success, now) {
    const t = toMs(now);
    const box = success ? Math.min(5, (entry && entry.box ? entry.box : 1) + 1) : 1;
    return { box, due: t + INTERVALS[box - 1] * DAY, last: t, reps: ((entry && entry.reps) || 0) + 1 };
  }

  /** Az ismétlési állapot újraszámolása a próbálkozásokból, időrendben (törlés és import után). */
  function rebuild(attempts) {
    const out = {};
    (attempts || [])
      .filter((a) => a && a.spotId)
      .map((a) => ({ a, t: toMs(a.ts) }))
      .sort((x, y) => x.t - y.t)
      .forEach(({ a, t }) => {
        out[a.spotId] = next(out[a.spotId], passed(a), t);
      });
    return out;
  }

  /** Minden bejegyzésnek érvényes, számként tárolt esedékessége van? */
  function valid(srs) {
    return Object.values(srs || {}).every((e) => e && typeof e.due === 'number' && isFinite(e.due));
  }

  function isDue(entry, now) {
    return !!entry && entry.due <= toMs(now);
  }

  /** Esedékes spot-azonosítók, a legrégebben esedékes elöl. */
  function dueIds(srs, now) {
    const t = toMs(now);
    return Object.keys(srs || {})
      .filter((id) => srs[id] && srs[id].due <= t)
      .sort((a, b) => srs[a].due - srs[b].due);
  }

  function boxCounts(srs) {
    const c = [0, 0, 0, 0, 0];
    Object.values(srs || {}).forEach((e) => {
      if (e && e.box >= 1 && e.box <= 5) c[e.box - 1]++;
    });
    return c;
  }

  PK.srs = { INTERVALS, toMs, passed, next, rebuild, valid, isDue, dueIds, boxCounts };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.srs;
})(typeof window !== 'undefined' ? window : globalThis);
