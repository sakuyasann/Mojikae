import { browser } from 'wxt/browser';
import { MAX_SCAN_ELEMENTS, PAGE_ATTRS, SCAN_CHUNK_SIZE, SCAN_SKIP_TAGS } from './constants';
import { ExtensionError } from './extension-errors';
import { extractPrimaryFamily, fontFamilyGroupId, normalizeFontFamily } from './font-utils';
import { isPossibleIconFont } from './icon-font-detector';
import type { DetectedFontGroup, ScanResult } from '../types/detected-font';

/**
 * 現在のタブの DOM を走査し、実際に使われている font-family を集計する。
 *
 * CSSStyleSheet.cssRules は外部スタイルシートで CORS により読めないことがあるため使わない。
 * 実際の要素の computed style を見る。
 */

/** 適用時に「どの要素へ属性を付けるか」を決めるため、生の computed 値も保持しておく。 */
export type DetectedFontGroupWithRaw = DetectedFontGroup & {
  /** この グループへまとめられた `getComputedStyle().fontFamily` の生文字列。 */
  rawFamilies: string[];
};

export type TabScanResult = Omit<ScanResult, 'groups'> & {
  groups: DetectedFontGroupWithRaw[];
};

type ScanArgs = {
  maxElements: number;
  chunkSize: number;
  skipTags: string[];
  activeAttr: string;
  ignoreAttr: string;
};

type RawScanEntry = { raw: string; count: number; puaCount: number };

type RawScanResult = {
  entries: RawScanEntry[];
  scanned: number;
  truncated: boolean;
};

/**
 * ページ側で実行される走査関数。
 *
 * この関数はシリアライズされてページのコンテキストで実行されるため、
 * モジュールスコープの変数・import を一切参照できない。必要な値はすべて `args` で受け取る。
 * 正規化はここでは行わず、生の computed 値のまま返してポップアップ側でまとめる
 * （ページ側とポップアップ側で正規化ロジックが二重化しないようにするため）。
 */
// テストから直接呼べるように export している（実行時はページへ注入して使う）
export async function scanPageFonts(args: ScanArgs): Promise<RawScanResult> {
  const root = document.documentElement;
  const body = document.body;
  if (!body) {
    return { entries: [], scanned: 0, truncated: false };
  }

  // 適用中だと上書き後の font-family が computed style に出てしまうので、
  // 走査のあいだだけ有効化フラグを外して元の指定を読む。
  const previousActive = root.getAttribute(args.activeAttr);
  const wasActive = previousActive !== null;
  if (wasActive) {
    root.removeAttribute(args.activeAttr);
  }
  // 適用中に非同期で分割すると元フォントが一瞬見えてしまうため、そのときだけ同期実行する。
  // 未適用時（＝通常の初回スキャン）はメインスレッドを長時間ブロックしないよう分割する。
  const allowYield = !wasActive;

  const skipTags = new Set(args.skipTags);
  const counts = new Map<string, { count: number; puaCount: number }>();
  let scanned = 0;
  let truncated = false;

  const isPrivateUseCodePoint = (codePoint: number): boolean =>
    (codePoint >= 0xe000 && codePoint <= 0xf8ff) ||
    (codePoint >= 0xf0000 && codePoint <= 0xffffd) ||
    (codePoint >= 0x100000 && codePoint <= 0x10fffd);

  /** 直下のテキストノードに Unicode Private Use Area の文字が含まれるか。 */
  const hasPrivateUseText = (element: Element): boolean => {
    const children = element.childNodes;
    for (let i = 0; i < children.length; i += 1) {
      const node = children.item(i);
      if (node === null || node.nodeType !== 3) continue;
      const text = node.nodeValue;
      if (text === null || text === '') continue;
      for (const char of text) {
        const codePoint = char.codePointAt(0);
        if (codePoint !== undefined && isPrivateUseCodePoint(codePoint)) return true;
      }
    }
    return false;
  };

  try {
    const stack: Element[] = [body];
    let sinceYield = 0;

    while (stack.length > 0) {
      if (scanned >= args.maxElements) {
        truncated = true;
        break;
      }
      const element = stack.pop();
      if (element === undefined) break;
      scanned += 1;

      if (skipTags.has(element.localName)) continue;
      if (element.hasAttribute(args.ignoreAttr)) continue;

      const style = getComputedStyle(element);

      // display:none は子孫もまとめて非表示なので、部分木ごとスキップする
      if (style.display === 'none') continue;

      // visibility は子孫で visible に戻せるため、子は積んでから自分を除外する
      const children = element.children;
      for (let i = children.length - 1; i >= 0; i -= 1) {
        const child = children.item(i);
        if (child !== null) stack.push(child);
      }
      if (style.visibility === 'hidden' || style.visibility === 'collapse') continue;

      const raw = style.fontFamily;
      if (!raw) continue;

      let entry = counts.get(raw);
      if (entry === undefined) {
        entry = { count: 0, puaCount: 0 };
        counts.set(raw, entry);
      }
      entry.count += 1;
      if (hasPrivateUseText(element)) {
        entry.puaCount += 1;
      }

      sinceYield += 1;
      if (allowYield && sinceYield >= args.chunkSize) {
        sinceYield = 0;
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      }
    }
  } finally {
    if (wasActive && previousActive !== null) {
      root.setAttribute(args.activeAttr, previousActive);
    }
  }

  const entries: RawScanEntry[] = [];
  counts.forEach((value, raw) => {
    entries.push({ raw, count: value.count, puaCount: value.puaCount });
  });

  return { entries, scanned, truncated };
}

