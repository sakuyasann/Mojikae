import { encodeFamilyName } from './google-fonts-url';

/**
 * 検索結果のフォント名を「そのフォント自身」で描画するための読み込み処理。
 *
 * ポップアップは拡張機能ページなので、Google Fonts CSS を `<link>` で読み込める
 * （MV3 の既定 CSP は script-src / object-src しか制限しない）。
 *
 * 一覧に出るフォントをすべて完全な形で読むと重いため、CSS API v2 の `text=`
 * パラメータで「実際に描画する文字だけ」に絞ったサブセットを 1 リクエストで取得する。
 * フォント名は英数字が中心なので、これで数十フォントでも数 KB に収まる。
 */

const CSS_API_ENDPOINT = 'https://fonts.googleapis.com/css2';

/** 一度に読み込むフォント数の上限。URL 長と転送量の保険。 */
export const PREVIEW_FAMILY_LIMIT = 60;

/** `<link>` を識別するための id。 */
const PREVIEW_LINK_ID = 'mojikae-font-preview';

/**
 * プレビュー用の CSS URL を作る。描画に必要な文字だけを `text=` で要求する。
 * 読み込むものが無ければ null。
 */
export function buildPreviewCssUrl(families: readonly string[]): string | null {
  const unique = [...new Set(families)].slice(0, PREVIEW_FAMILY_LIMIT);
  if (unique.length === 0) return null;

  // 表示に使う文字の集合（重複を除く）。順序を固定して無駄な再読み込みを防ぐ。
  const characters = [...new Set(unique.join(''))].sort().join('');
  if (characters === '') return null;

  const params = unique
    .slice()
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((family) => `family=${encodeFamilyName(family)}`)
    .join('&');

  return `${CSS_API_ENDPOINT}?${params}&text=${encodeURIComponent(characters)}&display=swap`;
}

/**
 * プレビュー用スタイルシートを差し替える。
 * 同じ URL なら何もしないので、再レンダリングのたびに再取得されることはない。
 */
export function loadPreviewFonts(families: readonly string[]): void {
  const url = buildPreviewCssUrl(families);
  const existing = document.getElementById(PREVIEW_LINK_ID) as HTMLLinkElement | null;

  if (url === null) {
    existing?.remove();
    return;
  }
  if (existing) {
    if (existing.href !== url) existing.href = url;
    return;
  }

  const link = document.createElement('link');
  link.id = PREVIEW_LINK_ID;
  link.rel = 'stylesheet';
  link.href = url;
  // 読み込みに失敗してもフォールバック表示で動き続けるので、握りつぶさず記録だけする
  link.addEventListener('error', () => {
    console.warn('[Mojikae] フォントプレビューの読み込みに失敗しました');
  });
  document.head.appendChild(link);
}

/**
 * プレビュー描画に使う font-family 値。
 * 未読み込みでもレイアウトが崩れないよう、必ず総称ファミリーを添える。
 */
export function previewFontFamily(family: string, category: string): string {
  const generic =
    category === 'serif'
      ? 'serif'
      : category === 'monospace'
        ? 'monospace'
        : category === 'handwriting'
          ? 'cursive'
          : 'sans-serif';
  return `"${family.replace(/"/g, '')}", ${generic}`;
}
