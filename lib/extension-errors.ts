/**
 * ユーザー向けの日本語メッセージと、開発者向けの詳細を分離したエラー型。
 *
 * ポップアップには `message` だけを出し、原因は `console.error` へ出す。
 * エラーは握りつぶさず、必ずどちらかの経路で表面化させる。
 */

export const ERROR_MESSAGES = {
  UNSUPPORTED_PAGE: 'このページでは拡張機能を使用できません',
  SCAN_FAILED: 'ページの解析に失敗しました',
  FONT_LOAD_FAILED: 'Google Fontsの読み込みに失敗しました',
  FONT_NOT_FOUND: '対象フォントが見つかりません',
  NO_TARGET_SELECTED: '適用対象を選択してください',
  APPLY_FAILED: 'フォントの適用に失敗しました',
  RELEASE_FAILED: 'フォントの解除に失敗しました',
  CATALOG_LOAD_FAILED: 'フォント一覧の読み込みに失敗しました',
} as const;

export type ExtensionErrorCode = keyof typeof ERROR_MESSAGES;

export class ExtensionError extends Error {
  readonly code: ExtensionErrorCode;
  /** ユーザー向けの補足（対象ページの種類など）。 */
  readonly detail?: string;

  constructor(code: ExtensionErrorCode, options?: { cause?: unknown; detail?: string }) {
    super(ERROR_MESSAGES[code], options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ExtensionError';
    this.code = code;
    this.detail = options?.detail;
  }
}

/** 何が起きても必ず `ExtensionError` にして返す。原因は console へ残す。 */
export function toExtensionError(error: unknown, fallbackCode: ExtensionErrorCode): ExtensionError {
  if (error instanceof ExtensionError) {
    console.error(`[Mojikae] ${error.code}: ${error.message}`, error.cause ?? error);
    return error;
  }
  const wrapped = new ExtensionError(fallbackCode, { cause: error });
  console.error(`[Mojikae] ${fallbackCode}: ${wrapped.message}`, error);
  return wrapped;
}

/** ユーザーへ表示する 1 行のメッセージ。 */
export function formatErrorMessage(error: ExtensionError): string {
  return error.detail ? `${error.message}（${error.detail}）` : error.message;
}
