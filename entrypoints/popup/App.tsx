import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionBar, type BusyKind } from '../../components/ActionBar';
import { DetectedFontList } from '../../components/DetectedFontList';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FontSearch } from '../../components/FontSearch';
import { Header } from '../../components/Header';
import { RecentFonts } from '../../components/RecentFonts';
import { SelectedFonts } from '../../components/SelectedFonts';
import { getActiveTab } from '../../lib/active-tab';
import { ERROR_MESSAGES, formatErrorMessage, toExtensionError } from '../../lib/extension-errors';
import { findFontByFamily, loadCatalog, loadRecentFonts, pushRecentFont } from '../../lib/google-fonts';
import { applyFont, releaseFont, type ApplyTarget } from '../../lib/tab-injector';
import { scanActiveTab, type TabScanResult } from '../../lib/tab-scanner';
import { readTabState } from '../../lib/tab-state';
import type { GoogleFont } from '../../types/google-font';
import styles from './App.module.css';

/**
 * ポップアップのオーケストレーション。
 * ブラウザ API と DOM 走査は lib/ 側に閉じ込め、ここでは状態遷移だけを扱う。
 */
export default function App() {
  const [ready, setReady] = useState(false);
  /** ページ自体が操作できない場合のエラー。表示したら他の UI は出さない。 */
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<GoogleFont[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  /** 適用するフォント。配列の順序がそのまま font-family の指定順になる。 */
  const [selectedFonts, setSelectedFonts] = useState<GoogleFont[]>([]);

  const [scan, setScan] = useState<TabScanResult | null>(null);
  const [wholePage, setWholePage] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<ReadonlySet<string>>(() => new Set());

  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState<BusyKind>(null);

  const tabIdRef = useRef<number | null>(null);
  /** 連打対策。state の反映を待たずに二重実行を弾く。 */
  const busyRef = useRef(false);
  const initializedRef = useRef(false);

  const groups = useMemo(() => scan?.groups ?? [], [scan]);

  const runScan = useCallback(async (tabId: number) => {
    setBusy('scan');
    try {
      const result = await scanActiveTab(tabId);
      setScan(result);
      // 消えた font-family の選択は落とす（ID は font-family から決まるので再スキャンでも安定）
      const availableIds = new Set(result.groups.map((group) => group.id));
      setSelectedGroupIds((current) => new Set([...current].filter((id) => availableIds.has(id))));
    } catch (caught) {
      setError(formatErrorMessage(toExtensionError(caught, 'SCAN_FAILED')));
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    // StrictMode の二重実行で 2 回スキャンしないようにする
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      let tabId: number;
      try {
        const tab = await getActiveTab();
        tabId = tab.id;
        tabIdRef.current = tab.id;
      } catch (caught) {
        setFatalError(formatErrorMessage(toExtensionError(caught, 'UNSUPPORTED_PAGE')));
        setReady(true);
        return;
      }

      let fonts: GoogleFont[] = [];
      try {
        fonts = await loadCatalog();
        setCatalog(fonts);
      } catch (caught) {
        setError(formatErrorMessage(toExtensionError(caught, 'CATALOG_LOAD_FAILED')));
      }

      try {
        setRecent(await loadRecentFonts());
      } catch (caught) {
        // 最近使用したフォントが読めなくても本体機能は使えるので続行する
        console.error('[Mojikae] 最近使用したフォントの読み込みに失敗しました', caught);
      }

      // ページ内の data 属性から適用状態を復元する。
      // ここで注入できないページは、以降の操作もすべて失敗するので致命扱いにする。
      try {
        const state = await readTabState(tabId);
        if (state.active) {
          setApplied(true);
          setWholePage(state.mode === 'page');
          setSelectedGroupIds(new Set(state.groupIds));
          const restored = state.fontFamilies
            .map((family) => findFontByFamily(fonts, family))
            .filter((font): font is GoogleFont => font !== undefined);
          if (restored.length > 0) setSelectedFonts(restored);
        }
      } catch (caught) {
        setFatalError(formatErrorMessage(toExtensionError(caught, 'UNSUPPORTED_PAGE')));
        setReady(true);
        return;
      }

      setReady(true);
      await runScan(tabId);
    };

    void initialize();
  }, [runScan]);

  /** 検索結果のクリックで選択・解除を切り替える。追加は末尾（優先度は低い側）へ。 */
  const toggleFont = useCallback((font: GoogleFont) => {
    setError(null);
    setSelectedFonts((current) =>
      current.some((entry) => entry.family === font.family)
        ? current.filter((entry) => entry.family !== font.family)
        : [...current, font],
    );
  }, []);

  const removeFont = useCallback((family: string) => {
    setSelectedFonts((current) => current.filter((entry) => entry.family !== family));
  }, []);

  /** 優先順位の入れ替え。先頭ほど優先される。 */
  const reorderFonts = useCallback((from: number, to: number) => {
    setSelectedFonts((current) => {
      if (from === to) return current;
      if (from < 0 || to < 0 || from >= current.length || to >= current.length) return current;
      const updated = [...current];
      const [moved] = updated.splice(from, 1);
      if (moved === undefined) return current;
      updated.splice(to, 0, moved);
      return updated;
    });
  }, []);

  const selectRecentFont = useCallback(
    (family: string) => {
      const font = findFontByFamily(catalog, family);
      if (!font) {
        setError(ERROR_MESSAGES.FONT_NOT_FOUND);
        return;
      }
      toggleFont(font);
    },
    [catalog, toggleFont],
  );

  const handleWholePageChange = useCallback(
    (next: boolean) => {
      setWholePage(next);
      if (next) {
        // ページ全体を選んだら個別選択はクリアする
        setSelectedGroupIds(new Set());
        return;
      }
      // 個別選択へ切り替えたときの初期値。アイコンフォントの可能性がある項目は未選択にする。
      setSelectedGroupIds((current) => {
        if (current.size > 0) return current;
        return new Set(groups.filter((group) => !group.isPossibleIconFont).map((group) => group.id));
      });
    },
    [groups],
  );

  const handleGroupToggle = useCallback((groupId: string, next: boolean) => {
    setSelectedGroupIds((current) => {
      const updated = new Set(current);
      if (next) {
        updated.add(groupId);
      } else {
        updated.delete(groupId);
      }
      return updated;
    });
  }, []);

  const applyNow = useCallback(async () => {
    if (busyRef.current) return;
    const tabId = tabIdRef.current;
    if (tabId === null || selectedFonts.length === 0) return;

    const target: ApplyTarget = wholePage
      ? { mode: 'page' }
      : {
          mode: 'groups',
          groups: groups
            .filter((group) => selectedGroupIds.has(group.id))
            .map((group) => ({ id: group.id, rawFamilies: group.rawFamilies })),
        };

    if (target.mode === 'groups' && target.groups.length === 0) {
      setError(ERROR_MESSAGES.NO_TARGET_SELECTED);
      return;
    }

    busyRef.current = true;
    setBusy('apply');
    setError(null);
    try {
      await applyFont(tabId, selectedFonts, target);
      setApplied(true);
      // 最近使用したフォントは、優先度の高い順に記録する
      let latest = recent;
      for (const font of [...selectedFonts].reverse()) {
        latest = await pushRecentFont(font.family);
      }
      setRecent(latest);
    } catch (caught) {
      setApplied(false);
      setError(formatErrorMessage(toExtensionError(caught, 'APPLY_FAILED')));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }, [groups, recent, selectedFonts, selectedGroupIds, wholePage]);

  const releaseNow = useCallback(async () => {
    if (busyRef.current) return;
    const tabId = tabIdRef.current;
    if (tabId === null) return;

    busyRef.current = true;
    setBusy('release');
    setError(null);
    try {
      await releaseFont(tabId);
      setApplied(false);
    } catch (caught) {
      setError(formatErrorMessage(toExtensionError(caught, 'RELEASE_FAILED')));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }, []);

  const rescan = useCallback(() => {
    const tabId = tabIdRef.current;
    if (tabId === null || busyRef.current) return;
    void runScan(tabId);
  }, [runScan]);

  const hasTarget = wholePage || selectedGroupIds.size > 0;
  const canApply =
    ready && fatalError === null && busy === null && selectedFonts.length > 0 && hasTarget && catalog.length > 0;

  const selectedFamilies = useMemo(
    () => new Set(selectedFonts.map((font) => font.family)),
    [selectedFonts],
  );

  if (fatalError !== null) {
    return (
      <div className={styles.app}>
        <Header applied={false} disabled onToggle={() => undefined} />
        <ErrorMessage message={fatalError} blocking />
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Header
        applied={applied}
        disabled={busy !== null || (!applied && !canApply)}
        onToggle={(next) => {
          void (next ? applyNow() : releaseNow());
        }}
      />

      {error !== null && (
        <ErrorMessage
          message={error}
          onDismiss={() => {
            setError(null);
          }}
        />
      )}

      {!ready ? (
        <p className={styles.loading} role="status">
          読み込み中…
        </p>
      ) : (
        <>
          {/* 検索はスクロール領域の外に置き、候補が下の内容へ重なるようにする */}
          <div className={styles.searchBar}>
            <FontSearch
              fonts={catalog}
              selectedFamilies={selectedFamilies}
              disabled={busy !== null || catalog.length === 0}
              onToggle={toggleFont}
            />
          </div>

          <div className={styles.scroll}>
            <SelectedFonts
              fonts={selectedFonts}
              disabled={busy !== null}
              onRemove={removeFont}
              onReorder={reorderFonts}
            />
            <RecentFonts
              families={recent}
              selectedFamilies={selectedFamilies}
              disabled={busy !== null || catalog.length === 0}
              onSelect={selectRecentFont}
            />
            <DetectedFontList
              groups={groups}
              wholePage={wholePage}
              selectedGroupIds={selectedGroupIds}
              scanning={busy === 'scan'}
              disabled={busy !== null}
              truncated={scan?.truncated ?? false}
              scannedElements={scan?.scannedElements ?? 0}
              onWholePageChange={handleWholePageChange}
              onGroupToggle={handleGroupToggle}
            />
          </div>

          <ActionBar
            busy={busy}
            applyDisabled={!canApply}
            releaseDisabled={busy !== null || !applied}
            rescanDisabled={busy !== null}
            onApply={() => {
              void applyNow();
            }}
            onRelease={() => {
              void releaseNow();
            }}
            onRescan={rescan}
          />
        </>
      )}
    </div>
  );
}
