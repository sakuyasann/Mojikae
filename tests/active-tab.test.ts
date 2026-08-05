import { describe, expect, it } from 'vitest';
import { checkUrlRestriction } from '../lib/active-tab';

describe('checkUrlRestriction', () => {
  it.each([
    'about:blank',
    'about:addons',
    'chrome://extensions',
    'edge://settings',
    'moz-extension://abc/options.html',
    'chrome-extension://abc/popup.html',
    'view-source:https://example.com',
    'devtools://devtools/bundled/inspector.html',
    'file:///Users/me/index.html',
    'https://chromewebstore.google.com/detail/foo',
    'https://chrome.google.com/webstore/detail/foo',
    'https://addons.mozilla.org/ja/firefox/addon/foo/',
    'https://example.com/manual.pdf',
  ])('%s は操作できないページとして扱う', (url) => {
    expect(checkUrlRestriction(url).restricted).toBe(true);
  });

  it.each([
    'https://example.com/',
    'http://localhost:3000/admin',
    'https://example.com/pdfs/index.html',
    'https://docs.example.com/guide?q=pdf',
  ])('%s は通常のページとして扱う', (url) => {
    expect(checkUrlRestriction(url).restricted).toBe(false);
  });

  it('URL が取れない場合は操作できないページとして扱う', () => {
    const result = checkUrlRestriction(undefined);
    expect(result.restricted).toBe(true);
    expect(result).toHaveProperty('label');
  });

  it('理由のラベルを返す', () => {
    const result = checkUrlRestriction('https://chromewebstore.google.com/');
    expect(result.restricted && result.label).toBe('Chrome ウェブストア');
  });
});
