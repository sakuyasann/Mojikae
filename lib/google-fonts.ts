import { browser } from 'wxt/browser';
import { RECENT_FONTS_LIMIT, SEARCH_RESULT_LIMIT } from './constants';
import { ExtensionError } from './extension-errors';
import { EMPTY_FILTER, matchesFilter, type FontFilter } from './font-filters';
import { isIconFontName } from './icon-font-detector';
import { JAPANESE_SUBSET, type FontSearchItem, type GoogleFont, type GoogleFontsCatalog } from '../types/google-font';

/**
 * 同梱した Google Fonts カタログの読み込み・検索と、最近使用したフォントの保存。
 *
 * 実行時に Google Fonts Developer API は呼ばない。カタログは
 * `scripts/sync-google-fonts.ts` が生成した静的 JSON を拡張機能へ同梱している。
 */

const CATALOG_PATH = 'data/google-fonts.json';
const RECENT_FONTS_KEY = 'recentFonts';

let catalogPromise: Promise<GoogleFont[]> | null = null;

async function fetchCatalog(): Promise<GoogleFont[]> {
  const url = browser.runtime.getURL(`/${CATALOG_PATH}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new ExtensionError('CATALOG_LOAD_FAILED', {
      cause: new Error(`${url} -> ${response.status}`),
    });
  }
  const catalog = (await response.json()) as GoogleFontsCatalog;
  if (!Array.isArray(catalog.fonts) || catalog.fonts.length === 0) {
    throw new ExtensionError('CATALOG_LOAD_FAILED', { cause: new Error('empty catalog') });
  }
  return catalog.fonts;
}

/** カタログを読み込む（ポップアップの生存期間中は 1 回だけ）。 */
export function loadCatalog(): Promise<GoogleFont[]> {
  catalogPromise ??= fetchCatalog().catch((error: unknown) => {
    // 失敗をキャッシュしたままにしない
    catalogPromise = null;
    throw error;
  });
  return catalogPromise;
}

export function isJapaneseFont(font: GoogleFont): boolean {
  return font.subsets.includes(JAPANESE_SUBSET);
}

/**
 * カタログに含まれるアイコンフォント（Material Icons / Symbols 系）か。
 * ページ内フォントの判定と同じ名前ヒューリスティックを使い回している。
 */
export function isIconFont(font: GoogleFont): boolean {
  return isIconFontName(font.family);
}

function toSearchItem(font: GoogleFont): FontSearchItem {
  return { font, isJapanese: isJapaneseFont(font), isIconFont: isIconFont(font) };
}

/**
 * フォント名の部分一致検索（大文字小文字を区別しない）。
 * 言語サブセットと種類での絞り込みを併用できる。
 *
 * 並び順:
 *   1. 日本語対応フォントを優先
 *   2. 前方一致を部分一致より優先
 *   3. 人気順（Google Fonts の popularity。同順位なら family 名の昇順）
 */
export function searchFonts(
  fonts: GoogleFont[],
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
  filter: FontFilter = EMPTY_FILTER,
): FontSearchItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  const matched = fonts.filter(
    (font) =>
      matchesFilter(font, filter) &&
      (normalizedQuery === '' || font.family.toLowerCase().includes(normalizedQuery)),
  );

  const scored = matched.map((font) => {
    const lower = font.family.toLowerCase();
    const startsWith = normalizedQuery !== '' && lower.startsWith(normalizedQuery);
    return { font, startsWith };
  });

  scored.sort((a, b) => {
    const aJapanese = isJapaneseFont(a.font);
    const bJapanese = isJapaneseFont(b.font);
    if (aJapanese !== bJapanese) return aJapanese ? -1 : 1;
    if (a.startsWith !== b.startsWith) return a.startsWith ? -1 : 1;
    // popularity は 1 が最も人気。持たないフォントは最後に回す。
    const aRank = a.font.popularity ?? Number.MAX_SAFE_INTEGER;
    const bRank = b.font.popularity ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.font.family.localeCompare(b.font.family, 'en');
  });

  return scored.slice(0, limit).map((entry) => toSearchItem(entry.font));
}

/** 絞り込みと検索語に一致する総数（表示件数で切り詰める前）。 */
export function countMatches(fonts: GoogleFont[], query: string, filter: FontFilter = EMPTY_FILTER): number {
  const normalizedQuery = query.trim().toLowerCase();
  return fonts.reduce(
    (total, font) =>
      matchesFilter(font, filter) &&
      (normalizedQuery === '' || font.family.toLowerCase().includes(normalizedQuery))
        ? total + 1
        : total,
    0,
  );
}

export function findFontByFamily(fonts: GoogleFont[], family: string): GoogleFont | undefined {
  return fonts.find((font) => font.family === family);
}

/**
 * 最近使用したフォント。保存するのはフォント名だけで、
 * サイト情報・タブ情報・適用対象・適用状態は一切保存しない。
 */
export async function loadRecentFonts(): Promise<string[]> {
  const stored = await browser.storage.local.get(RECENT_FONTS_KEY);
  const value: unknown = stored[RECENT_FONTS_KEY];
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string').slice(0, RECENT_FONTS_LIMIT);
}

/** 新しい順・重複なしで最大 5 件だけ保持する。 */
export function mergeRecentFonts(current: string[], family: string): string[] {
  return [family, ...current.filter((entry) => entry !== family)].slice(0, RECENT_FONTS_LIMIT);
}

export async function pushRecentFont(family: string): Promise<string[]> {
  const current = await loadRecentFonts();
  const next = mergeRecentFonts(current, family);
  await browser.storage.local.set({ [RECENT_FONTS_KEY]: next });
  return next;
}
