import { join } from "node:path";
import { BrowserWindow } from "electron";

/**
 * アプリのウィンドウを管理するためのシングルトン
 */
export class WindowManager {
  /**
   * 唯一のウィンドウ
   * 閉じたあとも参照が残らないようnullへ戻す
   */
  private window: BrowserWindow | null = null;

  /**
   * 今開いているウィンドウ
   */
  get current(): BrowserWindow | null {
    return this.window;
  }

  /**
   * ウィンドウを作って中身を読み込む
   */
  create(): void {
    // 白い画面のちらつきを避けるため、描画が終わるまで隠しておく
    this.window = new BrowserWindow({
      width: 1000,
      height: 700,
      show: false,
      backgroundColor: "#0c0e1a",

      // タイトルバーを外してヘッダーを上端まで広げる
      titleBarStyle: "hiddenInset",
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        sandbox: false,
      },
    });
    this.window.on("ready-to-show", () => this.window?.show());

    // 閉じられたら参照破棄
    this.window.on("closed", () => {
      this.window = null;
    });

    // 開発時はViteのdevサーバをロードする
    // URLはelectron-viteが環境変数にセットするのでそちらを参照
    const rendererUrl = process.env.ELECTRON_RENDERER_URL;
    if (rendererUrl) {
      this.window.loadURL(rendererUrl);
    } else {
      this.window.loadFile(join(__dirname, "../renderer/index.html"));
    }
  }
}

/**
 * アプリ全体で使い回すインスタンス
 * ウィンドウを1枚に保つためここで1つだけ作る
 */
export const windowManager = new WindowManager();
