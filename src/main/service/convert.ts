import { messageOf } from "@shared/error";
import type { ConvertResult, FileEntry, ProgressPayload } from "@shared/types";
import { loadConfig } from "../infra/config";
import { encoder } from "../infra/ffmpeg/encoder";

/**
 * 実行中のffmpegプロセスを停止する
 */
export function cancel(): void {
  encoder.kill();
}

/**
 * webmを変換する
 *
 * @param entry - 変換するファイル
 * @param onProgress - 進捗を伝える関数
 * @returns 変換できたか、中断したか、失敗したか
 */
export async function convertOne(
  entry: FileEntry,
  onProgress: (payload: ProgressPayload) => void,
): Promise<ConvertResult> {
  try {
    // 変換途中で設定が変更された場合でも次の変換から反映できるように1件ごとにConfigを読み込む
    const config = await loadConfig();

    // どのファイルの進捗かをレンダラー側で必要とするので、パスを付与
    const result = await encoder.encode(
      entry.input.path,
      entry.output.path,
      entry.input.info?.durationSec,
      config,
      (progress) => onProgress({ inputPath: entry.input.path, progress }),
    );

    return result === "canceled" ? { status: "canceled" } : { status: "converted" };
  } catch (error) {
    // 1件こけてもキューは進めたいので、例外にせず結果として返す
    return { status: "failed", reason: `変換に失敗しました: ${messageOf(error)}` };
  }
}
