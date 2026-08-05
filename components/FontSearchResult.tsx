import { useEffect, useRef } from 'react';
import type { FontSearchItem, GoogleFont, GoogleFontCategory } from '../types/google-font';
import styles from './FontSearchResult.module.css';

const CATEGORY_LABELS: Record<GoogleFontCategory, string> = {
  serif: 'セリフ',
  'sans-serif': 'サンセリフ',
  display: 'ディスプレイ',
  handwriting: '手書き',
  monospace: '等幅',
};

type FontSearchResultProps = {
  listId: string;
  items: FontSearchItem[];
  activeIndex: number;
  selectedFamily: string | null;
  /** 絞り込み結果の総数（表示件数で切り詰める前）。 */
  totalCount: number;
  onSelect: (font: GoogleFont) => void;
  onActiveIndexChange: (index: number) => void;
};

export function FontSearchResult({
  listId,
  items,
  activeIndex,
  selectedFamily,
  totalCount,
  onSelect,
  onActiveIndexChange,
}: FontSearchResultProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // キーボードで移動したときに選択中の行を見える位置へ送る
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(`#${listId}-option-${activeIndex}`);
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listId]);

  if (items.length === 0) {
    return (
      <div className={styles.empty} role="status">
        一致するフォントがありません
      </div>
    );
  }

  return (
    <ul className={styles.list} id={listId} role="listbox" ref={listRef} aria-label="Google Fonts 検索結果">
      {items.map((item, index) => {
        const isSelected = item.font.family === selectedFamily;
        const classNames = [
          styles.option,
          index === activeIndex ? styles.optionActive : '',
          isSelected ? styles.optionSelected : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li
            key={item.font.family}
            id={`${listId}-option-${index}`}
            role="option"
            aria-selected={isSelected}
            className={classNames}
            onMouseEnter={() => {
              onActiveIndexChange(index);
            }}
            // mousedown で選択する。input の blur より先に走らせるため。
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(item.font);
            }}
          >
            <span className={styles.name}>{item.font.family}</span>
            {item.isIconFont && <span className={`${styles.badge} ${styles.badgeIcon}`}>アイコン</span>}
            {item.isJapanese && <span className={`${styles.badge} ${styles.badgeJapanese}`}>日本語</span>}
            <span className={styles.badge}>{CATEGORY_LABELS[item.font.category]}</span>
            <span className={styles.check} aria-hidden="true">
              {isSelected ? '✓' : ''}
            </span>
          </li>
        );
      })}
      {totalCount > items.length && (
        <li className={styles.more} role="presentation">
          ほか {totalCount - items.length} 件（検索語を追加して絞り込んでください）
        </li>
      )}
    </ul>
  );
}
