// Builds entry.png (1024x1024) from news.json: lays the day's news out as a newspaper front page in HTML
// (design/front.html) and screenshots it with a local Chromium-based browser in headless mode.
// Run on the author's machine only; main.ts just copies the committed entry.png, so every run of the
// entry writes the same bytes with no network.
//
//   node build.mjs            (set BROWSER to override the browser path)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const news = JSON.parse(readFileSync(join(root, 'news.json'), 'utf8'));

// Text is escaped, except the <strong> tags news.json uses for emphasis in the deck.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rich = (s) => esc(s).replace(/&lt;(\/?)strong&gt;/g, '<$1strong>');

// One accent colour per story theme in news.json.
const THEMES = {
  dip: '#1f5fa8', // war / diplomacy in Europe
  me: '#b5651d', // Middle East
  mkt: '#0b6e4f', // markets / tech
  law: '#5b3a8c', // justice
  sci: '#8a1c1c', // disaster
};

const { lead, stories, index } = news;
if (stories.length !== 5) throw new Error(`expected 5 stories, got ${stories.length}`);
if (index.length !== 6) throw new Error(`expected 6 index lines, got ${index.length}`);
if (lead.stats.length !== 3) throw new Error(`expected 3 lead stats, got ${lead.stats.length}`);

const statsHtml = lead.stats
  .map((s) => `<div class="stat"><div class="num">${esc(s.value)}</div><div class="lbl">${esc(s.label)}</div></div>`)
  .join('');

const storiesHtml = stories
  .map(
    (s) => `<article class="story" style="--c:${THEMES[s.theme] ?? '#333'}">
      <div class="kick">${esc(s.kicker)}</div>
      <div class="big">${esc(s.big)}</div>
      <h3>${esc(s.headline)}</h3>
      <p>${esc(s.body)}</p>
    </article>`,
  )
  .join('');

const indexHtml = index.map((t, i) => `<li><span class="n">${i + 1}</span>${esc(t)}</li>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>THE WORLD TODAY — ${esc(news.dateLong)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1024px; height: 1024px; overflow: hidden; }
body { background: #f4efe4; color: #151515; font-family: Georgia, "Times New Roman", serif;
  padding: 20px 26px 14px; display: flex; flex-direction: column; }
.sans { font-family: Bahnschrift, "Arial Narrow", Arial, sans-serif; }
header { text-align: center; border-bottom: 4px double #151515; padding-bottom: 6px; }
.mast { font-size: 70px; font-weight: 900; letter-spacing: 3px; line-height: 1; font-family: "Times New Roman", Georgia, serif; }
.dateline { display: flex; justify-content: space-between; align-items: baseline; border-top: 1.5px solid #151515; margin-top: 6px; padding-top: 4px;
  font-size: 15px; letter-spacing: 1.5px; text-transform: uppercase; }
.dateline b { font-size: 19px; }
.lead { display: grid; grid-template-columns: 1fr 290px; gap: 18px; padding: 12px 0; border-bottom: 2px solid #151515; }
.lead .kick { color: #a3111b; font-size: 15px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
.lead h1 { font-size: 64px; line-height: 0.98; font-weight: 900; margin: 4px 0 10px; font-family: "Times New Roman", Georgia, serif; }
.lead .deck { font-size: 22px; line-height: 1.32; }
.lead .deck strong { color: #a3111b; }
.stats { display: flex; flex-direction: column; gap: 6px; border-left: 2px solid #151515; padding-left: 16px; justify-content: center; }
.stat { border-bottom: 1px solid #9a9286; padding-bottom: 4px; display: flex; align-items: baseline; gap: 12px; }
.stat:last-child { border-bottom: 0; }
.num { font-size: 58px; font-weight: 800; color: #a3111b; line-height: 1; min-width: 92px; }
.lbl { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #333; line-height: 1.15; }
.grid { display: grid; grid-template-columns: repeat(5, 1fr); flex: 1; border-bottom: 2px solid #151515; padding: 10px 0; }
.story { padding: 0 10px; border-right: 1px solid #9a9286; display: flex; flex-direction: column; }
.story:first-child { padding-left: 0; }
.story:last-child { border-right: 0; padding-right: 0; }
.story .kick { font-size: 13px; font-weight: 700; color: var(--c); text-transform: uppercase; letter-spacing: 0.8px; }
.story .big { font-size: 38px; font-weight: 800; color: var(--c); line-height: 1.0; margin: 8px 0; min-height: 78px; display: flex; align-items: center; }
.story h3 { font-size: 22px; line-height: 1.1; font-weight: 900; margin-bottom: 6px; }
.story p { font-size: 19.5px; line-height: 1.36; }
.bottom { padding-top: 8px; }
.bottom h4 { font-size: 14px; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid #151515; margin-bottom: 5px; padding-bottom: 2px; }
.index { list-style: none; display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; row-gap: 3px; }
.index li { font-size: 19px; line-height: 1.25; white-space: nowrap; }
.index .n { display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; background: #151515; color: #f4efe4;
  font-size: 13px; font-weight: 700; margin-right: 8px; border-radius: 50%; }
footer { margin-top: 8px; border-top: 4px double #151515; padding-top: 5px; display: flex; justify-content: space-between;
  font-size: 13px; letter-spacing: 1.2px; text-transform: uppercase; }
</style></head>
<body>
<header>
  <div class="mast">THE WORLD TODAY</div>
  <div class="dateline sans"><span>World edition</span><b>${esc(news.dateLong)}</b><span>The day's top stories</span></div>
</header>
<section class="lead">
  <div>
    <div class="kick sans">${esc(lead.kicker)}</div>
    <h1>${esc(lead.headline)}</h1>
    <div class="deck">${rich(lead.deck)}</div>
  </div>
  <div class="stats sans">${statsHtml}</div>
</section>
<section class="grid">${storiesHtml}</section>
<section class="bottom">
  <h4 class="sans">Index — the day in one line each</h4>
  <ol class="index">${indexHtml}</ol>
</section>
<footer class="sans"><span>THE WORLD TODAY</span><span>${esc(news.footerRegions)}</span><span>${esc(news.dateLong)}</span></footer>
</body></html>
`;

mkdirSync(join(root, 'design'), { recursive: true });
const htmlPath = join(root, 'design', 'front.html');
writeFileSync(htmlPath, html);

const browser = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p));
if (!browser) throw new Error('No Chromium-based browser found; set BROWSER');

const out = join(root, 'entry.png');
execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1024,1024',
  `--screenshot=${out}`,
  pathToFileURL(htmlPath).href,
], { stdio: 'inherit' });

const png = readFileSync(out);
const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
console.log(`wrote ${out}: ${w}x${h}, ${png.length} bytes`);
if (w !== 1024 || h !== 1024) throw new Error('image is not 1024x1024');
if (png.length > 1048576) throw new Error('image is over 1 MiB');
