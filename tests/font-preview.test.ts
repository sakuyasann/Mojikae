import { describe, expect, it } from 'vitest';
import { PREVIEW_FAMILY_LIMIT, buildPreviewCssUrl, previewFontFamily } from '../lib/font-preview';

describe('buildPreviewCssUrl', () => {
  it('描画に必要な文字だけを text= で要求する', () => {
    const url = buildPreviewCssUrl(['Inter']);
    expect(url).toContain('family=Inter');
    expect(url).toContain('text=');
    // "Inter" に含まれる文字を重複除去してコードポイント順に並べたもの
    expect(url).toContain(`text=${encodeURIComponent('Ienrt')}`);
  });

  it('複数フォントを 1 リクエストへまとめる', () => {
    const url = buildPreviewCssUrl(['Inter', 'Roboto']) ?? '';
    expect(url.match(/family=/g)).toHaveLength(2);
    expect(url).toContain('family=Inter');
    expect(url).toContain('family=Roboto');
  });

  it('family を昇順に並べて安定した URL にする', () => {
    expect(buildPreviewCssUrl(['Roboto', 'Inter'])).toBe(buildPreviewCssUrl(['Inter', 'Roboto']));
  });

  it('重複を除く', () => {
    const url = buildPreviewCssUrl(['Inter', 'Inter']) ?? '';
    expect(url.match(/family=/g)).toHaveLength(1);
  });

  it('空白を + へ変換する', () => {
    expect(buildPreviewCssUrl(['Noto Sans JP'])).toContain('family=Noto+Sans+JP');
  });

  it('読み込み数に上限をかける', () => {
    const many = Array.from({ length: PREVIEW_FAMILY_LIMIT + 20 }, (_, i) => `Font${i}`);
    const url = buildPreviewCssUrl(many) ?? '';
    expect(url.match(/family=/g)).toHaveLength(PREVIEW_FAMILY_LIMIT);
  });

  it('対象が無ければ null', () => {
    expect(buildPreviewCssUrl([])).toBeNull();
  });

  it('API キーを含まない', () => {
    expect(buildPreviewCssUrl(['Inter'])).not.toContain('key=');
  });
});

describe('previewFontFamily', () => {
  it('カテゴリに応じた総称ファミリーを添える', () => {
    expect(previewFontFamily('Inter', 'sans-serif')).toBe('"Inter", sans-serif');
    expect(previewFontFamily('Playfair Display', 'serif')).toBe('"Playfair Display", serif');
    expect(previewFontFamily('Roboto Mono', 'monospace')).toBe('"Roboto Mono", monospace');
    expect(previewFontFamily('Caveat', 'handwriting')).toBe('"Caveat", cursive');
  });
});
