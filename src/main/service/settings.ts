import { attempt } from "@shared/error";
import type { AppConfig, BinaryStatus } from "@shared/types";
import { loadConfig, saveConfig } from "../infra/config";
import { binaryPaths } from "../infra/ffmpeg/binary-paths";

/**
 * 設定を読む
 *
 * @returns 保存されていた設定
 */
export async function readSettings(): Promise<AppConfig> {
  const config = await loadConfig();
  applyBinaryPaths(config);

  return config;
}

/**
 * 設定を保存する
 *
 * @param config - 保存する設定
 */
export async function writeSettings(config: AppConfig): Promise<void> {
  await attempt("設定を保存できません", () => saveConfig(config));
  applyBinaryPaths(config);
}

/**
 * ffmpegとffprobeの有無を調べる
 *
 * @returns 見つかればパス、見つからなければnull
 */
export async function checkBinaries(): Promise<BinaryStatus> {
  await readSettings();

  return binaryPaths.check();
}

/**
 * 設定で指定されたパスを探索より優先させる
 *
 * @param config - 反映する設定
 */
function applyBinaryPaths(config: AppConfig): void {
  binaryPaths.setOverrides({ ffmpeg: config.ffmpegPath, ffprobe: config.ffprobePath });
}
