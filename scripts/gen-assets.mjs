import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'www', 'icons', 'icon-1024.png');
if (!fs.existsSync(src)) {
  console.error('missing', src);
  process.exit(1);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status) process.exit(r.status || 1);
}

function resize(out, size) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  run('ffmpeg', ['-y', '-i', src, '-vf', `scale=${size}:${size}`, out]);
}

function splash(out, w, h) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const icon = Math.round(Math.min(w, h) * 0.38);
  const filter = `color=c=0x1A1A1A:s=${w}x${h},format=rgba[bg];[0:v]scale=${icon}:${icon}[icon];[bg][icon]overlay=(W-w)/2:(H-h)/2`;
  run('ffmpeg', ['-y', '-i', src, '-filter_complex', filter, '-frames:v', '1', out]);
}

const ios = {
  'AppIcon-20.png': 20,
  'AppIcon-20@2x.png': 40,
  'AppIcon-20@3x.png': 60,
  'AppIcon-29.png': 29,
  'AppIcon-29@2x.png': 58,
  'AppIcon-29@3x.png': 87,
  'AppIcon-40.png': 40,
  'AppIcon-40@2x.png': 80,
  'AppIcon-40@3x.png': 120,
  'AppIcon-60@2x.png': 120,
  'AppIcon-60@3x.png': 180,
  'AppIcon-76.png': 76,
  'AppIcon-76@2x.png': 152,
  'AppIcon-83.5@2x.png': 167,
  'AppIcon-1024.png': 1024,
};

const android = {
  'mipmap-mdpi/ic_launcher.png': 48,
  'mipmap-hdpi/ic_launcher.png': 72,
  'mipmap-xhdpi/ic_launcher.png': 96,
  'mipmap-xxhdpi/ic_launcher.png': 144,
  'mipmap-xxxhdpi/ic_launcher.png': 192,
  'mipmap-mdpi/ic_launcher_round.png': 48,
  'mipmap-hdpi/ic_launcher_round.png': 72,
  'mipmap-xhdpi/ic_launcher_round.png': 96,
  'mipmap-xxhdpi/ic_launcher_round.png': 144,
  'mipmap-xxxhdpi/ic_launcher_round.png': 192,
  'mipmap-mdpi/ic_launcher_foreground.png': 108,
  'mipmap-hdpi/ic_launcher_foreground.png': 162,
  'mipmap-xhdpi/ic_launcher_foreground.png': 216,
  'mipmap-xxhdpi/ic_launcher_foreground.png': 324,
  'mipmap-xxxhdpi/ic_launcher_foreground.png': 432,
};

const iosDir = path.join(root, 'resources', 'ios');
const andDir = path.join(root, 'resources', 'android');
const splashDir = path.join(root, 'resources', 'splash');

for (const [name, size] of Object.entries(ios)) resize(path.join(iosDir, name), size);
for (const [name, size] of Object.entries(android)) resize(path.join(andDir, name), size);

splash(path.join(splashDir, 'iphone-6.9.png'), 1320, 2868);
splash(path.join(splashDir, 'iphone-6.3.png'), 1179, 2556);
splash(path.join(splashDir, 'android-phone.png'), 1080, 1920);
splash(path.join(iosDir, 'Default@2x~iphone.png'), 640, 1136);
splash(path.join(iosDir, 'Default-414h@3x.png'), 1242, 2688);
splash(path.join(andDir, 'splash-port-xxxhdpi.png'), 1440, 2560);

console.log('icons and splashes written under resources/');
