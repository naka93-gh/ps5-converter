import { type ErrorHandler, Injectable, signal } from "@angular/core";

/**
 * エラーハンドラー
 *
 * 内容が明確で拾って処理するもの以外はここで共通でハンドリングする
 */
@Injectable({ providedIn: "root" })
export class AppErrorHandler implements ErrorHandler {
  /**
   * 直近の例外メッセージ
   */
  readonly message = signal("");

  /**
   * 例外を受け取って画面へ回す
   *
   * @param error - 拾った例外
   */
  handleError(error: unknown): void {
    // 画面には1行しか出さないので、追跡できるようコンソールにも残す
    console.error(error);

    this.message.set(error instanceof Error ? error.message : String(error));
  }

  /**
   * 表示を消す
   */
  dismiss(): void {
    this.message.set("");
  }
}
