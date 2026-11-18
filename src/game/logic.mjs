/**
 * Pure Varmint Ridge rules used by unit tests.
 * Numbers must stay in lockstep with www/index.html (see tests/game-logic.test.mjs).
 * No ads. No real billing. All ages.
 */

export const TOWERS = {
  scarecrow: { name: 'Scarecrow', cost: 25, range: 78, cd: 1.5, dmg: 7, ups: [35, 55] },
  lantern: { name: 'Lantern', cost: 40, range: 112, cd: 0.55, dmg: 10, ups: [45, 70] },
  trap: { name: 'Snap Trap', cost: 50, range: 44, cd: 1.6, dmg: 55, ups: [50, 75] },
};

export const FOES = {
  raccoon: { hp: 40, spd: 44, gold: 6, pts: 15, r: 13 },
  crow: { hp: 24, spd: 60, gold: 5, pts: 12, r: 11, fly: 1 },
  armadillo: { hp: 95, spd: 27, gold: 9, pts: 25, r: 14 },
  possum: { hp: 48, spd: 34, gold: 7, pts: 18, r: 12 },
  fox: { hp: 32, spd: 76, gold: 8, pts: 20, r: 12 },
  boss: { hp: 1100, spd: 17, gold: 150, pts: 500, r: 28 },
};

export const WAVES = [
  { name: 'Dusk Raiders', g: [['raccoon', 7, 1.4]] },
  { name: 'Black Wings', g: [['raccoon', 6, 1.5], ['crow', 5, 1.3, 3]] },
  { name: 'Shell Game', g: [['armadillo', 4, 2.4], ['raccoon', 7, 1.1, 2]] },
  { name: 'Play Possum', g: [['possum', 6, 1.3], ['crow', 7, 1, 4]] },
  { name: 'Murder Line', g: [['crow', 12, 0.7], ['raccoon', 8, 1, 3]] },
  { name: 'Dig Line', g: [['armadillo', 8, 1.5], ['possum', 6, 1.4, 4]] },
  { name: 'Black Flock', g: [['crow', 18, 0.55], ['raccoon', 10, 0.9, 2]] },
  { name: 'Full Moon', g: [['armadillo', 8, 1.3], ['possum', 8, 1.1, 2], ['crow', 10, 0.8, 5]] },
  { name: 'All Three', g: [['raccoon', 14, 0.6], ['crow', 14, 0.6, 3], ['armadillo', 8, 1.2, 6], ['possum', 6, 1, 8]] },
  { name: 'Fox Trot', g: [['fox', 8, 0.7], ['raccoon', 6, 1.1, 2]] },
  { name: 'Moonlit Run', g: [['fox', 8, 0.55], ['crow', 8, 0.7, 2], ['armadillo', 5, 1.4, 4]] },
  { name: 'Bandit King', g: [['raccoon', 10, 0.8], ['crow', 10, 0.8, 4], ['boss', 1, 1, 6], ['armadillo', 6, 1.5, 10]] },
];

export const UPS = { fence: [40, 65, 95], zeus: [60, 90, 130] };
export const CARE = 35;
export const SELL_RATE = 0.6;
export const START_COINS = 120;
export const WAVE_COIN_STEP = 70;
export const WAVE_COUNT = WAVES.length;

export const GEM_PACKS = { gems80: 80, gems500: 500, gems1200: 1200 };
export const GEM_SPEED = 40;
export const SEASON_PASS_GEMS = 400;

export function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

export function hpMultiplier(wave) {
  return 1 + Math.min(wave - 1, 9) * 0.13;
}

export function startCoins(wave, bank = 0) {
  return START_COINS + (wave > 1 ? (wave - 1) * WAVE_COIN_STEP : 0) + (bank | 0);
}

export function towerRange(type, lv) {
  return TOWERS[type].range * (1 + 0.14 * (lv - 1));
}

export function towerDamage(type, lv, foeType) {
  const T = TOWERS[type];
  let dmg = T.dmg * Math.pow(1.6, lv - 1);
  if (type === 'lantern' && FOES[foeType]?.fly) dmg *= 1.7;
  if (type === 'trap' && foeType === 'armadillo') dmg *= 1.5;
  return dmg;
}

