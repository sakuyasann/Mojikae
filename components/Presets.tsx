import { useState, type KeyboardEvent } from 'react';
import { buildDefaultPresetName } from '../lib/presets';
import { PRESET_LIMIT, PRESET_NAME_MAX_LENGTH, type FontPreset } from '../types/preset';
import styles from './Presets.module.css';

type PresetsProps = {
  presets: FontPreset[];
  /** いま選択中のフォント名の並び。保存対象。 */
  currentFontFamilies: string[];
  disabled: boolean;
  onSave: (name: string) => void;
  onApply: (preset: FontPreset) => void;
  onDelete: (id: string) => void;
};

/**
 * フォントの組み合わせのプリセット。
 *
 * 保存するのはプリセット名とフォント名の並びだけで、
 * サイト情報・タブ情報・適用状態は保存しない。
 */
export function Presets({
  presets,
  currentFontFamilies,
  disabled,
  onSave,
  onApply,
  onDelete,
}: PresetsProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const canSave = !disabled && currentFontFamilies.length > 0 && presets.length < PRESET_LIMIT;

  const startEditing = () => {
    setName(buildDefaultPresetName(currentFontFamilies));
    setEditing(true);
  };

  const commit = () => {
    onSave(name);
    setEditing(false);
    setName('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === 'Escape') {
      // ポップアップ自体が閉じないよう止める
      event.preventDefault();
      event.stopPropagation();
      setEditing(false);
    }
  };

  return (
    <section className={styles.wrapper} aria-labelledby="presets-label">
      <div className={styles.head}>
        <h2 className={styles.label} id="presets-label">
          プリセット
        </h2>
        {!editing && (
          <button
            type="button"
            className={styles.save}
            disabled={!canSave}
            title={
              presets.length >= PRESET_LIMIT
                ? `保存できるのは ${PRESET_LIMIT} 件までです`
                : '選択中の組み合わせを保存します'
            }
            onClick={startEditing}
          >
            + 現在の組み合わせを保存
          </button>
        )}
      </div>

      {editing ? (
        <div className={styles.form}>
          {/* 保存を押した直後なので、そのまま名前を打てるようフォーカスを移す */}
          <input
            type="text"
            className={styles.input}
            value={name}
            autoFocus
            maxLength={PRESET_NAME_MAX_LENGTH}
            aria-label="プリセット名"
            placeholder={buildDefaultPresetName(currentFontFamilies)}
            onChange={(event) => {
              setName(event.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className={`${styles.formButton} ${styles.confirm}`} onClick={commit}>
            保存
          </button>
          <button
            type="button"
            className={`${styles.formButton} ${styles.cancel}`}
            onClick={() => {
              setEditing(false);
            }}
          >
            キャンセル
          </button>
        </div>
      ) : presets.length === 0 ? (
        <p className={styles.empty}>
          {currentFontFamilies.length === 0
            ? 'フォントを選ぶと組み合わせを保存できます'
            : 'まだありません'}
        </p>
      ) : (
        <ul className={styles.list}>
          {presets.map((preset) => (
            <li key={preset.id} className={styles.item}>
              <button
                type="button"
                className={styles.apply}
                disabled={disabled}
                title={preset.fontFamilies.join(' → ')}
                onClick={() => {
                  onApply(preset);
                }}
              >
                {preset.name}
                <span className={styles.count}>{preset.fontFamilies.length}</span>
              </button>
              <button
                type="button"
                className={styles.remove}
                disabled={disabled}
                aria-label={`${preset.name} を削除`}
                onClick={() => {
                  onDelete(preset.id);
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
