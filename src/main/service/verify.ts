import { stat } from "node:fs/promises";
import type { FileEntry, VerifyCheck, VerifyResult, VideoInfo } from "@shared/types";
import { readVideoInfo } from "../infra/ffmpeg/video-info";

/**
 * 尺のずれをどこまで許すかの値
 */
const DURATION_TOLERANCE_SEC = 0.5;

/**
 * 出力に期待する横幅
 * PS5の1088px記録から切り出した後の値
 */
const EXPECTED_WIDTH = 1920;

/**
 * 出力に期待する縦幅
 */
const EXPECTED_HEIGHT = 1080;

/**
 * 出力に期待するHDRの転送特性
 * これが落ちているとSDR扱いで再生される
 */
const EXPECTED_TRANSFER = "smpte2084";

/**
 * 出力を元ファイルと突き合わせ、検証結果と出力の姿を返す
 *
 * @param entry - 検証するファイル
 * @returns 項目ごとの結果と、読み直した出力
 */
export async function verify(entry: FileEntry): Promise<VerifyResult> {
  const sizeBytes = await sizeOf(entry.output.path);

  try {
    // 走査時に取れていれば使い回し、無ければ元ファイルを読み直す
    const source = entry.input.info ?? (await readVideoInfo(entry.input.path));
    const info = await readVideoInfo(entry.output.path);

    const checks = buildChecks(source, info);

    return {
      detail: { ok: checks.every((check) => check.ok), checks },
      output: { path: entry.output.path, sizeBytes, info },
    };
  } catch (error) {
    // IPC越しだとErrorが読めなくなるので、ここでテキストに変換
    const message = error instanceof Error ? error.message : String(error);

    return {
      detail: { ok: false, checks: [{ label: "確認", ok: false, detail: message, reason: message }] },
      output: { path: entry.output.path, sizeBytes, info: null },
    };
  }
}

/**
 * 出力が条件を満たしているかを項目ごとに調べる
 *
 * @param source - 元ファイルの情報
 * @param output - 出力の情報
 * @returns 解像度・HDRタグ・尺の結果
 */
function buildChecks(source: VideoInfo, output: VideoInfo): VerifyCheck[] {
  const gap = Math.abs(source.durationSec - output.durationSec);

  return [
    {
      label: "解像度",
      ok: output.width === EXPECTED_WIDTH && output.height === EXPECTED_HEIGHT,
      detail: `${output.width}x${output.height}`,
      reason: `解像度が${output.width}x${output.height}`,
    },
    {
      label: "HDRタグ",
      ok: output.colorTransfer === EXPECTED_TRANSFER,
      detail: output.colorTransfer || "なし",
      reason: output.colorTransfer ? `HDRタグが${output.colorTransfer}` : "HDRタグがない",
    },
    {
      label: "尺",
      ok: gap < DURATION_TOLERANCE_SEC,
      detail: `差 ${gap.toFixed(1)}秒（許容 ${DURATION_TOLERANCE_SEC}秒）`,
      reason: `尺が${gap.toFixed(1)}秒ずれている`,
    },
  ];
}

/**
 * ファイルのサイズを調べる
 *
 * @param path - 調べるファイル
 * @returns バイト数、ファイルが無ければnull
 */
async function sizeOf(path: string): Promise<number | null> {
  try {
    const info = await stat(path);
    return info.size;
  } catch {
    return null;
  }
}
