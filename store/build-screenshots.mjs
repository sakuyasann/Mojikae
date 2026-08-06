/**
 * AMO 掲載用スクリーンショットの生成。
 *
 * 素材はダミーではなく実物：`site/assets/` にある
 * ポップアップの DOM スナップショットとコンパイル済み CSS をそのまま使う。
 * それを 1280x800 の台紙に載せ、ヘッドレス Chrome で PNG に焼く。
 *
 *   node store/build-screenshots.mjs
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const WIDTH = 1280;
const HEIGHT = 800;

/**
 * ストアごとに要求サイズが違うので、倍率と出力先を環境変数で切り替える。
 *
 *   AMO           : 上限 2400x1800 → 1.875 倍で 2400x1500
 *   Chrome Web Store: 1280x800 ちょうど（または 640x400）→ 等倍
 */
const SCALE = Number(process.env.SHOT_SCALE ?? 1.875);
const OUT = new URL(`./${process.env.SHOT_DIR ?? 'screenshots'}/`, import.meta.url);

const SHOTS = [
  {
    file: '01-selected.png',
    snapshot: 'site/assets/ui-selected.html',
    title: '実際の画面のまま、\n書体を差し替える。',
    lead: '欧文と和文で別々の書体を組み合わせ、そのページの本物のレイアウトで見比べます。変更は今のタブだけ、リロードすれば元どおり。',
  },
  {
    file: '02-search.png',
    snapshot: 'site/assets/ui-search.html',
    title: '1,900 以上の書体を、\nその書体自身で。',
    lead: '検索結果はすべて実際の書体で描画されます。言語（日本語・キリルなど）と種類（セリフ／サンセリフ／等幅など）で絞り込み。',
  },
];

/* --------------------------------------------------- ポップアップ CSS のスコープ化 */

/** 拡張機能の CSS を台紙へ持ち込むため、`:root` と `body` を `.shell` 配下へ閉じ込める。 */
const scopePopupCss = (css) =>
  css
    .replace(/:root\s*\{/g, '.shell{')
    .replace(/(^|})\s*html\s*,\s*body\s*\{/g, '$1.shell{')
    .replace(/(^|})\s*body\s*\{/g, '$1.shell{')
    .replace(/#root\s*\{/g, '.shell > div{')
    .replace(/(^|})\s*\*\s*\{/g, '$1.shell *{');

/* ------------------------------------------------------------------------ フォント */

/** スナップショットが `style="font-family: ..."` で参照している書体を集める。 */
function collectFamilies(snapshot) {
  const families = new Set();
  for (const [, value] of snapshot.matchAll(/font-family:\s*([^"]+?);/g)) {
    const first = value.replace(/&quot;/g, '"').split(',')[0].trim().replace(/^["']|["']$/g, '');
    // 総称ファミリとフォールバックは除く
    if (first && !['serif', 'sans-serif', 'monospace', 'cursive'].includes(first)) families.add(first);
  }
  return [...families].sort();
}

const fontsHref = (families) =>
  'https://fonts.googleapis.com/css2?' +
  families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}`).join('&') +
  '&family=Noto+Sans+JP:wght@400;500;700&display=block';

/* ---------------------------------------------------------------------- 台紙の HTML */

const page = (popupCss, snapshot, shot) => `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="${fontsHref(collectFamilies(snapshot))}">
<style>
/* 拡張機能の実 CSS。台紙側のレイアウトが必ず勝つよう先に読み込む。 */
${scopePopupCss(popupCss)}
</style>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 72px;
    padding: 0 88px;
    font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
    background:
      radial-gradient(900px 620px at 14% 6%, #ffffff 0%, rgba(255,255,255,0) 62%),
      radial-gradient(820px 560px at 92% 96%, #e4e7f1 0%, rgba(228,231,241,0) 64%),
      linear-gradient(158deg, #f5f6f9 0%, #edeff4 52%, #e5e8f0 100%);
    -webkit-font-smoothing: antialiased;
  }
  .copy { max-width: 520px; }
  .copy h1 {
    margin: 0;
    font-size: 46px;
    line-height: 1.32;
    letter-spacing: -0.02em;
    font-weight: 700;
    color: #10121a;
    white-space: pre-line;
  }
  .copy p {
    margin: 26px 0 0;
    font-size: 16px;
    line-height: 1.85;
    letter-spacing: 0.01em;
    color: #5b6070;
    font-weight: 400;
  }
  /* ポップアップ本体。実寸 400x600 をそのまま置く。 */
  .shell {
    width: 400px !important;
    min-width: 0 !important;
    max-width: 400px !important;
    height: 600px !important;
    max-height: 600px !important;
    flex: none;
    overflow: hidden;
    border-radius: 20px;
    background: #fff;
    box-shadow:
      0 1px 2px rgba(14,18,32,.06),
      0 14px 30px rgba(14,18,32,.10),
      0 52px 96px -26px rgba(14,18,32,.32);
  }
  .shell > div {
    width: 400px !important;
    min-width: 0 !important;
    height: 600px !important;
    max-height: 600px !important;
  }
</style></head>
<body>
  <div class="copy">
    <h1>${shot.title}</h1>
    <p>${shot.lead}</p>
  </div>
  <div class="shell">${snapshot}</div>
</body></html>`;

/* -------------------------------------------------------------------------- 実行 */

mkdirSync(fileURLToPath(OUT), { recursive: true });
const popupCss = read('site/assets/popup.css');

for (const shot of SHOTS) {
  const html = page(popupCss, read(shot.snapshot), shot);
  const htmlPath = fileURLToPath(new URL(`.tmp-${shot.file}.html`, OUT));
  const pngPath = fileURLToPath(new URL(shot.file, OUT));
  writeFileSync(htmlPath, html);

  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--force-device-scale-factor=${SCALE}`,
      `--window-size=${WIDTH},${HEIGHT}`,
      '--virtual-time-budget=12000',
      `--screenshot=${pngPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: 'ignore' },
  );

  rmSync(htmlPath);
  console.log(`  ${shot.file}  ${WIDTH * SCALE}x${HEIGHT * SCALE}`);
}

console.log('\nstore/screenshots/ に書き出しました');
