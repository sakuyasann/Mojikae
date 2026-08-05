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
      <h1 className={styles.title}>Mojikae</h1>
      <div className={styles.right}>
        <span className={styles.stateText}>{applied ? '適用中' : '未適用'}</span>
        <Toggle checked={applied} disabled={disabled} label="フォントの適用" onChange={onToggle} />
      </div>
    </header>
  );
}
