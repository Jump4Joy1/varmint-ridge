// Public menu contract for launcher-identity. No browser and no deploy.
//   node tests/hub-menu.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'www/hub/index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'www/hub/sw.js'), 'utf8');
const pages = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
const fails = [];
function need(name, ok, extra) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra === undefined ? '' : ' ' + JSON.stringify(extra)));
  if (!ok) fails.push(name);
}

const hrefs = [...html.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]);
const allowed = [
  'https://jump4joy1.github.io/varmint-ridge/?daily=1',
  'https://varmint-ridge-iap-review.pages.dev/',
  'https://jump4joy1.github.io/varmint-ridge/',
];
need('only-reviewed-links', hrefs.length === allowed.length && hrefs.every((href, i) => href === allowed[i]), hrefs);

for (const id of ['cardYard', 'cardSiege', 'cardHoedown', 'cardHarvest', 'cardPreserve', 'heldClash', 'heldTools']) {
  const block = html.match(new RegExp('id="' + id + '"[\\s\\S]*?</article>'));
  need('unlinked-' + id, !!block && !/href=/.test(block[0]));
}

need('no-ads', !/admob|adsense|doubleclick|fundingchoices/i.test(html + sw));
need('no-sale', html.includes('Nothing on this menu is for sale') && html.includes('does not charge a card'));
need('parental-gate', html.includes('id="gate"') && html.includes('id="gateQ"') && html.includes('id="gateA"') && html.includes('id="gateGo"'));
need('light-dark', html.includes('id="themeLight"') && html.includes('id="themeDark"') && html.includes('id="themeAuto"'));
need('menu-cache', sw.includes('const CACHE = "manor-games-hub-7"') && sw.includes('const ASSETS = ["./index.html", "./manifest.webmanifest"]'));
need('pages-main-only', pages.includes('branches: [main]') && !pages.includes('launcher-identity') && !/pull_request:/.test(pages));

function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
const hash = fnv('jwmanor-vr-2026-10-30');
const critters = [...html.matchAll(/\{ name: '([^']+)' \}/g)].map((m) => m[1]);
console.log('fixture', JSON.stringify({ hash, varmint: hash % 5, name: critters[hash % 5] }));
need('seed', html.includes('0x811c9dc5') && html.includes('0x01000193') && html.includes("fnv('jwmanor-vr-' + key)") && hash === 3339250613 && critters.join('|') === 'Raccoon|Crow|Armadillo|Possum|Bandit King' && critters[hash % 5] === 'Possum');

console.log(fails.length ? 'FAILS ' + fails.join(', ') : 'ALL_PASS');
if (fails.length) process.exit(1);
