/**
 * 例外からメッセージだけを取り出す
 *
 * @param error - 例外
 * @returns 例外のメッセージ
 */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 実行時に例外を受けた場合に、例外メッセージを追加してスローし直すためのラップ処理
 *
 * ffmpegやNodeが返す原文が英語であり、このメッセージが画面まで到達してしまうため
 * 日本語を前に置くために処理を包んだ
 *
 * @param context - 何をしようとしたか
 * @param run - 失敗しうる処理
 * @returns 処理の戻り値
 */
export async function attempt<T>(context: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw new Error(`${context}: ${messageOf(error)}`);
  }
}
