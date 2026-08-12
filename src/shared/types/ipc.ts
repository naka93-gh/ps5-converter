import type { FileEntry, MediaFile, VerifyDetail } from "./entry";

/**
 * 次回の起動へ持ち越す設定
 */
export interface AppConfig {
  inputDir: string | null;
  outputDir: string | null;
}

/**
 * ffmpeg/ffprobeのステータス
 *
 * 見つかればパス、見つからなければnull
 */
export interface BinaryStatus {
  ffmpeg: string | null;
  ffprobe: string | null;
}

/**
 * 変換中にmainから流れてくる進捗
 *
 * どの行を更新するかを決めるためパスを添える
 */
export interface ProgressPayload {
  inputPath: string;
  progress: number;
}

/**
 * 検証1件分の返り値
 *
 * 検証で出力を読み直すので、そこで分かった出力の姿も併せて返す
 */
export interface VerifyResult {
  detail: VerifyDetail;
  output: MediaFile;
}

/**
 * mainとやり取りするチャンネル名
 */
export const IPC = {
  checkBinaries: "check-binaries",
  selectDir: "select-dir",
  loadConfig: "load-config",
  saveConfig: "save-config",
  scan: "scan",
  convertOne: "convert-one",
  verify: "verify",
  cancel: "cancel",
  reveal: "reveal",
  progress: "progress",
} as const;

/**
 * preloadがrendererへ公開するAPI
 *
 * 押し出されてくるのは進捗だけで、ほかは呼び出しの戻り値で受け取る
 */
export interface Api {
  checkBinaries(): Promise<BinaryStatus>;
  selectDir(current: string | null): Promise<string | null>;
  loadConfig(): Promise<AppConfig>;
  saveConfig(config: AppConfig): Promise<void>;
  scan(inputDir: string, outputDir: string): Promise<FileEntry[]>;
  /** 失敗した理由を返す。成功したときはnull */
  convertOne(entry: FileEntry): Promise<string | null>;
  verify(entry: FileEntry): Promise<VerifyResult>;
  cancel(): Promise<void>;
  reveal(path: string): Promise<void>;
  /** 戻り値は購読を解除する関数 */
  onProgress(callback: (payload: ProgressPayload) => void): () => void;
}
