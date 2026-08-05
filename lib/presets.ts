import { browser } from 'wxt/browser';
import { PRESET_LIMIT, PRESET_NAME_MAX_LENGTH, type FontPreset } from '../types/preset';

/**
 * フォントの組み合わせのプリセット。`browser.storage.local` に保存する。
 *
 * 保存対象はプリセット名とフォント名の並びだけで、
 * サイト情報・タブ情報・適用対象・適用状態は保存しない。
 */

const PRESETS_KEY = 'fontPresets';

/** 壊れた値が入っていても落ちないように、読み出し時に検証する。 */
function isFontPreset(value: unknown): value is FontPreset {
  if (typeof value !== 'object' || value === null) return false;
  const preset = value as Partial<FontPreset>;
  return (
    typeof preset.id === 'string' &&
    typeof preset.name === 'string' &&
    typeof preset.createdAt === 'string' &&
    Array.isArray(preset.fontFamilies) &&
    preset.fontFamilies.every((family) => typeof family === 'string')
  );
}

export async function loadPresets(): Promise<FontPreset[]> {
  const stored = await browser.storage.local.get(PRESETS_KEY);
  const value: unknown = stored[PRESETS_KEY];
  if (!Array.isArray(value)) return [];
  return value.filter(isFontPreset).slice(0, PRESET_LIMIT);
}

async function writePresets(presets: FontPreset[]): Promise<FontPreset[]> {
  const limited = presets.slice(0, PRESET_LIMIT);
  await browser.storage.local.set({ [PRESETS_KEY]: limited });
  return limited;
}

/** 空欄なら組み合わせから自動で名前を作る。長すぎる入力は切り詰める。 */
export function normalizePresetName(name: string, fontFamilies: readonly string[]): string {
  const trimmed = name.trim();
  if (trimmed !== '') return trimmed.slice(0, PRESET_NAME_MAX_LENGTH);
  return buildDefaultPresetName(fontFamilies);
}

/** 組み合わせから作る既定の名前。例: `Playfair Display + Zen Maru Gothic` */
export function buildDefaultPresetName(fontFamilies: readonly string[]): string {
  if (fontFamilies.length === 0) return '名称未設定';
  const shown = fontFamilies.slice(0, 2).join(' + ');
  const rest = fontFamilies.length - 2;
  const name = rest > 0 ? `${shown} ほか${rest}` : shown;
  return name.slice(0, PRESET_NAME_MAX_LENGTH);
}

/**
 * 追加する。同じ組み合わせが既にあれば名前を更新して先頭へ移す
 * （同じ内容のプリセットが増え続けないようにするため）。
 */
export function mergePreset(current: FontPreset[], preset: FontPreset): FontPreset[] {
  const sameCombination = (entry: FontPreset) =>
    entry.fontFamilies.length === preset.fontFamilies.length &&
    entry.fontFamilies.every((family, index) => family === preset.fontFamilies[index]);

  return [preset, ...current.filter((entry) => !sameCombination(entry))].slice(0, PRESET_LIMIT);
}

export async function savePreset(name: string, fontFamilies: string[]): Promise<FontPreset[]> {
  if (fontFamilies.length === 0) {
    throw new Error('フォントが選択されていません');
  }
  const preset: FontPreset = {
    id: crypto.randomUUID(),
    name: normalizePresetName(name, fontFamilies),
    fontFamilies: [...fontFamilies],
    createdAt: new Date().toISOString(),
  };
  return writePresets(mergePreset(await loadPresets(), preset));
}

export async function deletePreset(id: string): Promise<FontPreset[]> {
  const current = await loadPresets();
  return writePresets(current.filter((preset) => preset.id !== id));
}
