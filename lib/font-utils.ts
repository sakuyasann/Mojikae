/**
 * font-family 文字列のパース・正規化ユーティリティ。
 *
 * `getComputedStyle().fontFamily` の返す文字列はブラウザによって引用符やスペースの
 * 付き方が微妙に異なるため、グループ化の前に正規形へ揃える。
 */

/** 引用してはいけない CSS の総称ファミリー / システムキーワード。 */
const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
]);

/** 引用符なしでそのまま書ける単純な識別子か。 */
const SIMPLE_IDENT = /^-?[A-Za-z_][A-Za-z0-9_-]*$/;

/**
 * `"Inter", "Helvetica Neue", Arial, sans-serif` のような font-family 値を
 * 個々のファミリー名へ分解する。引用符とエスケープを解決し、内部の連続空白は 1 つへ潰す。
 */
export function parseFontFamilyList(value: string): string[] {
  const families: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (quote !== null) {
      if (char === '\\' && i + 1 < value.length) {
        i += 1;
        current += value[i];
        continue;
      }
      if (char === quote) {
        quote = null;
        continue;
      }
      current += char;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ',') {
      families.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  families.push(current);

  return families.map((family) => family.trim().replace(/\s+/g, ' ')).filter((family) => family.length > 0);
}

/** CSS の font-family 値として安全な形へ引用する。総称ファミリーは引用しない。 */
export function quoteFontFamily(name: string): string {
  if (GENERIC_FAMILIES.has(name.toLowerCase())) {
    return name.toLowerCase();
  }
  if (SIMPLE_IDENT.test(name)) {
    return name;
  }
  return `"${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * font-family 値を正規形へ揃える。
 * 例: `Inter ,  "Helvetica Neue",Arial , sans-serif` → `Inter, "Helvetica Neue", Arial, sans-serif`
 */
export function normalizeFontFamily(value: string): string {
  return parseFontFamilyList(value).map(quoteFontFamily).join(', ');
}

/**
 * 表示用のフォント名。font-family の先頭に指定されたファミリー名を引用符なしで返す。
 * 例: `"Inter", "Helvetica Neue", Arial, sans-serif` → `Inter`
 */
export function extractPrimaryFamily(value: string): string {
  const [first] = parseFontFamilyList(value);
  return first ?? '';
}

/**
 * 正規化済み font-family から決定的なグループ ID を作る（FNV-1a 32bit）。
 * 再スキャンしても同じ font-family なら同じ ID になるので、ポップアップを開き直しても
 * 選択状態を復元できる。
 */
export function fontFamilyGroupId(normalizedFontFamily: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalizedFontFamily.length; i += 1) {
    hash ^= normalizedFontFamily.charCodeAt(i);
    // FNV prime (16777619) の乗算を 32bit で行う
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `g-${hash.toString(16).padStart(8, '0')}`;
}

/** Google Font のカテゴリに応じたフォールバックの総称ファミリー。 */
export function fallbackGenericFamily(category: string): string {
  if (category === 'serif') return 'serif';
  if (category === 'monospace') return 'monospace';
  if (category === 'handwriting') return 'cursive';
  return 'sans-serif';
}

/** 適用時に使う font-family 値（Google Font + 総称フォールバック）を組み立てる。 */
export function buildAppliedFontFamilyValue(family: string, category: string): string {
  return `${quoteFontFamily(family)}, ${fallbackGenericFamily(category)}`;
}
