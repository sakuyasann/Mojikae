import { browser } from 'wxt/browser';
import { ACTIVE_VALUE, MAX_SCAN_ELEMENTS, PAGE_ATTRS, PAGE_BRIDGE_KEY, SCAN_SKIP_TAGS } from './constants';
import { ExtensionError, toExtensionError } from './extension-errors';
import { buildAppliedFontFamilyValue } from './font-utils';
import { buildGoogleFontsCssUrl } from './google-fonts-url';
import { EXCLUDED_SELECTORS, TARGET_SELECTORS } from './icon-font-detector';
import type { GoogleFont } from '../types/google-font';
import type { ApplyMode } from '../types/tab-state';

/**
 * 現在のタブへ Google Font を適用 / 解除する。
 *
 * 設計の要点:
 *   - 上書き CSS のセレクタはすべて `html[data-mojikae-active="1"]` 配下に置く。
 *     removeCSS が失敗しても、この属性を外すだけで上書きが一切効かない状態に戻せる。
 *   - 挿入した CSS 文字列はページ側（isolated world）に保持し、removeCSS へ正確に渡す。
 *   - サイト側のクラス・属性・インライン style は変更しない。付けるのは自前の data 属性だけ。
 */

/** `html[...active="1"]` プレフィックス。 */
function activeScope(): string {
  return `html[${PAGE_ATTRS.active}="${ACTIVE_VALUE}"]`;
}

/** ページ全体適用の上書き CSS。`*` は使わず、テキスト要素を列挙して除外条件を重ねる。 */
export function buildPageOverrideCss(fontValue: string): string {
  const scope = activeScope();
  const targets = TARGET_SELECTORS.join(',\n    ');
  const excluded = EXCLUDED_SELECTORS.join(',\n    ');

  return [
    `${scope},`,
    `${scope} body,`,
    `${scope} body :where(`,
    `    ${targets}`,
    `  ):not(`,
    `    ${excluded}`,
    `  ):not(`,
    // コードブロックやアイコンの「子孫」まで巻き込まないための除外
    `    :is(\n    ${excluded}\n    ) *`,
    `  ) {`,
    `  font-family: ${fontValue} !important;`,
    `}`,
  ].join('\n');
}

/** 個別 font-family 適用の上書き CSS。対象要素には事前に data 属性を付けてある。 */
export function buildGroupOverrideCss(fontValue: string, groupIds: string[]): string {
  const scope = activeScope();
  const selectors = groupIds.map((id) => `${scope} [${PAGE_ATTRS.group}="${id}"]`).join(',\n');
  return `${selectors} {\n  font-family: ${fontValue} !important;\n}`;
}

export type ApplyTarget =
  | { mode: 'page' }
  | { mode: 'groups'; groups: { id: string; rawFamilies: string[] }[] };

type PrepareArgs = {
  attrs: typeof PAGE_ATTRS;
  bridgeKey: string;
  mode: ApplyMode;
  fontName: string;
  /** `raw computed font-family` → グループ ID の対応表。 */
  rawToGroup: [string, string][];
  groupIds: string[];
  maxElements: number;
  skipTags: string[];
};

type PrepareResult = {
  /** 個別適用で属性を付けられた要素数。ページ全体適用では常に 1。 */
  matched: number;
  /** 以前挿入した CSS 文字列（removeCSS 用）。 */
  previousCss: string[];
};

type PageBridge = { fontCss?: string; overrideCss?: string };

/**
 * 適用の下ごしらえ（ページ側で実行）。
 * 1. 以前の状態を完全に消す
 * 2. 個別適用なら対象要素へ data 属性を付ける
 * 3. `<html>` へ状態を書き込む（有効化フラグはまだ立てない）
 *
 * この関数はシリアライズされるため import / モジュールスコープ変数を参照できない。
 */
