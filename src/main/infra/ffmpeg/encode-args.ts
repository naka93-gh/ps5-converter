import type { AppConfig } from "@shared/types";

/**
 * 引数の組み立てに使う設定
 */
export type EncodeBitrate = Pick<AppConfig, "videoBitrateMbps" | "audioBitrateKbps">;

/**
 * ffmpegへ渡す引数を組み立てる
 *
 * @param inputPath - 変換元のwebm
 * @param partPath - 書き出し先の.part
 * @param bitrate - 設定から読んだビットレート
 * @returns 引数の並び
 */
export function buildEncodeArgs(inputPath: string, partPath: string, bitrate: EncodeBitrate): string[] {
  return [
    "-nostdin",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    inputPath,

    // PS5は1088pxで記録するため本来の1080pを切り出す
    "-vf",
    "crop=1920:1080:0:0",

    // hvc1タグがないとQuickTimeが再生を拒否する
    "-c:v",
    "hevc_videotoolbox",
    "-profile:v",
    "main10",
    "-pix_fmt",
    "p010le",
    "-b:v",
    `${bitrate.videoBitrateMbps}M`,
    "-tag:v",
    "hvc1",

    // 指定しないとHDRメタデータが落ちてSDR扱いになる
    "-color_primaries",
    "bt2020",
    "-color_trc",
    "smpte2084",
    "-colorspace",
    "bt2020nc",
    "-color_range",
    "tv",

    "-c:a",
    "aac",
    "-b:a",
    `${bitrate.audioBitrateKbps}k`,
    "-movflags",
    "+faststart",

    "-progress",
    "pipe:1",

    // 出力名が.partだと形式を判別できないため明示する
    "-f",
    "mp4",
    "-y",
    partPath,
  ];
}
