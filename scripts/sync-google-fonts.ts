/**
 * Google Fonts Developer API から全フォント一覧を取得し、
 * 拡張機能へ同梱する `data/google-fonts.json` を生成する。
 *
 *   GOOGLE_FONTS_API_KEY=xxxx pnpm fonts:sync
 *
 * この API キーは「カタログ同期」専用であり、拡張機能の実行時には一切使わない。
 * ユーザーがフォントを選んだときの読み込みは、キー不要の Google Fonts CSS API v2 を使う。
 *
 * 設計上の約束:
 *   - API のレスポンスをそのまま保存しない（必要な情報だけへ変換する）
 *   - family 名で安定ソートし、毎回同じ入力なら同じ出力になるようにする
 *   - 不正なデータが 1 件でもあれば失敗させる（壊れたカタログを commit しない）
 *   - API キーを標準出力・エラー出力・生成 JSON へ出さない
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format as prettierFormat, resolveConfig } from 'prettier';
import {
  GOOGLE_FONT_CATEGORIES,
  isGoogleFontCategory,
  type GoogleFont,
  type GoogleFontAxis,
  type GoogleFontCategory,
  type GoogleFontsCatalog,
} from '../types/google-font.js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..');
const OUTPUT_PATH = resolve(PROJECT_ROOT, 'data/google-fonts.json');

const API_ENDPOINT = 'https://www.googleapis.com/webfonts/v1/webfonts';

/** これを下回ったらレスポンスが壊れているとみなす件数。 */
const MIN_EXPECTED_FONTS = 500;

/** Google Fonts のフォント選択メニュー用サブセット。実際のスクリプトではないので落とす。 */
const NON_SCRIPT_SUBSETS = new Set(['menu']);

type ApiAxis = {
  tag?: unknown;
  start?: unknown;
  end?: unknown;
};

type ApiWebfont = {
  family?: unknown;
  category?: unknown;
  subsets?: unknown;
  variants?: unknown;
  axes?: unknown;
  lastModified?: unknown;
};

type ApiResponse = {
  items?: unknown;
};

class SyncError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SyncError';
  }
}

/** URL に含まれる API キーを伏せ字にしてから返す。ログへ出すのはこの形だけ。 */
function redactKey(input: string): string {
  return input.replace(/([?&]key=)[^&]*/g, '$1***');
}

function readApiKey(): string {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY?.trim();
  if (!apiKey) {
    throw new SyncError(
      [
        '環境変数 GOOGLE_FONTS_API_KEY が設定されていません。',
        '',
        'Google Fonts Developer API のキーを取得し、次のいずれかの方法で設定してください。',
        '  1) ローカル実行:  GOOGLE_FONTS_API_KEY=xxxx pnpm fonts:sync',
        '  2) GitHub Actions: リポジトリの Secrets に GOOGLE_FONTS_API_KEY を登録',
        '',
        'キーの取得: https://developers.google.com/fonts/docs/developer_api',
      ].join('\n'),
    );
  }
  return apiKey;
}

async function fetchWebfonts(apiKey: string): Promise<ApiWebfont[]> {
  const url = new URL(API_ENDPOINT);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('sort', 'alpha');
  // capability=VF を付けると可変フォントの axes が返る
  url.searchParams.set('capability', 'VF');

  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new SyncError(`Google Fonts Developer API へ接続できませんでした: ${redactKey(url.toString())}`, {
      cause,
    });
  }

  if (!response.ok) {
    throw new SyncError(
      `Google Fonts Developer API がエラーを返しました (HTTP ${response.status} ${response.statusText}): ${redactKey(
        url.toString(),
      )}`,
    );
  }

  const payload = (await response.json()) as ApiResponse;
  if (!Array.isArray(payload.items)) {
    throw new SyncError('Google Fonts Developer API のレスポンスに items 配列がありません。');
  }
  return payload.items as ApiWebfont[];
}

