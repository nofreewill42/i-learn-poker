/* i-learn-poker — Adatok: elemzés Claude-dal, saját spotok, mentés/visszaállítás, beállítások, mikrofon-teszt */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.views = PK.views || {};
  const esc = (s) => PK.util.esc(s);

  function view(main) {
    const sup = PK.speech.support();
    let rec = null;
    let days = 14;

    function render() {
      // mindig a friss állapotból: törlés vagy visszaállítás után is
      const S = PK.store.state;
      const set = S.settings;
      let h = '<div class="page-head"><div><h1>Adatok és beállítások</h1><p>Minden adatod ebben a böngészőben marad. Innen viszed át Claude-hoz elemzésre, és innen hozod vissza az új spotokat.</p></div></div>';

      h += '<div class="section"><h2>Elemzés Claude-dal</h2><ol style="padding-left:1.2em">';
      h += '<li>Másold ki vagy töltsd le az összefoglalót: benne vannak a döntéseid, a hangos gondolkodásod átiratai, az élő kezeid és a naplód — és maga a kérés is.</li>';
      h += '<li>Illeszd be egy új Claude-beszélgetésbe. Claude megnevezi a leakjeidet, megbecsüli a szinted, ad egy kéthetes tervet és 10 új spotot.</li>';
      h += '<li>Claude válaszát másold be lent a „Saját spotok” mezőbe: az app kikeresi belőle a spotokat.</li></ol>';
      h += '<div class="row"><div class="seg" role="group" aria-label="Időszak">' + [
        [14, 'Utolsó 14 nap'],
        [30, 'Utolsó 30 nap'],
        [0, 'Minden'],
      ]
        .map(([d, l]) => '<button type="button" data-act="days" data-v="' + d + '" aria-pressed="' + (days === d) + '">' + l + '</button>')
        .join('') + '</div></div>';
      h += '<div class="row" style="margin-top:12px"><button type="button" class="btn btn--primary" data-act="md-copy">' + PK.ui.icons.copy + 'Összefoglaló másolása</button><button type="button" class="btn" data-act="md-dl">' + PK.ui.icons.down + 'Letöltés (.md)</button></div></div>';

      h += '<div class="section"><h2>Saját spotok importálása</h2><p class="small muted">Illeszd be Claude válaszát (a JSON-kódblokkal együtt), vagy tölts fel egy .json fájlt. Minden spotot a saját motorommal ellenőrzök: ha egy szám vagy akciósorrend nem stimmel, kihagyom, és megmondom, miért. A formátum leírása: docs/SPOT_FORMAT.md.</p>';
      h += '<textarea data-f="spots-in" placeholder="[ { &quot;id&quot;: &quot;X-01&quot;, … } ]" style="min-height:120px"></textarea>';
      h += '<div class="row" style="margin-top:10px"><button type="button" class="btn btn--primary" data-act="spots-import">Spotok importálása</button><label class="btn"><input type="file" accept=".json,application/json,text/plain" data-act="spots-file" class="sr-only">' + PK.ui.icons.up + 'Fájl választása</label></div><div id="imp-out" aria-live="polite"></div>';
      if (S.customSpots.length) {
        h += '<h3 style="margin-top:16px">Saját spotjaid (' + S.customSpots.length + ')</h3><ul class="hist">';
        S.customSpots.forEach((s) => (h += '<li><div><a href="#/profil/spot/' + encodeURIComponent(s.id) + '">' + esc(s.title) + '</a><div class="meta">' + esc(s.id + ', ' + s.cats.join('/') + ', ' + s.diff + '. szint') + '</div></div><div><button type="button" class="btn btn--sm btn--ghost" data-act="spot-del" data-id="' + esc(s.id) + '" aria-label="Törlés">' + PK.ui.icons.trash + '</button></div></li>'));
        h += '</ul><button type="button" class="btn btn--sm" data-act="spots-train">Saját spotok gyakorlása</button>';
      }
      h += '</div>';

      h += '<div class="section"><h2>Mentés és visszaállítás</h2><p class="small muted">A teljes mentés JSON-fájlba kerül (hangfelvételek nélkül). Ezzel viszed át az adataidat másik eszközre vagy böngészőre.</p>';
      h += '<div class="row"><button type="button" class="btn" data-act="json-dl">' + PK.ui.icons.down + 'Teljes mentés (.json)</button><label class="btn"><input type="file" accept=".json,application/json" data-act="json-file" class="sr-only">' + PK.ui.icons.up + 'Visszaállítás fájlból</label>';
      h += '<label class="check small"><input type="checkbox" data-f="replace"> felülírja a mostani adatokat (alapból összefésül)</label></div><div id="json-out" aria-live="polite"></div></div>';

      h += '<div class="section"><h2>Beállítások</h2><div class="form-grid form-grid--2">';
      h += '<label class="check"><input type="checkbox" data-set="speech"' + (set.speech ? ' checked' : '') + '><span>Élő beszédfelismerés (a böngésző szerverén alakul szöveggé)</span></label>';
      h += '<label class="check"><input type="checkbox" data-set="record"' + (set.record ? ' checked' : '') + '><span>Hangfelvétel mentése ebbe a böngészőbe</span></label>';
      h += '<label class="field">Felismerés nyelve<select data-set="lang"><option value="hu-HU"' + (set.lang === 'hu-HU' ? ' selected' : '') + '>Magyar</option><option value="en-US"' + (set.lang === 'en-US' ? ' selected' : '') + '>Angol</option></select></label>';
      h += '<label class="field">Gondolkodási idő (mp)<select data-set="thinkSec">' + [30, 45, 60, 90, 120].map((v) => '<option' + (Number(set.thinkSec) === v ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>';
      h += '<label class="field">Spot egy körben<select data-set="sessionSize">' + [5, 10, 15, 20].map((v) => '<option' + (Number(set.sessionSize) === v ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>';
      h += '<label class="field">Téma<select data-set="theme">' + [
        ['system', 'A rendszer szerint'],
        ['light', 'Világos'],
        ['dark', 'Sötét'],
      ]
        .map(([v, l]) => '<option value="' + v + '"' + ((set.theme || 'system') === v ? ' selected' : '') + '>' + l + '</option>')
        .join('') + '</select></label>';
      h += '<label class="check"><input type="checkbox" data-set="fourColor"' + (set.fourColor ? ' checked' : '') + '><span>Négyszínű pakli (♦ kék, ♣ zöld)</span></label>';
      h += '</div></div>';

      h += '<div class="section"><h2>Mikrofon-teszt</h2><table class="t"><tbody>';
      h += '<tr><td>Élő beszédfelismerés</td><td>' + (sup.recognition ? '<span class="tag tag--ok">elérhető</span>' : '<span class="tag tag--warn">nem elérhető</span> — Chrome vagy Edge kell, vagy a telefon diktálása') + '</td></tr>';
      h += '<tr><td>Hangfelvétel</td><td>' + (sup.recorder ? '<span class="tag tag--ok">elérhető</span>' : '<span class="tag tag--warn">nem elérhető</span>') + '</td></tr>';
      h += '<tr><td>Biztonságos kapcsolat (https)</td><td>' + (sup.secure ? '<span class="tag tag--ok">igen</span>' : '<span class="tag tag--bad">nem</span> — a mikrofon csak https-en vagy helyben működik') + '</td></tr>';
      h += '<tr><td>Beágyazott nézet</td><td>' + (sup.framed ? '<span class="tag tag--warn">igen</span> — nyisd meg az oldalt közvetlenül' : '<span class="tag tag--ok">nem</span>') + '</td></tr>';
      h += '</tbody></table>';
      h += PK.ui.recorder.html({ id: 'rec-test', title: 'Próbáld ki', desc: 'Mondj egy mondatot pókerszlenggel, pl. „UTG-ről nyitott, a BB-ből védekezem, 18 százalék kell”.', placeholder: 'Itt jelenik meg a szöveg.' });
      h += '</div>';

      h += '<div class="section"><h2>Tárhely</h2><p>Szöveges adatok: ' + PK.util.num(PK.store.usage() / 1024, 0) + ' kB. Próbálkozások: ' + S.attempts.length + ', élő kezek: ' + S.liveHands.length + ', versenyek: ' + S.sessions.length + '.</p>';
      h += '<div class="row"><button type="button" class="btn" data-act="audio-clear">' + PK.ui.icons.trash + 'Hangfelvételek törlése</button><button type="button" class="btn btn--danger" data-act="reset">' + PK.ui.icons.trash + 'Minden adat törlése</button></div></div>';
      main.innerHTML = h;
      if (rec) rec.destroy();
      rec = PK.ui.recorder.mount(main.querySelector('#rec-test'), {});
    }

    function importSpotsText(text) {
      const out = main.querySelector('#imp-out');
      let data;
      try {
        data = PK.ui.extractJson(text);
      } catch (e) {
        out.innerHTML = '<div class="notice notice--bad"><p>' + esc(e.message) + '</p></div>';
        return;
      }
      const r = PK.store.importSpots(data);
      let h = '<div class="notice ' + (r.errors.length ? 'notice--warn' : 'notice--ok') + '"><p><b>' + r.added + ' új, ' + r.replaced + ' frissített spot.</b></p>';
      if (r.errors.length) h += '<ul>' + r.errors.slice(0, 12).map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>' + (r.errors.length > 12 ? '<p>… és még ' + (r.errors.length - 12) + ' hiba.</p>' : '');
      h += '</div>';
      render();
      main.querySelector('#imp-out').innerHTML = h;
    }

    async function onFile(el, kind) {
      const f = el.files && el.files[0];
      if (!f) return;
      const text = await PK.ui.readFile(f);
      if (kind === 'spots') return importSpotsText(text);
      const out = main.querySelector('#json-out');
      try {
        const obj = JSON.parse(text);
        const replace = main.querySelector('[data-f="replace"]').checked;
        if (replace && !g.confirm('A visszaállítás felülírja a mostani adataidat. Folytatod?')) return;
        PK.store.importObject(obj, replace ? 'replace' : 'merge');
        PK.app.applySettings();
        render();
        main.querySelector('#json-out').innerHTML = '<div class="notice notice--ok"><p>Visszaállítva: ' + PK.store.state.attempts.length + ' próbálkozás, ' + PK.store.state.liveHands.length + ' élő kéz.</p></div>';
      } catch (e) {
        out.innerHTML = '<div class="notice notice--bad"><p>' + esc(e.message) + '</p></div>';
      }
    }

    render();
    return {
      destroy() {
        if (rec) rec.destroy();
      },
      async onClick(act, el) {
        if (act === 'days') {
          days = Number(el.dataset.v);
          render();
        } else if (act === 'md-copy') {
          const ok = await PK.ui.copy(PK.report.markdown({ days }));
          PK.ui.toast(ok ? 'Kimásolva — illeszd be egy Claude-beszélgetésbe' : 'A másolás nem sikerült, használd a letöltést', ok ? '' : 'bad');
        } else if (act === 'md-dl') {
          PK.ui.download('poker-export-' + PK.util.isoDate() + '.md', PK.report.markdown({ days }), 'text/markdown;charset=utf-8');
        } else if (act === 'json-dl') {
          PK.ui.download('i-learn-poker-mentes-' + PK.util.isoDate() + '.json', JSON.stringify(PK.store.exportObject(), null, 2), 'application/json');
        } else if (act === 'spots-import') {
          importSpotsText(main.querySelector('[data-f="spots-in"]').value);
        } else if (act === 'spot-del') {
          if (g.confirm('Törlöd ezt a saját spotot? A hozzá tartozó próbálkozások megmaradnak.')) {
            PK.store.removeCustomSpot(el.dataset.id);
            render();
          }
        } else if (act === 'spots-train') {
          PK.train.start('filter', { custom: true });
        } else if (act === 'audio-clear') {
          if (g.confirm('Minden hangfelvételt törölsz? Az átiratok megmaradnak.')) {
            await PK.store.audio.clear();
            PK.ui.toast('Hangfelvételek törölve');
          }
        } else if (act === 'reset') {
          if (g.confirm('Minden adatot törölsz ebből a böngészőből: próbálkozásokat, naplót, saját spotokat, hangfelvételeket. Előtte érdemes teljes mentést készíteni. Biztosan folytatod?') && g.confirm('Utolsó megerősítés: tényleg mindent törölsz?')) {
            PK.store.reset();
            PK.app.applySettings();
            render();
            PK.ui.toast('Minden adat törölve');
          }
        }
      },
      onChange(act, el) {
        if (act === 'spots-file') return onFile(el, 'spots');
        if (act === 'json-file') return onFile(el, 'json');
        const k = el.dataset.set;
        if (!k) return;
        const set = PK.store.state.settings;
        set[k] = el.type === 'checkbox' ? el.checked : /^(thinkSec|sessionSize)$/.test(k) ? Number(el.value) : el.value;
        PK.store.save();
        PK.app.applySettings();
        if (k === 'speech' || k === 'record' || k === 'lang') render();
      },
    };
  }

  PK.views.data = { view };
})(typeof window !== 'undefined' ? window : globalThis);
