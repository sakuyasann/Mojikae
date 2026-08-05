import { browser } from 'wxt/browser';
import { ExtensionError } from './extension-errors';

/**
 * 現在アクティブなタブだけを扱うためのヘルパー。
 * 他のタブへは一切アクセスしない（`tabs` 権限も持たない）。
 */

export type ActiveTab = {
  id: number;
  url: string;
};

/** スキームだけで拡張機能を実行できないと判断できるもの。 */
const RESTRICTED_SCHEMES = [
  'about:',
  'chrome:',
  'edge:',
  'brave:',
  'opera:',
  'vivaldi:',
  'devtools:',
  'view-source:',
  'resource:',
  'moz-extension:',
  'chrome-extension:',
  'extension:',
  'chrome-untrusted:',
  'data:',
  'javascript:',
  'blob:',
];

/** ストアや拡張機能管理画面など、ブラウザがスクリプト注入を禁止しているページ。 */
const RESTRICTED_HOSTS: { host: string; label: string }[] = [
  { host: 'chrome.google.com', label: 'Chrome ウェブストア' },
  { host: 'chromewebstore.google.com', label: 'Chrome ウェブストア' },
  { host: 'addons.mozilla.org', label: 'Firefox アドオン' },
  { host: 'microsoftedge.microsoft.com', label: 'Edge アドオン' },
  { host: 'accounts.google.com', label: 'Google アカウント' },
];

export type RestrictionReason = { restricted: true; label: string } | { restricted: false };

/** URL からページの種類を判定する。DOM へ触れる前の事前チェック。 */
export function checkUrlRestriction(url: string | undefined): RestrictionReason {
  if (!url) {
    // activeTab が付与されていない、または権限的に URL を読めないページ
    return { restricted: true, label: '権限上操作できないページ' };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { restricted: true, label: '不明な URL' };
  }

  const scheme = parsed.protocol.toLowerCase();
  if (RESTRICTED_SCHEMES.includes(scheme)) {
    return { restricted: true, label: `${scheme}// ページ` };
  }

  if (scheme === 'file:') {
    return { restricted: true, label: 'ローカルファイル' };
  }

  if (scheme !== 'http:' && scheme !== 'https:') {
    return { restricted: true, label: `${scheme}// ページ` };
  }

  // PDF ビューアは HTML ドキュメントではないため DOM 走査できない
  if (/\.pdf($|\?|#)/i.test(parsed.pathname + parsed.search + parsed.hash)) {
    return { restricted: true, label: 'PDF ビューア' };
  }

  const host = parsed.hostname.toLowerCase();
  const restrictedHost = RESTRICTED_HOSTS.find(
    (entry) => host === entry.host || host.endsWith(`.${entry.host}`),
  );
  if (restrictedHost) {
    return { restricted: true, label: restrictedHost.label };
  }

  return { restricted: false };
}

/**
 * 現在アクティブなタブを取得し、操作できないページなら `UNSUPPORTED_PAGE` を投げる。
 * ポップアップからの各操作はすべてこの関数を通す。
 */
export async function getActiveTab(): Promise<ActiveTab> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab || tab.id === undefined) {
    throw new ExtensionError('UNSUPPORTED_PAGE', { detail: 'タブを取得できません' });
  }

  const restriction = checkUrlRestriction(tab.url);
  if (restriction.restricted) {
    throw new ExtensionError('UNSUPPORTED_PAGE', { detail: restriction.label });
  }

  return { id: tab.id, url: tab.url ?? '' };
}
