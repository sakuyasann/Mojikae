import { describe, expect, it } from 'vitest';
import { buildFamilyQueryValue, buildGoogleFontsCssUrl, encodeFamilyName } from '../lib/google-fonts-url';
import type { GoogleFont } from '../types/google-font';

const base: GoogleFont = {
  family: 'Test Font',
  category: 'sans-serif',
  subsets: ['latin'],
  variants: ['regular'],
};

describe('encodeFamilyName', () => {
  it('空白を + へ変換する', () => {
    expect(encodeFamilyName('IBM Plex Sans JP')).toBe('IBM+Plex+Sans+JP');
  });

  it('記号を URI エンコードする', () => {
    expect(encodeFamilyName('Kumar One Outline')).toBe('Kumar+One+Outline');
  });
});

describe('buildFamilyQueryValue', () => {
  it('静的フォントは 400/500/600/700 のうち存在するものだけを指定する', () => {
    const font: GoogleFont = {
      ...base,
      family: 'IBM Plex Sans JP',
      variants: ['100', '200', '300', 'regular', '500', '600', '700'],
    };
    expect(buildFamilyQueryValue(font)).toBe('IBM+Plex+Sans+JP:wght@400;500;600;700');
  });

  it('存在しないウェイトは指定しない', () => {
    const font: GoogleFont = { ...base, family: 'Inter', variants: ['regular', '700'] };
    expect(buildFamilyQueryValue(font)).toBe('Inter:wght@400;700');
  });

  it('斜体は対象外にする', () => {
    const font: GoogleFont = { ...base, family: 'Inter', variants: ['regular', 'italic', '700italic'] };
    expect(buildFamilyQueryValue(font)).toBe('Inter');
  });

  it('400 のみのフォントは軸指定を付けない', () => {
    expect(buildFamilyQueryValue({ ...base, family: 'Lobster' })).toBe('Lobster');
  });

  it('400/500/600/700 が無いフォントは持っているウェイトを使う', () => {
    const font: GoogleFont = { ...base, family: 'Thin Only', variants: ['300', '800'] };
    expect(buildFamilyQueryValue(font)).toBe('Thin+Only:wght@300;800');
  });

  it('可変フォントで wght 軸があれば range 指定にする', () => {
    const font: GoogleFont = {
      ...base,
      family: 'Roboto',
      variants: ['100', 'regular', '900'],
      axes: [
        { tag: 'wdth', start: 75, end: 100 },
        { tag: 'wght', start: 100, end: 900 },
      ],
    };
    expect(buildFamilyQueryValue(font)).toBe('Roboto:wght@100..900');
  });

  it('wght 軸の範囲が 1 点なら単一値にする', () => {
    const font: GoogleFont = {
      ...base,
      family: 'Fixed VF',
      axes: [{ tag: 'wght', start: 400, end: 400 }],
    };
    expect(buildFamilyQueryValue(font)).toBe('Fixed+VF:wght@400');
  });

  it('wght 以外の軸しか無い可変フォントは静的ウェイトとして扱う', () => {
    const font: GoogleFont = {
      ...base,
      family: 'Optical Only',
      variants: ['regular', '700'],
      axes: [{ tag: 'opsz', start: 8, end: 144 }],
    };
    expect(buildFamilyQueryValue(font)).toBe('Optical+Only:wght@400;700');
  });
});

describe('buildGoogleFontsCssUrl', () => {
  it('CSS API v2 の URL を組み立てる', () => {
    const font: GoogleFont = {
      ...base,
      family: 'IBM Plex Sans JP',
      variants: ['regular', '500', '600', '700'],
    };
    expect(buildGoogleFontsCssUrl([font])).toBe(
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;500;600;700&display=swap',
    );
  });

  it('API キーを含まない', () => {
    expect(buildGoogleFontsCssUrl([base])).not.toContain('key=');
  });

  it('複数フォントを 1 リクエストへまとめ、family を昇順に並べる', () => {
    const inter: GoogleFont = { ...base, family: 'Inter', variants: ['regular', '700'] };
    const noto: GoogleFont = { ...base, family: 'Noto Sans JP', variants: ['regular'] };
    expect(buildGoogleFontsCssUrl([noto, inter])).toBe(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Noto+Sans+JP&display=swap',
    );
  });
});
