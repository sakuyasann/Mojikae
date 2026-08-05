import { describe, expect, it } from 'vitest';
import { buildDefaultPresetName, mergePreset, normalizePresetName } from '../lib/presets';
import { PRESET_LIMIT, PRESET_NAME_MAX_LENGTH, type FontPreset } from '../types/preset';

const preset = (id: string, name: string, fontFamilies: string[]): FontPreset => ({
  id,
  name,
  fontFamilies,
  createdAt: '2026-08-05T00:00:00.000Z',
});

describe('buildDefaultPresetName', () => {
  it('1 件ならそのフォント名', () => {
    expect(buildDefaultPresetName(['Inter'])).toBe('Inter');
  });

  it('2 件なら + でつなぐ', () => {
    expect(buildDefaultPresetName(['Playfair Display', 'Zen Maru Gothic'])).toBe(
      'Playfair Display + Zen Maru Gothic',
    );
  });

  it('3 件以上は残り件数を添える', () => {
    expect(buildDefaultPresetName(['Inter', 'Noto Sans JP', 'Roboto', 'Lato'])).toBe(
      'Inter + Noto Sans JP ほか2',
    );
  });

  it('空なら名称未設定', () => {
    expect(buildDefaultPresetName([])).toBe('名称未設定');
  });

  it('長すぎる名前は切り詰める', () => {
    const long = ['A'.repeat(60), 'B'.repeat(60)];
    expect(buildDefaultPresetName(long).length).toBe(PRESET_NAME_MAX_LENGTH);
  });
});

describe('normalizePresetName', () => {
  it('入力があればそれを使う', () => {
    expect(normalizePresetName('  管理画面用  ', ['Inter'])).toBe('管理画面用');
  });

  it('空欄なら組み合わせから自動生成する', () => {
    expect(normalizePresetName('   ', ['Inter', 'Noto Sans JP'])).toBe('Inter + Noto Sans JP');
  });

  it('上限を超える入力は切り詰める', () => {
    expect(normalizePresetName('あ'.repeat(80), ['Inter']).length).toBe(PRESET_NAME_MAX_LENGTH);
  });
});

describe('mergePreset', () => {
  it('先頭へ追加する', () => {
    const current = [preset('1', '既存', ['Inter'])];
    const added = mergePreset(current, preset('2', '新規', ['Roboto']));
    expect(added.map((p) => p.id)).toEqual(['2', '1']);
  });

  it('同じ組み合わせは重複させず先頭へ移す', () => {
    const current = [preset('1', '古い名前', ['Inter', 'Noto Sans JP']), preset('2', '別', ['Roboto'])];
    const added = mergePreset(current, preset('3', '新しい名前', ['Inter', 'Noto Sans JP']));
    expect(added).toHaveLength(2);
    expect(added[0]).toMatchObject({ id: '3', name: '新しい名前' });
    expect(added.some((p) => p.id === '1')).toBe(false);
  });

  it('並び順が違えば別の組み合わせとして扱う', () => {
    const current = [preset('1', 'A', ['Inter', 'Noto Sans JP'])];
    const added = mergePreset(current, preset('2', 'B', ['Noto Sans JP', 'Inter']));
    expect(added).toHaveLength(2);
  });

  it('上限を超えたら古いものから落とす', () => {
    const current = Array.from({ length: PRESET_LIMIT }, (_, i) =>
      preset(String(i), `p${i}`, [`Font${i}`]),
    );
    const added = mergePreset(current, preset('new', '新規', ['NewFont']));
    expect(added).toHaveLength(PRESET_LIMIT);
    expect(added[0]?.id).toBe('new');
    expect(added.some((p) => p.id === String(PRESET_LIMIT - 1))).toBe(false);
  });
});