// 以下 3 つはページへ注入して実行する関数。テストから直接呼べるように export している。
export function preparePage(args: PrepareArgs): PrepareResult {
  const root = document.documentElement;
  const bridge = (window as unknown as Record<string, PageBridge | undefined>)[args.bridgeKey];
  const previousCss: string[] = [];
  if (bridge) {
    if (bridge.fontCss) previousCss.push(bridge.fontCss);
    if (bridge.overrideCss) previousCss.push(bridge.overrideCss);
  }

  // 有効化フラグを外す = 既存の上書きが computed style から消える
  root.removeAttribute(args.attrs.active);

  // 以前この拡張機能が付けた data 属性をすべて削除する
  const tagged = document.querySelectorAll(`[${args.attrs.group}]`);
  tagged.forEach((element) => {
    element.removeAttribute(args.attrs.group);
    element.removeAttribute(args.attrs.family);
  });

  let matched = 0;

  if (args.mode === 'groups') {
    const rawToGroup = new Map<string, string>(args.rawToGroup);
    const skipTags = new Set(args.skipTags);
    const body = document.body;

    if (body) {
      // ちらつきを避けるため同期で走査する（上限つきなので最悪でも有限時間で終わる）
      const stack: Element[] = [body];
      let visited = 0;

      while (stack.length > 0 && visited < args.maxElements) {
        const element = stack.pop();
        if (element === undefined) break;
        visited += 1;

        if (skipTags.has(element.localName)) continue;
        if (element.hasAttribute(args.attrs.ignore)) continue;

        const style = getComputedStyle(element);
        if (style.display === 'none') continue;

        const children = element.children;
        for (let i = children.length - 1; i >= 0; i -= 1) {
          const child = children.item(i);
          if (child !== null) stack.push(child);
        }
        if (style.visibility === 'hidden' || style.visibility === 'collapse') continue;

        const groupId = rawToGroup.get(style.fontFamily);
        if (groupId === undefined) continue;

        element.setAttribute(args.attrs.group, groupId);
        // 上書き前の font-family を残しておく（デバッグと状態確認のため）
        element.setAttribute(args.attrs.family, style.fontFamily);
        matched += 1;
      }
    }
  } else {
    matched = 1;
  }

  root.setAttribute(args.attrs.mode, args.mode);
  root.setAttribute(args.attrs.font, args.fontName);
  root.setAttribute(args.attrs.groups, args.groupIds.join(','));

  return { matched, previousCss };
}

type CommitArgs = {
  activeAttr: string;
  activeValue: string;
  bridgeKey: string;
  fontCss: string;
  overrideCss: string;
};

/** CSS 挿入後に有効化フラグを立て、removeCSS 用に CSS 文字列を控える（ページ側で実行）。 */
export function commitPage(args: CommitArgs): void {
  (window as unknown as Record<string, PageBridge>)[args.bridgeKey] = {
    fontCss: args.fontCss,
    overrideCss: args.overrideCss,
  };
  document.documentElement.setAttribute(args.activeAttr, args.activeValue);
}

type ReleaseArgs = {
  attrs: typeof PAGE_ATTRS;
  bridgeKey: string;
};

/** 拡張機能が加えた変更をすべて取り消す（ページ側で実行）。挿入済み CSS 文字列を返す。 */
export function releasePage(args: ReleaseArgs): string[] {
  const globals = window as unknown as Record<string, PageBridge | undefined>;
  const bridge = globals[args.bridgeKey];
  const css: string[] = [];
  if (bridge) {
    if (bridge.fontCss) css.push(bridge.fontCss);
    if (bridge.overrideCss) css.push(bridge.overrideCss);
  }
  delete globals[args.bridgeKey];

  const root = document.documentElement;
  root.removeAttribute(args.attrs.active);
  root.removeAttribute(args.attrs.mode);
  root.removeAttribute(args.attrs.font);
  root.removeAttribute(args.attrs.groups);

  const tagged = document.querySelectorAll(`[${args.attrs.group}]`);
  tagged.forEach((element) => {
    element.removeAttribute(args.attrs.group);
    element.removeAttribute(args.attrs.family);
  });

  return css;
}

