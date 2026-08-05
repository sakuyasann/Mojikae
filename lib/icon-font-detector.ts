/**
 * アイコンフォントの判定と、ページ全体適用時に除外するセレクタ定義。
 *
 * 誤ってアイコンフォントを上書きするとサイトの見た目が壊れるため、
 * 「フォント名」「Unicode Private Use Area の使用率」の 2 軸で保守的に判定する。
 */

/**
 * 既知のアイコンフォント名パターン。
 *
 * `\bicon` は語頭境界を要求しているので `Silicon` のような通常のフォント名は拾わない。
 * 一方 `Material Icons` / `iconfont` / `line-icons` などは拾える。
 */
const ICON_FONT_NAME_PATTERNS: RegExp[] = [
  /\bicon/i,
  /font\s*awesome/i,
  /material\s+(icons|symbols)/i,
  /glyphicons?/i,
  /ionicons/i,
  /lucide/i,
  /phosphor/i,
  /remix\s*icon/i,
  /bootstrap[\s-]*icons/i,
  /icomoon/i,
  /octicons/i,
  /typicons/i,
  /dashicons/i,
];

/**
 * PUA 文字を含む要素の比率がこの値以上なら、アイコンフォントとみなす。
 * 「PUA 文字を多く含む要素で使用されている」の判定しきい値。
 */
export const PUA_ICON_RATIO_THRESHOLD = 0.4;

/** フォント名だけからアイコンフォントらしさを判定する。 */
export function isIconFontName(name: string): boolean {
  return ICON_FONT_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

export type IconFontHeuristicInput = {
  /** font-family の先頭に指定されたフォント名。 */
  primaryFamily: string;
  /** 正規化済みの font-family 全体。 */
  fontFamily: string;
  elementCount: number;
  /** そのフォントで描画されている要素のうち、直下テキストに PUA 文字を含む要素数。 */
  puaElementCount: number;
};

/** フォント名と PUA 使用率からアイコンフォントの可能性を判定する。 */
export function isPossibleIconFont(input: IconFontHeuristicInput): boolean {
  if (isIconFontName(input.primaryFamily) || isIconFontName(input.fontFamily)) {
    return true;
  }
  if (input.elementCount <= 0) {
    return false;
  }
  return input.puaElementCount / input.elementCount >= PUA_ICON_RATIO_THRESHOLD;
}

/**
 * ページ全体適用時に font-family を上書きしないセレクタ。
 *
 * 仕様例にあった `[class*="icon"]` は `pricing-icons-row` のような
 * 普通のテキスト要素まで巻き込むため採用せず、クラス名の語境界を見る形にしている。
 */
export const EXCLUDED_SELECTORS: readonly string[] = [
  // コード・等幅を意図した要素
  'code',
  'pre',
  'kbd',
  'samp',
  'var',
  'tt',
  // 図形・数式
  'svg',
  'math',
  // Font Awesome
  '.fa',
  '.fas',
  '.far',
  '.fab',
  '.fal',
  '.fad',
  '.fa-solid',
  '.fa-regular',
  '.fa-brands',
  '[class^="fa-"]',
  '[class*=" fa-"]',
  // Material Icons / Symbols
  '.material-icons',
  '.material-icons-outlined',
  '.material-icons-round',
  '.material-icons-sharp',
  '.material-icons-two-tone',
  '.material-symbols-outlined',
  '.material-symbols-rounded',
  '.material-symbols-sharp',
  // Glyphicons
  '.glyphicon',
  '[class^="glyphicon-"]',
  '[class*=" glyphicon-"]',
  // Bootstrap Icons
  '.bi',
  '[class^="bi-"]',
  '[class*=" bi-"]',
  // Ionicons
  'ion-icon',
  '[class^="ion-"]',
  '[class*=" ion-"]',
  // RemixIcon
  '[class^="ri-"]',
  '[class*=" ri-"]',
  // Phosphor
  '.ph',
  '[class^="ph-"]',
  '[class*=" ph-"]',
  // Lucide
  '[class^="lucide"]',
  '[class*=" lucide"]',
  // 汎用のアイコンクラス（語境界つき。`icon` 単独の部分一致はしない）
  '.icon',
  '[class^="icon-"]',
  '[class*=" icon-"]',
];

/**
 * ページ全体適用の対象にするテキスト要素。
 * `*` を使わず、テキストを持ちうる一般的な要素だけを列挙して事故を減らす。
 */
export const TARGET_SELECTORS: readonly string[] = [
  'div',
  'section',
  'article',
  'main',
  'aside',
  'nav',
  'header',
  'footer',
  'p',
  'span',
  'a',
  'strong',
  'em',
  'b',
  'i',
  'small',
  'button',
  'input',
  'textarea',
  'select',
  'option',
  'optgroup',
  'label',
  'fieldset',
  'legend',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'table',
  'caption',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'figure',
  'figcaption',
  'summary',
  'details',
  'address',
  'time',
  'abbr',
  'cite',
  'q',
  'mark',
  'dialog',
];
