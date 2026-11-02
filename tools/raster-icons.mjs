import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const dir = "/workspace/varmint-ridge/www/icons";

async function shot(svgName, pngName, size) {
  const svg = fs.readFileSync(path.join(dir, svgName), "utf8");
  const html = `<!DOCTYPE html><html><head><style>html,body{margin:0;background:#305032}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`;
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({
    path: path.join(dir, pngName),
    omitBackground: false,
    clip: { x: 0, y: 0, width: size, height: size },
  });
  await browser.close();
  const stat = fs.statSync(path.join(dir, pngName));
  console.log(pngName, stat.size);
}

await shot("icon-full.svg", "apple-touch-icon.png", 180);
await shot("icon-full.svg", "icon-192.png", 192);
await shot("icon-full.svg", "icon-512.png", 512);
await shot("icon-maskable.svg", "icon-maskable.png", 512);
await shot("icon-full.svg", "icon-1024.png", 1024);
