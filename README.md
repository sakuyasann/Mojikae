# Mojikae

現在開いているタブの Web サイトで使われているフォントを検出し、**Google Fonts のフォントへ一時的に上書きして比較**するためのブラウザ拡張機能です。

SaaS・管理画面・Web サイトのフォント選定を主な用途としています。

- ページ全体のフォントを Google Font へ変更する
- ページ内で使われている特定の `font-family` だけを選んで変更する

変更は**現在のタブにだけ**適用され、**ページをリロードするとすべて元に戻ります**。

## 技術構成

| 項目 | 内容 |
| --- | --- |
| フレームワーク | [WXT](https://wxt.dev/) 0.21 |
| UI | React 19 / TypeScript（strict） |
| パッケージマネージャ | pnpm |
| マニフェスト | Manifest V3（Chromium / Firefox とも） |
| 対応ブラウザ | Chrome, Edge などの Chromium 系, Firefox 128+ |
| スタイル | 素の CSS + CSS Modules（UI ライブラリなし） |
| Lint | ESLint 9（flat config） |
| テスト | Vitest |
| CI | GitHub Actions |

## セットアップ

```bash
pnpm install
```

`postinstall` で `wxt prepare` が走り、`.wxt/` に型定義が生成されます。

## 開発

### Chromium（Chrome / Edge）で開発する

```bash
pnpm dev
```

WXT が Chrome を起動し、`.output/chrome-mv3` を読み込んだ状態で開きます。

手動で読み込む場合は次のとおりです。

1. `pnpm build` を実行する
2. `chrome://extensions` を開く
3. 「デベロッパーモード」を ON にする
4. 「パッケージ化されていない拡張機能を読み込む」で `.output/chrome-mv3` を選ぶ

Edge の場合は `edge://extensions` で同じ手順です。

### Firefox で開発する

```bash
pnpm dev:firefox
```

手動で読み込む場合は次のとおりです。

1. `pnpm build:firefox` を実行する
2. `about:debugging#/runtime/this-firefox` を開く
3. 「一時的なアドオンを読み込む」で `.output/firefox-mv3/manifest.json` を選ぶ

## ビルド

```bash
pnpm build          # Chromium 向け → .output/chrome-mv3
pnpm build:firefox  # Firefox 向け   → .output/firefox-mv3
```

## zip の作成

ストアへ提出するための zip を作ります。

```bash
pnpm zip            # .output/mojikae-<version>-chrome.zip
pnpm zip:firefox    # .output/mojikae-<version>-firefox.zip
                    # および審査用のソース zip (-sources.zip)
```

Firefox は審査でソースコードの提出を求められるため、WXT が自動でソース zip も生成します。

## 検証コマンド

```bash
pnpm typecheck   # wxt prepare + tsc --noEmit
pnpm lint        # ESLint
pnpm test        # Vitest（純粋関数の単体テスト）
```

## Google Fonts カタログの同期

拡張機能は**実行時に Google Fonts Developer API を呼びません**。
フォント一覧は `data/google-fonts.json` として静的に同梱しており、次のコマンドで更新します。

```bash
pnpm fonts:sync
```

`scripts/sync-google-fonts.ts` が行うことは以下のとおりです。

1. Google Fonts Developer API から全フォントを取得（`capability=VF` 付きで可変フォントの軸も取得）
2. 拡張機能に必要な情報だけへ変換（`family` / `category` / `subsets` / `variants` / `axes` / `lastModified`）
3. `category` を正規化し、想定外の値があれば失敗させる
4. `subsets` から `menu`（フォント選択メニュー用の擬似サブセット）を除いて整列
5. `variants` を `regular` / `italic` / `700italic` 形式へ揃え、ウェイト昇順で整列
6. `axes` を `{ tag, start, end }` へ揃え、タグ順で整列
7. `family` 名で安定ソート
8. `generatedAt` を付与
9. Prettier で整形して `data/google-fonts.json` へ保存

**同じ入力からは必ず同じ出力になる**ように整列・正規化しているため、意味のない差分は発生しません
（実行のたびに変わるのは `generatedAt` だけです）。

取得件数が極端に少ない、`variant` が解釈できない、`axes` の `start > end` といった不正データがある場合は、
ファイルを書き換えずに **エラー終了** します。

> リポジトリに入っている初期カタログ（1,942 フォント / うち日本語対応 68 / 可変フォント 555）は、
> API キー不要の公開メタデータから同じ正規化処理を通して生成したものです。
> 以降は `pnpm fonts:sync` が唯一の更新経路になります。

### `GOOGLE_FONTS_API_KEY` の設定方法

1. [Google Fonts Developer API](https://developers.google.com/fonts/docs/developer_api) のページから API キーを取得します
   （Google Cloud コンソールで「Web Fonts Developer API」を有効化し、API キーを発行します）。
2. ローカルで実行する場合は環境変数として渡します。

```bash
GOOGLE_FONTS_API_KEY=あなたのキー pnpm fonts:sync
```

未設定の場合は、取得手順を含む日本語のエラーを表示して終了します。

キーはコード・ログ・生成される JSON・PR 本文のいずれにも出力されません
（エラーメッセージ内の URL もキー部分を `***` へ伏せています）。

### GitHub Actions Secret の設定方法

1. リポジトリの **Settings → Secrets and variables → Actions** を開きます
2. **New repository secret** を押します
3. Name に `GOOGLE_FONTS_API_KEY`、Secret に API キーを入力して保存します

## GitHub Actions

### `.github/workflows/sync-google-fonts.yml`

Google Fonts カタログを定期同期します。

- **毎週月曜 09:00（日本時間）** に実行（cron は UTC 基準で `0 0 * * 1`）
- **`workflow_dispatch` による手動実行**にも対応

処理の流れは次のとおりです。

1. checkout
2. pnpm / Node.js をセットアップ
3. 依存関係をインストール
4. `pnpm fonts:sync`
5. `scripts/diff-google-fonts.mjs` で更新前後を比較
6. フォントに差分がなければ終了（`generatedAt` だけの変化では PR を作りません）
7. 差分があれば 型チェック → Lint → テスト → Chromium ビルド → Firefox ビルド
8. `peter-evans/create-pull-request` で自動 PR を作成

PR には追加・削除・更新フォント数、総フォント数、更新日時が記載されます。
ワークフローの権限は `contents: write` と `pull-requests: write` のみです。

### `.github/workflows/ci.yml`

push / pull request で 型チェック・Lint・テスト・両ブラウザのビルドを実行します（権限は `contents: read` のみ）。

## 使用する権限と理由

```json
{
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["https://fonts.googleapis.com/*", "https://fonts.gstatic.com/*"]
}
```

| 権限 | 用途 |
| --- | --- |
| `activeTab` | 拡張機能アイコンを押したときに、**そのタブに限って**アクセス許可を得るため |
| `scripting` | `executeScript` でフォントを検出し、`insertCSS` / `removeCSS` で上書き CSS を出し入れするため |
| `storage` | 最近使用したフォント名（最大 5 件）を保存するため |
| `https://fonts.googleapis.com/*` | Google Fonts CSS API v2 から `@font-face` 定義を取得するため |
| `https://fonts.gstatic.com/*` | 上記 CSS が参照するフォントファイルを読み込むため |

`<all_urls>` は使用していません。

### プライバシー

- **現在アクティブなタブ以外へアクセスしません。** `tabs` 権限を持たず、`activeTab` で得た 1 タブだけを操作します。
- **iframe の中身は変更しません。** 注入対象はトップフレームのみです。
- **Google Fonts への通信が発生します。** フォントを適用したときに `fonts.googleapis.com` から CSS を取得し、
  そこから参照される `fonts.gstatic.com` のフォントファイルをページが読み込みます。
  この通信は選択されたフォント名を含みます。
- **保存するのは「最近使用したフォント名」だけです。** サイトの URL・タイトル・タブ情報・適用対象・適用状態は
  一切保存しません。閲覧情報の収集・送信は行いません。
- 適用状態はページ内の data 属性にのみ保持しているため、**リロードすれば必ず消えます**。

## 仕組み

### ページ内フォントの検出

外部スタイルシートは CORS の制約で `CSSStyleSheet.cssRules` を読めないことがあるため、
**実際の DOM 要素の computed style** を使います。

1. `document.body` 以下を明示的なスタックで走査（最大 10,000 要素）
2. `getComputedStyle(element).fontFamily` を取得
3. `script` / `style` / `svg` / `canvas` などと、`display: none` の部分木、`visibility: hidden` の要素を除外
4. 生の値のままポップアップへ返し、ポップアップ側で正規化してグループ化・集計
5. 要素数の多い順に並べ、アイコンフォントの可能性を判定

未適用時はメインスレッドを長時間ブロックしないよう 1,500 要素ごとに処理を分割します。
適用中の再スキャンでは、一時的に有効化フラグを外して**元の** `font-family` を読み取ります
（このときは表示のちらつきを避けるため同期実行します）。

### アイコンフォント対策

次のいずれかに当てはまるものを「アイコンフォントの可能性」として扱い、**初期状態では未選択**にします。

- フォント名に `icon` を含む（語頭境界つき。`Silicon` のような通常のフォント名は誤検出しません）
- Font Awesome / Material Icons / Material Symbols / Glyphicons / Ionicons / Lucide / Phosphor /
  RemixIcon / Bootstrap Icons / IcoMoon / Octicons などの既知のライブラリ名
- Unicode Private Use Area の文字を含む要素の比率が 40% 以上

ページ全体適用時は、`code` / `pre` / `kbd` / `samp` / `svg` などと上記ライブラリのクラスを
**その子孫も含めて**除外します。`[class*="icon"]` のような広すぎる指定は使わず、
`.icon` / `[class^="icon-"]` / `[class*=" icon-"]` のように語境界を見ることで、
`pricing-icons-row` のような普通の要素まで除外しないようにしています。

### フォントの適用と解除

1. ポップアップ側で Google Fonts CSS API v2 から CSS を `fetch`
2. `browser.scripting.insertCSS()` で現在のタブへ `@font-face` 定義を挿入
3. 上書き用 CSS を別途挿入

`<link>` タグを差し込む方式ではないため、ページ側の CSP の影響を受けにくくなっています。

上書き CSS のセレクタは**すべて `html[data-mojikae-active="1"]` の配下**にあります。
そのため `removeCSS()` が失敗しても、この属性を外すだけで上書きが一切効かない状態へ戻せます。
挿入した CSS 文字列はページ側に控えてあり、解除時に `removeCSS()` へ正確に渡します。

個別 `font-family` の適用では、対象要素に `data-mojikae-group` を付け、その属性セレクタで上書きします。
サイト側のクラス・属性・インライン `style` は変更しません。

使用する data 属性は以下のとおりです（衝突しにくい prefix を付けています）。

```text
data-mojikae-active    有効化フラグ（<html>）
data-mojikae-mode      page / groups（<html>）
data-mojikae-font      適用中の Google Font 名（<html>）
data-mojikae-groups    選択中のグループ ID（<html>）
data-mojikae-group     個別適用の対象要素
data-mojikae-family    上書き前の font-family（個別適用の対象要素）
```

## Firefox と Chromium の差異

| 項目 | Chromium | Firefox |
| --- | --- | --- |
| マニフェスト | MV3 | MV3（WXT の既定は MV2 なので `manifestVersion: 3` を明示） |
| 拡張機能 ID | 不要 | `browser_specific_settings.gecko.id` が必須 |
| データ収集の申告 | 不要 | `data_collection_permissions` が必須（本拡張は `none`） |
| 最低バージョン | – | Firefox 128 以上 |
| ソース zip | 不要 | 審査で必要（`pnpm zip:firefox` が生成） |
| API 名 | `chrome.*` / `browser.*` | `browser.*` |

コード側は WXT が提供するクロスブラウザ対応の `browser` API（`wxt/browser`）だけを使っているため、
ブラウザごとの分岐はありません。差異はビルド設定に閉じています。

## 既知の制約

- **ページをリロードすると適用は消えます**（設計どおり。サイトごと・タブごとの永続設定は持ちません）。
- **iframe の中身は変わりません。** トップフレームのみが対象です。
- **ローカルフォントは扱えません。** Google Fonts のみが対象です。
- ページ側の CSS が `font-family` に `!important` を付けている場合、上書きしきれないことがあります。
- ページの CSP が `font-src` を厳しく制限している場合、`fonts.gstatic.com` のフォント読み込みが
  ブロックされてフォールバック表示になることがあります。
- `about:` / `chrome://` / `edge://` / 拡張機能管理画面 / 各種ストア / PDF ビューア / ローカルファイルでは
  動作しません（ブラウザがスクリプト注入を禁止しているため）。ポップアップに理由を表示します。
- Shadow DOM 内部は走査しません。
- 走査は 10,000 要素で打ち切ります（打ち切った場合はポップアップに表示します）。
- 斜体（italic）は読み込みません。MVP では通常体のみを対象にしています。
- ダークテーマ・サイトごとの設定保存・Google アカウント連携には対応しません。

## 今後追加できること

- 斜体やウェイトの個別指定
- サイトごとのプリセット保存（要 `storage` 設計の見直し）
- 適用前後のスクリーンショット比較
- 日本語以外のサブセット優先表示の切り替え
- Shadow DOM の走査

## ライセンス

社内利用を想定した非公開プロジェクトです。
