import { previewFontFamily } from '../lib/font-preview';
import { buildAppliedFontFamilyValue } from '../lib/font-utils';
import { isIconFont, isJapaneseFont } from '../lib/google-fonts';
import type { GoogleFont } from '../types/google-font';
import styles from './SelectedFonts.module.css';

type SelectedFontsProps = {
  /** 適用するフォント。先頭が最優先。 */
  fonts: GoogleFont[];
  disabled: boolean;
  onRemove: (family: string) => void;
  onMove: (family: string, direction: -1 | 1) => void;
};

/**
 * 選択中のフォント一覧。
 *
 * 並び順がそのまま font-family の指定順になる。ブラウザは字形を持たないフォントを
 * 1 文字ずつ読み飛ばすため、「英字フォント → 日本語フォント」の順に並べると
 * 英数字と日本語で別のフォントを使い分けられる。
 */
export function SelectedFonts({ fonts, disabled, onRemove, onMove }: SelectedFontsProps) {
  return (
    <section className={styles.wrapper} aria-labelledby="selected-fonts-label">
      <div className={styles.head}>
        <h2 className={styles.label} id="selected-fonts-label">
          選択中のフォント
        </h2>
        {fonts.length > 0 && <span className={styles.count}>{fonts.length} 件・上が優先</span>}
      </div>

      {fonts.length === 0 ? (
        <p className={styles.empty}>フォント未選択</p>
      ) : (
        <>
          <ul className={styles.list}>
            {fonts.map((font, index) => (
              <li key={font.family} className={styles.item}>
                <span className={styles.order} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.body}>
                  {/* 名前をそのフォント自身で描画する */}
                  <span
                    className={styles.name}
                    style={{ fontFamily: previewFontFamily(font.family, font.category) }}
                  >
                    {font.family}
                  </span>
                  <span className={styles.meta}>
                    {isJapaneseFont(font) ? '日本語対応' : '英数字のみ'}
                    {isIconFont(font) && ' ・アイコンフォント'}
                    {index === 0 && ' ・最優先'}
                  </span>
                </span>
                <span className={styles.controls}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    disabled={disabled || index === 0}
                    aria-label={`${font.family} を上へ`}
                    onClick={() => {
                      onMove(font.family, -1);
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    disabled={disabled || index === fonts.length - 1}
                    aria-label={`${font.family} を下へ`}
                    onClick={() => {
                      onMove(font.family, 1);
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.remove}`}
                    disabled={disabled}
                    aria-label={`${font.family} を外す`}
                    onClick={() => {
                      onRemove(font.family);
                    }}
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <p className={styles.stack}>{buildAppliedFontFamilyValue(fonts)}</p>

          {fonts.length > 1 && (
            <p className={styles.hint}>
              上のフォントに無い文字は、下のフォントで表示されます（英字と日本語の使い分けができます）。
            </p>
          )}
        </>
      )}
    </section>
  );
}
