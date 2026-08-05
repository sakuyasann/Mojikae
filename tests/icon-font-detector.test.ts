import { describe, expect, it } from 'vitest';
import { isIconFontName, isPossibleIconFont } from '../lib/icon-font-detector';

describe('isIconFontName', () => {
  it.each([
    'Material Icons',
    'Material Symbols Rounded',
    'Font Awesome 6 Free',
    'FontAwesome',
    'Glyphicons Halflings',
    'Ionicons',
    'lucide',
    'Phosphor',
    'remixicon',
    'bootstrap-icons',
    'icomoon',
    'iconfont',
    'simple-line-icons',
  ])('%s をアイコンフォントとして判定する', (name) => {
    expect(isIconFontName(name)).toBe(true);
  });

  it.each(['Inter', 'Noto Sans JP', 'Silicon', 'Roboto', 'Helvetica Neue', 'SFMono-Regular'])(
    '%s は通常のフォントとして扱う',
    (name) => {
      expect(isIconFontName(name)).toBe(false);
    },
  );
});

describe('isPossibleIconFont', () => {
  it('名前がアイコンフォントらしければ PUA が無くても true', () => {
    expect(
      isPossibleIconFont({
        primaryFamily: 'Material Symbols Rounded',
        fontFamily: '"Material Symbols Rounded"',
        elementCount: 12,
        puaElementCount: 0,
      }),
    ).toBe(true);
  });

  it('PUA 文字を多く含む要素で使われていれば true', () => {
    expect(
      isPossibleIconFont({
        primaryFamily: 'MyGlyphs',
        fontFamily: 'MyGlyphs',
        elementCount: 10,
        puaElementCount: 8,
      }),
    ).toBe(true);
  });

  it('PUA がわずかなら false', () => {
    expect(
      isPossibleIconFont({
        primaryFamily: 'Inter',
        fontFamily: 'Inter, sans-serif',
        elementCount: 400,
        puaElementCount: 3,
      }),
    ).toBe(false);
  });

  it('要素数 0 でも例外にならない', () => {
    expect(
      isPossibleIconFont({ primaryFamily: 'Inter', fontFamily: 'Inter', elementCount: 0, puaElementCount: 0 }),
    ).toBe(false);
  });
});
