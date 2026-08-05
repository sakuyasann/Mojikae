import styles from './ErrorMessage.module.css';

type ErrorMessageProps = {
  message: string;
  /** ページ自体が操作できない場合など、閉じても意味がないエラー。 */
  blocking?: boolean;
  onDismiss?: () => void;
};

export function ErrorMessage({ message, blocking = false, onDismiss }: ErrorMessageProps) {
  return (
    <p className={`${styles.message} ${blocking ? styles.blocking : ''}`} role="alert">
      <span className={styles.mark} aria-hidden="true">
        !
      </span>
      <span className={styles.text}>{message}</span>
      {!blocking && onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          閉じる
        </button>
      )}
    </p>
  );
}
