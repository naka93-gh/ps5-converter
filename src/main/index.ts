import { app, BrowserWindow } from "electron";
import { registerIpc } from "./ipc";
import { cancel } from "./service/convert";
import { windowManager } from "./window";

// IPCの登録を先に済ませてからウィンドウを開く
app.whenReady().then(() => {
  registerIpc();
  windowManager.create();
});

// macOSではドックのアイコンから復帰したときにウィンドウを作り直す
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) windowManager.create();
});

// macOS以外はウィンドウを閉じた時点でアプリごと終わらせる
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// 終了時に変換中のffmpegがあればキャンセルする
app.on("before-quit", () => cancel());
