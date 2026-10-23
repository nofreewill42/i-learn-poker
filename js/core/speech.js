/* i-learn-poker — hangfelvétel (MediaRecorder) + élő beszédfelismerés (Web Speech API, magyar) */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  const SR = g.SpeechRecognition || g.webkitSpeechRecognition || null;

  const MSG = {
    'not-allowed': 'A mikrofon le van tiltva ennél az oldalnál. Engedélyezd a böngésző címsorában (a lakat vagy a mikrofon ikonnál), vagy írd be a gondolataidat.',
    NotAllowedError: 'A mikrofon le van tiltva ennél az oldalnál. Engedélyezd a böngésző címsorában (a lakat vagy a mikrofon ikonnál), vagy írd be a gondolataidat.',
    'service-not-allowed': 'A beszédfelismerés itt nem engedélyezett. Nyisd meg az oldalt közvetlenül (nem beágyazva) Chrome-ban vagy Edge-ben; addig a telefonod diktálását is használhatod a szövegmezőben.',
    network: 'A beszédfelismeréshez internet kell (a böngésző a szerverén alakítja szöveggé a hangot). A hangfelvétel ettől még megy.',
    'audio-capture': 'Nem érem el a mikrofont a felismeréshez.',
    'language-not-supported': 'A magyar beszédfelismerés nem érhető el ebben a böngészőben. Használd a telefon diktálását a szövegmezőben.',
    NotFoundError: 'Nem találok mikrofont ezen az eszközön.',
    NotReadableError: 'A mikrofont most egy másik alkalmazás használja.',
    SecurityError: 'A mikrofon csak biztonságos (https) oldalon érhető el.',
  };

  function support() {
    const nav = g.navigator || {};
    return {
      recognition: !!SR,
      recorder: !!(nav.mediaDevices && nav.mediaDevices.getUserMedia && g.MediaRecorder),
      secure: g.isSecureContext !== false,
      framed: (function () {
        try {
          return g.self !== g.top;
        } catch (e) {
          return true;
        }
      })(),
    };
  }

  function pickMime() {
    if (!g.MediaRecorder || !g.MediaRecorder.isTypeSupported) return '';
    const c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const m of c) if (g.MediaRecorder.isTypeSupported(m)) return m;
    return '';
  }

  /**
   * opts: { lang, speech: bool, record: bool, onText(seg), onInterim(text), onState(state), onLevel(0..1), onWarn(msg), onError(msg) }
   */
  function create(opts) {
    const o = Object.assign({ lang: 'hu-HU', speech: true, record: true }, opts || {});
    const sup = support();
    let active = false;
    let stopping = false;
    let rec = null;
    let mr = null;
    let stream = null;
    let chunks = [];
    let mime = '';
    let t0 = 0;
    let restarts = 0;
    let lastStart = 0;
    let ctx = null;
    let raf = 0;
    let recognitionOn = false;
    let finalText = '';

    const emit = (k, v) => {
      if (typeof o[k] === 'function') o[k](v);
    };

    function startRecognition() {
      if (!SR || !o.speech) return;
      rec = new SR();
      rec.lang = o.lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (ev) => {
        let interim = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          const txt = r[0] && r[0].transcript ? r[0].transcript : '';
          if (r.isFinal) {
            const seg = txt.trim();
            if (seg) {
              finalText += (finalText ? ' ' : '') + seg;
              emit('onText', seg);
            }
          } else interim += txt;
        }
        emit('onInterim', interim.trim());
      };
      rec.onerror = (ev) => {
        const code = ev.error;
        if (code === 'no-speech' || code === 'aborted') return;
        if (code === 'audio-capture' && mr && mr.state === 'recording') {
          // néhány telefonon a felvétel és a felismerés nem használhatja egyszerre a mikrofont
          stopRecorder();
          emit('onWarn', 'Ezen az eszközön a hangfelvétel és a felismerés egyszerre nem megy, ezért a felvételt leállítottam — a felismerés fut tovább.');
          return;
        }
        recognitionOn = false;
        emit(code === 'network' ? 'onWarn' : 'onError', MSG[code] || 'Beszédfelismerési hiba: ' + code);
        if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'language-not-supported') o.speech = false;
      };
      rec.onend = () => {
        emit('onInterim', '');
        if (active && !stopping && o.speech) {
          const quick = Date.now() - lastStart < 1500;
          restarts = quick ? restarts + 1 : 0;
          if (restarts > 6) {
            emit('onWarn', 'A beszédfelismerés többször leállt. A felvétel megy tovább; a szöveget utólag is beírhatod.');
            return;
          }
          setTimeout(() => {
            if (active && !stopping) {
              try {
                lastStart = Date.now();
                rec.start();
              } catch (e) {
                /* már fut */
              }
            }
          }, quick ? 400 : 60);
        }
      };
      try {
        lastStart = Date.now();
        rec.start();
        recognitionOn = true;
      } catch (e) {
        emit('onError', 'A beszédfelismerés nem indult el: ' + (e.message || e));
      }
    }

    function meter(s) {
      try {
        const AC = g.AudioContext || g.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        const src = ctx.createMediaStreamSource(s);
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        src.connect(an);
        const buf = new Uint8Array(an.fftSize);
        const loop = () => {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          emit('onLevel', Math.min(1, Math.sqrt(sum / buf.length) * 3.2));
          raf = g.requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        /* a szintjelző nem kötelező */
      }
    }

    function stopRecorder() {
      return new Promise((resolve) => {
        if (!mr || mr.state === 'inactive') return resolve();
        mr.onstop = () => resolve();
        try {
          mr.stop();
        } catch (e) {
          resolve();
        }
      }).then(() => {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        if (raf) g.cancelAnimationFrame(raf);
        raf = 0;
        if (ctx && ctx.close) ctx.close().catch(() => {});
        ctx = null;
        emit('onLevel', 0);
      });
    }

    async function start() {
      if (active) return;
      active = true;
      stopping = false;
      chunks = [];
      finalText = '';
      t0 = Date.now();
      emit('onState', 'starting');
      if (o.record && sup.recorder) {
        try {
          stream = await g.navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
          mime = pickMime();
          mr = mime ? new g.MediaRecorder(stream, { mimeType: mime }) : new g.MediaRecorder(stream);
          mime = mr.mimeType || mime || 'audio/webm';
          mr.ondataavailable = (e) => {
            if (e.data && e.data.size) chunks.push(e.data);
          };
          mr.start(1000);
          meter(stream);
        } catch (e) {
          const msg = MSG[e.name] || 'A hangfelvétel nem indult el: ' + (e.message || e.name);
          emit(e.name === 'NotAllowedError' ? 'onError' : 'onWarn', msg);
          mr = null;
          if (e.name === 'NotAllowedError') {
            active = false;
            emit('onState', 'idle');
            return;
          }
        }
      }
      startRecognition();
      if (!mr && !recognitionOn) {
        active = false;
        emit('onState', 'idle');
        if (!sup.recognition && !sup.recorder) emit('onError', 'Ez a böngésző nem tud hangot rögzíteni. Írd be a gondolataidat, vagy használd a telefon diktálását.');
        return;
      }
      emit('onState', 'recording');
    }

    async function stop() {
      if (!active) return { blob: null, mime: '', ms: 0, text: finalText };
      stopping = true;
      active = false;
      // a felismerés az utolsó mondatot a leállítás után küldi: megvárjuk az 'end' eseményt (legfeljebb 1,5 mp)
      const ended = new Promise((resolve) => {
        if (!rec || !recognitionOn) return resolve();
        const done = () => resolve();
        rec.addEventListener('end', done, { once: true });
        setTimeout(done, 1500);
      });
      if (rec) {
        try {
          rec.stop();
        } catch (e) {
          /* nem futott */
        }
      }
      await Promise.all([ended, stopRecorder()]);
      const ms = Date.now() - t0;
      const blob = chunks.length ? new Blob(chunks, { type: mime || 'audio/webm' }) : null;
      emit('onState', 'idle');
      return { blob, mime, ms, text: finalText };
    }

    return {
      start,
      stop,
      get active() {
        return active;
      },
    };
  }

  PK.speech = { support, create, MSG };
})(typeof window !== 'undefined' ? window : globalThis);
