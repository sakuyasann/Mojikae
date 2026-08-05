import styles from './RecentFonts.module.css';

type RecentFontsProps = {
  /** 最近使用したフォント名（新しい順・重複なし・最大 5 件）。 */
  families: string[];
  selectedFamily: string | null;
  disabled: boolean;
  onSelect: (family: string) => void;
};

/**
 * 最近使用した Google Fonts。
 * 保存しているのはフォント名だけで、サイト・タブ・適用対象・適用状態は保存しない。
 */
export function RecentFonts({ families, selectedFamily, disabled, onSelect }: RecentFontsProps) {
  return (
    <section className={styles.wrapper} aria-labelledby="recent-fonts-label">
      <h2 className={styles.label} id="recent-fonts-label">
        最近使用したフォント
      </h2>
      {families.length === 0 ? (
        <p className={styles.empty}>まだありません</p>
      ) : (
        <ul className={styles.list}>
          {families.map((family) => {
            const isSelected = family === selectedFamily;
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
