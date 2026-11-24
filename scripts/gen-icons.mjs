// Renders public/icons/icon.svg to the PNG sizes the manifest needs (uses the preinstalled Chromium).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const svg = readFileSync(join(dir, 'icon.svg'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const jobs = [
  { file: 'icon-192.png', size: 192, pad: 0, bg: 'transparent' },
  { file: 'icon-512.png', size: 512, pad: 0, bg: 'transparent' },
  { file: 'apple-touch-icon.png', size: 180, pad: 0, bg: '#090d16' },
  { file: 'maskable-512.png', size: 512, pad: 0.12, bg: '#111827' },
];
for (const j of jobs) {
  const inner = Math.round(j.size * (1 - j.pad * 2));
  await page.setViewportSize({ width: j.size, height: j.size });
  await page.setContent(
    `<html><body style="margin:0;background:${j.bg};display:flex;align-items:center;justify-content:center;width:${j.size}px;height:${j.size}px">` +
      svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `) +
      '</body></html>',
  );
  await page.screenshot({ path: join(dir, j.file), omitBackground: j.bg === 'transparent' });
  console.log('wrote', j.file);
}
await browser.close();
