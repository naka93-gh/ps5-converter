import type { Api, AppConfig, FileEntry } from "@shared/types";
import { IPC } from "@shared/types";
import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";

/**
 * レンダラーへ公開するAPI定義
 */
const api: Api = {
  checkBinaries: () => ipcRenderer.invoke(IPC.checkBinaries),
  selectDir: (current: string | null) => ipcRenderer.invoke(IPC.selectDir, current),
  loadConfig: () => ipcRenderer.invoke(IPC.loadConfig),
  saveConfig: (config: AppConfig) => ipcRenderer.invoke(IPC.saveConfig, config),
  scan: (inputDir: string, outputDir: string) => ipcRenderer.invoke(IPC.scan, inputDir, outputDir),
  convertOne: (entry: FileEntry) => ipcRenderer.invoke(IPC.convertOne, entry),
  verify: (entry: FileEntry) => ipcRenderer.invoke(IPC.verify, entry),
  cancel: () => ipcRenderer.invoke(IPC.cancel),
  reveal: (path: string) => ipcRenderer.invoke(IPC.reveal, path),
  onProgress: (callback) => subscribe(IPC.progress, callback),
};

/**
 * mainから流れてくるイベントを購読する
 *
 * 解除にはonと同じ関数の参照が要るので、それを閉じ込めた解除関数を返す
 *
 * @param channel - 購読するチャンネル
 * @param callback - 受け取ったペイロードを渡す関数
 * @returns 購読を解除する関数
 */
function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  // レンダラーではevent自体を使わないので落としてから渡す
  const listener = (_event: IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.off(channel, listener);
  };
}

contextBridge.exposeInMainWorld("api", api);
