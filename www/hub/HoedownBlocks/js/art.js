/* Hand-drawn homestead art. Sprites are painted once and blitted.
   Device pixel ratio is capped by the game so low-end phones stay near 60fps. */
(function (root) {
  'use strict';
  const BLOCK = 26;
  const COLS = 10;
  const ROWS = 20;
  const FRAME = 28;
  const CW = COLS * BLOCK + FRAME * 2;
  const CH = ROWS * BLOCK + FRAME * 2;

  const PIECES = {
    I: { kind: 'pine', m: [[1, 1, 1, 1]] },
    O: { kind: 'hay', m: [[1, 1], [1, 1]] },
    T: { kind: 'fence', m: [[0, 1, 0], [1, 1, 1]] },
    J: { kind: 'barn', m: [[1, 0, 0], [1, 1, 1]] },
    L: { kind: 'garden', m: [[0, 0, 1], [1, 1, 1]] },
    S: { kind: 'creek', m: [[0, 1, 1], [1, 1, 0]] },
    Z: { kind: 'porch', m: [[1, 1, 0], [0, 1, 1]] }
  };

  const CHAR = {
    H: 'hay', P: 'pine', F: 'fence', B: 'barn', G: 'garden', C: 'creek', R: 'porch', K: 'chick'
  };

  const PAL = {
    light: {
      skyTop: '#F6E7C2', skyBot: '#E7F0D8', dirt: '#E7D3A1', dirtAlt: '#DCC48A',
      pine: '#305032', pineDark: '#1E3320', gold: '#C19A50', hay: '#E6C36A', hayDark: '#8C6428',
      twine: '#6B4A2B', barn: '#8E3B32', barnDark: '#5C241E', cream: '#F3E6C4',
      fence: '#8B5A2B', garden: '#3E7A45', creek: '#6A8CA3', porch: '#6E5B3C',
      feather: '#F7F1E4', comb: '#A33B32', beak: '#C19A50', ink: '#1A1A1A',
      frame: '#6B4E2E', wood: '#C4A36A', hill: '#3E6240'
    },
    dark: {
      skyTop: '#121610', skyBot: '#1A1A1A', dirt: '#2A241C', dirtAlt: '#332B22',
      pine: '#3E6B40', pineDark: '#243828', gold: '#C19A50', hay: '#C19A50', hayDark: '#8C6A32',
      twine: '#E6D2A2', barn: '#A34B40', barnDark: '#6E312A', cream: '#F3E6C4',
      fence: '#C19A50', garden: '#6EA36A', creek: '#8FB4C9', porch: '#A89068',
      feather: '#F3E6C4', comb: '#C19A50', beak: '#E6C36A', ink: '#1A1A1A',
      frame: '#3A3228', wood: '#A89068', hill: '#243828'
    }
  };

  let sprites = {};
  let wellCache = null;
  let wellKey = '';
  let titleCache = null;
  let titleKey = '';
  let quality = 'high';
  let reduced = false;
  const fx = [];
  const pool = [];
  const floats = [];
  const hops = [];

  function roundRect(g, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath();
    g.moveTo(x + rr, y);
    g.arcTo(x + w, y, x + w, y + h, rr);
    g.arcTo(x + w, y + h, x, y + h, rr);
    g.arcTo(x, y + h, x, y, rr);
    g.arcTo(x, y, x + w, y, rr);
    g.closePath();
  }

  function glossyBase(g, fill, dark) {
    g.fillStyle = 'rgba(26,26,26,.34)';
    roundRect(g, 2.4, 3.6, BLOCK - 4.6, BLOCK - 4.8, 7);
    g.fill();
    const grad = g.createLinearGradient(1, 1, BLOCK - 2, BLOCK - 2);
    grad.addColorStop(0, '#fff6df');
    grad.addColorStop(0.18, fill);
    grad.addColorStop(0.72, fill);
    grad.addColorStop(1, dark);
    g.fillStyle = grad;
    roundRect(g, 1.2, 0.8, BLOCK - 3.2, BLOCK - 4, 7);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)';
    roundRect(g, 4, 2.2, BLOCK - 9, 5.5, 3);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.fillRect(3.5, 4, 2.2, BLOCK - 12);
    g.fillStyle = 'rgba(0,0,0,.2)';
    g.fillRect(4, BLOCK - 7.2, BLOCK - 9, 2.4);
  }

  function withTile(g, fill, dark, draw) {
    glossyBase(g, fill, dark);
    g.save();
    roundRect(g, 3, 7, BLOCK - 7, BLOCK - 12, 4);
    g.clip();
    draw();
    g.restore();
    g.strokeStyle = 'rgba(26,26,26,.4)';
    g.lineWidth = 1.25;
    roundRect(g, 1.4, 1, BLOCK - 3.6, BLOCK - 4.2, 7);
    g.stroke();
  }

  function paintHay(g, pal) {
    withTile(g, pal.hay, pal.hayDark, function () {
      g.strokeStyle = pal.hayDark;
      g.lineWidth = 1.1;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(4, 9 + i * 4);
        g.quadraticCurveTo(BLOCK / 2, 7 + i * 4, BLOCK - 4, 10 + i * 4);
        g.stroke();
      }
      g.strokeStyle = pal.twine;
      g.beginPath();
      g.moveTo(BLOCK / 2, 7);
      g.lineTo(BLOCK / 2, BLOCK - 5);
      g.moveTo(5, BLOCK / 2);
      g.lineTo(BLOCK - 5, BLOCK / 2);
      g.stroke();
    });
  }

  function paintPine(g, pal) {
    withTile(g, pal.pine, pal.pineDark, function () {
      g.fillStyle = pal.pineDark;
      g.fillRect(4, 10, BLOCK - 8, 8);
      g.fillStyle = pal.wood;
      g.beginPath();
      g.arc(8, 14, 3.2, 0, 6.28);
      g.fill();
      g.beginPath();
      g.arc(BLOCK - 8, 14, 3.2, 0, 6.28);
      g.fill();
    });
  }

  function paintFence(g, pal) {
    withTile(g, pal.fence, pal.hayDark, function () {
      g.fillStyle = pal.cream;
      g.fillRect(4, 9, BLOCK - 8, 2.4);
      g.fillRect(4, 15, BLOCK - 8, 2.4);
      g.fillStyle = 'rgba(26,26,26,.35)';
      g.fillRect(BLOCK / 2 - 1, 8, 2, 10);
    });
  }

  function paintBarn(g, pal) {
    withTile(g, pal.barn, pal.barnDark, function () {
      g.strokeStyle = pal.barnDark;
      g.lineWidth = 1;
      for (let y = 9; y < BLOCK - 4; y += 4) {
        g.beginPath();
        g.moveTo(4, y);
        g.lineTo(BLOCK - 4, y);
        g.stroke();
      }
      g.strokeStyle = pal.cream;
      g.lineWidth = 1.3;
      g.strokeRect(7, 9, BLOCK - 14, BLOCK - 15);
      g.beginPath();
      g.moveTo(8, 10);
      g.lineTo(BLOCK - 8, BLOCK - 7);
      g.moveTo(BLOCK - 8, 10);
      g.lineTo(8, BLOCK - 7);
      g.stroke();
    });
  }

  function paintGarden(g, pal) {
    withTile(g, pal.garden, pal.pineDark, function () {
      g.strokeStyle = pal.cream;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(BLOCK / 2, BLOCK - 6);
      g.quadraticCurveTo(BLOCK / 2 - 3, 12, 7, 9);
      g.moveTo(BLOCK / 2, BLOCK - 6);
      g.quadraticCurveTo(BLOCK / 2 + 3, 12, BLOCK - 7, 9);
      g.stroke();
      g.fillStyle = pal.gold;
      g.beginPath();
      g.arc(BLOCK / 2, 10, 2, 0, 6.28);
      g.fill();
    });
  }

  function paintCreek(g, pal) {
    withTile(g, pal.creek, '#3d5c73', function () {
      g.strokeStyle = pal.cream;
      g.globalAlpha = 0.85;
      g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(4, 11);
      g.quadraticCurveTo(BLOCK / 2, 8, BLOCK - 4, 12);
      g.moveTo(4, 16);
      g.quadraticCurveTo(BLOCK / 2, 13, BLOCK - 4, 17);
      g.stroke();
      g.globalAlpha = 1;
    });
  }

  function paintPorch(g, pal) {
    withTile(g, pal.porch, pal.hayDark, function () {
      g.strokeStyle = 'rgba(26,26,26,.35)';
      g.lineWidth = 1.1;
      for (let x = 6; x < BLOCK - 3; x += 5) {
        g.beginPath();
        g.moveTo(x, 8);
        g.lineTo(x, BLOCK - 6);
        g.stroke();
      }
    });
  }

  const PAINT = {
    hay: paintHay, pine: paintPine, fence: paintFence, barn: paintBarn,
    garden: paintGarden, creek: paintCreek, porch: paintPorch, chick: paintHay
  };

  function sprite(kind, theme) {
    const key = theme + '|' + kind;
    if (sprites[key]) return sprites[key];
    const c = document.createElement('canvas');
    c.width = BLOCK;
    c.height = BLOCK;
    const g = c.getContext('2d');
    (PAINT[kind] || paintHay)(g, PAL[theme] || PAL.light);
    sprites[key] = c;
    return c;
  }

  function drawChicken(ctx, x, y, pal, time, scale) {
    const s = scale || 1;
    const bob = reduced ? 0 : Math.sin(time / 180 + x) * 1.1;
    ctx.save();
    ctx.translate(x + BLOCK * s * 0.5, y + bob + BLOCK * s * 0.62);
    ctx.scale(s, s);
    ctx.fillStyle = pal.comb;
    ctx.beginPath();
    ctx.arc(4, -10, 2.3, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = pal.feather;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 6.5, 0, 0, 6.28);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -5, 4.2, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = pal.beak;
    ctx.beginPath();
    ctx.moveTo(9, -5);
    ctx.lineTo(13, -3.5);
    ctx.lineTo(9, -2);
    ctx.fill();
    ctx.fillStyle = pal.ink;
    ctx.fillRect(7, -6.2, 1.4, 1.4);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, 5);
    ctx.lineTo(-3, 9);
    ctx.moveTo(2, 5);
    ctx.lineTo(3, 9);
    ctx.stroke();
    ctx.restore();
  }

  function drawPines(ctx, pal, w, ground) {
    const spots = [0.08, 0.2, 0.33, 0.46, 0.78, 0.9];
    for (let i = 0; i < spots.length; i++) {
      const x = w * spots[i];
      const h = 70 + (i % 3) * 18;
      ctx.fillStyle = i % 2 ? pal.pine : pal.pineDark;
      ctx.beginPath();
      ctx.moveTo(x, ground - h);
      ctx.lineTo(x + 22, ground - h * 0.35);
      ctx.lineTo(x - 22, ground - h * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, ground - h * 0.62);
      ctx.lineTo(x + 30, ground - 8);
      ctx.lineTo(x - 30, ground - 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = pal.porch;
      ctx.fillRect(x - 3, ground - 12, 6, 12);
    }
  }

  function drawBarn(ctx, x, y, w, h, pal) {
    ctx.fillStyle = pal.barnDark;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + h * 0.28);
    ctx.lineTo(x + w / 2, y - 8);
    ctx.lineTo(x + w + 8, y + h * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pal.barn;
    ctx.fillRect(x, y + h * 0.22, w, h * 0.78);
    ctx.fillStyle = pal.cream;
    ctx.fillRect(x + w * 0.38, y + h * 0.08, w * 0.18, h * 0.16);
    ctx.strokeStyle = pal.cream;
    ctx.lineWidth = Math.max(2, w * 0.03);
    const dx = x + w * 0.28;
    const dy = y + h * 0.48;
    const dw = w * 0.44;
    const dh = h * 0.4;
    ctx.strokeRect(dx, dy, dw, dh);
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx + dw, dy + dh);
    ctx.moveTo(dx + dw, dy);
    ctx.lineTo(dx, dy + dh);
    ctx.stroke();
  }

  function drawHayBale(ctx, x, y, w, h, pal) {
    ctx.fillStyle = pal.hay;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = pal.hayDark;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 8 + i * (h / 3));
      ctx.quadraticCurveTo(x + w / 2, y + 4 + i * (h / 3), x + w - 4, y + 10 + i * (h / 3));
      ctx.stroke();
    }
    ctx.strokeStyle = pal.twine;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();
  }

  function drawFenceLine(ctx, y, w, pal) {
    ctx.strokeStyle = pal.fence;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(w - 16, y);
    ctx.moveTo(16, y + 10);
    ctx.lineTo(w - 16, y + 10);
    ctx.stroke();
    ctx.lineWidth = 5;
    for (let x = 28; x < w; x += 54) {
      ctx.beginPath();
      ctx.moveTo(x, y - 16);
      ctx.lineTo(x, y + 22);
      ctx.stroke();
    }
  }

  function drawHomestead(ctx, w, h, pal, theme) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, pal.skyTop);
    sky.addColorStop(1, pal.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    if (theme === 'dark') {
      ctx.fillStyle = pal.cream;
      for (let i = 0; i < 18; i++) {
        const sx = (i * 97) % w;
        const sy = (i * 53) % (h * 0.45);
        ctx.globalAlpha = 0.7;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.cream;
      ctx.beginPath();
      ctx.arc(w * 0.16, h * 0.2, Math.max(16, w * 0.045), 0, 6.28);
      ctx.fill();
    } else {
      ctx.fillStyle = pal.gold;
      ctx.beginPath();
      ctx.arc(w * 0.16, h * 0.2, Math.max(18, w * 0.05), 0, 6.28);
      ctx.fill();
      ctx.fillStyle = 'rgba(243,230,196,.45)';
      ctx.beginPath();
      ctx.arc(w * 0.16, h * 0.2, Math.max(26, w * 0.07), 0, 6.28);
      ctx.fill();
    }
    const ground = h * 0.78;
    ctx.fillStyle = pal.hill;
    ctx.beginPath();
    ctx.moveTo(0, ground);
    ctx.quadraticCurveTo(w * 0.25, ground - h * 0.12, w * 0.5, ground);
    ctx.quadraticCurveTo(w * 0.75, ground + h * 0.04, w, ground - h * 0.05);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    drawPines(ctx, pal, w, ground - 4);
    drawBarn(ctx, w * 0.58, h * 0.3, w * 0.28, h * 0.42, pal);
    drawHayBale(ctx, w * 0.1, ground - h * 0.16, w * 0.16, h * 0.12, pal);
    drawHayBale(ctx, w * 0.18, ground - h * 0.26, w * 0.14, h * 0.11, pal);
    ctx.fillStyle = pal.dirt;
    ctx.fillRect(0, ground, w, h - ground);
    drawFenceLine(ctx, ground - 6, w, pal);
  }

  function paintScene(g, w, h, pal, theme) {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, pal.skyTop);
    sky.addColorStop(0.45, pal.skyBot);
    sky.addColorStop(1, theme === 'dark' ? '#14110e' : '#c4a36a');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    if (theme === 'dark') {
      g.fillStyle = pal.cream;
      for (let i = 0; i < 28; i++) {
        g.globalAlpha = 0.35 + (i % 3) * 0.15;
        g.fillRect((i * 53) % w, (i * 29) % (h * 0.42), i % 4 === 0 ? 2 : 1.4, i % 4 === 0 ? 2 : 1.4);
      }
      g.globalAlpha = 1;
      g.beginPath();
      g.arc(w * 0.18, h * 0.1, 14, 0, 6.28);
      g.fill();
    } else {
      g.fillStyle = 'rgba(243,230,196,.55)';
      g.beginPath();
      g.arc(w * 0.16, h * 0.09, 26, 0, 6.28);
      g.fill();
      g.fillStyle = pal.gold;
      g.beginPath();
      g.arc(w * 0.16, h * 0.09, 14, 0, 6.28);
      g.fill();
    }
    g.fillStyle = theme === 'dark' ? '#243428' : '#9dbe96';
    g.beginPath();
    g.moveTo(0, h * 0.34);
    g.quadraticCurveTo(w * 0.28, h * 0.22, w * 0.52, h * 0.33);
    g.quadraticCurveTo(w * 0.78, h * 0.44, w, h * 0.28);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.fill();
    g.fillStyle = pal.hill;
    g.beginPath();
    g.moveTo(0, h * 0.58);
    g.quadraticCurveTo(w * 0.22, h * 0.44, w * 0.48, h * 0.56);
    g.quadraticCurveTo(w * 0.74, h * 0.68, w, h * 0.5);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.fill();
    drawPines(g, pal, w, h * 0.34);
    drawBarn(g, w * 0.68, h * 0.06, w * 0.2, h * 0.2, pal);
    drawHayBale(g, w * 0.06, h * 0.16, 14, 7, pal);
    drawHayBale(g, w * 0.16, h * 0.14, 11, 6, pal);
    drawFenceLine(g, h * 0.36, w, pal);
    const vig = g.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h * 0.5, h * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, theme === 'dark' ? 'rgba(0,0,0,.4)' : 'rgba(48,32,16,.2)');
    g.fillStyle = vig;
    g.fillRect(0, 0, w, h);
  }

  function buildWell(theme) {
    const pal = PAL[theme] || PAL.light;
    const c = document.createElement('canvas');
    c.width = CW;
    c.height = CH;
    const g = c.getContext('2d');
    const innerW = COLS * BLOCK;
    const innerH = ROWS * BLOCK;
    g.fillStyle = theme === 'dark' ? '#1A1A1A' : '#F3EEDF';
    g.fillRect(0, 0, CW, CH);
    const scene = document.createElement('canvas');
    scene.width = innerW;
    scene.height = innerH;
    paintScene(scene.getContext('2d'), innerW, innerH, pal, theme);
    g.save();
    g.filter = 'blur(6px)';
    g.drawImage(scene, FRAME, FRAME);
    g.restore();
    g.fillStyle = 'rgba(26, 22, 16, 0.30)';
    g.fillRect(FRAME, FRAME, innerW, innerH);
    g.fillStyle = theme === 'dark' ? 'rgba(18, 20, 16, 0.16)' : 'rgba(243, 238, 223, 0.10)';
    g.fillRect(FRAME, FRAME, innerW, innerH);
    g.strokeStyle = theme === 'dark' ? 'rgba(243,230,196,.26)' : 'rgba(48,80,50,.28)';
    g.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      g.beginPath();
      g.moveTo(FRAME + x * BLOCK + 0.5, FRAME);
      g.lineTo(FRAME + x * BLOCK + 0.5, FRAME + ROWS * BLOCK);
      g.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      g.beginPath();
      g.moveTo(FRAME, FRAME + y * BLOCK + 0.5);
      g.lineTo(FRAME + COLS * BLOCK, FRAME + y * BLOCK + 0.5);
      g.stroke();
    }
    g.strokeStyle = pal.wood;
    g.lineWidth = 5;
    g.strokeRect(FRAME - 4, FRAME - 4, innerW + 8, innerH + 8);
    g.strokeStyle = pal.gold;
    g.lineWidth = 2;
    g.strokeRect(FRAME - 1, FRAME - 1, innerW + 2, innerH + 2);
    return c;
  }

  function drawSpark(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.28, y - r * 0.28);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x + r * 0.28, y + r * 0.28);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.28, y + r * 0.28);
    ctx.lineTo(x - r, y);
    ctx.lineTo(x - r * 0.28, y - r * 0.28);
    ctx.closePath();
    ctx.fill();
  }

  function cap() {
    if (reduced) return 0;
    return quality === 'low' ? 16 : 48;
  }

  const api = {
    BLOCK: BLOCK, COLS: COLS, ROWS: ROWS, FRAME: FRAME, CW: CW, CH: CH,
    PIECES: PIECES, CHAR: CHAR, PAL: PAL,
    setQuality: function (q) { quality = q === 'low' ? 'low' : 'high'; },
    setReduced: function (r) { reduced = !!r; },
    invalidate: function () {
      sprites = {};
      wellCache = null;
      wellKey = '';
      titleCache = null;
      titleKey = '';
    },
    clearFx: function () {
      while (fx.length) pool.push(fx.pop());
      floats.length = 0;
      hops.length = 0;
    },
    burst: function (x, y, color, n, kind) {
      const limit = cap();
      const spark = kind === 'spark';
      for (let i = 0; i < n; i++) {
        if (fx.length >= limit) break;
        const p = pool.pop() || {};
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * (spark ? 1.5 : 2.4);
        p.vy = spark ? -1.1 - Math.random() * 1.7 : -0.7 - Math.random() * 1.6;
        p.g = spark ? 0.015 : 0.08;
        p.life = 1;
        p.color = color;
        p.size = spark ? 3 + Math.random() * 2.4 : 2 + Math.random() * 2;
        p.kind = spark ? 'spark' : 'dot';
        fx.push(p);
      }
    },
    hopChicken: function (x, y) {
      if (reduced) return;
      if (hops.length >= 4) hops.shift();
      hops.push({ x: x, y: y, t: 0, dur: 680 });
    },
    floatText: function (text, x, y, size) {
      floats.push({ text: text, x: x, y: y, life: 1, size: size || 16 });
      if (floats.length > 6) floats.shift();
    },
    stepFx: function (dt) {
      const k = dt / 16.67;
      for (let i = fx.length - 1; i >= 0; i--) {
        const p = fx[i];
        p.x += p.vx * k;
        p.y += p.vy * k;
        p.vy += p.g * k;
        p.life -= 0.028 * k;
        if (p.life <= 0) {
          pool.push(p);
          fx.splice(i, 1);
        }
      }
      for (let i = hops.length - 1; i >= 0; i--) {
        hops[i].t += dt;
        if (hops[i].t >= hops[i].dur) hops.splice(i, 1);
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        floats[i].y -= 0.45 * k;
        floats[i].life -= 0.016 * k;
        if (floats[i].life <= 0) floats.splice(i, 1);
      }
    },
    renderTitle: function (ctx, w, h, theme, time) {
      const key = theme + '|' + w + '|' + h;
      const pal = PAL[theme] || PAL.light;
      if (titleKey !== key) {
        titleCache = document.createElement('canvas');
        titleCache.width = w;
        titleCache.height = h;
        drawHomestead(titleCache.getContext('2d'), w, h, pal, theme);
        titleKey = key;
      }
      ctx.drawImage(titleCache, 0, 0);
      const ground = h * 0.78;
      const spots = [[0.24, 0], [0.4, 1.4], [0.52, 2.2]];
      for (let i = 0; i < spots.length; i++) {
        const drift = reduced ? 0 : Math.sin(time / 700 + spots[i][1]) * w * 0.012;
        drawChicken(ctx, w * spots[i][0] + drift, ground - BLOCK * 0.2, pal, time + i * 40, 1.7);
      }
      if (theme === 'dark' && !reduced) {
        ctx.fillStyle = pal.gold;
        for (let i = 0; i < 5; i++) {
          const fx0 = (time / 40 + i * 30) % w;
          ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time / 200 + i);
          ctx.fillRect(fx0, h * 0.18 + i * 8, 2, 2);
        }
        ctx.globalAlpha = 1;
      }
    },
    renderRooster: function (canvas, theme) {
      const ctx = canvas.getContext('2d');
      const pal = PAL[theme] || PAL.light;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width * 0.46, canvas.height * 0.58);
      ctx.scale(canvas.width / 160, canvas.height / 88);
      ctx.fillStyle = pal.gold;
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.quadraticCurveTo(-52, -34, -34, 10);
      ctx.quadraticCurveTo(-22, -6, -4, 6);
      ctx.fill();
      ctx.fillStyle = pal.barn;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.quadraticCurveTo(-36, -16, -22, 12);
      ctx.quadraticCurveTo(-12, 2, 0, 8);
      ctx.fill();
      ctx.fillStyle = pal.feather;
      ctx.beginPath();
      ctx.ellipse(8, 2, 26, 16, 0, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.beginPath();
      ctx.ellipse(2, -4, 12, 5, -0.4, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = pal.feather;
      ctx.beginPath();
      ctx.arc(30, -14, 11, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = pal.comb;
      ctx.beginPath();
      ctx.arc(24, -26, 3.6, 0, 6.28);
      ctx.arc(30, -28, 4.2, 0, 6.28);
      ctx.arc(36, -24, 3.2, 0, 6.28);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(34, -6, 3, 5, 0, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = pal.beak;
      ctx.beginPath();
      ctx.moveTo(38, -14);
      ctx.lineTo(50, -10);
      ctx.lineTo(38, -7);
      ctx.fill();
      ctx.fillStyle = pal.ink;
      ctx.fillRect(33, -17, 2.2, 2.2);
      ctx.strokeStyle = pal.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, 16);
      ctx.lineTo(-2, 28);
      ctx.moveTo(14, 16);
      ctx.lineTo(18, 28);
      ctx.stroke();
      ctx.restore();
    },
    renderIcon: function (ctx, size) {
      api.renderTitle(ctx, size, size, 'light', 800);
      ctx.strokeStyle = '#305032';
      ctx.lineWidth = Math.max(8, size * 0.02);
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);
    },
    renderPreview: function (canvas, piece, theme) {
      const ctx = canvas.getContext('2d');
      const pal = PAL[theme] || PAL.light;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = theme === 'dark' ? 'rgba(20,16,12,.55)' : 'rgba(255,250,240,.72)';
      roundRect(ctx, 1, 1, w - 2, h - 2, 8);
      ctx.fill();
      ctx.strokeStyle = pal.gold;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      roundRect(ctx, 2.5, 2.5, w - 5, h - 5, 6);
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (!piece) {
        ctx.strokeStyle = pal.gold;
        ctx.globalAlpha = 0.35;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(w / 2 - 14, h / 2 - 10, 28, 20);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        return;
      }
      const s = 18;
      const rows = piece.shape.length;
      const cols = piece.shape[0].length;
      const ox = Math.floor((w - cols * s) / 2);
      const oy = Math.floor((h - rows * s) / 2);
      const img = sprite(piece.kind, theme);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (!piece.shape[y][x]) continue;
          ctx.drawImage(img, ox + x * s, oy + y * s, s - 1, s - 1);
        }
      }
    },
    renderWell: function (ctx, state) {
      const theme = state.theme === 'dark' ? 'dark' : 'light';
      const pal = PAL[theme];
      if (wellKey !== theme) {
        wellCache = buildWell(theme);
        wellKey = theme;
      }
      const shake = reduced ? 0 : (state.shake || 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, CW, CH);
      ctx.save();
      if (shake) {
        ctx.translate(
          Math.round(Math.sin(state.time * 0.09) * 3.5 * shake),
          Math.round(Math.cos(state.time * 0.13) * 1.4 * shake)
        );
      }
      ctx.drawImage(wellCache, 0, 0);
      const board = state.board;
      const clearing = state.clearing;
      for (let y = 0; y < ROWS; y++) {
        const row = board[y];
        let fade = 1;
        if (clearing && clearing.rows.indexOf(y) !== -1) {
          fade = Math.max(0, 1 - clearing.t / clearing.dur);
        }
        for (let x = 0; x < COLS; x++) {
          const kind = row[x];
          if (!kind) continue;
          ctx.globalAlpha = fade;
          ctx.drawImage(sprite(kind === 'chick' ? 'hay' : kind, theme), FRAME + x * BLOCK, FRAME + y * BLOCK);
          if (kind === 'chick') drawChicken(ctx, FRAME + x * BLOCK, FRAME + y * BLOCK, pal, state.time, 1);
        }
      }
      ctx.globalAlpha = 1;
      if (clearing) {
        const p = Math.min(1, clearing.t / clearing.dur);
        ctx.fillStyle = pal.gold;
        clearing.rows.forEach(function (y) {
          ctx.globalAlpha = 0.35 * (1 - p);
          ctx.fillRect(FRAME, FRAME + y * BLOCK, COLS * BLOCK * p, BLOCK);
        });
        ctx.globalAlpha = 1;
      }
      function drawPiece(piece, px, py, alpha) {
        if (!piece) return;
        ctx.globalAlpha = alpha;
        const img = sprite(piece.kind, theme);
        for (let y = 0; y < piece.shape.length; y++) {
          for (let x = 0; x < piece.shape[y].length; x++) {
            if (!piece.shape[y][x]) continue;
            ctx.drawImage(img, FRAME + (px + x) * BLOCK, FRAME + (py + y) * BLOCK);
          }
        }
        ctx.globalAlpha = 1;
      }
      function drawGhost(piece, px, py) {
        if (!piece) return;
        for (let y = 0; y < piece.shape.length; y++) {
          for (let x = 0; x < piece.shape[y].length; x++) {
            if (!piece.shape[y][x]) continue;
            const gx = FRAME + (px + x) * BLOCK;
            const gy = FRAME + (py + y) * BLOCK;
            ctx.globalAlpha = theme === 'dark' ? 0.8 : 0.9;
            ctx.fillStyle = theme === 'dark' ? 'rgba(243,230,196,.2)' : 'rgba(255,248,220,.5)';
            roundRect(ctx, gx + 3, gy + 3, BLOCK - 6, BLOCK - 6, 6);
            ctx.fill();
            ctx.strokeStyle = pal.gold;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        drawPiece(piece, px, py, 0.36);
      }
      if (state.current && state.showPiece) {
        if (state.ghostY !== state.displayY) drawGhost(state.current, state.pos.x, state.ghostY);
        drawPiece(state.current, state.pos.x, state.displayY, 1);
      }
      for (let i = 0; i < fx.length; i++) {
        const p = fx[i];
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (p.kind === 'spark') drawSpark(ctx, p.x, p.y, p.size * (0.6 + p.life));
        else ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      for (let i = 0; i < hops.length; i++) {
        const hop = hops[i];
        const p = Math.min(1, hop.t / hop.dur);
        const arc = Math.sin(p * Math.PI) * 52;
        ctx.globalAlpha = 1 - p * 0.8;
        drawChicken(ctx, hop.x + p * 22, hop.y - arc - p * 18, pal, state.time, 1);
      }
      ctx.globalAlpha = 1;
      if (floats.length) {
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        for (let i = 0; i < floats.length; i++) {
          const f = floats[i];
          ctx.globalAlpha = Math.max(0, f.life);
          ctx.font = 'bold ' + (f.size || 16) + 'px Georgia, "Iowan Old Style", Palatino, "Palatino Linotype", serif';
          ctx.strokeStyle = theme === 'dark' ? 'rgba(26,26,26,.7)' : 'rgba(255,248,232,.85)';
          ctx.strokeText(f.text, f.x, f.y);
          ctx.fillStyle = theme === 'dark' ? pal.cream : pal.ink;
          ctx.fillText(f.text, f.x, f.y);
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  };

  root.HoedownArt = api;
})(typeof window !== 'undefined' ? window : globalThis);
