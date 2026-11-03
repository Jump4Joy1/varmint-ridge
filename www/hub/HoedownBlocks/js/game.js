/* Hoedown Blocks play loop.
   Gravity uses delta time, so a slow frame does not change the rules.
   Drawing blits cached sprites. DPR stays at or below 1.5 (1.0 if frames slip). */
(function () {
  'use strict';
  const Art = window.HoedownArt;
  const Levels = window.HoedownLevels;
  const Audio = window.HoedownAudio;
  const IAP = window.HoedownIAP;
  const STR = window.HoedownStrings.STR;
  const COLS = Art.COLS;
  const ROWS = Art.ROWS;
  const BLOCK = Art.BLOCK;
  const FRAME = Art.FRAME;

  const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedMq.matches;
  Art.setReduced(reduced);
  if (reducedMq.addEventListener) {
    reducedMq.addEventListener('change', function () {
      reduced = reducedMq.matches;
      Art.setReduced(reduced);
    });
  }

  let lang = 'en';
  let muted = false;
  let screen = 'title';
  let mode = 'level';
  let levelDef = null;
  let board = null;
  let current = null;
  let nextPiece = null;
  let hold = null;
  let canHold = true;
  let pos = { x: 3, y: 0 };
  let displayY = 0;
  let showPiece = false;
  let score = 0;
  let lines = 0;
  let chickens = 0;
  let piecesUsed = 0;
  let endlessLevel = 1;
  let dropMs = 1000;
  let acc = 0;
  let running = false;
  let paused = false;
  let clearing = null;
  let shake = 0;
  let combo = 0;
  let lastClearAt = 0;
  let introOn = false;
  let scriptQ = [];
  let bag = [];
  let rng = Math.random;
  let quality = 'high';
  let slowStreak = 0;
  let rafId = 0;
  let titleRaf = 0;
  let lastTs = 0;
  let nowTime = 0;
  const frameSamples = [];
  let blit = null;
  let gate = null;
  let dailyDate = '';

  const world = document.createElement('canvas');
  world.width = Art.CW;
  world.height = Art.CH;
  const worldCtx = world.getContext('2d', { alpha: false });
  const boardCanvas = document.getElementById('board');
  const boardCtx = boardCanvas.getContext('2d', { alpha: false });
  const titleCanvas = document.getElementById('titleArt');
  const titleCtx = titleCanvas.getContext('2d');

  function $(id) { return document.getElementById(id); }

  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function t(key, vars) {
    let s = (STR[lang] && STR[lang][key]) || STR.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  function theme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyI18n() {
    document.documentElement.lang = lang === 'es' ? 'es' : 'en';
    document.title = t('docTitle');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    const langBtn = $('langBtn');
    langBtn.textContent = lang === 'en' ? 'Español' : 'English';
    langBtn.setAttribute('aria-label', lang === 'en' ? 'Español' : 'English');
    const soundLabel = muted ? t('soundOff') : t('soundOn');
    $('soundBtn').textContent = soundLabel;
    $('soundBtn').setAttribute('aria-pressed', muted ? 'false' : 'true');
    $('hudMute').textContent = soundLabel;
    const modeName = document.documentElement.getAttribute('data-theme-mode') || 'auto';
    document.querySelectorAll('[data-theme-choice]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-theme-choice') === modeName ? 'true' : 'false');
    });
    const star = starLine();
    if ($('starLine')) $('starLine').textContent = star;
    if (screen === 'play') updateHud();
    if (screen === 'levels') renderLevels();
    if (screen === 'scores') renderScores();
    if (screen === 'daily') renderDaily();
    drawPreviews();
  }

  function progress() {
    return load('hb.progress', { unlocked: 1, stars: {}, best: {} });
  }
  function starLine() {
    const p = progress();
    let stars = 0;
    Object.keys(p.stars).forEach(function (k) { stars += p.stars[k] || 0; });
    return t('starLine', { stars: stars, level: Math.min(54, p.unlocked) });
  }
  function frontier() {
    const p = progress();
    for (let id = 1; id <= 54; id++) {
      if (id > p.unlocked) break;
      if ((p.stars[id] || 0) < 1) return id;
    }
    return Math.min(54, p.unlocked);
  }

  function emptyRow() {
    const row = new Array(COLS);
    for (let i = 0; i < COLS; i++) row[i] = null;
    return row;
  }
  function freshBoard() {
    const b = new Array(ROWS);
    for (let y = 0; y < ROWS; y++) b[y] = emptyRow();
    return b;
  }

  function applyRows(rows) {
    board = freshBoard();
    for (let i = 0; i < rows.length; i++) {
      const y = ROWS - 1 - i;
      if (y < 0) break;
      const str = rows[i];
      for (let x = 0; x < COLS; x++) {
        const ch = str.charAt(x);
        board[y][x] = ch && ch !== '.' ? (Art.CHAR[ch] || null) : null;
      }
    }
  }

  function makePiece(id) {
    const def = Art.PIECES[id];
    const shape = def.m.map(function (row) { return row.slice(); });
    return { id: id, kind: def.kind, shape: shape };
  }

  function pull() {
    if (scriptQ.length) return scriptQ.shift();
    if (!bag.length) {
      bag = ['I', 'O', 'T', 'J', 'L', 'S', 'Z'];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = bag[i];
        bag[i] = bag[j];
        bag[j] = tmp;
      }
    }
    return bag.pop();
  }

  function valid(px, py, shape) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const nx = px + x;
        const ny = py + y;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
        if (ny >= 0 && board[ny][nx]) return false;
      }
    }
    return true;
  }

  function spawnX(shape) {
    return Math.floor((COLS - shape[0].length) / 2);
  }

  function cw(m) {
    const h = m.length;
    const w = m[0].length;
    const r = [];
    for (let x = 0; x < w; x++) {
      const row = [];
      for (let y = h - 1; y >= 0; y--) row.push(m[y][x]);
      r.push(row);
    }
    return r;
  }
  function ccw(m) {
    const h = m.length;
    const w = m[0].length;
    const r = [];
    for (let x = w - 1; x >= 0; x--) {
      const row = [];
      for (let y = 0; y < h; y++) row.push(m[y][x]);
      r.push(row);
    }
    return r;
  }

  function hideOverlays() {
    document.querySelectorAll('.overlay').forEach(function (el) { el.classList.remove('on'); });
  }

  function show(name) {
    screen = name;
    document.querySelectorAll('.screen').forEach(function (el) {
      el.classList.toggle('on', el.id === 'screen-' + name);
    });
    if (name !== 'play') {
      running = false;
      paused = false;
      introOn = false;
      hideOverlays();
      stopLoop();
      Audio.stopMusic();
    }
    if (name === 'title') startTitle();
    else stopTitle();
    if (name === 'levels') renderLevels();
    if (name === 'scores') renderScores();
    if (name === 'daily') renderDaily();
    if (name === 'store') openStore();
    applyI18n();
  }

  function renderLevels() {
    const p = progress();
    const root = $('levelList');
    root.textContent = '';
    let cursor = 1;
    Levels.CHAPTERS.forEach(function (ch) {
      const h = document.createElement('h3');
      h.textContent = t('ch_' + ch.id);
      root.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'grid';
      for (let n = 0; n < ch.count; n++) {
        const id = cursor++;
        const lv = Levels.LEVELS[id - 1];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lvl';
        btn.dataset.level = String(id);
        const locked = id > p.unlocked;
        btn.disabled = locked;
        const stars = p.stars[id] || 0;
        const name = lang === 'es' ? lv.name.es : lv.name.en;
        btn.innerHTML = '<span class="n">' + id + '</span><span class="nm"></span><span class="st"></span>';
        btn.querySelector('.nm').textContent = locked ? t('locked') : name;
        btn.querySelector('.st').textContent = locked ? '' : ('★★★'.slice(0, stars) + '☆☆☆'.slice(stars));
        btn.addEventListener('click', function () { startLevel(id); });
        grid.appendChild(btn);
      }
      root.appendChild(grid);
    });
  }

  function renderScores() {
    const list = load('hb.endless', []);
    const root = $('scoreList');
    root.textContent = '';
    if (!list.length) {
      const p = document.createElement('p');
      p.className = 'small';
      p.textContent = t('noScores');
      root.appendChild(p);
      return;
    }
    list.forEach(function (s, i) {
      const div = document.createElement('div');
      div.className = 'scoreline';
      div.textContent = (i + 1) + '. ' + s.initials + '  ' + s.score;
      root.appendChild(div);
    });
  }

  function today() {
    return Levels.ymd(new Date());
  }

  function renderDaily() {
    dailyDate = today();
    const saved = load('hb.daily', { last: '', streak: 0, best: {} });
    $('dailyLead').textContent = t('dailyLead', { date: dailyDate });
    $('dailyStreak').textContent = t('dailyStreak', { n: saved.streak || 0 });
    const best = saved.best && saved.best[dailyDate];
    $('dailyBest').textContent = best ? t('dailyBest', { n: best }) : t('dailyNone');
  }

  function goalMet() {
    if (!levelDef || !levelDef.goal) return false;
    if (levelDef.goal.type === 'lines') return lines >= levelDef.goal.n;
    if (levelDef.goal.type === 'chickens') return chickens >= levelDef.goal.n;
    return false;
  }

  function updateHud() {
    let goal = '';
    if (mode === 'endless') goal = t('endlessHud', { n: endlessLevel });
    else if (levelDef && levelDef.goal.type === 'chickens') goal = t('goalChicks', { have: chickens, n: levelDef.goal.n });
    else if (levelDef) goal = t('goalLines', { have: lines, n: levelDef.goal.n });
    const goalEl = $('goalText');
    if (goalEl.textContent !== goal) goalEl.textContent = goal;
    const scoreLabel = t('scoreWord', { n: score });
    if ($('scoreText').textContent !== scoreLabel) $('scoreText').textContent = scoreLabel;
    const levelLabel = mode === 'endless' ? String(endlessLevel) : mode === 'daily' ? t('dailyShort') : String(levelDef && levelDef.id ? levelDef.id : 1);
    setText('statLevel', levelLabel);
    setText('statLines', lines);
    setText('statBest', bestValue());
    const pieceRow = $('statPiecesRow');
    if (pieceRow) {
      const limited = !!(levelDef && levelDef.limit && mode !== 'endless');
      pieceRow.hidden = !limited;
      if (limited) setText('statPieces', Math.max(0, levelDef.limit - piecesUsed));
    }
  }

  function setText(id, value) {
    const el = $(id);
    if (!el) return;
    const s = String(value);
    if (el.textContent !== s) el.textContent = s;
  }

  function bestValue() {
    let stored = 0;
    if (mode === 'level' && levelDef) stored = (progress().best[levelDef.id] || 0);
    else if (mode === 'daily' && levelDef) {
      const saved = load('hb.daily', { best: {} });
      stored = (saved.best && saved.best[levelDef.date]) || 0;
    } else {
      load('hb.endless', []).forEach(function (row) {
        stored = Math.max(stored, (row && row.score) || 0);
      });
    }
    return Math.max(stored, score);
  }

  function drawPreviews() {
    Art.renderPreview($('next'), nextPiece, theme());
    Art.renderPreview($('hold'), hold, theme());
  }

  function measure() {
    const wrap = $('boardWrap');
    const r = wrap.getBoundingClientRect();
    const dprCap = quality === 'low' ? 1 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const scale = Math.min(r.width / Art.CW, r.height / Art.CH);
    blit = {
      dw: Math.max(1, Math.round(Art.CW * scale)),
      dh: Math.max(1, Math.round(Art.CH * scale)),
      dpr: dpr
    };
  }

  function paint() {
    Art.renderWell(worldCtx, {
      theme: theme(),
      board: board,
      current: current,
      pos: pos,
      displayY: displayY,
      ghostY: current && showPiece ? ghostY() : 0,
      showPiece: showPiece,
      clearing: clearing,
      shake: shake,
      time: nowTime
    });
    if (!blit || blit.dw < 2) measure();
    if (!blit) return;
    const bw = Math.round(blit.dw * blit.dpr);
    const bh = Math.round(blit.dh * blit.dpr);
    if (boardCanvas.width !== bw || boardCanvas.height !== bh) {
      boardCanvas.width = bw;
      boardCanvas.height = bh;
      boardCanvas.style.width = blit.dw + 'px';
      boardCanvas.style.height = blit.dh + 'px';
    }
    boardCtx.imageSmoothingEnabled = false;
    boardCtx.setTransform(bw / Art.CW, 0, 0, bh / Art.CH, 0, 0);
    boardCtx.drawImage(world, 0, 0);
  }

  function ghostY() {
    let y = pos.y;
    while (valid(pos.x, y + 1, current.shape)) y++;
    return y;
  }

  function eachCell(shape, px, py, fn) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) fn(px + x, py + y);
      }
    }
  }

  function fullRows() {
    const out = [];
    for (let y = 0; y < ROWS; y++) {
      let full = true;
      for (let x = 0; x < COLS; x++) if (!board[y][x]) { full = false; break; }
      if (full) out.push(y);
    }
    return out;
  }

  function chicksIn(rows) {
    let n = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = board[rows[i]];
      for (let x = 0; x < COLS; x++) if (row[x] === 'chick') n++;
    }
    return n;
  }

  function award(cleared, chicks) {
    const mult = mode === 'endless' ? endlessLevel : Math.max(1, Math.ceil(((levelDef && levelDef.id) || 1) / 9));
    const table = [0, 100, 300, 500, 800];
    const pts = (table[cleared] || 800) * mult + chicks * 250;
    score += pts;
    lines += cleared;
    chickens += chicks;
    if (mode === 'endless' && lines >= endlessLevel * 10) {
      endlessLevel++;
      dropMs = Math.max(160, 1000 - (endlessLevel - 1) * 75);
    }
  }

  function popClear(n) {
    const since = nowTime - lastClearAt;
    if (lastClearAt && since < 5000 && since >= 0) combo += 1;
    else combo = 1;
    lastClearAt = nowTime || 1;
    const mult = mode === 'endless' ? endlessLevel : Math.max(1, Math.ceil(((levelDef && levelDef.id) || 1) / 9));
    const table = [0, 100, 300, 500, 800];
    const pts = (table[n] || 800) * mult;
    const cy = Art.CH * 0.4;
    if (n >= 4) Art.floatText(t('row4'), Art.CW / 2, cy, 26);
    else if (n === 3) Art.floatText(t('row3'), Art.CW / 2, cy, 24);
    else if (n === 2) Art.floatText(t('row2'), Art.CW / 2, cy, 22);
    if (combo > 1) Art.floatText(t('combo', { n: combo }), Art.CW / 2, cy + 34, 22);
    else Art.floatText('+' + pts, Art.CW / 2, cy + 30, 18);
  }

  function rate() {
    let stars = 1;
    if (piecesUsed <= levelDef.par) stars = 2;
    if (piecesUsed <= levelDef.par3) stars = 3;
    return stars;
  }

  function win() {
    running = false;
    showPiece = false;
    Audio.stopMusic();
    Audio.win();
    let stars = 1;
    if (mode === 'level') {
      stars = rate();
      const p = progress();
      p.stars[levelDef.id] = Math.max(p.stars[levelDef.id] || 0, stars);
      p.unlocked = Math.max(p.unlocked, Math.min(55, levelDef.id + 1));
      p.best[levelDef.id] = Math.max(p.best[levelDef.id] || 0, score);
      save('hb.progress', p);
    } else if (mode === 'daily') {
      stars = rate();
      const saved = load('hb.daily', { last: '', streak: 0, best: {} });
      const date = levelDef.date;
      if (saved.last !== date) saved.streak = Levels.nextStreak(saved, date);
      saved.last = date;
      saved.best = saved.best || {};
      saved.best[date] = Math.max(saved.best[date] || 0, score);
      save('hb.daily', saved);
    }
    $('winTitle').textContent = t('winTitle');
    $('winText').textContent = t('winBody', { score: score });
    if ($('winBird')) Art.renderRooster($('winBird'), theme());
    let html = '';
    for (let i = 1; i <= 3; i++) {
      html += '<span class="pop" style="animation-delay:' + (i * 80) + 'ms">' + (i <= stars ? '★' : '☆') + '</span>';
    }
    $('winStars').innerHTML = html;
    const hasNext = mode === 'level' && levelDef.id < 54;
    $('winNext').hidden = !hasNext;
    $('ov-win').classList.add('on');
    paint();
  }

  function lose(reason) {
    running = false;
    showPiece = false;
    Audio.stopMusic();
    Audio.lose();
    $('loseTitle').textContent = mode === 'endless' ? t('endlessOver') : t('loseTitle');
    $('loseText').textContent = reason === 'pieces' ? t('losePieces') : t('loseStack');
    $('saveRow').hidden = mode !== 'endless';
    $('ov-lose').classList.add('on');
    paint();
  }

  function spawn() {
    current = nextPiece;
    nextPiece = makePiece(pull());
    pos = { x: spawnX(current.shape), y: 0 };
    displayY = 0;
    canHold = true;
    showPiece = true;
    if (!valid(pos.x, pos.y, current.shape)) {
      pos.y = -1;
      if (!valid(pos.x, pos.y, current.shape)) {
        showPiece = false;
        lose('stack');
        return;
      }
    }
    drawPreviews();
  }

  function afterLock() {
    updateHud();
    if (mode !== 'endless' && goalMet()) {
      win();
      return;
    }
    if (mode !== 'endless' && levelDef.limit && piecesUsed >= levelDef.limit) {
      lose('pieces');
      return;
    }
    spawn();
  }

  function finishClear() {
    const rows = clearing.rows.slice().sort(function (a, b) { return b - a; });
    const chicks = clearing.chicks;
    const n = rows.length;
    for (let i = 0; i < rows.length; i++) {
      board.splice(rows[i], 1);
      board.unshift(emptyRow());
    }
    award(n, chicks);
    clearing = null;
    afterLock();
  }

  function lockPiece() {
    eachCell(current.shape, pos.x, pos.y, function (x, y) {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) board[y][x] = current.kind;
    });
    piecesUsed++;
    showPiece = false;
    Audio.lock();
    const rows = fullRows();
    if (rows.length) {
      const chicks = chicksIn(rows);
      clearing = { rows: rows, chicks: chicks, t: 0, dur: reduced ? 40 : 240 };
      const pal = Art.PAL[theme()];
      rows.forEach(function (ry) {
        const yy = FRAME + ry * BLOCK + BLOCK / 2;
        for (let x = 0; x < COLS; x++) {
          Art.burst(
            FRAME + x * BLOCK + BLOCK / 2,
            yy,
            x % 2 ? pal.gold : pal.cream,
            reduced ? 0 : 2,
            'spark'
          );
          if (board[ry][x] === 'chick') Art.hopChicken(FRAME + x * BLOCK, FRAME + ry * BLOCK);
        }
      });
      if (chicks) Audio.cluck();
      Audio.clear(rows.length);
      popClear(rows.length);
      if (!reduced) shake = rows.length >= 3 ? 1.2 : 0.85;
      acc = 0;
      return;
    }
    acc = 0;
    afterLock();
  }

  function begin(def, nextMode) {
    mode = nextMode;
    levelDef = def;
    scriptQ = (def.queue || []).slice();
    bag = [];
    rng = Levels.mulberry32(def.seed || 1);
    score = 0;
    lines = 0;
    chickens = 0;
    piecesUsed = 0;
    endlessLevel = 1;
    dropMs = def.dropMs || 1000;
    acc = 0;
    hold = null;
    canHold = true;
    clearing = null;
    shake = 0;
    combo = 0;
    lastClearAt = 0;
    paused = false;
    Art.clearFx();
    applyRows(def.rows || []);
    nextPiece = makePiece(pull());
    hideOverlays();
    show('play');
    running = true;
    measure();
    spawn();
    if (!running) {
      paint();
      return;
    }
    updateHud();
    Audio.unlock();
    showIntro();
    startLoop();
  }

  function showIntro() {
    introOn = true;
    let title = '';
    let name = '';
    let goal = '';
    if (mode === 'endless') {
      title = t('endless');
      name = '';
      goal = t('introEndless');
    } else if (mode === 'daily' && levelDef) {
      title = t('daily');
      name = levelDef.date || '';
      goal = t('introLines', { n: levelDef.goal.n });
    } else if (levelDef) {
      title = t('levelWord', { n: levelDef.id });
      name = (levelDef.name && (levelDef.name[lang] || levelDef.name.en)) || '';
      goal = levelDef.goal && levelDef.goal.type === 'chickens'
        ? t('introChicks', { n: levelDef.goal.n })
        : t('introLines', { n: levelDef.goal ? levelDef.goal.n : 1 });
    }
    setText('introTitle', title);
    setText('introName', name);
    setText('introGoal', goal);
    $('ov-intro').classList.add('on');
  }

  function dismissIntro() {
    if (!introOn) return;
    introOn = false;
    $('ov-intro').classList.remove('on');
    if (!muted && running && !paused) Audio.startMusic();
  }

  function startLevel(id) {
    const lv = Levels.LEVELS[id - 1];
    if (!lv) return;
    const p = progress();
    if (id > p.unlocked) return;
    begin(lv, 'level');
  }

  function startDaily(date) {
    const d = date || today();
    begin(Levels.makeDaily(d), 'daily');
  }

  function startEndless() {
    begin({
      id: 'endless',
      rows: [],
      queue: null,
      seed: (Date.now() % 100000) + 1,
      dropMs: 1000,
      limit: null,
      goal: null,
      par: 999,
      par3: 999,
      name: { en: 'Open Hoedown', es: 'Hoedown libre' }
    }, 'endless');
  }

  function move(dx) {
    if (!running || paused || clearing || !showPiece || introOn) return;
    if (valid(pos.x + dx, pos.y, current.shape)) {
      pos.x += dx;
      Audio.move();
    }
  }
  function rotate(dir) {
    if (!running || paused || clearing || !showPiece || introOn) return;
    const rot = dir < 0 ? ccw(current.shape) : cw(current.shape);
    const kicks = [0, 1, -1, 2, -2];
    for (let i = 0; i < kicks.length; i++) {
      if (valid(pos.x + kicks[i], pos.y, rot)) {
        pos.x += kicks[i];
        current.shape = rot;
        Audio.rotate();
        return;
      }
    }
    if (valid(pos.x, pos.y - 1, rot)) {
      pos.y -= 1;
      current.shape = rot;
      Audio.rotate();
    }
  }
  function softDrop() {
    if (!running || paused || clearing || !showPiece || introOn) return;
    if (valid(pos.x, pos.y + 1, current.shape)) {
      pos.y += 1;
      score += 1;
      acc = 0;
      updateHud();
    }
  }
  function hardDrop() {
    if (!running || paused || clearing || !showPiece || introOn) return;
    let n = 0;
    while (valid(pos.x, pos.y + 1, current.shape)) {
      pos.y += 1;
      n++;
    }
    score += n * 2;
    displayY = pos.y;
    Audio.drop();
    lockPiece();
    updateHud();
  }
  function doHold() {
    if (!running || paused || clearing || !canHold || !showPiece || introOn) return;
    const previous = current;
    if (!hold) {
      hold = previous;
      current = nextPiece;
      nextPiece = makePiece(pull());
    } else {
      current = hold;
      hold = previous;
    }
    pos = { x: spawnX(current.shape), y: 0 };
    displayY = 0;
    canHold = false;
    if (!valid(pos.x, pos.y, current.shape)) {
      showPiece = false;
      lose('stack');
      return;
    }
    Audio.rotate();
    drawPreviews();
  }

  function togglePause(force) {
    const winOn = $('ov-win').classList.contains('on');
    const loseOn = $('ov-lose').classList.contains('on');
    if (!running || winOn || loseOn) return;
    if (force === true) paused = true;
    else if (force === false) paused = false;
    else paused = !paused;
    $('ov-pause').classList.toggle('on', paused);
    if (paused) Audio.stopMusic();
    else if (!muted) Audio.startMusic();
  }

  function setMuted(next) {
    muted = next;
    save('hb.mute', muted);
    Audio.setMuted(muted);
    if (!muted && running && !paused) Audio.startMusic();
    applyI18n();
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const dt = lastTs ? Math.min(34, now - lastTs) : 16.67;
    if (lastTs && running) {
      frameSamples.push(dt);
      if (frameSamples.length > 360) frameSamples.shift();
      if (dt > 22) {
        slowStreak++;
        if (slowStreak > 45 && quality === 'high') {
          quality = 'low';
          Art.setQuality('low');
          measure();
        }
      } else {
        slowStreak = Math.max(0, slowStreak - 1);
      }
    }
    lastTs = now;
    nowTime = now;
    if (running && !paused && !clearing && !introOn) {
      acc += dt;
      let steps = 0;
      while (acc >= dropMs && steps < 3 && running && !clearing) {
        acc -= dropMs;
        if (valid(pos.x, pos.y + 1, current.shape)) pos.y += 1;
        else {
          lockPiece();
          break;
        }
        steps++;
      }
    }
    if (clearing) {
      clearing.t += dt;
      if (clearing.t >= clearing.dur) finishClear();
    }
    if (showPiece && current) {
      const diff = pos.y - displayY;
      displayY += diff * Math.min(1, dt / (Math.abs(diff) > 2 ? 36 : 80));
      if (Math.abs(pos.y - displayY) < 0.02) displayY = pos.y;
    }
    if (shake > 0) shake = Math.max(0, shake - dt / 180);
    Art.stepFx(dt);
    if (screen === 'play') paint();
  }

  function startLoop() {
    if (rafId) return;
    lastTs = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function titleFrame(now) {
    titleRaf = requestAnimationFrame(titleFrame);
    Art.renderTitle(titleCtx, titleCanvas.width, titleCanvas.height, theme(), now || 0);
  }
  function startTitle() {
    if (titleRaf) return;
    titleRaf = requestAnimationFrame(titleFrame);
  }
  function stopTitle() {
    if (titleRaf) cancelAnimationFrame(titleRaf);
    titleRaf = 0;
  }

  function bindPress(el, fn, repeat) {
    let delay = null;
    let iv = null;
    function stop() {
      el.classList.remove('is-down');
      clearTimeout(delay);
      clearInterval(iv);
      delay = null;
      iv = null;
    }
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      el.classList.add('is-down');
      Audio.unlock();
      fn();
      if (repeat) delay = setTimeout(function () { iv = setInterval(fn, 120); }, 200);
    });
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }

  function newGate(keepMsg) {
    const a = 12 + Math.floor(Math.random() * 8);
    const b = 3 + Math.floor(Math.random() * 7);
    gate = { a: a, b: b, ans: a * b };
    $('gateQ').textContent = a + ' × ' + b + ' = ?';
    $('gateA').value = '';
    if (!keepMsg) $('gateMsg').textContent = '';
    $('gate').hidden = false;
    $('storeItems').hidden = true;
  }

  function openStore() {
    newGate(false);
  }

  function submitGate() {
    const v = parseInt($('gateA').value, 10);
    if (v !== gate.ans) {
      Audio.deny();
      newGate(true);
      $('gateMsg').textContent = t('gateNo');
      return;
    }
    Audio.tap();
    $('gate').hidden = true;
    renderStore();
  }

  function renderStore() {
    const box = $('storeItems');
    box.hidden = false;
    box.textContent = '';
    const note = document.createElement('p');
    note.className = 'small';
    note.id = 'storeNote';
    note.textContent = t('storeOff') + ' ' + t('storeFree');
    box.appendChild(note);
    IAP.products.forEach(function (p) {
      const card = document.createElement('div');
      card.className = 'sku';
      const title = document.createElement('b');
      title.textContent = t(p.nameKey) + ' · ' + p.price;
      const desc = document.createElement('div');
      desc.className = 'small';
      desc.textContent = t(p.descKey);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'buy';
      btn.dataset.sku = p.sku;
      btn.textContent = t('buy');
      btn.addEventListener('click', function () { buy(p.sku); });
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(btn);
      box.appendChild(card);
    });
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.id = 'restoreBtn';
    restore.textContent = t('restore');
    restore.addEventListener('click', function () { doRestore(); });
    box.appendChild(restore);
    const msg = document.createElement('p');
    msg.id = 'iapMsg';
    msg.className = 'small';
    box.appendChild(msg);
  }

  async function buy(sku) {
    const result = await IAP.purchase(sku);
    window.HB.lastIap = result;
    const msg = $('iapMsg');
    if (msg) msg.textContent = t('purchaseOff');
  }
  async function doRestore() {
    const result = await IAP.restore();
    window.HB.lastIap = result;
    const msg = $('iapMsg');
    if (msg) msg.textContent = t('restoreOff');
  }

  function saveInitials() {
    const raw = ($('initials').value || 'AAA').toUpperCase().replace(/[^A-Z]/g, '');
    const initials = (raw || 'AAA').slice(0, 3);
    const list = load('hb.endless', []);
    list.push({ initials: initials, score: score });
    list.sort(function (a, b) { return b.score - a.score; });
    save('hb.endless', list.slice(0, 5));
    show('scores');
  }

  function currentDpr() {
    return Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1 : 1.5);
  }

  function frameStats() {
    const arr = frameSamples.slice(-120);
    if (!arr.length) return { avg: 0, p95: 0, frames: 0, dpr: currentDpr(), quality: quality };
    const sorted = arr.slice().sort(function (a, b) { return a - b; });
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    return {
      avg: sum / arr.length,
      p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      frames: frameSamples.length,
      dpr: currentDpr(),
      quality: quality
    };
  }

  function bootStorage() {
    try {
      lang = localStorage.getItem('hb.lang') === 'es' ? 'es' : 'en';
      muted = localStorage.getItem('hb.mute') === 'true' || localStorage.getItem('hb.mute') === '1';
    } catch (e) {
      lang = 'en';
      muted = false;
    }
    if (!load('hb.endless', null)) {
      const old = load('hoedownTop', null);
      if (old && old.length) save('hb.endless', old.slice(0, 5));
    }
    Audio.setMuted(muted);
  }

  document.addEventListener('hoedown-theme', function () {
    Art.invalidate();
    if (screen === 'play') paint();
    applyI18n();
  });

  $('langBtn').addEventListener('click', function () {
    lang = lang === 'en' ? 'es' : 'en';
    try { localStorage.setItem('hb.lang', lang); } catch (e) {}
    applyI18n();
  });
  $('soundBtn').addEventListener('click', function () { setMuted(!muted); Audio.unlock(); });
  $('hudMute').addEventListener('click', function () { setMuted(!muted); });
  $('btnPlay').addEventListener('click', function () { startLevel(frontier()); });
  $('btnLevels').addEventListener('click', function () { show('levels'); });
  $('btnDaily').addEventListener('click', function () { show('daily'); });
  $('btnEndless').addEventListener('click', function () { startEndless(); });
  $('btnHow').addEventListener('click', function () { show('how'); });
  $('btnSettings').addEventListener('click', function () { show('settings'); });
  $('btnScores').addEventListener('click', function () { show('scores'); });
  $('btnStore').addEventListener('click', function () { show('store'); });
  $('levelsBack').addEventListener('click', function () { show('title'); });
  $('howBack').addEventListener('click', function () { show('title'); });
  $('settingsBack').addEventListener('click', function () { show('title'); });
  document.querySelectorAll('[data-theme-choice]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.HoedownTheme) window.HoedownTheme.set(btn.getAttribute('data-theme-choice'));
    });
  });
  $('dailyBack').addEventListener('click', function () { show('title'); });
  $('scoresBack').addEventListener('click', function () { show('title'); });
  $('storeBack').addEventListener('click', function () { show('title'); });
  $('btnDailyStart').addEventListener('click', function () { startDaily(today()); });
  $('introGo').addEventListener('click', function () { dismissIntro(); Audio.unlock(); });
  $('pauseBtn').addEventListener('click', function () { togglePause(); });
  $('resumeBtn').addEventListener('click', function () { togglePause(false); });
  $('restartBtn').addEventListener('click', function () {
    if (mode === 'daily') startDaily(levelDef.date);
    else if (mode === 'endless') startEndless();
    else startLevel(levelDef.id);
  });
  $('pauseMenu').addEventListener('click', function () { show('title'); });
  $('winMenu').addEventListener('click', function () { show('title'); });
  $('loseMenu').addEventListener('click', function () { show('title'); });
  $('winRetry').addEventListener('click', function () {
    if (mode === 'daily') startDaily(levelDef.date);
    else startLevel(levelDef.id);
  });
  $('loseRetry').addEventListener('click', function () {
    if (mode === 'endless') startEndless();
    else if (mode === 'daily') startDaily(levelDef.date);
    else startLevel(levelDef.id);
  });
  $('winNext').addEventListener('click', function () {
    if (mode === 'level' && levelDef.id < 54) startLevel(levelDef.id + 1);
  });
  $('gateGo').addEventListener('click', submitGate);
  $('gateA').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitGate();
  });
  $('saveScore').addEventListener('click', saveInitials);

  bindPress($('leftBtn'), function () { move(-1); }, true);
  bindPress($('rightBtn'), function () { move(1); }, true);
  bindPress($('softBtn'), function () { softDrop(); }, true);
  bindPress($('rotBtn'), function () { rotate(1); }, false);
  bindPress($('hardBtn'), function () { hardDrop(); }, false);
  bindPress($('holdBtn'), function () { doHold(); }, false);

  let drag = null;
  boardCanvas.addEventListener('pointerdown', function (e) {
    if (screen !== 'play') return;
    try { boardCanvas.setPointerCapture(e.pointerId); } catch (err) {}
    const rect = boardCanvas.getBoundingClientRect();
    drag = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      colW: Math.max(12, rect.width / COLS),
      columns: 0,
      dropped: false
    };
    Audio.unlock();
  });
  boardCanvas.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id || drag.dropped) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    const want = Math.trunc(dx / drag.colW);
    while (drag.columns < want) { move(1); drag.columns += 1; }
    while (drag.columns > want) { move(-1); drag.columns -= 1; }
    if (dy > 56 && dy > Math.abs(dx) * 1.15) {
      drag.dropped = true;
      hardDrop();
    }
  });
  boardCanvas.addEventListener('pointerup', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    const dropped = drag.dropped;
    drag = null;
    if (!dropped && Math.abs(dx) < 14 && Math.abs(dy) < 14) rotate(1);
  });
  boardCanvas.addEventListener('pointercancel', function () { drag = null; });

  document.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    if (e.key === 'm' || e.key === 'M') { setMuted(!muted); return; }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (screen === 'play') togglePause();
      return;
    }
    if (screen !== 'play') return;
    if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { move(1); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { softDrop(); e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X') { rotate(1); e.preventDefault(); }
    else if (e.key === 'z' || e.key === 'Z') { rotate(-1); e.preventDefault(); }
    else if (e.key === ' ') { hardDrop(); e.preventDefault(); }
    else if (e.key === 'c' || e.key === 'C') { doHold(); e.preventDefault(); }
  });

  document.addEventListener('pointerdown', function () { Audio.unlock(); }, { once: false });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && running && !paused) togglePause(true);
  });
  window.addEventListener('resize', function () {
    if (screen === 'play') {
      measure();
      paint();
    }
  });

  bootStorage();
  IAP.init();
  show('title');
  document.documentElement.setAttribute('data-ready', '1');

  window.HB = {
    IAP_ON: IAP.IAP_ON,
    levelCount: Levels.LEVELS.length,
    strings: window.HoedownStrings,
    startLevel: startLevel,
    startDaily: startDaily,
    startEndless: startEndless,
    hardDrop: hardDrop,
    move: move,
    rotate: rotate,
    frameStats: frameStats,
    resetFrames: function () { frameSamples.length = 0; },
    state: function () {
      return {
        screen: screen,
        running: running,
        paused: paused,
        mode: mode,
        score: score,
        lines: lines,
        chickens: chickens,
        piecesUsed: piecesUsed,
        levelId: levelDef ? levelDef.id : null,
        goal: levelDef ? levelDef.goal : null,
        lang: lang,
        theme: theme(),
        quality: quality,
        dpr: currentDpr(),
        showPiece: showPiece,
        shape: current ? { w: current.shape[0].length, h: current.shape.length } : null,
        pos: { x: pos.x, y: pos.y }
      };
    }
  };
})();
