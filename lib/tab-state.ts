import { browser } from 'wxt/browser';
import { ACTIVE_VALUE, PAGE_ATTRS } from './constants';
import { EMPTY_TAB_STATE, type TabApplyState } from '../types/tab-state';

/**
 * 適用状態はページの `<html>` の data 属性だけに持つ。
 * `browser.storage.local` へは保存しないので、リロードすれば必ず消える。
 */

type ReadStateArgs = {
  attrs: typeof PAGE_ATTRS;
  activeValue: string;
};

/** ページ側で実行して現在の適用状態を読む。import / モジュールスコープは参照できない。 */
export function readPageState(args: ReadStateArgs): TabApplyState {
  const root = document.documentElement;
  const active = root.getAttribute(args.attrs.active) === args.activeValue;
  const mode = root.getAttribute(args.attrs.mode) === 'groups' ? 'groups' : 'page';
  const groupsAttr = root.getAttribute(args.attrs.groups) ?? '';

  return {
    active,
    fontFamily: root.getAttribute(args.attrs.font),
    mode,
    groupIds: groupsAttr.split(',').filter((id) => id !== ''),
  };
}

/**
 * 現在のタブから適用状態を読み出す。
 * 読めなかった場合（新しいページ・注入不可など）は「未適用」として扱う。
 */
export async function readTabState(tabId: number): Promise<TabApplyState> {
  const [injection] = await browser.scripting.executeScript({
    target: { tabId },
    func: readPageState,
    args: [{ attrs: PAGE_ATTRS, activeValue: ACTIVE_VALUE }],
  });

  return injection?.result ?? EMPTY_TAB_STATE;
}
