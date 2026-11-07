// Source contract for the WidgetKit files. Does not run Xcode.
//   node tests/widget-contract.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
function need(name, ok, extra) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra === undefined ? '' : ' ' + JSON.stringify(extra)));
  if (!ok) fails.push(name);
}

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const swift = fs.readFileSync(path.join(root, 'ios-app/targets/widget/RidgeData.swift'), 'utf8');
const views = fs.readFileSync(path.join(root, 'ios-app/targets/widget/RidgeWidgets.swift'), 'utf8');
const config = fs.readFileSync(path.join(root, 'ios-app/targets/widget/expo-target.config.js'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'ios-app/App.js'), 'utf8');
const appJson = fs.readFileSync(path.join(root, 'ios-app/app.json'), 'utf8');
const doc = fs.readFileSync(path.join(root, 'WIDGETS.md'), 'utf8');

const jsCritters = [...html.matchAll(/\{id:'[^']+',name:'([^']+)',line:'[^']+'\}/g)].map((m) => m[1]);
const jsDailies = [...html.matchAll(/\{title:'([^']+)',blurb:'[^']+',rule:'[^']+'\}/g)].map((m) => m[1]);
const critterBlock = swift.slice(swift.indexOf('static let critters'), swift.indexOf('static let dailies'));
const dailyBlock = swift.slice(swift.indexOf('static let dailies'), swift.indexOf('static func fnv1a'));
const swiftCritters = [...critterBlock.matchAll(/\("([^"]+)",\s*"/g)].map((m) => m[1]);
const swiftDailies = [...dailyBlock.matchAll(/\("([^"]+)",\s*"/g)].map((m) => m[1]);

need('critter-lockstep', jsCritters.length === 5 && jsCritters.join('|') === swiftCritters.join('|') && !jsCritters.includes('Fox'), { jsCritters, swiftCritters });
need('daily-lockstep', jsDailies.length === 6 && jsDailies.join('|') === swiftDailies.join('|'), { jsDailies, swiftDailies });
need('js-formula', html.includes('let h=0x811c9dc5') && html.includes('Math.imul(h,0x01000193)') && html.includes('h%5') && html.includes('(h>>>8)%6') && html.includes('1+((h>>>16)%6)'));
need('swift-formula', swift.includes('2166136261') && swift.includes('16777619') && swift.includes('hash % 5') && swift.includes('(hash >> 8) % 6') && swift.includes('(hash >> 16) % 6'));

const hash = fnv1a('jwmanor-vr-2026-10-30');
const pack = { hash, varmint: hash % 5, daily: (hash >>> 8) % 6, wave: 1 + ((hash >>> 16) % 6), name: jsCritters[hash % 5], dailyTitle: jsDailies[(hash >>> 8) % 6] };
console.log('fixture', JSON.stringify(pack));
need('fixture', hash === 3339250613 && pack.varmint === 3 && pack.name === 'Possum' && pack.daily === 1 && pack.dailyTitle === 'Lantern Watch' && pack.wave === 1);

need('bandit-wave-12', html.includes("name:'Bandit King',line:'The wave 12 boss.") && swift.includes('("Bandit King", "The wave 12 boss.'));
need('large-widget-of-12', views.includes('opened \\(min(snap.reach, 12)) of 12'));
need('four-layouts', ['BestScoreView', 'DailyChallengeView', 'VarmintDayView', 'RidgeGlanceView'].every((name) => views.includes('struct ' + name)));
need('app-group', swift.includes('group.com.jwmanor.varmintridge') && config.includes('group.com.jwmanor.varmintridge') && appJs.includes('group.com.jwmanor.varmintridge') && appJson.includes('"bundleIdentifier": "com.jwmanor.varmintridge"'));
need('palette', config.includes('#305032') && config.includes('#C19A50') && config.includes('#1A1A1A') && config.includes('#F3E6C4'));

need('checklist-unrun', doc.includes('Status: UNRUN') && doc.includes('xcodebuild: not run') && doc.includes('device install: not run'));
need('checklist-requirements', doc.includes('Xcode 16') && doc.includes('Apple Developer') && doc.includes('do not install from the website'));
need('no-fake-device-pass', !/xcodebuild succeeded|installed on a test iPhone|widget tests passed on device/i.test(doc));
need('no-ads-in-widget-doc', !/admob|adsense/i.test(doc));

console.log(fails.length ? 'FAILS ' + fails.join(', ') : 'ALL_PASS');
if (fails.length) process.exit(1);
