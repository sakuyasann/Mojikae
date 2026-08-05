/**
 * フォントの組み合わせのプリセット。
 *
 * 保存するのは「プリセット名」と「フォント名の並び」だけ。
 * サイトの URL・タブ情報・適用対象・適用状態は保存しない
 * （最近使用したフォントと同じ方針）。
 */
export type FontPreset = {
  id: string;
  name: string;
  /** フォント名の並び。先頭が最優先で、そのまま font-family の指定順になる。 */
  fontFamilies: string[];
  /** ISO 8601。並び順（新しい順）に使う。 */
  createdAt: string;
};

/** 保存できるプリセットの上限。 */
export const PRESET_LIMIT = 20;

/** プリセット名の最大文字数。 */
export const PRESET_NAME_MAX_LENGTH = 40;
