# プライバシーポリシー / Privacy Policy

最終更新日 / Last updated: 2026-08-06

---

## 日本語

Mojikae（以下「本拡張機能」）は、利用者の個人情報を収集しません。

### 収集しない情報

本拡張機能は、以下を**一切収集・送信・保存しません**。

- 閲覧しているページの URL、タイトル、内容
- 入力内容、Cookie、認証情報
- IP アドレス、端末情報、利用状況の統計（テレメトリ／アナリティクス）
- 個人を識別できるあらゆる情報

開発者が運営するサーバーはありません。本拡張機能が外部へデータを送る先は、後述の Google Fonts のみです。

### 端末内に保存する情報

以下のみをブラウザのローカルストレージ（`storage.local`）に保存します。**端末内にとどまり、外部へ送信されることはありません。**

| 保存する内容 | 上限 |
| --- | --- |
| 最近使用したフォント名 | 5 件 |
| プリセット（プリセット名と、選択したフォント名の並び） | 20 件 |

サイトの URL・タイトル・タブ情報・適用対象・適用状態は保存しません。
本拡張機能を削除すると、これらのデータも削除されます。

### 外部サービスへの通信

本拡張機能は Google Fonts（`fonts.googleapis.com` および `fonts.gstatic.com`）へ接続します。

- **発生する場面**: フォントを検索して結果を実際の書体で表示するとき、およびフォントをページへ適用するとき
- **送信される内容**: フォント名（および表示に必要な文字）のみ
- **送信されない内容**: 閲覧中のサイトの URL やページの内容

この通信はブラウザによる通常のウェブフォント読み込みであり、その際の Google の取り扱いは
[Google プライバシーポリシー](https://policies.google.com/privacy) および
[Google Fonts の FAQ](https://developers.google.com/fonts/faq/privacy) に従います。

### アクセス範囲

本拡張機能は `activeTab` 権限のみを使用し、**利用者がツールバーのアイコンを押したタブに限って**動作します。
他のタブや閲覧履歴にはアクセスできません。`<all_urls>` 権限は要求しません。

フォントの変更は現在のタブにのみ適用され、ページをリロードするとすべて元に戻ります。

### お問い合わせ

mojikae@sakuyasan.net

---

## English

Mojikae ("the extension") does not collect any personal information.

### What is never collected

The extension **never collects, transmits, or stores**:

- URLs, titles, or contents of the pages you visit
- Form input, cookies, or credentials
- IP addresses, device information, or usage analytics/telemetry
- Any personally identifiable information

There is no developer-operated server. The only external destination the extension
contacts is Google Fonts, described below.

### What is stored on your device

Only the following is stored in the browser's local storage (`storage.local`).
It **stays on your device and is never transmitted**.

| Stored data | Limit |
| --- | --- |
| Recently used font names | 5 entries |
| Presets (a preset name and the ordered list of selected font names) | 20 entries |

No site URLs, titles, tab information, applied targets, or applied state are stored.
Uninstalling the extension removes this data.

### Third-party requests

The extension connects to Google Fonts (`fonts.googleapis.com` and `fonts.gstatic.com`).

- **When**: while searching fonts (to render each result in its own typeface) and when applying a font to the page
- **What is sent**: font names only (plus the characters needed for rendering)
- **What is not sent**: the URL or content of the page you are viewing

These are ordinary web font requests made by the browser. Google's handling of them is
governed by the [Google Privacy Policy](https://policies.google.com/privacy) and the
[Google Fonts privacy FAQ](https://developers.google.com/fonts/faq/privacy).

### Scope of access

The extension uses only the `activeTab` permission and operates **solely on the tab where
you clicked the toolbar icon**. It cannot access other tabs or your browsing history, and
it does not request `<all_urls>`.

Font changes apply to the current tab only and are fully reverted when the page reloads.

### Contact

mojikae@sakuyasan.net
