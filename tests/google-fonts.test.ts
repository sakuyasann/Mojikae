import { describe, expect, it } from 'vitest';
import { mergeRecentFonts, searchFonts } from '../lib/google-fonts';
import type { GoogleFont } from '../types/google-font';

const font = (family: string, subsets: string[] = ['latin']): GoogleFont => ({
  family,
  category: 'sans-serif',
  subsets,
  variants: ['regular'],
});

const CATALOG: GoogleFont[] = [
  font('Roboto'),
  font('Noto Sans JP', ['japanese', 'latin']),
  font('Robot Crush'),
  font('IBM Plex Sans JP', ['japanese', 'latin']),
  font('Inter'),
];

describe('searchFonts', () => {
  it('大文字小文字を区別せず部分一致で絞り込む', () => {
    const result = searchFonts(CATALOG, 'rob').map((item) => item.font.family);
    expect(result).toContain('Roboto');
    expect(result).toContain('Robot Crush');
    expect(result).not.toContain('Inter');
  });

  it('日本語対応フォントを優先して並べる', () => {
    const result = searchFonts(CATALOG, 's').map((item) => item.font.family);
    expect(result.slice(0, 2)).toEqual(['IBM Plex Sans JP', 'Noto Sans JP']);
  });

  it('日本語対応フォントへ isJapanese を立てる', () => {
    const result = searchFonts(CATALOG, 'Noto');
    expect(result[0]?.isJapanese).toBe(true);
  });

  it('前方一致を部分一致より優先する', () => {
    const result = searchFonts(CATALOG, 'plex').map((item) => item.font.family);
    expect(result).toEqual(['IBM Plex Sans JP']);
  });

  it('表示件数を制限する', () => {
    expect(searchFonts(CATALOG, '', 2)).toHaveLength(2);
  });

  it('空クエリでは全件を対象にする', () => {
    expect(searchFonts(CATALOG, '', 100)).toHaveLength(CATALOG.length);
  });
});

describe('mergeRecentFonts', () => {
  it('新しい順で先頭へ入る', () => {
    expect(mergeRecentFonts(['A', 'B'], 'C')).toEqual(['C', 'A', 'B']);
  });

  it('重複を作らず先頭へ移動する', () => {
    expect(mergeRecentFonts(['A', 'B', 'C'], 'C')).toEqual(['C', 'A', 'B']);
  });

  it('最大 5 件に切り詰める', () => {
    expect(mergeRecentFonts(['A', 'B', 'C', 'D', 'E'], 'F')).toEqual(['F', 'A', 'B', 'C', 'D']);
  });
});