/** Google Fonts CSS API から @font-face 定義を取得する。ページ側ではなく拡張機能側で fetch する。 */
async function fetchGoogleFontCss(font: GoogleFont): Promise<string> {
  const url = buildGoogleFontsCssUrl(font);
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new ExtensionError('FONT_LOAD_FAILED', { cause, detail: 'ネットワークエラー' });
  }
  if (!response.ok) {
    throw new ExtensionError('FONT_LOAD_FAILED', {
      detail: `HTTP ${response.status}`,
      cause: new Error(`${url} -> ${response.status}`),
    });
  }
  const css = await response.text();
  if (!css.includes('@font-face')) {
    throw new ExtensionError('FONT_LOAD_FAILED', {
      detail: '@font-face が含まれていません',
      cause: new Error(`unexpected css from ${url}`),
    });
  }
  return css;
}

/** 挿入済み CSS の削除。すでに消えている場合のエラーは無視してよい（状態は属性で担保している）。 */
async function removeCssQuietly(tabId: number, cssList: string[]): Promise<void> {
  for (const css of cssList) {
    try {
      await browser.scripting.removeCSS({ target: { tabId }, css });
    } catch (error) {
      console.warn('[Mojikae] removeCSS に失敗しました（無視して続行します）', error);
    }
  }
}

/**
 * 現在のタブへフォントを適用する。
 * 対象は常にアクティブタブのトップフレームのみ（iframe へは適用しない）。
 */
export async function applyFont(tabId: number, font: GoogleFont, target: ApplyTarget): Promise<void> {
  if (target.mode === 'groups' && target.groups.length === 0) {
    throw new ExtensionError('NO_TARGET_SELECTED');
  }

  // 先にフォント CSS を取得する。ここで失敗したらページには一切触れない。
  const fontCss = await fetchGoogleFontCss(font);

  const groupIds = target.mode === 'groups' ? target.groups.map((group) => group.id) : [];
  const rawToGroup: [string, string][] =
    target.mode === 'groups'
      ? target.groups.flatMap((group) => group.rawFamilies.map((raw): [string, string] => [raw, group.id]))
      : [];

  let prepared: PrepareResult;
  try {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      func: preparePage,
      args: [
        {
          attrs: PAGE_ATTRS,
          bridgeKey: PAGE_BRIDGE_KEY,
          mode: target.mode,
          fontName: font.family,
          rawToGroup,
          groupIds,
          maxElements: MAX_SCAN_ELEMENTS,
          skipTags: [...SCAN_SKIP_TAGS],
        },
      ],
    });
    if (!injection || !injection.result) {
      throw new ExtensionError('APPLY_FAILED', { detail: 'ページを準備できません' });
    }
    prepared = injection.result;
  } catch (error) {
    throw toExtensionError(error, 'APPLY_FAILED');
  }

  if (prepared.matched === 0) {
    // 属性は付けたが対象が 1 つも無い状態。後片付けしてからエラーにする。
    await releaseFont(tabId).catch(() => undefined);
    throw new ExtensionError('FONT_NOT_FOUND');
  }

  const fontValue = buildAppliedFontFamilyValue(font.family, font.category);
  const overrideCss =
    target.mode === 'page' ? buildPageOverrideCss(fontValue) : buildGroupOverrideCss(fontValue, groupIds);

  await removeCssQuietly(tabId, prepared.previousCss);

  try {
    await browser.scripting.insertCSS({ target: { tabId }, css: fontCss });
    await browser.scripting.insertCSS({ target: { tabId }, css: overrideCss });
    await browser.scripting.executeScript({
      target: { tabId },
      func: commitPage,
      args: [
        {
          activeAttr: PAGE_ATTRS.active,
          activeValue: ACTIVE_VALUE,
          bridgeKey: PAGE_BRIDGE_KEY,
          fontCss,
          overrideCss,
        },
      ],
    });
  } catch (error) {
    await releaseFont(tabId).catch(() => undefined);
    throw toExtensionError(error, 'APPLY_FAILED');
  }
}

/** 現在のタブの上書きをすべて解除する。 */
export async function releaseFont(tabId: number): Promise<void> {
  let cssList: string[] = [];
  try {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      func: releasePage,
      args: [{ attrs: PAGE_ATTRS, bridgeKey: PAGE_BRIDGE_KEY }],
    });
    cssList = injection?.result ?? [];
  } catch (error) {
    throw toExtensionError(error, 'RELEASE_FAILED');
  }

  await removeCssQuietly(tabId, cssList);
}
