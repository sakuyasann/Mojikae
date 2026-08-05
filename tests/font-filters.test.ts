import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTER,
  categoryOptions,
  isFilterActive,
  matchesFilter,
  subsetOptions,
} from '../lib/font-filters';
import type { GoogleFont, GoogleFontCategory } from '../types/google-font';

const font = (family: string, category: GoogleFontCategory, subsets: string[]): GoogleFont => ({
  family,
  category,
  subsets,
  variants: ['regular'],
});

const CATALOG: GoogleFont[] = [
  font('Noto Sans JP', 'sans-serif', ['japanese', 'latin']),
  font('Noto Serif JP', 'serif', ['japanese', 'latin']),
  font('BIZ UDMincho', 'serif', ['japanese', 'latin']),
  font('Inter', 'sans-serif', ['latin', 'latin-ext']),
  font('Roboto Mono', 'monospace', ['latin', 'cyrillic']),
  font('Lobster', 'display', ['latin']),
];

describe('matchesFilter', () => {
  it('絞り込みなしなら全て通す', () => {
    expect(CATALOG.every((f) => matchesFilter(f, EMPTY_FILTER))).toBe(true);
  });

  it('言語で絞り込む', () => {
    const ja = CATALOG.filter((f) => matchesFilter(f, { subset: 'japanese', category: null }));
    expect(ja.map((f) => f.family)).toEqual(['Noto Sans JP', 'Noto Serif JP', 'BIZ UDMincho']);
  });

  it('種類で絞り込む', () => {
    const serif = CATALOG.filter((f) => matchesFilter(f, { subset: null, category: 'serif' }));
    expect(serif.map((f) => f.family)).toEqual(['Noto Serif JP', 'BIZ UDMincho']);
  });

  it('言語と種類を組み合わせる', () => {
    const jaSerif = CATALOG.filter((f) => matchesFilter(f, { subset: 'japanese', category: 'serif' }));
    expect(jaSerif.map((f) => f.family)).toEqual(['Noto Serif JP', 'BIZ UDMincho']);
  });

  it('該当なしなら空になる', () => {
    const none = CATALOG.filter((f) => matchesFilter(f, { subset: 'japanese', category: 'monospace' }));
    expect(none).toEqual([]);
  });
});

describe('isFilterActive', () => {
  it('どちらも未指定なら false', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
  });

  it('片方でも指定されていれば true', () => {
    expect(isFilterActive({ subset: 'japanese', category: null })).toBe(true);
    expect(isFilterActive({ subset: null, category: 'serif' })).toBe(true);
  });
});

describe('subsetOptions', () => {
  it('該当件数つきで返す', () => {
    const options = subsetOptions(CATALOG, EMPTY_FILTER);
    expect(options.find((o) => o.value === 'japanese')).toMatchObject({ label: '日本語', count: 3 });
    expect(options.find((o) => o.value === 'latin')?.count).toBe(6);
  });

  it('0 件の選択肢は出さない', () => {
    expect(subsetOptions(CATALOG, EMPTY_FILTER).some((o) => o.value === 'korean')).toBe(false);
  });

  it('種類の絞り込みを踏まえて件数を数える', () => {
    const options = subsetOptions(CATALOG, { subset: null, category: 'serif' });
    expect(options.find((o) => o.value === 'japanese')?.count).toBe(2);
  });
});

describe('categoryOptions', () => {
  it('該当件数つきで返す', () => {
    const options = categoryOptions(CATALOG, EMPTY_FILTER);
    expect(options.find((o) => o.value === 'sans-serif')).toMatchObject({ label: 'サンセリフ', count: 2 });
    expect(options.find((o) => o.value === 'serif')?.count).toBe(2);
  });

  it('言語の絞り込みを踏まえて件数を数える', () => {
    const options = categoryOptions(CATALOG, { subset: 'japanese', category: null });
    expect(options.find((o) => o.value === 'sans-serif')?.count).toBe(1);
    expect(options.find((o) => o.value === 'serif')?.count).toBe(2);
    // 日本語の等幅・ディスプレイは無いので選択肢に出ない
    expect(options.some((o) => o.value === 'monospace')).toBe(false);
    expect(options.some((o) => o.value === 'display')).toBe(false);
  });
});
