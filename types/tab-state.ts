/** 適用対象のモード。 */
export type ApplyMode = 'page' | 'groups';

/**
 * ページ内に保持している適用状態。
 *
 * `browser.storage.local` には保存せず、ページの `<html>` 要素の data 属性から復元する。
 * したがってページをリロードすると状態は失われる（仕様どおり）。
 */
export type TabApplyState = {
  active: boolean;
  /** 適用中の Google Font ファミリー名。未適用なら null。 */
  fontFamily: string | null;
  mode: ApplyMode;
  /** `mode === 'groups'` のときに選択されていた DetectedFontGroup の ID 一覧。 */
  groupIds: string[];
};

export const EMPTY_TAB_STATE: TabApplyState = {
  active: false,
  fontFamily: null,
  mode: 'page',
  groupIds: [],
};
