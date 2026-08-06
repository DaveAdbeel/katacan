/* ============================================================
 * app.js — lógica principal de katacan
 * ============================================================ */

(() => {
  const $ = (sel) => document.querySelector(sel);

  const ACCENTS = ['#818cf8', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#f87171', '#e5e7eb'];
  const AA_DELAYS = { off: 0, fast: 500, normal: 900, slow: 1500 };

  const DEFAULT_SETTINGS = {
    lang: null, // se detecta en el primer arranque
    script: 'both',
    categories: [...CATEGORIES],
    showKanji: true,
    recallMode: false,
    autoAdvance: 'normal',
    fontScale: 'm',
    accent: ACCENTS[0],
    showBuffer: true,
  };

  const state = {
    settings: loadSettings(),
    stats: loadStats(),
    pool: [],
    poolIndex: 0,
    word: null,
    matcher: null,
    revealed: false,
    wordHadError: false,
    awaitingNext: false,
    advanceTimer: null,
  };

  /* ---------- persistencia ---------- */

  function loadSettings() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('katacan.settings')) || {}; } catch (e) { /* ignora */ }
    const s = { ...DEFAULT_SETTINGS, ...saved };
    if (!s.lang) {
      const nav = (navigator.language || 'en').slice(0, 2);
      s.lang = I18N[nav] ? nav : 'en';
    }
    if (!Array.isArray(s.categories) || !s.categories.length) s.categories = [...CATEGORIES];
    return s;
  }

  function saveSettings() {
    localStorage.setItem('katacan.settings', JSON.stringify(state.settings));
  }

  function loadStats() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('katacan.stats')) || {}; } catch (e) { /* ignora */ }
    return { words: 0, keysOk: 0, keysBad: 0, streak: 0, bestStreak: 0, ...saved };
  }

  function saveStats() {
    localStorage.setItem('katacan.stats', JSON.stringify(state.stats));
  }

  /* ---------- i18n ---------- */

  function t(key) {
    const dict = I18N[state.settings.lang] || I18N.en;
    return dict[key] ?? I18N.en[key] ?? key;
  }

  /* ---------- selección de palabras ---------- */

  function wordScript(w) {
    return Kana.isKatakanaChar([...w.k][0]) ? 'katakana' : 'hiragana';
  }

  function rebuildPool() {
    const { script, categories } = state.settings;
    const filtered = WORDS.filter(w =>
      categories.includes(w.c) && (script === 'both' || wordScript(w) === script)
    );
    // Fisher–Yates
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    state.pool = filtered;
    state.poolIndex = 0;
  }

  function nextWord() {
    clearTimeout(state.advanceTimer);
    state.awaitingNext = false;
    state.revealed = false;
    state.wordHadError = false;

    if (!state.pool.length || state.poolIndex >= state.pool.length) rebuildPool();
    if (!state.pool.length) {
      state.word = null;
      state.matcher = null;
      renderWord();
      return;
    }
    state.word = state.pool[state.poolIndex++];
    state.matcher = new Kana.Matcher(state.word.k);
    renderWord();
  }

  /* ---------- render ---------- */

  function renderChrome() {
    document.documentElement.style.setProperty('--accent', state.settings.accent);
    document.documentElement.dataset.fontScale = state.settings.fontScale;
    $('#tagline').textContent = t('tagline');
    $('#hint').textContent = t('hint');
    $('#key-skip').textContent = t('keySkip');
    $('#key-reveal').textContent = t('keyReveal');
    $('#key-settings').textContent = t('keySettings');
    $('#key-reveal').style.display = state.settings.recallMode ? '' : 'none';
    renderStats();
    renderSettingsPanel();
  }

  function renderStats() {
    const { words, keysOk, keysBad, streak } = state.stats;
    const total = keysOk + keysBad;
    const acc = total ? Math.round((keysOk / total) * 100) : 100;
    $('#stats').innerHTML =
      `<span>${words} <em>${t('statsWords')}</em></span>` +
      `<span>${acc}% <em>${t('statsAccuracy')}</em></span>` +
      `<span>${streak} <em>${t('statsStreak')}</em></span>`;
  }

  function renderWord() {
    const meaningEl = $('#meaning');
    const wordEl = $('#word');
    const kanjiEl = $('#kanji');
    const bufferEl = $('#buffer');
    const categoryEl = $('#category');

    if (!state.word) {
      meaningEl.textContent = t('emptyPool');
      wordEl.innerHTML = '';
      kanjiEl.textContent = '';
      bufferEl.textContent = '';
      categoryEl.textContent = '';
      return;
    }

    const w = state.word;
    const m = state.matcher;
    meaningEl.textContent = w.t[state.settings.lang] || w.t.en;
    categoryEl.textContent = t('categories_' + w.c);

    const complete = m.done;
    const hidden = state.settings.recallMode && !state.revealed && !complete;

    wordEl.innerHTML = '';
    m.units.forEach((u, i) => {
      const span = document.createElement('span');
      const isDone = i < m.index;
      const isCurrent = i === m.index && !complete;
      span.className = 'unit' + (isDone || complete ? ' done' : '') + (isCurrent ? ' current' : '');
      if (hidden && !isDone) {
        span.textContent = '・';
        span.classList.add('masked');
      } else {
        span.textContent = u.text;
      }
      if (state.revealed && !isDone && !complete) span.classList.add('revealed');
      wordEl.appendChild(span);
    });

    kanjiEl.textContent = (state.settings.showKanji && w.j) ? w.j : '';
    kanjiEl.classList.toggle('hidden-slot', !(state.settings.showKanji && w.j));

    bufferEl.textContent = state.settings.showBuffer ? m.buffer : '';
  }

  function flashError() {
    const wordEl = $('#word');
    wordEl.classList.remove('shake');
    void wordEl.offsetWidth; // reinicia la animación
    wordEl.classList.add('shake');
  }

  function onWordComplete() {
    state.stats.words++;
    if (!state.wordHadError) {
      state.stats.streak++;
      if (state.stats.streak > state.stats.bestStreak) state.stats.bestStreak = state.stats.streak;
    }
    saveStats();
    renderStats();
    renderWord();
    $('#stage').classList.add('complete');

    const delay = AA_DELAYS[state.settings.autoAdvance];
    if (delay > 0) {
      state.advanceTimer = setTimeout(() => {
        $('#stage').classList.remove('complete');
        nextWord();
      }, delay);
    } else {
      state.awaitingNext = true;
      $('#buffer').textContent = t('pressAnyKey');
    }
  }

  /* ---------- entrada de teclado ---------- */

  function onKeyDown(e) {
    const panelOpen = $('#settings-panel').classList.contains('open');

    if (e.key === 'Escape') {
      e.preventDefault();
      toggleSettings(!panelOpen);
      return;
    }
    if (panelOpen) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (state.awaitingNext) {
      e.preventDefault();
      $('#stage').classList.remove('complete');
      nextWord();
      return;
    }

    if (!state.matcher || state.matcher.done) return;

    if (e.key === ' ') {
      e.preventDefault();
      state.stats.streak = 0;
      saveStats();
      renderStats();
      nextWord();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (state.settings.recallMode) {
        state.revealed = true;
        state.wordHadError = true; // revelar rompe la racha perfecta
        renderWord();
      }
      return;
    }

    const ch = e.key.toLowerCase();
    if (!/^[a-z-]$/.test(ch)) return;
    e.preventDefault();

    const res = state.matcher.input(ch);
    if (res === 'error') {
      state.stats.keysBad++;
      state.wordHadError = true;
      state.stats.streak = 0;
      flashError();
    } else {
      state.stats.keysOk++;
    }
    saveStats();
    renderStats();

    if (res === 'complete') {
      renderWord();
      onWordComplete();
    } else {
      renderWord();
    }
  }

  /* ---------- panel de ajustes ---------- */

  function toggleSettings(open) {
    $('#settings-panel').classList.toggle('open', open);
    $('#overlay').classList.toggle('open', open);
  }

  function segmented(options, value, onPick) {
    const div = document.createElement('div');
    div.className = 'segmented';
    options.forEach(([val, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.className = val === value ? 'active' : '';
      btn.addEventListener('click', () => onPick(val));
      div.appendChild(btn);
    });
    return div;
  }

  function toggleRow(label, value, onChange) {
    const row = document.createElement('div');
    row.className = 'row toggle-row';
    const span = document.createElement('span');
    span.textContent = label;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toggle' + (value ? ' on' : '');
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-checked', String(value));
    btn.addEventListener('click', () => onChange(!value));
    row.append(span, btn);
    return row;
  }

  function section(title) {
    const h = document.createElement('h3');
    h.textContent = title;
    return h;
  }

  function renderSettingsPanel() {
    const s = state.settings;
    const panel = $('#settings-body');
    panel.innerHTML = '';

    const apply = (fn) => { fn(); saveSettings(); renderChrome(); };
    const applyAndReset = (fn) => { fn(); saveSettings(); rebuildPool(); nextWord(); renderChrome(); };

    // Idioma
    panel.appendChild(section(t('language')));
    const langSel = document.createElement('select');
    for (const code of Object.keys(I18N)) {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = I18N[code]._name;
      if (code === s.lang) opt.selected = true;
      langSel.appendChild(opt);
    }
    langSel.addEventListener('change', () => apply(() => { s.lang = langSel.value; renderWord(); }));
    panel.appendChild(langSel);

    // Silabario
    panel.appendChild(section(t('script')));
    panel.appendChild(segmented(
      [['both', t('scriptBoth')], ['hiragana', t('scriptHiragana')], ['katakana', t('scriptKatakana')]],
      s.script,
      (val) => applyAndReset(() => { s.script = val; })
    ));

    // Categorías
    panel.appendChild(section(t('categories')));
    const chips = document.createElement('div');
    chips.className = 'chips';
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.textContent = t('selectAll');
    allChip.className = 'chip' + (s.categories.length === CATEGORIES.length ? ' active' : '');
    allChip.addEventListener('click', () => applyAndReset(() => { s.categories = [...CATEGORIES]; }));
    chips.appendChild(allChip);
    for (const c of CATEGORIES) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.textContent = t('categories_' + c);
      chip.className = 'chip' + (s.categories.includes(c) ? ' active' : '');
      chip.addEventListener('click', () => applyAndReset(() => {
        if (s.categories.includes(c)) {
          s.categories = s.categories.filter(x => x !== c);
        } else {
          s.categories.push(c);
        }
      }));
      chips.appendChild(chip);
    }
    panel.appendChild(chips);

    // Funcionalidad
    panel.appendChild(section(t('settings')));
    panel.appendChild(toggleRow(t('showKanji'), s.showKanji, (v) => apply(() => { s.showKanji = v; renderWord(); })));
    panel.appendChild(toggleRow(t('recallMode'), s.recallMode, (v) => apply(() => { s.recallMode = v; renderWord(); })));
    panel.appendChild(toggleRow(t('showBuffer'), s.showBuffer, (v) => apply(() => { s.showBuffer = v; renderWord(); })));

    // Avance automático
    panel.appendChild(section(t('autoAdvance')));
    panel.appendChild(segmented(
      [['off', t('aaOff')], ['fast', t('aaFast')], ['normal', t('aaNormal')], ['slow', t('aaSlow')]],
      s.autoAdvance,
      (val) => apply(() => { s.autoAdvance = val; })
    ));

    // Tamaño
    panel.appendChild(section(t('fontSize')));
    panel.appendChild(segmented(
      [['s', t('sizeS')], ['m', t('sizeM')], ['l', t('sizeL')]],
      s.fontScale,
      (val) => apply(() => { s.fontScale = val; })
    ));

    // Acento
    panel.appendChild(section(t('accent')));
    const swatches = document.createElement('div');
    swatches.className = 'swatches';
    for (const color of ACCENTS) {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'swatch' + (color === s.accent ? ' active' : '');
      sw.style.background = color;
      sw.addEventListener('click', () => apply(() => { s.accent = color; }));
      swatches.appendChild(sw);
    }
    panel.appendChild(swatches);

    // Estadísticas
    panel.appendChild(section(t('stats')));
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'danger';
    reset.textContent = t('resetStats');
    reset.addEventListener('click', () => {
      state.stats = { words: 0, keysOk: 0, keysBad: 0, streak: 0, bestStreak: 0 };
      saveStats();
      renderStats();
    });
    panel.appendChild(reset);
  }

  /* ---------- arranque ---------- */

  function init() {
    $('#settings-btn').addEventListener('click', () => toggleSettings(true));
    $('#close-settings').addEventListener('click', () => toggleSettings(false));
    $('#overlay').addEventListener('click', () => toggleSettings(false));
    document.addEventListener('keydown', onKeyDown);
    renderChrome();
    rebuildPool();
    nextWord();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