export function sellRefund(spent) {
  return Math.floor(spent * SELL_RATE);
}

export function makeFoe(type, wave = 1, extras = {}) {
  const F = FOES[type];
  const hpm = extras.hpm != null ? extras.hpm : hpMultiplier(wave);
  return {
    type,
    hp: F.hp * hpm,
    max: F.hp * hpm,
    fly: !!F.fly,
    dead: 0,
    played: false,
    gone: 0,
    summon: type === 'boss' ? 2 : 0,
    hitT: 0,
    ...extras,
  };
}

export function applyDamage(f, dmg) {
  if (f.dead || f.hp <= 0) return { killed: false, possum: false, summon: false };
  f.hp -= dmg;
  f.hitT = 0.08;
  if (f.hp <= 0) {
    if (f.type === 'possum' && !f.played) {
      f.played = true;
      f.dead = 1.8;
      f.hp = f.max * 0.4;
      return { killed: false, possum: true, summon: false };
    }
    f.gone = 1;
    return { killed: true, possum: false, summon: false, gold: FOES[f.type].gold, pts: FOES[f.type].pts };
  }
  if (f.type === 'boss' && f.summon > 0 && f.hp < f.max * (f.summon === 2 ? 0.66 : 0.33)) {
    f.summon -= 1;
    return { killed: false, possum: false, summon: true };
  }
  return { killed: false, possum: false, summon: false };
}

export function buildQueue(waveIndex) {
  const w = WAVES[waveIndex];
  const hpm = hpMultiplier(waveIndex + 1);
  const queue = [];
  w.g.forEach(([type, n, gap, delay]) => {
    for (let i = 0; i < n; i++) queue.push({ t: (delay || 0) + i * gap, type, hpm });
  });
  queue.sort((a, b) => a.t - b.t);
  return queue;
}

export function waveClearReward(wave, bedsAlive) {
  const bonus = 20 + wave * 5;
  return {
    coins: bonus + bedsAlive * 3,
    score: 50 * wave + bedsAlive * 20,
  };
}

export function winBonus(cropHpTotal, cropMaxTotal = 500) {
  const pct = cropHpTotal / cropMaxTotal;
  return 1000 + Math.round(pct * 1000);
}

export function starRating(won, cropHpTotal, lost, cropMaxTotal = 500) {
  if (!won) return 0;
  const pct = cropHpTotal / cropMaxTotal;
  if (pct > 0.7 && lost === 0) return 3;
  if (pct > 0.4) return 2;
  return 1;
}

export function createMatch(wave = 1, opts = {}) {
  const bank = opts.bank | 0;
  const zb = opts.zeusBonus | 0;
  return {
    wave,
    phase: 'build',
    coins: startCoins(wave, bank),
    score: 0,
    crops: [0, 1, 2, 3, 4].map(() => ({ hp: 100, max: 100 })),
    towers: [],
    foes: [],
    queue: [],
    fence: 0,
    zeus: zb ? 1 : 0,
    kills: 0,
    lost: 0,
    only: '',
    dailyStop: false,
    armedSpeed: false,
  };
}

export function canPlace(state, x, y) {
  if (y < 285 || y > 486) return 'Build in the yard';
  if (y > 420 - 28 && y < 420 + 22) return 'Not on the fence';
  if (state.towers.some((t) => Math.hypot(t.x - x, t.y - y) < 30)) return 'Too close';
  return null;
}

export function placeTower(state, type, x, y, lessons = {}) {
  const T = TOWERS[type];
  if (!T) return false;
  if (state.only && type !== state.only) return false;
  if (canPlace(state, x, y) || state.coins < T.cost) return false;
  const lv = lessons[type] ? 2 : 1;
  state.coins -= T.cost;
  state.towers.push({ type, x, y, lv, spent: T.cost });
  return true;
}

export function upgradeTower(state, tower) {
  if (tower.lv >= 3) return false;
  const cost = TOWERS[tower.type].ups[tower.lv - 1];
  if (state.coins < cost) return false;
  state.coins -= cost;
  tower.spent += cost;
  tower.lv += 1;
  return true;
}