function normalizeCategory(raw: unknown, family: string): GoogleFontCategory {
  if (typeof raw !== 'string') {
    throw new SyncError(`"${family}": category が文字列ではありません。`);
  }
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-');
  if (!isGoogleFontCategory(normalized)) {
    throw new SyncError(
      `"${family}": 未知の category "${raw}" です。想定値: ${GOOGLE_FONT_CATEGORIES.join(', ')}`,
    );
  }
  return normalized;
}

function normalizeSubsets(raw: unknown, family: string): string[] {
  if (!Array.isArray(raw)) {
    throw new SyncError(`"${family}": subsets が配列ではありません。`);
  }
  const subsets = new Set<string>();
  for (const entry of raw) {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new SyncError(`"${family}": subsets に文字列以外の値が含まれています。`);
    }
    const value = entry.trim().toLowerCase();
    if (!NON_SCRIPT_SUBSETS.has(value)) {
      subsets.add(value);
    }
  }
  return [...subsets].sort((a, b) => a.localeCompare(b, 'en'));
}

/**
 * `regular` / `italic` / `700` / `700italic` を [weight, italic] へ分解する。
 * 可変フォントには wght が 1..1000 のものがある（Sofia Sans など）ため、
 * 100 刻みに限定せず 1〜1000 を許容する。
 */
export function parseVariant(variant: string): { weight: number; italic: boolean } | null {
  if (variant === 'regular') return { weight: 400, italic: false };
  if (variant === 'italic') return { weight: 400, italic: true };
  const match = /^(\d{1,4})(italic)?$/.exec(variant);
  if (!match) return null;
  const weight = Number(match[1]);
  if (weight < 1 || weight > 1000) return null;
  return { weight, italic: match[2] === 'italic' };
}

function normalizeVariants(raw: unknown, family: string): string[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new SyncError(`"${family}": variants が空、または配列ではありません。`);
  }
  const variants = new Set<string>();
  for (const entry of raw) {
    if (typeof entry !== 'string') {
      throw new SyncError(`"${family}": variants に文字列以外の値が含まれています。`);
    }
    const value = entry.trim().toLowerCase();
    if (parseVariant(value) === null) {
      throw new SyncError(`"${family}": 解釈できない variant "${entry}" が含まれています。`);
    }
    variants.add(value);
  }

  // ウェイト昇順 → 正体を先、斜体を後。入力順に依存しない安定した並びにする。
  const sortKey = (variant: string): number => {
    const parsed = parseVariant(variant);
    // 上のループで検証済みなので parsed は必ず非 null
    return parsed === null ? Number.MAX_SAFE_INTEGER : parsed.weight * 2 + Number(parsed.italic);
  };
  return [...variants].sort((a, b) => sortKey(a) - sortKey(b));
}

function normalizeAxes(raw: unknown, family: string): GoogleFontAxis[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) {
    throw new SyncError(`"${family}": axes が配列ではありません。`);
  }
  if (raw.length === 0) return undefined;

  const byTag = new Map<string, GoogleFontAxis>();
  for (const entry of raw as ApiAxis[]) {
    const tag = entry?.tag;
    const start = entry?.start;
    const end = entry?.end;
    // 登録済み軸は 4 文字の英字（wght / wdth / opsz など）だが、
    // カスタム軸には SZP1 のように数字を含むものがあるため英数字 4 文字を許容する。
    if (typeof tag !== 'string' || !/^[A-Za-z0-9]{4}$/.test(tag)) {
      throw new SyncError(
        `"${family}": axes の tag "${String(tag)}" が不正です（4 文字の英数字である必要があります）。`,
      );
    }
    if (typeof start !== 'number' || !Number.isFinite(start)) {
      throw new SyncError(`"${family}": axes[${tag}].start が数値ではありません。`);
    }
    if (typeof end !== 'number' || !Number.isFinite(end)) {
      throw new SyncError(`"${family}": axes[${tag}].end が数値ではありません。`);
    }
    if (start > end) {
      throw new SyncError(`"${family}": axes[${tag}] の start(${start}) が end(${end}) を超えています。`);
    }
    byTag.set(tag, { tag, start, end });
  }

  return [...byTag.values()].sort((a, b) => a.tag.localeCompare(b.tag, 'en'));
}

