/**
 * 同期前後の google-fonts.json を比較し、GitHub Actions の出力へ差分サマリを書き出す。
 *
 *   node scripts/diff-google-fonts.mjs <before.json> <after.json>
 *
 * `generatedAt` は実行のたびに変わるため、フォント本体に差分があるときだけ
 * `changed=true` を出力し、無駄な PR が作られないようにしている。
 */

import { appendFileSync, readFileSync } from 'node:fs';

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) {
  console.error('usage: node scripts/diff-google-fonts.mjs <before.json> <after.json>');
  process.exit(1);
}

const readCatalog = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { generatedAt: '', fonts: [] };
  }
};

const before = readCatalog(beforePath);
const after = readCatalog(afterPath);

const toMap = (catalog) => new Map((catalog.fonts ?? []).map((font) => [font.family, font]));
const beforeMap = toMap(before);
const afterMap = toMap(after);

const added = [...afterMap.keys()].filter((family) => !beforeMap.has(family)).sort();
const removed = [...beforeMap.keys()].filter((family) => !afterMap.has(family)).sort();
const updated = [...afterMap.keys()]
  .filter((family) => {
    const previous = beforeMap.get(family);
    if (!previous) return false;
    return JSON.stringify(previous) !== JSON.stringify(afterMap.get(family));
  })
  .sort();

const changed = added.length > 0 || removed.length > 0 || updated.length > 0;

/** PR 本文が壊れないよう、一覧は先頭 50 件までに抑える。 */
const toList = (families) => {
  if (families.length === 0) return 'なし';
  const shown = families.slice(0, 50).map((family) => `- ${family}`);
  if (families.length > 50) shown.push(`- ほか ${families.length - 50} 件`);
  return shown.join('\n');
};

const outputs = {
  changed: String(changed),
  added: String(added.length),
  removed: String(removed.length),
  updated: String(updated.length),
  total: String(afterMap.size),
  generated_at: after.generatedAt ?? '',
  added_list: toList(added),
  removed_list: toList(removed),
};

const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) {
  // 複数行の値はヒアドキュメント形式で書く必要がある（%0A 形式は廃止済み）
  const delimiter = 'FP_EOF_5f3a91c2';
  const body = Object.entries(outputs)
    .map(([key, value]) =>
      value.includes('\n') ? `${key}<<${delimiter}\n${value}\n${delimiter}\n` : `${key}=${value}\n`,
    )
    .join('');
  appendFileSync(outputFile, body);
}

console.log(
  `changed=${outputs.changed} added=${outputs.added} removed=${outputs.removed} ` +
    `updated=${outputs.updated} total=${outputs.total}`,
);
