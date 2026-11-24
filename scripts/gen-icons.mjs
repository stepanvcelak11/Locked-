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
// Full-bleed variant: square background, artwork shrunk into the safe zone (the OS applies its own mask).
const BG_RECT = '<rect width="512" height="512" rx="116" fill="url(#bg)"/>';
if (!svg.includes(BG_RECT)) throw new Error('icon.svg background rect not found');
const fullBleed = (scale) =>
  svg
    .replace(BG_RECT, `${BG_RECT.replace('rx="116"', 'rx="0"')}<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">`)
    .replace('</svg>', '</g></svg>');
const jobs = [
  { file: 'icon-192.png', size: 192, src: svg },
  { file: 'icon-512.png', size: 512, src: svg },
  { file: 'apple-touch-icon.png', size: 180, src: fullBleed(0.92) },
  { file: 'maskable-512.png', size: 512, src: fullBleed(0.72) },
];
for (const j of jobs) {
  await page.setViewportSize({ width: j.size, height: j.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent;width:${j.size}px;height:${j.size}px">` +
      j.src.replace('<svg ', `<svg width="${j.size}" height="${j.size}" style="display:block" `) +
      '</body></html>',
  );
  await page.screenshot({ path: join(dir, j.file), omitBackground: true });
  console.log('wrote', j.file);
}
await browser.close();
