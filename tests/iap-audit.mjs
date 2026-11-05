// Repeatable audit for the test-mode shop. No ads, no real charges.
// Requires Playwright on NODE_PATH. Serves ../www itself. No build step.
//   node tests/iap-audit.mjs
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) {
  console.error('Playwright is not installed. Put the playwright package on NODE_PATH and run: node tests/iap-audit.mjs');
  process.exit(1);
}
const { chromium, devices } = pw;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const repo = path.resolve(root, '..');
const fails = [];
function need(name, ok, extra) {
  const line = (ok ? 'PASS ' : 'FAIL ') + name + (extra === undefined ? '' : ' ' + JSON.stringify(extra));
  console.log(line);
  if (!ok) fails.push(name);
}

function serve(dir) {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      let p = decodeURIComponent(u.pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.normalize(path.join(dir, p));
      if (!file.startsWith(dir)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); res.end('missing'); return; }
        const ext = path.extname(file);
        const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
        res.end(buf);
      });
    });
    s.listen(0, '127.0.0.1', () => resolve(s));
  });
}

const server = await serve(root);
const origin = 'http://127.0.0.1:' + server.address().port;
console.log('serving', origin, 'root www/');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ua = devices['iPhone SE'].userAgent;
const errors = [];
function watch(page) {
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
}
async function open(extra) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: ua, ...extra });
  const page = await ctx.newPage();
  watch(page);
  return { ctx, page };
}
async function boot(page, clock) {
  if (clock) await page.clock.install();
  await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.VR);
}
async function answerGate(page, wrongFirst) {
  await page.waitForFunction(() => document.getElementById('sGate').classList.contains('show'));
  let wrong = null;
  if (wrongFirst) {
    await page.evaluate(() => { document.getElementById('gateA').value = '1'; document.getElementById('gateGo').click(); });
    wrong = await page.evaluate(() => ({ msg: document.getElementById('gateMsg').textContent, on: document.getElementById('sGate').classList.contains('show'), store: document.getElementById('sStore').classList.contains('show') }));
  }
  await page.evaluate(() => {
    const m = document.getElementById('gateQ').textContent.match(/(\d+)\s*×\s*(\d+)/);
    document.getElementById('gateA').value = String(Number(m[1]) * Number(m[2]));
    document.getElementById('gateGo').click();
  });
  await page.waitForFunction(() => document.getElementById('sStore').classList.contains('show'));
  return wrong;
}
async function confirm(page, yes) {
  await page.waitForFunction(() => document.getElementById('testBuy').style.display !== 'none');
  await page.evaluate((yes) => document.getElementById(yes ? 'testBuyOk' : 'testBuyNo').click(), yes);
  await page.waitForTimeout(40);
}

const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
const widgets = fs.readFileSync(path.join(repo, 'ios-app/targets/widget/RidgeWidgets.swift'), 'utf8');
need('source-flags', html.includes('const IAP_ENABLED = false') && html.includes('const IAP_TEST = true') && !/admob|adsense|doubleclick|fundingchoices/i.test(html));
need('cache-name', /const CACHE = "varmint-ridge-iphone-8"/.test(sw));
need('manifest-relative', manifest.start_url === './index.html' && manifest.scope === './');
need('widget-copy', widgets.includes('of 12'));

