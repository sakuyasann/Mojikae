# AMO 掲載情報（Listed submission）

addons.mozilla.org の Developer Hub にそのまま貼り付けるための原稿。

| 項目 | 値 |
| --- | --- |
| Name | `Mojikae` |
| Add-on URL slug | `mojikae` |
| Categories (Firefox desktop) | **Web Development** / **Appearance** |
| Support email | `mojikae@sakuyasan.net` |
| Support site | `https://github.com/sakuyasann/Mojikae` |
| Homepage | `https://github.com/sakuyasann/Mojikae` |
| License | **MIT License** |
| Privacy policy | 下の「Privacy policy（貼り付け用）」を使う |
| Experimental | いいえ |
| Source code required | **はい**（Vite でバンドル・minify しているため）→ `mojikae-<version>-sources.zip` |
| Data collection | なし（`data_collection_permissions.required: ["none"]` をマニフェストで宣言済み） |

AMO は 1 つのリスティングに複数言語を登録できます。既定を日本語にして、English を追加してください。

---

## Summary（250 文字以内）

### 日本語 — 118 文字

```
開いているページで使われているフォントを検出し、Google Fonts の書体へ一時的に差し替えて見比べられる拡張機能です。欧文と和文で別々の書体を組み合わせられます。変更は今のタブだけ、リロードで元に戻ります。
```

### English — 213 characters

```
Detects the fonts used on the current page and temporarily swaps them for Google Fonts so you can compare them in place. Pair a Latin face with a Japanese one. Changes affect only the current tab and vanish on reload.
```

---

## Description（貼り付け用 / HTML 可）

### 日本語

```html
<p>Mojikae は、いま開いている Web ページのフォントを Google Fonts の書体へ一時的に差し替えて、実際の画面のまま見比べるための拡張機能です。SaaS・管理画面・Web サイトのフォント選定に使えます。</p>

<p><strong>できること</strong></p>
<ul>
  <li>ページで実際に使われている font-family を検出して一覧表示</li>
  <li>ページ全体を差し替える／特定の font-family だけを差し替える</li>
  <li><strong>欧文と和文で別々の書体を組み合わせる</strong>（例: 見出しは Playfair Display、日本語は Zen Maru Gothic）</li>
  <li>検索結果のフォント名を、その書体自身で描画して選べる</li>
  <li>言語（日本語・キリル文字など）と種類（セリフ／サンセリフ／等幅など）で絞り込み</li>
  <li>人気順に並んだ 1,900 以上の Google Fonts から選択</li>
  <li>気に入った組み合わせをプリセットとして保存</li>
</ul>

<p><strong>安全な作りになっています</strong></p>
<ul>
  <li>変更は<strong>ツールバーのアイコンを押したタブだけ</strong>に適用され、<strong>リロードすればすべて元に戻ります</strong>。ページのファイルは書き換えません。</li>
  <li>アイコンフォント（Material Symbols、Font Awesome など）や等幅で組まれたコード部分は自動で判別し、差し替えません。</li>
  <li>必要な権限は activeTab / scripting / storage と Google Fonts のドメインだけです。<code>&lt;all_urls&gt;</code> は要求しません。</li>
  <li>閲覧履歴・URL・ページ内容を収集も送信もしません。端末に保存するのは、最近使ったフォント名とプリセットだけです。</li>
</ul>

<p><strong>使い方</strong></p>
<ol>
  <li>調べたいページでツールバーの Mojikae アイコンを押す</li>
  <li>検出されたフォントの一覧から適用対象を選ぶ（初期状態はページ全体）</li>
  <li>フォントを検索して選ぶ。2 つ以上選ぶと、1 つ目が欧文、2 つ目以降が日本語などの落ち先になります</li>
  <li>「適用」で切り替え、「解除」かリロードで元に戻す</li>
</ol>

<p>ソースコードは <a href="https://github.com/sakuyasann/Mojikae">GitHub</a> で MIT ライセンスのもとに公開しています。</p>
```

### English

```html
<p>Mojikae temporarily replaces the fonts on the page you are viewing with Google Fonts, so you can compare typefaces in the real interface instead of a mockup. Useful when picking type for a SaaS product, an admin dashboard, or a website.</p>

<p><strong>What it does</strong></p>
<ul>
  <li>Detects the font-family values actually in use on the page and lists them</li>
  <li>Override the whole page, or just one specific font-family</li>
  <li><strong>Combine a Latin face with a Japanese one</strong> (for example Playfair Display for Latin, Zen Maru Gothic for Japanese)</li>
  <li>Every search result is rendered in its own typeface</li>
  <li>Filter by language (Japanese, Cyrillic, Greek, and more) and by category (serif, sans-serif, monospace, and more)</li>
  <li>Over 1,900 Google Fonts, sorted by popularity</li>
  <li>Save font combinations as presets</li>
</ul>

<p><strong>Built to stay out of the way</strong></p>
<ul>
  <li>Changes apply <strong>only to the tab where you clicked the toolbar icon</strong> and are <strong>fully reverted on reload</strong>. Nothing on the page is modified permanently.</li>
  <li>Icon fonts (Material Symbols, Font Awesome, and similar) and monospaced code blocks are detected and left untouched.</li>
  <li>Requires only activeTab, scripting, storage, and the Google Fonts domains. It never requests <code>&lt;all_urls&gt;</code>.</li>
  <li>No browsing history, URLs, or page content is collected or transmitted. Only recently used font names and your presets are stored locally.</li>
</ul>

<p><strong>How to use it</strong></p>
<ol>
  <li>Open the page you want to test and click the Mojikae toolbar icon</li>
  <li>Choose what to override — the whole page by default, or a specific detected font-family</li>
  <li>Search and pick fonts. With two or more selected, the first covers Latin and the rest act as fallbacks for Japanese and other scripts</li>
  <li>Click Apply, then Release or simply reload to restore the original</li>
</ol>

<p>Source code is available on <a href="https://github.com/sakuyasann/Mojikae">GitHub</a> under the MIT License.</p>
```

