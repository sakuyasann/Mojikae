import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { SEARCH_RESULT_LIMIT } from '../lib/constants';
import { isIconFont, isJapaneseFont, searchFonts } from '../lib/google-fonts';
import type { GoogleFont } from '../types/google-font';
import { FontSearchResult } from './FontSearchResult';
import styles from './FontSearch.module.css';

type FontSearchProps = {
  fonts: GoogleFont[];
  selectedFont: GoogleFont | null;
  disabled: boolean;
  onSelect: (font: GoogleFont) => void;
};

/**
 * Google Fonts の検索欄。
 * 上下キーで候補を移動、Enter で決定、Escape で候補を閉じる。
 * ここで選ぶだけではページへ適用せず、適用対象を決めて「適用」を押すまで何も起きない。
 */
export function FontSearch({ fonts, selectedFont, disabled, onSelect }: FontSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [rawActiveIndex, setActiveIndex] = useState(0);
  // useId() は `«r0»` のような CSS セレクタで使えない文字を含むので英数字だけに落とす
  const rawId = useId();
  const listId = `fp${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const matchedCount = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized === '') return fonts.length;
    return fonts.reduce(
      (count, font) => (font.family.toLowerCase().includes(normalized) ? count + 1 : count),
      0,
    );
  }, [fonts, query]);

  const items = useMemo(
    () => searchFonts(fonts, query, SEARCH_RESULT_LIMIT),
    [fonts, query],
  );

  // 候補が減って activeIndex がはみ出しても壊れないようにする
  const activeIndex = items.length === 0 ? 0 : Math.min(rawActiveIndex, items.length - 1);

  const select = (font: GoogleFont) => {
    onSelect(font);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex(Math.min(activeIndex + 1, items.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(Math.max(activeIndex - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      if (!open) return;
      const item = items[activeIndex];
      if (item) {
        event.preventDefault();
        select(item.font);
      }
      return;
    }
    if (event.key === 'Escape') {
      if (open) {
        // ポップアップ自体が閉じないよう、候補が開いているときだけ止める
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const showList = open && !disabled;

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={`${listId}-input`}>
        Google Fonts を検索
      </label>
      <div className={styles.combobox}>
        <input
          id={`${listId}-input`}
          type="text"
          className={`${styles.input} ${showList ? styles.inputOpen : ''}`}
          placeholder="フォント名を入力"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={query}
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && items.length > 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          onChange={(event) => {
            setQuery(event.target.value);
            // 絞り込みが変わったら候補の先頭へ戻す
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
          }}
          onKeyDown={handleKeyDown}
        />
        {showList && (
          <FontSearchResult
            listId={listId}
            items={items}
            activeIndex={activeIndex}
            selectedFamily={selectedFont?.family ?? null}
            totalCount={matchedCount}
            onSelect={select}
            onActiveIndexChange={setActiveIndex}
          />
        )}
      </div>

      <div className={`${styles.selected} ${selectedFont ? '' : styles.selectedEmpty}`}>
        <span className={styles.selectedLabel}>選択中</span>
        <span className={styles.selectedName}>{selectedFont?.family ?? 'フォント未選択'}</span>
        {selectedFont && isJapaneseFont(selectedFont) && (
          <span className={styles.selectedLabel}>日本語</span>
        )}
      </div>
      {selectedFont && isIconFont(selectedFont) && (
        <p className={styles.warning} role="status">
          <span aria-hidden="true">! </span>
          これはアイコンフォントです。本文へ適用すると文字が記号に置き換わります。
        </p>
      )}
      <p className={styles.hint}>選択しただけでは適用されません。対象を選んで「適用」を押してください。</p>
    </div>
  );
}
