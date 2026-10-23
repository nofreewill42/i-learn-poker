/* i-learn-poker — chartok: 10bb push/fold, hívási range-ek, 20bb reshove, 10-max nyitási arányok */
(function (g) {
  'use strict';
  const PK = g.PK || (g.PK = {});
  PK.data = PK.data || {};

  PK.data.charts = {
    pf10: {
      title: 'Nyitó all-in 10bb-vel',
      setup: '9 fős asztal, 10bb effektív, ante nélkül, chipEV (Nash-közeli)',
      source: 'Dara O’Kearney – Barry Carter: Poker Satellite Strategy (a pokerskill.com közlésében)',
      note:
        'A 10 fős asztalon az UTG egy fokkal szűkebb, mint a 9 fős UTG. Big blind ante mellett több a holt pénz, ezért a chart ilyenkor alsó határ: lehet szélesebben tolni.',
      rows: [
        { pos: 'UTG', ten: 'UTG és UTG+1', pct: 17.9, range: '22+, A4s+, ATo+, K9s+, KJo+, Q9s+, J9s+, T8s+, 98s' },
        { pos: 'UTG+1', ten: 'UTG+2', pct: 17.5, range: '33+, A3s+, ATo+, K9s+, KJo+, Q9s+, J9s+, T9s, 98s' },
        { pos: 'MP1', ten: 'MP', pct: 20.4, range: '22+, A2s+, A9o+, K9s+, KJo+, Q9s+, QJo, J9s+, T8s+, 98s' },
        { pos: 'MP2', ten: 'LJ', pct: 24.6, range: '22+, A2s+, A7o+, A5o, K9s+, KTo+, Q9s+, QJo, J8s+, T8s+, 98s, 87s' },
        { pos: 'MP3', ten: 'HJ', pct: 30.0, range: '22+, A2s+, A3o+, K6s+, KTo+, Q9s+, QTo+, J8s+, JTo, T8s+, 98s, 87s' },
        { pos: 'CO', ten: 'CO', pct: 34.2, range: '22+, Ax, K4s+, K9o+, Q8s+, QTo+, J8s+, JTo, T7s+, 97s+, 86s+, 76s, 65s' },
        { pos: 'BTN', ten: 'BTN', pct: 43.6, range: '22+, Ax, K2s+, K5o+, Q5s+, Q9o+, J7s+, J9o+, T6s+, T9o, 96s+, 86s+, 75s+, 65s, 54s' },
        { pos: 'SB', ten: 'SB', pct: 68.6, range: '22+, Qx+, J2s+, J5o+, T2s+, T7o+, 95s+, 97o+, 84s+, 86o+, 74s+, 76o, 63s+, 53s+, 43s' },
      ],
    },
    call10: {
      title: 'Hívás 10bb-s UTG all-in ellen',
      setup: '9 fős asztal, 10bb effektív, ante nélkül, chipEV',
      source: 'Dara O’Kearney – Barry Carter: Poker Satellite Strategy (a pokerskill.com közlésében)',
      rows: [
        { pos: 'UTG+1', ten: 'UTG+2 körül', pct: 7.8, range: '77+, ATs+, AJo+, KQs' },
        { pos: 'BB', ten: 'BB', pct: 19.0, range: '33+, A2s+, A7o+, KTs+, KJo+, QTs+, JTs' },
      ],
    },
    reshove20: {
      title: 'Reshove 20bb-vel BTN-open ellen',
      setup: '20bb effektív, chipEV-közelítés, laza BTN-open ellen',
      source: 'rangerpro.fr és deepfold.co rövid stackes összefoglalói (közelítés)',
      rows: [
        { pos: 'SB', ten: 'SB a BTN ellen', range: '33+, A5s+, ATo+, KTs+, KJo+, QJs' },
        { pos: 'BB', ten: 'BB a BTN ellen', range: '22+, A7s+, ATo+, KTs+, KJo+, QTs+, JTs' },
      ],
    },
    bba: {
      title: 'Mit változtat a big blind ante?',
      text:
        '10bb-n BB ante mellett az SB → BB nyitó all-in aránya kb. 58%-ról 71%-ra, a BB hívási aránya kb. 38%-ról 53%-ra nő (pokerlevelup összefoglaló). Minél több a holt pénz, annál szélesebben érdemes tolni és hívni.',
    },
    rfi: {
      title: 'Nyitási arányok 10 fős asztalon (közelítés)',
      source: 'Saját átszámítás 9 fős GTO-chartokból (preflopwizard, grindlab); nem solver-kimenet.',
      rows: [
        { pos: 'UTG', deep: '9–11%', mid: '13–15%', example: '77+, ATs+, KJs+, QJs, AQo+' },
        { pos: 'UTG+1', deep: '10–12%', mid: '14–16%' },
        { pos: 'UTG+2', deep: '12–14%', mid: '16–18%' },
        { pos: 'MP', deep: '14–16%', mid: '19–21%' },
        { pos: 'LJ', deep: '17–19%', mid: '22–24%' },
        { pos: 'HJ', deep: '20–22%', mid: '26–28%' },
        { pos: 'CO', deep: '26–28%', mid: '33–36%' },
        { pos: 'BTN', deep: '40–45%', mid: '45–51%' },
        { pos: 'SB', deep: '35–45% raise + limp', mid: 'raise + limp, széles' },
      ],
      sizes:
        'Open méret: mélyen élőben 2,5–3bb; big blind ante-val 25–60bb között 2–2,3bb; 20bb alatt 2bb vagy all-in; SB-ből 2,5–3bb.',
    },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = PK.data.charts;
})(typeof window !== 'undefined' ? window : globalThis);
