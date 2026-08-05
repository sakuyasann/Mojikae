import { useMemo } from 'react';
import type { DetectedFontGroupWithRaw } from '../lib/tab-scanner';
import styles from './DetectedFontList.module.css';

type DetectedFontListProps = {
  groups: DetectedFontGroupWithRaw[];
  /** 「ページ全体」が選択されているか。 */
  wholePage: boolean;
  selectedGroupIds: ReadonlySet<string>;
  scanning: boolean;
  disabled: boolean;
  /** 走査上限に達して打ち切られたか。 */
  truncated: boolean;
  scannedElements: number;
  onWholePageChange: (next: boolean) => void;
  onGroupToggle: (groupId: string, next: boolean) => void;
  className?: string;
};

/**
 * ページ内で検出した font-family の一覧。
 * 最上部の「ページ全体」を選ぶと個別選択は無効化され、外すと複数選択できる。
 */
export function DetectedFontList({
  groups,
  wholePage,
  selectedGroupIds,
  scanning,
  disabled,
  truncated,
  scannedElements,
  onWholePageChange,
  onGroupToggle,
  className,
}: DetectedFontListProps) {
  const individualDisabled = disabled || wholePage;

  // 同じ先頭フォント名でも font-family の指定が違えば別グループになる。
  // 例: `Arial, sans-serif` と `Arial`。同名の行が並ぶと区別できないので、
  // 重複しているものだけ font-family 全体を併記する。
  const ambiguousNames = useMemo(() => {
    const seen = new Set<string>();
    const duplicated = new Set<string>();
    for (const group of groups) {
      if (seen.has(group.displayName)) {
        duplicated.add(group.displayName);
      }
      seen.add(group.displayName);
    }
    return duplicated;
  }, [groups]);

  return (
    <section className={`${styles.wrapper} ${className ?? ''}`} aria-labelledby="detected-fonts-label">
      <div className={styles.head}>
        <h2 className={styles.label} id="detected-fonts-label">
          適用対象
        </h2>
        <span className={styles.meta}>
          {scanning ? '解析中…' : `${groups.length} 種類 / ${scannedElements} 要素`}
        </span>
      </div>

      {scanning && groups.length === 0 ? (
        <p className={styles.empty} role="status">
          ページを解析しています…
        </p>
      ) : groups.length === 0 ? (
        <p className={styles.empty} role="status">
          フォントを検出できませんでした
        </p>
      ) : (
        <ul className={styles.list}>
          <li className={`${styles.row} ${styles.rowWhole} ${wholePage ? styles.rowSelected : ''}`}>
            <label className={styles.control}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={wholePage}
                disabled={disabled}
                onChange={(event) => {
                  onWholePageChange(event.target.checked);
                }}
              />
              <span className={styles.body}>
                <span className={`${styles.name} ${styles.nameWhole}`}>ページ全体</span>
                <span className={styles.count}>コードとアイコンは除外して適用します</span>
              </span>
            </label>
          </li>

          {groups.map((group) => {
            const checked = !wholePage && selectedGroupIds.has(group.id);
            const rowClassNames = [
              styles.row,
              checked ? styles.rowSelected : '',
              individualDisabled ? styles.rowDisabled : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li key={group.id} className={rowClassNames}>
                <label className={styles.control}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={checked}
                    disabled={individualDisabled}
                    onChange={(event) => {
                      onGroupToggle(group.id, event.target.checked);
                    }}
                  />
                  <span className={styles.body}>
                    <span className={styles.name} title={group.fontFamily}>
                      {group.displayName}
                    </span>
                    {ambiguousNames.has(group.displayName) && (
                      <span className={styles.stack} title={group.fontFamily}>
                        {group.fontFamily}
                      </span>
                    )}
                    <span className={styles.count}>{group.elementCount} elements</span>
                    {group.isPossibleIconFont && (
                      <span className={styles.iconNote}>アイコンフォントの可能性</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {truncated && (
        <p className={styles.truncated}>
          要素数が多いため上限 {scannedElements} 件で解析を打ち切りました。
        </p>
      )}
    </section>
  );
}
