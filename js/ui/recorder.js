/* i-learn-poker — hangos gondolkodás panel: zseton-időzítős felvételgomb + élő átirat */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.ui = PK.ui || {};
  const esc = (s) => PK.util.esc(s);
  const SEGS = 12;

  function chipSvg() {
    let s = '<svg viewBox="0 0 84 84" aria-hidden="true">';
    s += '<circle class="chip-body" cx="42" cy="42" r="40"/>';
    s += '<circle class="chip-level" cx="42" cy="42" r="0"/>';
    for (let i = 0; i < SEGS; i++) {
      const a0 = ((i * 360) / SEGS - 90 + 4) * (Math.PI / 180);
      const a1 = (((i + 1) * 360) / SEGS - 90 - 4) * (Math.PI / 180);
      const r = 34;
      s +=
        '<path class="chip-seg" data-seg="' + i + '" d="M' + (42 + r * Math.cos(a0)).toFixed(2) + ' ' + (42 + r * Math.sin(a0)).toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + (42 + r * Math.cos(a1)).toFixed(2) + ' ' + (42 + r * Math.sin(a1)).toFixed(2) + '"/>';
    }
    s += '<path class="chip-icon" d="M42 26a6 6 0 0 1 6 6v10a6 6 0 0 1-12 0V32a6 6 0 0 1 6-6zm-11 15h3a8 8 0 0 0 16 0h3a11 11 0 0 1-9.5 10.9V56h-3v-4.1A11 11 0 0 1 31 41z"/>';
    s += '</svg>';
    return s;
  }

  function fmtClock(sec) {
    const s = Math.max(0, Math.floor(sec));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  /**
   * opts: { id, title, desc, placeholder, value, clockSec, prompts: [] }
   */
  function html(o) {
    const sup = PK.speech.support();
    const set = PK.store.state.settings;
    const voice = (set.speech && sup.recognition) || (set.record && sup.recorder);
    let h = '<section class="think" id="' + esc(o.id) + '">';
    h += '<div class="think__head">';
    h += '<button type="button" class="chipbtn" data-rec="toggle" aria-pressed="false" aria-label="Felvétel indítása"' + (voice ? '' : ' disabled') + '>' + chipSvg() + '</button>';
    h += '<div><h3>' + esc(o.title) + '</h3><p>' + esc(o.desc || '') + '</p></div>';
    if (o.clockSec) h += '<div class="timer" data-rec="clock" aria-label="Eltelt idő">0:00</div>';
    h += '</div>';
    if (o.prompts && o.prompts.length) h += '<ol class="prompts">' + o.prompts.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ol>';
    h += '<div class="transcript"><label class="sr-only" for="' + esc(o.id) + '-ta">' + esc(o.title) + '</label>';
    h += '<textarea id="' + esc(o.id) + '-ta" data-rec="text" placeholder="' + esc(o.placeholder || '') + '">' + esc(o.value || '') + '</textarea>';
    h += '<div class="interim" data-rec="interim" aria-live="polite"></div>';
    h += '<div class="mic-status" data-rec="status">' + esc(statusHint(sup, set)) + '</div></div>';
    h += '</section>';
    return h;
  }

  function statusHint(sup, set) {
    if (sup.framed && !sup.recognition) return 'Beágyazott nézetben a mikrofon gyakran nem érhető el — nyisd meg az oldalt közvetlenül. Addig írhatsz vagy diktálhatsz a billentyűzettel.';
    if (!set.speech && !set.record) return 'A hang ki van kapcsolva a Beállításokban — írd be a gondolataidat.';
    if (!sup.recognition && sup.recorder) return 'Ez a böngésző nem ír át élőben: a hangot rögzítem, a szöveget írd vagy diktáld be (pl. a telefon billentyűzetével).';
    if (!sup.recognition && !sup.recorder) return 'Ez a böngésző nem tud hangot rögzíteni — írd be vagy diktáld be a gondolataidat.';
    return 'Nyomd meg a zsetont (vagy az R billentyűt), és mondj ki mindent, ami eszedbe jut. A szöveget utólag javíthatod.';
  }

  /**
   * root: a .think elem. opts: { clockSec, audioKey (string), onState }
   * Visszaad: { toggle, start, stop, text, setText, elapsed, audioKey, destroy }
   */
  function mount(root, opts) {
    const o = opts || {};
    const btn = root.querySelector('[data-rec="toggle"]');
    const ta = root.querySelector('[data-rec="text"]');
    const interim = root.querySelector('[data-rec="interim"]');
    const status = root.querySelector('[data-rec="status"]');
    const clock = root.querySelector('[data-rec="clock"]');
    const segs = Array.from(root.querySelectorAll('.chip-seg'));
    const level = root.querySelector('.chip-level');
    const set = PK.store.state.settings;
    const t0 = Date.now();
    let timer = null;
    let savedKey = null;
    let busy = false;

    function paintClock() {
      const el = (Date.now() - t0) / 1000;
      if (clock) {
        const over = o.clockSec && el > o.clockSec;
        clock.textContent = over ? '+' + fmtClock(el - o.clockSec) : fmtClock(el);
        clock.classList.toggle('is-over', !!over);
      }
      if (o.clockSec) {
        const k = Math.min(SEGS, Math.floor((el / o.clockSec) * SEGS));
        const over = el > o.clockSec;
        segs.forEach((s, i) => {
          s.classList.toggle('is-on', i < k && !over);
          s.classList.toggle('is-over', over);
        });
      }
    }
    if (o.clockSec || clock) {
      paintClock();
      timer = setInterval(paintClock, 250);
    }

    function setStatus(msg, kind) {
      status.textContent = msg;
      status.classList.toggle('is-warn', kind === 'warn');
      status.classList.toggle('is-bad', kind === 'bad');
    }

    const session = PK.speech.create({
      lang: set.lang || 'hu-HU',
      speech: !!set.speech,
      record: !!set.record,
      onText: (seg) => {
        const cur = ta.value.replace(/\s+$/, '');
        ta.value = (cur ? cur + ' ' : '') + seg;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      },
      onInterim: (txt) => {
        interim.textContent = txt;
      },
      onLevel: (v) => {
        if (level) level.setAttribute('r', (8 + v * 32).toFixed(1));
      },
      onWarn: (m) => setStatus(m, 'warn'),
      onError: (m) => setStatus(m, 'bad'),
      onState: (s) => {
        const on = s === 'recording';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', on ? 'Felvétel leállítása' : 'Felvétel indítása');
        if (on) setStatus(set.speech && PK.speech.support().recognition ? 'Figyelek… beszélj nyugodtan, a szöveg alább jelenik meg.' : 'Rögzítem a hangot. A szöveget írd vagy diktáld be.');
        if (o.onState) o.onState(s);
      },
    });

    async function start() {
      if (busy || session.active) return;
      busy = true;
      try {
        await session.start();
      } finally {
        busy = false;
      }
    }

    async function stop() {
      if (!session.active) return null;
      const res = await session.stop();
      interim.textContent = '';
      if (res.blob && o.audioKey) {
        try {
          await PK.store.audio.put(o.audioKey, res.blob);
          savedKey = o.audioKey;
          setStatus('Felvétel mentve (' + Math.round(res.ms / 1000) + ' mp). A szöveget most még javíthatod.');
        } catch (e) {
          setStatus('A hangot nem tudtam elmenteni ezen az eszközön; a szöveg megmaradt.', 'warn');
        }
      } else {
        setStatus('Leállítva. A szöveget most még javíthatod.');
      }
      return res;
    }

    function toggle() {
      return session.active ? stop() : start();
    }

    btn.addEventListener('click', toggle);

    return {
      toggle,
      start,
      stop,
      get active() {
        return session.active;
      },
      text: () => ta.value.trim(),
      setText: (v) => {
        ta.value = v || '';
      },
      elapsed: () => (Date.now() - t0) / 1000,
      get audioKey() {
        return savedKey;
      },
      destroy: () => {
        clearInterval(timer);
        if (session.active) session.stop();
      },
    };
  }

  PK.ui.recorder = { html, mount, fmtClock };
})(typeof window !== 'undefined' ? window : globalThis);
