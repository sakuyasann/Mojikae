import styles from './RecentFonts.module.css';

type RecentFontsProps = {
  /** 最近使用したフォント名（新しい順・重複なし・最大 5 件）。 */
  families: string[];
  /** 選択済みフォントのファミリー名。 */
  selectedFamilies: ReadonlySet<string>;
  disabled: boolean;
  /** クリックで選択・解除を切り替える。 */
  onSelect: (family: string) => void;
  className?: string;
};

/**
 * 最近使用した Google Fonts。
 * 保存しているのはフォント名だけで、サイト・タブ・適用対象・適用状態は保存しない。
 */
export function RecentFonts({ families, selectedFamilies, disabled, onSelect, className }: RecentFontsProps) {
  return (
    <section className={`${styles.wrapper} ${className ?? ''}`} aria-labelledby="recent-fonts-label">
      <h2 className={styles.label} id="recent-fonts-label">
        最近使用したフォント
      </h2>
      {families.length === 0 ? (
        <p className={styles.empty}>まだありません</p>
      ) : (
        <ul className={styles.list}>
          {families.map((family) => {
            const isSelected = selectedFamilies.has(family);
            return (
              <li key={family}>
                <button
                  type="button"
                  className={`${styles.chip} ${isSelected ? styles.chipSelected : ''}`}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelect(family);
                  }}
                >
                  {family}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
