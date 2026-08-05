import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
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
  /** 並び替え。`from` の位置にある項目を `to` の位置へ移す。 */
  onReorder: (from: number, to: number) => void;
};

type DragState = {
  /** 掴んでいる項目の位置。 */
  from: number;
  /** いま離したら入る位置。 */
  to: number;
  /** ポインタの移動量。 */
  offsetY: number;
  pointerId: number;
  startY: number;
  rowHeight: number;
};

/**
 * 選択中のフォント一覧。
 *
 * 並び順がそのまま font-family の指定順になる。ブラウザは字形を持たないフォントを
 * 1 文字ずつ読み飛ばすため、「英字フォント → 日本語フォント」の順に並べると
 * 英数字と日本語で別のフォントを使い分けられる。
 *
 * 並び替えはグリップのドラッグに加えて、グリップにフォーカスした状態の
 * 上下キーでも行える（ドラッグはポインタ操作でしか使えないため）。
 */
export function SelectedFonts({ fonts, disabled, onRemove, onReorder }: SelectedFontsProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>, index: number) => {
      if (disabled || fonts.length < 2) return;
      // 主ボタン以外（右クリックなど）では始めない
      if (event.button !== 0) return;

      const row = listRef.current?.children[index];
      const rowHeight = row instanceof HTMLElement ? row.offsetHeight : 48;

      try {
        // ポインタが既に離れている等で失敗することがあるが、掴み直せばよいので握りつぶさず記録だけする
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (error) {
        console.warn('[Mojikae] ポインタのキャプチャに失敗しました', error);
      }
      setDrag({ from: index, to: index, offsetY: 0, pointerId: event.pointerId, startY: event.clientY, rowHeight });
    },
    [disabled, fonts.length],
  );

  const handlePointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    setDrag((current) => {
      if (current === null || current.pointerId !== event.pointerId) return current;
      const offsetY = event.clientY - current.startY;
      // 半行ぶん動いたら入れ替え位置を 1 つずらす
      const shift = Math.round(offsetY / current.rowHeight);
      const to = Math.min(Math.max(current.from + shift, 0), fonts.length - 1);
      if (to === current.to && offsetY === current.offsetY) return current;
      return { ...current, offsetY, to };
    });
  }, [fonts.length]);

  const endDrag = useCallback(() => {
    setDrag((current) => {
      if (current !== null && current.from !== current.to) {
        onReorder(current.from, current.to);
      }
      return null;
    });
  }, [onReorder]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (disabled) return;
      const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
      if (delta === 0) return;
      const to = index + delta;
      if (to < 0 || to >= fonts.length) return;
      event.preventDefault();
      onReorder(index, to);
    },
    [disabled, fonts.length, onReorder],
  );

  /** ドラッグ中に各行をどれだけずらすか。 */
  const rowTransform = (index: number): string | undefined => {
    if (drag === null) return undefined;
    if (index === drag.from) return `translateY(${drag.offsetY}px)`;
    // 掴んだ行が抜けた分だけ、間の行を詰める／空ける
    if (drag.from < drag.to && index > drag.from && index <= drag.to) {
      return `translateY(${-drag.rowHeight}px)`;
    }
    if (drag.from > drag.to && index >= drag.to && index < drag.from) {
      return `translateY(${drag.rowHeight}px)`;
    }
    return undefined;
  };

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
          <ul className={styles.list} ref={listRef}>
            {fonts.map((font, index) => {
              const isDragging = drag?.from === index;
              return (
                <li key={font.family}>
                  <div
                    className={`${styles.item} ${isDragging ? styles.itemDragging : ''}`}
                    style={{
                      transform: rowTransform(index),
                      transition: isDragging ? 'none' : undefined,
                    }}
                  >
                    <button
                      type="button"
                      className={styles.grip}
                      disabled={disabled || fonts.length < 2}
                      aria-label={`${font.family} の順番を変更。上下キーで移動、ドラッグでも並び替えできます。現在 ${index + 1} 番目`}
                      onPointerDown={(event) => {
                        handlePointerDown(event, index);
                      }}
                      onPointerMove={handlePointerMove}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      onKeyDown={(event) => {
                        handleKeyDown(event, index);
                      }}
                    >
                      <span
                        className={`${styles.order} ${index === 0 ? styles.orderFirst : ''}`}
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      {/* SF Symbols の line.3.horizontal 相当 */}
                      <svg className={styles.gripIcon} viewBox="0 0 12 12" aria-hidden="true">
                        <path
                          d="M1.5 3h9M1.5 6h9M1.5 9h9"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>

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

                    <button
                      type="button"
                      className={styles.remove}
                      disabled={disabled}
                      aria-label={`${font.family} を外す`}
                      onClick={() => {
                        onRemove(font.family);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className={styles.stack}>{buildAppliedFontFamilyValue(fonts)}</p>

          {fonts.length > 1 && (
            <p className={styles.hint}>
              上のフォントに無い文字は、下のフォントで表示されます（英字と日本語の使い分けができます）。
              ハンドルをドラッグすると順番を変えられます。
            </p>
          )}
        </>
      )}
    </section>
  );
}
