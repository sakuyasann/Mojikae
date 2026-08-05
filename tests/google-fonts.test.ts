import { describe, expect, it } from 'vitest';
import { countMatches, isIconFont, mergeRecentFonts, searchFonts } from '../lib/google-fonts';
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
  // Google Fonts Developer API はアイコンフォントも返す
  font('Material Symbols Rounded'),
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

  it('言語で絞り込める', () => {
    const result = searchFonts(CATALOG, '', 100, { subset: 'japanese', category: null });
    expect(result.map((item) => item.font.family)).toEqual(['IBM Plex Sans JP', 'Noto Sans JP']);
  });

  it('種類で絞り込める', () => {
    const result = searchFonts(CATALOG, '', 100, { subset: null, category: 'sans-serif' });
    expect(result).toHaveLength(CATALOG.length);
  });

  it('絞り込みと検索語を併用できる', () => {
    const result = searchFonts(CATALOG, 'noto', 100, { subset: 'japanese', category: null });
    expect(result.map((item) => item.font.family)).toEqual(['Noto Sans JP']);
  });
});

describe('countMatches', () => {
  it('表示件数で切り詰める前の総数を返す', () => {
    expect(countMatches(CATALOG, '')).toBe(CATALOG.length);
  });

  it('絞り込みを反映する', () => {
    expect(countMatches(CATALOG, '', { subset: 'japanese', category: null })).toBe(2);
  });

  it('検索語と絞り込みの両方を反映する', () => {
    expect(countMatches(CATALOG, 'rob', { subset: 'japanese', category: null })).toBe(0);
  });

  it('アイコンフォントは検索結果に残しつつ isIconFont を立てる', () => {
    const result = searchFonts(CATALOG, 'material');
    expect(result).toHaveLength(1);
    expect(result[0]?.font.family).toBe('Material Symbols Rounded');
    expect(result[0]?.isIconFont).toBe(true);
  });

  it('通常のフォントには isIconFont を立てない', () => {
    expect(searchFonts(CATALOG, 'Inter')[0]?.isIconFont).toBe(false);
  });
});

describe('isIconFont', () => {
  it('Material Icons / Symbols 系を判定する', () => {
    expect(isIconFont(font('Material Icons'))).toBe(true);
    expect(isIconFont(font('Material Symbols Outlined'))).toBe(true);
  });

  it('通常のフォントは false', () => {
    expect(isIconFont(font('Noto Sans JP'))).toBe(false);
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
