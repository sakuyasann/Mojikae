import { readFileSync, writeFileSync } from 'node:fs';

/** assets の SVG から components/Logo.tsx を生成する（アセットとコードの二重管理を避けるため）。 */

const root = new URL('../', import.meta.url);
const mark = readFileSync(new URL('assets/logo-mark.svg', root), 'utf8');
const word = readFileSync(new URL('assets/logo-wordmark.svg', root), 'utf8');

const markPaths = [...mark.matchAll(/<path d="([^"]+)"\s*\/>/g)].map((m) => m[1]);
const circle = mark.match(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)" fill="([^"]+)"/);
const wordPath = word.match(/<path fill="currentColor" d="([^"]+)"/)[1];
const wordViewBox = word.match(/viewBox="([^"]+)"/)[1];

if (markPaths.length !== 7 || !circle) {
  throw new Error(`マーク SVG の構造が想定と違います (paths=${markPaths.length}, circle=${Boolean(circle)})`);
}

const q = String.fromCharCode(39); // '
const tsx = `type LogoProps = {
  /** ロゴマークの一辺（px）。ロゴタイプの高さはこれに追従する。 */
  size?: number;
  className?: string;
};

/**
 * Mojika のロゴ（マーク + ロゴタイプ）。
 *
 * このファイルは .preview/build-logo.mjs が assets/*.svg から生成している。
 * 直接編集せず、assets 側を直して再生成すること。
 * インライン展開なのでネットワークもフォント読み込みも発生せず、拡大しても滲まない。
 */
export function Logo({ size = 24, className }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: ${q}inline-flex${q}, alignItems: ${q}center${q}, gap: size * 0.22 }}
      role="img"
      aria-label="Mojika"
    >
      {/* マーク：スキャン枠 + m + アクセントドット。
          viewBox は中身の実寸（96..416）に切り詰めてある。0 0 512 512 のままだと
          周囲に約 19% の余白が入り、ロゴタイプとの間が開いて見えてしまう。 */}
      <svg width={size} height={size} viewBox="96 96 320 320" aria-hidden="true">
        <g fill="none" stroke="#232b33" strokeWidth={32} strokeLinecap="round" strokeLinejoin="round">
${markPaths.map((d) => `          <path d="${d}" />`).join('\n')}
        </g>
        <circle cx="${circle[1]}" cy="${circle[2]}" r="${circle[3]}" fill="${circle[4]}" />
      </svg>

      {/* ロゴタイプ（Baloo 2 ExtraBold のアウトライン） */}
      <svg height={size * 0.58} viewBox="${wordViewBox}" aria-hidden="true">
        <path fill="#232b33" d="${wordPath}" />
      </svg>
    </span>
  );
}
`;

writeFileSync(new URL('components/Logo.tsx', root), tsx);
console.log(`components/Logo.tsx を生成しました（マーク ${markPaths.length} パス / ロゴタイプ ${wordPath.length} 文字）`);
