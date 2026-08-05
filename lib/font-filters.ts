import type { GoogleFont, GoogleFontCategory } from '../types/google-font';

/**
 * 検索結果の絞り込み（言語サブセット / 種類）。
 *
 * カタログには 181 種類のサブセットがあるが、実際に選ぶ対象になるものは限られる。
 * ここでは用途に合うものだけを、日本語のフォント選定で使う頻度の高い順に並べている。
 */

/** 絞り込みに出す言語サブセット。この順で表示する。 */
export const FILTERABLE_SUBSETS: { value: string; label: string }[] = [
  { value: 'japanese', label: '日本語' },
  { value: 'latin', label: 'ラテン（英数字）' },
  { value: 'latin-ext', label: 'ラテン拡張' },
  { value: 'korean', label: '韓国語' },
  { value: 'chinese-simplified', label: '中国語（簡体）' },
  { value: 'chinese-traditional', label: '中国語（繁体）' },
  { value: 'cyrillic', label: 'キリル' },
  { value: 'greek', label: 'ギリシャ' },
  { value: 'arabic', label: 'アラビア' },
  { value: 'hebrew', label: 'ヘブライ' },
  { value: 'devanagari', label: 'デーヴァナーガリー' },
  { value: 'thai', label: 'タイ' },
  { value: 'vietnamese', label: 'ベトナム語' },
];

export const CATEGORY_LABELS: Record<GoogleFontCategory, string> = {
  'sans-serif': 'サンセリフ',
  serif: 'セリフ',
  display: 'ディスプレイ',
  handwriting: '手書き',
  monospace: '等幅',
};

/** 表示順。使う頻度の高いものを先に。 */
const CATEGORY_ORDER: GoogleFontCategory[] = [
  'sans-serif',
  'serif',
  'monospace',
  'display',
  'handwriting',
];

export type FontFilter = {
  /** 言語サブセット。null は絞り込みなし。 */
  subset: string | null;
  category: GoogleFontCategory | null;
};

export const EMPTY_FILTER: FontFilter = { subset: null, category: null };

export function isFilterActive(filter: FontFilter): boolean {
  return filter.subset !== null || filter.category !== null;
}

export function matchesFilter(font: GoogleFont, filter: FontFilter): boolean {
  if (filter.subset !== null && !font.subsets.includes(filter.subset)) return false;
  if (filter.category !== null && font.category !== filter.category) return false;
  return true;
}

export type FilterOption = { value: string; label: string; count: number };

/**
 * 選択肢と該当件数。
 * 件数はもう一方の絞り込みを適用した状態で数えるので、
 * 「日本語 × セリフ」のように組み合わせたときも実際の件数が出る。
 */
export function subsetOptions(fonts: GoogleFont[], filter: FontFilter): FilterOption[] {
  const narrowed = fonts.filter((font) => filter.category === null || font.category === filter.category);
  return FILTERABLE_SUBSETS.map(({ value, label }) => ({
    value,
    label,
    count: narrowed.reduce((total, font) => (font.subsets.includes(value) ? total + 1 : total), 0),
  })).filter((option) => option.count > 0);
}

export function categoryOptions(fonts: GoogleFont[], filter: FontFilter): FilterOption[] {
  const narrowed = fonts.filter((font) => filter.subset === null || font.subsets.includes(filter.subset));
  return CATEGORY_ORDER.map((value) => ({
    value,
    label: CATEGORY_LABELS[value],
    count: narrowed.reduce((total, font) => (font.category === value ? total + 1 : total), 0),
  })).filter((option) => option.count > 0);
}
