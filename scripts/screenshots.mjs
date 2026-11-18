import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'store', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: 'iphone-6.9', width: 1320, height: 2868 },
  { name: 'iphone-6.3', width: 1179, height: 2556 },
  { name: 'play-phone', width: 1080, height: 1920 },
];

const server = spawn(process.execPath, [path.join(root, 'scripts', 'serve-www.mjs')], {
  env: { ...process.env, PORT: '4173' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server start timeout')), 15000);
  server.stdout.on('data', (buf) => {
    if (String(buf).includes('serving')) {
      clearTimeout(t);
      resolve();
    }
  });
  server.on('error', reject);
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

async function snap(page, size, shot, label) {
  const file = path.join(outDir, `${size.name}-${shot}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('wrote', file, label);
}

for (const size of sizes) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem('vr.theme', 'dark');
      localStorage.setItem('vr_tutorialDone', 'true');
    } catch {
      /* ignore */
    }
  });
  await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.VR);
  await page.waitForTimeout(400);
  await snap(page, size, '01-title', 'title');

  await page.evaluate(() => {
    const VR = window.VR;
    VR.begin(1);
    VR.place('scarecrow', 168, 360);
    VR.place('lantern', 248, 340);
    VR.startWave();
    for (let i = 0; i < 90; i++) VR.step(0.05);
  });
  await page.waitForTimeout(250);
  await snap(page, size, '02-gameplay', 'wave');

  await page.evaluate(() => {
    document.getElementById('bSet')?.click();
  });
  await page.keyboard.press('p');
  await page.waitForTimeout(200);
  const paused = await page.evaluate(() => document.getElementById('sPause')?.classList.contains('show'));
  if (!paused) {
    await page.evaluate(() => {
      const VR = window.VR;
      VR.S.phase = 'paused';
      VR.S.prev = 'wave';
      document.querySelectorAll('.ov').forEach((o) => o.classList.remove('show'));
      document.getElementById('sPause').classList.add('show');
    });
  }
  await snap(page, size, '03-pause', 'pause');

  await page.evaluate(() => {
    window.VR.end(true);
  });
  await page.waitForFunction(() => document.getElementById('sEnd')?.classList.contains('show'));
  await page.waitForTimeout(200);
  await snap(page, size, '04-win', 'win');

  await page.evaluate(() => {
    document.getElementById('bTitle').click();
    document.getElementById('bSet').click();
  });
  await page.waitForFunction(() => document.getElementById('sSet')?.classList.contains('show'));
  await snap(page, size, '05-settings', 'settings');
  await context.close();

  const light = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'light',
    serviceWorkers: 'block',
  });
  const lp = await light.newPage();
  await lp.addInitScript(() => {
    try {
      localStorage.setItem('vr.theme', 'light');
      localStorage.setItem('vr_tutorialDone', 'true');
    } catch {
      /* ignore */
    }
  });
  await lp.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'domcontentloaded' });
  await lp.waitForFunction(() => window.VR);
  await lp.waitForTimeout(300);
  await snap(lp, size, '06-title-light', 'title light');
  await light.close();
}

await browser.close();
server.kill();
console.log('screenshots ready in', outDir);
