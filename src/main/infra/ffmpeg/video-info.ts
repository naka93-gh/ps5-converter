import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { VideoInfo } from "@shared/types";
import { binaryPaths } from "./binary-paths";

/**
 * ffprobeの実行
 * 出力を待つだけなのでspawnではなくexecFileを使う
 */
const execFileAsync = promisify(execFile);

/**
 * ffprobeが返すJSON
 * 欠けている項目があるので全て省略可能として扱う
 */
interface FfprobeJson {
  format?: { duration?: string };
  streams?: { width?: number; height?: number; color_transfer?: string; codec_name?: string }[];
}

/**
 * 尺・解像度・HDRタグをまとめて取る
 *
 * @param filePath - 調べる動画ファイル
 * @returns ffprobeから取れた情報、項目が欠けていれば0か空文字
 */
export async function readVideoInfo(filePath: string): Promise<VideoInfo> {
  const ffprobe = binaryPaths.get("ffprobe");

  // 映像の先頭ストリームだけ見れば良い
  const args = [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "format=duration:stream=width,height,color_transfer,codec_name",
    "-of",
    "json",
    filePath,
  ];

  const { stdout } = await execFileAsync(ffprobe, args, { maxBuffer: 1024 * 1024 });
  const json = JSON.parse(stdout) as FfprobeJson;
  const stream = json.streams?.[0];

  // 欠けていても呼び出し側で分岐せずに済むよう既定値へ倒す
  return {
    durationSec: Number(json.format?.duration ?? 0),
    width: stream?.width ?? 0,
    height: stream?.height ?? 0,
    colorTransfer: stream?.color_transfer ?? "",
    codecName: stream?.codec_name ?? "",
  };
}

/**
 * 読めないファイルで走査を止めないための版
 *
 * @param filePath - 調べる動画ファイル
 * @returns 取れた情報、読めないか尺が0のときはnull
 */
export async function tryReadVideoInfo(filePath: string): Promise<VideoInfo | null> {
  try {
    // 尺が0のものは壊れているとみなす
    const result = await readVideoInfo(filePath);
    return result.durationSec > 0 ? result : null;
  } catch {
    return null;
  }
}
