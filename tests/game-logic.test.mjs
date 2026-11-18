import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  TOWERS,
  FOES,
  WAVES,
  UPS,
  CARE,
  applyDamage,
  makeFoe,
  towerDamage,
  towerRange,
  sellRefund,
  startCoins,
  hpMultiplier,
  buildQueue,
  waveClearReward,
  winBonus,
  starRating,
  createMatch,
  placeTower,
  upgradeTower,
  sellTower,
  buyUpgrade,
  serializeSave,
  applySave,
  canPlace,
  ridgeToday,
  ridgeFnv,
  mockGrant,
  spendGems,
  CACHE_NAME,
  CONTACT_EMAIL,
  SUPPORT_URL,
  PRIVACY_URL,
} from '../src/game/logic.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'www/sw.js'), 'utf8');
const privacy = fs.readFileSync(path.join(root, 'www/privacy.html'), 'utf8');
const terms = fs.readFileSync(path.join(root, 'www/terms.html'), 'utf8');
const support = fs.readFileSync(path.join(root, 'www/support.html'), 'utf8');

test('lockstep: tower costs and foe stats match the live page', () => {
  assert.match(html, /scarecrow:\{name:'Scarecrow',cost:25,range:78,cd:1\.5,dmg:7,ups:\[35,55\]\}/);
  assert.match(html, /lantern:\{name:'Lantern',cost:40,range:112,cd:\.55,dmg:10,ups:\[45,70\]\}/);
  assert.match(html, /trap:\{name:'Snap Trap',cost:50,range:44,cd:1\.6,dmg:55,ups:\[50,75\]\}/);
  assert.match(html, /raccoon:\{hp:40,spd:44,gold:6,pts:15,r:13\}/);
  assert.match(html, /boss:\{hp:1100,spd:17,gold:150,pts:500,r:28\}/);
  assert.match(html, /fox:\{hp:32,spd:76,gold:8,pts:20,r:12\}/);
  assert.equal(WAVES.length, 12);
  assert.match(html, /name:'Bandit King'/);
  assert.match(html, /UPS=\{fence:\[40,65,95\],zeus:\[60,90,130\]\},CARE=35/);
  assert.equal(TOWERS.scarecrow.cost, 25);
  assert.equal(FOES.raccoon.hp, 40);
  assert.deepEqual(UPS.fence, [40, 65, 95]);
  assert.equal(CARE, 35);
});

test('damage: lantern extra vs fliers, trap extra vs armadillo, scarecrow base', () => {
  assert.equal(towerDamage('scarecrow', 1, 'raccoon'), 7);
  assert.equal(towerDamage('scarecrow', 2, 'raccoon'), 7 * 1.6);
  assert.equal(towerDamage('lantern', 1, 'raccoon'), 10);
  assert.equal(towerDamage('lantern', 1, 'crow'), 17);
  assert.equal(towerDamage('trap', 1, 'raccoon'), 55);
  assert.equal(towerDamage('trap', 1, 'armadillo'), 82.5);
  const raccoon = makeFoe('raccoon', 1, { hpm: 1 });
  const r = applyDamage(raccoon, 7);
  assert.equal(r.killed, false);
  assert.equal(raccoon.hp, 33);
  applyDamage(raccoon, 33);
  assert.equal(raccoon.gone, 1);
});

test('damage: possum plays dead once, then can be finished', () => {
  const p = makeFoe('possum', 1, { hpm: 1 });
  const first = applyDamage(p, 48);
  assert.equal(first.possum, true);
  assert.equal(first.killed, false);
  assert.equal(p.played, true);
  assert.ok(p.hp > 0);
  p.dead = 0;
  const second = applyDamage(p, p.hp);
  assert.equal(second.killed, true);
  assert.equal(p.gone, 1);
});

test('damage: Bandit King summons at 66% and 33%', () => {
  const boss = makeFoe('boss', 12, { hpm: 1 });
  assert.equal(boss.summon, 2);
  const a = applyDamage(boss, 1100 * 0.35);
  assert.equal(a.summon, true);
  assert.equal(boss.summon, 1);
  const b = applyDamage(boss, 1100 * 0.35);
  assert.equal(b.summon, true);
  assert.equal(boss.summon, 0);
  const c = applyDamage(boss, 5000);
  assert.equal(c.killed, true);
  assert.equal(c.gold, 150);
});