function normalizeLastModified(raw: unknown, family: string): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new SyncError(`"${family}": lastModified "${String(raw)}" が YYYY-MM-DD 形式ではありません。`);
  }
  return raw;
}

function toGoogleFont(item: ApiWebfont): GoogleFont {
  const family = typeof item.family === 'string' ? item.family.trim() : '';
  if (family === '') {
    throw new SyncError('family が空のエントリが含まれています。');
  }

  const axes = normalizeAxes(item.axes, family);
  const font: GoogleFont = {
    family,
    category: normalizeCategory(item.category, family),
    subsets: normalizeSubsets(item.subsets, family),
    variants: normalizeVariants(item.variants, family),
  };
  if (axes !== undefined) font.axes = axes;

  const lastModified = normalizeLastModified(item.lastModified, family);
  if (lastModified !== undefined) font.lastModified = lastModified;

  return font;
}

export function buildCatalog(items: ApiWebfont[], generatedAt: string): GoogleFontsCatalog {
  const seen = new Set<string>();
  const fonts: GoogleFont[] = [];

  for (const item of items) {
    const font = toGoogleFont(item);
    if (seen.has(font.family)) {
      // API 側の重複は無視する（同じ family が 2 度返ることがある）
      continue;
    }
    seen.add(font.family);
    fonts.push(font);
  }

  if (fonts.length < MIN_EXPECTED_FONTS) {
    throw new SyncError(
      `取得できたフォントが ${fonts.length} 件しかありません（想定: ${MIN_EXPECTED_FONTS} 件以上）。レスポンスが壊れている可能性があります。`,
    );
  }

  // family 名で安定ソート。localeCompare('en') はロケール設定に左右されにくい。
  fonts.sort((a, b) => a.family.localeCompare(b.family, 'en'));

  return { generatedAt, fonts };
}

export async function writeCatalog(catalog: GoogleFontsCatalog): Promise<void> {
  const raw = JSON.stringify(catalog, null, 2);
  const prettierOptions = await resolveConfig(OUTPUT_PATH);
  const formatted = await prettierFormat(raw, {
    ...prettierOptions,
    filepath: OUTPUT_PATH,
    parser: 'json',
  });

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, formatted, 'utf8');
}

async function main(): Promise<void> {
  const apiKey = readApiKey();

  console.log('Google Fonts Developer API からフォント一覧を取得しています...');
  const items = await fetchWebfonts(apiKey);

  const catalog = buildCatalog(items, new Date().toISOString());
  await writeCatalog(catalog);

  const japaneseCount = catalog.fonts.filter((font) => font.subsets.includes('japanese')).length;
  const variableCount = catalog.fonts.filter((font) => font.axes !== undefined).length;

  console.log(`data/google-fonts.json を更新しました。`);
  console.log(`  総フォント数    : ${catalog.fonts.length}`);
  console.log(`  日本語対応      : ${japaneseCount}`);
  console.log(`  可変フォント    : ${variableCount}`);
  console.log(`  generatedAt     : ${catalog.generatedAt}`);
}

/** 直接実行されたときだけ同期を走らせる（他スクリプトから import しても副作用が無いように）。 */
const entryPoint = process.argv[1] === undefined ? '' : resolve(process.argv[1]);
const isDirectRun = entryPoint === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch(reportFailure);
}

function reportFailure(error: unknown): void {
  if (error instanceof SyncError) {
    console.error(`\n[fonts:sync] ${error.message}`);
    if (error.cause !== undefined) {
      console.error(error.cause);
    }
  } else {
    console.error('\n[fonts:sync] 予期しないエラーが発生しました。');
    console.error(error);
  }
  process.exitCode = 1;
}
