/* i-learn-poker — felületi segédek: ikonok, toast, letöltés, vágólap, megerősítés */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.ui = PK.ui || {};

  const P = (d, extra) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
    (extra || '') +
    '>' +
    d +
    '</svg>';

  const icons = {
    train: P('<rect x="3.5" y="5" width="11" height="15" rx="2"/><path d="M9.5 3.5h9a2 2 0 0 1 2 2v13"/><path d="M9 10.5l-2 2.2 2 2.3 2-2.3z"/>'),
    profile: P('<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M21 20H3"/>'),
    journal: P('<path d="M6 3.5h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6z"/><path d="M6 3.5v17"/><path d="M10 8h6M10 12h6M10 16h4"/>'),
    learn: P('<path d="M3.5 5.5c3-1 6-1 8.5.8 2.5-1.8 5.5-1.8 8.5-.8V19c-3-1-6-1-8.5.8-2.5-1.8-5.5-1.8-8.5-.8z"/><path d="M12 6.3v13.5"/>'),
    tools: P('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01"/>'),
    data: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    check: P('<path d="M20 6L9 17l-5-5"/>'),
    ok: P('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16.5 9"/>'),
    warn: P('<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5h.01"/>'),
    bad: P('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
    play: P('<path d="M7 4.5v15l12-7.5z"/>'),
    down: P('<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>'),
    up: P('<path d="M12 20V9"/><path d="M7 14l5-5 5 5"/><path d="M5 4h14"/>'),
    copy: P('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    trash: P('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    next: P('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>'),
    back: P('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>'),
    mic: P('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>'),
  };

  function brandMark() {
    // zseton négy peremfolttal, középen mikrofon — a hangos gondolkodás jele
    const spots = [0, 90, 180, 270]
      .map((a) => '<rect x="13.2" y="0.8" width="5.6" height="5.4" rx="1.2" fill="#fff" transform="rotate(' + a + ' 16 16)"/>')
      .join('');
    return (
      '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15.2" fill="#1c4672"/>' +
      spots +
      '<circle cx="16" cy="16" r="9.2" fill="#fff"/>' +
      '<rect x="13.9" y="10.4" width="4.2" height="8" rx="2.1" fill="#b42039"/>' +
      '<path d="M11.6 15.6a4.4 4.4 0 0 0 8.8 0" fill="none" stroke="#b42039" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M16 20.2v2" stroke="#b42039" stroke-width="1.5" stroke-linecap="round"/></svg>'
    );
  }

  function toast(msg, kind) {
    const host = document.getElementById('toast');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast' + (kind === 'bad' ? ' toast--bad' : '');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), kind === 'bad' ? 6000 : 3200);
  }

  function download(name, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e2) {
        ok = false;
      }
      ta.remove();
      return ok;
    }
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(r.error);
      r.readAsText(file, 'utf-8');
    });
  }

  /** JSON kinyerése szövegből (akár ```json kódblokkból vagy Claude teljes válaszából). */
  function extractJson(text) {
    const t = String(text || '').trim();
    try {
      return JSON.parse(t);
    } catch (e) {
      /* tovább */
    }
    const fence = /```(?:json)?\s*([\s\S]*?)```/gi;
    let m;
    while ((m = fence.exec(t))) {
      try {
        return JSON.parse(m[1]);
      } catch (e) {
        /* következő */
      }
    }
    const a = t.indexOf('[');
    const b = t.lastIndexOf(']');
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(t.slice(a, b + 1));
      } catch (e) {
        /* tovább */
      }
    }
    const c = t.indexOf('{');
    const d = t.lastIndexOf('}');
    if (c >= 0 && d > c) return JSON.parse(t.slice(c, d + 1));
    throw new Error('Nem találok érvényes JSON-t a szövegben.');
  }

  function confirmBox(message, okLabel) {
    return Promise.resolve(g.confirm(message + (okLabel ? '' : '')));
  }

  const STAGE_HU = { early: 'Korai szakasz', middle: 'Középső szakasz', bubble: 'Buborék', ft: 'Döntőasztal', mental: 'Mentál' };
  const BASIS_HU = { gto: 'GTO-közelítés', exploit: 'Exploit', icm: 'ICM', math: 'Matek', mental: 'Mentál', concept: 'Fogalom' };
  const CONF_HU = { high: 'magas', med: 'közepes', low: 'alacsony' };

  PK.ui.icons = icons;
  PK.ui.brandMark = brandMark;
  PK.ui.toast = toast;
  PK.ui.download = download;
  PK.ui.copy = copy;
  PK.ui.readFile = readFile;
  PK.ui.extractJson = extractJson;
  PK.ui.confirm = confirmBox;
  PK.ui.STAGE_HU = STAGE_HU;
  PK.ui.BASIS_HU = BASIS_HU;
  PK.ui.CONF_HU = CONF_HU;
})(typeof window !== 'undefined' ? window : globalThis);
