/* i-learn-poker — indítás, útvonalak, eseménykezelés */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  const V = () => PK.views;

  const ROUTES = [
    [/^\/edzes$/, () => V().train.home, 'Edzés', 'edzes'],
    [/^\/edzes\/spot$/, () => V().train.player, 'Spot', 'edzes'],
    [/^\/drill\/pushfold$/, () => V().drills.pushfold, 'Push/fold villám', 'edzes'],
    [/^\/drill\/pushfold\/(bemelegites)$/, () => V().drills.pushfold, 'Verseny előtti bemelegítés', 'edzes'],
    [/^\/drill\/potodds$/, () => V().drills.potodds, 'Pot odds villám', 'edzes'],
    [/^\/profil$/, () => V().profile.view, 'Profil', 'profil'],
    [/^\/profil\/spot\/(.+)$/, () => V().profile.spotDetail, 'Spot', 'profil'],
    [/^\/naplo$/, () => V().journal.view, 'Napló', 'naplo'],
    [/^\/naplo\/(versenyek|kezek|mental|pool)$/, () => V().journal.view, 'Napló', 'naplo'],
    [/^\/naplo\/verseny\/(.+)$/, () => V().journal.sessionForm, 'Verseny', 'naplo'],
    [/^\/naplo\/kez\/(.+)$/, () => V().journal.handForm, 'Élő kéz', 'naplo'],
    [/^\/naplo\/mental\/(.+)$/, () => V().journal.mhhForm, 'Mentál', 'naplo'],
    [/^\/tudas$/, () => V().learn.view, 'Tudástár', 'tudas'],
    [/^\/tudas\/(technikak|leakek|chartok|terv|duna)$/, () => V().learn.view, 'Tudástár', 'tudas'],
    [/^\/eszkozok$/, () => V().tools.view, 'Eszközök', 'eszkozok'],
    [/^\/adatok$/, () => V().data.view, 'Adatok', 'adatok'],
  ];

  let current = {};
  let main = null;

  function render() {
    if (current && current.destroy) {
      try {
        current.destroy();
      } catch (e) {
        /* tovább */
      }
    }
    current = {};
    const path = decodeURI((location.hash || '#/edzes').slice(1)) || '/edzes';
    let hit = null;
    let params = [];
    for (const r of ROUTES) {
      const m = r[0].exec(path);
      if (m) {
        hit = r;
        params = m.slice(1);
        break;
      }
    }
    if (!hit) {
      location.replace('#/edzes');
      return;
    }
    document.title = hit[2] + ' — i-learn-poker';
    document.querySelectorAll('[data-nav]').forEach((a) => {
      if (a.dataset.nav === hit[3]) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    try {
      current = hit[1]()(main, params) || {};
    } catch (e) {
      console.error(e);
      main.innerHTML = '<div class="notice notice--bad"><p>Hiba történt az oldal megjelenítésekor: ' + PK.util.esc(e.message) + '</p><p><a href="#/edzes">Vissza az Edzéshez</a></p></div>';
      current = {};
    }
    if (!/^\/edzes\/spot$/.test(path)) g.scrollTo(0, 0);
  }

  function applySettings() {
    const s = PK.store.state.settings;
    const root = document.documentElement;
    if (s.theme === 'light' || s.theme === 'dark') root.dataset.theme = s.theme;
    else delete root.dataset.theme;
    document.body.classList.toggle('four-color', !!s.fourColor);
  }

  function delegate(type, method) {
    main.addEventListener(type, (e) => {
      const el = e.target.closest('[data-act]') || (type !== 'click' ? e.target : null);
      if (!el || !current || !current[method]) return;
      if (type === 'click' && el.tagName === 'INPUT' && el.type === 'file') return;
      current[method](el.dataset ? el.dataset.act : null, el, e);
    });
  }

  function init() {
    main = document.getElementById('main');
    PK.store.load();
    applySettings();
    document.querySelector('.brand').insertAdjacentHTML('afterbegin', PK.ui.brandMark());
    document.querySelectorAll('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', PK.ui.icons[el.dataset.icon] || ''));
    PK.store.on((ev) => {
      if (ev.type === 'error') PK.ui.toast('Nem tudtam menteni: a böngésző tárhelye megtelt vagy le van tiltva. Készíts mentést az Adatok oldalon.', 'bad');
    });
    delegate('click', 'onClick');
    delegate('input', 'onInput');
    delegate('change', 'onChange');
    g.addEventListener('hashchange', render);
    g.addEventListener('pagehide', () => PK.store.saveNow());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') PK.store.saveNow();
    });
    // Egy másik lapon (vagy a kezdőképernyős appban) mentett adatot átvesszük; űrlapot és futó spotot nem rajzolunk újra.
    g.addEventListener('storage', (e) => {
      if (e.key !== PK.store.KEY || !PK.store.syncFromStorage()) return;
      applySettings();
      const path = decodeURI((location.hash || '#/edzes').slice(1));
      if (!/^\/(edzes\/spot|drill\/|naplo\/(verseny|kez|mental)\/)/.test(path)) render();
    });
    if (!(PK.data && PK.data.spots && PK.data.spots.length)) console.warn('Nem töltődtek be a beépített spotok.');
    render();
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  PK.app = { render, applySettings, init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
