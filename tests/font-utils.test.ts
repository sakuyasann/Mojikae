import { describe, expect, it } from 'vitest';
import {
  buildAppliedFontFamilyValue,
  extractPrimaryFamily,
  fontFamilyGroupId,
  normalizeFontFamily,
  parseFontFamilyList,
  quoteFontFamily,
} from '../lib/font-utils';

describe('parseFontFamilyList', () => {
  it('引用符と空白を解決して分解する', () => {
    expect(parseFontFamilyList('Inter ,  "Helvetica Neue",Arial , sans-serif')).toEqual([
      'Inter',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ]);
  });

  it('シングルクォートも扱える', () => {
    expect(parseFontFamilyList("'Noto Sans JP', sans-serif")).toEqual(['Noto Sans JP', 'sans-serif']);
  });

  it('引用符の中のカンマで分割しない', () => {
    expect(parseFontFamilyList('"Foo, Bar", serif')).toEqual(['Foo, Bar', 'serif']);
  });

  it('空要素を落とす', () => {
    expect(parseFontFamilyList('Inter, , serif')).toEqual(['Inter', 'serif']);
  });
});

describe('quoteFontFamily', () => {
  it('総称ファミリーは引用しない', () => {
    expect(quoteFontFamily('sans-serif')).toBe('sans-serif');
    expect(quoteFontFamily('monospace')).toBe('monospace');
  });

  it('単純な識別子は引用しない', () => {
    expect(quoteFontFamily('Inter')).toBe('Inter');
  });

  it('空白を含む名前は引用する', () => {
    expect(quoteFontFamily('Helvetica Neue')).toBe('"Helvetica Neue"');
  });

  it('引用符を含む名前をエスケープする', () => {
    expect(quoteFontFamily('a"b')).toBe('"a\\"b"');
  });
});

describe('normalizeFontFamily', () => {
  it('ブラウザ差のある表記を同じ正規形へ揃える', () => {
    const chromeStyle = 'Inter, "Helvetica Neue", Arial, sans-serif';
    const quotedStyle = '"Inter", \'Helvetica Neue\', "Arial", sans-serif';
    expect(normalizeFontFamily(chromeStyle)).toBe(normalizeFontFamily(quotedStyle));
    expect(normalizeFontFamily(chromeStyle)).toBe('Inter, "Helvetica Neue", Arial, sans-serif');
  });
});

describe('extractPrimaryFamily', () => {
  it('先頭のフォント名を引用符なしで返す', () => {
    expect(extractPrimaryFamily('"Inter", "Helvetica Neue", Arial, sans-serif')).toBe('Inter');
    expect(extractPrimaryFamily('"Material Symbols Rounded"')).toBe('Material Symbols Rounded');
  });
});

describe('fontFamilyGroupId', () => {
  it('同じ font-family なら同じ ID になる', () => {
    expect(fontFamilyGroupId('Inter, sans-serif')).toBe(fontFamilyGroupId('Inter, sans-serif'));
  });

  it('違う font-family なら違う ID になる', () => {
    expect(fontFamilyGroupId('Inter, sans-serif')).not.toBe(fontFamilyGroupId('Roboto, sans-serif'));
  });

  it('CSS の属性セレクタで使える文字だけになる', () => {
    expect(fontFamilyGroupId('"Foo Bar", serif')).toMatch(/^g-[0-9a-f]{8}$/);
  });
});

describe('buildAppliedFontFamilyValue', () => {
  it('カテゴリに応じた総称ファミリーを付ける', () => {
    expect(buildAppliedFontFamilyValue([{ family: 'IBM Plex Sans JP', category: 'sans-serif' }])).toBe(
      '"IBM Plex Sans JP", sans-serif',
    );
    expect(buildAppliedFontFamilyValue([{ family: 'Noto Serif JP', category: 'serif' }])).toBe(
      '"Noto Serif JP", serif',
    );
    expect(buildAppliedFontFamilyValue([{ family: 'Roboto Mono', category: 'monospace' }])).toBe(
      '"Roboto Mono", monospace',
    );
    expect(buildAppliedFontFamilyValue([{ family: 'Caveat', category: 'handwriting' }])).toBe(
      'Caveat, cursive',
    );
  });

  it('複数フォントを指定順に並べる（英字→日本語の使い分け）', () => {
    expect(
      buildAppliedFontFamilyValue([
        { family: 'Inter', category: 'sans-serif' },
        { family: 'Noto Sans JP', category: 'sans-serif' },
      ]),
    ).toBe('Inter, "Noto Sans JP", sans-serif');
  });

  it('総称ファミリーは先頭フォントのカテゴリから決める', () => {
    expect(
      buildAppliedFontFamilyValue([
        { family: 'Playfair Display', category: 'serif' },
        { family: 'Noto Sans JP', category: 'sans-serif' },
      ]),
    ).toBe('"Playfair Display", "Noto Sans JP", serif');
  });

  it('空配列なら空文字を返す', () => {
    expect(buildAppliedFontFamilyValue([])).toBe('');
  });
});
