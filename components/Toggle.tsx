import styles from './Toggle.module.css';

type ToggleProps = {
  checked: boolean;
  disabled?: boolean;
  /** スクリーンリーダー向けのラベル。 */
  label: string;
  onChange: (next: boolean) => void;
};

/**
 * 適用状態の ON/OFF スイッチ。
 * `role="switch"` + `aria-checked` でキーボード・支援技術から操作できる。
 * 状態は色だけでなく、つまみの位置と "ON"/"OFF" のテキストでも示す。
 */
export function Toggle({ checked, disabled = false, label, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => {
        onChange(!checked);
      }}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      <span className={styles.label}>{checked ? 'ON' : 'OFF'}</span>
    </button>
  );
}
