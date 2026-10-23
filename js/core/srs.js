/* i-learn-poker — Leitner-féle ismétlés (1/3/7/14/30 nap) */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  const INTERVALS = [1, 3, 7, 14, 30];
  const DAY = 86400000;

  /** Új állapot egy próbálkozás után. Siker → egy dobozzal feljebb; hiba vagy komoly hiba → vissza az 1-esbe. */
  function next(entry, success, now) {
    const t = now || Date.now();
    const box = success ? Math.min(5, (entry && entry.box ? entry.box : 1) + 1) : 1;
    return { box, due: t + INTERVALS[box - 1] * DAY, last: t, reps: ((entry && entry.reps) || 0) + 1 };
  }

  function isDue(entry, now) {
    return !!entry && entry.due <= (now || Date.now());
  }

  /** Esedékes spot-azonosítók, a legrégebben esedékes elöl. */
  function dueIds(srs, now) {
    const t = now || Date.now();
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

  PK.srs = { INTERVALS, next, isDue, dueIds, boxCounts };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.srs;
})(typeof window !== 'undefined' ? window : globalThis);
