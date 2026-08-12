import { messageOf } from "@shared/error";
import type { Api, AppConfig, FileEntry } from "@shared/types";
import { IPC } from "@shared/types";
import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";

/**
 * Electronがinvokeの失敗に付ける前置き
 *
 * rendererが付ける`Error invoking remote method '<channel>': `に続けて、
 * mainがerror.toString()で作る`Error: `が入る
 */
const INVOKE_PREFIX = /^Error invoking remote method '[^']*': (?:[A-Za-z]*Error: )?/;

/**
 * レンダラーへ公開するAPI定義
 */
const api: Api = {
  checkBinaries: () => invoke(IPC.checkBinaries),
  selectDir: (current: string | null) => invoke(IPC.selectDir, current),
  loadConfig: () => invoke(IPC.loadConfig),
  saveConfig: (config: AppConfig) => invoke(IPC.saveConfig, config),
  scan: (inputDir: string, outputDir: string) => invoke(IPC.scan, inputDir, outputDir),
  convertOne: (entry: FileEntry) => invoke(IPC.convertOne, entry),
  verify: (entry: FileEntry) => invoke(IPC.verify, entry),
  cancel: () => invoke(IPC.cancel),
  reveal: (path: string) => invoke(IPC.reveal, path),
  onProgress: (callback) => subscribe(IPC.progress, callback),
};

/**
 * mainを呼び出し、失敗したら例外をスローする
 *
 * IPC越しでは例外の型もstackも落ちてメッセージしか残らないため、
 * Electronが付与するものを外してそのまま画面に出せる文にしてから渡す
 *
 * @param channel - 呼び出すチャンネル
 * @param args - mainへ渡す引数
 * @returns mainが返した値
 */
async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    throw new Error(messageOf(error).replace(INVOKE_PREFIX, ""));
  }
}

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
