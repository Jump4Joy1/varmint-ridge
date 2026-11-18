import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = path.join(root, 'www');
const to = path.join(root, 'ios-app', 'assets', 'www');

fs.rmSync(to, { recursive: true, force: true });
fs.mkdirSync(to, { recursive: true });
fs.cpSync(from, to, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(from, src);
    return rel !== 'hub' && !rel.startsWith('hub' + path.sep);
  },
});
console.log('staged', from, '->', to);

const cap = path.join(root, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor');
if (fs.existsSync(cap) && fs.existsSync(path.join(root, 'android')) && fs.existsSync(path.join(root, 'ios'))) {
  const r = spawnSync(process.execPath, [cap, 'sync'], { cwd: root, stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
