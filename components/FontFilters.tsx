import { useMemo } from 'react';
import {
  EMPTY_FILTER,
  categoryOptions,
  isFilterActive,
  subsetOptions,
  type FontFilter,
} from '../lib/font-filters';
import type { GoogleFont, GoogleFontCategory } from '../types/google-font';
import styles from './FontFilters.module.css';

type FontFiltersProps = {
  fonts: GoogleFont[];
  filter: FontFilter;
  disabled: boolean;
  onChange: (next: FontFilter) => void;
};

const Chevron = () => (
  <svg className={styles.chevron} viewBox="0 0 10 10" aria-hidden="true">
    <path
      d="M1.5 3.5 5 7l3.5-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 検索結果の絞り込み（言語 / 種類）。
 *
 * ネイティブの select を macOS の pop-up button 風に見せている。
 * 自前のメニューを作らないので、キーボード操作と支援技術対応がそのまま効く。
 */
export function FontFilters({ fonts, filter, disabled, onChange }: FontFiltersProps) {
  // 件数はもう一方の絞り込みを踏まえて数える（組み合わせたときに 0 件の選択肢を出さないため）
  const subsets = useMemo(() => subsetOptions(fonts, filter), [fonts, filter]);
  const categories = useMemo(() => categoryOptions(fonts, filter), [fonts, filter]);
  const active = isFilterActive(filter);

  return (
    <div className={styles.wrapper}>
      <div className={styles.field}>
        <select
          className={`${styles.select} ${filter.subset !== null ? styles.selectActive : ''}`}
          value={filter.subset ?? ''}
          disabled={disabled}
          aria-label="言語で絞り込む"
          onChange={(event) => {
            onChange({ ...filter, subset: event.target.value === '' ? null : event.target.value });
          }}
        >
          <option value="">すべての言語</option>
          {subsets.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}（{option.count}）
            </option>
          ))}
        </select>
        <Chevron />
      </div>

      <div className={styles.field}>
        <select
          className={`${styles.select} ${filter.category !== null ? styles.selectActive : ''}`}
          value={filter.category ?? ''}
          disabled={disabled}
          aria-label="種類で絞り込む"
          onChange={(event) => {
            const value = event.target.value;
            onChange({ ...filter, category: value === '' ? null : (value as GoogleFontCategory) });
          }}
        >
          <option value="">すべての種類</option>
          {categories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}（{option.count}）
            </option>
          ))}
        </select>
        <Chevron />
      </div>

      {active && (
        <button
          type="button"
          className={styles.reset}
          disabled={disabled}
          onClick={() => {
            onChange(EMPTY_FILTER);
          }}
        >
          解除
        </button>
      )}
    </div>
  );
}
