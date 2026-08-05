/**
 * `data/google-fonts.json` に同梱する Google Fonts カタログの型定義。
 *
 * このカタログは `scripts/sync-google-fonts.ts` が Google Fonts Developer API から
 * 生成する静的 JSON であり、拡張機能の実行時に API を呼び出すことはない。
 */

export const GOOGLE_FONT_CATEGORIES = [
  'serif',
  'sans-serif',
  'display',
  'handwriting',
  'monospace',
] as const;

export type GoogleFontCategory = (typeof GOOGLE_FONT_CATEGORIES)[number];

/** 可変フォントの軸。`start` / `end` は Developer API の表記に合わせている。 */
export type GoogleFontAxis = {
  tag: string;
  start: number;
  end: number;
};

export type GoogleFont = {
  family: string;
  category: GoogleFontCategory;
  /** `menu` を除いた実スクリプトのサブセット。昇順ソート済み。 */
  subsets: string[];
  /** `regular` / `italic` / `700` / `700italic` 形式。昇順ソート済み。 */
  variants: string[];
  /** 可変フォントのみ。静的フォントでは未定義。 */
  axes?: GoogleFontAxis[];
  /** `YYYY-MM-DD` 形式。 */
  lastModified?: string;
};

export type GoogleFontsCatalog = {
  /** ISO 8601。同期スクリプト実行時刻。 */
  generatedAt: string;
  /** `family` の昇順で安定ソート済み。 */
  fonts: GoogleFont[];
};

/** 日本語サブセットの識別子。 */
export const JAPANESE_SUBSET = 'japanese';

const CATEGORY_SET = new Set<string>(GOOGLE_FONT_CATEGORIES);

export function isGoogleFontCategory(value: string): value is GoogleFontCategory {
  return CATEGORY_SET.has(value);
}

/** ポップアップの検索結果 1 行分。カタログの `GoogleFont` に表示用の情報を足したもの。 */
export type FontSearchItem = {
  font: GoogleFont;
  /** 日本語サブセットを持つか。UI の「日本語」ラベルと優先表示に使う。 */
  isJapanese: boolean;
};
