/**
 * 製品ページのビルド。
 *
 * - 素材は実物：ポップアップの DOM スナップショットとコンパイル済み CSS をそのまま埋め込む
 * - フォントは Google Fonts から取得し、ページで使う文字だけへサブセットして data URI で内包する
 *   （外部リクエストゼロ・単一 HTML で完結させるため）
 *
 *   node site/build.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

const DIR = new URL('./', import.meta.url);
const read = (name) => readFileSync(new URL(name, DIR), 'utf8');

/* ------------------------------------------------------------------ フォント */

/**
 * ページで使う書体。
 * `slot` は CSS 変数名、`text` は後段でページ本文から自動収集する文字に足す分。
 */
const FONTS = [
  // 本文・UI
  { slot: 'sans', family: 'Inter', weights: [400, 500, 600] },
  { slot: 'sansJa', family: 'Noto Sans JP', weights: [400, 500, 700] },
  // 見出し（欧文 = 主役）
  { slot: 'display', family: 'Instrument Serif', weights: [400] },
  // 組み合わせデモ用のペア
  { slot: 'pairA', family: 'Playfair Display', weights: [600] },
  { slot: 'pairAJa', family: 'Shippori Mincho', weights: [600] },
  { slot: 'pairB', family: 'Archivo', weights: [700] },
  { slot: 'pairBJa', family: 'Zen Kaku Gothic New', weights: [700] },
  { slot: 'pairC', family: 'Poppins', weights: [600] },
  { slot: 'pairCJa', family: 'Zen Maru Gothic', weights: [700] },
];

const UA_WOFF2 =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/**
 * そのフォントで実際に描く文字だけを要求する（`text=` サブセット）。
 *
 * サブセット版の URL は `.woff2` で終わらず `?kit=` 形式で返る点と、
 * 可変フォントでは全ウェイトが同一ファイルを指す点に注意。
 * 同じファイルを何度も base64 で埋め込まないよう、URL 単位でまとめる。
 */
async function fetchSubset(family, weights, characters) {
  const encoded = encodeURIComponent(family).replace(/%20/g, '+');
  const url =
    `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weights.join(';')}` +
    `&text=${encodeURIComponent(characters)}&display=swap`;

  const css = await (await fetch(url, { headers: { 'User-Agent': UA_WOFF2 } })).text();

  /** src URL → その URL が担当するウェイト一覧 */
  const bySrc = new Map();
  for (const block of css.split('@font-face').slice(1)) {
    const weight = Number(/font-weight:\s*(\d+)/.exec(block)?.[1] ?? 400);
    const src = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(block)?.[1];
    if (!src) continue;
    bySrc.set(src, [...(bySrc.get(src) ?? []), weight]);
  }
  if (bySrc.size === 0) throw new Error(`${family}: woff2 を取得できませんでした`);

  const faces = [];
  let bytes = 0;
  for (const [src, srcWeights] of bySrc) {
    const buffer = Buffer.from(await (await fetch(src)).arrayBuffer());
    bytes += buffer.length;
    // 1 ファイルが複数ウェイトを兼ねる場合（可変フォント）は範囲指定にする
    const min = Math.min(...srcWeights);
    const max = Math.max(...srcWeights);
    const weight = min === max ? String(min) : `${min} ${max}`;
    faces.push(
      `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;` +
        `src:url(data:font/woff2;base64,${buffer.toString('base64')}) format('woff2')}`,
    );
  }
  return { css: faces.join('\n'), bytes };
}

/* ------------------------------------------------- ポップアップ CSS のスコープ化 */

/**
 * 拡張機能のポップアップ CSS をページへ持ち込むため、`:root` と `body` を
 * `.mjUi` 配下へ閉じ込める。中身のクラス名はハッシュ付きなので衝突しない。
 */
function scopePopupCss(css) {
  return css
    .replace(/:root\s*\{/g, '.mjUi{')
    .replace(/(^|})\s*html\s*,\s*body\s*\{/g, '$1.mjUi{')
    .replace(/(^|})\s*body\s*\{/g, '$1.mjUi{')
    .replace(/#root\s*\{/g, '.mjUi > div{')
    .replace(/(^|})\s*\*\s*\{/g, '$1.mjUi *{');
}

/* ------------------------------------------------------------------- 組み立て */

const template = read('index.template.html');
const popupCss = scopePopupCss(read('assets/popup.css'));
const uiSelected = read('assets/ui-selected.html');
const uiSearch = read('assets/ui-search.html');

let html = template
  .replace('/*__POPUP_CSS__*/', popupCss)
  .replace('<!--__UI_SELECTED__-->', uiSelected)
  .replace('<!--__UI_SEARCH__-->', uiSearch);

// ページに実際に出る文字を集めてサブセット対象にする
const visibleText = html
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<[^>]+>/g, ' ');
const baseCharacters = [...new Set(visibleText)].filter((c) => c.charCodeAt(0) > 31).join('');
// フォント名やデモ文言が動的に入るので、英数字と記号は一通り含めておく
const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');

const cssParts = [];
let total = 0;
for (const font of FONTS) {
  const { css, bytes } = await fetchSubset(font.family, font.weights, baseCharacters + ascii);
  cssParts.push(css);
  total += bytes;
  console.log(`  ${font.family.padEnd(22)} ${(bytes / 1024).toFixed(0).padStart(4)}KB  (${font.slot})`);
}
console.log(`  ${'合計'.padEnd(22)} ${(total / 1024).toFixed(0).padStart(4)}KB`);

html = html.replace('/*__FONT_FACES__*/', cssParts.join('\n'));

writeFileSync(new URL('index.html', DIR), html);
console.log(`\nsite/index.html を書き出しました（${(html.length / 1024).toFixed(0)}KB）`);

/*
 * Artifact 用。<head>/<body> は公開時に付与されるので、中身だけを書き出す。
 * <style> と <script> はそのまま body 内に置いて問題ない。
 */
const artifact = html
  .replace(/^[\s\S]*?<head>/, '')
  .replace(/<\/head>\s*<body>/, '')
  .replace(/<\/body>\s*<\/html>\s*$/, '')
  .replace(/<meta[^>]*>\s*/g, '')
  .trim();
writeFileSync(new URL('artifact.html', DIR), artifact);
console.log(`site/artifact.html を書き出しました（${(artifact.length / 1024).toFixed(0)}KB）`);
