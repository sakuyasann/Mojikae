import { resolve } from 'node:path';
import { defineConfig } from 'wxt';

/**
 * `data/google-fonts.json` の出力先（拡張機能パッケージ内の相対パス）。
 * ポップアップは `fetch(browser.runtime.getURL('/data/google-fonts.json'))` で読み込む。
 * 500KB 超あるため JS バンドルへ埋め込まず、静的アセットとして同梱している。
 */
const CATALOG_DEST = 'data/google-fonts.json';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  outDir: '.output',

  // Firefox でも Manifest V3 で出力する（WXT の既定は MV2）
  manifestVersion: 3,

  manifest: ({ browser }) => ({
    name: 'Mojikae',
    description: '現在のタブで使われているフォントを検出し、Google Fonts へ一時的に上書きして比較できます。',

    // 必要最小限の権限のみ。
    //   activeTab : ユーザーがアイコンを押した「そのタブ」だけを操作するため
    //   scripting : executeScript / insertCSS / removeCSS を使うため
    //   storage   : 最近使用したフォント名（最大 5 件）の保存のため
    permissions: ['activeTab', 'scripting', 'storage'],

    // Google Fonts CSS API v2 を fetch するためのホスト権限のみ。<all_urls> は使わない。
    host_permissions: ['https://fonts.googleapis.com/*', 'https://fonts.gstatic.com/*'],

    action: {
      default_title: 'Mojikae',
    },

    // Firefox MV3 は署名・インストールのために拡張機能 ID を要求する。
    // Chromium 側のマニフェストへは出力しない。
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'mojikae@sakuyasan.net',
              strict_min_version: '128.0',
              // ユーザーデータの収集・送信は一切行わない
              data_collection_permissions: { required: ['none'] },
            },
          },
        }
      : {}),
  }),

  hooks: {
    // data/google-fonts.json は public/ の外にあるので、明示的に出力へコピーする。
    'build:publicAssets': (wxt, files) => {
      files.push({
        absoluteSrc: resolve(wxt.config.root, CATALOG_DEST),
        relativeDest: CATALOG_DEST,
      });
    },
    // 上でコピーしたファイルを browser.runtime.getURL() の型定義へ含める。
    'prepare:publicPaths': (_wxt, paths) => {
      paths.push({ type: 'string', path: `/${CATALOG_DEST}` });
    },
  },
});
