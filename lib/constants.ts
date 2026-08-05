/**
 * 拡張機能がページへ書き込む data 属性名と、スキャンのチューニング値。
 *
 * ページ側（`scripting.executeScript` で注入する関数）はこのモジュールを import できない。
 * 注入関数はシリアライズされて別コンテキストで実行されるため、モジュールスコープの値を
 * クロージャで参照できないからである。そのため、これらの値は必ず `args` 経由で渡す。
 */

/** サイト側の属性と衝突しないための prefix。 */
export const ATTR_PREFIX = 'data-mojikae';

export const PAGE_ATTRS = {
  /** `<html>` に付与。この属性が無いと上書き CSS のセレクタが一切マッチしない。 */
  active: `${ATTR_PREFIX}-active`,
  /** `<html>` に付与。適用モード（`page` / `groups`）。 */
  mode: `${ATTR_PREFIX}-mode`,
  /** `<html>` に付与。適用中の Google Font ファミリー名。 */
  font: `${ATTR_PREFIX}-font`,
  /** `<html>` に付与。選択中のグループ ID をカンマ区切りで保持。 */
  groups: `${ATTR_PREFIX}-groups`,
  /** 個別適用時に対象要素へ付与するグループ ID。 */
  group: `${ATTR_PREFIX}-group`,
  /** 個別適用時に対象要素へ付与する、上書き前の font-family。 */
  family: `${ATTR_PREFIX}-family`,
  /** サイト側がこの属性を付けた要素はスキャン対象外にする（保険）。 */
  ignore: `${ATTR_PREFIX}-ignore`,
} as const;

/** 挿入した CSS 文字列を `removeCSS` 用に保持しておくページ側グローバル変数名。 */
export const PAGE_BRIDGE_KEY = '__mojikae__';

/** `active` 属性へ入れる値。 */
export const ACTIVE_VALUE = '1';

/** DOM 走査の上限要素数。 */
export const MAX_SCAN_ELEMENTS = 10_000;

/** 走査を分割する単位。この件数ごとにメインスレッドへ制御を返す。 */
export const SCAN_CHUNK_SIZE = 1_500;

/** スキャン対象外のタグ名（小文字）。この要素とその子孫をまとめてスキップする。 */
export const SCAN_SKIP_TAGS = [
  'script',
  'style',
  'link',
  'meta',
  'noscript',
  'template',
  'svg',
  'path',
  'defs',
  'symbol',
  'canvas',
  'video',
  'audio',
  'head',
  'title',
  'iframe',
  'object',
  'embed',
] as const;

/** 最近使用したフォントの保持件数。 */
export const RECENT_FONTS_LIMIT = 5;

/** 検索結果の最大表示件数。 */
export const SEARCH_RESULT_LIMIT = 50;
