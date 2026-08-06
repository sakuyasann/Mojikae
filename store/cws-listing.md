# Chrome Web Store 掲載情報

[Developer Dashboard](https://chrome.google.com/webstore/devconsole) に貼り付けるための原稿。

アップロードするファイルは `.output/mojikae-<version>-chrome.zip`（`pnpm zip` で生成）。
AMO と違い、**ソースコードの提出は不要**（Chrome Web Store は minify されたコードをそのまま審査する）。

| 項目 | 値 |
| --- | --- |
| アイテム名 | `Mojikae` |
| カテゴリ | **開発者ツール（Developer Tools）** |
| 言語 | 日本語（既定）＋ English |
| アイコン | パッケージ内の `icon/128.png` が自動で使われる |
| スクリーンショット | `store/screenshots-chrome/*.png`（1280×800、2 枚） |
| プライバシーポリシー URL | `https://github.com/sakuyasann/Mojikae/blob/main/PRIVACY.md` |
| サポートメール | `mojikae@sakuyasan.net` |
| 公開範囲 | 一般公開 |

Chrome Web Store のスクリーンショットは **1280×800 または 640×400 ちょうど**が要求されるため、
AMO 用（2400×1500）とは別に生成する。

```bash
SHOT_SCALE=1 SHOT_DIR=screenshots-chrome node store/build-screenshots.mjs
```

---

## 概要（132 文字以内）

### 日本語 — 66 文字

```
開いているページのフォントを Google Fonts へ一時的に差し替えて見比べられます。欧文と和文の組み合わせも可能。リロードで元に戻ります。
```

### English — 119 characters

```
Temporarily swap the fonts on any page for Google Fonts to compare them in place. Pair a Latin face with a Japanese one.
```

---

## 説明（プレーンテキスト。HTML は使えません）

### 日本語

```
Mojikae は、いま開いている Web ページのフォントを Google Fonts の書体へ一時的に差し替えて、実際の画面のまま見比べるための拡張機能です。SaaS・管理画面・Web サイトのフォント選定に使えます。

■ できること

・ページで実際に使われている font-family を検出して一覧表示
・ページ全体を差し替える／特定の font-family だけを差し替える
・欧文と和文で別々の書体を組み合わせる（例: 見出しは Playfair Display、日本語は Zen Maru Gothic）
・検索結果のフォント名を、その書体自身で描画して選べる
・言語（日本語・キリル文字など）と種類（セリフ／サンセリフ／等幅など）で絞り込み
・人気順に並んだ 1,900 以上の Google Fonts から選択
・気に入った組み合わせをプリセットとして保存

■ 安全な作りになっています

・変更はツールバーのアイコンを押したタブだけに適用され、リロードすればすべて元に戻ります。ページのファイルは書き換えません。
・アイコンフォント（Material Symbols、Font Awesome など）や等幅で組まれたコード部分は自動で判別し、差し替えません。
・必要な権限は activeTab / scripting / storage と Google Fonts のドメインだけです。全サイトへのアクセス権限は要求しません。
・閲覧履歴・URL・ページ内容を収集も送信もしません。端末に保存するのは、最近使ったフォント名（最大 5 件）とプリセット（最大 20 件）だけです。

■ 使い方

1. 調べたいページでツールバーの Mojikae アイコンを押す
2. 検出されたフォントの一覧から適用対象を選ぶ（初期状態はページ全体）
3. フォントを検索して選ぶ。2 つ以上選ぶと、1 つ目が欧文、2 つ目以降が日本語などの落ち先になります
4. 「適用」で切り替え、「解除」かリロードで元に戻す

ソースコードは MIT ライセンスのもとに公開しています。
https://github.com/sakuyasann/Mojikae
```

### English

```
Mojikae temporarily replaces the fonts on the page you are viewing with Google Fonts, so you can compare typefaces in the real interface instead of a mockup. Useful when picking type for a SaaS product, an admin dashboard, or a website.

WHAT IT DOES

- Detects the font-family values actually in use on the page and lists them
- Override the whole page, or just one specific font-family
- Combine a Latin face with a Japanese one (for example Playfair Display for Latin, Zen Maru Gothic for Japanese)
- Every search result is rendered in its own typeface
- Filter by language (Japanese, Cyrillic, Greek, and more) and by category (serif, sans-serif, monospace, and more)
- Over 1,900 Google Fonts, sorted by popularity
- Save font combinations as presets

BUILT TO STAY OUT OF THE WAY

- Changes apply only to the tab where you clicked the toolbar icon and are fully reverted on reload. Nothing on the page is modified permanently.
- Icon fonts (Material Symbols, Font Awesome, and similar) and monospaced code blocks are detected and left untouched.
- Requires only activeTab, scripting, storage, and the Google Fonts domains. It never requests access to all sites.
- No browsing history, URLs, or page content is collected or transmitted. Only recently used font names (max 5) and your presets (max 20) are stored locally.

HOW TO USE IT

1. Open the page you want to test and click the Mojikae toolbar icon
2. Choose what to override - the whole page by default, or a specific detected font-family
3. Search and pick fonts. With two or more selected, the first covers Latin and the rest act as fallbacks for Japanese and other scripts
4. Click Apply, then Release or simply reload to restore the original

Source code is available under the MIT License.
https://github.com/sakuyasann/Mojikae
```

---

## プライバシー タブ（必須項目）

Chrome Web Store は、ここが埋まっていないと審査に進めません。

### 単一用途の説明（Single purpose）

```
Mojikae has a single purpose: to let the user preview Google Fonts on the page they are currently viewing. When the user clicks the toolbar icon, the extension detects which font-family values that page uses and can temporarily override them with fonts loaded from Google Fonts, so the user can compare typefaces in a real layout. The override is applied only to that tab and is fully reverted when the page reloads.
```

### 権限の理由（Permission justification）

各欄にそのまま貼れる形。

| 権限 | 理由 |
| --- | --- |
| `activeTab` | ```Mojikae only acts on the tab where the user clicked the toolbar icon. activeTab grants access to that single tab at that moment, which is what the extension needs to read its fonts and apply the preview. It deliberately does not request the "tabs" permission or host permissions for websites, so it has no access to any other tab and no access to browsing history.``` |
| `scripting` | ```The extension uses scripting.executeScript to read the computed font-family of elements on the active tab (via getComputedStyle), and scripting.insertCSS / removeCSS to apply and remove the temporary font override. Injected CSS is scoped under a single attribute on the html element, so removing that attribute reverts every change.``` |
| `storage` | ```Used only to remember the user's own choices between sessions: the last 5 font names they used, and up to 20 saved font combinations ("presets"). Nothing is stored about the sites the user visits - no URLs, titles, tab information, or page content.``` |
| ホスト権限<br>`fonts.googleapis.com`<br>`fonts.gstatic.com` | ```These two domains are Google Fonts. fonts.googleapis.com returns the @font-face definitions for the fonts the user selects, and fonts.gstatic.com serves the font files those definitions reference. Only font names and the characters needed for rendering are sent. No host permission for any website is requested - the extension never sees or transmits the URL or content of the pages the user visits.``` |

### リモートコードの使用

**「いいえ、リモートコードは使用していません」** を選択。

Chrome Web Store の定義するリモートコードは **JavaScript と WebAssembly** で、CSS・ウェブフォント・
JSON などのデータは含まれません。Mojikae が外部から取得するのは Google Fonts の CSS（`@font-face`）と
フォントファイルだけで、実行されるコードはすべてパッケージ内にあります。

### データの使用（Data usage）

すべて **「収集していない」** を選択したうえで、末尾の 3 つの証明にチェック。

| 種別 | 収集の有無 |
| --- | --- |
| 個人を特定できる情報 | なし |
| 健康情報 | なし |
| 金融情報・支払い情報 | なし |
| 認証情報 | なし |
| 個人的なやり取り | なし |
| 位置情報 | なし |
| ウェブ閲覧履歴 | なし |
| ユーザーの操作履歴 | なし |
| ウェブサイトのコンテンツ | なし |

証明（3 つともチェック）

- 承認された用途以外にデータを販売・転送していない
- アイテムの単一用途と無関係な目的でデータを使用・転送していない
- 信用調査や融資目的でデータを使用・転送していない

### プライバシーポリシー URL

```
https://github.com/sakuyasann/Mojikae/blob/main/PRIVACY.md
```

---

## 提出前の確認

- [ ] Chrome Web Store デベロッパー登録（**一回だけ 5 USD の登録料**が必要。支払いは本人が行うこと）
- [ ] `pnpm zip` で `.output/mojikae-<version>-chrome.zip` を生成
- [ ] スクリーンショットは 1280×800 ちょうどのものを使う（AMO 用の 2400×1500 は不可）
- [ ] プライバシー タブをすべて埋める（ここが未記入だと審査に進まない）
