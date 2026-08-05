# Mojikae

現在開いているタブの Web サイトで使われているフォントを検出し、**Google Fonts のフォントへ一時的に上書きして比較**するためのブラウザ拡張機能です。

SaaS・管理画面・Web サイトのフォント選定を主な用途としています。

- ページ全体のフォントを Google Font へ変更する
- ページ内で使われている特定の `font-family` だけを選んで変更する
- **複数フォントを組み合わせて適用する**（英数字と日本語で別のフォントを使い分けられる）
- **検索結果のフォント名を、そのフォント自身で描画して選ぶ**

変更は**現在のタブにだけ**適用され、**ページをリロードするとすべて元に戻ります**。

## 技術構成

| 項目 | 内容 |
| --- | --- |
| フレームワーク | [WXT](https://wxt.dev/) 0.21 |
| UI | React 19 / TypeScript（strict） |
| パッケージマネージャ | pnpm |
| マニフェスト | Manifest V3（Chromium / Firefox とも） |
| 対応ブラウザ | Chrome, Edge などの Chromium 系, Firefox 142+ |
| スタイル | 素の CSS + CSS Modules（UI ライブラリなし） |
| デザイン | Apple Human Interface Guidelines 準拠（macOS / iOS 風） |
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

Firefox が専用プロファイルで起動し、拡張機能が読み込まれた状態になります。ソースを編集すると自動で再読み込みされます。

> 通常版 Firefox ではなく Developer Edition / Nightly を使いたい場合は、リポジトリ直下に
> `web-ext.config.ts` を置いて起動するバイナリを指定します（環境依存なので `.gitignore` 済み）。
>
> ```ts
> import { defineWebExtConfig } from 'wxt';
> export default defineWebExtConfig({ binaries: { firefox: 'deved' } });
> ```
>
> 指定できるのは `firefox` / `beta` / `nightly` / `deved`、または実行ファイルの絶対パスです。

## Firefox へのインストール

Firefox は署名のないアドオンの扱いが Chromium より厳しく、目的によって手順が変わります。

### 方法 1: 一時的に入れて試す（どの Firefox でも可）

```bash
pnpm build:firefox
```

1. `about:debugging#/runtime/this-firefox` を開く
2. 「一時的なアドオンを読み込む」を押す
3. `.output/firefox-mv3/manifest.json` を選ぶ

いま使っているプロファイルにそのまま入るので、普段のブックマークやログイン状態のまま試せます。
**Firefox を再起動すると消えます。**

### 方法 2: 署名なしで恒久インストール（Developer Edition / Nightly / ESR のみ）

```bash
pnpm zip:firefox
cp .output/mojikae-<version>-firefox.zip .output/mojikae-<version>-firefox.xpi
```

1. `about:config` を開き、`xpinstall.signatures.required` を `false` にする
2. `about:addons` → 歯車アイコン → 「ファイルからアドオンをインストール」
3. 上で作った `.xpi` を選ぶ

再起動しても残ります。**通常版（Release）Firefox ではこの設定が効かない**ため、この方法は使えません。

### 方法 3: AMO で署名して通常版 Firefox に入れる

[addons.mozilla.org](https://addons.mozilla.org/developers/addon/api/key/) で API 資格情報を発行し、
ストアには公開せず（unlisted）署名だけを受けます。

```bash
pnpm exec web-ext sign \
  --source-dir .output/firefox-mv3 \
  --artifacts-dir .output \
  --channel unlisted \
  --api-key "$AMO_JWT_ISSUER" \
  --api-secret "$AMO_JWT_SECRET"
```

署名済み `.xpi` が `.output` に出力され、通常版 Firefox へ恒久インストールできます。
`browser_specific_settings.gecko.id`（`mojikae@sakuyasan.net`）が署名の識別子になるため、変更しないでください。

### パッケージの検証

```bash
pnpm exec web-ext lint --source-dir .output/firefox-mv3 --no-config-discovery
```

`errors: 0` であれば AMO の自動検査は通ります。React の内部実装が `innerHTML` を使っているため
`UNSAFE_VAR_ASSIGNMENT` の警告が 2 件出ますが、これは React を使う拡張機能では共通で、審査上の問題にはなりません。

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
- **Google Fonts への通信が発生します。** 通信するのは次の 2 つの場面で、いずれも送るのはフォント名だけです。
  - **フォントを検索したとき**: 検索結果の名前をそのフォントで描画するため、表示中のフォントの
    サブセット（描画に必要な文字だけ）を取得します。
  - **フォントを適用したとき**: `fonts.googleapis.com` から `@font-face` 定義を取得し、
    そこから参照される `fonts.gstatic.com` のフォントファイルをページが読み込みます。

  閲覧中のサイトの URL やページ内容が Google へ送られることはありません。
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

Google Fonts のカタログ自体にも Material Icons / Material Symbols 系のアイコンフォントが含まれます。
これらは検索結果に残しつつ「アイコン」ラベルを付け、選択した場合は本文向きでない旨を警告します
（適用そのものは妨げません）。

ページ全体適用時は、`code` / `pre` / `kbd` / `samp` / `svg` などと上記ライブラリのクラスを
**その子孫も含めて**除外します。`[class*="icon"]` のような広すぎる指定は使わず、
`.icon` / `[class^="icon-"]` / `[class*=" icon-"]` のように語境界を見ることで、
`pricing-icons-row` のような普通の要素まで除外しないようにしています。

### 複数フォントの組み合わせ

選択したフォントは選んだ順に `font-family` へ並びます。

```css
font-family: "Playfair Display", "Noto Sans JP", serif !important;
```

ブラウザは字形を持たないフォントを 1 文字単位で読み飛ばすため、
**英数字は 1 番目のフォント、日本語は 2 番目のフォント**という使い分けになります
（`Playfair Display` は日本語字形を持たないので、日本語だけ `Noto Sans JP` が使われる）。

ポップアップでは行左端のハンドル（≡）を**ドラッグ**して優先順位を入れ替えられます。
ドラッグはポインタ操作でしか使えないため、ハンドルにフォーカスした状態の**上下キー**でも移動できます。
総称フォールバック（`serif` / `sans-serif` など）は先頭フォントのカテゴリから決めるので、
並べ替えると追随して変わります。

Google Fonts CSS API へのリクエストは `family=` を並べて 1 回にまとめます。

### フォント名のプレビュー

検索結果とフォント一覧では、フォント名をそのフォント自身で描画します。
一覧に出るフォントを完全な形で読むと重いため、CSS API v2 の `text=` パラメータで
**実際に描画する文字だけ**に絞ったサブセットを 1 リクエストで取得しています（数十フォントでも数 KB）。

ポップアップは拡張機能ページなので、MV3 の既定 CSP（`script-src` / `object-src` のみ制限）の下で
外部スタイルシートとフォントを読み込めます。

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
data-mojikae-font      適用中の Google Font 名（<html>・複数はカンマ区切り）
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
| 最低バージョン | – | Firefox 142 以上（`data_collection_permissions` の導入バージョン） |
| 署名なしの恒久インストール | 可（デベロッパーモード） | Developer Edition / Nightly / ESR のみ |
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

## UI のデザイン方針

Apple の Human Interface Guidelines に沿った macOS / iOS アプリ風の見た目にしています。

- **色**: システムカラー（`#007aff` / `#34c759` / `#ff3b30`）。グレーは不透明色ではなく半透明を重ねて、
  Apple のセマンティックカラーと同じく下地に馴染ませる
- **リスト**: iOS 設定アプリの grouped inset 形式。薄いグレーの下地に白い角丸カード（10px）を並べ、
  区切り線は左端をインセットしたヘアライン（0.5px）
- **コントロール**: 主ボタンは塗りつぶし、副ボタンは白地 + 薄い影。スイッチは iOS 標準のピル型
- **書体**: `-apple-system` / SF Pro。日本語は Hiragino Sans へフォールバック
- **フォーカス**: 角丸に沿った青いリング（`:focus-visible`）

状態は色だけに頼らず、スイッチのつまみ位置・チェックマーク・優先順位の数字・記号つきラベルでも示しています。

ダークテーマには対応していません（`color-scheme: light` を明示）。

## UI のライブプレビュー

ポップアップ UI を拡張機能の外で動かして、HMR で確認しながら編集できます。
`.preview/`（`.gitignore` 済み）に dev サーバの設定を置く方式です。

```bash
pnpm exec vite --config .preview/vite.config.ts
```

`wxt/browser` をスタブへ差し替え、タブ操作だけをダミーにして、カタログ JSON と storage は実体に近い挙動にします。

## 今後追加できること

- 斜体やウェイトの個別指定
- サイトごとのプリセット保存（要 `storage` 設計の見直し）
- 適用前後のスクリーンショット比較
- 日本語以外のサブセット優先表示の切り替え
- Shadow DOM の走査

## ライセンス

社内利用を想定した非公開プロジェクトです。
