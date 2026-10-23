/* i-learn-poker — értékelés: kulcsfaktorok, gondolkodási minőség, levonások, szint- és kategóriabecslés */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  const norm = (s) => (PK.util ? PK.util.norm(s) : String(s || '').toLowerCase());

  const CATEGORIES = [
    { code: 'PRE', name: 'Preflop range és open méret', short: 'Preflop' },
    { code: 'LMP', name: 'Limperek és iso-raise', short: 'Limperek' },
    { code: 'STK', name: 'Stackmélység és SPR', short: 'Stack/SPR' },
    { code: 'BBD', name: 'BB- és SB-védelem', short: 'BB-védelem' },
    { code: '3B', name: '3-bet, 4-bet, squeeze', short: '3-bet' },
    { code: 'CB', name: 'Heads-up c-bet és turn', short: 'C-bet' },
    { code: 'MW', name: 'Multiway potok', short: 'Multiway' },
    { code: 'RIV', name: 'River-döntések', short: 'River' },
    { code: 'PF', name: 'Push/fold és reshove', short: 'Push/fold' },
    { code: 'ICM', name: 'Buborék és ICM', short: 'ICM' },
    { code: 'FT', name: 'Döntőasztal és deal', short: 'Döntő' },
    { code: 'EXP', name: 'Exploit és tellek', short: 'Exploit' },
    { code: 'MEN', name: 'Mentál és bankroll', short: 'Mentál' },
  ];
  const CATEGORY_CODES = CATEGORIES.map((c) => c.code);
  const CAT = {};
  CATEGORIES.forEach((c) => {
    CAT[c.code] = c;
  });

  const LEVELS = [
    null,
    { n: 1, label: 'Kezdő', desc: 'a saját lap a fő szempont, a pozíció és a pot odds még ritkán jön elő.' },
    { n: 2, label: 'Hobbi-játékos', desc: 'figyel a pozícióra, alap pot oddsot számol, a preflop nagyjából chart-szerű.' },
    { n: 3, label: 'Tudatos klubjátékos', desc: 'big blindban gondolkodik, ismeri a push/foldot és az ellenfél-típusokat, az ICM-et alapszinten.' },
    { n: 4, label: 'Erős regular', desc: 'range-ekben gondolkodik, ismeri az SPR-t, a méretezés logikáját és a blockereket, érzi a risk premiumot.' },
    { n: 5, label: 'Haladó', desc: 'frekvenciákban gondolkodik, a bubble factort és a risk premiumot számszerűen kezeli, az ICM-et postflop is.' },
  ];

  const GRADE = {
    best: { pts: 60, label: 'Legjobb döntés' },
    good: { pts: 45, label: 'Elfogadható alternatíva' },
    minor: { pts: 20, label: 'Kis hiba' },
    blunder: { pts: 0, label: 'Komoly hiba' },
  };
  const SUCCESS = 70;

  // ---- felismerés ----
  const cache = new Map();
  function rx(src) {
    let r = cache.get(src);
    if (!r) {
      r = new RegExp(src, 'i');
      cache.set(src, r);
    }
    return r;
  }

  function conceptHits(text) {
    const t = norm(text);
    const out = new Set();
    const C = (PK.data && PK.data.concepts) || {};
    for (const id of Object.keys(C)) {
      if (C[id].re.some((s) => rx(s).test(t))) out.add(id);
    }
    return out;
  }

  /** Egy spot kulcsfaktorai közül melyek hangzottak el (1) és melyek nem (0). */
  function autoFactors(spot, text) {
    const t = norm(text);
    const hits = conceptHits(text);
    return (spot.factors || []).map((f) => {
      if (f.kw && f.kw.some((k) => rx(k).test(t))) return 1;
      return hits.has(f.c) ? 1 : 0;
    });
  }

  function autoQuality(text) {
    const t = norm(text);
    const hits = conceptHits(text);
    const quant =
      /\d+([.,]\d+)? ?(bb|bebe|%|szazalek|x)\b/.test(t) || ((hits.has('odds') || /\bpot ?odds/.test(t)) && /\d/.test(t));
    return { range: hits.has('range'), quant: !!quant, plan: hits.has('plan') };
  }

  function autoDeductions(text) {
    const t = norm(text);
    const D = (PK.data && PK.data.deduct) || {};
    const hits = conceptHits(text);
    const myth = hits.has('tells') && !hits.has('range') && !hits.has('odds') && !hits.has('profile');
    return {
      result: D.result ? rx(D.result).test(t) : false,
      tilt: D.tilt ? rx(D.tilt).test(t) : false,
      myth,
    };
  }

  /** Az egyezés környezete az eredeti szövegből, szóhatárra igazítva. */
  function context(orig, idx, len) {
    let a = Math.max(0, idx - 28);
    let b = Math.min(orig.length, idx + len + 28);
    if (a > 0) {
      const sp = orig.indexOf(' ', a);
      a = sp >= 0 && sp < idx ? sp + 1 : a;
    }
    if (b < orig.length) {
      const sp = orig.lastIndexOf(' ', b);
      b = sp > idx + len ? sp : b;
    }
    return (a > 0 ? '…' : '') + orig.slice(a, b).trim() + (b < orig.length ? '…' : '');
  }

  /** Árulkodó gondolkodási minták: általános markerek + a spot saját markerei. Az idézet az eredeti szövegből jön. */
  function flags(text, spot) {
    const U = PK.util;
    const orig = U ? U.tidy(text) : String(text || '');
    const t = U ? U.normKeep(orig) : orig.toLowerCase();
    if (!t.trim()) return [];
    const hits = conceptHits(orig);
    const out = [];
    const push = (cat, msg, m, extra) => {
      out.push(Object.assign({ cat, msg, quote: context(orig, m.index, m[0].length), key: cat + '|' + t.substr(m.index, m[0].length).trim() }, extra || {}));
    };
    for (const m of (PK.data && PK.data.markers) || []) {
      if (m.unless && m.unless.some((c) => hits.has(c))) continue;
      const mm = rx(m.re).exec(t);
      if (mm) push(m.cat, m.msg, mm);
    }
    if (spot && spot.markers) {
      for (const mk of spot.markers) {
        const src = typeof mk === 'string' ? mk : mk.re;
        if (!src) continue;
        let r;
        try {
          r = rx(src);
        } catch (e) {
          continue;
        }
        const mm = r.exec(t);
        if (mm) push(mk.cat || spot.cats[0], mk.msg || 'A spotra jellemző árulkodó mondat.', mm, { spot: spot.id });
      }
    }
    const seen = new Set();
    return out
      .filter((f) => {
        if (seen.has(f.key) || seen.has(f.cat + f.msg)) return false;
        seen.add(f.key);
        seen.add(f.cat + f.msg);
        return true;
      })
      .map((f) => {
        delete f.key;
        return f;
      });
  }

  // ---- pontozás ----
  /**
   * in: { grade, mode: 'full'|'quick', factorMarks: [0|0.5|1], quality: {range,quant,plan}, deductions: {result,tilt,myth} }
   */
  function score(spot, inp) {
    const action = GRADE[inp.grade] ? GRADE[inp.grade].pts : 0;
    if (inp.mode === 'quick') {
      const total = Math.round((action / 60) * 100);
      return { action, reasoning: null, factorsPts: null, qualityPts: null, deduct: 0, total, success: inp.grade === 'best' || inp.grade === 'good' };
    }
    const marks = inp.factorMarks || [];
    const nF = (spot.factors || []).length || 1;
    const sumF = marks.reduce((a, b) => a + (Number(b) || 0), 0);
    const factorsPts = 25 * Math.min(1, sumF / nF);
    const q = inp.quality || {};
    const qualityPts = 5 * ((q.range ? 1 : 0) + (q.quant ? 1 : 0) + (q.plan ? 1 : 0));
    const d = inp.deductions || {};
    const deduct = Math.min(15, 5 * ((d.result ? 1 : 0) + (d.tilt ? 1 : 0) + (d.myth ? 1 : 0)));
    const reasoning = factorsPts + qualityPts;
    const total = Math.max(0, Math.min(100, Math.round(action + reasoning - deduct)));
    return { action, reasoning, factorsPts, qualityPts, deduct, total, success: total >= SUCCESS };
  }

  // ---- összesítések ----
  function sortByTs(list) {
    return list.slice().sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  }

  /** Spotonként az első próbálkozás (diagnosztikus: még nem láttad a megoldást). */
  function firstAttempts(attempts) {
    const seen = new Map();
    for (const a of sortByTs(attempts)) if (!seen.has(a.spotId)) seen.set(a.spotId, a);
    return Array.from(seen.values());
  }

  /** Spotonként a legutóbbi próbálkozás (jelenlegi állapot). */
  function latestAttempts(attempts) {
    const seen = new Map();
    for (const a of sortByTs(attempts)) seen.set(a.spotId, a);
    return Array.from(seen.values());
  }

  /** Kategória-pontszámok 50-re húzott (Bayes-simított), nehézséggel súlyozott átlaggal. */
  function categoryScores(attempts, spotById) {
    const acc = {};
    CATEGORY_CODES.forEach((c) => {
      acc[c] = { sum: 0, w: 0, n: 0 };
    });
    for (const a of attempts) {
      const s = spotById(a.spotId);
      if (!s) continue;
      const w = s.diff || 1;
      for (const c of s.cats) {
        if (!acc[c]) continue;
        acc[c].sum += a.total * w;
        acc[c].w += w;
        acc[c].n += 1;
      }
    }
    const out = {};
    for (const c of CATEGORY_CODES) {
      const x = acc[c];
      out[c] = { score: (x.sum + 50 * 2) / (x.w + 2), n: x.n, raw: x.w ? x.sum / x.w : null };
    }
    return out;
  }

  /**
   * Szintbecslés az első próbálkozásokból. Egy nehézségi szint akkor „megvan”, ha legalább 3 spotból
   * legalább 70% sikeres. Szint = 1 + a megszerzett nehézségi szintek száma (alulról, megszakítás nélkül), max 5.
   */
  function levelEstimate(attempts, spotById) {
    const first = firstAttempts(attempts);
    const byDiff = {};
    for (let d = 1; d <= 5; d++) byDiff[d] = { n: 0, ok: 0 };
    let qSum = 0;
    let qN = 0;
    for (const a of first) {
      const s = spotById(a.spotId);
      if (!s) continue;
      const b = byDiff[s.diff];
      if (!b) continue;
      b.n++;
      if (a.success) b.ok++;
      if (a.mode === 'full' && a.qualityPts != null) {
        qSum += a.qualityPts;
        qN++;
      }
    }
    let mastered = 0;
    let missing = null;
    for (let d = 1; d <= 5; d++) {
      const b = byDiff[d];
      if (b.n < 3) {
        missing = { diff: d, need: 3 - b.n, reason: 'kevés adat' };
        break;
      }
      if (b.ok / b.n >= 0.7) mastered = d;
      else {
        missing = { diff: d, need: 0, reason: 'sikerarány 70% alatt' };
        break;
      }
    }
    const enough = byDiff[1].n >= 3;
    let level = Math.min(5, 1 + mastered);
    const qualityAvg = qN ? qSum / qN : null;
    const notes = [];
    if (qualityAvg != null && qN >= 5 && qualityAvg < 6 && level > 1) {
      level -= 1;
      notes.push('A gondolkodási minőség átlaga 6/15 alatt van, ezért eggyel lejjebb sorollak.');
    }
    let rising = false;
    const nextD = mastered + 1;
    if (qualityAvg != null && qualityAvg >= 12 && nextD <= 5) {
      const b = byDiff[nextD];
      if (b.n >= 2 && b.ok / b.n >= 0.5) rising = true;
    }
    return {
      enough,
      level,
      label: LEVELS[level].label,
      desc: LEVELS[level].desc,
      mastered,
      rising,
      byDiff,
      qualityAvg,
      qualityN: qN,
      missing,
      notes,
      firstN: first.length,
    };
  }

  PK.scoring = {
    CATEGORIES,
    CATEGORY_CODES,
    CAT,
    LEVELS,
    GRADE,
    SUCCESS,
    conceptHits,
    autoFactors,
    autoQuality,
    autoDeductions,
    flags,
    score,
    firstAttempts,
    latestAttempts,
    categoryScores,
    levelEstimate,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.scoring;
})(typeof window !== 'undefined' ? window : globalThis);
