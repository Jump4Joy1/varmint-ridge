/* Hoedown Blocks level catalog. 54 campaign wells plus a dated daily well.
   Rows are bottom-up. Characters: . empty, H hay, P pine, F fence, B barn,
   G garden, C creek, R porch, K chicken. */
(function (root) {
  'use strict';

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ymd(d) {
    const z = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }

  function prevYmd(s) {
    const p = s.split('-').map(Number);
    const d = new Date(p[0], p[1] - 1, p[2]);
    d.setDate(d.getDate() - 1);
    return ymd(d);
  }

  function nextStreak(prev, date) {
    if (!prev || !prev.last) return 1;
    if (prev.last === date) return prev.streak || 1;
    if (prev.last === prevYmd(date)) return (prev.streak || 0) + 1;
    return 1;
  }

  const CHAPTERS = [
    { id: 'barnyard', count: 9 },
    { id: 'hayloft', count: 9 },
    { id: 'coop', count: 9 },
    { id: 'fence', count: 9 },
    { id: 'pines', count: 9 },
    { id: 'hoedown', count: 9 }
  ];

  const NAMES = {
    barnyard: [
      ['First Bale', 'La primera paca'],
      ['Second Row', 'La segunda fila'],
      ['Pine Stack', 'Pila de pinos'],
      ['Fence Gap', 'Hueco de la cerca'],
      ['Little Yard', 'El patiecito'],
      ['Square Bales', 'Pacas cuadradas'],
      ['Barn Door', 'Puerta del granero'],
      ['Garden Path', 'Camino del huerto'],
      ['Porch Step', 'Escalón del porche']
    ],
    hayloft: [
      ['Loft Ladder', 'Escalera del pajar'],
      ['Golden Rows', 'Filas doradas'],
      ['Twine Knot', 'Nudo de cuerda'],
      ['High Stack', 'Pila alta'],
      ['Dusty Beam', 'Viga polvorienta'],
      ['Nest in the Hay', 'Nido en el heno'],
      ['Bale Slide', 'Desliz de pacas'],
      ['Loft Window', 'Ventana del pajar'],
      ['Full Loft', 'Pajar lleno']
    ],
    coop: [
      ['First Cluck', 'Primer cloqueo'],
      ['Two Hens', 'Dos gallinas'],
      ['Nest Boxes', 'Cajas nido'],
      ['Roost Row', 'Fila del palo'],
      ['Feather Drift', 'Plumas al aire'],
      ['Coop Door', 'Puerta del gallinero'],
      ['Scratch Yard', 'Patio de escarbar'],
      ['Three Hens', 'Tres gallinas'],
      ['All Tucked In', 'Todas a dormir']
    ],
    fence: [
      ['New Posts', 'Postes nuevos'],
      ['Rail Gap', 'Hueco del riel'],
      ['Corner Brace', 'Refuerzo de esquina'],
      ['Long Run', 'Tramo largo'],
      ['Gate Latch', 'Pestillo'],
      ['Tight Fit', 'Encaje justo'],
      ['Cedar Line', 'Línea de cedro'],
      ['Pasture Edge', 'Borde del pasto'],
      ['Fence Done', 'Cerca lista']
    ],
    pines: [
      ['Morning Wind', 'Viento de mañana'],
      ['Needle Drop', 'Caen las agujas'],
      ['Tall Timber', 'Madera alta'],
      ['Shade Row', 'Fila de sombra'],
      ['Sap on the Rail', 'Savia en el riel'],
      ['Cross Cut', 'Corte cruzado'],
      ['Deep Green', 'Verde hondo'],
      ['Wind in the Crown', 'Viento en la copa'],
      ['Pine Quiet', 'Silencio de pinos']
    ],
    hoedown: [
      ['Lantern Light', 'Luz de farol'],
      ['First Dance', 'Primer baile'],
      ['Fiddle Row', 'Fila del violín'],
      ['Night Row', 'Fila de noche'],
      ['Starry Yard', 'Patio estrellado'],
      ['Last Puzzle', 'Último rompecabezas'],
      ['Firefly Rows', 'Filas de luciérnagas'],
      ['Warm Barn', 'Granero cálido'],
      ['Last Dance', 'Último baile']
    ]
  };

  const FILL = ['H', 'P', 'F', 'B', 'G', 'C', 'R'];

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function makeRows(rng, nRows, chicks) {
    const rows = [];
    for (let i = 0; i < nRows; i++) {
      const cells = ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'];
      const order = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
      const fill = 4 + Math.floor(rng() * 4);
      for (let k = 0; k < fill; k++) cells[order[k]] = FILL[Math.floor(rng() * FILL.length)];
      rows.push(cells);
    }
    const spots = [];
    rows.forEach(function (cells, ri) {
      cells.forEach(function (c, x) { if (c !== '.') spots.push([ri, x]); });
    });
    shuffle(spots, rng);
    let placed = 0;
    for (let i = 0; i < chicks && i < spots.length; i++) {
      rows[spots[i][0]][spots[i][1]] = 'K';
      placed++;
    }
    return { rows: rows.map(function (c) { return c.join(''); }), chicks: placed };
  }

  const SPECIAL = {
    1: { rows: ['HHH....HHH'], queue: ['I'], goal: { type: 'lines', n: 1 }, limit: null, dropMs: 1200, par: 1, par3: 1, seed: 1 },
    6: { rows: ['HHHH..HHHH', 'HHHH..HHHH'], queue: ['O'], goal: { type: 'lines', n: 2 }, limit: 1, dropMs: 1200, par: 1, par3: 1, seed: 6 },
    15: { rows: ['KHH....HHH'], queue: ['I'], goal: { type: 'chickens', n: 1 }, limit: 1, dropMs: 1000, par: 1, par3: 1, seed: 15 },
    24: { rows: ['HHHH..HHHH', 'HHHH..HHHH', 'HHHH..HHHH', 'HHHH..HHHH'], queue: ['O', 'O'], goal: { type: 'lines', n: 4 }, limit: 2, dropMs: 1000, par: 2, par3: 2, seed: 24 },
    33: { rows: ['HHH....HHH', 'HHH....HHH'], queue: ['I', 'I'], goal: { type: 'lines', n: 2 }, limit: 2, dropMs: 900, par: 2, par3: 2, seed: 33 },
    42: { rows: ['HHHH..HHHH', 'KHH....HHH'], queue: ['I', 'O'], goal: { type: 'lines', n: 2 }, limit: 2, dropMs: 800, par: 2, par3: 2, seed: 42 },
    51: { rows: ['KHH....HHH', 'HHH....HHK', 'HHH....HHH'], queue: ['I', 'I', 'I'], goal: { type: 'chickens', n: 2 }, limit: 3, dropMs: 800, par: 2, par3: 2, seed: 51 }
  };

  function generated(id) {
    const ch = Math.floor((id - 1) / 9);
    const idx = (id - 1) % 9;
    const chapter = CHAPTERS[ch].id;
    const pair = NAMES[chapter][idx];
    const rng = mulberry32(10007 + id * 97);
    const coop = ch === 2;
    const chicks = coop ? 1 + Math.floor(idx / 3) : (ch === 5 ? 1 : 0);
    const nRows = Math.min(8, Math.max(chicks + 1, 1 + ch + Math.floor(idx / 2)));
    const built = makeRows(rng, nRows, chicks);
    const goal = coop
      ? { type: 'chickens', n: built.chicks }
      : { type: 'lines', n: 2 + ch + Math.floor(idx / 3) };
    const par = goal.type === 'chickens' ? goal.n * 8 : goal.n * 5;
    const par3 = goal.type === 'chickens' ? goal.n * 5 : goal.n * 3;
    return {
      id: id,
      chapter: chapter,
      name: { en: pair[0], es: pair[1] },
      goal: goal,
      rows: built.rows,
      queue: null,
      seed: 10007 + id * 97,
      dropMs: Math.max(320, 1080 - ch * 90 - (id % 3) * 30),
      limit: null,
      par: par,
      par3: par3
    };
  }

  const LEVELS = [];
  for (let id = 1; id <= 54; id++) {
    const base = generated(id);
    const over = SPECIAL[id];
    LEVELS.push(over ? Object.assign({}, base, over, { id: id, chapter: base.chapter, name: base.name }) : base);
  }

  LEVELS.forEach(function (L) {
    if (L.rows.length < 1) throw new Error('Hoedown level ' + L.id + ' has no rows');
    L.rows.forEach(function (r) {
      if (r.length !== 10) throw new Error('Hoedown level ' + L.id + ' row width');
      if (r.indexOf('.') === -1) throw new Error('Hoedown level ' + L.id + ' row is already full');
    });
    if (L.goal.type === 'chickens') {
      const n = (L.rows.join('').match(/K/g) || []).length;
      if (n < L.goal.n) throw new Error('Hoedown level ' + L.id + ' is short on chickens');
    }
  });
  if (LEVELS.length !== 54) throw new Error('expected 54 levels');

  function hashDate(dateStr) {
    let h = 2166136261;
    for (let i = 0; i < dateStr.length; i++) {
      h ^= dateStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeDaily(dateStr) {
    const seed = hashDate(dateStr);
    const rng = mulberry32(seed);
    const built = makeRows(rng, 4 + Math.floor(rng() * 2), 2);
    return {
      id: 'daily',
      date: dateStr,
      name: { en: 'Daily Well', es: 'Pozo del día' },
      chapter: 'daily',
      goal: { type: 'lines', n: 4 },
      rows: built.rows,
      queue: null,
      seed: seed,
      dropMs: 900,
      limit: null,
      par: 16,
      par3: 10,
      chicks: built.chicks
    };
  }

  const api = {
    CHAPTERS: CHAPTERS,
    LEVELS: LEVELS,
    makeDaily: makeDaily,
    mulberry32: mulberry32,
    ymd: ymd,
    prevYmd: prevYmd,
    nextStreak: nextStreak
  };
  root.HoedownLevels = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
