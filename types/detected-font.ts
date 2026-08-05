/** ページ内で検出した font-family のグループ。 */
export type DetectedFontGroup = {
  /** `fontFamily` から決定的に導出される安定 ID。再スキャンしても同じ値になる。 */
  id: string;
  /** font-family の先頭に指定されたフォント名。例: `Inter` */
  displayName: string;
  /** 正規化済みの font-family 文字列全体。例: `"Inter", "Helvetica Neue", Arial, sans-serif` */
  fontFamily: string;
  elementCount: number;
  isPossibleIconFont: boolean;
};

/** スキャン結果全体。 */
export type ScanResult = {
  groups: DetectedFontGroup[];
  /** 実際に走査した要素数。 */
  scannedElements: number;
  /** 走査上限に達して打ち切ったか。 */
  truncated: boolean;
};