export function sellTower(state, tower) {
  state.coins += sellRefund(tower.spent);
  state.towers = state.towers.filter((t) => t !== tower);
  return true;
}

export function buyUpgrade(state, key) {
  const lv = state[key];
  if (lv >= 3 || state.coins < UPS[key][lv]) return false;
  state.coins -= UPS[key][lv];
  state[key] += 1;
  return true;
}

export function serializeSave(state) {
  return {
    wave: state.wave,
    coins: state.coins,
    score: state.score,
    fence: state.fence,
    zeus: state.zeus,
    kills: state.kills,
    lost: state.lost,
    crops: state.crops.map((c) => c.hp),
    towers: state.towers.map((t) => ({ type: t.type, x: t.x, y: t.y, lv: t.lv, spent: t.spent })),
    only: state.only || '',
    dailyRule: state.dailyRule || '',
    dailyStop: !!state.dailyStop,
    dailyTitle: state.dailyTitle || '',
    armed: !!state.armedSpeed,
  };
}

export function applySave(data, extras = {}) {
  const state = createMatch(data.wave || 1, extras);
  state.coins = (data.coins | 0) + (extras.bank | 0);
  state.score = data.score | 0;
  state.fence = data.fence | 0;
  state.zeus = Math.max(data.zeus | 0, extras.zeusBonus ? 1 : 0);
  state.kills = data.kills || 0;
  state.lost = data.lost || 0;
  (data.crops || []).forEach((h, i) => {
    if (state.crops[i]) state.crops[i].hp = h;
  });
  state.towers = (data.towers || []).map((t) => ({ ...t }));
  state.only = data.only || '';
  state.dailyRule = data.dailyRule || '';
  state.dailyStop = !!data.dailyStop;
  state.dailyTitle = data.dailyTitle || '';
  state.armedSpeed = !!data.armed;
  return state;
}

export function ridgeFnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const RIDGE_CRITTERS = ['Raccoon', 'Crow', 'Armadillo', 'Possum', 'Bandit King'];
export const RIDGE_DAILIES = ['Straw Only', 'Lantern Watch', 'Snap Line', 'Lean Purse', 'Zeus on Duty', 'Clean Beds'];

export function ridgeToday(dayKey) {
  const h = ridgeFnv('jwmanor-vr-' + dayKey);
  const varmint = h % 5;
  const daily = (h >>> 8) % 6;
  const wave = 1 + ((h >>> 16) % 6);
  return {
    key: dayKey,
    h,
    varmint,
    daily,
    wave,
    critter: RIDGE_CRITTERS[varmint],
    challenge: RIDGE_DAILIES[daily],
    waveName: WAVES[wave - 1].name,
  };
}

export function mockGrant(key, store) {
  const s = { gems: 0, bank: 0, seasonPass: false, pass: false, starterOwned: false, zeusBonus: 0, ...store };
  if (key === 'gems80') s.gems += 80;
  else if (key === 'gems500') s.gems += 500;
  else if (key === 'gems1200') s.gems += 1200;
  else if (key === 'season1') {
    if (s.seasonPass) return null;
    s.seasonPass = true;
  } else if (key === 'coins') s.bank += 500;
  else if (key === 'pass') {
    if (s.pass) return null;
    s.pass = true;
  } else if (key === 'starter') {
    if (s.starterOwned) return null;
    s.starterOwned = true;
    s.bank += 300;
    s.zeusBonus = 1;
  } else return null;
  return s;
}

export function spendGems(store, cost) {
  if ((store.gems | 0) < cost) return null;
  return { ...store, gems: (store.gems | 0) - cost };
}

export const CONTACT_EMAIL = 'support@backfortyapps.com';
export const SUPPORT_URL = 'https://backfortyapps.com/varmint-ridge/support/';
export const PRIVACY_URL = 'https://backfortyapps.com/varmint-ridge/privacy/';
export const CACHE_NAME = 'varmint-ridge-iphone-10';
