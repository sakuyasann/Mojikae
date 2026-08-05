import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { SEARCH_RESULT_LIMIT } from '../lib/constants';
import { EMPTY_FILTER, type FontFilter } from '../lib/font-filters';
import { countMatches, searchFonts } from '../lib/google-fonts';
import type { GoogleFont } from '../types/google-font';
import { FontFilters } from './FontFilters';
import { FontSearchResult } from './FontSearchResult';
import styles from './FontSearch.module.css';

type FontSearchProps = {
  fonts: GoogleFont[];
  /** 選択済みフォントのファミリー名。 */
  selectedFamilies: ReadonlySet<string>;
  disabled: boolean;
  /** 選択・解除のトグル。複数選択できる。 */
  onToggle: (font: GoogleFont) => void;
};

/**
 * Google Fonts の検索欄。
 * 上下キーで候補を移動、Enter で選択/解除、Escape で候補を閉じる。
 * 複数選択でき、選んだ順に font-family へ並ぶ。
 * ここで選ぶだけではページへ適用せず、適用対象を決めて「適用」を押すまで何も起きない。
 */
export function FontSearch({ fonts, selectedFamilies, disabled, onToggle }: FontSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [rawActiveIndex, setActiveIndex] = useState(0);
  const [filter, setFilter] = useState<FontFilter>(EMPTY_FILTER);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // useId() は `«r0»` のような CSS セレクタで使えない文字を含むので英数字だけに落とす
  const rawId = useId();
  const listId = `fp${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const matchedCount = useMemo(() => countMatches(fonts, query, filter), [fonts, query, filter]);

  const items = useMemo(
    () => searchFonts(fonts, query, SEARCH_RESULT_LIMIT, filter),
    [fonts, query, filter],
  );

  // 候補が減って activeIndex がはみ出しても壊れないようにする
  const activeIndex = items.length === 0 ? 0 : Math.min(rawActiveIndex, items.length - 1);

  // 複数選ぶことが多いので、選択してもリストは閉じない
  const toggle = (font: GoogleFont) => {
    onToggle(font);
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
        toggle(item.font);
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

  /*
   * 候補パネルを閉じる条件は「外側を押したとき」だけにする。
   * 入力欄の blur で閉じると、パネル内の絞り込み（select）を押した瞬間に
   * パネルごと消えてしまい操作できない。
   */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapperRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const handleFilterChange = (next: FontFilter) => {
    setFilter(next);
    setActiveIndex(0);
    setOpen(true);
  };

  const showList = open && !disabled;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={`${styles.field} ${focused ? styles.fieldFocused : ''}`}>
        {/* SF Symbols の magnifyingglass 相当 */}
        <svg className={styles.icon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          id={`${listId}-input`}
          type="text"
          className={styles.input}
          placeholder="Google Fonts を検索"
          aria-label="Google Fonts を検索"
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
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          onKeyDown={handleKeyDown}
        />
        {query !== '' && (
          <button
            type="button"
            className={styles.clear}
            aria-label="検索条件を消す"
            // blur より先に処理するため mousedown を使う
            onMouseDown={(event) => {
              event.preventDefault();
              setQuery('');
              setActiveIndex(0);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/*
        絞り込みと件数表示は候補パネルの中に入れている。
        常時表示にすると 50px 以上の縦幅を取り、ポップアップの高さを圧迫するため。
      */}
      {showList && (
        <div className={styles.panel}>
          <FontFilters fonts={fonts} filter={filter} disabled={disabled} onChange={handleFilterChange} />
          <FontSearchResult
            listId={listId}
            items={items}
            activeIndex={activeIndex}
            selectedFamilies={selectedFamilies}
            totalCount={matchedCount}
            onToggle={toggle}
            onActiveIndexChange={setActiveIndex}
          />
        </div>
      )}
    </div>
  );
}
