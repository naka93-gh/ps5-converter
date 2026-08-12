import type { FileEntry, ProgressPayload } from "@shared/types";
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
 * @returns 成功した場合はnull、失敗した場合は理由のテキスト
 */
// TODO: リターンの形式を変更する
export async function convertOne(
  entry: FileEntry,
  onProgress: (payload: ProgressPayload) => void,
): Promise<string | null> {
  try {
    // 変換途中で設定が変更された場合でも次の変換から反映できるように1件ごとにConfigを読み込む
    const config = await loadConfig();

    // どのファイルの進捗かをレンダラー側で必要とするので、パスを付与
    await encoder.encode(entry.input.path, entry.output.path, entry.input.info?.durationSec, config, (progress) =>
      onProgress({ inputPath: entry.input.path, progress }),
    );
    return null;
  } catch (error) {
    // IPC越しだとErrorが読めなくなるので、ここでテキストに変換
    return error instanceof Error ? error.message : String(error);
  }
}
