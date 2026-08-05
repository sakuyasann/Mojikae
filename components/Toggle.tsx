import styles from './Toggle.module.css';

type ToggleProps = {
  checked: boolean;
  disabled?: boolean;
  /** スクリーンリーダー向けのラベル。 */
  label: string;
  onChange: (next: boolean) => void;
};

/**
 * iOS / macOS 標準のスイッチ。
 * `role="switch"` + `aria-checked` でキーボード・支援技術から操作できる。
 * 状態は色に加えて「つまみの位置」でも示す。
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
      <span className={styles.knob} />
    </button>
  );
}
