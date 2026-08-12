import type { FileEntry, MediaFile, VerifyDetail } from "./entry";

/**
 * アプリ設定
 */
export interface AppConfig {
  /** 入力ディレクトリ */
  inputDir: string | null;
  /** 出力ディレクトリ */
  outputDir: string | null;
  /** 映像のビットレート(Mbps) */
  videoBitrateMbps: number;
  /** 音声のビットレート(kbps) */
  audioBitrateKbps: number;
  /** ffmpegの実行ファイル(指定されているときのみ設定) */
  ffmpegPath: string | null;
  /** ffprobeの実行ファイル(指定されているときのみ設定) */
  ffprobePath: string | null;
}

/**
 * アプリ設定の初期値
 */
export const DEFAULT_CONFIG: Readonly<AppConfig> = {
  inputDir: null,
  outputDir: null,
  videoBitrateMbps: 18,
  audioBitrateKbps: 256,
  ffmpegPath: null,
  ffprobePath: null,
};

/**
 * ビットレートの許可範囲
 */
export const BITRATE_RANGE = {
  // 映像ビットレート
  video: { min: 1, max: 100 },
  // 音声ビットレート
  audio: { min: 32, max: 512 },
} as const;

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
