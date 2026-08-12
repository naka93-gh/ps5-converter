import type { AppConfig, FileEntry } from "@shared/types";
import { IPC } from "@shared/types";
import { dialog, ipcMain, shell } from "electron";
import { loadConfig, saveConfig } from "../infra/config";
import { binaryPaths } from "../infra/ffmpeg/binary-paths";
import { cancel, convertOne } from "../service/convert";
import { scan } from "../service/scan";
import { verify } from "../service/verify";
import { windowManager } from "../window";

/**
 * rendererからのリクエストを各処理へ振り分ける
 */
export function registerIpc(): void {
  ipcMain.handle(IPC.checkBinaries, () => binaryPaths.check());
  ipcMain.handle(IPC.selectDir, async (_event, current: string | null) => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      defaultPath: current ?? undefined,
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
  ipcMain.handle(IPC.loadConfig, () => loadConfig());
  ipcMain.handle(IPC.saveConfig, (_event, config: AppConfig) => saveConfig(config));
  ipcMain.handle(IPC.scan, (_event, inputDir: string, outputDir: string) => scan(inputDir, outputDir));
  ipcMain.handle(IPC.cancel, () => cancel());
  ipcMain.handle(IPC.reveal, (_event, path: string) => shell.showItemInFolder(path));
  ipcMain.handle(IPC.verify, (_event, entry: FileEntry) => verify(entry));
  ipcMain.handle(IPC.convertOne, (_event, entry: FileEntry) =>
    convertOne(entry, (payload) => windowManager.current?.webContents.send(IPC.progress, payload)),
  );
}
