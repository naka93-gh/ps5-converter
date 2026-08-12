import { readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AppConfig } from "@shared/types";
import { app } from "electron";

/**
 * 未選択の設定
 * 設定ファイルが無いときと読めないときの両方で返す
 */
const EMPTY: AppConfig = { inputDir: null, outputDir: null };

/**
 * 設定ファイルの置き場所
 *
 * userDataはOSごとに違うためElectronに解決させる
 *
 * @returns config.jsonの絶対パス
 */
function configPath(): string {
  return join(app.getPath("userData"), "config.json");
}

/**
 * 前回のディレクトリを復元する。消えていれば未選択として扱う
 *
 * @returns 保存されていた設定、なければ未設定
 */
export async function loadConfig(): Promise<AppConfig> {
  try {
    // 壊れたJSONもここで弾いて未選択に倒す
    const text = await readFile(configPath(), "utf8");
    const saved = JSON.parse(text) as Partial<AppConfig>;

    // 保存時にあったディレクトリが現在もあるとは限らないのでチェック
    const [inputDir, outputDir] = await Promise.all([keepIfExists(saved.inputDir), keepIfExists(saved.outputDir)]);
    return { inputDir, outputDir };
  } catch {
    return EMPTY;
  }
}

/**
 * 選んだディレクトリを保存する
 *
 * @param config - 保存する設定
 */
export async function saveConfig(config: AppConfig): Promise<void> {
  await writeFile(configPath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

/**
 * ディレクトリが今もあるときだけそのパスを返す
 *
 * @param dir - 対象ディレクトリ
 * @returns あればパス、なければnull
 */
async function keepIfExists(dir: string | null | undefined): Promise<string | null> {
  if (!dir) return null;

  try {
    const info = await stat(dir);
    return info.isDirectory() ? dir : null;
  } catch {
    return null;
  }
}