const a = await open();
await boot(a.page);
const seed = await a.page.evaluate(() => {
  const p = VR.ridgeToday(new Date(2026, 9, 30));
  VR.begin(1);
  const t1 = VR.teachStep();
  const placed = VR.place('scarecrow', 200, 360);
  const t2 = VR.teachStep();
  VR.startWave();
  const t3 = VR.teachStep();
  VR.S.queue = []; VR.S.foes = []; VR.step(0.05);
  return { h: p.h, name: p.critter.name, daily: p.challenge.title, wave: p.wave, waves: VR.WAVES.length, t1, placed, t2, t3, tAfter: VR.teachStep(), next: VR.S.wave };
});
console.log('seed', JSON.stringify(seed));
need('daily-seed', seed.h === 3339250613 && seed.name === 'Possum' && seed.daily === 'Lantern Watch' && seed.wave === 1 && seed.waves === 12);
need('tutorial', seed.t1 === 1 && seed.placed && seed.t2 === 2 && seed.t3 === 3 && seed.tAfter === 0 && seed.next === 2);
const daily = await a.page.evaluate(() => {
  localStorage.setItem('vr_seasonDone', JSON.stringify([]));
  VR.begin(1); VR.S.queue = []; VR.S.foes = []; VR.S.phase = 'wave'; VR.step(0.05);
  const camp = JSON.parse(localStorage.getItem('vr_seasonDone'));
  VR.beginDaily(); VR.S.queue = []; VR.S.foes = []; VR.S.phase = 'wave'; VR.step(0.05);
  return { camp, after: JSON.parse(localStorage.getItem('vr_seasonDone')), stop: VR.S.dailyStop };
});
need('daily-not-counted', daily.camp.length === 1 && daily.after.length === 1 && daily.stop === true);
await a.page.evaluate(() => { document.getElementById('bSet').click(); document.getElementById('bCB').click(); });
const cb1 = await a.page.evaluate(() => document.getElementById('bCB').textContent);
await a.page.reload({ waitUntil: 'domcontentloaded' });
await a.page.waitForFunction(() => window.VR);
const cb2 = await a.page.evaluate(() => { document.getElementById('bSet').click(); return document.getElementById('bCB').textContent; });
need('colorblind-persists', cb1 === 'On' && cb2 === 'On');
await a.ctx.close();

const mot = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, userAgent: ua, reducedMotion: 'reduce' });
const mp = await mot.newPage();
watch(mp);
await boot(mp);
const shake = await mp.evaluate(() => { VR.begin(4); VR.S.shake = 12; VR.step(0.016); return VR.S.shake; });
need('reduced-motion', shake === 0);
await mot.close();

const pers = await open();
await boot(pers.page);
await pers.page.evaluate(() => localStorage.clear());
await pers.page.reload({ waitUntil: 'domcontentloaded' });
await pers.page.waitForFunction(() => window.VR);
const placedLantern = await pers.page.evaluate(() => {
  VR.begin(2);
  const placed = VR.place('lantern', 200, 360);
  VR.S.coins = 50;
  localStorage.setItem('vr_speedLeft', '1');
  document.getElementById('useSpeed').disabled = false;
  document.getElementById('useSpeed').click();
  return placed;
});
await pers.page.keyboard.press('p');
await pers.page.evaluate(() => document.getElementById('bQuit').click());
const save = await pers.page.evaluate(() => JSON.parse(localStorage.getItem('vr_save')));
await pers.page.evaluate(() => {
  localStorage.setItem('vr_bank', '500');
  localStorage.setItem('vr_zeusBonus', '1');
  localStorage.setItem('vr_gems', '17');
  localStorage.setItem('vr_lessons', JSON.stringify({ lantern: true }));
  localStorage.setItem('vr_yard', JSON.stringify('harvest'));
  localStorage.setItem('vr_seasonDone', '"not-a-list"');
});
await pers.page.reload({ waitUntil: 'domcontentloaded' });
await pers.page.waitForFunction(() => window.VR);
const cont = await pers.page.evaluate(() => {
  document.getElementById('bCont').click();
  return {
    coins: VR.S.coins, zeus: VR.S.zeus, wave: VR.S.wave,
    tower: VR.S.towers[0] && VR.S.towers[0].type,
    armed: !!VR.S.armedSpeed, gems: VR.gems,
    yard: JSON.parse(localStorage.getItem('vr_yard')),
    bank: localStorage.getItem('vr_bank'),
  };
});
console.log('continue', JSON.stringify({ saveArmed: save && save.armed, cont }));
need('continue-bank', cont.coins === 550 && cont.zeus >= 1 && cont.bank === '0' && placedLantern === true);
need('continue-run', cont.wave === 2 && cont.tower === 'lantern' && cont.armed === true && save.armed === true);
need('continue-meta', cont.gems === 17 && cont.yard === 'harvest');
const afterStart = await pers.page.evaluate(() => {
  VR.startWave();
  const started = { left: VR.speedLeft, label: document.getElementById('goTxt').textContent, phase: VR.S.phase };
  VR.S.queue = []; VR.S.foes = []; VR.step(0.05);
  return { started, season: JSON.parse(localStorage.getItem('vr_seasonDone')) };
});
need('armed-consumed-once', afterStart.started.left === 0 && afterStart.started.label === 'Speed x2');
need('corrupt-season', Array.isArray(afterStart.season) && afterStart.season.indexOf(2) >= 0);
await pers.ctx.close();

