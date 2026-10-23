/* i-learn-poker — adattárolás: localStorage (állapot) + IndexedDB (hangfelvételek), export/import */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  const KEY = 'ilp.state.v1';
  const SCHEMA = 'ilp_export_v1';

  function defaults() {
    return {
      v: 1,
      created: new Date().toISOString(),
      settings: {
        speech: true,
        record: true,
        lang: 'hu-HU',
        thinkSec: 60,
        fourColor: false,
        mode: 'full',
        field: 70,
        paidPct: 10,
        sessionSize: 10,
      },
      attempts: [],
      srs: {},
      drills: { pf: { n: 0, ok: 0, byPos: {}, best: 0 }, po: { n: 0, ok: 0, byType: {} } },
      liveHands: [],
      sessions: [],
      mhh: [],
      customSpots: [],
      plan: { start: null, checks: {} },
      peek: {}, // spotId → attemptId: a megoldást már láttad, de még nem mentetted a próbálkozást
    };
  }

  function merge(base, extra) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    for (const k of Object.keys(extra || {})) {
      const v = extra[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base && typeof base[k] === 'object' && !Array.isArray(base[k])) out[k] = merge(base[k], v);
      else out[k] = v;
    }
    return out;
  }

  let state = null;
  let saveTimer = null;
  let dirty = false; // van-e még ki nem írt változás ezen a lapon
  let byIdCache = null;
  let byIdKey = '';
  const listeners = new Set();

  function readStored() {
    let raw = null;
    try {
      raw = g.localStorage ? g.localStorage.getItem(KEY) : null;
    } catch (e) {
      raw = null;
    }
    let parsed = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch (e) {
      parsed = null;
    }
    const next = merge(defaults(), parsed || {});
    next.customSpots = (next.customSpots || []).map((sp) => (PK.spot && PK.spot.normalize ? PK.spot.normalize(sp) : sp));
    // A korábbi verzió szövegként tárolt dátumokból számolt esedékességet: ilyenkor újraszámoljuk.
    if (!PK.srs.valid(next.srs)) next.srs = PK.srs.rebuild(next.attempts);
    return next;
  }

  /** Az állapotobjektumot helyben cseréli, így a nézetekben eltárolt hivatkozások is az új adatot látják. */
  function replaceState(next) {
    if (!state) state = next;
    else {
      Object.keys(state).forEach((k) => delete state[k]);
      Object.assign(state, next);
    }
    byIdCache = null;
  }

  function load() {
    replaceState(readStored());
    dirty = false;
    return state;
  }

  /** Egy másik lapon történt mentés után: ha itt nincs ki nem írt változás, átvesszük a tárolt állapotot. */
  function syncFromStorage() {
    if (dirty) return false;
    replaceState(readStored());
    listeners.forEach((fn) => fn({ type: 'sync' }));
    return true;
  }

  /** Csak akkor ír, ha ezen a lapon tényleg változott valami — így egy régi, háttérben maradt lap nem írja felül a másikat. */
  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!dirty) return true;
    try {
      if (g.localStorage) g.localStorage.setItem(KEY, JSON.stringify(state));
      dirty = false;
      return true;
    } catch (e) {
      listeners.forEach((fn) => fn({ type: 'error', error: e }));
      return false;
    }
  }

  function save() {
    dirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 150);
    listeners.forEach((fn) => fn({ type: 'change' }));
  }

  function forceSave() {
    dirty = true;
    return saveNow();
  }

  function on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  // ---- spotok ----
  function allSpots() {
    const builtIn = (PK.data && PK.data.spots) || [];
    return builtIn.concat((state && state.customSpots) || []);
  }
  function spotById(id) {
    const all = allSpots();
    const key = all.length + ':' + ((state && state.customSpots.length) || 0);
    if (!byIdCache || byIdKey !== key) {
      byIdCache = new Map(all.map((s) => [s.id, s]));
      byIdKey = key;
    }
    return byIdCache.get(id) || null;
  }
  function isBuiltIn(id) {
    return ((PK.data && PK.data.spots) || []).some((s) => s.id === id);
  }

  /** Saját spotok importálása: lista vagy {spots: [...]}. Visszaad: {added, replaced, errors} */
  function importSpots(input) {
    const list = Array.isArray(input) ? input : input && Array.isArray(input.spots) ? input.spots : null;
    if (!list) return { added: 0, replaced: 0, errors: ['A fájlban nem találok spotlistát (tömb vagy { "spots": [...] } kell).'] };
    const errors = [];
    let added = 0;
    let replaced = 0;
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') {
        errors.push('Egy elem nem objektum.');
        continue;
      }
      const sp = PK.spot.normalize(raw);
      if (sp.id && isBuiltIn(sp.id)) {
        errors.push(sp.id + ': ez az azonosító foglalt a beépített spotoknál — adj neki egyedi előtagot (pl. X-).');
        continue;
      }
      const errs = PK.spot.validate(sp);
      if (errs.length) {
        errors.push.apply(errors, errs.slice(0, 4));
        continue;
      }
      const clean = JSON.parse(JSON.stringify(sp));
      clean.custom = true;
      const i = state.customSpots.findIndex((x) => x.id === clean.id);
      if (i >= 0) {
        state.customSpots[i] = clean;
        replaced++;
      } else {
        state.customSpots.push(clean);
        added++;
      }
    }
    byIdCache = null;
    save();
    return { added, replaced, errors };
  }

  function removeCustomSpot(id) {
    state.customSpots = state.customSpots.filter((s) => s.id !== id);
    byIdCache = null;
    save();
  }

  // ---- próbálkozások ----
  /** A megoldás megjelenésekor: ha ez a próbálkozás nem kerül mentésre, a spot következő próbálkozása már nem diagnosztikus. */
  function markPeek(spotId, attemptId) {
    if (!state.peek) state.peek = {};
    if (state.peek[spotId] === attemptId) return;
    state.peek[spotId] = attemptId;
    save();
  }

  function addAttempt(a) {
    const pk = state.peek && state.peek[a.spotId];
    if (pk) {
      if (pk !== a.id) a.peeked = true;
      delete state.peek[a.spotId];
    }
    state.attempts.push(a);
    state.srs[a.spotId] = PK.srs.next(state.srs[a.spotId], PK.srs.passed(a), a.ts);
    if (!state.plan.start) state.plan.start = PK.util.isoDate();
    save();
  }

  function deleteAttempt(id) {
    const a = state.attempts.find((x) => x.id === id);
    state.attempts = state.attempts.filter((x) => x.id !== id);
    if (a && a.audio) Object.values(a.audio).forEach((v) => [].concat(v || []).forEach((k) => k && audio.del(k)));
    state.srs = PK.srs.rebuild(state.attempts);
    save();
  }

  // ---- export / import ----
  function exportObject() {
    const S = state;
    const level = PK.scoring.levelEstimate(S.attempts, spotById);
    const cats = PK.scoring.categoryScores(PK.scoring.latestAttempts(S.attempts), spotById);
    const attempts = S.attempts.map((a) => {
      const sp = spotById(a.spotId);
      const best = sp ? sp.opts.filter((o) => o.g === 'best').map((o) => o.t) : [];
      return Object.assign({}, a, {
        spot: sp ? { title: sp.title, cats: sp.cats, diff: sp.diff, stage: sp.stage, recommended: best, chosen: (sp.opts.find((o) => o.id === a.choice) || {}).t } : null,
      });
    });
    return {
      schema: SCHEMA,
      app: 'i-learn-poker',
      exported: new Date().toISOString(),
      player: { venue: 'Duna Poker Center (Budapest)', format: '10 fős élő MTT, 50–120 nevező' },
      settings: S.settings,
      summary: {
        level: { level: level.level, label: level.label, enough: level.enough, mastered: level.mastered, rising: level.rising, qualityAvg: level.qualityAvg, byDiff: level.byDiff },
        categories: cats,
        attempts: S.attempts.length,
      },
      attempts,
      srs: S.srs,
      drills: S.drills,
      liveHands: S.liveHands,
      sessions: S.sessions,
      mhh: S.mhh,
      customSpots: S.customSpots,
      plan: S.plan,
    };
  }

  /** mode: 'merge' (azonosító szerint összefésül) | 'replace' (mindent felülír) */
  function importObject(obj, mode) {
    if (!obj || obj.schema !== SCHEMA) throw new Error('Ez nem az i-learn-poker exportfájlja (hiányzik a "schema": "' + SCHEMA + '").');
    const incoming = merge(defaults(), {
      settings: obj.settings,
      attempts: (obj.attempts || []).map((a) => {
        const c = Object.assign({}, a);
        delete c.spot;
        return c;
      }),
      srs: obj.srs || {},
      drills: obj.drills,
      liveHands: obj.liveHands || [],
      sessions: obj.sessions || [],
      mhh: obj.mhh || [],
      customSpots: obj.customSpots || [],
      plan: obj.plan,
    });
    if (mode === 'replace') {
      replaceState(incoming);
    } else {
      const byId = (list, extra) => {
        const m = new Map(list.map((x) => [x.id, x]));
        extra.forEach((x) => m.set(x.id, x));
        return Array.from(m.values());
      };
      state.attempts = byId(state.attempts, incoming.attempts).sort((a, b) => (a.ts < b.ts ? -1 : 1));
      state.liveHands = byId(state.liveHands, incoming.liveHands);
      state.sessions = byId(state.sessions, incoming.sessions);
      state.mhh = byId(state.mhh, incoming.mhh);
      state.customSpots = byId(state.customSpots, incoming.customSpots);
      if (!state.plan.start) state.plan.start = incoming.plan.start;
      state.plan.checks = Object.assign({}, incoming.plan.checks || {}, state.plan.checks || {});
      // a drillstatisztikából a több feladatot tartalmazó változat marad (egy mentés kétszeri betöltése se duplázzon)
      ['pf', 'po'].forEach((k) => {
        const a = state.drills[k] || {};
        const b = (incoming.drills && incoming.drills[k]) || {};
        if ((b.n || 0) > (a.n || 0)) state.drills[k] = b;
      });
      // új eszközön (alapbeállításokkal) a mentés beállításai érvényesek
      if (obj.settings && JSON.stringify(state.settings) === JSON.stringify(defaults().settings)) state.settings = incoming.settings;
    }
    // Az ismétlési ütemezés mindig a (most már összefésült) próbálkozásokból következik.
    state.srs = PK.srs.rebuild(state.attempts);
    byIdCache = null;
    forceSave();
    listeners.forEach((fn) => fn({ type: 'change' }));
    return state;
  }

  function reset() {
    replaceState(defaults());
    forceSave();
    audio.clear();
    listeners.forEach((fn) => fn({ type: 'change' }));
  }

  function usage() {
    try {
      const raw = g.localStorage ? g.localStorage.getItem(KEY) || '' : '';
      return raw.length * 2;
    } catch (e) {
      return 0;
    }
  }

  // ---- IndexedDB a hangfelvételekhez ----
  const DB = 'ilp-audio';
  const STORE = 'clips';
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!g.indexedDB) return reject(new Error('Ez a böngésző nem támogatja az IndexedDB-t.'));
      const req = g.indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(
      (d) =>
        new Promise((resolve, reject) => {
          const t = d.transaction(STORE, mode);
          const st = t.objectStore(STORE);
          const r = fn(st);
          t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
          t.onerror = () => reject(t.error);
        }),
    );
  }
  const audio = {
    put: (key, blob) => tx('readwrite', (s) => s.put(blob, key)),
    get: (key) => tx('readonly', (s) => s.get(key)),
    del: (key) => tx('readwrite', (s) => s.delete(key)).catch(() => {}),
    clear: () => tx('readwrite', (s) => s.clear()).catch(() => {}),
    keys: () => tx('readonly', (s) => s.getAllKeys()),
  };

  PK.store = {
    KEY,
    SCHEMA,
    defaults,
    load,
    save,
    saveNow,
    forceSave,
    syncFromStorage,
    on,
    get state() {
      return state;
    },
    allSpots,
    spotById,
    isBuiltIn,
    importSpots,
    removeCustomSpot,
    markPeek,
    addAttempt,
    deleteAttempt,
    exportObject,
    importObject,
    reset,
    usage,
    audio,
  };
})(typeof window !== 'undefined' ? window : globalThis);