test('economy: start coins, place, upgrade, sell, homestead', () => {
  assert.equal(startCoins(1, 0), 120);
  assert.equal(startCoins(2, 500), 120 + 70 + 500);
  const s = createMatch(1);
  assert.equal(placeTower(s, 'scarecrow', 200, 360), true);
  assert.equal(s.coins, 95);
  assert.equal(placeTower(s, 'scarecrow', 200, 360), false);
  assert.equal(canPlace(s, 200, 200), 'Build in the yard');
  const tw = s.towers[0];
  assert.equal(upgradeTower(s, tw), true);
  assert.equal(tw.lv, 2);
  assert.equal(s.coins, 60);
  sellTower(s, tw);
  assert.equal(s.towers.length, 0);
  assert.equal(s.coins, 60 + sellRefund(25 + 35));
  const h = createMatch(1);
  assert.equal(buyUpgrade(h, 'fence'), true);
  assert.equal(h.fence, 1);
  assert.equal(h.coins, 80);
});

test('waves: twelve named waves, hp scale, clear reward', () => {
  assert.equal(WAVES.length, 12);
  const q1 = buildQueue(0);
  assert.equal(q1.length, 7);
  assert.equal(q1[0].type, 'raccoon');
  assert.equal(q1[6].t, 6 * 1.4);
  assert.equal(hpMultiplier(1), 1);
  assert.equal(hpMultiplier(10), 1 + 9 * 0.13);
  assert.equal(hpMultiplier(12), 1 + 9 * 0.13);
  const q12 = buildQueue(11);
  assert.ok(q12.some((x) => x.type === 'boss'));
  const reward = waveClearReward(1, 5);
  assert.equal(reward.coins, 20 + 5 + 15);
  assert.equal(reward.score, 50 + 100);
  assert.equal(winBonus(500), 2000);
  assert.equal(starRating(true, 500, 0), 3);
  assert.equal(starRating(true, 250, 1), 2);
  assert.equal(starRating(false, 0, 3), 0);
  assert.ok(towerRange('lantern', 2) > towerRange('lantern', 1));
});

test('save/load: towers, crops, bank, armed speed-up', () => {
  const s = createMatch(3);
  placeTower(s, 'lantern', 180, 360);
  s.crops[0].hp = 40;
  s.fence = 2;
  s.armedSpeed = true;
  const blob = serializeSave(s);
  const loaded = applySave(blob, { bank: 500, zeusBonus: 1 });
  assert.equal(loaded.wave, 3);
  assert.equal(loaded.towers[0].type, 'lantern');
  assert.equal(loaded.crops[0].hp, 40);
  assert.equal(loaded.coins, blob.coins + 500);
  assert.equal(loaded.zeus, 1);
  assert.equal(loaded.armedSpeed, true);
  assert.equal(loaded.fence, 2);
});

test('ridge seed fixture 2026-10-30 and mock shop grants', () => {
  assert.equal(ridgeFnv('jwmanor-vr-2026-10-30'), 3339250613);
  const pack = ridgeToday('2026-10-30');
  assert.equal(pack.critter, 'Possum');
  assert.equal(pack.challenge, 'Lantern Watch');
  assert.equal(pack.wave, 1);
  const gems = mockGrant('gems80', { gems: 0 });
  assert.equal(gems.gems, 80);
  const starter = mockGrant('starter', {});
  assert.equal(starter.bank, 300);
  assert.equal(starter.zeusBonus, 1);
  assert.equal(mockGrant('starter', starter), null);
  const spent = spendGems({ gems: 40 }, 40);
  assert.equal(spent.gems, 0);
  assert.equal(spendGems({ gems: 39 }, 40), null);
});

test('family policy: contact, cache name, no ads, mock billing flags', () => {
  assert.equal(CONTACT_EMAIL, 'support@backfortyapps.com');
  assert.equal(SUPPORT_URL, 'https://backfortyapps.com/varmint-ridge/support/');
  assert.equal(PRIVACY_URL, 'https://backfortyapps.com/varmint-ridge/privacy/');
  assert.match(sw, new RegExp(`const CACHE = "${CACHE_NAME}"`));
  assert.match(html, /const IAP_ENABLED = false;/);
  assert.match(html, /const IAP_TEST = true;/);
  assert.doesNotMatch(html, /admob|adsense|doubleclick|fundingchoices|gtag\(|analytics\.js/i);
  for (const page of [privacy, terms, support, html]) {
    assert.match(page, /support@backfortyapps\.com/);
    assert.doesNotMatch(page, /lorem ipsum|TODO|coming soon|placeholder text/i);
  }
  assert.match(privacy, /https:\/\/backfortyapps\.com\/varmint-ridge\/privacy\//);
  assert.match(support, /https:\/\/backfortyapps\.com\/varmint-ridge\/support\//);
});
