import { describe, expect, it } from 'vitest';
import { groupScanEntries } from '../lib/tab-scanner';

describe('groupScanEntries', () => {
  it('表記の違う同じ font-family をひとつのグループへまとめる', () => {
    const groups = groupScanEntries([
      { raw: 'Inter, "Helvetica Neue", Arial, sans-serif', count: 400, puaCount: 0 },
      { raw: '"Inter", \'Helvetica Neue\', Arial, sans-serif', count: 26, puaCount: 0 },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.elementCount).toBe(426);
    expect(groups[0]?.displayName).toBe('Inter');
    expect(groups[0]?.fontFamily).toBe('Inter, "Helvetica Neue", Arial, sans-serif');
    expect(groups[0]?.rawFamilies).toHaveLength(2);
  });

  it('要素数の多い順に並べる', () => {
    const groups = groupScanEntries([
      { raw: 'Arial', count: 38, puaCount: 0 },
      { raw: 'Inter, sans-serif', count: 426, puaCount: 0 },
      { raw: 'SFMono-Regular, monospace', count: 16, puaCount: 0 },
    ]);

    expect(groups.map((group) => group.displayName)).toEqual(['Inter', 'Arial', 'SFMono-Regular']);
    expect(groups.map((group) => group.elementCount)).toEqual([426, 38, 16]);
  });

  it('アイコンフォントの可能性を判定する', () => {
    const groups = groupScanEntries([
      { raw: '"Material Symbols Rounded"', count: 12, puaCount: 0 },
      { raw: 'Inter, sans-serif', count: 426, puaCount: 0 },
    ]);

    const icon = groups.find((group) => group.displayName === 'Material Symbols Rounded');
    const text = groups.find((group) => group.displayName === 'Inter');
    expect(icon?.isPossibleIconFont).toBe(true);
    expect(text?.isPossibleIconFont).toBe(false);
  });

  it('同じ font-family なら再スキャンしても ID が変わらない', () => {
    const first = groupScanEntries([{ raw: 'Inter, sans-serif', count: 10, puaCount: 0 }]);
    const second = groupScanEntries([{ raw: '"Inter", sans-serif', count: 99, puaCount: 0 }]);
    expect(first[0]?.id).toBe(second[0]?.id);
  });

  it('件数が同じときは名前順にして並びを安定させる', () => {
    const groups = groupScanEntries([
      { raw: 'Zeta', count: 5, puaCount: 0 },
      { raw: 'Alpha', count: 5, puaCount: 0 },
    ]);
    expect(groups.map((group) => group.displayName)).toEqual(['Alpha', 'Zeta']);
  });
});
