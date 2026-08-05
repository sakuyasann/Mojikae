import { Logo } from './Logo';
import { Toggle } from './Toggle';
import styles from './Header.module.css';

type HeaderProps = {
  /** 現在のページへフォントが適用されているか。 */
  applied: boolean;
  disabled: boolean;
  onToggle: (next: boolean) => void;
};

export function Header({ applied, disabled, onToggle }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>
          <Logo size={20} />
        </h1>
        <span className={`${styles.state} ${applied ? styles.stateOn : ''}`}>
          {applied ? 'このページに適用中' : '未適用'}
        </span>
      </div>
      <Toggle checked={applied} disabled={disabled} label="フォントの適用" onChange={onToggle} />
    </header>
  );
}
