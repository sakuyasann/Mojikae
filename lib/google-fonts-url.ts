import type { GoogleFont } from '../types/google-font';

/**
 * Google Fonts CSS API v2 の URL 生成。
 *
 * ここで扱うのは API キー不要の CSS API（fonts.googleapis.com/css2）であり、
 * カタログ同期に使う Developer API とは別物。
 *
 * 副作用の無い純粋関数にしてあるので単体テストしやすい。
 */

const CSS_API_ENDPOINT = 'https://fonts.googleapis.com/css2';

/** 静的フォントで優先的に読み込むウェイト。存在するものだけを指定する。 */
export const PREFERRED_STATIC_WEIGHTS = [400, 500, 600, 700] as const;

/** MVP では通常体のみ。斜体は読み込まない。 */
function staticWeightsOf(font: GoogleFont): number[] {
  const available = new Set<number>();
  for (const variant of font.variants) {
    if (variant === 'regular') {
      available.add(400);
      continue;
    }
    // `700italic` のような斜体は対象外
    const match = /^(\d{1,4})$/.exec(variant);
    if (match) {
      available.add(Number(match[1]));
    }
  }

  const preferred = PREFERRED_STATIC_WEIGHTS.filter((weight) => available.has(weight));
  if (preferred.length > 0) {
    return [...preferred];
  }

  // 400/500/600/700 がひとつも無いフォント（例: 300 と 800 だけ）は、
  // 持っているウェイトをそのまま使う。
  return [...available].sort((a, b) => a - b);
}

/** family 名を CSS API の書式へエンコードする（空白は `+`）。 */
export function encodeFamilyName(family: string): string {
  return encodeURIComponent(family).replace(/%20/g, '+');
}

/**
 * `family=...` の値を組み立てる。
 *   - 可変フォントで wght 軸があれば range 指定: `Roboto:wght@100..900`
 *   - 静的フォントなら存在するウェイトのみ: `IBM+Plex+Sans+JP:wght@400;500;600;700`
 *   - ウェイト情報が無ければファミリー名のみ
 */
export function buildFamilyQueryValue(font: GoogleFont): string {
  const encoded = encodeFamilyName(font.family);
  const weightAxis = font.axes?.find((axis) => axis.tag === 'wght');

  if (weightAxis) {
    if (weightAxis.start === weightAxis.end) {
      return `${encoded}:wght@${weightAxis.start}`;
    }
    return `${encoded}:wght@${weightAxis.start}..${weightAxis.end}`;
  }

  const weights = staticWeightsOf(font);
  if (weights.length === 0) {
    return encoded;
  }
  if (weights.length === 1 && weights[0] === 400) {
    // 400 のみのフォントは軸指定なしでも同じ結果になる
    return encoded;
  }
  return `${encoded}:wght@${weights.join(';')}`;
}

/**
 * 選択されたフォントを読み込むための Google Fonts CSS API v2 の URL。
 * 複数フォントは `family=` を並べて 1 リクエストにまとめる。
 * CSS API は family を昇順で並べることを要求するため、ここで整列する。
 */
export function buildGoogleFontsCssUrl(fonts: readonly GoogleFont[]): string {
  const families = [...fonts]
    .sort((a, b) => a.family.localeCompare(b.family, 'en'))
    .map((font) => `family=${buildFamilyQueryValue(font)}`)
    .join('&');
  return `${CSS_API_ENDPOINT}?${families}&display=swap`;
}
