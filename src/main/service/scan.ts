import { mkdir, readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { attempt } from "@shared/error";
import type { EntryStatus, FileEntry } from "@shared/types";
import { tryReadVideoInfo } from "../infra/ffmpeg/video-info";
import { sizeOf } from "../infra/fs";

/**
 * 入力ディレクトリのwebmを走査して、変換前に状態を確定させる
 *
 * @param inputDir - 走査するディレクトリ。直下のwebmだけを見る
 * @param outputDir - 出力先。なければ作る
 * @returns 名前順に並べたファイル一覧
 */
export async function scan(inputDir: string, outputDir: string): Promise<FileEntry[]> {
  await attempt("出力ディレクトリを作れません", () => mkdir(outputDir, { recursive: true }));

  // PS5の録画は日時が名前に入るため、名前順が撮影順になる
  const names = await attempt("入力ディレクトリを読めません", () => readdir(inputDir));
  const webmNames = names.filter((name) => extname(name).toLowerCase() === ".webm").sort();

  return Promise.all(webmNames.map((name) => buildEntry(inputDir, outputDir, name)));
}

/**
 * ファイル1件分の情報を組み立てる
 *
 * @param inputDir - 走査しているディレクトリ
 * @param outputDir - 出力先
 * @param fileName - 拡張子まで含むファイル名
 * @returns 状態まで確定させた1件分
 */
async function buildEntry(inputDir: string, outputDir: string, fileName: string): Promise<FileEntry> {
  const name = basename(fileName, extname(fileName));
  const inputPath = join(inputDir, fileName);
  const outputPath = join(outputDir, `${name}.mp4`);

  const info = await attempt(`${fileName}の情報を読めません`, () => stat(inputPath));
  const outputSizeBytes = await sizeOf(outputPath);
  const status = decideStatus(outputSizeBytes, info.size);

  // 0バイトのファイルはffprobeにかけても読めない
  const source = status.phase === "skipped" ? null : await tryReadVideoInfo(inputPath);

  return {
    name,
    input: { path: inputPath, sizeBytes: info.size, info: source },
    // 出力はまだ読んでいないので、パスと有無だけ埋める
    output: { path: outputPath, sizeBytes: outputSizeBytes, info: null },
    status,
  };
}

/**
 * 走査時点の段階を決める
 *
 * 変換済みは飛ばし、コピー途中のファイルは掴まない
 *
 * @param outputSizeBytes - 出力のサイズ。まだ無ければnull
 * @param sizeBytes - 元ファイルのサイズ
 * @returns skipped/unverified/waitingのいずれか
 */
function decideStatus(outputSizeBytes: number | null, sizeBytes: number): EntryStatus {
  if (sizeBytes === 0) return { phase: "skipped", reason: "0バイト（コピー中の可能性）" };
  if (outputSizeBytes !== null) return { phase: "unverified" };
  return { phase: "waiting" };
}
