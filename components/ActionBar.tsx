import styles from './ActionBar.module.css';

/** 実行中の処理。null なら待機中。 */
export type BusyKind = 'apply' | 'release' | 'scan' | null;

type ActionBarProps = {
  busy: BusyKind;
  applyDisabled: boolean;
  releaseDisabled: boolean;
  rescanDisabled: boolean;
  onApply: () => void;
  onRelease: () => void;
  onRescan: () => void;
};

const BUSY_LABELS: Record<Exclude<BusyKind, null>, string> = {
  apply: 'フォントを適用しています…',
  release: '適用を解除しています…',
  scan: 'ページを解析しています…',
};

export function ActionBar({
  busy,
  applyDisabled,
  releaseDisabled,
  rescanDisabled,
  onApply,
  onRelease,
  onRescan,
}: ActionBarProps) {
  return (
    <>
      {busy !== null && (
        <p className={styles.status} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          {BUSY_LABELS[busy]}
        </p>
      )}
      <div className={styles.bar}>
        <button
          type="button"
          className={`${styles.button} ${styles.primary}`}
          disabled={applyDisabled}
          onClick={onApply}
        >
          {busy === 'apply' ? '適用中…' : '適用'}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.secondary} ${styles.destructive}`}
          disabled={releaseDisabled}
          onClick={onRelease}
        >
          解除
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.secondary}`}
          disabled={rescanDisabled}
          onClick={onRescan}
        >
          再スキャン
        </button>
      </div>
    </>
  );
}