/** 生の集計結果を、正規化した font-family 単位のグループへまとめる。 */
export function groupScanEntries(entries: RawScanEntry[]): DetectedFontGroupWithRaw[] {
  const merged = new Map<
    string,
    { elementCount: number; puaElementCount: number; rawFamilies: Set<string> }
  >();

  for (const entry of entries) {
    const fontFamily = normalizeFontFamily(entry.raw);
    if (fontFamily === '') continue;

    let group = merged.get(fontFamily);
    if (group === undefined) {
      group = { elementCount: 0, puaElementCount: 0, rawFamilies: new Set<string>() };
      merged.set(fontFamily, group);
    }
    group.elementCount += entry.count;
    group.puaElementCount += entry.puaCount;
    group.rawFamilies.add(entry.raw);
  }

  const groups: DetectedFontGroupWithRaw[] = [];
  merged.forEach((value, fontFamily) => {
    const displayName = extractPrimaryFamily(fontFamily);
    groups.push({
      id: fontFamilyGroupId(fontFamily),
      displayName,
      fontFamily,
      elementCount: value.elementCount,
      isPossibleIconFont: isPossibleIconFont({
        primaryFamily: displayName,
        fontFamily,
        elementCount: value.elementCount,
        puaElementCount: value.puaElementCount,
      }),
      rawFamilies: [...value.rawFamilies].sort(),
    });
  });

  // 件数の多い順。同数のときは名前順にして再スキャンでの並び替わりを防ぐ。
  groups.sort((a, b) => {
    if (b.elementCount !== a.elementCount) return b.elementCount - a.elementCount;
    return a.displayName.localeCompare(b.displayName, 'ja');
  });

  return groups;
}

/** 現在のタブをスキャンする。 */
export async function scanActiveTab(tabId: number): Promise<TabScanResult> {
  const args: ScanArgs = {
    maxElements: MAX_SCAN_ELEMENTS,
    chunkSize: SCAN_CHUNK_SIZE,
    skipTags: [...SCAN_SKIP_TAGS],
    activeAttr: PAGE_ATTRS.active,
    ignoreAttr: PAGE_ATTRS.ignore,
  };

  const [injection] = await browser.scripting.executeScript({
    target: { tabId },
    func: scanPageFonts,
    args: [args],
  });

  if (!injection || injection.result === undefined || injection.result === null) {
    throw new ExtensionError('SCAN_FAILED', { detail: 'ページから結果を取得できません' });
  }

  const raw = injection.result;
  return {
    groups: groupScanEntries(raw.entries),
    scannedElements: raw.scanned,
    truncated: raw.truncated,
  };
}