const shop = await open();
await shop.page.clock.install();
await boot(shop.page);
await shop.page.evaluate(() => localStorage.clear());
await shop.page.evaluate(() => {
  localStorage.setItem('vr_spend', '"nope"');
  localStorage.setItem('vr_seasonClaims', '"nope"');
  localStorage.setItem('vr_skins', '"nope"');
  localStorage.setItem('vr_lessons', '"nope"');
  localStorage.setItem('vr_testOwned', '"nope"');
  document.getElementById('bSet').click();
});
const spendOk = await shop.page.evaluate(() => {
  const t = document.getElementById('spendSum').innerText;
  return t.indexOf('No purchases yet.') >= 0 && t.indexOf('not charged') >= 0;
});
need('corrupt-records', spendOk);
await shop.page.evaluate(() => document.getElementById('bStore').click());
const wrong = await answerGate(shop.page, true);
need('gate-wrong', wrong.msg === 'Not quite. Ask a grown-up for help.' && wrong.on === true && wrong.store === false);
await shop.page.evaluate(() => localStorage.setItem('vr_gems', '80'));
await shop.page.evaluate(() => document.getElementById('bStore').click());
const dbl = await shop.page.evaluate(() => {
  const b = document.querySelector('[data-gem="speed"]');
  b.click(); b.click();
  return document.getElementById('testBuy').style.display;
});
await confirm(shop.page, true);
const afterDbl = await shop.page.evaluate(() => ({ gems: VR.gems, left: VR.speedLeft, logs: JSON.parse(localStorage.getItem('vr_spend') || '[]').filter((r) => r.name === 'Speed-up').length }));
console.log('double-speed', JSON.stringify({ sheet: dbl, afterDbl }));
need('no-double-speed', dbl !== 'none' && afterDbl.gems === 40 && afterDbl.left === 1 && afterDbl.logs === 1);
const short = await shop.page.evaluate(() => {
  localStorage.setItem('vr_gems', '39');
  document.querySelector('[data-gem="speed"]').click();
  return { gems: VR.gems, note: document.getElementById('storeNote').innerText, sheet: document.getElementById('testBuy').style.display };
});
need('insufficient', short.gems === 39 && short.note.indexOf('40 gems') >= 0 && short.note.indexOf('39') >= 0 && short.sheet === 'none');
await shop.page.evaluate(() => { localStorage.setItem('vr_gems', '40'); document.getElementById('bStore').click(); });
await shop.page.evaluate(() => document.querySelector('[data-gem="speed"]').click());
await confirm(shop.page, false);
const cancelled = await shop.page.evaluate(() => ({ gems: VR.gems, left: VR.speedLeft, sheet: document.getElementById('testBuy').style.display }));
need('cancel-gems', cancelled.gems === 40 && cancelled.left === 1 && cancelled.sheet === 'none');
await shop.page.evaluate(() => document.querySelector('[data-gem="speed"]').click());
await confirm(shop.page, true);
const exact = await shop.page.evaluate(() => ({ gems: VR.gems, left: VR.speedLeft }));
need('exact-balance', exact.gems === 0 && exact.left === 2);
await shop.page.evaluate(() => document.querySelector('[data-sku="com.jwmanor.varmintridge.starter"]').click());
await confirm(shop.page, true);
const starter1 = await shop.page.evaluate(() => ({ bank: JSON.parse(localStorage.getItem('vr_bank')), owned: JSON.parse(localStorage.getItem('vr_starterOwned')), zeus: JSON.parse(localStorage.getItem('vr_zeusBonus')), again: VR.grant('starter'), logs: JSON.parse(localStorage.getItem('vr_spend')).filter((r) => r.name === 'Starter Pack').length }));
await shop.page.evaluate(() => document.getElementById('bStore').click());
const starterBtn = await shop.page.evaluate(() => {
  const row = [...document.querySelectorAll('#sStore .row')].find((r) => r.innerText.indexOf('Starter Pack') === 0 || r.innerText.startsWith('Starter Pack'));
  const b = row.querySelector('button');
  b.disabled = false;
  b.click();
  return { text: b.textContent, bank: JSON.parse(localStorage.getItem('vr_bank')), sheet: document.getElementById('testBuy').style.display };
});
console.log('starter', JSON.stringify({ starter1, starterBtn }));
need('starter-once', starter1.bank === 300 && starter1.owned === true && starter1.zeus === 1 && starter1.again === null && starter1.logs === 1 && starterBtn.text === 'Owned' && starterBtn.bank === 300 && starterBtn.sheet === 'none');
await shop.page.evaluate(() => {
  localStorage.setItem('vr_seasonDone', JSON.stringify([1]));
  localStorage.setItem('vr_gems', '5');
  localStorage.setItem('vr_bank', '0');
  document.getElementById('bStore').click();
});
const early = await shop.page.evaluate(() => {
  const f2 = document.querySelector('[data-claim="f2"]');
  const p1 = document.querySelector('[data-claim="p1"]');
  const before = { gems: VR.gems, bank: JSON.parse(localStorage.getItem('vr_bank')), f2: f2.textContent, p1: p1.textContent, f2off: f2.disabled, p1off: p1.disabled };
  f2.disabled = false; f2.click();
  p1.disabled = false; p1.click();
  const f1 = document.querySelector('[data-claim="f1"]');
  f1.click(); f1.click();
  return { before, gems: VR.gems, bank: JSON.parse(localStorage.getItem('vr_bank')), claims: JSON.parse(localStorage.getItem('vr_seasonClaims')) };
});
console.log('claims-early', JSON.stringify(early));
need('claim-guards', early.before.f2off && early.before.p1off && early.before.p1 === 'Paid track' && early.gems === 5 && early.bank === 25 && early.claims.length === 1 && early.claims[0] === 'f1');
await shop.page.evaluate(() => {
  localStorage.setItem('vr_seasonPass', 'true');
  localStorage.setItem('vr_seasonDone', JSON.stringify([1, 2, 3, 4, 5, 6]));
  localStorage.setItem('vr_seasonClaims', JSON.stringify(['f1']));
  localStorage.setItem('vr_lessons', JSON.stringify({}));
  localStorage.setItem('vr_gems', '5');
  document.getElementById('bStore').click();
});
await shop.page.evaluate(() => document.querySelector('[data-claim="p3"]').click());
const p3lesson = await shop.page.evaluate(() => ({ gems: VR.gems, lesson: JSON.parse(localStorage.getItem('vr_lessons')) }));
await shop.page.evaluate(() => {
  const claims = JSON.parse(localStorage.getItem('vr_seasonClaims')).filter((id) => id !== 'p3');
  localStorage.setItem('vr_seasonClaims', JSON.stringify(claims));
  localStorage.setItem('vr_gems', '5');
  document.getElementById('bStore').click();
});
await shop.page.evaluate(() => document.querySelector('[data-claim="p3"]').click());
const p3gems = await shop.page.evaluate(() => ({ gems: VR.gems, lesson: JSON.parse(localStorage.getItem('vr_lessons')), claims: JSON.parse(localStorage.getItem('vr_seasonClaims')).filter((id) => id === 'p3').length }));
console.log('p3', JSON.stringify({ p3lesson, p3gems }));
need('p3-fallback', p3lesson.lesson.scarecrow === true && p3lesson.gems === 5 && p3gems.gems === 85 && p3gems.claims === 1);
await shop.page.evaluate(() => {
  localStorage.setItem('vr_seasonDone', JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
  localStorage.setItem('vr_seasonClaims', JSON.stringify([]));
  localStorage.setItem('vr_skins', JSON.stringify({ yard: ['dusk'], varmint: ['natural'] }));
  document.getElementById('bStore').click();
});
const f5 = await shop.page.evaluate(() => {
  const b = document.querySelector('[data-claim="f5"]');
  b.click(); b.click();
  const skins = JSON.parse(localStorage.getItem('vr_skins'));
  return { n: skins.yard.filter((id) => id === 'harvest').length, yard: JSON.parse(localStorage.getItem('vr_yard')) };
});
need('f5-once', f5.n === 1 && f5.yard === 'harvest');
await shop.page.clock.fastForward(121000);
await shop.page.evaluate(() => { localStorage.setItem('vr_gems', '80'); document.querySelector('[data-gem="speed"]').click(); });
const expired = await shop.page.evaluate(() => ({
  gate: document.getElementById('sGate').classList.contains('show'),
  store: document.getElementById('sStore').classList.contains('show'),
  sheet: document.getElementById('testBuy').style.display,
  gems: VR.gems,
}));
const wrong2 = await shop.page.evaluate(() => {
  document.getElementById('gateA').value = '2';
  document.getElementById('gateGo').click();
  return { msg: document.getElementById('gateMsg').textContent, gate: document.getElementById('sGate').classList.contains('show'), gems: VR.gems };
});
console.log('expired', JSON.stringify({ expired, wrong2 }));
need('gate-expired', expired.gate === true && expired.store === false && expired.sheet === 'none' && expired.gems === 80 && wrong2.gate === true && wrong2.msg.indexOf('Not quite') === 0 && wrong2.gems === 80);
await shop.page.evaluate(() => document.getElementById('gateBack').click());
const backed = await shop.page.evaluate(() => ({ title: document.getElementById('sTitle').classList.contains('show'), store: document.getElementById('sStore').classList.contains('show'), gems: VR.gems }));
await shop.page.evaluate(() => document.getElementById('bStore').click());
const gatedAgain = await shop.page.evaluate(() => document.getElementById('sGate').classList.contains('show') && !document.getElementById('sStore').classList.contains('show'));
need('gate-cancel', backed.title === true && backed.store === false && backed.gems === 80 && gatedAgain === true);
await shop.ctx.close();

const se = await browser.newContext({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: ua });
const sp = await se.newPage();
watch(sp);
await boot(sp);
const fit = await sp.evaluate(() => {
  const ov = document.getElementById('sTitle');
  const last = [...ov.querySelectorAll('p.small')].pop();
  const card = document.querySelector('.card');
  return { overflow: ov.scrollHeight - ov.clientHeight, clipped: last.getBoundingClientRect().bottom > ov.getBoundingClientRect().bottom + 1, card: card ? getComputedStyle(card).minHeight : '0' };
});
console.log('phone', JSON.stringify(fit));
need('short-phone', fit.overflow === 0 && fit.clipped === false && parseInt(fit.card, 10) >= 88);
await se.close();

console.log('errors', JSON.stringify(errors));
need('no-page-errors', errors.length === 0, errors);
await browser.close();
server.close();
console.log(fails.length ? 'FAILS ' + fails.join(', ') : 'ALL_PASS');
if (fails.length) process.exit(1);
