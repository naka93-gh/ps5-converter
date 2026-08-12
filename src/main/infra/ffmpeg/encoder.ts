import { type ChildProcess, spawn } from "node:child_process";
import { rename, rm } from "node:fs/promises";
import { binaryPaths } from "./binary-paths";
import { buildEncodeArgs } from "./encode-args";

/**
 * stderrから残す長さ
 * 失敗の理由に使うのは末尾だけなので、それ以上は捨てる
 */
const STDERR_TAIL_LENGTH = 2_000;

/**
 * ffmpegを実行してwebmをmp4にするためのシングルトン
 *
 * VideoToolboxのハードウェアエンコーダがボトルネックなので、現状同時に走らせるのは1本だけ
 */
// TODO: 並列実行できるよう準備はしておきたい
export class Encoder {
  /**
   * 実行中のffmpegプロセス
   */
  private currentChild: ChildProcess | null = null;

  /**
   * 実行中のffmpegプロセスを止める
   */
  kill(): void {
    this.currentChild?.kill("SIGKILL");
  }

  /**
   * webmを1本だけ変換する
   *
   * 書き出しは.partで行い、成功したときだけ本来の名前へ移す
   *
   * @param inputPath - 変換元のwebm
   * @param outputPath - 書き出し先のmp4
   * @param durationSec - 元ファイルの尺。渡したときだけ進捗を通知する
   * @param onProgress - 進捗を0〜1で受け取る関数
   */
  async encode(
    inputPath: string,
    outputPath: string,
    durationSec: number | undefined,
    onProgress: (progress: number) => void,
  ): Promise<void> {
    const ffmpeg = binaryPaths.get("ffmpeg");
    const partPath = `${outputPath}.part`;

    const child = spawn(ffmpeg, buildEncodeArgs(inputPath, partPath), { stdio: ["ignore", "pipe", "pipe"] });
    this.currentChild = child;

    // 失敗した理由を出すのに使う
    let stderrTail = "";
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      stderrTail = (stderrTail + chunk).slice(-STDERR_TAIL_LENGTH);
    });

    // 尺が取れていないと割合を出せないので進捗は諦める
    if (durationSec) {
      this.readProgress(child, durationSec, onProgress);
    }

    const code = await new Promise<number | null>((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (exitCode) => resolve(exitCode));
    });
    this.currentChild = null;

    // 中途半端な.partを残すと次回のスキャンが誤判定する
    if (code !== 0) {
      await rm(partPath, { force: true });
      throw new Error(lastMeaningfulLine(stderrTail) || `ffmpegが終了コード${code}で終わりました`);
    }

    await rename(partPath, outputPath);
    onProgress(1);
  }

  /**
   * 進捗の通知を始める
   *
   * -progress pipe:1 が流すout_time_usを尺で割って割合にする
   *
   * @param child - 実行中のffmpegプロセス
   * @param durationSec - 元ファイルの尺
   * @param onProgress - 進捗を0〜1で受け取る関数
   */
  private readProgress(child: ChildProcess, durationSec: number, onProgress: (progress: number) => void): void {
    let buffer = "";

    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      // 行の途中で切れることがあるので、最後の断片は次のchunkへ持ち越す
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      // 進捗以外の行も流れてくるため、out_time_usだけを拾う
      for (const line of lines) {
        const matched = /^out_time_us=(\d+)$/.exec(line.trim());
        if (!matched) continue;
        onProgress(Math.min(Number(matched[1]) / 1_000_000 / durationSec, 1));
      }
    });
  }
}

/**
 * 失敗の理由に使う一行を選ぶ
 *
 * Opusのヘッダ警告は全ファイルで出るが音声に影響しないため理由から外す
 *
 * @param text - stderrの末尾
 * @returns 理由に使える最後の行、無ければ空文字
 */
function lastMeaningfulLine(text: string): string {
  return (
    text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.includes("Opus packet header"))
      .pop() ?? ""
  );
}

/**
 * アプリ全体で使い回すインスタンス
 * ffmpegプロセスを1本に保つためここで1つだけ作る
 */
export const encoder = new Encoder();
