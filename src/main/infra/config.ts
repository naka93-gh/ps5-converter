import { readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AppConfig } from "@shared/types";
import { BITRATE_RANGE, DEFAULT_CONFIG } from "@shared/types";
import { app } from "electron";

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
 * 保存された設定を復元する
 *
 * @returns 保存されていた設定、なければ初期値
 */
export async function loadConfig(): Promise<AppConfig> {
  try {
    // 壊れたJSONもここで弾いて初期値に倒す
    const text = await readFile(configPath(), "utf8");
    const saved = JSON.parse(text) as Partial<AppConfig>;

    // 保存時にあったディレクトリが現在もあるとは限らないのでチェック
    const [inputDir, outputDir] = await Promise.all([keepIfExists(saved.inputDir), keepIfExists(saved.outputDir)]);

    return {
      inputDir,
      outputDir,
      videoBitrateMbps: takeBitrate(saved.videoBitrateMbps, BITRATE_RANGE.video, DEFAULT_CONFIG.videoBitrateMbps),
      audioBitrateKbps: takeBitrate(saved.audioBitrateKbps, BITRATE_RANGE.audio, DEFAULT_CONFIG.audioBitrateKbps),

      // バイナリパスの存在チェックはしていない
      // TODO: 保存時に、バイナリがそこにあるかどうかは検査してもいいかもしれない
      ffmpegPath: saved.ffmpegPath ?? null,
      ffprobePath: saved.ffprobePath ?? null,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 設定を保存する
 *
 * @param config - 保存する設定
 */
export async function saveConfig(config: AppConfig): Promise<void> {
  await writeFile(configPath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

/**
 * 保存されたビットレートを取り込む
 *
 * @param value - 保存されていた値
 * @param range - 許す範囲
 * @param fallback - 使えないときに返す値
 * @returns 取り込んだ値
 */
function takeBitrate(value: number | undefined, range: { min: number; max: number }, fallback: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback;
  return value >= range.min && value <= range.max ? value : fallback;
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