---

## Privacy policy（貼り付け用）

`PRIVACY.md` の全文を貼り付けます。AMO のフィールドは Markdown を解釈しないため、
見出し記号や表を外した以下のプレーンテキスト版を使ってください。

```
Mojikae does not collect any personal information.

WHAT IS NEVER COLLECTED
The extension never collects, transmits, or stores the URLs, titles, or contents of the pages you visit; form input, cookies, or credentials; IP addresses, device information, or usage analytics; or any personally identifiable information. There is no developer-operated server.

WHAT IS STORED ON YOUR DEVICE
Only two things are stored in the browser's local storage, and they never leave your device: up to 5 recently used font names, and up to 20 presets (a preset name plus the ordered list of selected font names). No site URLs, titles, tab information, or applied state are stored. Uninstalling the extension removes this data.

THIRD-PARTY REQUESTS
The extension connects to Google Fonts (fonts.googleapis.com and fonts.gstatic.com) when you search for fonts, so each result can be rendered in its own typeface, and when you apply a font to the page. Only font names and the characters needed for rendering are sent. The URL and content of the page you are viewing are never sent. These are ordinary web font requests made by the browser; Google's handling of them is governed by the Google Privacy Policy (https://policies.google.com/privacy) and the Google Fonts privacy FAQ (https://developers.google.com/fonts/faq/privacy).

SCOPE OF ACCESS
The extension uses only the activeTab permission and operates solely on the tab where you clicked the toolbar icon. It cannot access other tabs or your browsing history, and it does not request <all_urls>. Font changes apply to the current tab only and are fully reverted when the page reloads.

CONTACT
mojikae@sakuyasan.net

Japanese version: https://github.com/sakuyasann/Mojikae/blob/main/PRIVACY.md
```

---

## Notes for reviewers（貼り付け用）

```
Thank you for reviewing Mojikae.

SOURCE CODE
This add-on is bundled and minified with WXT (Vite + esbuild), so full source is
attached as mojikae-<version>-sources.zip. Build instructions are in SOURCE_BUILD.md
at the root of that archive. Summary:

  corepack enable
  corepack prepare pnpm@10.24.0 --activate
  pnpm install --frozen-lockfile
  pnpm zip:firefox

This emits .output/mojikae-<version>-firefox.zip and .output/firefox-mv3/.
The build is deterministic: building twice from a clean checkout produces
byte-identical output (verified by comparing SHA-256 of every emitted file), so
`diff -r` against the submitted package returns no differences.

Node 24 (reviewer default 24.14.0 is fine) and pnpm 10.24.0 are used. pnpm-lock.yaml
is included. All tooling is open source and runs locally. No obfuscation is used --
minification is esbuild's production default.

NOT PART OF THE BUILD
- data/google-fonts.json is a committed snapshot of the Google Fonts catalog, so the
  build needs no API key. It is refreshed separately by `pnpm fonts:sync`.
- components/Logo.tsx is generated from assets/*.svg by scripts/build-logo.mjs and is
  committed. Not run during the build.

HOW TO TEST
1. Open any content-heavy page (for example https://developer.mozilla.org/).
2. Click the Mojikae toolbar icon. The popup lists the font-family values detected on
   that page via getComputedStyle. No CSS rules are read and no network request is made
   at this point.
3. Leave the target as the whole page, search for a font (results are rendered in their
   own typeface via the Google Fonts CSS API), select it, and press the Apply button.
   The page fonts change.
4. Press Release, or reload the page. Everything returns to the original state; the
   override is scoped under html[data-mojikae-active="1"] and removing that one
   attribute neutralizes all injected CSS.
5. To test the Latin + Japanese pairing, select two fonts (for example "Playfair
   Display" then "Zen Maru Gothic") and apply.

PERMISSIONS
- activeTab: the popup only ever touches the tab the user clicked the icon on. The
  `tabs` permission is not requested and no URL is read beyond checking the scheme is
  http/https.
- scripting: executeScript for detection, insertCSS/removeCSS for the override.
- storage: recently used font names (max 5) and presets (max 20). Nothing site-related.
- fonts.googleapis.com / fonts.gstatic.com: loading @font-face definitions and the font
  files. <all_urls> is not requested.

No data collection occurs; the manifest declares
browser_specific_settings.gecko.data_collection_permissions.required = ["none"].

Privacy policy: https://github.com/sakuyasann/Mojikae/blob/main/PRIVACY.md
```

---

## スクリーンショット

`store/screenshots/` に格納。AMO は 1 枚以上、推奨サイズ 1280×800（最大 4096×4096、PNG/JPG）。

| ファイル | キャプション（日本語） | Caption (English) |
| --- | --- | --- |
| `01-selected.png` | 欧文と和文の書体を組み合わせて、適用対象を選ぶ | Combine a Latin and a Japanese typeface, then choose what to override |
| `02-search.png` | 検索結果はその書体自身で描画され、言語と種類で絞り込める | Every result is rendered in its own typeface, filterable by language and category |
